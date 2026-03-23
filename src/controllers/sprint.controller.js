import { prisma } from "../config/db.js";

// @desc    Create a new sprint
// @route   POST /api/sprints
// @access  Private
export const createSprint = async (req, res, next) => {
  try {
    const { projectId, name, startDate, endDate } = req.body;
    if (!projectId || !name) {
      return res.status(400).json({
        success: false,
        error: "Project ID and name are required",
      });
    }
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }
    const sprint = await prisma.sprint.create({
      data: {
        projectId,
        name,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: "PLANNED",
      },
    });
    res.status(201).json({ success: true, data: sprint });
  } catch (error) {
    next(error);
  }
};

// @desc    Update sprint status (Start/Complete Sprint)
// @route   PATCH /api/sprints/:sprintId/status
// @access  Private
export const updateSprintStatus = async (req, res, next) => {
  try {
    const { sprintId } = req.params;
    const { status } = req.body;
    if (!["PLANNED", "ACTIVE", "COMPLETED"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid sprint status ",
      });
    }
    const sprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: { status },
    });
    res.status(200).json({ success: true, data: sprint });
  } catch (error) {
    next(error);
  }
};
