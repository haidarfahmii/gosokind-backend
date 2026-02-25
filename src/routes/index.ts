import { Router } from "express";
import workerRouter from "./worker.route";
import driverRouter from "./driver.route";
import attendanceRouter from "./attendance.route";
import authRouter from './auth.route';
import notificationRouter from './notification.route';
import bypassRouter from './bypass.route';

const router = Router();

router.use('/auth', authRouter);
router.use('/notifications', notificationRouter);
router.use("/worker", workerRouter);
router.use("/driver", driverRouter);
router.use("/attendance", attendanceRouter);
router.use("/bypass", bypassRouter);

export default router;
