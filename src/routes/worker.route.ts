import { Router } from "express";
import * as workerController from "../controllers/worker.controller";
import { JWT_SECRET } from "../config/index.config";
import { verifyToken } from "../middlewares/verify.token.middleware";

const router = Router();

router.use(verifyToken(JWT_SECRET!)); // Kunci semua endpoint worker

router.get("/orders", workerController.getOrderList); // Incoming Jobs
router.get("/history", workerController.getJobHistory); // Completed Jobs
router.post("/process", workerController.processOrder); // Execute Job

export default router;
