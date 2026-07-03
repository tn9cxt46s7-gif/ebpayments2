import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsDateString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';

class CodeDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  code: string;
}

class PhoneDto {
  @ApiProperty({ example: '+37120000000' })
  @IsString()
  phone: string;
}

class AgeDto {
  @ApiProperty({ example: '1990-05-15' })
  @IsDateString()
  dateOfBirth: string;
}

class KycDto {
  @ApiProperty({ enum: ['passport', 'id_card', 'drivers_license'] })
  @IsIn(['passport', 'id_card', 'drivers_license'])
  documentType: string;

  @ApiProperty()
  @IsString()
  documentNumber: string;

  @ApiProperty()
  @IsString()
  fileName: string;
}

@ApiTags('verification')
@Controller('verification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Get('status')
  @ApiOperation({ summary: 'Статус верификации' })
  status(@CurrentUser() user: { userId: string }) {
    return this.verification.getOnboardingStatus(user.userId);
  }

  @Post('email/send')
  @ApiOperation({ summary: 'Отправить код на email' })
  async sendEmail(@CurrentUser() user: { userId: string; email: string }) {
    return this.verification.sendEmailCode(user.userId, user.email);
  }

  @Post('email/verify')
  @ApiOperation({ summary: 'Подтвердить email' })
  verifyEmail(@Body() dto: CodeDto, @CurrentUser() user: { userId: string }) {
    return this.verification.verifyEmailCode(user.userId, dto.code);
  }

  @Post('phone/send')
  @ApiOperation({ summary: 'Отправить SMS-код' })
  sendPhone(@Body() dto: PhoneDto, @CurrentUser() user: { userId: string }) {
    return this.verification.sendPhoneCode(user.userId, dto.phone);
  }

  @Post('phone/verify')
  @ApiOperation({ summary: 'Подтвердить телефон' })
  verifyPhone(@Body() dto: CodeDto, @CurrentUser() user: { userId: string }) {
    return this.verification.verifyPhoneCode(user.userId, dto.code);
  }

  @Post('age')
  @ApiOperation({ summary: 'Подтвердить возраст (18+)' })
  verifyAge(@Body() dto: AgeDto, @CurrentUser() user: { userId: string }) {
    return this.verification.verifyAge(user.userId, dto.dateOfBirth);
  }

  @Post('kyc')
  @ApiOperation({ summary: 'Загрузить данные KYC' })
  submitKyc(@Body() dto: KycDto, @CurrentUser() user: { userId: string }) {
    return this.verification.submitKyc(user.userId, dto);
  }

  @Post('admin/approve/:userId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Одобрить KYC (админ)' })
  approve(@Param('userId') userId: string, @CurrentUser() user: { userId: string }) {
    return this.verification.approveKyc(userId, user.userId);
  }
}
