import { Router } from "express";
import * as bypassController from "../controllers/bypass.controller";
import { JWT_SECRET } from "../config/index.config";
import { verifyToken } from "../middlewares/verify.token.middleware";

const router = Router();

router.use(verifyToken(JWT_SECRET!));

router.post("/", bypassController.createBypassRequest);

export default router;
