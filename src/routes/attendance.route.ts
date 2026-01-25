import { Router } from "express";
import * as attendanceController from "../controllers/attendance.controller";

const router = Router();

router.post("/clock-in", attendanceController.clockIn);
router.post("/clock-out", attendanceController.clockOut);

export default router;
