import nodemailer from "nodemailer"
import { GOOGLE_APP_ACCOUNT, GOOGLE_APP_PASSWORD } from "./index.config";

export const transporter = nodemailer.createTransport({
  service: "gmail", // Atau gunakan SMTP lain (Mailtrap, SendGrid, dll)
  auth: {
    user: GOOGLE_APP_ACCOUNT,
    pass: GOOGLE_APP_PASSWORD,
  },
  // host: process.env.MAILTRAP_HOST,
  // port: 2525,
  // auth: {
  //   user: process.env.MAILTRAP_USER,
  //   pass: process.env.MAILTRAP_PASS,
  // },
});
