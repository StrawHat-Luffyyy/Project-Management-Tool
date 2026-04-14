import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import  path  from "path";
import { fileURLToPath } from "url";
import { errorHandler } from "./middlewares/errorHandler.js";

//Import Routes
import authRoutes from "./routes/auth.routes.js";
import workspaceRoutes from "./routes/workspace.route.js";
import projectRoutes from "./routes/project.routes.js";
import sprintRoutes from "./routes/sprint.routes.js";
import taskRoutes from "./routes/task.route.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});
// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/sprints", sprintRoutes);
app.use("/api/tasks", taskRoutes);

// Error Handler
app.use(errorHandler);

export default app;
