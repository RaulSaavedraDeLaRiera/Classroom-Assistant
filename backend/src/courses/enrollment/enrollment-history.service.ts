import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseEnrollment, CourseEnrollmentDocument } from '../schemas/course-enrollment.schema';
import { CourseAccessService } from '../course-access.service';

@Injectable()
export class EnrollmentHistoryService {
  constructor(
    @InjectModel(CourseEnrollment.name) private courseEnrollmentModel: Model<CourseEnrollmentDocument>,
    private courseAccessService: CourseAccessService
  ) {}

  async getEnrollmentHistory(courseId: string, teacherId: string) {
    // Verify teacher access to course
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Get all enrollments for this course (including historical)
    const enrollments = await this.courseEnrollmentModel.find({
      courseId: new Types.ObjectId(courseId)
    })
    .populate('studentId', 'name email')
    .populate('teacherId', 'name email')
    .populate('previousEnrollmentId', 'enrolledAt endedAt progress')
    .sort({ enrolledAt: -1 })
    .exec();

    return enrollments;
  }

  async getStudentEnrollmentHistory(courseId: string, studentId: string, teacherId: string) {
    // Verify teacher access to course
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Get all enrollments for this student in this course
    const enrollments = await this.courseEnrollmentModel.find({
      courseId: new Types.ObjectId(courseId),
      studentId: new Types.ObjectId(studentId)
    })
    .populate('studentId', 'name email')
    .populate('teacherId', 'name email')
    .populate('previousEnrollmentId', 'enrolledAt endedAt progress')
    .sort({ enrolledAt: -1 })
    .exec();

    return enrollments;
  }
}
