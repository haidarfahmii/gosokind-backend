import { Router } from "express";
import workerRouter from "./worker.route";
import driverRouter from "./driver.route";
import attendanceRouter from "./attendance.route";
import authRouter from './auth.route';
import notificationRouter from './notification.route';

const router = Router();

router.use('/auth', authRouter);
router.use('/notifications', notificationRouter);
router.use("/worker", workerRouter);
router.use("/driver", driverRouter);
router.use("/attendance", attendanceRouter);

export default router;
