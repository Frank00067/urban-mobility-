import { Router } from "express";
import tripsController from "../controllers/trips.controller";

const router = Router();

router.get("/", tripsController.listTrips);
router.get("/map", tripsController.mapData);
router.get("/stats", tripsController.stats);
router.get("/vendors", tripsController.vendors);

export default router;
