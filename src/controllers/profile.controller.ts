import { Request, Response, NextFunction } from "express";
import { profileService } from "../services/profile.service";
import { AppError } from "../utils/app-error";

export const profileController = {
    async getProfile(req: Request, res: Response) {
        const userId = res.locals.payload.userId;
        const profile = await profileService.getProfile(userId);

        res.status(200).json({
            success: true,
            message: "User Profile retrieved successfully",
            data: profile,
        });
    },

    async updateProfile(req: Request, res: Response) {
        const { fullName, email, phone } = req.body;
        const userId = res.locals.payload.userId;
        const updatedProfile = await profileService.updateProfile(userId, { fullName, email, phone });

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedProfile,
        });
    },

    async changePassword(req: Request, res: Response) {
        const userId = res.locals.payload.userId;

        const { currentPassword, newPassword } = req.body;

        // Panggil service
        await profileService.changePassword(userId, { currentPassword, newPassword });

        res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    },

    async uploadAvatar(req: Request, res: Response, next: NextFunction) {
        const userId = res?.locals?.payload?.userId;

        // Cek apakah file berhasil diupload oleh multer
        if (!req.file) {
            throw AppError("No image file uploaded", 400);
        }

        // URL gambar dari Cloudinary otomatis ada di req.file.path
        const avatarUrl = req?.file?.path;

        // Simpan URL ke database menggunakan service yang sudah ada
        const updatedUser = await profileService.updateProfile(userId, {
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
    },
};