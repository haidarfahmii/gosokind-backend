import path from "path";
import dotenv from "dotenv";

dotenv.config({
    path: path.resolve(process.cwd(), ".env"),
});

// mailer
export const GOOGLE_APP_ACCOUNT = process.env.GOOGLE_APP_ACCOUNT;
export const GOOGLE_APP_PASSWORD = process.env.GOOGLE_APP_PASSWORD;

// JWT Secret Key
export const JWT_SECRET = process.env.JWT_SECRET
export const JWT_SECRET_KEY_EMAIL_VERIFICATION = process.env.JWT_SECRET_KEY_EMAIL_VERIFICATION

// WHITELIST
export const WHITELIST = [process.env.WHITELIST || "http://localhost:3000"];

// NextAuth
export const NEXT_AUTH_SECRET_KEY = process.env.NEXT_AUTH_SECRET_KEY;

// Client URL
export const CLIENT_URL = process.env.CLIENT_URL;

// Cloudinary
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET