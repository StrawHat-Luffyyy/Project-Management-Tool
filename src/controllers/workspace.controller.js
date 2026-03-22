import { prisma } from "../config/db.js";

// @desc    Create a new workspace
// @route   POST /api/workspaces
// @access  Private
export const createWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Workspace name is required" });
    }
    //Use a transaction to create the workspace and the membership atomically
    const result = await prisma.$transaction(async (prismaClient) => {
      const workspace = await prismaClient.workspace.create({
        data: {
          name,
          description,
        },
      });
      // Create the workspace membership for the creator with the role of 'owner'
      await prismaClient.workspaceMember.create({
        data: {
          userId: req.user.id,
          workspaceId: workspace.id,
          role: "OWNER",
        },
      });
      return workspace;
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
// @desc    Get all workspaces for the logged-in user
// @route   GET /api/workspaces
// @access  Private
export const getUserWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: req.user.id,
          },
        },
      },
      include: {
        members: {
          where: {
            userId: req.user.id,
          },
          select: {
            role: true, // Include the user's role in the workspace
          },
        },
      },
    });
    res
      .status(200)
      .json({ success: true, count: workspaces.length, data: workspaces });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a workspace (Requires OWNER or ADMIN role)
// @route   DELETE /api/workspaces/:workspaceId
// @access  Private/Role-Protected

export const deleteWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    // Check if the workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    // Delete the workspace (this will also cascade delete related memberships and projects if set up in the schema)
    await prisma.workspace.delete({
      where: { id: workspaceId },
    });
    res.status(200).json({ success: true, message: "Workspace deleted" });
  } catch (error) {
    next(error);
  }
};
