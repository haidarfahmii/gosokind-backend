import { Router } from "express";
import { driverController } from "../controllers/driver.controller";
import { verifyToken } from "../middlewares/verify.token.middleware";
import { verifyRole } from "../middlewares/verify.role.middleware";
import { JWT_SECRET } from "../config/index.config";
import { EmployeeRole } from "@prisma/client";
import { actionLimiter } from "../middlewares/rate.limiter.middleware";

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
 * GET /api/driver/history
 * Cek job history driver (pickup/delivery yang sudah selesai)
 */
router.get("/history", driverController.getJobHistory);

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
router.post("/pickup/accept", actionLimiter, driverController.acceptPickup);

/**
 * POST /api/driver/pickup/complete
 * Driver menyelesaikan pickup (tiba di outlet)
 * Body: { orderId: string }
 */
router.post("/pickup/complete", actionLimiter, driverController.completePickup);

/**
 * POST /api/driver/delivery/accept
 * Driver menerima order delivery
 * Body: { orderId: string }
 */
router.post("/delivery/accept", actionLimiter, driverController.acceptDelivery);

/**
 * POST /api/driver/delivery/complete
 * Driver menyelesaikan delivery (barang diterima customer)
 * Body: { orderId: string }
 */
router.post("/delivery/complete", actionLimiter, driverController.completeDelivery);

export default router;
