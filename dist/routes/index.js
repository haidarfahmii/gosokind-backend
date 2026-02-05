"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const worker_route_1 = __importDefault(require("./worker.route"));
const driver_route_1 = __importDefault(require("./driver.route"));
const attendance_route_1 = __importDefault(require("./attendance.route"));
const router = (0, express_1.Router)();
router.use("/worker", worker_route_1.default);
router.use("/driver", driver_route_1.default);
router.use("/attendance", attendance_route_1.default);
exports.default = router;
