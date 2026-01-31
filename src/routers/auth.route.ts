import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { registerValidator, verifyValidator } from "../validators/auth.validator";
import { expressValidator } from "../middlewares/express-validator.middleware";

const router = Router();

router.post("/register",
    registerValidator,
    expressValidator,
    authController.register
);

router.post("/verify",
    verifyValidator,
    expressValidator,
    authController.verify
);

export default router;