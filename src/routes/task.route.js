import express from "express";
import {
  createTask,
  getTasks,
  updateTask,
  reorderTask,
} from "../controllers/task.controller.js";
import {
  getComments,
  addComment,
 uploadAttachment,
} from "../controllers/issueMeta.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
const router = express.Router();

router.use(protect);

router.route("/").post(createTask).get(getTasks);

router.route("/:taskId").patch(updateTask);

router.patch("/:taskId/reorder", reorderTask);
router.route("/:taskId/comments").post(addComment).get(getComments);


router
  .route("/:taskId/attachments")
  .post(upload.single("file"), uploadAttachment);
export default router;
