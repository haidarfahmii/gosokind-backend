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
exports.createBypassRequest = void 0;
const prisma_config_1 = __importDefault(require("../config/prisma.config"));
const client_1 = require("@prisma/client");
const createBypassRequest = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId, workerId, station, reason } = payload;
    // Validasi order ada
    const order = yield prisma_config_1.default.order.findUnique({
        where: { id: orderId },
        select: { id: true, orderNumber: true },
    });
    if (!order)
        throw new Error("ORDER_NOT_FOUND");
    // Cek apakah sudah ada pending bypass untuk kombinasi order + worker + station
    // Mencegah duplicate submission
    const existing = yield prisma_config_1.default.bypassRequest.findFirst({
        where: {
            orderId,
            workerId,
            station,
            status: client_1.BypassStatus.PENDING,
        },
    });
    if (existing)
        throw new Error("ALREADY_HAS_PENDING_BYPASS");
    // Buat bypass request
    const bypassRequest = yield prisma_config_1.default.bypassRequest.create({
        data: {
            orderId,
            workerId,
            station,
            reason,
            status: client_1.BypassStatus.PENDING,
        },
        include: {
            order: {
                select: {
                    id: true,
                    orderNumber: true,
                },
            },
            worker: {
                select: {
                    id: true,
                    fullName: true,
                },
            },
        },
    });
    return bypassRequest;
});
exports.createBypassRequest = createBypassRequest;
