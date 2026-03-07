"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combinedOrderController = exports.bypassController = exports.orderStatusController = exports.orderController = void 0;
const order_controller_1 = require("./order.controller");
Object.defineProperty(exports, "orderController", { enumerable: true, get: function () { return order_controller_1.orderController; } });
const order_status_controller_1 = require("./order-status.controller");
Object.defineProperty(exports, "orderStatusController", { enumerable: true, get: function () { return order_status_controller_1.orderStatusController; } });
const bypass_controller_1 = require("./bypass.controller");
Object.defineProperty(exports, "bypassController", { enumerable: true, get: function () { return bypass_controller_1.bypassController; } });
exports.combinedOrderController = {
    // Basic CRUD
    getAllOrders: order_controller_1.orderController.getAllOrders,
    getOrdersByCustomer: order_controller_1.orderController.getOrdersByCustomer,
    getOrderById: order_controller_1.orderController.getOrderById,
    getOrderByOrderNumber: order_controller_1.orderController.getOrderByOrderNumber,
    createOrderByCustomer: order_controller_1.orderController.createOrderByCustomer,
    inputOrderDetails: order_controller_1.orderController.inputOrderDetails,
    // Status operations
    updateOrderStatus: order_status_controller_1.orderStatusController.updateOrderStatus,
    updateDriverStatus: order_status_controller_1.orderStatusController.updateDriverStatus,
    confirmDelivery: order_status_controller_1.orderStatusController.confirmDelivery,
    // Bypass operations
    createBypassRequest: bypass_controller_1.bypassController.createBypassRequest,
    handleBypassRequest: bypass_controller_1.bypassController.handleBypassRequest,
    getPendingBypassRequests: bypass_controller_1.bypassController.getPendingBypassRequests,
};
