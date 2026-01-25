import { Router } from "express";
import * as driverController from "../controllers/driver.controller";

const router = Router();

router.post("/availability", driverController.checkAvailability);

export default router;
