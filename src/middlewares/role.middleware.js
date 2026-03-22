import { prisma } from "../config/db.js";

export const authorizeWorkspaceRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Assuming you have the workspace ID in the request parameters
      const workspaceId = req.params.workspaceId || req.body.workspaceId;
      if (!workspaceId) {
        return res.status(400).json({ message: "Workspace ID is required" });
      }
      //Find the users membership in the workspace
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          userId: req.user.id,
          workspaceId: workspaceId,
        },
      });
      if (!membership) {
        return res
          .status(403)
          .json({ message: "You are not a member of this workspace" });
      }
      // Check if the user's role is in the allowed roles
      if (!allowedRoles.includes(membership.role)) {
        return res.status(403).json({
          success: false,
          error: `User role ${membership.role} is not authorized to perform this action`,
        });
      }
      //Attach the membership to the request object for further use in the route handler
      req.membership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
};
