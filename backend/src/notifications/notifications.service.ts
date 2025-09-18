import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  // Create notification for exercise completion
  async createExerciseCompletedNotification(
    teacherId: string,
    studentId: string,
    courseId: string,
    enrollmentId: string,
    exerciseId: string,
    exerciseTitle: string,
    studentName: string,
    courseTitle: string
  ) {
    const notification = new this.notificationModel({
      teacherId: new Types.ObjectId(teacherId),
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      enrollmentId: new Types.ObjectId(enrollmentId),
      type: 'exercise_completed',
      title: 'Exercise Completed',
      message: `${studentName} completed exercise: ${exerciseTitle}`,
      priority: 1, // High priority for completed exercises
      metadata: {
        exerciseId,
        exerciseTitle,
        studentName,
        courseTitle
      }
    });

    return notification.save();
  }

  // Create notification for new message
  async createMessageNotification(
    teacherId: string,
    studentId: string,
    courseId: string,
    enrollmentId: string,
    chatId: string,
    messageId: string,
    studentName: string,
    courseTitle: string,
    messagePreview: string
  ) {
    const notification = new this.notificationModel({
      teacherId: new Types.ObjectId(teacherId),
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      enrollmentId: new Types.ObjectId(enrollmentId),
      type: 'message_received',
      title: 'New Message',
      message: `${studentName}: ${messagePreview}`,
      priority: 2, // Medium priority for messages
      metadata: {
        chatId,
        messageId,
        studentName,
        courseTitle
      }
    });

    return notification.save();
  }

  // Get notifications for teacher with pagination
  async getTeacherNotifications(
    teacherId: string,
    page: number = 1,
    limit: number = 50
  ) {
    const skip = (page - 1) * limit;

    const notifications = await this.notificationModel
      .find({ teacherId: new Types.ObjectId(teacherId) })
      .sort({ priority: 1, createdAt: -1 }) // Priority first, then most recent
      .skip(skip)
      .limit(limit)
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .exec();

    const total = await this.notificationModel
      .countDocuments({ teacherId: new Types.ObjectId(teacherId) })
      .exec();

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get unread notifications count
  async getUnreadCount(teacherId: string) {
    return this.notificationModel
      .countDocuments({
        teacherId: new Types.ObjectId(teacherId),
        isRead: false
      })
      .exec();
  }

  // Mark notification as read
  async markAsRead(notificationId: string, teacherId: string) {
    return this.notificationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(notificationId),
        teacherId: new Types.ObjectId(teacherId)
      },
      {
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    ).exec();
  }

  // Mark all notifications as read
  async markAllAsRead(teacherId: string) {
    return this.notificationModel.updateMany(
      {
        teacherId: new Types.ObjectId(teacherId),
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    ).exec();
  }

  // Get recent notifications (last 24 hours)
  async getRecentNotifications(teacherId: string, hours: number = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return this.notificationModel
      .find({
        teacherId: new Types.ObjectId(teacherId),
        createdAt: { $gte: since }
      })
      .sort({ priority: 1, createdAt: -1 })
      .limit(20)
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .exec();
  }

  // Delete old notifications (older than 30 days)
  async cleanupOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.notificationModel.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      isRead: true
    }).exec();
  }
}
