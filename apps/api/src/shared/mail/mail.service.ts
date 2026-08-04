import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  // Lazily built so a missing SMTP config doesn't fail app startup — only
  // fails the first time something actually tries to send an email.
  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    const host = this.config.get<string>('mail.host');
    const user = this.config.get<string>('mail.user');
    const password = this.config.get<string>('mail.password');
    const fromEmail = this.config.get<string>('mail.fromEmail');

    if (!host || !user || !password || !fromEmail) {
      throw new Error(
        'SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASSWORD/SMTP_FROM_EMAIL) — cannot send email',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: this.config.get<number>('mail.port'),
      secure: this.config.get<boolean>('mail.secure'),
      auth: { user, pass: password },
    });

    return this.transporter;
  }

  async sendOtpEmail(
    email: string,
    code: string,
    expiresInMinutes: number,
  ): Promise<void> {
    const fromEmail = this.config.getOrThrow<string>('mail.fromEmail');
    const fromName = this.config.get<string>('mail.fromName');

    await this.getTransporter().sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: `Your careers.lk sign-in code: ${code}`,
      text: `Your sign-in code is ${code}. It expires in ${expiresInMinutes} minutes. If you didn't request this, you can ignore this email.`,
      html: `<p>Your sign-in code is <strong>${code}</strong>.</p><p>It expires in ${expiresInMinutes} minutes. If you didn't request this, you can ignore this email.</p>`,
    });

    this.logger.log(`Sent OTP email to ${email}`);
  }
}
