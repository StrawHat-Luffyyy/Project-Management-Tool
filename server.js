import "dotenv/config";
import app from "./src/app.js";
import { connectRedis } from "./src/config/redis.js";
const PORT = process.env.PORT || 3000;
const startServer = async () => {
  try {
    await connectRedis();
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    process.on("unhandledRejection", (err) => {
      console.log(`Error: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
