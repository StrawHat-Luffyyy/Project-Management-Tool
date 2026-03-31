import { prisma } from "../config/db.js";

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

// @desc    Get tasks with filtering and pagination
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res, next) => {
  try {
    const {
      projectId,
      sprintId,
      assigneeId,
      status,
      page = 1,
      limit = 10,
    } = req.query;
    if (!projectId) {
      return res
        .status(400)
        .json({ success: false, error: "Project ID is required" });
    }
    const whereClause = {
      projectId: projectId,
    };
    if (sprintId) whereClause.sprintId = sprintId;
    if (assigneeId) whereClause.assigneeId = assigneeId;
    if (status !== undefined) whereClause.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where: whereClause,
        orderBy: {
          listOrder: "asc",
        },
        skip,
        take,
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          reporter: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.task.count({
        where: whereClause,
      }),
    ]);
    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      totalPages: Math.ceil(total / take),
      currentPage: parseInt(page),
      data: tasks,
    });
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
