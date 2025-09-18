import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseModuleDocument = CourseModule & Document;

@Schema({ 
  collection: 'course_modules',
  timestamps: true 
})
export class CourseModule {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TemplateModule' })
  templateModuleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TeacherModule' })
  teacherModuleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CourseModule' })
  previousModuleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CourseModule' })
  nextModuleId: Types.ObjectId;

  @Prop({ default: true })
  visible: boolean;

  @Prop([String])
  tags: string[];

  @Prop()
  estimatedTime: number;

  @Prop({ default: 0 })
  progress: number;

  @Prop({ 
    type: String, 
    enum: ['all', 'progress'], 
    default: 'all' 
  })
  type: string;

  @Prop({ 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'inactive' 
  })
  status: string;

  @Prop([{ type: Types.ObjectId, ref: 'CourseModule' }])
  prerequisites: Types.ObjectId[];

  @Prop({
    type: {
      exercises: [{ type: Types.ObjectId, ref: 'CourseExercise' }]
    },
    default: { exercises: [] }
  })
  content: {
    exercises: Types.ObjectId[];
  };
}

export const CourseModuleSchema = SchemaFactory.createForClass(CourseModule);
