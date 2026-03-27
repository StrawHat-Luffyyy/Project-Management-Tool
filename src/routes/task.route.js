import express from "express";
import {
  createTask,
  getTasks,
  updateTask,
} from "../controllers/task.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.route("/").post(createTask).get(getTasks);

router.route("/:taskId").patch(updateTask);

export default router;
