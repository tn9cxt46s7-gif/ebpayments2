import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MerchantsService } from './merchants.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

class RegisterMerchantDto {
  @ApiProperty({ example: 'My Online Store' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'https://mystore.com/webhooks/eb' })
  @IsOptional()
  @IsUrl()
  webhookUrl?: string;
}

@ApiTags('merchants')
@Controller('merchants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Post('register')
  @ApiOperation({ summary: 'Зарегистрировать мерчанта для приёма платежей' })
  register(@Body() dto: RegisterMerchantDto, @CurrentUser() user: { userId: string }) {
    return this.merchantsService.register(user.userId, dto.name, dto.webhookUrl);
  }

  @Get()
  @ApiOperation({ summary: 'Список мерчантов пользователя' })
  list(@CurrentUser() user: { userId: string }) {
    return this.merchantsService.findByUser(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить мерчанта по ID' })
  getOne(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.merchantsService.findById(id, user.userId);
  }
}
