import { body } from "express-validator";

export const createAddressValidator = [
    body("label")
        .notEmpty().withMessage("Label is required (e.g., Home, Office)"),
    body("address")
        .notEmpty().withMessage("Full address is required"),
    body("latitude")
        .isFloat().withMessage("Latitude must be a valid number"),
    body("longitude")
        .isFloat().withMessage("Longitude must be a valid number"),
    body("isPrimary")
        .optional().isBoolean().withMessage("isPrimary must be a boolean"),
];

export const updateAddressValidator = [
    body("label")
        .optional().notEmpty().withMessage("Label cannot be empty"),
    body("address")
        .optional().notEmpty().withMessage("Full address cannot be empty"),
    body("latitude")
        .optional().isFloat().withMessage("Latitude must be a valid number"),
    body("longitude")
        .optional().isFloat().withMessage("Longitude must be a valid number"),
    body("isPrimary")
        .optional().isBoolean().withMessage("isPrimary must be a boolean"),
];