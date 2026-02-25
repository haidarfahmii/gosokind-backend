import { Router } from "express";
import * as attendanceController from "../controllers/attendance.controller";
import { JWT_SECRET } from "../config/index.config";
import { verifyToken } from "../middlewares/verify.token.middleware";

const router = Router();

router.use(verifyToken(JWT_SECRET!));

router.post("/clock-in", attendanceController.clockIn);
router.post("/clock-out", attendanceController.clockOut);
router.get("/dashboard", attendanceController.getDashboard);
router.get("/", attendanceController.getAllAttendance);

export default router;
