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
exports.multerCloudinaryUploader = multerCloudinaryUploader;
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_config_1 = __importDefault(require("../config/cloudinary.config"));
const app_error_1 = require("../utils/app-error");
// Helper function untuk extract extension
const getFileExtension = (filename) => {
    var _a;
    return ((_a = filename.split(".").pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || "";
};
// Helper function untuk generate unique filename
const generateUniqueFilename = (file) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    return `${file.fieldname}-${uniqueSuffix}`;
};
function multerCloudinaryUploader(folderName, // nama folder di cloudinary
acceptedFiles, // array format file yang di izinkan ['jpg', 'jpeg', 'png']
limitFileSize) {
    // Normalize accepted files untuk case-insensitive comparison
    const normalizedAcceptedFiles = acceptedFiles.map((ext) => ext.toLowerCase());
    const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
        cloudinary: cloudinary_config_1.default,
        params: (_req, file) => __awaiter(this, void 0, void 0, function* () {
            return {
                folder: folderName,
                public_id: generateUniqueFilename(file),
                resource_type: "auto",
            };
        }),
    });
    const fileFilter = (_req, file, cb) => {
        const extensionFile = getFileExtension(file.originalname);
        if (normalizedAcceptedFiles.includes(extensionFile)) {
            cb(null, true);
        }
        else {
            cb((0, app_error_1.AppError)(// Pastikan AppError dipanggil dengan 'new' jika class, atau sesuaikan dengan util Anda
            `File format '${extensionFile}' is not accepted. Allowed formats: ${acceptedFiles.join(", ")}`, 400));
        }
    };
    return (0, multer_1.default)({
        storage,
        fileFilter,
        limits: { fileSize: limitFileSize },
    });
}
