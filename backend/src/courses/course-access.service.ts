import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from './schemas/course.schema';

@Injectable()
export class CourseAccessService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>
  ) {}

  /**
   * Validates that a course exists and the teacher has access to it
   * @param courseId - The course ID to validate
   * @param teacherId - The teacher ID requesting access
   * @returns The course document if valid
   * @throws NotFoundException if course not found or access denied
   */
  async validateCourseAccess(courseId: string, teacherId: string): Promise<CourseDocument> {
    const course = await this.courseModel.findOne({
      _id: new Types.ObjectId(courseId),
      teacherId: new Types.ObjectId(teacherId),
      visible: true
    }).exec();

    if (!course) {
      throw new NotFoundException('Course not found or access denied');
    }

    return course;
  }

  /**
   * Validates course access without throwing exception
   * @param courseId - The course ID to validate
   * @param teacherId - The teacher ID requesting access
   * @returns True if access is valid, false otherwise
   */
  async hasCourseAccess(courseId: string, teacherId: string): Promise<boolean> {
    try {
      await this.validateCourseAccess(courseId, teacherId);
      return true;
    } catch {
      return false;
    }
  }
}
