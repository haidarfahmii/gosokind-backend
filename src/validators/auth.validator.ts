import { body, query } from "express-validator";

export const registerValidator = [
    body("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email format")
]
export const verifyValidator = [
    query("token")
        .notEmpty().withMessage("Token is required"),
    body("fullName")
        .notEmpty().withMessage("Full Name is Required")
        .isString().withMessage("Fullname must be a string"),
    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({min:6}).withMessage("Password must be at leat 6 characters")
]