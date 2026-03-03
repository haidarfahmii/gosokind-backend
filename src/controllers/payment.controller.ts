import { Request, Response } from "express";
import { paymentService } from "../services/payment.service";

export const paymentController = {
    async createPayment(req: Request, res: Response) {
        const { orderId } = req.params;

        const result = await paymentService.createPayment(orderId as string);

        res.status(200).json({
            success: true,
            message: "Payment URL generated successfully",
            data: result,
        });
    },

    async handleWebhook(req: Request, res: Response) {
        const notificationJson = req.body;

        await paymentService.handleWebhook(notificationJson);

        res.status(200).json({
            success: true,
            message: "Payment has been paid successfully",
        });
    },
};