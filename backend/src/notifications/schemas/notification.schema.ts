import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ 
  collection: 'notifications',
  timestamps: true 
})
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  teacherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CourseEnrollment', required: true })
  enrollmentId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: ['exercise_completed', 'message_received'],
    required: true 
  })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt: Date;

  // Additional data for different notification types
  @Prop({ type: Object })
  metadata: {
    exerciseId?: string;
    exerciseTitle?: string;
    chatId?: string;
    messageId?: string;
    studentName?: string;
    courseTitle?: string;
  };

  @Prop({ default: 1 })
  priority: number; // 1 = high, 2 = medium, 3 = low
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Create indexes for efficient queries
NotificationSchema.index({ teacherId: 1, createdAt: -1 });
NotificationSchema.index({ teacherId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
