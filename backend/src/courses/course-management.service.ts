import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from './schemas/course.schema';
import { CourseModule, CourseModuleDocument } from './schemas/course-module.schema';
import { CourseExercise, CourseExerciseDocument } from './schemas/course-exercise.schema';
import { CourseEnrollment, CourseEnrollmentDocument } from './schemas/course-enrollment.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class CourseManagementService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(CourseModule.name) private courseModuleModel: Model<CourseModuleDocument>,
    @InjectModel(CourseExercise.name) private courseExerciseModel: Model<CourseExerciseDocument>,
    @InjectModel(CourseEnrollment.name) private courseEnrollmentModel: Model<CourseEnrollmentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Basic course operations
  async getAllCourses(query: any = {}) {
    const filter: any = { visible: true };

    if (query.teacherId) {
      filter.teacherId = new Types.ObjectId(query.teacherId);
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.tags) {
      filter.tags = { $in: query.tags.split(',') };
    }

    const courses = await this.courseModel.find(filter).exec();
    return courses;
  }

  async getCourseById(id: string) {
    const course = await this.courseModel.findById(id).exec();
    if (!course || !course.visible) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async createCourse(createCourseDto: any) {
    const newCourse = new this.courseModel(createCourseDto);
    return newCourse.save();
  }

  async updateCourse(id: string, updateCourseDto: any) {
    const updatedCourse = await this.courseModel
      .findByIdAndUpdate(id, updateCourseDto, { new: true })
      .exec();

    if (!updatedCourse) {
      throw new NotFoundException('Course not found');
    }
    return updatedCourse;
  }

  async partialUpdateCourse(id: string, partialUpdateDto: any) {
    const updatedCourse = await this.courseModel
      .findByIdAndUpdate(id, { $set: partialUpdateDto }, { new: true })
      .exec();

    if (!updatedCourse) {
      throw new NotFoundException('Course not found');
    }
    return updatedCourse;
  }

  async deleteCourse(id: string) {
    const deletedCourse = await this.courseModel
      .findByIdAndUpdate(id, { visible: false }, { new: true })
      .exec();

    if (!deletedCourse) {
      throw new NotFoundException('Course not found');
    }
    return deletedCourse;
  }

  // Course statistics
  async getCourseStats(courseId: string, teacherId: string) {
    const course = await this.courseModel.findOne({
      _id: courseId,
      teacherId: new Types.ObjectId(teacherId),
      visible: true
    }).exec();

    if (!course) {
      throw new NotFoundException('Course not found or access denied');
    }

    // Calculate real stats - only count visible modules
    const visibleModules = await this.courseModuleModel.find({ 
      _id: { $in: course.modules },
      visible: true
    }).exec();
    
    const modulesCount = visibleModules.length;
    
    // Count total exercises across visible modules only
    const visibleModuleIds = visibleModules.map(m => m._id);
    const courseExercises = await this.courseExerciseModel.find({
      courseModuleId: { $in: visibleModuleIds },
      visible: true
    }).exec();
    
    const totalExercises = courseExercises.length;
    
    // Count enrolled students
    const enrolledStudents = course.students.length;

    // Calculate average progress across all enrolled students
    let averageProgress = 0;
    if (enrolledStudents > 0) {
      const enrollments = await this.courseEnrollmentModel.find({
        courseId: new Types.ObjectId(courseId),
        status: 'active',
        visible: true
      }).exec();

      if (enrollments.length > 0) {
        const totalProgress = enrollments.reduce((sum, enrollment) => sum + (enrollment.progress || 0), 0);
        averageProgress = Math.round(totalProgress / enrollments.length);
      }
    }

    return {
      courseId,
      courseTitle: course.title,
      modulesCount,
      totalExercises,
      enrolledStudents,
      maxStudents: course.maxStudents,
      courseStatus: course.status,
      progress: averageProgress
    };
  }
}
