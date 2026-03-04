import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { verifyToken } from "../middlewares/verify.token.middleware";
import { JWT_SECRET } from "../config/index.config";

const router = Router();

// ==========================================
// PUBLIC ROUTE (Dihit oleh Server Midtrans)
// ==========================================
router.post(
    "/webhook",
    paymentController.handleWebhook
);

// ==========================================
// PROTECTED ROUTES (Dihit oleh Customer)
// ==========================================
router.use(verifyToken(JWT_SECRET!)); // route di bawah ini wajib login

router.post(
    "/:orderId/pay",
    paymentController.createPayment
);

export default router;