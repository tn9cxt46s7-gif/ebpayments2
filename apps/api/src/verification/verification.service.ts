import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class VerificationService {
  constructor(
    private readonly db: DatabaseService,
    private readonly email: EmailService,
  ) {}

  private generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async sendEmailCode(userId: string, email: string) {
    const code = this.generateCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await this.db.query(
      `INSERT INTO verification_codes (user_id, email, code, type, expires_at)
       VALUES ($1, $2, $3, 'email', $4)`,
      [userId, email, code, expires],
    );

    await this.email.sendVerificationCode(email, code);
    return {
      sent: true,
      message: this.email.isConfigured()
        ? `Код отправлен на ${email}`
        : `Код отправлен (режим разработки — смотрите консоль API): ${code}`,
      devCode: this.email.isConfigured() ? undefined : code,
    };
  }

  async verifyEmailCode(userId: string, code: string) {
    const row = await this.db.queryOne<{ id: string }>(
      `SELECT id FROM verification_codes
       WHERE user_id = $1 AND code = $2 AND type = 'email' AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId, code],
    );
    if (!row) throw new BadRequestException('Неверный или устаревший код');

    await this.db.query('UPDATE verification_codes SET used_at = NOW() WHERE id = $1', [row.id]);
    await this.db.query(
      `UPDATE users SET email_verified = true, onboarding_step = 'phone_verify' WHERE id = $1`,
      [userId],
    );
    return { verified: true, nextStep: 'phone_verify' };
  }

  async sendPhoneCode(userId: string, phone: string) {
    const code = this.generateCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await this.db.query('UPDATE users SET phone = $1 WHERE id = $2', [phone, userId]);
    await this.db.query(
      `INSERT INTO verification_codes (user_id, phone, code, type, expires_at)
       VALUES ($1, $2, $3, 'phone', $4)`,
      [userId, phone, code, expires],
    );

    console.log(`[SMS DEV] Phone: ${phone} Code: ${code}`);
    return {
      sent: true,
      message: `SMS-код отправлен на ${phone}`,
      devCode: code,
    };
  }

  async verifyPhoneCode(userId: string, code: string) {
    const row = await this.db.queryOne<{ id: string }>(
      `SELECT id FROM verification_codes
       WHERE user_id = $1 AND code = $2 AND type = 'phone' AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId, code],
    );
    if (!row) throw new BadRequestException('Неверный или устаревший код');

    await this.db.query('UPDATE verification_codes SET used_at = NOW() WHERE id = $1', [row.id]);
    await this.db.query(
      `UPDATE users SET phone_verified = true, onboarding_step = 'age_verify' WHERE id = $1`,
      [userId],
    );
    return { verified: true, nextStep: 'age_verify' };
  }

  async verifyAge(userId: string, dateOfBirth: string) {
    const dob = new Date(dateOfBirth);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) throw new BadRequestException('Сервис доступен только лицам старше 18 лет');

    await this.db.query(
      `UPDATE users SET date_of_birth = $1, onboarding_step = 'kyc_verify' WHERE id = $2`,
      [dateOfBirth, userId],
    );
    return { verified: true, nextStep: 'kyc_verify', age };
  }

  async submitKyc(
    userId: string,
    data: { documentType: string; documentNumber: string; fileName: string },
  ) {
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(data.documentNumber).digest('hex');

    await this.db.query(
      `INSERT INTO kyc_documents (user_id, document_type, file_name)
       VALUES ($1, $2, $3)`,
      [userId, data.documentType, data.fileName],
    );
    await this.db.query(
      `UPDATE users SET document_type = $1, document_number_hash = $2,
       kyc_status = 'pending', onboarding_step = 'kyc_pending' WHERE id = $3`,
      [data.documentType, hash, userId],
    );
    return {
      submitted: true,
      message: 'Документы отправлены на проверку. Обычно это занимает до 24 часов.',
      nextStep: 'kyc_pending',
    };
  }

  async getOnboardingStatus(userId: string) {
    const user = await this.db.queryOne<{
      email_verified: boolean;
      phone_verified: boolean;
      date_of_birth: string;
      onboarding_step: string;
      kyc_status: string;
      email: string;
      phone: string;
    }>('SELECT email_verified, phone_verified, date_of_birth, onboarding_step, kyc_status, email, phone FROM users WHERE id = $1', [userId]);

    if (!user) throw new BadRequestException('Пользователь не найден');

    const steps = [
      { id: 'email_verify', label: 'Подтверждение email', done: user.email_verified },
      { id: 'phone_verify', label: 'Подтверждение телефона', done: user.phone_verified },
      { id: 'age_verify', label: 'Проверка возраста (18+)', done: !!user.date_of_birth },
      { id: 'kyc_verify', label: 'Верификация личности', done: ['pending', 'verified'].includes(user.kyc_status) },
      { id: 'completed', label: 'Готово', done: user.kyc_status === 'verified' },
    ];

    return {
      currentStep: user.onboarding_step,
      kycStatus: user.kyc_status,
      canUseWallet: user.kyc_status === 'verified',
      email: user.email,
      phone: user.phone,
      steps,
    };
  }

  async approveKyc(userId: string, adminId: string) {
    await this.db.query(
      `UPDATE users SET kyc_status = 'verified', onboarding_step = 'completed' WHERE id = $1`,
      [userId],
    );
    await this.db.query(
      `UPDATE kyc_documents SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
       WHERE user_id = $2 AND status = 'pending'`,
      [adminId, userId],
    );
    return { approved: true };
  }

  async rejectKyc(userId: string, adminId: string, reason?: string) {
    await this.db.query(
      `UPDATE users SET kyc_status = 'rejected', onboarding_step = 'kyc_verify' WHERE id = $1`,
      [userId],
    );
    await this.db.query(
      `UPDATE kyc_documents SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $2
       WHERE user_id = $3 AND status = 'pending'`,
      [adminId, reason ?? null, userId],
    );
    return { rejected: true };
  }

  async getPendingKyc() {
    const rows = await this.db.query(
      `SELECT k.id, k.user_id, k.document_type, k.file_name, k.status, k.uploaded_at,
              u.email, u.first_name, u.last_name, u.country_code, u.phone, u.date_of_birth
       FROM kyc_documents k
       JOIN users u ON u.id = k.user_id
       WHERE k.status = 'pending'
       ORDER BY k.uploaded_at ASC`,
    );
    return rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      userId: r.user_id,
      documentType: r.document_type,
      fileName: r.file_name,
      status: r.status,
      uploadedAt: r.uploaded_at,
      email: r.email,
      firstName: r.first_name,
      lastName: r.last_name,
      countryCode: r.country_code,
      phone: r.phone,
      dateOfBirth: r.date_of_birth,
    }));
  }
}
