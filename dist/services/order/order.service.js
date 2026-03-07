"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bypassService = exports.orderStatusService = exports.orderCreationService = exports.orderQueryService = exports.orderService = void 0;
const order_query_service_1 = require("./order-query.service");
Object.defineProperty(exports, "orderQueryService", { enumerable: true, get: function () { return order_query_service_1.orderQueryService; } });
const order_creation_service_1 = require("./order-creation.service");
Object.defineProperty(exports, "orderCreationService", { enumerable: true, get: function () { return order_creation_service_1.orderCreationService; } });
const order_status_service_1 = require("./order-status.service");
Object.defineProperty(exports, "orderStatusService", { enumerable: true, get: function () { return order_status_service_1.orderStatusService; } });
const bypass_service_1 = require("./bypass.service");
Object.defineProperty(exports, "bypassService", { enumerable: true, get: function () { return bypass_service_1.bypassService; } });
exports.orderService = {
    // QUERY OPERATIONS
    // Get all orders with filters and pagination
    getAllOrders: order_query_service_1.orderQueryService.getAllOrders,
    getOrdersByCustomer: order_query_service_1.orderQueryService.getOrdersByCustomer,
    // Get order by ID with full details
    getOrderById: order_query_service_1.orderQueryService.getOrderById,
    getOrderbyOrderNumber: order_query_service_1.orderQueryService.getOrderByOrderNumber,
    // CREATION OPERATIONS
    // Create order by customer (pickup request)
    createOrderByCustomer: order_creation_service_1.orderCreationService.createOrderByCustomer,
    // Input order details (weight & items) after arrival at outlet
    inputOrderDetails: order_creation_service_1.orderCreationService.inputOrderDetails,
    //  STATUS OPERATIONS
    // Update order status (for admin and workers)
    updateOrderStatus: order_status_service_1.orderStatusService.updateOrderStatus,
    // Update driver status (for driver operations)
    updateDriverStatus: order_status_service_1.orderStatusService.updateDriverStatus,
    // Confirm delivery (customer confirms receipt)
    confirmDelivery: order_status_service_1.orderStatusService.confirmDelivery,
    //  BYPASS OPERATIONS
    // Create bypass request (when item count doesn't match)
    createBypassRequest: bypass_service_1.bypassService.createBypassRequest,
    // Handle bypass request (approve/reject)
    handleBypassRequest: bypass_service_1.bypassService.handleBypassRequest,
    // Get pending bypass requests
    getPendingBypassRequests: bypass_service_1.bypassService.getPendingBypassRequests,
};
