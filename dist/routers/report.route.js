"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const report_validator_1 = require("../validators/report.validator");
const express_validator_middleware_1 = require("../middlewares/express-validator.middleware");
const verify_token_middleware_1 = require("../middlewares/verify.token.middleware");
const verify_role_middleware_1 = require("../middlewares/verify.role.middleware");
const verify_outlet_scope_middleware_1 = require("../middlewares/verify.outlet.scope.middleware");
const index_config_1 = require("../config/index.config");
const router = (0, express_1.Router)();
// Global middleware stack (urutan penting)
// 1. verifyToken     → pastikan JWT valid & set res.locals.payload
// 2. verifyAdmin     → pastikan role SUPER_ADMIN atau OUTLET_ADMIN
// 3. verifyOutletScope → set res.locals.scopedOutletId & res.locals.isSuperAdmin
router.use((0, verify_token_middleware_1.verifyToken)(index_config_1.JWT_SECRET));
router.use((0, verify_role_middleware_1.verifyAdmin)(false));
router.use((0, verify_outlet_scope_middleware_1.verifyOutletScope)());
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
router.get("/sales", report_validator_1.salesReportValidator, express_validator_middleware_1.expressValidator, report_controller_1.reportController.getSalesReport);
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
router.get("/employee-performance", report_validator_1.employeePerformanceValidator, express_validator_middleware_1.expressValidator, report_controller_1.reportController.getEmployeePerformanceReport);
exports.default = router;
