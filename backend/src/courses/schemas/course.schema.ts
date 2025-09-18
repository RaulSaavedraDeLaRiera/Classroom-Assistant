import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseDocument = Course & Document;

@Schema({ timestamps: true, collection: 'courses' })
export class Course {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  teacherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TemplateCourse' })
  templateCourseId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], default: [] })
  modules: Types.ObjectId[]; // Can contain both TeacherModule and TemplateModule IDs

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  students: Types.ObjectId[]; // Lista de estudiantes inscritos en el curso

  @Prop({ default: true })
  visible: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 0 })
  estimatedTime: number; // in hours

  @Prop({ default: 'active' })
  status: string; // active, archived, draft

  @Prop({ default: 50 })
  maxStudents: number;

  @Prop()
  publishedAt: Date;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
