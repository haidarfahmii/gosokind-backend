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
exports.paymentController = void 0;
const payment_service_1 = require("../services/payment.service");
exports.paymentController = {
    createPayment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { orderId } = req.params;
            const result = yield payment_service_1.paymentService.createPayment(orderId);
            res.status(200).json({
                success: true,
                message: "Payment URL generated successfully",
                data: result,
            });
        });
    },
    handleWebhook(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const notificationJson = req.body;
            yield payment_service_1.paymentService.handleWebhook(notificationJson);
            res.status(200).json({
                success: true,
                message: "Payment has been paid successfully",
            });
        });
    },
};
