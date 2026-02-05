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
exports.processStationOrder = void 0;
const prisma_1 = require("../lib/prisma");
const processStationOrder = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId, workerId, station, items } = payload;
    // 1. Fetch official Order Items
    const orderItems = yield prisma_1.prisma.orderItem.findMany({
        where: { orderId },
    });
    // 2. Validate Quantity Mismatch
    // Logic: Check if every item in payload matches the quantity in DB
    // Note: Only checking items present in payload.
    // If strict check needed (must include ALL items), logic would vary.
    // Assuming payload must match EXACTLY what's in DB for those items or ALL items.
    // "Compare inputItems vs DB OrderItems. Throw QTY_MISMATCH if numbers don't match."
    for (const inputItem of items) {
        const dbItem = orderItems.find((oi) => oi.laundryItemId === inputItem.laundryItemId);
        if (!dbItem) {
            // Item shouldn't exist in this order?
            // Or maybe just extra item? Treating as mismatch for now
            throw new Error("QTY_MISMATCH");
        }
        if (dbItem.quantity !== inputItem.quantity) {
            throw new Error("QTY_MISMATCH");
        }
    }
    // Also check if payload has FEWER items than DB?
    // "Compare inputItems vs DB OrderItems" implies full comparison usually.
    if (items.length !== orderItems.length) {
        throw new Error("QTY_MISMATCH");
    }
    // 3. Create Process Record & Checks
    return yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const process = yield tx.orderStationProcess.create({
            data: {
                orderId,
                station,
                workerId,
                completedAt: new Date(), // Assuming instant completion for this step
                itemChecks: {
                    create: items.map((item) => ({
                        laundryItemId: item.laundryItemId,
                        inputQuantity: item.quantity,
                    })),
                },
            },
            include: {
                itemChecks: true,
            },
        });
        // Update Order Status based on station? 
        // Not explicitly asked, but good practice. Leaving out to adhere to strict constraints unless needed.
        return process;
    }));
});
exports.processStationOrder = processStationOrder;
