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
exports.employeeAuthController = void 0;
const employee_auth_service_1 = require("../services/employee-auth.service");
exports.employeeAuthController = {
    login(req, res, _next) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = req.body;
            const result = yield employee_auth_service_1.employeeAuthService.login(input);
            res.status(200).json({
                success: true,
                message: "Login successful",
                data: result,
            });
        });
    },
};
