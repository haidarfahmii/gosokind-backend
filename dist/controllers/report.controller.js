"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportController = void 0;
const report_service_1 = require("../services/report.service");
exports.reportController = {
    /**
     * GET /api/reports/sales
     *
     * Query params:
     *   - period    : "daily" | "monthly" | "yearly"  (wajib)
     *   - startDate : YYYY-MM-DD  (opsional, default: awal bulan ini)
     *   - endDate   : YYYY-MM-DD  (opsional, default: hari ini)
     *   - outletId  : string      (opsional, Super Admin only)
     *
     * Auth:
     *   - Super Admin  → bisa lihat semua outlet, atau filter via ?outletId
     *   - Outlet Admin → otomatis hanya lihat outlet sendiri
     */
    getSalesReport(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                // Pastikan period tersedia (sudah divalidasi oleh salesReportValidator)
                const query = {
                    period: req.query.period,
                    startDate: req.query.startDate,
                    endDate: req.query.endDate,
                    outletId: req.query.outletId,
                };
                // Diisi oleh verifyOutletScope middleware
                const scopedOutletId = (_a = res.locals.scopedOutletId) !== null && _a !== void 0 ? _a : null;
                const isSuperAdmin = (_b = res.locals.isSuperAdmin) !== null && _b !== void 0 ? _b : false;
                const data = yield report_service_1.reportService.getSalesReport(query, scopedOutletId, isSuperAdmin);
                res.status(200).json({
                    success: true,
                    message: "Sales report retrieved successfully",
                    data,
                });
            }
            catch (error) {
                next(error);
            }
        });
    },
    /**
     * GET /api/reports/employee-performance
     *
     * Query params:
     *   - startDate : YYYY-MM-DD  (opsional, default: awal bulan ini)
     *   - endDate   : YYYY-MM-DD  (opsional, default: hari ini)
     *   - outletId  : string      (opsional, Super Admin only)
     *   - role      : "WORKER_WASHING" | "WORKER_IRONING" | "WORKER_PACKING" | "DRIVER"  (opsional)
     *
     * Auth:
     *   - Super Admin  → bisa lihat semua outlet, atau filter via ?outletId
     *   - Outlet Admin → otomatis hanya lihat outlet sendiri
     */
    getEmployeePerformanceReport(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const query = {
                    startDate: req.query.startDate,
                    endDate: req.query.endDate,
                    outletId: req.query.outletId,
                    role: req.query.role,
                };
                // Diisi oleh verifyOutletScope middleware
                const scopedOutletId = (_a = res.locals.scopedOutletId) !== null && _a !== void 0 ? _a : null;
                const isSuperAdmin = (_b = res.locals.isSuperAdmin) !== null && _b !== void 0 ? _b : false;
                const data = yield report_service_1.reportService.getEmployeePerformanceReport(query, scopedOutletId, isSuperAdmin);
                res.status(200).json({
                    success: true,
                    message: "Employee performance report retrieved successfully",
                    data,
                });
            }
            catch (error) {
                next(error);
            }
        });
    },
};
