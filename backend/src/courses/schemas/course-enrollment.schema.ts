import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseEnrollmentDocument = CourseEnrollment & Document;

@Schema({ 
  collection: 'course_enrollments',
  timestamps: true 
})
export class CourseEnrollment {
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  teacherId: Types.ObjectId;

  @Prop({ default: 'active' })
  status: string; // active, completed, dropped, suspended, historical, removed

  @Prop({ default: Date.now })
  enrolledAt: Date;

  @Prop()
  completedAt: Date;

  @Prop()
  endedAt: Date; // When enrollment was ended (for historical enrollments)

  @Prop({ type: Types.ObjectId, ref: 'CourseEnrollment' })
  previousEnrollmentId: Types.ObjectId; // Reference to previous enrollment

  @Prop({ default: 0 })
  progress: number; // 0-100

  // Exercise statistics
  @Prop({ default: 0 })
  totalExercises: number;

  @Prop({ default: 0 })
  completedExercises: number;

  // Module statistics
  @Prop({ default: 0 })
  totalModules: number;

  @Prop({ default: 0 })
  completedModules: number;

  // Grade statistics
  @Prop({ default: 0 })
  averageScore: number; // 0-100 normalized average

  @Prop({ default: 0 })
  totalPoints: number; // Sum of all exercise max points

  @Prop({ default: 0 })
  earnedPoints: number; // Sum of all earned points

  @Prop({ type: [Number], default: [] })
  exerciseScores: number[]; // Array of normalized scores (0-100) for each exercise

  @Prop({ type: [Types.ObjectId], default: [] })
  completedExerciseIds: Types.ObjectId[]; // IDs of completed exercises

  @Prop({ type: [Types.ObjectId], default: [] })
  completedModuleIds: Types.ObjectId[]; // IDs of completed modules

  @Prop({ default: true })
  visible: boolean;

  @Prop()
  notes: string;
}

export const CourseEnrollmentSchema = SchemaFactory.createForClass(CourseEnrollment);

// Compound index to ensure unique active student-course combinations
// Note: This index will be created manually to avoid conflicts
// CourseEnrollmentSchema.index({ courseId: 1, studentId: 1, status: 1 }, { 
//   unique: true, 
//   partialFilterExpression: { status: 'active' }
// });
