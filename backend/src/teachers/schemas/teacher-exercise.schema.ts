import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TeacherExerciseDocument = TeacherExercise & Document;

@Schema({ timestamps: true, collection: 'teacher_exercises' })
export class TeacherExercise {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ required: true, enum: ['quiz', 'writing', 'reading', 'listening', 'speaking', 'grammar', 'vocabulary'] })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'TeacherModule' })
  teacherModuleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TemplateExercise' })
  templateExerciseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  teacherId: Types.ObjectId;



  @Prop({ default: true })
  visible: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  estimatedTime: number;

  @Prop({ 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'], 
    default: 'intermediate' 
  })
  difficulty: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ default: 'active' })
  status: string; // active, archived, draft

  @Prop({ default: true })
  isReusable: boolean; // If it can be used in multiple modules

  @Prop({ default: 0 })
  usageCount: number; // How many modules use it
}

export const TeacherExerciseSchema = SchemaFactory.createForClass(TeacherExercise);
