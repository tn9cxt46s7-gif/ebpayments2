import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CaptchaService } from '../captcha/captcha.service';
import { VerificationService } from '../verification/verification.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly captcha: CaptchaService,
    private readonly verification: VerificationService,
  ) {}

  getCaptcha() {
    return this.captcha.generate();
  }

  async register(dto: RegisterDto) {
    await this.captcha.verifyRegistration({
      captchaId: dto.captchaId,
      captchaAnswer: dto.captchaAnswer,
      recaptchaToken: dto.recaptchaToken,
    });

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Этот email уже зарегистрирован');
    }

    if (!dto.gdprConsent) {
      throw new BadRequestException('Необходимо согласие с политикой конфиденциальности (GDPR)');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      countryCode: dto.countryCode,
      locale: dto.locale ?? 'ru',
      gdprConsent: true,
    });

    await this.usersService.createDefaultWallets(user.id);

    try {
      await this.verification.sendEmailCode(user.id, user.email);
    } catch (err) {
      console.error('[REGISTER] Email code not sent:', err);
    }

    const token = this.signToken(user.id, user.email, user.role);
    return {
      user: this.usersService.sanitize(user),
      accessToken: token,
      redirect: '/onboarding',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const token = this.signToken(user.id, user.email, user.role);
    return { user: this.usersService.sanitize(user), accessToken: token };
  }

  private signToken(userId: string, email: string, role: string) {
    return this.jwtService.sign({ sub: userId, email, role });
  }
}
