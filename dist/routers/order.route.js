"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_1 = require("../controllers/order");
const order_validator_1 = require("../validators/order.validator");
const express_validator_middleware_1 = require("../middlewares/express-validator.middleware");
const verify_token_middleware_1 = require("../middlewares/verify.token.middleware");
const verify_role_middleware_1 = require("../middlewares/verify.role.middleware");
const verify_outlet_scope_middleware_1 = require("../middlewares/verify.outlet.scope.middleware");
const index_config_1 = require("../config/index.config");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Middleware global: Semua route memerlukan JWT token dan outlet scope
router.use((0, verify_token_middleware_1.verifyToken)(index_config_1.JWT_SECRET));
router.use((0, verify_outlet_scope_middleware_1.verifyOutletScope)());
/**
 * GET /api/orders/bypass-requests/pending
 * Get pending bypass requests
 * - Super admin: Can see all pending bypass requests
 * - Outlet admin: Can only see pending bypass requests from their outlet
 *
 * NOTE: This route MUST come before /api/orders/:id to avoid route conflict
 */
router.get("/bypass-requests/pending", (0, verify_role_middleware_1.verifyAdmin)(false), order_validator_1.getPendingBypassRequestsValidator, express_validator_middleware_1.expressValidator, order_1.combinedOrderController.getPendingBypassRequests);
/**
 * PATCH /api/orders/bypass-requests/:id
 * Handle bypass request (approve/reject)
 * - Only outlet admin can approve/reject bypass requests
 */
router.patch("/bypass-requests/:id", (0, verify_role_middleware_1.verifyAdmin)(false), order_validator_1.handleBypassRequestValidator, express_validator_middleware_1.expressValidator, order_1.combinedOrderController.handleBypassRequest);
/**
 * GET /api/orders
 * Get all orders
 * - Super admin: Can see all orders from all outlets
 * - Outlet admin: Can only see orders from their outlet
 */
router.get("/", (0, verify_role_middleware_1.verifyAdmin)(false), order_validator_1.getAllOrdersValidator, express_validator_middleware_1.expressValidator, order_1.combinedOrderController.getAllOrders);
/**
 * GET /api/orders/number/:orderNumber
 * Get order by orderNumber (human-readable, for URL usage)
 * NOTE: Must come BEFORE /:id to avoid route conflict
 */
router.get("/number/:orderNumber", (0, verify_role_middleware_1.verifyAdmin)(false), order_validator_1.getOrderByOrderNumberValidator, express_validator_middleware_1.expressValidator, order_1.combinedOrderController.getOrderByOrderNumber);
/**
 * GET /api/orders/:id
 * Get order by ID
 * - Validates outlet scope access
 */
router.get("/:id", (0, verify_role_middleware_1.verifyAdmin)(false), order_validator_1.getOrderByIdValidator, express_validator_middleware_1.expressValidator, order_1.combinedOrderController.getOrderById);
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
router.patch("/:id/status", (0, verify_role_middleware_1.verifyAdmin)(false), order_validator_1.updateOrderStatusValidator, express_validator_middleware_1.expressValidator, order_1.combinedOrderController.updateOrderStatus);
/**
 * POST /api/orders/:id/bypass-request
 * Create bypass request
 * - Workers create bypass requests when item count doesn't match
 * - Requires reason and item checks
 */
router.post("/:id/bypass-request", (0, verify_role_middleware_1.verifyRole)([
    client_1.EmployeeRole.WORKER_WASHING,
    client_1.EmployeeRole.WORKER_IRONING,
    client_1.EmployeeRole.WORKER_PACKING,
]), order_validator_1.createBypassRequestValidator, express_validator_middleware_1.expressValidator, order_1.combinedOrderController.createBypassRequest);
/**
 * POST /api/orders/:id/input-details
 *
 * Admin mengisi weight & items setelah barang sampai di outlet
 * Precondition: Order status = ARRIVED_AT_OUTLET
 * Result: Status berubah ke WASHING
 *
 * Auth: Outlet Admin atau Super Admin
 */
router.post("/:id/input-details", (0, verify_role_middleware_1.verifyAdmin)(false), // Both outlet admin & super admin can do this
order_validator_1.inputOrderDetailsValidator, express_validator_middleware_1.expressValidator, order_1.combinedOrderController.inputOrderDetails);
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
router.patch("/:id/driver-status", (0, verify_role_middleware_1.verifyRole)([client_1.EmployeeRole.DRIVER]), order_validator_1.updateDriverStatusValidator, express_validator_middleware_1.expressValidator, order_1.combinedOrderController.updateDriverStatus);
exports.default = router;
