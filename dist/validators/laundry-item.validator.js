"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllLaundryItemsValidator = exports.deleteLaundryItemValidator = exports.getLaundryItemByIdValidator = exports.updateLaundryItemValidator = exports.createLaundryItemValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createLaundryItemValidator = [
    (0, express_validator_1.body)("name")
        .notEmpty()
        .withMessage("Item name is required")
        .isString()
        .withMessage("Item name must be a string")
        .isLength({ min: 2, max: 100 })
        .withMessage("Item name must be between 2 and 100 characters")
        .trim(),
    (0, express_validator_1.body)("category")
        .optional()
        .isString()
        .withMessage("Category must be a string")
        .isLength({ max: 50 })
        .withMessage("Category must not exceed 50 characters")
        .trim()
        .isIn([
        "Atasan",
        "Bawahan",
        "Linen",
        "Bed Cover",
        "Boneka",
        "Sepatu",
        "Tas",
        "Aksesoris",
        "Lainnya",
    ])
        .withMessage("Category must be one of: Atasan, Bawahan, Linen, Bed Cover, Boneka, Sepatu, Tas, Aksesoris, Lainnya"),
    (0, express_validator_1.body)("unit")
        .optional()
        .isString()
        .withMessage("Unit must be a string")
        .isIn(["Pcs", "Kg", "Set", "Pasang"])
        .withMessage("Unit must be either Pcs, Kg, Set, or Pasang"),
    (0, express_validator_1.body)("basePrice")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Base price must be a positive number")
        .custom((value) => {
        // Validasi harga tidak terlalu kecil (min Rp 1000)
        if (value && value < 1000) {
            throw new Error("Base price must be at least Rp 1,000");
        }
        return true;
    }),
];
exports.updateLaundryItemValidator = [
    (0, express_validator_1.param)("id").notEmpty().withMessage("Laundry item ID is required"),
    (0, express_validator_1.body)("name")
        .optional()
        .isString()
        .withMessage("Item name must be a string")
        .isLength({ min: 2, max: 100 })
        .withMessage("Item name must be between 2 and 100 characters")
        .trim(),
    (0, express_validator_1.body)("category")
        .optional()
        .isString()
        .withMessage("Category must be a string")
        .isLength({ max: 50 })
        .withMessage("Category must not exceed 50 characters")
        .trim()
        .isIn([
        "Atasan",
        "Bawahan",
        "Linen",
        "Bed Cover",
        "Boneka",
        "Sepatu",
        "Tas",
        "Aksesoris",
        "Lainnya",
    ])
        .withMessage("Category must be one of: Atasan, Bawahan, Linen, Bed Cover, Boneka, Sepatu, Tas, Aksesoris, Lainnya"),
    (0, express_validator_1.body)("unit")
        .optional()
        .isString()
        .withMessage("Unit must be a string")
        .isIn(["Pcs", "Kg", "Set", "Pasang"])
        .withMessage("Unit must be either Pcs, Kg, Set, or Pasang"),
    (0, express_validator_1.body)("basePrice")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Base price must be a positive number")
        .custom((value) => {
        if (value && value < 1000) {
            throw new Error("Base price must be at least Rp 1,000");
        }
        return true;
    }),
];
exports.getLaundryItemByIdValidator = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage("Laundry item ID is required")
        .isString()
        .withMessage("ID must be a valid string"),
];
exports.deleteLaundryItemValidator = [
    (0, express_validator_1.param)("id")
        .notEmpty()
        .withMessage("Laundry item ID is required")
        .isString()
        .withMessage("ID must be a valid string"),
];
exports.getAllLaundryItemsValidator = [
    (0, express_validator_1.query)("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),
    (0, express_validator_1.query)("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),
    (0, express_validator_1.query)("search")
        .optional()
        .isString()
        .withMessage("Search must be a string")
        .trim(),
    (0, express_validator_1.query)("category")
        .optional()
        .isString()
        .withMessage("Category must be a string")
        .trim(),
    (0, express_validator_1.query)("sortBy")
        .optional()
        .isIn(["name", "category", "basePrice", "createdAt"])
        .withMessage("Sort by must be one of: name, category, basePrice, createdAt"),
    (0, express_validator_1.query)("sortOrder")
        .optional()
        .isIn(["asc", "desc"])
        .withMessage("Sort order must be either asc or desc"),
];
