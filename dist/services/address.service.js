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
exports.addressService = void 0;
const prisma_config_1 = __importDefault(require("../config/prisma.config"));
const app_error_1 = require("../utils/app-error");
exports.addressService = {
    // Get All Addresses for Logged User
    getUserAddresses(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const addresses = yield prisma_config_1.default.address.findMany({
                where: {
                    customerId: userId,
                    deletedAt: null, // Hanya ambil yang belum dihapus (Soft Delete)
                },
                orderBy: {
                    isPrimary: "desc", // Yang primary muncul paling atas
                },
            });
            return addresses;
        });
    },
    // Get Single Address Detail
    getAddressById(userId, addressId) {
        return __awaiter(this, void 0, void 0, function* () {
            const address = yield prisma_config_1.default.address.findFirst({
                where: {
                    id: addressId,
                    customerId: userId,
                    deletedAt: null,
                },
            });
            if (!address)
                throw (0, app_error_1.AppError)("Address not found", 404);
            return address;
        });
    },
    // Create New Address
    createAddress(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Gunakan transaction agar konsistensi data terjaga (terutama logic isPrimary)
            return yield prisma_config_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Jika user ingin menjadikan ini primary, set semua alamat lain jadi false dulu
                if (data.isPrimary) {
                    yield tx.address.updateMany({
                        where: { customerId: userId },
                        data: { isPrimary: false },
                    });
                }
                else {
                    // Jika ini alamat pertama user, paksa jadi primary
                    const count = yield tx.address.count({
                        where: { customerId: userId, deletedAt: null }
                    });
                    if (count === 0)
                        data.isPrimary = true;
                }
                const newAddress = yield tx.address.create({
                    data: Object.assign({ customerId: userId }, data),
                });
                return newAddress;
            }));
        });
    },
    // Update Address
    updateAddress(userId, addressId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Cek dulu apakah alamat milik user ini ada
            const existingAddress = yield prisma_config_1.default.address.findFirst({
                where: { id: addressId, customerId: userId, deletedAt: null },
            });
            if (!existingAddress)
                throw (0, app_error_1.AppError)("Address not found", 404);
            return yield prisma_config_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Logic isPrimary switch
                if (data.isPrimary === true) {
                    yield tx.address.updateMany({
                        where: { customerId: userId },
                        data: { isPrimary: false },
                    });
                }
                const updatedAddress = yield tx.address.update({
                    where: { id: addressId },
                    data: Object.assign({}, data),
                });
                return updatedAddress;
            }));
        });
    },
    // Set Primary Address (Shortcut)
    setPrimaryAddress(userId, addressId) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingAddress = yield prisma_config_1.default.address.findFirst({
                where: { id: addressId, customerId: userId, deletedAt: null },
            });
            if (!existingAddress)
                throw (0, app_error_1.AppError)("Address not found", 404);
            return yield prisma_config_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                // Unset semua
                yield tx.address.updateMany({
                    where: { customerId: userId },
                    data: { isPrimary: false }
                });
                // Set target
                return yield tx.address.update({
                    where: { id: addressId },
                    data: { isPrimary: true }
                });
            }));
        });
    },
    // Soft Delete Address
    deleteAddress(userId, addressId) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingAddress = yield prisma_config_1.default.address.findFirst({
                where: { id: addressId, customerId: userId, deletedAt: null },
            });
            if (!existingAddress)
                throw (0, app_error_1.AppError)("Address not found", 404);
            // Mencegah penghapusan alamat utama (opsional, tapi disarankan)
            if (existingAddress.isPrimary) {
                throw (0, app_error_1.AppError)("Cannot delete primary address. Please set another address as primary first.", 400);
            }
            yield prisma_config_1.default.address.update({
                where: { id: addressId },
                data: { deletedAt: new Date() }, // Soft delete
            });
        });
    },
};
