import prisma from "../config/prisma.config";
import { OrderStatus } from "@prisma/client";

export async function checkAutoCompletionOrders() {
    try {
        console.log("⏰ [CRON] Checking for auto-complete orders...");

        // Hitung waktu batas (sekarang - 48 jam)
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

        const result = await prisma.order.updateMany({
            where: {
                status: OrderStatus.RECEIVED_BY_CUSTOMER,
                updatedAt: {
                    lt: twoDaysAgo, // Less than (sebelum) 48 jam yang lalu
                },
                deletedAt: null,
            },
            data: {
                status: OrderStatus.COMPLETED,
                updatedAt: new Date(), // Penting: updateMany tidak otomatis update field @updatedAt
            },
        });

        if (result.count > 0) {
            console.log(`✅ [CRON] Auto-completed ${result.count} orders.`);
        } else {
            console.log("ℹ️ [CRON] No orders to auto-complete.");
        }
    } catch (error) {
        console.error("❌ [CRON] Error in auto-complete job:", error);
    }
}

/**
 * Mulai semua cron job
 */
export function startCronJobs() {
    console.log("🚀 [CRON] Cron jobs started");

    // Jalankan sekali saat server baru nyala
    checkAutoCompletionOrders();

    // Jalankan secara berkala (setiap 1 jam)
    const INTERVAL = 60 * 60 * 1000; // 1 jam
    setInterval(() => {
        checkAutoCompletionOrders();
    }, INTERVAL);
}