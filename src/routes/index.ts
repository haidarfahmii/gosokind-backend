import { Router } from "express";
import workerRouter from "./worker.route";
import driverRouter from "./driver.route";
import attendanceRouter from "./attendance.route";

const router = Router();

router.use("/worker", workerRouter);
router.use("/driver", driverRouter);
router.use("/attendance", attendanceRouter);

export default router;
