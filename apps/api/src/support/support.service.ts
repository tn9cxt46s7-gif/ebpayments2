import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class SupportService {
  constructor(
    private readonly db: DatabaseService,
    private readonly email: EmailService,
  ) {}

  async sendMessage(userId: string, message: string) {
    const rows = await this.db.query(
      `INSERT INTO support_messages (user_id, message) VALUES ($1, $2) RETURNING *`,
      [userId, message],
    );

    const user = await this.db.queryOne<{ email: string; first_name: string }>(
      'SELECT email, first_name FROM users WHERE id = $1',
      [userId],
    );

    const adminEmail = process.env.SUPPORT_EMAIL ?? 'support@ebpayments.com';
    await this.email.send(
      adminEmail,
      `[EB Support] Новое сообщение от ${user?.first_name ?? 'пользователя'}`,
      `<p><b>${user?.email}</b> написал:</p><p>${message}</p>`,
    );

    return rows[0];
  }

  async getMessages(userId: string) {
    return this.db.query(
      `SELECT * FROM support_messages WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId],
    );
  }

  async reply(userId: string, message: string) {
    await this.db.query(
      `INSERT INTO support_messages (user_id, message, is_from_support) VALUES ($1, $2, true)`,
      [userId, message],
    );

    const user = await this.db.queryOne<{ email: string }>('SELECT email FROM users WHERE id = $1', [userId]);
    if (user) {
      await this.email.send(user.email, 'Ответ службы поддержки EB Payments', `<p>${message}</p>`);
    }
    return { sent: true };
  }

  async getUnreadForAdmin() {
    return this.db.query(
      `SELECT sm.*, u.email, u.first_name, u.last_name
       FROM support_messages sm
       JOIN users u ON u.id = sm.user_id
       WHERE sm.is_from_support = false AND sm.is_read = false
       ORDER BY sm.created_at DESC`,
    );
  }

  async getAllChats() {
    return this.db.query(
      `SELECT DISTINCT ON (sm.user_id) sm.user_id, u.email, u.first_name, u.last_name,
              sm.message as last_message, sm.created_at
       FROM support_messages sm
       JOIN users u ON u.id = sm.user_id
       ORDER BY sm.user_id, sm.created_at DESC`,
    );
  }

  async markRead(userId: string) {
    await this.db.query(
      'UPDATE support_messages SET is_read = true WHERE user_id = $1 AND is_from_support = false',
      [userId],
    );
  }
}
