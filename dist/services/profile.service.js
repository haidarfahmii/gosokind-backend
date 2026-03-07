"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileService = void 0;
const prisma_config_1 = __importDefault(require("../config/prisma.config"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mail_service_1 = require("./mail.service");
const index_config_1 = require("../config/index.config");
const app_error_1 = require("../utils/app-error");
exports.profileService = {
    getProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma_config_1.default.customer.findUnique({
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
            if (!user)
                throw (0, app_error_1.AppError)("User not found", 404);
            return user;
        });
    },
    updateProfile(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Cek user ada atau tidak
            const user = yield prisma_config_1.default.customer.findUnique({ where: { id: userId } });
            if (!user)
                throw (0, app_error_1.AppError)("User not found", 404);
            let isEmailChanged = false;
            if (data.email && data.email !== user.email) {
                const existingEmail = yield prisma_config_1.default.customer.findUnique({
                    where: { email: data.email },
                });
                if (existingEmail) {
                    throw (0, app_error_1.AppError)("Email already in use", 400);
                }
                isEmailChanged = true;
            }
            const updatedUser = yield prisma_config_1.default.customer.update({
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
                const secretKey = index_config_1.JWT_SECRET;
                // Buat token verifikasi baru
                const verificationToken = jsonwebtoken_1.default.sign({ userId: updatedUser.id }, secretKey, { expiresIn: "1h" });
                const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
                const verificationLink = `${frontendUrl}/auth/verify-email/${verificationToken}`;
                yield mail_service_1.mailService.sendMail({
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
        });
    },
    changePassword(userId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            const { currentPassword, newPassword } = input;
            const user = yield prisma_config_1.default.customer.findUnique({
                where: { id: userId },
            });
            if (!user)
                throw (0, app_error_1.AppError)("User not found", 404);
            if (!user.password) {
                throw (0, app_error_1.AppError)("User with social login cannot change password", 400);
            }
            if (currentPassword == newPassword) {
                throw (0, app_error_1.AppError)("Cannot use current password on the new password", 400);
            }
            const isPasswordValid = yield bcrypt_1.default.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                throw (0, app_error_1.AppError)("Invalid current password", 400);
            }
            const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
            yield prisma_config_1.default.customer.update({
                where: { id: userId },
                data: {
                    password: hashedPassword,
                },
            });
        });
    }
};
