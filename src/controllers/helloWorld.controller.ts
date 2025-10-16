import type { Request, Response } from "express";
import logger from "../utils/logger";
import { helloWorld } from "../services/helloWorld.service";

export const helloWorldController = (req: Request, res: Response) => {
  logger.info("Hello World Request Controller");
  const message = helloWorld();
  res.status(200).json({
    message: message,
  });
};
