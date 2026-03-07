"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleLoginValidator = exports.resetPasswordValidator = exports.forgotPasswordValidator = exports.loginValidator = exports.verifyValidator = exports.registerValidator = void 0;
const express_validator_1 = require("express-validator");
exports.registerValidator = [
    (0, express_validator_1.body)("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email format")
];
exports.verifyValidator = [
    (0, express_validator_1.body)("fullName")
        .notEmpty().withMessage("Full Name is Required")
        .isString().withMessage("Fullname must be a string"),
    (0, express_validator_1.body)("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at leat 6 characters")
];
exports.loginValidator = [
    (0, express_validator_1.body)("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email format"),
    (0, express_validator_1.body)("password")
        .notEmpty().withMessage("Password is required")
];
exports.forgotPasswordValidator = [
    (0, express_validator_1.body)("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email format")
];
exports.resetPasswordValidator = [
    (0, express_validator_1.body)("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
];
exports.googleLoginValidator = [
    (0, express_validator_1.body)("email")
        .isEmail().withMessage("Invalid email format"),
    (0, express_validator_1.body)("name")
        .notEmpty().withMessage("Name is required"),
    (0, express_validator_1.body)("googleId")
        .notEmpty().withMessage("Google ID is required"),
];
