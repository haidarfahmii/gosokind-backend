"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeePerformanceValidator = exports.salesReportValidator = void 0;
const express_validator_1 = require("express-validator");
// Shared helper validators
/**
 * Reusable validator untuk field ISO 8601 date (query string)
 */
const optionalISODate = (field) => (0, express_validator_1.query)(field)
    .optional()
    .isISO8601()
    .withMessage(`${field} must be a valid ISO 8601 date (e.g. 2025-01-31)`);
/**
 * Reusable validator untuk outletId query
 */
const optionalOutletId = () => (0, express_validator_1.query)("outletId")
    .optional()
    .isString()
    .notEmpty()
    .withMessage("outletId must be a non-empty string");
/**
 * Reusable cross-field validator: endDate harus >= startDate
 */
const endDateAfterStartDate = () => (0, express_validator_1.query)("endDate").custom((endDate, { req }) => {
    var _a;
    const startDate = (_a = req.query) === null || _a === void 0 ? void 0 : _a.startDate;
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        throw new Error("endDate must be greater than or equal to startDate");
    }
    return true;
});
// Sales Report Validator
exports.salesReportValidator = [
    // period wajib ada
    (0, express_validator_1.query)("period")
        .notEmpty()
        .withMessage("period is required")
        .isIn(["daily", "monthly", "yearly"])
        .withMessage("period must be one of: daily, monthly, yearly"),
    // startDate & endDate opsional, harus ISO 8601 jika ada
    optionalISODate("startDate"),
    optionalISODate("endDate"),
    // outletId opsional (Super Admin only — diabaikan di service jika Outlet Admin)
    optionalOutletId(),
    // endDate tidak boleh sebelum startDate
    endDateAfterStartDate(),
];
// Employee Performance Report Validator
exports.employeePerformanceValidator = [
    // startDate & endDate opsional
    optionalISODate("startDate"),
    optionalISODate("endDate"),
    // outletId opsional (Super Admin only)
    optionalOutletId(),
    // role opsional — langsung menggunakan Prisma EmployeeRole enum values
    // sehingga tidak perlu mapping tambahan di service
    (0, express_validator_1.query)("role")
        .optional()
        .isIn(["WORKER_WASHING", "WORKER_IRONING", "WORKER_PACKING", "DRIVER"])
        .withMessage("role must be one of: WORKER_WASHING, WORKER_IRONING, WORKER_PACKING, DRIVER"),
    // endDate tidak boleh sebelum startDate
    endDateAfterStartDate(),
];
