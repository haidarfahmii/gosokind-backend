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
exports.outletController = void 0;
const outlet_service_1 = require("../services/outlet.service");
exports.outletController = {
    getAllOutlets(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search;
            const scopedOutletId = res.locals.scopedOutletId;
            const isSuperAdmin = res.locals.isSuperAdmin;
            const result = yield outlet_service_1.outletService.getAllOutlets(page, limit, search, scopedOutletId, isSuperAdmin);
            res.status(200).json({
                success: true,
                message: "Outlets retrieved successfully",
                data: result.outlets,
                pagination: result.pagination,
            });
        });
    },
    getAllOutletsForDropdown(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const scopedOutletId = res.locals.scopedOutletId;
            const isSuperAdmin = res.locals.isSuperAdmin;
            const outlets = yield outlet_service_1.outletService.getAllOutletsForDropdown(scopedOutletId, isSuperAdmin);
            res.status(200).json({
                success: true,
                message: "Outlets for dropdown retrieved successfully",
                data: outlets,
            });
        });
    },
    getOutletById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const scopedOutletId = res.locals.scopedOutletId;
            const isSuperAdmin = res.locals.isSuperAdmin;
            const outlet = yield outlet_service_1.outletService.getOutletById(id, scopedOutletId, isSuperAdmin);
            res.status(200).json({
                success: true,
                message: "Outlet retrieved successfully",
                data: outlet,
            });
        });
    },
    createOutlet(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, province, city, address, latitude, longitude, status } = req.body;
            const outlet = yield outlet_service_1.outletService.createOutlet({
                name,
                province,
                city,
                address,
                latitude,
                longitude,
                status,
            });
            res.status(201).json({
                success: true,
                message: "Outlet created successfully",
                data: outlet,
            });
        });
    },
    updateOutlet(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { name, province, city, address, latitude, longitude, status } = req.body;
            const outlet = yield outlet_service_1.outletService.updateOutlet(id, {
                name,
                province,
                city,
                address,
                latitude,
                longitude,
                status,
            });
            res.status(200).json({
                success: true,
                message: "Outlet updated successfully",
                data: outlet,
            });
        });
    },
    deleteOutlet(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const outlet = yield outlet_service_1.outletService.deleteOutlet(id);
            res.status(200).json({
                success: true,
                message: "Outlet deleted successfully",
                data: outlet,
            });
        });
    },
    calculateShipping(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { outletId } = req.params;
            const { latitude, longitude } = req.body;
            const scopedOutletId = res.locals.scopedOutletId;
            const isSuperAdmin = res.locals.isSuperAdmin;
            const result = yield outlet_service_1.outletService.calculateShipping(outletId, latitude, longitude, scopedOutletId, isSuperAdmin);
            res.status(200).json({
                success: true,
                message: "Shipping cost calculated successfully",
                data: result,
            });
        });
    },
};
