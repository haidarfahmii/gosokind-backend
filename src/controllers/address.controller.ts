import { Request, Response } from "express";
import { addressService } from "../services/address.service";

export const addressController = {
    async getAll(req: Request, res: Response) {
        const userId = res.locals.payload.userId;
        const addresses = await addressService.getUserAddresses(userId);

        res.status(200).json({
            success: true,
            message: "Addresses retrieved successfully",
            data: addresses,
        });
    },

    async getOne(req: Request, res: Response) {
        const userId = res.locals.payload.userId;
        const id  = req.params.id as string;
        const address = await addressService.getAddressById(userId, id);

        res.status(200).json({
            success: true,
            message: "Address retrieved successfully",
            data: address,
        });
    },

    async create(req: Request, res: Response) {
        const userId = res.locals.payload.userId;
        const result = await addressService.createAddress(userId, req.body);

        res.status(201).json({
            success: true,
            message: "Address created successfully",
            data: result,
        });
    },

    async update(req: Request, res: Response) {
        const userId = res.locals.payload.userId;
        const id  = req.params.id as string;
        const result = await addressService.updateAddress(userId, id, req.body);

        res.status(200).json({
            success: true,
            message: "Address updated successfully",
            data: result,
        });
    },

    async setPrimary(req: Request, res: Response) {
        const userId = res.locals.payload.userId;
        const id  = req.params.id as string;
        const result = await addressService.setPrimaryAddress(userId, id);

        res.status(200).json({
            success: true,
            message: "Address set as primary successfully",
            data: result,
        });
    },

    async delete(req: Request, res: Response) {
        const userId = res.locals.payload.userId;
        const id  = req.params.id as string;
        await addressService.deleteAddress(userId, id);

        res.status(200).json({
            success: true,
            message: "Address deleted successfully",
        });
    },
};