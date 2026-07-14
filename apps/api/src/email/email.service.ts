import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly brevoApiKey = process.env.BREVO_API_KEY;

  constructor() {
    // Приоритет: Brevo HTTP API (работает на бесплатном Render — SMTP-порты там заблокированы)
    if (this.brevoApiKey) {
      this.logger.log('Используется Brevo API для отправки почты (HTTP, без блокировки SMTP-портов)');
      return;
    }

    const host = process.env.SMTP_HOST;
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT ?? '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      this.transporter.verify((err) => {
        if (err) {
          this.logger.error(
            `SMTP не отвечает: ${err.message}. Если сервис на бесплатном тарифе Render — SMTP-порты (25/465/587) там заблокированы, используйте BREVO_API_KEY вместо SMTP_*.`,
          );
        } else {
          this.logger.log('SMTP подключение проверено успешно — почта готова к отправке');
        }
      });
    } else {
      this.logger.warn('Почта не настроена (нет BREVO_API_KEY и SMTP_HOST) — письма будут только логироваться (dev-режим)');
    }
  }

  isConfigured() {
    if (this.brevoApiKey) return true;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!this.transporter || !user || !pass) return false;
    if (user.includes('yourmail') || pass.includes('your_app_password')) return false;
    return true;
  }

  async send(to: string, subject: string, html: string) {
    const from = process.env.SMTP_FROM ?? 'EB Payments <receipts@ebpayments.com>';

    if (this.brevoApiKey) {
      return this.sendViaBrevoApi(to, subject, html, from);
    }

    if (!this.transporter) {
      console.log(`[EMAIL DEV] To: ${to} | Subject: ${subject}`);
      console.log(html.replace(/<[^>]+>/g, '').slice(0, 200));
      return { sent: false, dev: true };
    }

    try {
      await this.transporter.sendMail({ from, to, subject, html });
      return { sent: true };
    } catch (err) {
      this.logger.error(`Ошибка отправки письма на ${to}: ${(err as Error).message}`);
      console.log(`[EMAIL FALLBACK] To: ${to} | Subject: ${subject}`);
      console.log(html.replace(/<[^>]+>/g, '').slice(0, 200));
      return { sent: false, dev: true, error: (err as Error).message };
    }
  }

  private parseFrom(from: string): { name?: string; email: string } {
    const match = from.match(/^(.*)<(.+)>$/);
    if (match) return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() };
    return { email: from.trim() };
  }

  private async sendViaBrevoApi(to: string, subject: string, html: string, from: string) {
    const sender = this.parseFrom(from);
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': this.brevoApiKey!,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender,
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Brevo API ${res.status}: ${errBody}`);
      }
      return { sent: true };
    } catch (err) {
      this.logger.error(`Ошибка отправки через Brevo API на ${to}: ${(err as Error).message}`);
      console.log(`[EMAIL FALLBACK] To: ${to} | Subject: ${subject}`);
      console.log(html.replace(/<[^>]+>/g, '').slice(0, 200));
      return { sent: false, dev: true, error: (err as Error).message };
    }
  }

  async sendVerificationCode(email: string, code: string, locale = 'ru') {
    const subjects: Record<string, string> = {
      ru: 'Код подтверждения EB Payments',
      en: 'EB Payments verification code',
      lv: 'EB Payments apstiprinājuma kods',
    };
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">EB Payments</h2>
        <p>Ваш код подтверждения:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#111">${code}</p>
        <p style="color:#666;font-size:13px">Код действителен 10 минут. Не сообщайте его никому.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#999;font-size:11px">EB Payments</p>
      </div>`;
    return this.send(email, subjects[locale] ?? subjects.ru, html);
  }

  async sendReceipt(email: string, data: { amount: string; currency: string; type: string; fee: string; id: string }) {
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:12px">
        <h2 style="color:#4f46e5">EB Payments — Квитанция</h2>
        <table style="width:100%;font-size:14px">
          <tr><td style="padding:8px 0;color:#666">Операция</td><td style="text-align:right">${data.type}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Сумма</td><td style="text-align:right;font-weight:bold">${data.amount} ${data.currency}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Комиссия</td><td style="text-align:right">${data.fee} ${data.currency}</td></tr>
          <tr><td style="padding:8px 0;color:#666">ID</td><td style="text-align:right;font-size:11px">${data.id}</td></tr>
        </table>
        <p style="color:#999;font-size:11px;margin-top:24px">Это автоматическое сообщение от EB Payments. Не отвечайте на него.</p>
      </div>`;
    return this.send(email, `Квитанция EB Payments — ${data.amount} ${data.currency}`, html);
  }
}
