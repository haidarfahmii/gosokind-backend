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

    async verify(req: Request, res: Response) {
        const { fullName, password } = req.body;
        const { userId } = res?.locals?.payload;

        await authService.verify({ userId, fullName, password });

        res.status(200).json({
            success: true,
            message: "Verify account successfully",
            data: {
                fullName,
                password
            }
        })
    },

    async login(req: Request, res: Response) {
        const { email, password } = req.body;

        const user = await authService.login({ email, password })

        res.status(200).json({
            success: true,
            message: "Login successfully",
            data: user
        })
    },

    async forgotPassword(req: Request, res: Response) {
        const { email } = req.body;
        const data = await authService.forgotPassword(email);

        res.status(200).json({
            success: true,
            message: "Forgot password link has been sent to your email",
            data: {
                email: email,
                token: data.token
            }
        })
    },

    async resetPassword(req: Request, res: Response) {
        const { password } = req.body;
        const { userId } = res?.locals?.payload;

        await authService.resetPassword(userId, password);

        res.status(200).json({
            success: true,
            message: "Password has been reset successfully",
            data: {
                userId,
                password
            }
        })
    },

    async checkToken(req: Request, res: Response) {
        // Jika request sampai di sini, berarti sudah lolos middleware verifyToken
        // Artinya token valid & tidak expired
        res.status(200).json({
            success: true,
            message: "Token is valid",
        });
    },
}