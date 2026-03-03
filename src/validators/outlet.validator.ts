import { body, param, query } from "express-validator";

export const createOutletValidator = [
  body("name")
    .notEmpty()
    .withMessage("Outlet name is required")
    .isString()
    .withMessage("Outlet name must be a string")
    .isLength({ min: 3, max: 100 })
    .withMessage("Outlet name must be between 3 and 100 characters"),

  body("province")
    .optional()
    .isString()
    .withMessage("Province must be a string"),

  body("city").optional().isString().withMessage("City must be a string"),

  body("status")
    .optional()
    .isIn(["AVAILABLE", "MAINTENANCE"])
    .withMessage("Status must be either AVAILABLE or MAINTENANCE"),

  body("address")
    .notEmpty()
    .withMessage("Address is required")
    .isString()
    .withMessage("Address must be a string")
    .isLength({ min: 10 })
    .withMessage("Address must be at least 10 characters"),

  body("latitude")
    .notEmpty()
    .withMessage("Latitude is required. Please pick a location on the map.")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("longitude")
    .notEmpty()
    .withMessage("Longitude is required. Please pick a location on the map.")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
];

export const updateOutletValidator = [
  param("id")
    .notEmpty()
    .withMessage("Outlet ID is required")
    .isString()
    .withMessage("Outlet ID must be a string"),

  body("name")
    .optional()
    .isString()
    .withMessage("Outlet name must be a string")
    .isLength({ min: 3, max: 100 })
    .withMessage("Outlet name must be between 3 and 100 characters"),

  body("province")
    .optional()
    .isString()
    .withMessage("Province must be a string"),

  body("city").optional().isString().withMessage("City must be a string"),

  body("status")
    .optional()
    .isIn(["AVAILABLE", "MAINTENANCE"])
    .withMessage("Status must be either AVAILABLE or MAINTENANCE"),

  body("address")
    .optional()
    .isString()
    .withMessage("Address must be a string")
    .isLength({ min: 10 })
    .withMessage("Address must be at least 10 characters"),

  body("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),

  // Validasi: koordinat harus lengkap (latitude & longitude)
  body("latitude").custom((value, { req }) => {
    if (value && !req.body.longitude) {
      throw new Error("Longitude is required when latitude is provided");
    }
    return true;
  }),

  body("longitude").custom((value, { req }) => {
    if (value && !req.body.latitude) {
      throw new Error("Latitude is required when longitude is provided");
    }
    return true;
  }),
];

export const deleteOutletValidator = [
  param("id")
    .notEmpty()
    .withMessage("Outlet ID is required")
    .isString()
    .withMessage("Outlet ID must be a string"),
];

export const getOutletByIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("Outlet ID is required")
    .isString()
    .withMessage("Outlet ID must be a string"),
];

export const getAllOutletsValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("search").optional().isString().withMessage("Search must be a string"),
];

export const calculateShippingValidator = [
  param("outletId")
    .notEmpty()
    .withMessage("Outlet ID is required")
    .isString()
    .withMessage("Outlet ID must be a string"),

  body("latitude")
    .notEmpty()
    .withMessage("Latitude is required")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("longitude")
    .notEmpty()
    .withMessage("Longitude is required")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
];
