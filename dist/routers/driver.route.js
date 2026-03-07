"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const driver_controller_1 = require("../controllers/driver.controller");
const verify_token_middleware_1 = require("../middlewares/verify.token.middleware");
const verify_role_middleware_1 = require("../middlewares/verify.role.middleware");
const index_config_1 = require("../config/index.config");
const client_1 = require("@prisma/client");
const rate_limiter_middleware_1 = require("../middlewares/rate.limiter.middleware");
const router = (0, express_1.Router)();
// Semua route driver HARUS terproteksi dan hanya untuk role DRIVER
router.use((0, verify_token_middleware_1.verifyToken)(index_config_1.JWT_SECRET));
router.use((0, verify_role_middleware_1.verifyRole)([client_1.EmployeeRole.DRIVER]));
/**
 * GET /api/driver/active
 * Cek job aktif driver saat ini (pickup/delivery sedang berjalan)
 */
router.get("/active", driver_controller_1.driverController.getActiveJob);
/**
 * GET /api/driver/history
 * Cek job history driver (pickup/delivery yang sudah selesai)
 */
router.get("/history", driver_controller_1.driverController.getJobHistory);
/**
 * GET /api/driver/available
 * Lihat semua order yang tersedia untuk diambil (WAITING_FOR_PICKUP & READY_FOR_DELIVERY)
 */
router.get("/available", driver_controller_1.driverController.getAvailableJobs);
/**
 * GET /api/driver/availability
 * Cek apakah driver sedang idle atau sedang bertugas
 */
router.get("/availability", driver_controller_1.driverController.checkAvailability);
/**
 * POST /api/driver/pickup/accept
 * Driver menerima order pickup
 * Body: { orderId: string }
 */
router.post("/pickup/accept", rate_limiter_middleware_1.actionLimiter, driver_controller_1.driverController.acceptPickup);
/**
 * POST /api/driver/pickup/complete
 * Driver menyelesaikan pickup (tiba di outlet)
 * Body: { orderId: string }
 */
router.post("/pickup/complete", rate_limiter_middleware_1.actionLimiter, driver_controller_1.driverController.completePickup);
/**
 * POST /api/driver/delivery/accept
 * Driver menerima order delivery
 * Body: { orderId: string }
 */
router.post("/delivery/accept", rate_limiter_middleware_1.actionLimiter, driver_controller_1.driverController.acceptDelivery);
/**
 * POST /api/driver/delivery/complete
 * Driver menyelesaikan delivery (barang diterima customer)
 * Body: { orderId: string }
 */
router.post("/delivery/complete", rate_limiter_middleware_1.actionLimiter, driver_controller_1.driverController.completeDelivery);
exports.default = router;
