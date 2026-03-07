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
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("../services/auth.service");
exports.authController = {
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            const data = yield auth_service_1.authService.register({ email });
            res.status(200).json({
                success: true,
                message: "Register account successfully",
                data: {
                    email: email,
                    token: data.token,
                },
            });
        });
    },
    verify(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { fullName, password } = req.body;
            const { userId } = (_a = res === null || res === void 0 ? void 0 : res.locals) === null || _a === void 0 ? void 0 : _a.payload;
            yield auth_service_1.authService.verify({ userId, fullName, password });
            res.status(200).json({
                success: true,
                message: "Verify account successfully",
                data: {
                    fullName,
                    password,
                },
            });
        });
    },
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            const user = yield auth_service_1.authService.login({ email, password });
            res.status(200).json({
                success: true,
                message: "Login successfully",
                data: user,
            });
        });
    },
    forgotPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            const data = yield auth_service_1.authService.forgotPassword(email);
            res.status(200).json({
                success: true,
                message: "Forgot password link has been sent to your email",
                data: {
                    email: email,
                    token: data.token,
                },
            });
        });
    },
    resetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { password } = req.body;
            const { userId } = (_a = res === null || res === void 0 ? void 0 : res.locals) === null || _a === void 0 ? void 0 : _a.payload;
            yield auth_service_1.authService.resetPassword(userId, password);
            res.status(200).json({
                success: true,
                message: "Password has been reset successfully",
                data: {
                    userId,
                    password,
                },
            });
        });
    },
    checkToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Jika request sampai di sini, berarti sudah lolos middleware verifyToken
            // Artinya token valid & tidak expired
            res.status(200).json({
                success: true,
                message: "Token is valid",
            });
        });
    },
    googleLogin(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ambil data yang dikirim dari Frontend NextAuth
            const { email, name, googleId, avatarUrl } = req.body;
            const result = yield auth_service_1.authService.googleLogin({
                email,
                name,
                googleId,
                avatarUrl,
            });
            console.log(result);
            res.status(200).json({
                success: true,
                message: "Google login successful",
                data: result, // Berisi token & user
            });
        });
    },
};
