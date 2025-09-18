import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: ['student', 'teacher', 'admin'], default: 'student' })
  role: string;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: true })
  visible: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  teacherIds: Types.ObjectId[]; // Array of teachers related to this student

  @Prop({ type: Object, default: {} })
  profile: Record<string, any>; // for additional profile data

  @Prop({ type: Date })
  lastLoginAt: Date;

  // Timestamps added by Mongoose
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
