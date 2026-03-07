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
exports.employeeAuthService = void 0;
const prisma_config_1 = __importDefault(require("../config/prisma.config"));
const app_error_1 = require("../utils/app-error");
const jwt_util_1 = require("../utils/jwt.util");
const bcrypt_1 = __importDefault(require("bcrypt"));
const index_config_1 = require("../config/index.config");
exports.employeeAuthService = {
    // Login untuk Employee (Admin, Worker, Driver)
    login(input) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { email, password } = input;
            // Cari employee
            const employee = yield prisma_config_1.default.employee.findUnique({
                where: { email, deletedAt: null },
                include: {
                    outlet: true,
                },
            });
            if (!employee) {
                throw (0, app_error_1.AppError)("Invalid email or password", 401);
            }
            // Validasi password
            const isPasswordValid = yield bcrypt_1.default.compare(password, employee.password);
            if (!isPasswordValid) {
                throw (0, app_error_1.AppError)("Invalid email or password", 401);
            }
            // Generate token
            const token = yield (0, jwt_util_1.createToken)({
                userId: employee.id,
                email: employee.email,
                role: employee.role,
                outletId: employee.outletId,
            }, index_config_1.JWT_SECRET, {
                expiresIn: "24h",
            });
            return {
                token,
                user: {
                    id: employee.id,
                    fullName: employee.fullName,
                    email: employee.email,
                    role: employee.role,
                    avatarUrl: employee.avatarUrl,
                    outletId: employee.outletId,
                    outletName: (_a = employee.outlet) === null || _a === void 0 ? void 0 : _a.name,
                },
            };
        });
    },
};
