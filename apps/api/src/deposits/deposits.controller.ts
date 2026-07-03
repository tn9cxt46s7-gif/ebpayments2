import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsUUID, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DepositsService } from './deposits.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { DEPOSIT_FEE_PERCENT, TRANSFER_FEE_PERCENT, EXCHANGE_FEE_PERCENT } from '@eb/shared';

class DepositDto {
  @ApiProperty()
  @IsUUID()
  walletId: string;

  @ApiProperty({ example: '1000' })
  @IsString()
  amount: string;

  @ApiProperty({ enum: ['card', 'bank', 'crypto'] })
  @IsIn(['card', 'bank', 'crypto'])
  method: 'card' | 'bank' | 'crypto';
}

@ApiTags('deposits')
@Controller('deposits')
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

  @Get('fees')
  @ApiOperation({ summary: 'Комиссии платформы' })
  getFees() {
    return {
      deposit: DEPOSIT_FEE_PERCENT,
      transfer: TRANSFER_FEE_PERCENT,
      exchange: EXCHANGE_FEE_PERCENT,
      description: 'Комиссия платформы EB Payments — 3% на пополнение, переводы и обмен',
    };
  }

  @Get('preview')
  @ApiOperation({ summary: 'Расчёт комиссии при пополнении' })
  preview(@Query('amount') amount: string) {
    return this.depositsService.preview(amount);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Пополнить кошелёк (комиссия 3%)' })
  deposit(@Body() dto: DepositDto, @CurrentUser() user: { userId: string }) {
    return this.depositsService.deposit(user.userId, dto.walletId, dto.amount, dto.method);
  }
}
