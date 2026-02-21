import { Router } from "express";
import * as bypassController from "../controllers/bypass.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyToken);

router.post("/", bypassController.createBypassRequest);

export default router;
