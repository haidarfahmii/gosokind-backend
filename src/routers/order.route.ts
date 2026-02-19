import { Router } from "express";
import { combinedOrderController as orderController } from "../controllers/order";
import {
  getAllOrdersValidator,
  getOrderByIdValidator,
  createOrderValidator,
  updateOrderStatusValidator,
  createBypassRequestValidator,
  handleBypassRequestValidator,
  getPendingBypassRequestsValidator,
  inputOrderDetailsValidator,
  updateDriverStatusValidator,
} from "../validators/order.validator";
import { expressValidator } from "../middlewares/express-validator.middleware";
import { verifyToken } from "../middlewares/verify.token.middleware";
import { verifyAdmin, verifyRole } from "../middlewares/verify.role.middleware";
import { verifyOutletScope } from "../middlewares/verify.outlet.scope.middleware";
import { JWT_SECRET } from "../config/index.config";
import { EmployeeRole } from "@prisma/client";

const router = Router();

// Middleware global: Semua route memerlukan JWT token dan outlet scope
router.use(verifyToken(JWT_SECRET!));
router.use(verifyOutletScope());

/**
 * GET /api/orders/bypass-requests/pending
 * Get pending bypass requests
 * - Super admin: Can see all pending bypass requests
 * - Outlet admin: Can only see pending bypass requests from their outlet
 *
 * NOTE: This route MUST come before /api/orders/:id to avoid route conflict
 */
router.get(
  "/bypass-requests/pending",
  verifyAdmin(false),
  getPendingBypassRequestsValidator,
  expressValidator,
  orderController.getPendingBypassRequests,
);

/**
 * PATCH /api/orders/bypass-requests/:id
 * Handle bypass request (approve/reject)
 * - Only outlet admin can approve/reject bypass requests
 */
router.patch(
  "/bypass-requests/:id",
  verifyAdmin(false),
  handleBypassRequestValidator,
  expressValidator,
  orderController.handleBypassRequest,
);

/**
 * GET /api/orders
 * Get all orders
 * - Super admin: Can see all orders from all outlets
 * - Outlet admin: Can only see orders from their outlet
 */
router.get(
  "/",
  verifyAdmin(false),
  getAllOrdersValidator,
  expressValidator,
  orderController.getAllOrders,
);

/**
 * GET /api/orders/:id
 * Get order by ID
 * - Validates outlet scope access
 */
router.get(
  "/:id",
  verifyAdmin(false),
  getOrderByIdValidator,
  expressValidator,
  orderController.getOrderById,
);

/**
 * POST /api/orders
 * Create order
 * - Only outlet admin can create orders
 * - Must input total weight and items quantities
 */
// router.post(
//   "/",
//   verifyAdmin(false),
//   createOrderValidator,
//   expressValidator,
//   orderController.createOrder,
// );

/**
 * PATCH /api/orders/:id/status
 * Update order status
 * - Outlet admin and workers can update order status
 * - Validates status transitions
 */
router.patch(
  "/:id/status",
  verifyAdmin(false),
  updateOrderStatusValidator,
  expressValidator,
  orderController.updateOrderStatus,
);

/**
 * POST /api/orders/:id/bypass-request
 * Create bypass request
 * - Workers create bypass requests when item count doesn't match
 * - Requires reason and item checks
 */
router.post(
  "/:id/bypass-request",
  verifyRole([
    EmployeeRole.WORKER_WASHING,
    EmployeeRole.WORKER_IRONING,
    EmployeeRole.WORKER_PACKING,
  ]),
  createBypassRequestValidator,
  expressValidator,
  orderController.createBypassRequest,
);

/**
 * POST /api/orders/:id/input-details
 *
 * Admin mengisi weight & items setelah barang sampai di outlet
 * Precondition: Order status = ARRIVED_AT_OUTLET
 * Result: Status berubah ke WASHING
 *
 * Auth: Outlet Admin atau Super Admin
 */
router.post(
  "/:id/input-details",
  verifyAdmin(false), // Both outlet admin & super admin can do this
  inputOrderDetailsValidator,
  expressValidator,
  orderController.inputOrderDetails,
);

/**
 * PATCH /api/orders/:id/driver-status
 *
 * Driver update order status untuk pickup & delivery
 * Valid transitions:
 * - WAITING_FOR_PICKUP → PICKUP_ON_THE_WAY
 * - PICKUP_ON_THE_WAY → ARRIVED_AT_OUTLET
 * - READY_FOR_DELIVERY → DELIVERY_ON_THE_WAY
 * - DELIVERY_ON_THE_WAY → RECEIVED_BY_CUSTOMER
 *
 * Auth: Driver only
 */
router.patch(
  "/:id/driver-status",
  verifyRole([EmployeeRole.DRIVER]),
  updateDriverStatusValidator,
  expressValidator,
  orderController.updateDriverStatus,
);

export default router;
