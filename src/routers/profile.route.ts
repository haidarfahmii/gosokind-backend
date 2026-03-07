import { Router } from "express";
import { verifyToken } from "../middlewares/verify.token.middleware";
import { profileController } from "../controllers/profile.controller";
import { JWT_SECRET } from "../config/index.config";
import { changePasswordValidator, updateProfileValidator } from "../validators/profile.validator";
import { expressValidator } from "../middlewares/express-validator.middleware";
import { multerCloudinaryUploader } from "../middlewares/multer.middleware";

const router = Router();

// Middleware Auth Global untuk router ini
router.use(verifyToken(JWT_SECRET!));

router.get("/", profileController.getProfile);

router.patch(
    "/update",
    updateProfileValidator,
    expressValidator, // Middleware untuk cek error dari express-validator
    profileController.updateProfile
);

router.patch(
    "/change-password",
    changePasswordValidator,
    expressValidator,
    profileController.changePassword
);

router.patch(
    "/avatar",
    multerCloudinaryUploader(
        "gosokind-avatars", // Nama folder di Cloudinary
        ["jpg", "jpeg", "png", "gif"], // Format yang diterima
        1 * 1024 * 1024 // Maksimal 1MB
    ).single("avatar"), // .single("avatar") artinya field key di Postman harus "avatar"
    profileController.uploadAvatar
);

export default router;