"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressValidator = expressValidator;
const express_validator_1 = require("express-validator");
const app_error_1 = require("../utils/app-error");
function expressValidator(req, _res, next) {
    const result = (0, express_validator_1.validationResult)(req);
    if (!(result === null || result === void 0 ? void 0 : result.isEmpty())) {
        // Mengambil pesan error pertama untuk di tampilkan
        const errorMessage = result.array()[0].msg;
        throw (0, app_error_1.AppError)(errorMessage, 422);
    }
    next();
}
