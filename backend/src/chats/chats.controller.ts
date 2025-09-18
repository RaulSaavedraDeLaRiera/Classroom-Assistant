import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  // Get or create chat between teacher and student
  @Post('get-or-create')
  async getOrCreateChat(
    @Body() body: { studentId: string; courseId: string; enrollmentId: string },
    @Request() req: any
  ) {
    const teacherId = req.user.id;
    return this.chatsService.getOrCreateChat(
      teacherId,
      body.studentId,
      body.courseId,
      body.enrollmentId
    );
  }

  // Get all chats for current user
  @Get('my-chats')
  async getMyChats(@Request() req: any) {
    const userId = req.user.id;
    const userRole = req.user.role; // 'teacher' or 'student'
    return this.chatsService.getUserChats(userId, userRole);
  }

  // Get specific chat
  @Get(':chatId')
  async getChat(@Param('chatId') chatId: string, @Request() req: any) {
    const userId = req.user.id;
    return this.chatsService.getChatById(chatId, userId);
  }

  // Send message
  @Post(':chatId/messages')
  async sendMessage(
    @Param('chatId') chatId: string,
    @Body() body: { message: string },
    @Request() req: any
  ) {
    const senderId = req.user.id;
    return this.chatsService.sendMessage(chatId, senderId, body.message);
  }

  // Get messages for a chat
  @Get(':chatId/messages')
  async getMessages(
    @Param('chatId') chatId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Request() req: any
  ) {
    const userId = req.user.id;
    return this.chatsService.getChatMessages(
      chatId,
      userId,
      parseInt(page),
      parseInt(limit)
    );
  }

  // Mark messages as read
  @Post(':chatId/read')
  async markAsRead(@Param('chatId') chatId: string, @Request() req: any) {
    const userId = req.user.id;
    await this.chatsService.markMessagesAsRead(chatId, userId);
    return { success: true };
  }

  // Get unread message count
  @Get('unread/count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user.id;
    const count = await this.chatsService.getUnreadCount(userId);
    return { unreadCount: count };
  }
}
