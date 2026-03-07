"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const verify_token_middleware_1 = require("../middlewares/verify.token.middleware");
const index_config_1 = require("../config/index.config");
const router = (0, express_1.Router)();
router.use((0, verify_token_middleware_1.verifyToken)(index_config_1.JWT_SECRET));
/**
 * GET /api/notifications
 * Ambil semua notifikasi untuk user yang sedang login
 */
router.get("/", notification_controller_1.notificationController.getNotifications);
exports.default = router;
