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
exports.employeeController = void 0;
const employee_service_1 = require("../services/employee.service");
exports.employeeController = {
    createEmployee(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = req.body;
            const scopedOutletId = res.locals.scopedOutletId;
            const isSuperAdmin = res.locals.isSuperAdmin;
            const employee = yield employee_service_1.employeeService.createEmployee(input, scopedOutletId, isSuperAdmin);
            res.status(201).json({
                success: true,
                message: "Employee created successfully",
                data: employee,
            });
        });
    },
    getAllEmployees(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page, limit, role, outletId, search, isActive } = req.query;
            const scopedOutletId = res.locals.scopedOutletId;
            const isSuperAdmin = res.locals.isSuperAdmin;
            const query = {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                role: role,
                outletId: outletId,
                search: search,
                isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
            };
            const result = yield employee_service_1.employeeService.getAllEmployees(query, scopedOutletId, isSuperAdmin);
            res.status(200).json(Object.assign({ success: true, message: "Employees retrieved successfully" }, result));
        });
    },
    getEmployeeStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const scopedOutletId = res.locals.scopedOutletId;
            const isSuperAdmin = res.locals.isSuperAdmin;
            const result = yield employee_service_1.employeeService.getEmployeeStats(scopedOutletId, isSuperAdmin);
            res.status(200).json({
                success: true,
                message: "Employee stats retrieved successfully",
                data: result,
            });
        });
    },
    getEmployeeById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const scopedOutletId = res.locals.scopedOutletId;
            const isSuperAdmin = res.locals.isSuperAdmin;
            const employee = yield employee_service_1.employeeService.getEmployeeById(id, scopedOutletId, isSuperAdmin);
            res.status(200).json({
                success: true,
                message: "Employee retrieved successfully",
                data: employee,
            });
        });
    },
    updateEmployee(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const input = req.body;
            const scopedOutletId = res.locals.scopedOutletId;
            const isSuperAdmin = res.locals.isSuperAdmin;
            const employee = yield employee_service_1.employeeService.updateEmployee(id, input, scopedOutletId, isSuperAdmin);
            res.status(200).json({
                success: true,
                message: "Employee updated successfully",
                data: employee,
            });
        });
    },
    deleteEmployee(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            yield employee_service_1.employeeService.deleteEmployee(id);
            res.status(200).json({
                success: true,
                message: "Employee deleted successfully",
            });
        });
    },
    getAllCustomers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page, limit, search } = req.query;
            const query = {
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                search: search,
            };
            const result = yield employee_service_1.employeeService.getAllCustomers(query);
            res.status(200).json(Object.assign({ success: true, message: "Customers retrieved successfully" }, result));
        });
    },
    toggleEmployeeStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { isActive } = req.body;
            const scopedOutletId = res.locals.scopedOutletId;
            const isSuperAdmin = res.locals.isSuperAdmin;
            const employee = yield employee_service_1.employeeService.toggleEmployeeStatus(id, isActive, scopedOutletId, isSuperAdmin);
            res.status(200).json({
                success: true,
                message: `Employee ${isActive ? "activated" : "deactivated"} successfully`,
                data: employee,
            });
        });
    },
    getEmployeeHistory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const scopedOutletId = res.locals.scopedOutletId;
            const isSuperAdmin = res.locals.isSuperAdmin;
            const result = yield employee_service_1.employeeService.getEmployeeHistory(id, page, limit, scopedOutletId, isSuperAdmin);
            res.status(200).json(Object.assign({ success: true, message: "Employee history retrieved successfully" }, result));
        });
    },
};
