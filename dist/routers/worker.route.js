"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const worker_controller_1 = require("../controllers/worker.controller");
const verify_token_middleware_1 = require("../middlewares/verify.token.middleware");
const verify_role_middleware_1 = require("../middlewares/verify.role.middleware");
const index_config_1 = require("../config/index.config");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Semua route worker HARUS terproteksi
router.use((0, verify_token_middleware_1.verifyToken)(index_config_1.JWT_SECRET));
router.use((0, verify_role_middleware_1.verifyRole)([
    client_1.EmployeeRole.WORKER_WASHING,
    client_1.EmployeeRole.WORKER_IRONING,
    client_1.EmployeeRole.WORKER_PACKING,
    client_1.EmployeeRole.SUPER_ADMIN,
    client_1.EmployeeRole.OUTLET_ADMIN,
]));
/**
 * GET /api/worker/orders
 * Worker melihat daftar pesanan yang masuk ke stationnya
 * - WORKER_WASHING: lihat order berstatus WASHING
 * - WORKER_IRONING: lihat order berstatus IRONING
 * - WORKER_PACKING: lihat order berstatus PACKING
 * Query: ?page=1&limit=10
 */
router.get("/orders", worker_controller_1.workerController.getOrderList);
/**
 * GET /api/worker/history
 * Worker melihat history pekerjaan pribadi
 * Query: ?page=1&limit=10
 */
router.get("/history", worker_controller_1.workerController.getJobHistory);
/**
 * POST /api/worker/process
 * Worker memproses order di stationnya (input item & qty)
 * Body: { orderId, station, items: [{ laundryItemId, quantity }] }
 * Jika qty tidak match → harus buat bypass request terlebih dahulu
 */
router.post("/process", worker_controller_1.workerController.processOrder);
exports.default = router;
