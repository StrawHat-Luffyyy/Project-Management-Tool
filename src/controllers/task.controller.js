import { prisma } from "../config/db.js";
import { redisClient } from "../config/redis.js";

// @desc    Create a new task (issue)
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res, next) => {
  try {
    const {
      projectId,
      title,
      description,
      status,
      priority,
      type,
      assigneeId,
      sprintId,
    } = req.body;
    if (!projectId || !title) {
      return res
        .status(400)
        .json({ success: false, error: "Project ID and Title are required" });
    }
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: "Project not found" });
    }
    const taskNumber = project._count.tasks + 1;
    const taskKey = `${project.key}-${taskNumber}`;

    const lastTaskInList = await prisma.task.findFirst({
      where: {
        projectId: projectId,
        status: status || "TODO",
      },
      orderBy: {
        listOrder: "desc",
      },
    });
    const newListOrder = lastTaskInList
      ? lastTaskInList.listOrder + 65536
      : 65536;
    const task = await prisma.task.create({
      data: {
        key: taskKey,
        title,
        description,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        type: type || "TASK",
        listOrder: newListOrder,
        projectId,
        sprintId,
        assigneeId,
        reporterId: req.user.id,
      },
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks with filtering, pagination, AND REDIS CACHING
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res, next) => {
  try {
    const { projectId, sprintId, status } = req.query;
    if (!projectId) {
      return res
        .status(400)
        .json({ success: false, error: "Project ID is required" });
    }
    // Define a unique cache key for this exact query
    const cacheKey = `tasks:project:${projectId}${sprintId ? `:sprint:${sprintId}` : ""}`;
    // Check Redis First
    const cachedTasks = await redisClient.get(cacheKey);
    if (cachedTasks) {
      console.log("Serving from Redis Cache for key:", cacheKey);
      return res.status(200).json(JSON.parse(cachedTasks));
    }
    console.log("Serving from PostgreSQL Database for projectId:", projectId);
    // If not in cache, hit the database
    const whereClause = { projectId };
    if (sprintId) whereClause.sprintId = sprintId;
    if (status !== undefined) whereClause.status = status;
    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { listOrder: "asc" },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    const responseData = {
      success: true,
      count: tasks.length,
      data: tasks,
    };
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));
    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task (Basic details, not listOrder yet)
// @route   PATCH /api/tasks/:taskId
// @access  Private
export const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    // Prevent updating protected fields directly here
    delete updates.id;
    delete updates.key;
    delete updates.projectId;
    delete updates.reporterId;
    delete updates.listOrder;
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        updates,
      },
    });
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder a task (Drag and Drop)
// @route   PATCH /api/tasks/:taskId/reorder
// @access  Private
export const reorderTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status, prevTaskId, nextTaskId } = req.body;
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }
    let newListOrder;
    // SCENARIO 1: Moved to the very top of a column
    if (!prevTaskId && nextTaskId) {
      const task = await prisma.task.findUnique({ where: { id: nextTaskId } });
      newListOrder = task.listOrder / 2;
    }
    // SCENARIO 2: Moved to the very bottom of a column
    else if (prevTaskId && !nextTaskId) {
      const task = await prisma.task.findUnique({ where: { id: prevTaskId } });
      newListOrder = task.listOrder + 65536;
    }
    // SCENARIO 3: Moved exactly between two tasks
    else if (prevTaskId && nextTaskId) {
      const prevTask = await prisma.task.findUnique({
        where: { id: prevTaskId },
      });
      const nextTask = await prisma.task.findUnique({
        where: { id: nextTaskId },
      });
      newListOrder = (prevTask.listOrder + nextTask.listOrder) / 2;
    }
    // SCENARIO 4: Moved to an empty column
    else {
      newListOrder = 65536;
    }
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: status || task.status,
        listOrder: newListOrder,
      },
    });
    // INVALIDATE CACHE: The board has changed, clear the Redis cache for this project
    const cacheKey = `tasks:project:${task.projectId}`;
    await redisClient.del(cacheKey);

    res.status(200).json({ success: true, data: updatedTask });
  } catch (error) {
    next(error);
  }
};
