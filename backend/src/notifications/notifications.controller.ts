import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Get notifications with pagination
  @Get()
  async getNotifications(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Request() req: any
  ) {
    const teacherId = req.user.id;
    return this.notificationsService.getTeacherNotifications(
      teacherId,
      parseInt(page),
      parseInt(limit)
    );
  }

  // Get unread count
  @Get('unread/count')
  async getUnreadCount(@Request() req: any) {
    const teacherId = req.user.id;
    const count = await this.notificationsService.getUnreadCount(teacherId);
    return { unreadCount: count };
  }

  // Get recent notifications (last 24 hours)
  @Get('recent')
  async getRecentNotifications(
    @Query('hours') hours: string = '24',
    @Request() req: any
  ) {
    const teacherId = req.user.id;
    return this.notificationsService.getRecentNotifications(
      teacherId,
      parseInt(hours)
    );
  }

  // Mark notification as read
  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const teacherId = req.user.id;
    return this.notificationsService.markAsRead(id, teacherId);
  }

  // Mark all notifications as read
  @Post('read-all')
  async markAllAsRead(@Request() req: any) {
    const teacherId = req.user.id;
    await this.notificationsService.markAllAsRead(teacherId);
    return { success: true };
  }

  // Cleanup old notifications (admin endpoint)
  @Post('cleanup')
  async cleanupOldNotifications(@Request() req: any) {
    // Only allow teachers to cleanup
    if (req.user.role !== 'teacher') {
      return { error: 'Unauthorized' };
    }
    
    const result = await this.notificationsService.cleanupOldNotifications();
    return { 
      success: true, 
      deletedCount: result.deletedCount 
    };
  }
}
