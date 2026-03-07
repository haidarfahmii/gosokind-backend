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
exports.orderCreationService = void 0;
const prisma_config_1 = __importDefault(require("../../config/prisma.config"));
const app_error_1 = require("../../utils/app-error");
const client_1 = require("@prisma/client");
const order_helpers_1 = require("./order.helpers");
const order_query_service_1 = require("./order-query.service");
const geo_service_1 = require("../geo.service");
exports.orderCreationService = {
    createOrderByCustomer(customerId, input) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. Validate customer
            const customer = yield prisma_config_1.default.customer.findUnique({
                where: { id: customerId, deletedAt: null },
            });
            if (!customer)
                throw (0, app_error_1.AppError)("Customer not found", 404);
            // 2. Validate and get address coordinates
            const address = yield prisma_config_1.default.address.findUnique({
                where: { id: input.addressId, deletedAt: null },
            });
            if (!address)
                throw (0, app_error_1.AppError)("Address not found", 404);
            if (address.customerId !== customerId) {
                throw (0, app_error_1.AppError)("Address does not belong to this customer", 400);
            }
            // 3. Find the nearest available outlet
            const availableOutlets = yield prisma_config_1.default.outlet.findMany({
                where: { status: "AVAILABLE", deletedAt: null },
            });
            if (availableOutlets.length === 0) {
                throw (0, app_error_1.AppError)("No available outlets at the moment", 404);
            }
            let nearestOutlet = null;
            let shortestDistance = Infinity;
            for (const outlet of availableOutlets) {
                const distance = geo_service_1.geoService.calculateDistance(address.latitude, address.longitude, outlet.latitude, outlet.longitude);
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestOutlet = outlet;
                }
            }
            if (!nearestOutlet) {
                throw (0, app_error_1.AppError)("Could not determine the nearest outlet", 404);
            }
            // 4. Generate order number
            const orderNumber = yield (0, order_helpers_1.generateOrderNumber)();
            let initialStatus = client_1.OrderStatus.WAITING_FOR_PICKUP;
            const now = new Date();
            const pickupDate = input.pickupAt ? new Date(input.pickupAt) : new Date();
            // Jika ada input pickupAt dan waktunya lebih besar dari waktu sekarang (masa depan)
            if (input.pickupAt && pickupDate > now) {
                initialStatus = client_1.OrderStatus.SCHEDULED_FOR_PICKUP;
            }
            // 5. Create the order with the automatically selected outletId
            const order = yield prisma_config_1.default.order.create({
                data: {
                    orderNumber,
                    customerId: customerId,
                    addressId: input.addressId,
                    outletId: nearestOutlet.id, // Use the nearest outlet found
                    totalWeight: null,
                    totalPrice: null,
                    status: initialStatus,
                    pickupAt: input.pickupAt ? new Date(input.pickupAt) : new Date(),
                },
            });
            return order_query_service_1.orderQueryService.getOrderById(order.id, null, true);
        });
    },
    inputOrderDetails(orderId, input, outletId, adminId) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield prisma_config_1.default.order.findUnique({
                where: { id: orderId, deletedAt: null },
                include: {
                    orderItems: true,
                },
            });
            if (!order) {
                throw (0, app_error_1.AppError)("Order not found", 404);
            }
            // Validate outlet scope
            if (order.outletId !== outletId) {
                throw (0, app_error_1.AppError)("Forbidden: You can only input details for orders from your outlet", 403);
            }
            // validasi status is ARRIVED_AT_OUTLET
            if (order.status !== client_1.OrderStatus.ARRIVED_AT_OUTLET) {
                throw (0, app_error_1.AppError)("Order details can only be input when status is ARRIVED_AT_OUTLET", 400);
            }
            // Validate order doesn't already have items
            if (order.orderItems.length > 0) {
                throw (0, app_error_1.AppError)("Order details have already been input", 400);
            }
            // Validate total weight
            if (input.totalWeight <= 0) {
                throw (0, app_error_1.AppError)("Total weight must be greater than 0", 400);
            }
            // validasi semua item laundry ada
            const laundryItemIds = input.items.map((item) => item.laundryItemId);
            const laundryItems = yield prisma_config_1.default.laundryItem.findMany({
                where: {
                    id: { in: laundryItemIds },
                    deletedAt: null,
                },
            });
            if (laundryItems.length !== laundryItemIds.length) {
                throw (0, app_error_1.AppError)("One or more laundry items not found", 404);
            }
            // Validate quantities
            for (const item of input.items) {
                if (item.quantity <= 0) {
                    throw (0, app_error_1.AppError)(`Quantity for item ${item.laundryItemId} must be greater than 0`, 400);
                }
            }
            // total kalkulasi harga dari item
            let totalPrice = 0;
            for (const item of input.items) {
                const laundryItem = laundryItems.find((li) => li.id === item.laundryItemId);
                if (laundryItem && laundryItem.basePrice) {
                    totalPrice += laundryItem.basePrice * item.quantity;
                }
            }
            // update order dengan transaksi
            const updatedOrder = yield prisma_config_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Update order with weight, price, and status
                const updated = yield tx.order.update({
                    where: { id: orderId },
                    data: {
                        totalWeight: input.totalWeight,
                        totalPrice,
                        status: client_1.OrderStatus.WASHING,
                    },
                });
                // Create order items
                yield tx.orderItem.createMany({
                    data: input.items.map((item) => ({
                        orderId,
                        laundryItemId: item.laundryItemId,
                        quantity: item.quantity,
                    })),
                });
                return updated;
            }));
            return order_query_service_1.orderQueryService.getOrderById(updatedOrder.id, outletId, false);
        });
    },
};
