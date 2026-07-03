import { Controller, Get, Post, Body, Req, Headers, UseGuards, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsUUID, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Request } from 'express';
import { StripePaymentsService } from './stripe-payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

class CreateStripePaymentDto {
  @ApiProperty()
  @IsUUID()
  walletId: string;

  @ApiProperty({ example: '100' })
  @IsString()
  amount: string;

  @ApiProperty({ example: 'USD' })
  @IsString()
  currency: string;

  @ApiProperty({ enum: ['card', 'google_pay', 'apple_pay'] })
  @IsIn(['card', 'google_pay', 'apple_pay'])
  method: 'card' | 'google_pay' | 'apple_pay';
}

@ApiTags('stripe')
@Controller('stripe')
export class StripePaymentsController {
  constructor(private readonly stripeService: StripePaymentsService) {}

  @Get('config')
  @ApiOperation({ summary: 'Конфигурация Stripe' })
  config() {
    return {
      configured: this.stripeService.isConfigured(),
      publishableKey: this.stripeService.getPublishableKey(),
    };
  }

  @Post('create-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать платёж (карта / Google Pay / Apple Pay)' })
  createPayment(@Body() dto: CreateStripePaymentDto, @CurrentUser() user: { userId: string }) {
    return this.stripeService.createPaymentIntent(
      user.userId,
      dto.walletId,
      dto.amount,
      dto.currency,
      dto.method,
    );
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook' })
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.stripeService.handleWebhook(req.rawBody as Buffer, signature);
  }
}
