"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(error, _req, res, _next) {
    // Log error untuk debugging
    console.error("❌ [Error]:", error.message);
    if (process.env.NODE_ENV === "development") {
        console.error("Stack:", error.stack);
    }
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    res.status(statusCode).json(Object.assign({ success: false, message }, (process.env.NODE_ENV === "development" && { stack: error.stack })));
}
