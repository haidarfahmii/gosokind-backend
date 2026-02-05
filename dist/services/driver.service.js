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
exports.checkAvailability = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("../generated/prisma/client");
const checkAvailability = (driverId) => __awaiter(void 0, void 0, void 0, function* () {
    // Logic: Driver is available if they are NOT currently handling an ACTIVE job.
    // Active jobs for driver = PICKUP_ON_THE_WAY (as pickupDriver) OR DELIVERY_ON_THE_WAY (as deliveryDriver)
    const activePickup = yield prisma_1.prisma.order.findFirst({
        where: {
            pickupDriverId: driverId,
            status: client_1.OrderStatus.PICKUP_ON_THE_WAY,
        },
    });
    if (activePickup) {
        return { available: false, reason: "Currently handling a pickup" };
    }
    const activeDelivery = yield prisma_1.prisma.order.findFirst({
        where: {
            deliveryDriverId: driverId,
            status: client_1.OrderStatus.DELIVERY_ON_THE_WAY,
        },
    });
    if (activeDelivery) {
        return { available: false, reason: "Currently handling a delivery" };
    }
    return { available: true };
});
exports.checkAvailability = checkAvailability;
