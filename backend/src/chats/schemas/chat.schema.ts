import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatDocument = Chat & Document;

@Schema({ 
  collection: 'chats',
  timestamps: true 
})
export class Chat {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  teacherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CourseEnrollment', required: true })
  enrollmentId: Types.ObjectId;

  @Prop({ default: true })
  active: boolean;

  @Prop()
  lastMessageAt: Date;

  @Prop()
  lastMessage: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  lastMessageBy: Types.ObjectId;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

// Create compound index for efficient queries
ChatSchema.index({ teacherId: 1, studentId: 1, courseId: 1 }, { unique: true });
