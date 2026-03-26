import { prisma } from "../config/db.js";

// @desc    Create a new project in a workspace
// @route   POST /api/projects
// @access  Private (Requires Workspace Role: ADMIN or OWNER)

export const createProject = async (req, res, next) => {
  try {
    const { name, description, workspaceId, key } = req.body;
    if (!name || !workspaceId || !key) {
      return res.status(400).json({
        success: false,
        error: "Workspace ID , name and key are required",
      });
    }
    // Ensure the key is uppercase and has no spaces
    const formattedKey = key.toUpperCase().replace(/\s+/g, "");
    const existingProject = await prisma.project.findUnique({
      where: {
        workspaceId_key: {
          workspaceId,
          key: formattedKey,
        },
      },
    });
    if (existingProject) {
      return res.status(400).json({
        success: false,
        error: "Project key already exists in this workspace",
      });
    }
    const project = await prisma.project.create({
      data: {
        workspaceId,
        name,
        key: formattedKey,
        description,
        leadId: req.user.id,
      },
    });
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects for a specific workspace
// @route   GET /api/projects/workspace/:workspaceId
// @access  Private (Requires Workspace Membership)
export const getWorkspaceProjects = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const projects = await prisma.project.findMany({
      where: { workspaceId },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};
