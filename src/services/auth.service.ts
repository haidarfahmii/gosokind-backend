import { JWTPayload, RegisterInput, VerifyInput } from "../@types"
import prisma from "../config/prisma.config"
import { AppError } from "../utils/app-error";
import { createToken, verifyToken } from "../utils/jwt.util";
import { mailService } from "./mail.service";
import bcrypt from "bcrypt"
import { JWT_SECRET } from "../config/index.config";
import jwt from "jsonwebtoken";

export const authService = {
    async register(input: RegisterInput): Promise<{token: string}> {
        const { email } = input;
        // cek jika user sudah ada
        const existingUser = await prisma.customer.findUnique({
            where: { email, },
        });
        if (existingUser) {
            throw AppError("User already exists", 400);
        }

        const tempName = email.split("@")[0];

        const newUser = await prisma.customer.create({
            data: {
                email,
                fullName: tempName,
                isVerified: false,
                password: null,
            },
        });

        const secretKey = JWT_SECRET || "purwadhika-gosokind-laundry-jcwdbsd36";

        const verificationToken = jwt.sign(
            { id: newUser.id },
            secretKey,
            { expiresIn: "1h" }
        );

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const verificationLink = `${frontendUrl}/verify?token=${verificationToken}`;

        await mailService.sendMail({
            to: email,
            subject: "Welcome to Gosokind - Verify Your Email",
            template: "verification.html",
            context: {
                name: email,
                verificationLink: verificationLink,
                year: new Date().getFullYear(),
            },
        });

        // KEMBALIKAN TOKEN DAN EMAIL DI SINI
        return {
            token: verificationToken
        };
    },

    async verify(input: VerifyInput): Promise<void> {
        const { token, fullName, password } = input;

        const secretKey = JWT_SECRET || "purwadhika-gosokind-laundry-jcwdbsd36";
        let decodedPayload: any;
        try {
            decodedPayload = jwt.verify(token, secretKey);
        } catch (error) {
            throw AppError("Invalid or expired verification token", 400);
        }

        const userId = decodedPayload.id;

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.customer.update({
            where: { id: userId },
            data: {
                fullName,
                password: hashedPassword,
                isVerified: true,
            },
        });
    }
}  