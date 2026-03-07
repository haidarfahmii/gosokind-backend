"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_route_1 = __importDefault(require("./routers/auth.route"));
const profile_route_1 = __importDefault(require("./routers/profile.route"));
const address_route_1 = __importDefault(require("./routers/address.route"));
const error_handler_middleware_1 = require("./middlewares/error.handler.middleware");
const index_config_1 = require("./config/index.config");
const cors_options_middleware_1 = require("./middlewares/cors.options.middleware");
const employee_auth_route_1 = __importDefault(require("./routers/employee-auth.route"));
const employee_route_1 = __importDefault(require("./routers/employee.route"));
const outlet_route_1 = __importDefault(require("./routers/outlet.route"));
const laundry_item_route_1 = __importDefault(require("./routers/laundry-item.route"));
const order_route_1 = __importDefault(require("./routers/order.route"));
const customer_order_route_1 = __importDefault(require("./routers/customer-order.route"));
const report_route_1 = __importDefault(require("./routers/report.route"));
const attendance_route_1 = __importDefault(require("./routers/attendance.route"));
const driver_route_1 = __importDefault(require("./routers/driver.route"));
const worker_route_1 = __importDefault(require("./routers/worker.route"));
const notification_route_1 = __importDefault(require("./routers/notification.route"));
const payment_route_1 = __importDefault(require("./routers/payment.route"));
const dotenv_1 = __importDefault(require("dotenv"));
const cron_util_1 = require("./utils/cron.util");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(cors_options_middleware_1.corsOptions);
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.send("Gosokind App API is Running 🚀");
});
app.use("/api/auth", auth_route_1.default);
app.use("/api/profile", profile_route_1.default);
app.use("/api/addresses", address_route_1.default);
app.use("/api/auth/employee", employee_auth_route_1.default);
app.use("/api/employees", employee_route_1.default);
app.use("/api/outlets", outlet_route_1.default);
app.use("/api/laundry-items", laundry_item_route_1.default);
app.use("/api/orders", order_route_1.default);
app.use("/api/customer/orders", customer_order_route_1.default);
app.use("/api/reports", report_route_1.default);
// Drive + Worker
app.use("/api/attendance", attendance_route_1.default);
app.use("/api/driver", driver_route_1.default);
app.use("/api/worker", worker_route_1.default);
app.use("/api/notifications", notification_route_1.default);
app.use("/api/payment", payment_route_1.default);
// Middleware (Application Level)
app.use((err, _req, res, _next) => {
    const statusCode = (err === null || err === void 0 ? void 0 : err.statusCode) ? err === null || err === void 0 ? void 0 : err.statusCode : 500;
    const message = (err === null || err === void 0 ? void 0 : err.isOperational) ? err === null || err === void 0 ? void 0 : err.message : "Something went wrong!";
    // Log error untuk debugging di server
    console.error("❌ Error:", err);
    // Handle Prisma Validation / Database Errors
    if (err.code === "P2002") {
        // Unique constraint violation
        return res.status(409).json({
            success: false,
            message: "Data already exists (Unique constraint violation)",
            data: null,
        });
    }
    res.status(statusCode).json({
        success: false,
        message,
        data: null,
    });
});
// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.method} ${req.path} not found`,
    });
});
(0, cron_util_1.startCronJobs)();
// Global Error Handler (must be last)
app.use(error_handler_middleware_1.errorHandler);
app.listen(index_config_1.PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${index_config_1.PORT}`);
});
exports.default = app;
