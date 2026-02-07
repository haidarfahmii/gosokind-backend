import { body, query, param } from "express-validator";

export const createEmployeeValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .isString()
    .withMessage("Full name must be a string")
    .isLength({ min: 3 })
    .withMessage("Full name must be at least 3 characters"),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn([
      "SUPER_ADMIN",
      "OUTLET_ADMIN",
      "WORKER_WASHING",
      "WORKER_IRONING",
      "WORKER_PACKING",
      "DRIVER",
    ])
    .withMessage("Invalid role"),
  body("outletId")
    .optional()
    .isString()
    .withMessage("Outlet ID must be a string"),
  body("isActive").optional().isBoolean(),
];

export const updateEmployeeValidator = [
  param("id").notEmpty().withMessage("Employee ID is required"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("fullName")
    .optional()
    .isString()
    .withMessage("Full name must be a string")
    .isLength({ min: 3 })
    .withMessage("Full name must be at least 3 characters"),
  body("role")
    .optional()
    .isIn([
      "SUPER_ADMIN",
      "OUTLET_ADMIN",
      "WORKER_WASHING",
      "WORKER_IRONING",
      "WORKER_PACKING",
      "DRIVER",
    ])
    .withMessage("Invalid role"),
  body("outletId")
    .optional()
    .custom((value) => {
      // Allow null or string
      if (value !== null && typeof value !== "string") {
        throw new Error("Outlet ID must be a string or null");
      }
      return true;
    }),
  body("isActive").optional().isBoolean(),
];

export const getEmployeeByIdValidator = [
  param("id").notEmpty().withMessage("Employee ID is required"),
];

export const deleteEmployeeValidator = [
  param("id").notEmpty().withMessage("Employee ID is required"),
];

export const getAllEmployeesValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("role")
    .optional()
    .isIn([
      "SUPER_ADMIN",
      "OUTLET_ADMIN",
      "WORKER_WASHING",
      "WORKER_IRONING",
      "WORKER_PACKING",
      "DRIVER",
    ])
    .withMessage("Invalid role"),
  query("outletId")
    .optional()
    .isString()
    .withMessage("Outlet ID must be a string"),
  query("search").optional().isString().withMessage("Search must be a string"),
];

export const getAllCustomersValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("search").optional().isString().withMessage("Search must be a string"),
  query("isActive").optional().isBoolean(),
];

export const toggleStatusValidator = [
  param("id").notEmpty().withMessage("Employee ID is required"),
  body("isActive").isBoolean().withMessage("isActive must be a boolean value"),
];
