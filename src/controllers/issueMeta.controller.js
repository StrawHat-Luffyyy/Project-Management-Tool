import { prisma } from "../config/db.js";
// ================= COMMENTS =================

// @desc    Add a comment to a task
// @route   POST /api/tasks/:taskId/comments
// @access  Private

export const addComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    if (!content) {
      return res
        .status(400)
        .json({ success: false, error: "Comment content is required" });
    }
    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId: req.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all comments for a task
// @route   GET /api/tasks/:taskId/comments
// @access  Private
export const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const comments = await prisma.comment.findMany({
      where: {
        taskId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
    res
      .status(200)
      .json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    next(error);
  }
};

// ================= ATTACHMENTS =================

// @desc    Upload an attachment to a task
// @route   POST /api/tasks/:taskId/attachments
// @access  Private
export const uploadAttchment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });
    }
    // public url for the frontend to access the file
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    const attachment = await prisma.attachment.create({
      data: {
        filename: req.file.originalname,
        fileUrl: fileUrl,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        taskId,
        uploaderId: req.user.id,
      },
    });
    res.status(201).json({ success: true, data: attachment });
  } catch (error) {
    next(error);
  }
};
