import { Router } from "express";
import upload from "../utils/multer";
import { MulterError } from "multer";
import logger from "../utils/logger";
import ingressController from "../controllers/ingress.controller";

const router = Router();

// Ingress endpoint
router.post(
  "/",
  (req, res, next) => {
    upload.single("tripData")(req, res, (err) => {
      if (err instanceof MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          logger.warn("File too large error");
          return res.status(400).json({
            success: false,
            message: `File too large, a file should not be greater than 200 MBs`,
            error: err,
          });
        }
      } else if (err) {
        logger.error("Internal server error in file upload", { error: err });
        return res.status(500).json({
          success: false,
          message: "Internal server error",
          error: err,
        });
      }
      next();
    });
  },
  ingressController.ingest,
);

export default router;