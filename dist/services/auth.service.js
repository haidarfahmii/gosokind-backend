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
exports.authService = void 0;
const prisma_config_1 = __importDefault(require("../config/prisma.config"));
const app_error_1 = require("../utils/app-error");
const jwt_util_1 = require("../utils/jwt.util");
const mail_service_1 = require("./mail.service");
const bcrypt_1 = __importDefault(require("bcrypt"));
const index_config_1 = require("../config/index.config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.authService = {
    register(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email } = input;
            // cek jika user sudah ada
            const existingUser = yield prisma_config_1.default.customer.findUnique({
                where: { email },
            });
            // cek jika user sudah verified
            if (existingUser && existingUser.isVerified) {
                throw (0, app_error_1.AppError)("User already exists", 400);
            }
            let user;
            // cek jika user ada tapi belom verified
            if (existingUser && !existingUser.isVerified) {
                user = existingUser;
            }
            else {
                const tempName = email.split("@")[0];
                user = yield prisma_config_1.default.customer.create({
                    data: {
                        email,
                        fullName: tempName,
                        isVerified: false,
                        password: null,
                    },
                });
            }
            const secretKey = index_config_1.JWT_SECRET || "purwadhika-gosokind-laundry-jcwdbsd36";
            const verificationToken = jsonwebtoken_1.default.sign({ userId: user.id }, secretKey, {
                expiresIn: "1h",
            });
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
            const verificationLink = `${frontendUrl}/auth/verify-email/${verificationToken}`;
            yield mail_service_1.mailService.sendMail({
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
                token: verificationToken,
            };
        });
    },
    verify(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, fullName, password } = input;
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            yield prisma_config_1.default.customer.update({
                where: { id: userId },
                data: {
                    fullName,
                    password: hashedPassword,
                    isVerified: true,
                },
            });
        });
    },
    login(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password } = input;
            // validasi email
            const findUser = yield prisma_config_1.default.customer.findUnique({
                where: { email },
            });
            if (!findUser) {
                throw (0, app_error_1.AppError)("Email or Password is Invalid!", 400);
            }
            // validasi password
            const isPasswordValid = yield bcrypt_1.default.compare(password, findUser.password);
            if (!isPasswordValid) {
                throw (0, app_error_1.AppError)("Email or Password is Invalid!", 400);
            }
            // validasi verifikasi
            if (!findUser.isVerified) {
                throw (0, app_error_1.AppError)("Please verify your account!", 403);
            }
            // token
            const secretKey = index_config_1.JWT_SECRET || "purwadhika-gosokind-laundry-jcwdbsd36";
            const token = yield (0, jwt_util_1.createToken)({
                userId: findUser.id,
                email: findUser.email,
                role: "CUSTOMER",
            }, secretKey, {
                expiresIn: "24h",
            });
            return {
                token,
                user: {
                    id: findUser === null || findUser === void 0 ? void 0 : findUser.id,
                    name: findUser.fullName,
                    email: findUser === null || findUser === void 0 ? void 0 : findUser.email,
                    avatarUrl: findUser.avatarUrl,
                    role: "CUSTOMER",
                },
            };
        });
    },
    forgotPassword(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma_config_1.default.customer.findUnique({ where: { email } });
            if (!user) {
                throw (0, app_error_1.AppError)("User with this email does not exist", 404);
            }
            const secretKey = index_config_1.JWT_SECRET;
            const resetToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, secretKey, { expiresIn: "15m" });
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
            const resetLink = `${frontendUrl}/auth/reset-password/${resetToken}`;
            yield mail_service_1.mailService.sendMail({
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
                token: resetToken,
            };
        });
    },
    resetPassword(userId, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            yield prisma_config_1.default.customer.update({
                where: { id: userId },
                data: { password: hashedPassword },
            });
        });
    },
    googleLogin(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, name, googleId, avatarUrl } = input;
            let user = yield prisma_config_1.default.customer.findUnique({
                where: { email },
            });
            // 2. Logic: CREATE or UPDATE
            if (!user) {
                // SKENARIO A: User Baru (Register via Google)
                user = yield prisma_config_1.default.customer.create({
                    data: {
                        email,
                        fullName: name,
                        password: null, // Tidak ada password
                        isVerified: true, // Email Google dianggap valid
                        provider: "google",
                        providerId: googleId,
                        avatarUrl: avatarUrl || null,
                    },
                });
            }
            else {
                // SKENARIO B: User Lama (Link Account)
                user = yield prisma_config_1.default.customer.update({
                    where: { id: user.id },
                    data: {
                        provider: "google",
                        providerId: googleId,
                        isVerified: true, // Auto verify jika belum
                        avatarUrl: user.avatarUrl ? user.avatarUrl : avatarUrl,
                    },
                });
            }
            const secretKey = index_config_1.JWT_SECRET || "purwadhika-gosokind-laundry-jcwdbsd36";
            const token = yield (0, jwt_util_1.createToken)({
                userId: user.id,
                email: user.email,
                role: "CUSTOMER",
            }, secretKey, { expiresIn: "24h" });
            return {
                token,
                user: {
                    id: user.id,
                    name: user.fullName,
                    email: user.email,
                    avatarUrl: user.avatarUrl,
                    role: "CUSTOMER",
                },
            };
        });
    },
};
