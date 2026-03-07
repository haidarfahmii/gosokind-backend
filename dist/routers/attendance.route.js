"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendance_controller_1 = require("../controllers/attendance.controller");
const verify_token_middleware_1 = require("../middlewares/verify.token.middleware");
const verify_role_middleware_1 = require("../middlewares/verify.role.middleware");
const verify_outlet_scope_middleware_1 = require("../middlewares/verify.outlet.scope.middleware");
const index_config_1 = require("../config/index.config");
const client_1 = require("@prisma/client");
const rate_limiter_middleware_1 = require("../middlewares/rate.limiter.middleware");
const router = (0, express_1.Router)();
// Semua route attendance memerlukan JWT
router.use((0, verify_token_middleware_1.verifyToken)(index_config_1.JWT_SECRET));
/**
 * POST /api/attendance/clock-in
 * Employee clock in (validasi geolokasi ke outlet)
 */
router.post("/clock-in", rate_limiter_middleware_1.actionLimiter, attendance_controller_1.attendanceController.clockIn);
/**
 * POST /api/attendance/clock-out
 * Employee clock out
 */
router.post("/clock-out", rate_limiter_middleware_1.actionLimiter, attendance_controller_1.attendanceController.clockOut);
/**
 * GET /api/attendance/dashboard
 * Lihat dashboard absensi hari ini + total hari kerja
 * - Employee: hanya data diri sendiri
 * - Admin/Super Admin: bisa query ?employeeId=xxx
 */
router.get("/dashboard", attendance_controller_1.attendanceController.getDashboard);
/**
 * GET /api/attendance/history
 * Lihat seluruh riwayat absensi diri sendiri (History Tab)
 * - Employee: hanya riwayat sendiri
 * - Admin/Super Admin: bisa query ?employeeId=xxx
 * Query: ?page=1&limit=10&date=2025-01-01
 */
router.get("/history", attendance_controller_1.attendanceController.getHistory);
/**
 * GET /api/attendance
 * Lihat semua attendance per outlet (hanya Admin)
 * Query: ?date=2025-01-01&page=1&limit=10
 */
router.get("/", (0, verify_role_middleware_1.verifyRole)([client_1.EmployeeRole.SUPER_ADMIN, client_1.EmployeeRole.OUTLET_ADMIN]), (0, verify_outlet_scope_middleware_1.verifyOutletScope)(), attendance_controller_1.attendanceController.getAllAttendance);
exports.default = router;
