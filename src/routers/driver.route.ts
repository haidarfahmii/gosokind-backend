import { Router } from "express";
import { driverController } from "../controllers/driver.controller";
import { verifyToken } from "../middlewares/verify.token.middleware";
import { verifyRole } from "../middlewares/verify.role.middleware";
import { JWT_SECRET } from "../config/index.config";
import { EmployeeRole } from "@prisma/client";

const router = Router();

// Semua route driver HARUS terproteksi dan hanya untuk role DRIVER
router.use(verifyToken(JWT_SECRET!));
router.use(verifyRole([EmployeeRole.DRIVER]));

/**
 * GET /api/driver/active
 * Cek job aktif driver saat ini (pickup/delivery sedang berjalan)
 */
router.get("/active", driverController.getActiveJob);

/**
 * GET /api/driver/available
 * Lihat semua order yang tersedia untuk diambil (WAITING_FOR_PICKUP & READY_FOR_DELIVERY)
 */
router.get("/available", driverController.getAvailableJobs);

/**
 * GET /api/driver/availability
 * Cek apakah driver sedang idle atau sedang bertugas
 */
router.get("/availability", driverController.checkAvailability);

/**
 * POST /api/driver/pickup/accept
 * Driver menerima order pickup
 * Body: { orderId: string }
 */
router.post("/pickup/accept", driverController.acceptPickup);

/**
 * POST /api/driver/pickup/complete
 * Driver menyelesaikan pickup (tiba di outlet)
 * Body: { orderId: string }
 */
router.post("/pickup/complete", driverController.completePickup);

/**
 * POST /api/driver/delivery/accept
 * Driver menerima order delivery
 * Body: { orderId: string }
 */
router.post("/delivery/accept", driverController.acceptDelivery);

/**
 * POST /api/driver/delivery/complete
 * Driver menyelesaikan delivery (barang diterima customer)
 * Body: { orderId: string }
 */
router.post("/delivery/complete", driverController.completeDelivery);

export default router;
