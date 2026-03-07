import { Router } from "express";
import { attendanceController } from "../controllers/attendance.controller";
import { verifyToken } from "../middlewares/verify.token.middleware";
import { verifyRole } from "../middlewares/verify.role.middleware";
import { verifyOutletScope } from "../middlewares/verify.outlet.scope.middleware";
import { JWT_SECRET } from "../config/index.config";
import { EmployeeRole } from "@prisma/client";
import { actionLimiter } from "../middlewares/rate.limiter.middleware";

const router = Router();

// Semua route attendance memerlukan JWT
router.use(verifyToken(JWT_SECRET!));

/**
 * POST /api/attendance/clock-in
 * Employee clock in (validasi geolokasi ke outlet)
 */
router.post("/clock-in", actionLimiter, attendanceController.clockIn);

/**
 * POST /api/attendance/clock-out
 * Employee clock out
 */
router.post("/clock-out", actionLimiter, attendanceController.clockOut);

/**
 * GET /api/attendance/dashboard
 * Lihat dashboard absensi hari ini + total hari kerja
 * - Employee: hanya data diri sendiri
 * - Admin/Super Admin: bisa query ?employeeId=xxx
 */
router.get("/dashboard", attendanceController.getDashboard);

/**
 * GET /api/attendance/history
 * Lihat seluruh riwayat absensi diri sendiri (History Tab)
 * - Employee: hanya riwayat sendiri
 * - Admin/Super Admin: bisa query ?employeeId=xxx
 * Query: ?page=1&limit=10&date=2025-01-01
 */
router.get("/history", attendanceController.getHistory);

/**
 * GET /api/attendance
 * Lihat semua attendance per outlet (hanya Admin)
 * Query: ?date=2025-01-01&page=1&limit=10
 */
router.get(
  "/",
  verifyRole([EmployeeRole.SUPER_ADMIN, EmployeeRole.OUTLET_ADMIN]),
  verifyOutletScope(),
  attendanceController.getAllAttendance,
);

export default router;
