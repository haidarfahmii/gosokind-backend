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
exports.addressController = void 0;
const address_service_1 = require("../services/address.service");
exports.addressController = {
    getAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = res.locals.payload.userId;
            const addresses = yield address_service_1.addressService.getUserAddresses(userId);
            res.status(200).json({
                success: true,
                message: "Addresses retrieved successfully",
                data: addresses,
            });
        });
    },
    getOne(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = res.locals.payload.userId;
            const id = req.params.id;
            const address = yield address_service_1.addressService.getAddressById(userId, id);
            res.status(200).json({
                success: true,
                message: "Address retrieved successfully",
                data: address,
            });
        });
    },
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = res.locals.payload.userId;
            const result = yield address_service_1.addressService.createAddress(userId, req.body);
            res.status(201).json({
                success: true,
                message: "Address created successfully",
                data: result,
            });
        });
    },
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = res.locals.payload.userId;
            const id = req.params.id;
            const result = yield address_service_1.addressService.updateAddress(userId, id, req.body);
            res.status(200).json({
                success: true,
                message: "Address updated successfully",
                data: result,
            });
        });
    },
    setPrimary(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = res.locals.payload.userId;
            const id = req.params.id;
            const result = yield address_service_1.addressService.setPrimaryAddress(userId, id);
            res.status(200).json({
                success: true,
                message: "Address set as primary successfully",
                data: result,
            });
        });
    },
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = res.locals.payload.userId;
            const id = req.params.id;
            yield address_service_1.addressService.deleteAddress(userId, id);
            res.status(200).json({
                success: true,
                message: "Address deleted successfully",
            });
        });
    },
};
