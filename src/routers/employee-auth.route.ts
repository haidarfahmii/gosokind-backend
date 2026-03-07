import { Router } from "express";
import { employeeAuthController } from "../controllers/employee-auth.controller";
import { loginValidator } from "../validators/auth.validator";
import { expressValidator } from "../middlewares/express-validator.middleware";

const router = Router();

router.post(
  "/login",
  loginValidator,
  expressValidator,
  employeeAuthController.login,
);

export default router;
