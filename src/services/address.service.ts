import prisma from "../config/prisma.config";
import { AppError } from "../utils/app-error";
import { CreateAddressInput } from "../@types";

interface UpdateAddressInput extends Partial<CreateAddressInput> { }

export const addressService = {
    // Get All Addresses for Logged User
    async getUserAddresses(userId: string) {
        const addresses = await prisma.address.findMany({
            where: {
                customerId: userId,
                deletedAt: null, // Hanya ambil yang belum dihapus (Soft Delete)
            },
            orderBy: {
                isPrimary: "desc", // Yang primary muncul paling atas
            },
        });
        return addresses;
    },

    // Get Single Address Detail
    async getAddressById(userId: string, addressId: string) {
        const address = await prisma.address.findFirst({
            where: {
                id: addressId,
                customerId: userId,
                deletedAt: null,
            },
        });

        if (!address) throw AppError("Address not found", 404);
        return address;
    },

    // Create New Address
    async createAddress(userId: string, data: CreateAddressInput) {
        // Gunakan transaction agar konsistensi data terjaga (terutama logic isPrimary)
        return await prisma.$transaction(async (tx) => {
            // Jika user ingin menjadikan ini primary, set semua alamat lain jadi false dulu
            if (data.isPrimary) {
                await tx.address.updateMany({
                    where: { customerId: userId },
                    data: { isPrimary: false },
                });
            } else {
                // Jika ini alamat pertama user, paksa jadi primary
                const count = await tx.address.count({
                    where: { customerId: userId, deletedAt: null }
                });
                if (count === 0) data.isPrimary = true;
            }

            const newAddress = await tx.address.create({
                data: {
                    customerId: userId,
                    ...data,
                },
            });

            return newAddress;
        });
    },

    // Update Address
    async updateAddress(userId: string, addressId: string, data: UpdateAddressInput) {
        // Cek dulu apakah alamat milik user ini ada
        const existingAddress = await prisma.address.findFirst({
            where: { id: addressId, customerId: userId, deletedAt: null },
        });

        if (!existingAddress) throw AppError("Address not found", 404);

        return await prisma.$transaction(async (tx) => {
            // Logic isPrimary switch
            if (data.isPrimary === true) {
                await tx.address.updateMany({
                    where: { customerId: userId },
                    data: { isPrimary: false },
                });
            }

            const updatedAddress = await tx.address.update({
                where: { id: addressId },
                data: { ...data },
            });

            return updatedAddress;
        });
    },

    // Set Primary Address (Shortcut)
    async setPrimaryAddress(userId: string, addressId: string) {
        const existingAddress = await prisma.address.findFirst({
            where: { id: addressId, customerId: userId, deletedAt: null },
        });

        if (!existingAddress) throw AppError("Address not found", 404);

        return await prisma.$transaction(async (tx) => {
            // Unset semua
            await tx.address.updateMany({
                where: { customerId: userId },
                data: { isPrimary: false }
            });

            // Set target
            return await tx.address.update({
                where: { id: addressId },
                data: { isPrimary: true }
            });
        });
    },

    // Soft Delete Address
    async deleteAddress(userId: string, addressId: string) {
        const existingAddress = await prisma.address.findFirst({
            where: { id: addressId, customerId: userId, deletedAt: null },
        });

        if (!existingAddress) throw AppError("Address not found", 404);

        // Mencegah penghapusan alamat utama (opsional, tapi disarankan)
        if (existingAddress.isPrimary) {
            throw AppError("Cannot delete primary address. Please set another address as primary first.", 400);
        }

        await prisma.address.update({
            where: { id: addressId },
            data: { deletedAt: new Date() }, // Soft delete
        });
    },
};