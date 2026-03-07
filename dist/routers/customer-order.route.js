"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_1 = require("../controllers/order");
const order_validator_1 = require("../validators/order.validator");
const express_validator_middleware_1 = require("../middlewares/express-validator.middleware");
const verify_token_middleware_1 = require("../middlewares/verify.token.middleware");
const index_config_1 = require("../config/index.config");
const router = (0, express_1.Router)();
router.use((0, verify_token_middleware_1.verifyToken)(index_config_1.JWT_SECRET));
// POST /api/customer/orders - Create new order
router.post("/", order_validator_1.createOrderByCustomerValidator, express_validator_middleware_1.expressValidator, order_1.combinedOrderController.createOrderByCustomer);
// GET /api/customer/orders - Get customer's orders
router.get("/", order_1.combinedOrderController.getOrdersByCustomer);
// GET /api/customer/orders/:id - Get order detail
router.get("/:id", order_1.combinedOrderController.getOrderById);
router.get("/number/:orderNumber", order_1.combinedOrderController.getOrderByOrderNumber);
// PATCH /api/customer/orders/:id/confirm-delivery
router.patch("/:id/confirm-delivery", order_1.combinedOrderController.confirmDelivery);
exports.default = router;
