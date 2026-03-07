"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const index_config_1 = require("./index.config");
cloudinary_1.v2.config({
    cloud_name: index_config_1.CLOUDINARY_CLOUD_NAME,
    api_key: index_config_1.CLOUDINARY_API_KEY,
    api_secret: index_config_1.CLOUDINARY_API_SECRET,
});
exports.default = cloudinary_1.v2;
