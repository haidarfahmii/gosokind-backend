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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = void 0;
const prisma_config_1 = __importDefault(require("../config/prisma.config"));
const app_error_1 = require("../utils/app-error");
const midtrans_config_1 = require("../config/midtrans.config"); // Pastikan file midtrans.config.ts sudah ada
const client_1 = require("@prisma/client");
exports.paymentService = {
    createPayment(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Cari data order beserta data customer
            const order = yield prisma_config_1.default.order.findFirst({
                where: { id: orderId, deletedAt: null },
                include: { customer: true },
            });
            if (!order) {
                throw (0, app_error_1.AppError)("Order not found", 404);
            }
            // 2. Validasi status harus WAITING_FOR_PAYMENT
            if (order.status !== client_1.OrderStatus.WAITING_FOR_PAYMENT) {
                throw (0, app_error_1.AppError)("Order is not in waiting for payment status", 400);
            }
            // 3. Validasi harga
            if (!order.totalPrice || order.totalPrice <= 0) {
                throw (0, app_error_1.AppError)("Invalid order total price", 400);
            }
            // 4. Jika sudah ada paymentUrl yang valid, kembalikan URL yang sudah ada
            if (order.paymentUrl && !order.isPaid) {
                return {
                    orderId: order.id,
                    paymentUrl: order.paymentUrl
                };
            }
            // 5. Setup parameter untuk Midtrans Snap
            const parameter = {
                transaction_details: {
                    order_id: order.orderNumber, // Gunakan orderNumber (INV-...)
                    gross_amount: Math.round(order.totalPrice), // Pastikan nominal bulat
                },
                customer_details: {
                    first_name: order.customer.fullName,
                    email: order.customer.email
                },
                custom_expiry: {
                    expiry_duration: 24,
                    unit: "hour",
                },
            };
            // 6. Buat transaksi di Midtrans
            const transaction = yield midtrans_config_1.snap.createTransaction(parameter);
            // 7. Simpan paymentUrl ke database
            const updatedOrder = yield prisma_config_1.default.order.update({
                where: { id: orderId },
                data: { paymentUrl: transaction.redirect_url },
            });
            return {
                orderId: updatedOrder.id,
                paymentUrl: updatedOrder.paymentUrl,
            };
        });
    },
    handleWebhook(notificationJson) {
        return __awaiter(this, void 0, void 0, function* () {
            // Verifikasi notifikasi menggunakan client Midtrans
            const statusResponse = yield midtrans_config_1.snap.transaction.notification(notificationJson);
            const orderNumber = statusResponse.order_id;
            const transactionStatus = statusResponse.transaction_status;
            const fraudStatus = statusResponse.fraud_status;
            const paymentType = statusResponse.payment_type;
            const order = yield prisma_config_1.default.order.findFirst({
                where: { orderNumber: orderNumber, deletedAt: null },
            });
            if (!order) {
                throw (0, app_error_1.AppError)("Order not found from webhook", 404);
            }
            // Logika penanganan status transaksi Midtrans
            if (transactionStatus === "capture" || transactionStatus === "settlement") {
                if (fraudStatus === "accept" || !fraudStatus) {
                    // Pembayaran Berhasil
                    yield prisma_config_1.default.order.update({
                        where: { id: order.id },
                        data: {
                            isPaid: true,
                            status: client_1.OrderStatus.READY_FOR_DELIVERY,
                            paymentMethod: paymentType,
                        },
                    });
                }
            }
            else if (transactionStatus === "cancel" ||
                transactionStatus === "deny" ||
                transactionStatus === "expire") {
                // Pembayaran Gagal / Kedaluwarsa
                yield prisma_config_1.default.order.update({
                    where: { id: order.id },
                    data: {
                        paymentUrl: null, // Reset agar user bisa generate URL pembayaran baru
                    },
                });
            }
            return { status: "Webhook processed successfully" };
        });
    },
};
