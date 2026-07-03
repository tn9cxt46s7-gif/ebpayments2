import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';

class MessageDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  message: string;
}

@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post('message')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отправить сообщение в поддержку' })
  send(@Body() dto: MessageDto, @CurrentUser() user: { userId: string }) {
    return this.support.sendMessage(user.userId, dto.message);
  }

  @Get('messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'История чата' })
  messages(@CurrentUser() user: { userId: string }) {
    return this.support.getMessages(user.userId);
  }

  @Get('admin/chats')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Все чаты (админ)' })
  chats() {
    return this.support.getAllChats();
  }

  @Get('admin/unread')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  unread() {
    return this.support.getUnreadForAdmin();
  }

  @Post('admin/reply/:userId')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ответить пользователю (админ)' })
  reply(@Param('userId') userId: string, @Body() dto: MessageDto) {
    return this.support.reply(userId, dto.message);
  }

  @Post('admin/read/:userId')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  markRead(@Param('userId') userId: string) {
    return this.support.markRead(userId);
  }
}
