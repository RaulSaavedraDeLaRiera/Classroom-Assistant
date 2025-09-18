import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { CourseEnrollment, CourseEnrollmentDocument } from '../schemas/course-enrollment.schema';
import { StudentExercise, StudentExerciseDocument } from '../../students/schemas/student-exercise.schema';
import { CourseAccessService } from '../course-access.service';

@Injectable()
export class StudentStatisticsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(CourseEnrollment.name) private courseEnrollmentModel: Model<CourseEnrollmentDocument>,
    @InjectModel(StudentExercise.name) private studentExerciseModel: Model<StudentExerciseDocument>,
    private courseAccessService: CourseAccessService
  ) {}

  // Get all enrollments for a specific student
  async getStudentEnrollments(studentId: string, teacherId: string) {
    try {
      // Verify student belongs to teacher
      const student = await this.userModel.findOne({
        _id: studentId,
        role: 'student',
        visible: true,
        teacherIds: new Types.ObjectId(teacherId)
      }).exec();

      if (!student) {
        throw new NotFoundException('Student not found or not associated with teacher');
      }

      // Get all enrollments for this student
      const enrollments = await this.courseEnrollmentModel.find({
        studentId: new Types.ObjectId(studentId),
        visible: true
      }).populate('courseId', 'title description status').exec();

      // Transform the data to include course information
      const enrollmentsWithCourseInfo = enrollments.map(enrollment => ({
        _id: enrollment._id,
        courseId: enrollment.courseId._id,
        courseTitle: (enrollment.courseId as any)?.title || 'Unknown Course',
        studentId: enrollment.studentId,
        enrolledAt: enrollment.enrolledAt,
        completedModules: enrollment.completedModules || 0,
        totalModules: enrollment.totalModules || 0,
        completedExercises: enrollment.completedExercises || 0,
        totalExercises: enrollment.totalExercises || 0,
        progress: enrollment.progress || 0,
        averageScore: enrollment.averageScore || 0,
        status: enrollment.status || 'active'
      }));

      return enrollmentsWithCourseInfo;
    } catch (error) {
      console.error('Error in getStudentEnrollments:', error);
      throw error;
    }
  }

  // Get student statistics across all courses
  async getStudentStatistics(studentId: string, teacherId: string) {
    try {
      // Verify student belongs to teacher
      const student = await this.userModel.findOne({
        _id: studentId,
        role: 'student',
        visible: true,
        teacherIds: new Types.ObjectId(teacherId)
      }).exec();

      if (!student) {
        throw new NotFoundException('Student not found or not associated with teacher');
      }

      // Get all enrollments for this student
      const enrollments = await this.courseEnrollmentModel.find({
        studentId: new Types.ObjectId(studentId),
        visible: true
      }).exec();

      // Calculate overall statistics
      const totalModules = enrollments.reduce((sum, enrollment) => sum + (enrollment.totalModules || 0), 0);
      const completedModules = enrollments.reduce((sum, enrollment) => sum + (enrollment.completedModules || 0), 0);
      const totalExercises = enrollments.reduce((sum, enrollment) => sum + (enrollment.totalExercises || 0), 0);
      const completedExercises = enrollments.reduce((sum, enrollment) => sum + (enrollment.completedExercises || 0), 0);
      
      // Calculate average progress across all courses
      const averageProgress = enrollments.length > 0 
        ? Math.round(enrollments.reduce((sum, enrollment) => sum + (enrollment.progress || 0), 0) / enrollments.length)
        : 0;

      // Calculate average score across all courses
      const coursesWithScores = enrollments.filter(e => e.averageScore > 0);
      const averageScore = coursesWithScores.length > 0
        ? Math.round(coursesWithScores.reduce((sum, enrollment) => sum + enrollment.averageScore, 0) / coursesWithScores.length)
        : 0;

      return {
        totalEnrollments: enrollments.length,
        totalModules,
        completedModules,
        totalExercises,
        completedExercises,
        averageProgress,
        averageScore,
        activeEnrollments: enrollments.filter(e => e.status === 'active').length,
        completedEnrollments: enrollments.filter(e => e.status === 'completed').length
      };
    } catch (error) {
      console.error('Error in getStudentStatistics:', error);
      throw error;
    }
  }

  // Get last exercise completed by student
  async getLastExerciseCompleted(studentId: string, teacherId: string) {
    // Verify student belongs to teacher
    const student = await this.userModel.findOne({
      _id: studentId,
      role: 'student',
      visible: true,
      teacherIds: new Types.ObjectId(teacherId)
    }).exec();

    if (!student) {
      throw new NotFoundException('Student not found or not associated with teacher');
    }

    // Get the most recently completed exercise
    const lastExercise = await this.studentExerciseModel.findOne({
      studentId: new Types.ObjectId(studentId),
      status: { $in: ['completed', 'reviewed'] },
      visible: true,
      completedAt: { $exists: true }
    })
    .populate('courseExerciseId', 'title type')
    .populate('courseId', 'title')
    .sort({ completedAt: -1 })
    .exec();

    if (!lastExercise) {
      return null;
    }

    return {
      _id: lastExercise._id,
      title: lastExercise.title,
      type: lastExercise.type,
      courseTitle: 'Course Title', // We'll get this from the populated courseId if needed
      completedAt: lastExercise.completedAt,
      score: lastExercise.score,
      status: lastExercise.status
    };
  }
}
