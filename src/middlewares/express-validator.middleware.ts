import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { AppError } from "../utils/app-error";

export function expressValidator(
    req: Request,
    _res: Response,
    next: NextFunction
) {
    const result = validationResult(req);

    if (!result?.isEmpty()) {
        // Mengambil pesan error pertama untuk di tampilkan
        const errorMessage = result.array()[0].msg;
        throw AppError(errorMessage, 422);
    }

    next();
}
