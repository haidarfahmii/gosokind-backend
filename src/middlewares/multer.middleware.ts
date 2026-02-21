import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.config";
import { AppError } from "../utils/app-error";

// Helper function untuk extract extension
const getFileExtension = (filename: string): string => {
    return filename.split(".").pop()?.toLowerCase() || "";
};

// Helper function untuk generate unique filename
const generateUniqueFilename = (file: Express.Multer.File): string => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    return `${file.fieldname}-${uniqueSuffix}`;
};

export function multerCloudinaryUploader(
    folderName: string, // nama folder di cloudinary
    acceptedFiles: string[], // array format file yang di izinkan ['jpg', 'jpeg', 'png']
    limitFileSize: number
) {
    // Normalize accepted files untuk case-insensitive comparison
    const normalizedAcceptedFiles = acceptedFiles.map((ext) => ext.toLowerCase());

    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (_req: Request, file: Express.Multer.File) => {
            return {
                folder: folderName,
                public_id: generateUniqueFilename(file),
                resource_type: "auto" as const,
            };
        },
    });

    const fileFilter = (
        _req: Request,
        file: Express.Multer.File,
        cb: FileFilterCallback
    ): void => {
        const extensionFile = getFileExtension(file.originalname);

        if (normalizedAcceptedFiles.includes(extensionFile)) {
            cb(null, true);
        } else {
            cb(
                 AppError( // Pastikan AppError dipanggil dengan 'new' jika class, atau sesuaikan dengan util Anda
                    `File format '${extensionFile}' is not accepted. Allowed formats: ${acceptedFiles.join(
                        ", "
                    )}`,
                    400
                )
            );
        }
    };

    return multer({
        storage,
        fileFilter,
        limits: { fileSize: limitFileSize },
    });
}