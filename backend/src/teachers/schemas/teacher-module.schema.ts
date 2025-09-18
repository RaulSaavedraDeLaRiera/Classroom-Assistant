import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TeacherModuleDocument = TeacherModule & Document;

@Schema({ 
  collection: 'teacher_modules',
  timestamps: true 
})
export class TeacherModule {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  teacherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TemplateModule' })
  templateModuleId: Types.ObjectId;

  @Prop({ default: true })
  visible: boolean;

  @Prop([String])
  tags: string[];

  @Prop({ required: true, default: 0 })
  estimatedTime: number; // Time in minutes for consistency

  @Prop({ default: 'active' })
  status: string;

  @Prop({ 
    type: String, 
    enum: ['all', 'progress'], 
    default: 'all' 
  })
  type: string;

  @Prop([{ type: Types.ObjectId, ref: 'TeacherModule' }])
  prerequisites: Types.ObjectId[];

  @Prop({ default: true })
  isReusable: boolean; // If it can be used in multiple courses

  @Prop({ default: 0 })
  usageCount: number; // How many courses use it

  @Prop({ type: Object, default: { exercises: [] } })
  content: { exercises: Types.ObjectId[] };
}

export const TeacherModuleSchema = SchemaFactory.createForClass(TeacherModule);
