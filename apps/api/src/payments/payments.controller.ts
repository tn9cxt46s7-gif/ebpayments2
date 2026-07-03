import { Controller, Get, Post, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

class CreatePaymentDto {
  @ApiProperty({ example: 'order-12345' })
  @IsString()
  orderId: string;

  @ApiProperty({ example: '99.99' })
  @IsString()
  amount: string;

  @ApiProperty({ example: 'USD' })
  @IsString()
  currency: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  callbackUrl?: string;

  @ApiPropertyOptional({ example: 'Premium subscription' })
  @IsOptional()
  @IsString()
  description?: string;
}

class PayFromWalletDto {
  @ApiProperty()
  @IsString()
  walletId: string;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @ApiHeader({ name: 'X-Api-Key', required: true })
  @ApiHeader({ name: 'X-Api-Secret', required: true })
  @ApiOperation({ summary: 'Создать платёж (для мерчантов / сторонних сервисов)' })
  create(
    @Headers('x-api-key') apiKey: string,
    @Headers('x-api-secret') apiSecret: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPaymentIntent(apiKey, apiSecret, dto);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Статус платежа' })
  getStatus(@Param('id') id: string) {
    return this.paymentsService.getPaymentStatus(id);
  }

  @Post(':id/pay')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Оплатить с кошелька EB Payments' })
  pay(
    @Param('id') id: string,
    @Body() dto: PayFromWalletDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.paymentsService.payFromWallet(user.userId, id, dto.walletId);
  }
}
