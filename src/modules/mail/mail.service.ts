import fs from "fs/promises";
import path, { dirname } from "path";
import handlebars from "handlebars";
import nodemailer, { Transporter } from "nodemailer";
import { fileURLToPath } from "url";

export class MailService {
  private transporter: Transporter;
  private templateDir: string;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    this.templateDir = path.resolve(__dirname, "./templates");

    this.transporter = nodemailer.createTransport({
      // fleksibel: bisa gmail ATAU SMTP
      service: process.env.MAIL_SERVICE || undefined,
      host: process.env.SMTP_HOST || undefined,
      port: process.env.SMTP_PORT
        ? parseInt(process.env.SMTP_PORT)
        : undefined,
      auth: {
        user: process.env.MAIL_USER || process.env.SMTP_USER,
        pass: process.env.MAIL_PASSWORD || process.env.SMTP_PASS,
      },
    });
  }

  private renderTemplate = async (templateName: string, context: object) => {
    try {
      const templatePath = path.join(
        this.templateDir,
        `${templateName}.hbs`
      );

      const source = await fs.readFile(templatePath, "utf-8");
      const compiled = handlebars.compile(source);

      return compiled(context);
    } catch (err) {
      console.warn(`Template ${templateName} tidak ditemukan`);
      return null;
    }
  };

  sendEmail = async (
    to: string,
    subject: string,
    templateName: string,
    context: object,
    fallbackHtml?: string
  ) => {
    let html = await this.renderTemplate(templateName, context);

    if (!html && fallbackHtml) {
      html = fallbackHtml;
    }

    if (!html) {
      throw new Error("Email content tidak tersedia");
    }

    await this.transporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        process.env.MAIL_USER ||
        '"No Reply" <no-reply@example.com>',
      to,
      subject,
      html,
    });
  };

  // ============================
  // FEATURE: RESET PASSWORD
  // ============================
  sendResetPasswordEmail = async (email: string, token: string) => {
    const resetUrl = `${
      process.env.APP_URL || "http://localhost:3000"
    }/reset-password?token=${token}`;

    const fallbackHtml = `
      <p>Anda meminta reset password.</p>
      <a href="${resetUrl}">${resetUrl}</a>
    `;

    await this.sendEmail(
      email,
      "Reset Password",
      "reset-password",
      { resetUrl, email },
      fallbackHtml
    );
  };

  // ============================
  // FEATURE: VERIFICATION
  // ============================
  sendVerificationEmail = async (email: string, token: string) => {
    const verifyUrl = `${
      process.env.APP_URL || "http://localhost:3000"
    }/verify-email?token=${token}`;

    const fallbackHtml = `
      <p>Silakan verifikasi email Anda:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
    `;

    await this.sendEmail(
      email,
      "Email Verification",
      "verification",
      { verifyUrl, email },
      fallbackHtml
    );
  };
}