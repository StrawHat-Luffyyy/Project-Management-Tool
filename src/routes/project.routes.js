import express from "express";
import {
  createProject,
  getWorkspaceProjects,
} from "../controllers/project.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorizeWorkspaceRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(protect);

// Require OWNER or ADMIN role to create a project
router.post("/", authorizeWorkspaceRole("OWNER", "ADMIN"), createProject);

// Any workspace member can view the projects
router.get(
  "/workspace/:workspaceId",
  authorizeWorkspaceRole("OWNER", "ADMIN", "MEMBER"),
  getWorkspaceProjects,
);

export default router;
