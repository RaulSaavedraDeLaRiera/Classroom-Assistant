import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudentExerciseDocument = StudentExercise & Document;

@Schema({ 
  collection: 'student_exercises',
  timestamps: true 
})
export class StudentExercise {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  content: string;

  @Prop({ required: true })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'StudentModule', required: true })
  studentModuleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CourseExercise' })
  courseExerciseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TeacherExercise' })
  teacherExerciseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TemplateExercise' })
  templateExerciseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course' })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  teacherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StudentExercise' })
  previousExerciseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'StudentExercise' })
  nextExerciseId: Types.ObjectId;

  @Prop({ default: true })
  visible: boolean;

  @Prop([String])
  tags: string[];

  @Prop({ 
    type: String, 
    enum: ['pending', 'ready', 'in_progress', 'completed', 'reviewed', 'blocked'], 
    default: 'pending' 
  })
  status: string;

  @Prop({ min: 0, max: 100 })
  score: number;

  @Prop({ min: 1, default: 10 })
  maxScore: number;

  @Prop({ default: 0 })
  estimatedTime: number;

  @Prop({ default: 'intermediate' })
  difficulty: string;

  @Prop()
  feedback: string;

  @Prop()
  timeSpent: number;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop()
  completedAt: Date;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ min: 0, max: 100, default: 0 })
  bestScore: number;

  @Prop([{ 
    score: { type: Number, min: 0, max: 100 },
    timestamp: { type: Date, default: Date.now }
  }])
  scores: Array<{ score: number; timestamp: Date }>;

  @Prop()
  startedAt: Date;

  @Prop()
  lastActivityAt: Date;
}

export const StudentExerciseSchema = SchemaFactory.createForClass(StudentExercise);

// Add validation middleware to ensure enum validation works
StudentExerciseSchema.pre('save', function(next) {
  const validStatuses = ['pending', 'ready', 'in_progress', 'completed', 'reviewed', 'blocked'];
  if (this.status && !validStatuses.includes(this.status)) {
    const error = new Error('Status must be one of: pending, ready, in_progress, completed, reviewed, blocked');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});
