import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BanksService } from './banks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

class ConnectBankDto {
  @ApiProperty({ example: 'RU' })
  @IsString()
  @Length(2, 2)
  countryCode: string;

  @ApiProperty({ example: 'sber' })
  @IsString()
  bankId: string;
}

@ApiTags('banks')
@Controller('banks')
export class BanksController {
  constructor(private readonly banksService: BanksService) {}

  @Get('countries')
  @ApiOperation({ summary: 'Список стран' })
  countries() {
    return this.banksService.getCountries();
  }

  @Get()
  @ApiOperation({ summary: 'Банки по стране' })
  list(@Query('country') country: string) {
    return this.banksService.getBanks(country ?? 'RU');
  }

  @Get('connected')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Подключённые банки пользователя' })
  connected(@CurrentUser() user: { userId: string }) {
    return this.banksService.getConnected(user.userId);
  }

  @Post('connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Подключить банк' })
  connect(@Body() dto: ConnectBankDto, @CurrentUser() user: { userId: string }) {
    return this.banksService.connect(user.userId, dto.countryCode, dto.bankId);
  }

  @Delete('connected/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отключить банк' })
  disconnect(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.banksService.disconnect(user.userId, id);
  }
}
