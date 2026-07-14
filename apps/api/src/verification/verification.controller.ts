import { Controller, Get, Post, Body, Param, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { IsString, IsDateString, IsIn, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';

class CodeDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Код должен состоять из 6 цифр' })
  code: string;
}

class PhoneDto {
  @ApiProperty({ example: '+37120000000' })
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'Укажите телефон в международном формате, например +37120000000' })
  phone: string;
}

class AgeDto {
  @ApiProperty({ example: '1990-05-15' })
  @IsDateString()
  dateOfBirth: string;
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 МБ

class KycDto {
  @ApiProperty({ enum: ['passport', 'id_card', 'drivers_license'] })
  @IsIn(['passport', 'id_card', 'drivers_license'])
  documentType: string;

  @ApiProperty({ description: 'Номер документа, только буквы/цифры, 4-30 символов' })
  @IsString()
  @Matches(/^[A-Za-zА-Яа-яЁё0-9\- ]{4,30}$/, { message: 'Некорректный номер документа' })
  documentNumber: string;
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
  @ApiOperation({ summary: 'Загрузить документ KYC (файл + данные)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  submitKyc(
    @Body() dto: KycDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { userId: string },
  ) {
    if (!file) throw new BadRequestException('Файл документа обязателен');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Допустимые форматы: JPG, PNG, WEBP, PDF');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Файл слишком большой (максимум 8 МБ)');
    }
    return this.verification.submitKyc(user.userId, {
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      fileName: file.originalname,
      fileData: file.buffer,
      mimeType: file.mimetype,
      fileSize: file.size,
    });
  }

  @Get('admin/document/:kycId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Получить файл документа KYC (админ)' })
  async getDocument(@Param('kycId') kycId: string) {
    return this.verification.getDocumentDataUrl(kycId);
  }

  @Post('admin/approve/:userId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Одобрить KYC (админ)' })
  approve(@Param('userId') userId: string, @CurrentUser() user: { userId: string }) {
    return this.verification.approveKyc(userId, user.userId);
  }
}
