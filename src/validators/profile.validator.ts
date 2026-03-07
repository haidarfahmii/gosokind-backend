import { body } from "express-validator";

export const updateProfileValidator = [
    body("fullName")
        .optional()
        .isString()
        .isLength({ min: 3 })
        .withMessage("Full name must be at least 3 characters long"),

    body("email")
        .optional()
        .isEmail()
        .withMessage("Invalid email format")
];

export const changePasswordValidator = [
    body("currentPassword")
        .notEmpty()
        .withMessage("Current password must be required"),

    body("newPassword")
        .notEmpty()
        .withMessage("New password must be required")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 character"),
]