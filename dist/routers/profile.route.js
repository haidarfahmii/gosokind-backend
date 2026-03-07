"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verify_token_middleware_1 = require("../middlewares/verify.token.middleware");
const profile_controller_1 = require("../controllers/profile.controller");
const index_config_1 = require("../config/index.config");
const profile_validator_1 = require("../validators/profile.validator");
const express_validator_middleware_1 = require("../middlewares/express-validator.middleware");
const multer_middleware_1 = require("../middlewares/multer.middleware");
const router = (0, express_1.Router)();
// Middleware Auth Global untuk router ini
router.use((0, verify_token_middleware_1.verifyToken)(index_config_1.JWT_SECRET));
router.get("/", profile_controller_1.profileController.getProfile);
router.patch("/update", profile_validator_1.updateProfileValidator, express_validator_middleware_1.expressValidator, // Middleware untuk cek error dari express-validator
profile_controller_1.profileController.updateProfile);
router.patch("/change-password", profile_validator_1.changePasswordValidator, express_validator_middleware_1.expressValidator, profile_controller_1.profileController.changePassword);
router.patch("/avatar", (0, multer_middleware_1.multerCloudinaryUploader)("gosokind-avatars", // Nama folder di Cloudinary
["jpg", "jpeg", "png", "gif"], // Format yang diterima
1 * 1024 * 1024 // Maksimal 1MB
).single("avatar"), // .single("avatar") artinya field key di Postman harus "avatar"
profile_controller_1.profileController.uploadAvatar);
exports.default = router;
