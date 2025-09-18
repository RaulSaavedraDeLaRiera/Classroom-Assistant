import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TemplateExerciseDocument = TemplateExercise & Document;

@Schema({ timestamps: true, collection: 'template_exercises' })
export class TemplateExercise {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ required: true, enum: ['quiz', 'writing', 'reading', 'listening', 'speaking', 'grammar', 'vocabulary', 'assignment', 'project', 'discussion', 'presentation'] })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'TemplateModule', required: false })
  templateModuleId: Types.ObjectId;

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

  @Prop({ min: 0, max: 100 })
  estimatedScore: number;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const TemplateExerciseSchema = SchemaFactory.createForClass(TemplateExercise);
