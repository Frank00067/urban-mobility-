import { Request, Response } from "express";
import { z } from "zod";
import logger from "../utils/logger";
import tripsService, { Filters } from "../services/trips.service";

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(20),
});

const filterSchema = z.object({
  start_date: z.iso.datetime().optional(),
  end_date: z.iso.datetime().optional(),
  duration_min: z.coerce.number().nonnegative().optional(),
  duration_max: z.coerce.number().nonnegative().optional(),
  distance_min: z.coerce.number().nonnegative().optional(),
  distance_max: z.coerce.number().nonnegative().optional(),
  store_and_fwd_flag: z.enum(["Y", "N", "all"]).optional(),
  vendor_id: z.coerce.number().int().positive().optional(),
});

const listTrips = async (req: Request, res: Response) => {
  const parsedPagination = paginationSchema.safeParse(req.query);
  const parsedFilters = filterSchema.safeParse(req.query);

  if (!parsedPagination.success || !parsedFilters.success) {
    logger.warn("Invalid query params for listTrips", {
      paginationErrors: parsedPagination.success
        ? undefined
        : parsedPagination.error.issues,
      filterErrors: parsedFilters.success
        ? undefined
        : parsedFilters.error.issues,
    });
    return res.status(400).json({
      success: false,
      message: "Invalid query parameters",
      errors: {
        pagination: parsedPagination.success
          ? undefined
          : parsedPagination.error.issues,
        filters: parsedFilters.success ? undefined : parsedFilters.error.issues,
      },
    });
  }

  const { page, limit } = parsedPagination.data;
  const filters: Filters = parsedFilters.data as Filters;

  const { data, error } = await tripsService.listTrips({
    page,
    limit,
    filters,
  });
  if (error) {
    logger.error("Error fetching trips", { error });
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch trips", error });
  }

  return res
    .status(200)
    .json({ success: true, message: "Trips fetched", data });
};

const mapData = async (req: Request, res: Response) => {
  const parsedFilters = filterSchema.safeParse(req.query);
  if (!parsedFilters.success) {
    logger.warn("Invalid query params for mapData", {
      errors: parsedFilters.error.issues,
    });
    return res.status(400).json({
      success: false,
      message: "Invalid query parameters",
      errors: parsedFilters.error.issues,
    });
  }
  const { data, error } = await tripsService.mapData({
    filters: parsedFilters.data as Filters,
  });
  if (error) {
    logger.error("Error fetching map data", { error });
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch map data", error });
  }
  return res
    .status(200)
    .json({ success: true, message: "Map data fetched", data });
};

const stats = async (req: Request, res: Response) => {
  const parsedFilters = filterSchema.safeParse(req.query);
  if (!parsedFilters.success) {
    logger.warn("Invalid query params for stats", {
      errors: parsedFilters.error.issues,
    });
    return res.status(400).json({
      success: false,
      message: "Invalid query parameters",
      errors: parsedFilters.error.issues,
    });
  }
  const { data, error } = await tripsService.stats({
    filters: parsedFilters.data as Filters,
  });
  if (error) {
    logger.error("Error fetching stats", { error });
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch stats", error });
  }
  return res
    .status(200)
    .json({ success: true, message: "Stats fetched", data });
};

const vendors = async (_req: Request, res: Response) => {
  const { data, error } = await tripsService.vendors();
  if (error) {
    logger.error("Error fetching vendors", { error });
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch vendors", error });
  }
  return res
    .status(200)
    .json({ success: true, message: "Vendors fetched", data });
};

export default { listTrips, mapData, stats, vendors };
