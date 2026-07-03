import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeService } from './exchange.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

class ExchangeQuoteDto {
  @ApiProperty({ example: 'USD' })
  @IsString()
  fromCurrency: string;

  @ApiProperty({ example: 'EUR' })
  @IsString()
  toCurrency: string;

  @ApiProperty({ example: '100.00' })
  @IsString()
  amount: string;
}

class ExecuteExchangeDto {
  @ApiProperty()
  @IsUUID()
  fromWalletId: string;

  @ApiProperty()
  @IsUUID()
  toWalletId: string;

  @ApiProperty({ example: '100.00' })
  @IsString()
  amount: string;
}

@ApiTags('exchange')
@Controller('exchange')
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Get('rates')
  @ApiOperation({ summary: 'Актуальные курсы обмена валют' })
  getRates(@Query('from') fromCurrency?: string) {
    return this.exchangeService.getRates(fromCurrency);
  }

  @Post('quote')
  @ApiOperation({ summary: 'Рассчитать котировку обмена' })
  getQuote(@Body() dto: ExchangeQuoteDto) {
    return this.exchangeService.getQuote(
      dto.fromCurrency.toUpperCase(),
      dto.toCurrency.toUpperCase(),
      dto.amount,
    );
  }

  @Post('execute')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Выполнить обмен валют' })
  execute(@Body() dto: ExecuteExchangeDto, @CurrentUser() user: { userId: string }) {
    return this.exchangeService.execute(
      user.userId,
      dto.fromWalletId,
      dto.toWalletId,
      dto.amount,
    );
  }
}
