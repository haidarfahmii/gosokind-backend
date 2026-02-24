import { query } from "express-validator";

// Shared helper validators

/**
 * Reusable validator untuk field ISO 8601 date (query string)
 */
const optionalISODate = (field: string) =>
  query(field)
    .optional()
    .isISO8601()
    .withMessage(`${field} must be a valid ISO 8601 date (e.g. 2025-01-31)`);

/**
 * Reusable validator untuk outletId query
 */
const optionalOutletId = () =>
  query("outletId")
    .optional()
    .isString()
    .notEmpty()
    .withMessage("outletId must be a non-empty string");

/**
 * Reusable cross-field validator: endDate harus >= startDate
 */
const endDateAfterStartDate = () =>
  query("endDate").custom((endDate, { req }) => {
    const startDate = req.query?.startDate as string | undefined;
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      throw new Error("endDate must be greater than or equal to startDate");
    }
    return true;
  });

// Sales Report Validator

export const salesReportValidator = [
  // period wajib ada
  query("period")
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

export const employeePerformanceValidator = [
  // startDate & endDate opsional
  optionalISODate("startDate"),
  optionalISODate("endDate"),

  // outletId opsional (Super Admin only)
  optionalOutletId(),

  // role opsional — langsung menggunakan Prisma EmployeeRole enum values
  // sehingga tidak perlu mapping tambahan di service
  query("role")
    .optional()
    .isIn(["WORKER_WASHING", "WORKER_IRONING", "WORKER_PACKING", "DRIVER"])
    .withMessage(
      "role must be one of: WORKER_WASHING, WORKER_IRONING, WORKER_PACKING, DRIVER",
    ),

  // endDate tidak boleh sebelum startDate
  endDateAfterStartDate(),
];
