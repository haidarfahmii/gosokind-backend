import fs from "fs/promises";
import path from "path";
import Handlebars from "handlebars";
import { transporter } from "../config/nodemailer.config";
import { GOOGLE_APP_ACCOUNT } from "../config/index.config";

interface SendMailOptions {
    to: string;
    subject: string;
    template: string; // Nama file di folder templates/emails/
    context: any; // Data dinamis
}

export const mailService = {
    async sendMail({ to, subject, template, context }: SendMailOptions) {
        // Resolve path (gunakan process.cwd() agar aman saat build)
        const templatePath = path.join(
            process.cwd(),
            "src/templates/emails",
            template
        );

        // Baca & Compile
        const htmlSource = await fs.readFile(templatePath, "utf-8");
        const compiledTemplate = Handlebars.compile(htmlSource);
        const html = compiledTemplate(context);

        // Kirim
        await transporter.sendMail({
            from: GOOGLE_APP_ACCOUNT,
            to,
            subject,
            html,
        });
        console.log(`📧 Email sent to ${to}: ${subject}`);
    },
};
