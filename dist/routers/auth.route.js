"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_validator_1 = require("../validators/auth.validator");
const express_validator_middleware_1 = require("../middlewares/express-validator.middleware");
const verify_token_middleware_1 = require("../middlewares/verify.token.middleware");
const index_config_1 = require("../config/index.config");
const order_validator_1 = require("../validators/order.validator");
const order_1 = require("../controllers/order");
const router = (0, express_1.Router)();
router.post("/register", auth_validator_1.registerValidator, express_validator_middleware_1.expressValidator, auth_controller_1.authController.register);
router.post("/verify", (0, verify_token_middleware_1.verifyToken)(index_config_1.JWT_SECRET), auth_validator_1.verifyValidator, express_validator_middleware_1.expressValidator, auth_controller_1.authController.verify);
router.post("/login", auth_validator_1.loginValidator, express_validator_middleware_1.expressValidator, auth_controller_1.authController.login);
router.post("/forgot-password", auth_validator_1.forgotPasswordValidator, express_validator_middleware_1.expressValidator, auth_controller_1.authController.forgotPassword);
router.post("/reset-password", (0, verify_token_middleware_1.verifyToken)(index_config_1.JWT_SECRET), auth_validator_1.resetPasswordValidator, express_validator_middleware_1.expressValidator, auth_controller_1.authController.resetPassword);
router.get("/verify-token", (0, verify_token_middleware_1.verifyToken)(index_config_1.JWT_SECRET), // Middleware ini yang akan mengecek expired/invalid
auth_controller_1.authController.checkToken);
router.post("/google-login", auth_validator_1.googleLoginValidator, // Pasang validator
express_validator_middleware_1.expressValidator, // Middleware cek error
auth_controller_1.authController.googleLogin);
router.patch("/orders/:id/confirm-delivery", (0, verify_token_middleware_1.verifyToken)(index_config_1.JWT_SECRET), order_validator_1.confirmDeliveryValidator, express_validator_middleware_1.expressValidator, order_1.combinedOrderController.confirmDelivery);
exports.default = router;
