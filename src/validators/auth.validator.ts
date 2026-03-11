import { body } from "express-validator";

export const registerValidator = [
    body("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email format")
];
export const verifyValidator = [
    body("fullName")
        .notEmpty().withMessage("Full Name is Required")
        .isString().withMessage("Fullname must be a string"),
    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at leat 6 characters"),
    body("phone")
        .notEmpty().withMessage("Phone number is required")
        .isString().withMessage("Phone number must be a string")
        .isMobilePhone("id-ID").withMessage("Invalid phone number format")
];

export const loginValidator = [
    body("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email format"),
    body("password")
        .notEmpty().withMessage("Password is required")
];

export const forgotPasswordValidator = [
    body("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email format")
];

export const resetPasswordValidator = [
    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
];

export const googleLoginValidator = [
    body("email")
        .isEmail().withMessage("Invalid email format"),
    body("name")
        .notEmpty().withMessage("Name is required"),
    body("googleId")
        .notEmpty().withMessage("Google ID is required"),
];