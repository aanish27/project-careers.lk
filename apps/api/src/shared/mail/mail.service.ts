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

  async sendNewMessageEmail(
    email: string,
    recipientName: string,
    senderName: string,
    messagePreview: string,
    conversationUrl: string,
  ): Promise<void> {
    const fromEmail = this.config.getOrThrow<string>('mail.fromEmail');
    const fromName = this.config.get<string>('mail.fromName');
    const preview =
      messagePreview.length > 200
        ? `${messagePreview.slice(0, 200)}…`
        : messagePreview;

    await this.getTransporter().sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: `New message from ${senderName} on careers.lk`,
      text: `Hi ${recipientName}, ${senderName} sent you a message: "${preview}". View it here: ${conversationUrl}`,
      html: `<p>Hi ${recipientName},</p><p><strong>${senderName}</strong> sent you a message:</p><blockquote>${preview}</blockquote><p><a href="${conversationUrl}">View conversation</a></p>`,
    });

    this.logger.log(`Sent new-message email to ${email}`);
  }

  async sendTrustGrantedEmail(
    email: string,
    companyName: string,
  ): Promise<void> {
    const fromEmail = this.config.getOrThrow<string>('mail.fromEmail');
    const fromName = this.config.get<string>('mail.fromName');

    await this.getTransporter().sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: `${companyName} is now trusted on careers.lk`,
      text: `Good news — ${companyName} has been granted auto-approval on careers.lk. Future job postings from your company will go live immediately without manual review.`,
      html: `<p>Good news — <strong>${companyName}</strong> has been granted auto-approval on careers.lk.</p><p>Future job postings from your company will go live immediately without manual review.</p>`,
    });

    this.logger.log(`Sent trust-granted email to ${email}`);
  }

  async sendTrustDeniedEmail(
    email: string,
    companyName: string,
    reason: string,
  ): Promise<void> {
    const fromEmail = this.config.getOrThrow<string>('mail.fromEmail');
    const fromName = this.config.get<string>('mail.fromName');

    await this.getTransporter().sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: `Auto-approval request for ${companyName} was denied`,
      text: `Your request to auto-approve job postings for ${companyName} on careers.lk was not granted: ${reason}. Your job postings will continue to go through manual review.`,
      html: `<p>Your request to auto-approve job postings for <strong>${companyName}</strong> on careers.lk was not granted:</p><blockquote>${reason}</blockquote><p>Your job postings will continue to go through manual review.</p>`,
    });

    this.logger.log(`Sent trust-denied email to ${email}`);
  }
}
