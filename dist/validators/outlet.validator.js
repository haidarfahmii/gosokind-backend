"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateShippingValidator = exports.getAllOutletsValidator = exports.getOutletByIdValidator = exports.deleteOutletValidator = exports.updateOutletValidator = exports.createOutletValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createOutletValidator = [
    (0, express_validator_1.body)("name")
        .notEmpty()
        .withMessage("Outlet name is required")
        .isString()
        .withMessage("Outlet name must be a string")
        .isLength({ min: 3, max: 100 })
        .withMessage("Outlet name must be between 3 and 100 characters"),
    (0, express_validator_1.body)("province")
        .optional()
        .isString()
        .withMessage("Province must be a string"),
    (0, express_validator_1.body)("city").optional().isString().withMessage("City must be a string"),
    (0, express_validator_1.body)("status")
        .optional()
        .isIn(["AVAILABLE", "MAINTENANCE"])
        .withMessage("Status must be either AVAILABLE or MAINTENANCE"),
    (0, express_validator_1.body)("address")
        .notEmpty()
        .withMessage("Address is required")
        .isString()
        .withMessage("Address must be a string")
        .isLength({ min: 10 })
        .withMessage("Address must be at least 10 characters"),
    (0, express_validator_1.body)("latitude")
        .notEmpty()
        .withMessage("Latitude is required. Please pick a location on the map.")
        .isFloat({ min: -90, max: 90 })
        .withMessage("Latitude must be between -90 and 90"),
    (0, express_validator_1.body)("longitude")
        .notEmpty()
        .withMessage("Longitude is required. Please pick a location on the map.")
        .isFloat({ min: -180, max: 180 })
        .withMessage("Longitude must be between -180 and 180"),
];
exports.updateOutletValidator = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage("Outlet ID is required")
        .isString()
        .withMessage("Outlet ID must be a string"),
    (0, express_validator_1.body)("name")
        .optional()
        .isString()
        .withMessage("Outlet name must be a string")
        .isLength({ min: 3, max: 100 })
        .withMessage("Outlet name must be between 3 and 100 characters"),
    (0, express_validator_1.body)("province")
        .optional()
        .isString()
        .withMessage("Province must be a string"),
    (0, express_validator_1.body)("city").optional().isString().withMessage("City must be a string"),
    (0, express_validator_1.body)("status")
        .optional()
        .isIn(["AVAILABLE", "MAINTENANCE"])
        .withMessage("Status must be either AVAILABLE or MAINTENANCE"),
    (0, express_validator_1.body)("address")
        .optional()
        .isString()
        .withMessage("Address must be a string")
        .isLength({ min: 10 })
        .withMessage("Address must be at least 10 characters"),
    (0, express_validator_1.body)("latitude")
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage("Latitude must be between -90 and 90"),
    (0, express_validator_1.body)("longitude")
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage("Longitude must be between -180 and 180"),
    // Validasi: koordinat harus lengkap (latitude & longitude)
    (0, express_validator_1.body)("latitude").custom((value, { req }) => {
        if (value && !req.body.longitude) {
            throw new Error("Longitude is required when latitude is provided");
        }
        return true;
    }),
    (0, express_validator_1.body)("longitude").custom((value, { req }) => {
        if (value && !req.body.latitude) {
            throw new Error("Latitude is required when longitude is provided");
        }
        return true;
    }),
];
exports.deleteOutletValidator = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage("Outlet ID is required")
        .isString()
        .withMessage("Outlet ID must be a string"),
];
exports.getOutletByIdValidator = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage("Outlet ID is required")
        .isString()
        .withMessage("Outlet ID must be a string"),
];
exports.getAllOutletsValidator = [
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),
    (0, express_validator_1.query)("search").optional().isString().withMessage("Search must be a string"),
];
exports.calculateShippingValidator = [
    (0, express_validator_1.param)("outletId")
        .notEmpty()
        .withMessage("Outlet ID is required")
        .isString()
        .withMessage("Outlet ID must be a string"),
    (0, express_validator_1.body)("latitude")
        .notEmpty()
        .withMessage("Latitude is required")
        .isFloat({ min: -90, max: 90 })
        .withMessage("Latitude must be between -90 and 90"),
    (0, express_validator_1.body)("longitude")
        .notEmpty()
        .withMessage("Longitude is required")
        .isFloat({ min: -180, max: 180 })
        .withMessage("Longitude must be between -180 and 180"),
];
