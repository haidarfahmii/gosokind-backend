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
            { userId: newUser.id },
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
        if (!isPasswordValid) { throw AppError("Email or Password is Invalid!", 400)}
        // validasi verifikasi
        if (!findUser.isVerified) {throw AppError("Please verify your account!", 403)}

        // token
        const secretKey = JWT_SECRET || "purwadhika-gosokind-laundry-jcwdbsd36";
        const token = await createToken(
            {
                userId: findUser.id,
                email: findUser.email
            },
            secretKey,
            {
                expiresIn: "24h"
            }
        );

        return{
            token,
            user: {
                id: findUser?.id,
                name: findUser.fullName,
                email: findUser?.email,
                avatarUrl: findUser.avatarUrl
            },
        };
    }
}  