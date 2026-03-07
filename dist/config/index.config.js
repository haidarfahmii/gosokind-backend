"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLOUDINARY_API_SECRET = exports.CLOUDINARY_API_KEY = exports.CLOUDINARY_CLOUD_NAME = exports.CLIENT_URL = exports.NEXT_AUTH_SECRET_KEY = exports.WHITELIST = exports.JWT_SECRET_KEY_EMAIL_VERIFICATION = exports.JWT_SECRET = exports.GOOGLE_APP_PASSWORD = exports.GOOGLE_APP_ACCOUNT = exports.PORT = void 0;
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    path: path_1.default.resolve(process.cwd(), ".env"),
});
// Port
exports.PORT = process.env.PORT;
// mailer
exports.GOOGLE_APP_ACCOUNT = process.env.GOOGLE_APP_ACCOUNT;
exports.GOOGLE_APP_PASSWORD = process.env.GOOGLE_APP_PASSWORD;
// JWT Secret Key
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.JWT_SECRET_KEY_EMAIL_VERIFICATION = process.env.JWT_SECRET_KEY_EMAIL_VERIFICATION;
// WHITELIST
exports.WHITELIST = [process.env.WHITELIST || "http://localhost:3000"];
// NextAuth
exports.NEXT_AUTH_SECRET_KEY = process.env.NEXT_AUTH_SECRET_KEY;
// Client URL
exports.CLIENT_URL = process.env.CLIENT_URL;
// Cloudinary
exports.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
exports.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
exports.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
