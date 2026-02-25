import { Router } from "express";
import { workerController } from "../controllers/worker.controller";
import { verifyToken } from "../middlewares/verify.token.middleware";
import { verifyRole } from "../middlewares/verify.role.middleware";
import { JWT_SECRET } from "../config/index.config";
import { EmployeeRole } from "@prisma/client";

const router = Router();

// Semua route worker HARUS terproteksi
router.use(verifyToken(JWT_SECRET!));
router.use(
  verifyRole([
    EmployeeRole.WORKER_WASHING,
    EmployeeRole.WORKER_IRONING,
    EmployeeRole.WORKER_PACKING,
    EmployeeRole.SUPER_ADMIN,
    EmployeeRole.OUTLET_ADMIN,
  ]),
);

/**
 * GET /api/worker/orders
 * Worker melihat daftar pesanan yang masuk ke stationnya
 * - WORKER_WASHING: lihat order berstatus WASHING
 * - WORKER_IRONING: lihat order berstatus IRONING
 * - WORKER_PACKING: lihat order berstatus PACKING
 * Query: ?page=1&limit=10
 */
router.get("/orders", workerController.getOrderList);

/**
 * GET /api/worker/history
 * Worker melihat history pekerjaan pribadi
 * Query: ?page=1&limit=10
 */
router.get("/history", workerController.getJobHistory);

/**
 * POST /api/worker/process
 * Worker memproses order di stationnya (input item & qty)
 * Body: { orderId, station, items: [{ laundryItemId, quantity }] }
 * Jika qty tidak match → harus buat bypass request terlebih dahulu
 */
router.post("/process", workerController.processOrder);

export default router;
