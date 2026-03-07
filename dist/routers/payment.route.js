"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const verify_token_middleware_1 = require("../middlewares/verify.token.middleware");
const index_config_1 = require("../config/index.config");
const router = (0, express_1.Router)();
// ==========================================
// PUBLIC ROUTE (Dihit oleh Server Midtrans)
// ==========================================
router.post("/webhook", payment_controller_1.paymentController.handleWebhook);
// ==========================================
// PROTECTED ROUTES (Dihit oleh Customer)
// ==========================================
router.use((0, verify_token_middleware_1.verifyToken)(index_config_1.JWT_SECRET)); // route di bawah ini wajib login
router.post("/:orderId/pay", payment_controller_1.paymentController.createPayment);
exports.default = router;
