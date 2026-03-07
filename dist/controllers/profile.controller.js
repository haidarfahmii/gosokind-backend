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
exports.profileController = void 0;
const profile_service_1 = require("../services/profile.service");
const app_error_1 = require("../utils/app-error");
exports.profileController = {
    getProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = res.locals.payload.userId;
            const profile = yield profile_service_1.profileService.getProfile(userId);
            res.status(200).json({
                success: true,
                message: "User Profile retrieved successfully",
                data: profile,
            });
        });
    },
    updateProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fullName, email } = req.body;
            const userId = res.locals.payload.userId;
            const updatedProfile = yield profile_service_1.profileService.updateProfile(userId, { fullName, email });
            res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: updatedProfile,
            });
        });
    },
    changePassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = res.locals.payload.userId;
            const { currentPassword, newPassword } = req.body;
            // Panggil service
            yield profile_service_1.profileService.changePassword(userId, { currentPassword, newPassword });
            res.status(200).json({
                success: true,
                message: "Password changed successfully",
            });
        });
    },
    uploadAvatar(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const userId = (_b = (_a = res === null || res === void 0 ? void 0 : res.locals) === null || _a === void 0 ? void 0 : _a.payload) === null || _b === void 0 ? void 0 : _b.userId;
            // Cek apakah file berhasil diupload oleh multer
            if (!req.file) {
                throw (0, app_error_1.AppError)("No image file uploaded", 400);
            }
            // URL gambar dari Cloudinary otomatis ada di req.file.path
            const avatarUrl = (_c = req === null || req === void 0 ? void 0 : req.file) === null || _c === void 0 ? void 0 : _c.path;
            // Simpan URL ke database menggunakan service yang sudah ada
            const updatedUser = yield profile_service_1.profileService.updateProfile(userId, {
                avatarUrl: avatarUrl,
            });
            res.status(200).json({
                success: true,
                message: "Avatar uploaded successfully",
                data: {
                    avatarUrl: avatarUrl,
                    user: updatedUser,
                },
            });
        });
    },
};
