import type { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

/**
 * Middleware that logs the request and response status
 */
const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const url = req.url;
    const userAgent = req.get("User-Agent") || "Unknown";
    if (status >= 400) {
      logger.warn(
        `⚠️ ${method} ${url} - ${status} - ${duration}ms - ${userAgent}`,
      );
    } else {
      logger.http(
        `🔗 ${method} ${url} - ${status} - ${duration}ms - ${userAgent}`,
      );
    }
  });
  next();
};

export default loggingMiddleware;
