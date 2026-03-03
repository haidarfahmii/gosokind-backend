import prisma from "../config/prisma.config";
import { AppError } from "../utils/app-error";
import { snap } from "../config/midtrans.config"; // Pastikan file midtrans.config.ts sudah ada
import { OrderStatus } from "@prisma/client";

export const paymentService = {
    async createPayment(orderId: string) {
        // 1. Cari data order beserta data customer
        const order = await prisma.order.findFirst({
            where: { id: orderId, deletedAt: null },
            include: { customer: true },
        });

        if (!order) {
            throw AppError("Order not found", 404);
        }

        // 2. Validasi status harus WAITING_FOR_PAYMENT
        if (order.status !== OrderStatus.WAITING_FOR_PAYMENT) {
            throw AppError("Order is not in waiting for payment status", 400);
        }

        // 3. Validasi harga
        if (!order.totalPrice || order.totalPrice <= 0) {
            throw AppError("Invalid order total price", 400);
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
        const transaction = await snap.createTransaction(parameter);

        // 7. Simpan paymentUrl ke database
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { paymentUrl: transaction.redirect_url },
        });

        return {
            orderId: updatedOrder.id,
            paymentUrl: updatedOrder.paymentUrl,
        };
    },

    async handleWebhook(notificationJson: any) {
        // Verifikasi notifikasi menggunakan client Midtrans
        const statusResponse = await (snap as any).transaction.notification(notificationJson);

        const orderNumber = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;
        const paymentType = statusResponse.payment_type;

        const order = await prisma.order.findFirst({ 
            where: { orderNumber: orderNumber, deletedAt: null },
        });

        if (!order) {
            throw AppError("Order not found from webhook", 404);
        }

        // Logika penanganan status transaksi Midtrans
        if (transactionStatus === "capture" || transactionStatus === "settlement") {
            if (fraudStatus === "accept" || !fraudStatus) {
                // Pembayaran Berhasil
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        isPaid: true,
                        status: OrderStatus.READY_FOR_DELIVERY,
                        paymentMethod: paymentType,
                    },
                });
            }
        } else if (
            transactionStatus === "cancel" ||
            transactionStatus === "deny" ||
            transactionStatus === "expire"
        ) {
            // Pembayaran Gagal / Kedaluwarsa
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    paymentUrl: null, // Reset agar user bisa generate URL pembayaran baru
                },
            });
        }

        return { status: "Webhook processed successfully" };
    },
};