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
exports.checkAutoCompletionOrders = checkAutoCompletionOrders;
exports.checkScheduledPickups = checkScheduledPickups;
exports.startCronJobs = startCronJobs;
const prisma_config_1 = __importDefault(require("../config/prisma.config"));
const client_1 = require("@prisma/client");
function checkAutoCompletionOrders() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("⏰ [CRON] Checking for auto-complete orders...");
            // Hitung waktu batas (sekarang - 48 jam)
            const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
            const result = yield prisma_config_1.default.order.updateMany({
                where: {
                    status: client_1.OrderStatus.RECEIVED_BY_CUSTOMER,
                    updatedAt: {
                        lt: twoDaysAgo, // Less than (sebelum) 48 jam yang lalu
                    },
                    deletedAt: null,
                },
                data: {
                    status: client_1.OrderStatus.COMPLETED,
                    updatedAt: new Date(), // Penting: updateMany tidak otomatis update field @updatedAt
                },
            });
            if (result.count > 0) {
                console.log(`✅ [CRON] Auto-completed ${result.count} orders.`);
            }
            else {
                console.log("ℹ️ [CRON] No orders to auto-complete.");
            }
        }
        catch (error) {
            console.error("❌ [CRON] Error in auto-complete job:", error);
        }
    });
}
function checkScheduledPickups() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const now = new Date();
            // Cari order yang masih SCHEDULED tapi waktunya sudah lewat atau sekarang
            const result = yield prisma_config_1.default.order.updateMany({
                where: {
                    status: client_1.OrderStatus.SCHEDULED_FOR_PICKUP, // Status baru
                    pickupAt: {
                        lte: now, // Less than or equal to now (Waktunya sudah tiba/lewat)
                    },
                    deletedAt: null,
                },
                data: {
                    status: client_1.OrderStatus.WAITING_FOR_PICKUP, // Ubah jadi siap dipickup
                    updatedAt: new Date(),
                },
            });
            if (result.count > 0) {
                console.log(`✅ [CRON] Moved ${result.count} scheduled orders to WAITING_FOR_PICKUP.`);
            }
            // Opsional: else { console.log("No scheduled orders due."); }
        }
        catch (error) {
            console.error("❌ [CRON] Error in checkScheduledPickups:", error);
        }
    });
}
/**
 * Mulai semua cron job
 */
function startCronJobs() {
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
