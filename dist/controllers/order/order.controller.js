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
exports.orderController = void 0;
const order_service_1 = require("../../services/order/order.service");
exports.orderController = {
    getAllOrders(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = {
                    page: req.query.page ? parseInt(req.query.page) : undefined,
                    limit: req.query.limit
                        ? parseInt(req.query.limit)
                        : undefined,
                    search: req.query.search,
                    status: req.query.status,
                    outletId: req.query.outletId,
                    startDate: req.query.startDate,
                    endDate: req.query.endDate,
                };
                const scopedOutletId = res.locals.scopedOutletId;
                const isSuperAdmin = res.locals.isSuperAdmin;
                const result = yield order_service_1.orderService.getAllOrders(query, scopedOutletId, isSuperAdmin);
                res.status(200).json({
                    success: true,
                    message: "Orders retrieved successfully",
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        });
    },
    getOrdersByCustomer(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Ambil ID customer dari token (diset oleh middleware verifyToken)
                const customerId = res.locals.payload.userId;
                const query = {
                    page: req.query.page ? parseInt(req.query.page) : undefined,
                    limit: req.query.limit ? parseInt(req.query.limit) : undefined,
                    status: req.query.status,
                };
                const result = yield order_service_1.orderService.getOrdersByCustomer(customerId, query);
                res.status(200).json({
                    success: true,
                    message: "Customer orders retrieved successfully",
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        });
    },
    getOrderById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orderId = req.params.id;
                const scopedOutletId = res.locals.scopedOutletId;
                const isSuperAdmin = res.locals.isSuperAdmin;
                const order = yield order_service_1.orderService.getOrderById(orderId, scopedOutletId, isSuperAdmin);
                res.status(200).json({
                    success: true,
                    message: "Order retrieved successfully",
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    },
    getOrderByOrderNumber(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orderNumber = req.params.orderNumber;
                const scopedOutletId = res.locals.scopedOutletId;
                const isSuperAdmin = res.locals.isSuperAdmin;
                const order = yield order_service_1.orderService.getOrderbyOrderNumber(orderNumber, scopedOutletId, isSuperAdmin);
                res.status(200).json({
                    success: true,
                    message: "Order retrieved successfully by Order Number",
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    },
    createOrderByCustomer(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const input = req.body;
                const customerId = res.locals.payload.userId;
                const order = yield order_service_1.orderService.createOrderByCustomer(customerId, input);
                res.status(201).json({
                    success: true,
                    message: "Order created successfully. Waiting for driver pickup.",
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    },
    inputOrderDetails(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orderId = req.params.id;
                const input = req.body;
                const outletId = res.locals.scopedOutletId;
                const adminId = res.locals.payload.userId;
                // Ensure admin is assigned to an outlet
                if (!outletId) {
                    return res.status(403).json({
                        success: false,
                        message: "Forbidden: You must be assigned to an outlet to input order details",
                        data: null,
                    });
                }
                // if (!input.workerId) {
                //   return res.status(400).json({
                //     success: false,
                //     message: "workerId is required to assign washing station worker",
                //     data: null,
                //   });
                // }
                const order = yield order_service_1.orderService.inputOrderDetails(orderId, input, outletId, adminId);
                res.status(200).json({
                    success: true,
                    message: "Order details input successfully. Order moved to WASHING station.",
                    data: order,
                });
            }
            catch (error) {
                next(error);
            }
        });
    },
};
