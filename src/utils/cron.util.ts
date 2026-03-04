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

export async function checkScheduledPickups() {
    try {
        const now = new Date();

        // Cari order yang masih SCHEDULED tapi waktunya sudah lewat atau sekarang
        const result = await prisma.order.updateMany({
            where: {
                status: OrderStatus.SCHEDULED_FOR_PICKUP, // Status baru
                pickupAt: {
                    lte: now, // Less than or equal to now (Waktunya sudah tiba/lewat)
                },
                deletedAt: null,
            },
            data: {
                status: OrderStatus.WAITING_FOR_PICKUP, // Ubah jadi siap dipickup
                updatedAt: new Date(),
            },
        });

        if (result.count > 0) {
            console.log(`✅ [CRON] Moved ${result.count} scheduled orders to WAITING_FOR_PICKUP.`);
        }
        // Opsional: else { console.log("No scheduled orders due."); }

    } catch (error) {
        console.error("❌ [CRON] Error in checkScheduledPickups:", error);
    }
}

/**
 * Mulai semua cron job
 */
export function startCronJobs() {
    console.log("🚀 [CRON] Cron jobs started");

    // Jalankan sekali saat server nyala
    checkAutoCompletionOrders();
    checkScheduledPickups(); 

    // 1. Cron Auto-Complete (Per 1 Jam)
    setInterval(() => {
        checkAutoCompletionOrders();
    }, 60 * 60 * 1000);

    // 2. Cron Schedule Checker (Per 1 Menit)
    setInterval(() => {
        checkScheduledPickups();
    }, 60 * 1000); // Cek setiap 1 menit
}