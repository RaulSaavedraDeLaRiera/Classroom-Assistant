import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ 
  collection: 'chat_messages',
  timestamps: true 
})
export class ChatMessage {
  @Prop({ type: Types.ObjectId, ref: 'Chat', required: true })
  chatId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt: Date;

  @Prop({ default: 'text' })
  type: string; // 'text', 'file', 'image', etc.

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

// Create index for efficient queries
ChatMessageSchema.index({ chatId: 1, createdAt: -1 });
