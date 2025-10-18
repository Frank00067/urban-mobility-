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
