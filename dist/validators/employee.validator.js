"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleStatusValidator = exports.getAllCustomersValidator = exports.getAllEmployeesValidator = exports.deleteEmployeeValidator = exports.getEmployeeByIdValidator = exports.updateEmployeeValidator = exports.createEmployeeValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createEmployeeValidator = [
    (0, express_validator_1.body)("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format"),
    (0, express_validator_1.body)("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
    (0, express_validator_1.body)("fullName")
        .notEmpty()
        .withMessage("Full name is required")
        .isString()
        .withMessage("Full name must be a string")
        .isLength({ min: 3 })
        .withMessage("Full name must be at least 3 characters"),
    (0, express_validator_1.body)("role")
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
    (0, express_validator_1.body)("outletId")
        .optional()
        .isString()
        .withMessage("Outlet ID must be a string"),
    (0, express_validator_1.body)("isActive").optional().isBoolean(),
];
exports.updateEmployeeValidator = [
    (0, express_validator_1.param)("id").notEmpty().withMessage("Employee ID is required"),
    (0, express_validator_1.body)("email").optional().isEmail().withMessage("Invalid email format"),
    (0, express_validator_1.body)("password")
        .optional()
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
    (0, express_validator_1.body)("fullName")
        .optional()
        .isString()
        .withMessage("Full name must be a string")
        .isLength({ min: 3 })
        .withMessage("Full name must be at least 3 characters"),
    (0, express_validator_1.body)("role")
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
    (0, express_validator_1.body)("outletId")
        .optional()
        .custom((value) => {
        // Allow null or string
        if (value !== null && typeof value !== "string") {
            throw new Error("Outlet ID must be a string or null");
        }
        return true;
    }),
    (0, express_validator_1.body)("isActive").optional().isBoolean(),
];
exports.getEmployeeByIdValidator = [
    (0, express_validator_1.param)("id").notEmpty().withMessage("Employee ID is required"),
];
exports.deleteEmployeeValidator = [
    (0, express_validator_1.param)("id").notEmpty().withMessage("Employee ID is required"),
];
exports.getAllEmployeesValidator = [
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),
    (0, express_validator_1.query)("role")
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
    (0, express_validator_1.query)("outletId")
        .optional()
        .isString()
        .withMessage("Outlet ID must be a string"),
    (0, express_validator_1.query)("search").optional().isString().withMessage("Search must be a string"),
];
exports.getAllCustomersValidator = [
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),
    (0, express_validator_1.query)("search").optional().isString().withMessage("Search must be a string"),
    (0, express_validator_1.query)("isActive").optional().isBoolean(),
];
exports.toggleStatusValidator = [
    (0, express_validator_1.param)("id").notEmpty().withMessage("Employee ID is required"),
    (0, express_validator_1.body)("isActive").isBoolean().withMessage("isActive must be a boolean value"),
];
