import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransfersService } from './transfers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

class SendTransferDto {
  @ApiProperty()
  @IsUUID()
  fromWalletId: string;

  @ApiProperty({ example: '50.00' })
  @IsString()
  amount: string;

  @ApiPropertyOptional({ example: 'recipient@example.com' })
  @IsOptional()
  @IsEmail()
  toEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  toWalletId?: string;

  @ApiPropertyOptional({ example: 'За услуги' })
  @IsOptional()
  @IsString()
  note?: string;
}

class SendCryptoDto {
  @ApiProperty()
  @IsUUID()
  fromWalletId: string;

  @ApiProperty({ example: '0.01' })
  @IsString()
  amount: string;

  @ApiProperty({ example: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: 'BTC' })
  @IsOptional()
  @IsString()
  network?: string;
}

@ApiTags('transfers')
@Controller('transfers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post('send')
  @ApiOperation({ summary: 'Перевод другому пользователю (комиссия 3%)' })
  send(@Body() dto: SendTransferDto, @CurrentUser() user: { userId: string }) {
    return this.transfersService.send(user.userId, dto.fromWalletId, dto.amount, {
      toEmail: dto.toEmail,
      toWalletId: dto.toWalletId,
      note: dto.note,
    });
  }

  @Post('crypto')
  @ApiOperation({ summary: 'Отправить криптовалюту на внешний адрес (комиссия 3%)' })
  sendCrypto(@Body() dto: SendCryptoDto, @CurrentUser() user: { userId: string }) {
    return this.transfersService.sendCrypto(
      user.userId,
      dto.fromWalletId,
      dto.amount,
      dto.address,
      dto.network,
    );
  }
}
