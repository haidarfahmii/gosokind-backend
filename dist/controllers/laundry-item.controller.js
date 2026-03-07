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
exports.laundryItemController = void 0;
const laundry_item_service_1 = require("../services/laundry-item.service");
exports.laundryItemController = {
    createLaundryItem(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = req.body;
            const item = yield laundry_item_service_1.laundryItemService.createLaundryItem(input);
            res.status(201).json({
                success: true,
                message: "Laundry item created successfully",
                data: item,
            });
        });
    },
    getAllLaundryItems(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page, limit, search, category, sortBy, sortOrder } = req.query;
            const query = {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                search: search,
                category: category,
                sortBy: sortBy,
                sortOrder: sortOrder,
            };
            const result = yield laundry_item_service_1.laundryItemService.getAllLaundryItems(query);
            res.status(200).json(Object.assign({ success: true, message: "Laundry items retrieved successfully" }, result));
        });
    },
    getLaundryItemById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const item = yield laundry_item_service_1.laundryItemService.getLaundryItemById(id);
            res.status(200).json({
                success: true,
                message: "Laundry item retrieved successfully",
                data: item,
            });
        });
    },
    updateLaundryItem(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const input = req.body;
            const item = yield laundry_item_service_1.laundryItemService.updateLaundryItem(id, input);
            res.status(200).json({
                success: true,
                message: "Laundry item updated successfully",
                data: item,
            });
        });
    },
    deleteLaundryItem(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            yield laundry_item_service_1.laundryItemService.deleteLaundryItem(id);
            res.status(200).json({
                success: true,
                message: "Laundry item deleted successfully",
            });
        });
    },
    getCategories(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const categories = yield laundry_item_service_1.laundryItemService.getCategories();
            res.status(200).json({
                success: true,
                message: "Categories retrieved successfully",
                data: categories,
            });
        });
    },
    getPopularItems(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const items = yield laundry_item_service_1.laundryItemService.getPopularItems(limit);
            res.status(200).json({
                success: true,
                message: "Popular items retrieved successfully",
                data: items,
            });
        });
    },
};
