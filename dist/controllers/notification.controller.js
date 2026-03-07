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
exports.notificationController = void 0;
exports.notificationController = {
    getNotifications(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Mock data - replace with DB call when notification model is added to schema
            const mockNotifications = [
                {
                    id: "1",
                    title: "Welcome to Gosokind",
                    message: "Your account has been successfully created.",
                    createdAt: new Date().toISOString(),
                    read: false,
                },
                {
                    id: "2",
                    title: "System Update",
                    message: "Maintenance scheduled for Sunday 2 AM.",
                    createdAt: new Date(Date.now() - 86400000).toISOString(),
                    read: true,
                },
            ];
            res.status(200).json({
                success: true,
                data: mockNotifications,
            });
        });
    },
};
