import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { verifyToken } from "../middlewares/verify.token.middleware";
import { JWT_SECRET } from "../config/index.config";

const router = Router();

router.use(verifyToken(JWT_SECRET!));

/**
 * GET /api/notifications
 * Ambil semua notifikasi untuk user yang sedang login
 */
router.get("/", notificationController.getNotifications);

export default router;
