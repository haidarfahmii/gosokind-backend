"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAddressValidator = exports.createAddressValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createAddressValidator = [
    (0, express_validator_1.body)("label")
        .notEmpty().withMessage("Label is required (e.g., Home, Office)"),
    (0, express_validator_1.body)("address")
        .notEmpty().withMessage("Full address is required"),
    (0, express_validator_1.body)("latitude")
        .isFloat().withMessage("Latitude must be a valid number"),
    (0, express_validator_1.body)("longitude")
        .isFloat().withMessage("Longitude must be a valid number"),
    (0, express_validator_1.body)("isPrimary")
        .optional().isBoolean().withMessage("isPrimary must be a boolean"),
];
exports.updateAddressValidator = [
    (0, express_validator_1.body)("label")
        .optional().notEmpty().withMessage("Label cannot be empty"),
    (0, express_validator_1.body)("address")
        .optional().notEmpty().withMessage("Full address cannot be empty"),
    (0, express_validator_1.body)("latitude")
        .optional().isFloat().withMessage("Latitude must be a valid number"),
    (0, express_validator_1.body)("longitude")
        .optional().isFloat().withMessage("Longitude must be a valid number"),
    (0, express_validator_1.body)("isPrimary")
        .optional().isBoolean().withMessage("isPrimary must be a boolean"),
];
