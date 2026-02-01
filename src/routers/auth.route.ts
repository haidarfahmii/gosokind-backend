import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { registerValidator, verifyValidator } from "../validators/auth.validator";
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

router.post("/login", authController.login);

export default router;