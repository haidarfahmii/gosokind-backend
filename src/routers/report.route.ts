import { Router } from "express";
import { reportController } from "../controllers/report.controller";
import {
  salesReportValidator,
  employeePerformanceValidator,
} from "../validators/report.validator";
import { expressValidator } from "../middlewares/express-validator.middleware";
import { verifyToken } from "../middlewares/verify.token.middleware";
import { verifyAdmin } from "../middlewares/verify.role.middleware";
import { verifyOutletScope } from "../middlewares/verify.outlet.scope.middleware";
import { JWT_SECRET } from "../config/index.config";

const router = Router();

// Global middleware stack (urutan penting)
// 1. verifyToken     → pastikan JWT valid & set res.locals.payload
// 2. verifyAdmin     → pastikan role SUPER_ADMIN atau OUTLET_ADMIN
// 3. verifyOutletScope → set res.locals.scopedOutletId & res.locals.isSuperAdmin
router.use(verifyToken(JWT_SECRET!));
router.use(verifyAdmin(false));
router.use(verifyOutletScope());

/**
 * GET /api/reports/sales
 *
 * Laporan pendapatan per periode (daily / monthly / yearly).
 *
 * Query params:
 *   - period    : "daily" | "monthly" | "yearly"  (wajib)
 *   - startDate : YYYY-MM-DD  (opsional)
 *   - endDate   : YYYY-MM-DD  (opsional)
 *   - outletId  : string      (opsional, Super Admin only)
 *
 * Contoh request:
 *   GET /api/reports/sales?period=daily&startDate=2025-01-01&endDate=2025-01-31
 *   GET /api/reports/sales?period=monthly&outletId=abc123
 *   GET /api/reports/sales?period=yearly
 */
router.get(
  "/sales",
  salesReportValidator,
  expressValidator,
  reportController.getSalesReport,
);

/**
 * GET /api/reports/employee-performance
 *
 * Laporan performa karyawan (worker station & driver pickup/delivery).
 *
 * Query params:
 *   - startDate : YYYY-MM-DD  (opsional)
 *   - endDate   : YYYY-MM-DD  (opsional)
 *   - outletId  : string      (opsional, Super Admin only)
 *   - role      : "WORKER_WASHING" | "WORKER_IRONING" | "WORKER_PACKING" | "DRIVER"  (opsional)
 *
 * Contoh request:
 *   GET /api/reports/employee-performance?startDate=2025-01-01&endDate=2025-01-31
 *   GET /api/reports/employee-performance?role=DRIVER&outletId=abc123
 *   GET /api/reports/employee-performance?role=WORKER_WASHING
 */
router.get(
  "/employee-performance",
  employeePerformanceValidator,
  expressValidator,
  reportController.getEmployeePerformanceReport,
);

export default router;
