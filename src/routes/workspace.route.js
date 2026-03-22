import express from "express";
import {
  createWorkspace,
  getUserWorkspaces,
  deleteWorkspace,
} from "../controllers/workspace.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorizeWorkspaceRole } from "../middlewares/role.middleware.js";

const router = express.Router();
//Apply the protect middleware to all routes in this router
router.use(protect);

router.route("/").post(createWorkspace).get(getUserWorkspaces);

router.route("/:workspaceId").delete(
  authorizeWorkspaceRole("OWNER", "ADMIN"), // Only allow users with the 'owner' role to delete the workspace
  deleteWorkspace,
);


export default router;