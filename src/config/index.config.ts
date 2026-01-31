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