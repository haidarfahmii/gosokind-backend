"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const index_config_1 = require("./index.config");
exports.transporter = nodemailer_1.default.createTransport({
    service: "gmail", // Atau gunakan SMTP lain (Mailtrap, SendGrid, dll)
    auth: {
        user: index_config_1.GOOGLE_APP_ACCOUNT,
        pass: index_config_1.GOOGLE_APP_PASSWORD,
    },
    // host: process.env.MAILTRAP_HOST,
    // port: 2525,
    // auth: {
    //   user: process.env.MAILTRAP_USER,
    //   pass: process.env.MAILTRAP_PASS,
    // },
});
