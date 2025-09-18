import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TemplateCourseDocument = TemplateCourse & Document;

@Schema({ timestamps: true, collection: 'template_courses' })
export class TemplateCourse {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ default: true })
  visible: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 0 })
  estimatedDuration: number; // in hours

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ type: Object, default: { modules: [] } })
  content: { modules: Types.ObjectId[] };
}

export const TemplateCourseSchema = SchemaFactory.createForClass(TemplateCourse);
