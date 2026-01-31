import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";

export const authController = {
    async register(req: Request, res: Response) {
        const { email } = req.body;

        const data = await authService.register({ email });

        res.status(200).json({
            success: true,
            message: "Register account successfully",
            data: {
                email: email,
                token: data.token
            }
        })
    },

    async verify(req: Request, res:Response) {
        const { fullName, password } = req.body;
        const token  = req.query.token as string;

        await authService.verify({ token, fullName, password });

        res.status(200).json({
            success: true,
            message: "Verify account successfully",
            data: {
                fullName,
                password
            }
        })
    }
}