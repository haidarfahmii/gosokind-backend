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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const handlebars_1 = __importDefault(require("handlebars"));
const nodemailer_config_1 = require("../config/nodemailer.config");
const index_config_1 = require("../config/index.config");
exports.mailService = {
    sendMail(_a) {
        return __awaiter(this, arguments, void 0, function* ({ to, subject, template, context }) {
            // Resolve path (gunakan process.cwd() agar aman saat build)
            const templatePath = path_1.default.join(process.cwd(), "src/templates/emails", template);
            // Baca & Compile
            const htmlSource = yield promises_1.default.readFile(templatePath, "utf-8");
            const compiledTemplate = handlebars_1.default.compile(htmlSource);
            const html = compiledTemplate(context);
            // Kirim
            yield nodemailer_config_1.transporter.sendMail({
                from: index_config_1.GOOGLE_APP_ACCOUNT,
                to,
                subject,
                html,
            });
            console.log(`📧 Email sent to ${to}: ${subject}`);
        });
    },
};
