import { Controller, Get, Query, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('history')
  @UseGuards(JwtAuthGuard)
  getHistory(
    @Query('userId1') userId1: string,
    @Query('userId2') userId2: string,
    @Req() req: Request,
  ) {
    const currentUserId = (req.user as any).userId;
    if (currentUserId !== userId1 && currentUserId !== userId2) {
      throw new ForbiddenException();
    }
    return this.chatService.getChatHistory(userId1, userId2);
  }

  @Get('conversations/:userId')
  @UseGuards(JwtAuthGuard)
  getConversations(@Param('userId') userId: string, @Req() req: Request) {
    const currentUserId = (req.user as any).userId;
    if (currentUserId !== userId) {
      throw new ForbiddenException();
    }
    return this.chatService.getUserConversations(userId);
  }
}
