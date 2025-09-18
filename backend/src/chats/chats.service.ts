import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from './schemas/chat.schema';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(ChatMessage.name) private chatMessageModel: Model<ChatMessageDocument>,
    private notificationsService: NotificationsService,
  ) {}

  // Get or create chat between teacher and student for a course
  async getOrCreateChat(teacherId: string, studentId: string, courseId: string, enrollmentId: string) {
    // Check if chat already exists
    let chat = await this.chatModel.findOne({
      teacherId: new Types.ObjectId(teacherId),
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId)
    }).exec();

    if (!chat) {
      // Create new chat
      chat = new this.chatModel({
        teacherId: new Types.ObjectId(teacherId),
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
        enrollmentId: new Types.ObjectId(enrollmentId),
        active: true
      });
      await chat.save();
    }

    return chat;
  }

  // Get chat by ID with access verification
  async getChatById(chatId: string, userId: string) {
    const chat = await this.chatModel.findById(chatId)
      .populate('teacherId', 'name email')
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .exec();

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Verify user has access to this chat
    if (chat.teacherId._id.toString() !== userId && chat.studentId._id.toString() !== userId) {
      throw new ForbiddenException('Access denied to this chat');
    }

    return chat;
  }

  // Get all chats for a user (teacher or student)
  async getUserChats(userId: string, userRole: 'teacher' | 'student') {
    const query = userRole === 'teacher' 
      ? { teacherId: new Types.ObjectId(userId), active: true }
      : { studentId: new Types.ObjectId(userId), active: true };

    return this.chatModel.find(query)
      .populate('teacherId', 'name email')
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  // Send message
  async sendMessage(chatId: string, senderId: string, message: string) {
    // Verify chat exists and user has access
    const chat = await this.getChatById(chatId, senderId);

    // Create message
    const chatMessage = new this.chatMessageModel({
      chatId: new Types.ObjectId(chatId),
      senderId: new Types.ObjectId(senderId),
      message: message.trim(),
      type: 'text',
      isRead: false
    });

    await chatMessage.save();

    // Update chat with last message info
    await this.chatModel.findByIdAndUpdate(chatId, {
      lastMessageAt: new Date(),
      lastMessage: message.trim(),
      lastMessageBy: new Types.ObjectId(senderId)
    }).exec();

    // Create notification if message is from student to teacher
    const populatedChat = await this.chatModel.findById(chatId)
      .populate('teacherId', 'name')
      .populate('studentId', 'name')
      .populate('courseId', 'title')
      .exec();

    if (populatedChat && populatedChat.studentId._id.toString() === senderId) {
      // Message from student to teacher - create notification
      const messagePreview = message.trim().length > 50 
        ? message.trim().substring(0, 50) + '...' 
        : message.trim();

      await this.notificationsService.createMessageNotification(
        populatedChat.teacherId._id.toString(),
        populatedChat.studentId._id.toString(),
        populatedChat.courseId._id.toString(),
        populatedChat.enrollmentId.toString(),
        chatId,
        chatMessage._id.toString(),
        (populatedChat.studentId as any).name,
        (populatedChat.courseId as any).title,
        messagePreview
      );
    }

    // Return message with sender info
    return this.chatMessageModel.findById(chatMessage._id)
      .populate('senderId', 'name email role')
      .exec();
  }

  // Get messages for a chat
  async getChatMessages(chatId: string, userId: string, page: number = 1, limit: number = 50) {
    // Verify access
    await this.getChatById(chatId, userId);

    const skip = (page - 1) * limit;
    
    const messages = await this.chatMessageModel.find({ chatId: new Types.ObjectId(chatId) })
      .populate('senderId', 'name email role')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return messages;
  }

  // Mark messages as read
  async markMessagesAsRead(chatId: string, userId: string) {
    // Verify access
    await this.getChatById(chatId, userId);

    // Mark all unread messages as read (except those sent by the current user)
    await this.chatMessageModel.updateMany(
      {
        chatId: new Types.ObjectId(chatId),
        senderId: { $ne: new Types.ObjectId(userId) },
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    ).exec();
  }

  // Get unread message count for a user
  async getUnreadCount(userId: string) {
    const userChats = await this.getUserChats(userId, 'teacher'); // Get all chats for user
    
    const chatIds = userChats.map(chat => chat._id);
    
    const unreadCount = await this.chatMessageModel.countDocuments({
      chatId: { $in: chatIds },
      senderId: { $ne: new Types.ObjectId(userId) },
      isRead: false
    }).exec();

    return unreadCount;
  }
}
