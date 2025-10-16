import { Request, Response } from "express";
import { z } from "zod";
import logger from "../utils/logger";
import ingressService from "../services/ingress.service";

const MulterFileSchema = z.object({
  fieldname: z.literal("tripData", {
    message: "Field name must be 'tripData'",
  }),
  originalname: z.string().min(1, "File name is required"),
  encoding: z.string(),
  mimetype: z.enum([
    "application/csv",
    "text/csv",
    "application/vnd.ms-excel",
    "application/x-csv",
    "text/x-csv",
  ]), // restrict allowed MIME types
  size: z
    .number()
    .positive()
    .max(200 * 1024 * 1024, "Max size is 200MB"),
  buffer: z.instanceof(Buffer), // the actual file data
});

const ingest = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      logger.warn("No file uploaded");
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Validate the uploaded file using Zod
    const parsedFile = MulterFileSchema.safeParse(req.file);
    if (!parsedFile.success) {
      logger.warn("Invalid file upload", { errors: parsedFile.error.issues });
      return res.status(400).json({
        success: false,
        message: "Invalid file upload",
        errors: parsedFile.error.issues,
      });
    }

    const file = parsedFile.data;

    const { data, error } = await ingressService.ingest(file);

    if (error) {
      logger.error("Error ingesting data:", error);
      return res.status(500).json({
        success: false,
        message: "Error ingesting data",
        error,
      });
    }

    logger.info("File uploaded successfully", {
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });

    return res.status(200).json({
      success: true,
      message: "File uploaded and validated successfully",
      data,
    });
  } catch (error) {
    logger.error("Error processing file upload", { error });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

export default { ingest };