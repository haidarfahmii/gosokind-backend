import { AuthResponse, JWTPayload, LoginInput, RegisterInput, VerifyInput } from "../@types"
import prisma from "../config/prisma.config"
import { AppError } from "../utils/app-error";
import { createToken, verifyToken } from "../utils/jwt.util";
import { mailService } from "./mail.service";
import bcrypt from "bcrypt"
import { JWT_SECRET } from "../config/index.config";
import jwt from "jsonwebtoken";

export const authService = {
    async register(input: RegisterInput): Promise<{ token: string }> {
        const { email } = input;
        // cek jika user sudah ada
        const existingUser = await prisma.customer.findUnique({
            where: { email, },
        });
        // cek jika user sudah verified
        if (existingUser && existingUser.isVerified) {
            throw AppError("User already exists", 400);
        }

        let user;
        // cek jika user ada tapi belom verified
        if (existingUser && !existingUser.isVerified) {
            user = existingUser;
        } else {
            const tempName = email.split("@")[0];
            user = await prisma.customer.create({
                data: {
                    email,
                    fullName: tempName,
                    isVerified: false,
                    password: null,
                },
            });
        }

        const secretKey = JWT_SECRET || "purwadhika-gosokind-laundry-jcwdbsd36";
        const verificationToken = jwt.sign(
            { userId: user.id },
            secretKey,
            { expiresIn: "1h" }
        );

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const verificationLink = `${frontendUrl}/auth/verify-email/${verificationToken}`;

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
        // token dikembalikan
        return {
            token: verificationToken
        };
    },

    async verify(input: VerifyInput): Promise<void> {
        const { userId, fullName, password } = input;

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.customer.update({
            where: { id: userId },
            data: {
                fullName,
                password: hashedPassword,
                isVerified: true,
            },
        });
    },

    async login(input: LoginInput): Promise<AuthResponse> {
        const { email, password } = input;
        // validasi email
        const findUser = await prisma.customer.findUnique({
            where: { email }
        })
        if (!findUser) { throw AppError("Email or Password is Invalid!", 400) }
        // validasi password
        const isPasswordValid = await bcrypt.compare(password, findUser.password!);
        if (!isPasswordValid) { throw AppError("Email or Password is Invalid!", 400) }
        // validasi verifikasi
        if (!findUser.isVerified) { throw AppError("Please verify your account!", 403) }

        // token
        const secretKey = JWT_SECRET || "purwadhika-gosokind-laundry-jcwdbsd36";
        const token = await createToken(
            {
                userId: findUser.id,
                email: findUser.email,
                role: "CUSTOMER"
            },
            secretKey,
            {
                expiresIn: "24h"
            }
        );

        return {
            token,
            user: {
                id: findUser?.id,
                name: findUser.fullName,
                email: findUser?.email,
                avatarUrl: findUser.avatarUrl,
                role: "CUSTOMER"
            },
        };
    },

    async forgotPassword(email: string): Promise<{ token: string }> {
        const user = await prisma.customer.findUnique({ where: { email } });

        if (!user) {
            throw AppError("User with this email does not exist", 404);
        }

        const secretKey = JWT_SECRET!;

        const resetToken = jwt.sign(
            { userId: user.id, email: user.email },
            secretKey,
            { expiresIn: "15m" }
        );

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const resetLink = `${frontendUrl}/auth/reset-password/${resetToken}`;

        await mailService.sendMail({
            to: email,
            subject: "Reset Your Password - Gosokind",
            template: "forgot-password.html",
            context: {
                name: user.fullName || email,
                resetLink: resetLink,
                year: new Date().getFullYear(),
            },
        });

        return {
            token: resetToken
        };
    },

    async resetPassword(userId: string, password: string): Promise<void> {
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.customer.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
    }
}  