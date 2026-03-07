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
exports.bypassController = void 0;
const order_service_1 = require("../../services/order/order.service");
exports.bypassController = {
    createBypassRequest(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orderId = req.params.id;
                const input = Object.assign(Object.assign({}, req.body), { orderId });
                const workerId = res.locals.payload.userId;
                const scopedOutletId = res.locals.scopedOutletId;
                const bypassRequest = yield order_service_1.orderService.createBypassRequest(input, workerId, scopedOutletId);
                res.status(201).json({
                    success: true,
                    message: "Bypass request created successfully",
                    data: bypassRequest,
                });
            }
            catch (error) {
                next(error);
            }
        });
    },
    handleBypassRequest(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bypassRequestId = req.params.id;
                const input = req.body;
                const adminId = res.locals.payload.userId;
                const scopedOutletId = res.locals.scopedOutletId;
                const isSuperAdmin = res.locals.isSuperAdmin;
                const bypassRequest = yield order_service_1.orderService.handleBypassRequest(bypassRequestId, input, adminId, scopedOutletId, isSuperAdmin);
                res.status(200).json({
                    success: true,
                    message: `Bypass request ${input.action.toLowerCase()} successfully`,
                    data: bypassRequest,
                });
            }
            catch (error) {
                next(error);
            }
        });
    },
    getPendingBypassRequests(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = req.query.page ? parseInt(req.query.page) : 1;
                const limit = req.query.limit ? parseInt(req.query.limit) : 10;
                const outletId = req.query.outletId;
                const scopedOutletId = res.locals.scopedOutletId;
                const isSuperAdmin = res.locals.isSuperAdmin;
                const result = yield order_service_1.orderService.getPendingBypassRequests(page, limit, outletId, scopedOutletId, isSuperAdmin);
                res.status(200).json({
                    success: true,
                    message: "Pending bypass requests retrieved successfully",
                    data: result,
                });
            }
            catch (error) {
                next(error);
            }
        });
    },
};
