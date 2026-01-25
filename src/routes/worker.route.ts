import { Router } from "express";
import * as workerController from "../controllers/worker.controller";

const router = Router();

router.post("/process", workerController.processOrder);

export default router;
