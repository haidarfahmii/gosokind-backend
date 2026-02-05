import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { forgotPasswordValidator, loginValidator, registerValidator, resetPasswordValidator, verifyValidator } from "../validators/auth.validator";
import { expressValidator } from "../middlewares/express-validator.middleware";
import { verifyToken } from "../middlewares/verify.token.middleware";
import { JWT_SECRET } from "../config/index.config";

const router = Router();

router.post("/register",
    registerValidator,
    expressValidator,
    authController.register
);

router.post("/verify",
    verifyToken(JWT_SECRET!),
    verifyValidator,
    expressValidator,
    authController.verify
);

router.post("/login",
    loginValidator,
    expressValidator,
    authController.login);

router.post("/forgot-password",
    forgotPasswordValidator,
    expressValidator,
    authController.forgotPassword
);

router.post("/reset-password",
    verifyToken(JWT_SECRET!),
    resetPasswordValidator,
    expressValidator,
    authController.resetPassword
);

router.get("/verify-token",
    verifyToken(JWT_SECRET!), // Middleware ini yang akan mengecek expired/invalid
    authController.checkToken
);

export default router;