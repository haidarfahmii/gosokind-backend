"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = corsOptions;
const cors_1 = __importDefault(require("cors"));
const index_config_1 = require("../config/index.config");
function corsOptions(req, res, next) {
    const nextAuthSecretKey = req === null || req === void 0 ? void 0 : req.headers["next-auth-secret-key"];
    // terima request dari NextAuth dengan secret key
    if (nextAuthSecretKey === index_config_1.NEXT_AUTH_SECRET_KEY) {
        return next();
    }
    // apply CORS untuk request lain
    return (0, cors_1.default)({
        origin(requestOrigin, callback) {
            if (!requestOrigin || index_config_1.WHITELIST.indexOf(requestOrigin) !== -1) {
                callback(null, true);
            }
            else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })(req, res, next);
}
