import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseModule, CourseModuleDocument } from './schemas/course-module.schema';
import { CourseExercise, CourseExerciseDocument } from './schemas/course-exercise.schema';
import { StudentModule, StudentModuleDocument } from '../students/schemas/student-module.schema';
import { StudentExercise, StudentExerciseDocument } from '../students/schemas/student-exercise.schema';
import { OrderService } from './order.service';

@Injectable()
export class CourseModuleService {
  constructor(
    @InjectModel(CourseModule.name) private courseModuleModel: Model<CourseModuleDocument>,
    @InjectModel(CourseExercise.name) private courseExerciseModel: Model<CourseExerciseDocument>,
    @InjectModel(StudentModule.name) private studentModuleModel: Model<StudentModuleDocument>,
    @InjectModel(StudentExercise.name) private studentExerciseModel: Model<StudentExerciseDocument>,
    private orderService: OrderService
  ) {}

  async getAllCourseModules(query: any = {}) {
    const filter: any = { visible: true };

    if (query.courseId) {
      filter.courseId = query.courseId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.type) {
      filter.type = query.type;
    }

    return this.courseModuleModel.find(filter).exec();
  }

  async getCourseModuleById(id: string) {
    const courseModule = await this.courseModuleModel.findById(id).exec();
    if (!courseModule || !courseModule.visible) {
      throw new NotFoundException('Course module not found');
    }
    return courseModule;
  }

  async createCourseModule(createCourseModuleDto: any) {
    // Ensure courseId is ObjectId if it exists
    if (createCourseModuleDto.courseId && typeof createCourseModuleDto.courseId === 'string') {
      createCourseModuleDto.courseId = new Types.ObjectId(createCourseModuleDto.courseId);
    }

    // Ensure templateModuleId is ObjectId if it exists
    if (createCourseModuleDto.templateModuleId && typeof createCourseModuleDto.templateModuleId === 'string') {
      createCourseModuleDto.templateModuleId = new Types.ObjectId(createCourseModuleDto.templateModuleId);
    }

    // Ensure teacherModuleId is ObjectId if it exists
    if (createCourseModuleDto.teacherModuleId && typeof createCourseModuleDto.teacherModuleId === 'string') {
      createCourseModuleDto.teacherModuleId = new Types.ObjectId(createCourseModuleDto.teacherModuleId);
    }

    const newCourseModule = new this.courseModuleModel(createCourseModuleDto);
    return newCourseModule.save();
  }

  async updateCourseModule(id: string, updateCourseModuleDto: any) {
    const updatedCourseModule = await this.courseModuleModel
      .findByIdAndUpdate(id, updateCourseModuleDto, { new: true })
      .exec();

    if (!updatedCourseModule) {
      throw new NotFoundException('Course module not found');
    }
    return updatedCourseModule;
  }

  async partialUpdateCourseModule(id: string, partialUpdateDto: any) {
    const updatedCourseModule = await this.courseModuleModel
      .findByIdAndUpdate(id, { $set: partialUpdateDto }, { new: true })
      .exec();

    if (!updatedCourseModule) {
      throw new NotFoundException('Course module not found');
    }
    return updatedCourseModule;
  }

  async deleteCourseModule(id: string) {
    const deletedCourseModule = await this.courseModuleModel
      .findByIdAndUpdate(id, { visible: false }, { new: true })
      .exec();

    if (!deletedCourseModule) {
      throw new NotFoundException('Course module not found');
    }

    // Also mark associated CourseExercises as visible: false
    const courseExercisesResult = await this.courseExerciseModel.updateMany({
      courseModuleId: deletedCourseModule._id,
      visible: true
    }, { visible: false }).exec();

    // Reconnect course module linked list (previous <-> next)
    const previousModuleId = deletedCourseModule.previousModuleId as any;
    const nextModuleId = deletedCourseModule.nextModuleId as any;
    if (previousModuleId && nextModuleId) {
      await this.courseModuleModel.updateOne(
        { _id: previousModuleId },
        { nextModuleId: nextModuleId }
      ).exec();
      await this.courseModuleModel.updateOne(
        { _id: nextModuleId },
        { previousModuleId: previousModuleId }
      ).exec();
    } else if (previousModuleId) {
      await this.courseModuleModel.updateOne(
        { _id: previousModuleId },
        { nextModuleId: null }
      ).exec();
    } else if (nextModuleId) {
      await this.courseModuleModel.updateOne(
        { _id: nextModuleId },
        { previousModuleId: null }
      ).exec();
    }

    // Mark corresponding StudentModules and StudentExercises as visible: false
    const studentModulesResult = await this.studentModuleModel.updateMany(
      {
        courseModuleId: deletedCourseModule._id,
        visible: true
      },
      { visible: false }
    ).exec();

    // Get all StudentModule IDs that were just marked as invisible
    const studentModules = await this.studentModuleModel.find({
      courseModuleId: deletedCourseModule._id,
      visible: false
    }, { _id: 1 }).exec();

    const studentModuleIds = studentModules.map(sm => sm._id);

    // Mark ALL StudentExercises in these modules as visible: false and reconnect student lists
    if (studentModuleIds.length > 0) {
      // Fetch affected student exercises to reconnect linked lists per module
      const affectedStudentExercises = await this.studentExerciseModel.find({
        studentModuleId: { $in: studentModuleIds },
        visible: true
      }).exec();

      // Mark them invisible first
      const studentExercisesResult = await this.studentExerciseModel.updateMany({
        studentModuleId: { $in: studentModuleIds },
        visible: true
      }, { visible: false }).exec();

      // Reconnect linked lists per student module
      const exercisesByStudentModule = new Map<string, any[]>();
      for (const ex of affectedStudentExercises) {
        const key = ex.studentModuleId.toString();
        if (!exercisesByStudentModule.has(key)) exercisesByStudentModule.set(key, []);
        exercisesByStudentModule.get(key)!.push(ex);
      }

      for (const [studentModuleId, exs] of exercisesByStudentModule.entries()) {
        for (const ex of exs) {
          const prevId = ex.previousExerciseId;
          const nextId = ex.nextExerciseId;
          if (prevId && nextId) {
            await this.studentExerciseModel.updateOne({ _id: prevId }, { nextExerciseId: nextId }).exec();
            await this.studentExerciseModel.updateOne({ _id: nextId }, { previousExerciseId: prevId }).exec();
          } else if (prevId) {
            await this.studentExerciseModel.updateOne({ _id: prevId }, { nextExerciseId: null }).exec();
          } else if (nextId) {
            await this.studentExerciseModel.updateOne({ _id: nextId }, { previousExerciseId: null }).exec();
          }
        }
      }
    }

    return deletedCourseModule;
  }
}
