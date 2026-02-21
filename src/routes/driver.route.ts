import { Router } from "express";
import * as driverController from "../controllers/driver.controller";
import { JWT_SECRET } from "../config/index.config";
import { verifyToken } from "../middlewares/verify.token.middleware";

const router = Router();

// Semua route driver HARUS terproteksi
router.use(verifyToken(JWT_SECRET!));

// Frontend Data Aggregators
router.get("/active", driverController.getActiveJob);
router.get("/available", driverController.getAvailableJobs);

router.get("/availability", driverController.checkAvailability);

// Pickup Flow
router.post("/pickup/accept", driverController.acceptPickup);
router.post("/pickup/complete", driverController.completePickup);

// Delivery Flow
router.post("/delivery/accept", driverController.acceptDelivery);
router.post("/delivery/complete", driverController.completeDelivery);

export default router;
