import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseExerciseDocument = CourseExercise & Document;

@Schema({ timestamps: true, collection: 'course_exercises' })
export class CourseExercise {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ required: true, trim: true, type: String })
  content: string;

  @Prop({ required: true, enum: ['quiz', 'writing', 'reading', 'listening', 'speaking', 'grammar', 'vocabulary'] })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'CourseModule', required: true })
  courseModuleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TemplateExercise' })
  templateExerciseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TeacherExercise' })
  teacherExerciseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CourseExercise' })
  previousExerciseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CourseExercise' })
  nextExerciseId: Types.ObjectId;

  @Prop({ default: true })
  visible: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  estimatedTime: number;

  @Prop({ min: 1, default: 10 })
  maxScore: number;

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
}

export const CourseExerciseSchema = SchemaFactory.createForClass(CourseExercise);
