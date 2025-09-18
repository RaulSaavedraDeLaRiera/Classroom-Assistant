import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TemplateModuleDocument = TemplateModule & Document;

@Schema({ timestamps: true, collection: 'template_modules' })
export class TemplateModule {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'TemplateCourse' })
  templateCourseId: Types.ObjectId; // Made optional

  @Prop({ default: true })
  visible: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  estimatedTime: number; // Time in minutes for consistency

  @Prop({ default: 'active' })
  status: string;

  @Prop({ 
    type: String, 
    enum: ['all', 'progress'], 
    default: 'all' 
  })
  type: string;

  @Prop([{ type: Types.ObjectId, ref: 'TemplateModule' }])
  prerequisites: Types.ObjectId[];

  @Prop({ type: Object, default: { exercises: [] } })
  content: { exercises: Types.ObjectId[] };
}

export const TemplateModuleSchema = SchemaFactory.createForClass(TemplateModule);
