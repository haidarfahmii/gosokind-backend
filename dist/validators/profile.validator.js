"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordValidator = exports.updateProfileValidator = void 0;
const express_validator_1 = require("express-validator");
exports.updateProfileValidator = [
    (0, express_validator_1.body)("fullName")
        .optional()
        .isString()
        .isLength({ min: 3 })
        .withMessage("Full name must be at least 3 characters long"),
    (0, express_validator_1.body)("email")
        .optional()
        .isEmail()
        .withMessage("Invalid email format")
];
exports.changePasswordValidator = [
    (0, express_validator_1.body)("currentPassword")
        .notEmpty()
        .withMessage("Current password must be required"),
    (0, express_validator_1.body)("newPassword")
        .notEmpty()
        .withMessage("New password must be required")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 character"),
];
