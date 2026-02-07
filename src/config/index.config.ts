import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

// JWT Secret Key
export const JWT_SECRET = process.env.JWT_SECRET;

// WHITELIST
export const WHITELIST = [process.env.WHITELIST];

// NextAuth
export const NEXT_AUTH_SECRET_KEY = process.env.NEXT_AUTH_SECRET_KEY;

// Port
export const PORT = process.env.PORT;
export const CLIENT_URL = process.env.CLIENT_URL;

// mailer
export const GOOGLE_APP_ACCOUNT = process.env.GOOGLE_APP_ACCOUNT;
export const GOOGLE_APP_PASSWORD = process.env.GOOGLE_APP_PASSWORD;

// Geocoding API
export const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY;
