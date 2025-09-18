import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudentModuleDocument = StudentModule & Document;

@Schema({ 
  collection: 'student_modules',
  timestamps: true 
})
export class StudentModule {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CourseModule', required: true })
  courseModuleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StudentModule' })
  previousModuleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StudentModule' })
  nextModuleId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  order: number;

  @Prop({ default: true })
  visible: boolean;

  @Prop([String])
  tags: string[];

  @Prop({ default: 'active' })
  status: string;

  @Prop({ default: 0 })
  progress: number;

  @Prop([{ type: Types.ObjectId, ref: 'StudentExercise' }])
  studentExerciseIds: Types.ObjectId[];

  @Prop({ 
    type: String, 
    enum: ['all', 'progress'], 
    default: 'all' 
  })
  type: string;

  @Prop()
  startedAt: Date;

  @Prop()
  lastActivityAt: Date;
}

export const StudentModuleSchema = SchemaFactory.createForClass(StudentModule);
