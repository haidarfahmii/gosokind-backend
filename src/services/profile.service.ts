import prisma from "../config/prisma.config";
import { Customer } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { mailService } from "./mail.service";
import { CLIENT_URL, JWT_SECRET, JWT_SECRET_KEY_EMAIL_VERIFICATION } from "../config/index.config";
import { AppError } from "../utils/app-error";
import { ChangePasswordInput, UpdateProfileInput } from "../@types";

export const profileService = {
    async getProfile(userId: string) {
        const user = await prisma.customer.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                isVerified: true,
                provider: true,
                providerId: true,
                createdAt: true
            }
        });

        if (!user) throw AppError("User not found", 404);
        return user;
    },

    async updateProfile(userId: string, data: UpdateProfileInput) {
        // Cek user ada atau tidak
        const user = await prisma.customer.findUnique({ where: { id: userId } });
        if (!user) throw AppError("User not found", 404);

        let isEmailChanged = false;

        if (data.email && data.email !== user.email) {
            const existingEmail = await prisma.customer.findUnique({
                where: { email: data.email },
            });

            if (existingEmail) {
                throw AppError("Email already in use", 400);
            }
            isEmailChanged = true;
        }

        const updatedUser = await prisma.customer.update({
            where: { id: userId },
            data: {
                fullName: data.fullName,
                email: data.email,
                avatarUrl: data.avatarUrl,
                // Set isVerified ke false jika email berubah
                isVerified: isEmailChanged ? false : user.isVerified
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                updatedAt: true,
            },
        });

        // Jika email berubah, kirim email verifikasi baru
        if (isEmailChanged && data.email) {
            const secretKey = JWT_SECRET!;

            // Buat token verifikasi baru
            const verificationToken = jwt.sign(
                { userId: updatedUser.id },
                secretKey,
                { expiresIn: "1h" }
            );

            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
            const verificationLink = `${frontendUrl}/auth/verify-email/${verificationToken}`;

            await mailService.sendMail({
                to: data.email,
                subject: "Verify Your New Email - Gosokind",
                template: "resend-verification.html",
                context: {
                    name: updatedUser.fullName || data.email,
                    verificationLink: verificationLink,
                    year: new Date().getFullYear(),
                },
            });
        }

        return updatedUser;
    },

    async changePassword(userId: string, input: ChangePasswordInput) {
        const { currentPassword, newPassword } = input;
        const user = await prisma.customer.findUnique({
            where: { id: userId },
        });

        if (!user) throw AppError("User not found", 404);

        if (!user.password) {
            throw AppError("User with social login cannot change password", 400);
        }

        if (currentPassword == newPassword) {
            throw AppError("Cannot use current password on the new password", 400)
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw AppError("Invalid current password", 400);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.customer.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
            },
        });
    }
}