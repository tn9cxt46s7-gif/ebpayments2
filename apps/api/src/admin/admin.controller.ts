import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/admin.guard';
import { VerificationService } from '../verification/verification.service';
import { CurrentUser } from '../auth/current-user.decorator';

class RejectKycDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

@ApiTags('admin')
@Controller('admin')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly verification: VerificationService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Статистика платформы' })
  stats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Список пользователей' })
  users() {
    return this.adminService.getUsers();
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Все транзакции' })
  transactions() {
    return this.adminService.getAllTransactions();
  }

  @Get('kyc')
  @ApiOperation({ summary: 'Заявки KYC на проверке' })
  pendingKyc() {
    return this.verification.getPendingKyc();
  }

  @Post('kyc/:userId/approve')
  @ApiOperation({ summary: 'Одобрить KYC' })
  approveKyc(@Param('userId') userId: string, @CurrentUser() user: { userId: string }) {
    return this.verification.approveKyc(userId, user.userId);
  }

  @Post('kyc/:userId/reject')
  @ApiOperation({ summary: 'Отклонить KYC' })
  rejectKyc(
    @Param('userId') userId: string,
    @Body() dto: RejectKycDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.verification.rejectKyc(userId, user.userId, dto.reason);
  }
}
