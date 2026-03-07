"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderStatusController = void 0;
const order_service_1 = require("../../services/order/order.service");
exports.orderStatusController = {
    updateOrderStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orderId = req.params.id;
                const input = req.body;
                const employeeId = res.locals.payload.userId;
                const employeeRole = res.locals.payload.role;
                const scopedOutletId = res.locals.scopedOutletId;
                const isSuperAdmin = res.locals.isSuperAdmin;
                const order = yield order_service_1.orderService.updateOrderStatus(orderId, input, employeeId, employeeRole, scopedOutletId, isSuperAdmin);
                res.status(200).json({
                    success: true,
                    message: `Order status updated to ${input.status}`,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    },
    updateDriverStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orderId = req.params.id;
                const input = req.body;
                const driverId = res.locals.payload.userId;
                if (input.driverId !== driverId) {
                    return res.status(403).json({
                        success: false,
                        message: "Forbidden: You can only update status for yourself",
                        data: null,
                    });
                }
                const order = yield order_service_1.orderService.updateDriverStatus(orderId, input, driverId);
                // Custom message based on status
                let message = `Order status updated to ${input.status}`;
                if (input.status === "PICKUP_ON_THE_WAY") {
                    message = "Pickup accepted. On the way to customer address.";
                }
                else if (input.status === "ARRIVED_AT_OUTLET") {
                    message = "Items picked up successfully. Arrived at outlet.";
                }
                else if (input.status === "DELIVERY_ON_THE_WAY") {
                    message = "Delivery started. On the way to customer address.";
                }
                else if (input.status === "RECEIVED_BY_CUSTOMER") {
                    message =
                        "Order delivered successfully. Waiting for customer confirmation.";
                }
                res.status(200).json({
                    success: true,
                    message,
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    },
    confirmDelivery(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orderId = req.params.id;
                const customerId = res.locals.payload.userId;
                const order = yield order_service_1.orderService.confirmDelivery(orderId, customerId);
                res.status(200).json({
                    success: true,
                    message: "Delivery confirmed successfully. Order completed.",
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    },
};
