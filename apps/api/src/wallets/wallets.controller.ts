import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

class CreateWalletDto {
  @ApiProperty({ example: 'KZT' })
  @IsString()
  @Length(3, 10)
  currency: string;
}

@ApiTags('wallets')
@Controller('wallets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  @ApiOperation({ summary: 'Список кошельков пользователя' })
  async list(@CurrentUser() user: { userId: string }) {
    const wallets = await this.walletsService.findByUser(user.userId);
    return wallets.map((w) => this.walletsService.format(w));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить кошелёк по ID' })
  async getOne(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    const wallet = await this.walletsService.findById(id, user.userId);
    return this.walletsService.format(wallet);
  }

  @Post()
  @ApiOperation({ summary: 'Создать кошелёк в новой валюте' })
  async create(@Body() dto: CreateWalletDto, @CurrentUser() user: { userId: string }) {
    const wallet = await this.walletsService.create(user.userId, dto.currency.toUpperCase());
    return this.walletsService.format(wallet);
  }
}
