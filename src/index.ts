import app from "./app";
import logger from "./utils/logger";
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}!`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`🔗 API Base URL: ${process.env.SITE_URL}/api/v1/`);
  logger.info(`📊 Health Check: ${process.env.SITE_URL}/health`);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
