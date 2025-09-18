import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseExercise, CourseExerciseDocument } from './schemas/course-exercise.schema';
import { StudentExercise, StudentExerciseDocument } from '../students/schemas/student-exercise.schema';
import { OrderService } from './order.service';

@Injectable()
export class CourseExerciseService {
  constructor(
    @InjectModel(CourseExercise.name) private courseExerciseModel: Model<CourseExerciseDocument>,
    @InjectModel(StudentExercise.name) private studentExerciseModel: Model<StudentExerciseDocument>,
    private orderService: OrderService
  ) {}

  async getAllCourseExercises(query: any = {}) {
    const filter: any = { visible: true };

    if (query.courseModuleId) {
      filter.courseModuleId = query.courseModuleId;
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.difficulty) {
      filter.difficulty = query.difficulty;
    }

    if (query.status) {
      filter.status = query.status;
    }

    return this.courseExerciseModel.find(filter).exec();
  }

  async getCourseExerciseById(id: string) {
    const courseExercise = await this.courseExerciseModel.findById(id).exec();
    if (!courseExercise || !courseExercise.visible) {
      throw new NotFoundException('Course exercise not found');
    }
    return courseExercise;
  }

  async createCourseExercise(createCourseExerciseDto: any) {
    // Ensure templateExerciseId is ObjectId if it exists
    if (createCourseExerciseDto.templateExerciseId && typeof createCourseExerciseDto.templateExerciseId === 'string') {
      createCourseExerciseDto.templateExerciseId = new Types.ObjectId(createCourseExerciseDto.templateExerciseId);
    }

    // Ensure courseModuleId is ObjectId if it exists
    if (createCourseExerciseDto.courseModuleId && typeof createCourseExerciseDto.courseModuleId === 'string') {
      createCourseExerciseDto.courseModuleId = new Types.ObjectId(createCourseExerciseDto.courseModuleId);
    }

    const newCourseExercise = new this.courseExerciseModel(createCourseExerciseDto);
    return newCourseExercise.save();
  }

  async updateCourseExercise(id: string, updateCourseExerciseDto: any) {
    // Get the original exercise to compare content
    const originalExercise = await this.courseExerciseModel.findById(id).exec();
    if (!originalExercise) {
      throw new NotFoundException('Course exercise not found');
    }

    // Ensure templateExerciseId is ObjectId if it exists
    if (updateCourseExerciseDto.templateExerciseId && typeof updateCourseExerciseDto.templateExerciseId === 'string') {
      updateCourseExerciseDto.templateExerciseId = new Types.ObjectId(updateCourseExerciseDto.templateExerciseId);
    }

    // Ensure courseModuleId is ObjectId if it exists
    if (updateCourseExerciseDto.courseModuleId && typeof updateCourseExerciseDto.courseModuleId === 'string') {
      updateCourseExerciseDto.courseModuleId = new Types.ObjectId(updateCourseExerciseDto.courseModuleId);
    }

    const updatedCourseExercise = await this.courseExerciseModel
      .findByIdAndUpdate(id, updateCourseExerciseDto, { new: true })
      .exec();

    if (!updatedCourseExercise) {
      throw new NotFoundException('Course exercise not found');
    }

    return updatedCourseExercise;
  }

  async partialUpdateCourseExercise(id: string, partialUpdateDto: any) {
    console.log('=== CourseExerciseService.partialUpdateCourseExercise ===');
    console.log('Exercise ID:', id);
    console.log('Original update data:', partialUpdateDto);
    
    // Ensure templateExerciseId is ObjectId if it exists
    if (partialUpdateDto.templateExerciseId && typeof partialUpdateDto.templateExerciseId === 'string') {
      partialUpdateDto.templateExerciseId = new Types.ObjectId(partialUpdateDto.templateExerciseId);
    }

    // Ensure courseModuleId is ObjectId if it exists
    if (partialUpdateDto.courseModuleId && typeof partialUpdateDto.courseModuleId === 'string') {
      partialUpdateDto.courseModuleId = new Types.ObjectId(partialUpdateDto.courseModuleId);
    }

    console.log('Processed update data:', partialUpdateDto);
    console.log('MongoDB update query:', { $set: partialUpdateDto });

    // First, let's check what the current document looks like
    const currentDoc = await this.courseExerciseModel.findById(id).exec();
    console.log('Current document before update:', currentDoc);

    const updatedCourseExercise = await this.courseExerciseModel
      .findByIdAndUpdate(id, { $set: partialUpdateDto }, { new: true })
      .exec();

    console.log('MongoDB update result:', updatedCourseExercise);
    
    // Let's also verify the update worked by fetching the document again
    const verifyDoc = await this.courseExerciseModel.findById(id).exec();
    console.log('Document after update verification:', verifyDoc);

    if (!updatedCourseExercise) {
      throw new NotFoundException('Course exercise not found');
    }
    return updatedCourseExercise;
  }

  async deleteCourseExercise(id: string) {
    const deletedCourseExercise = await this.courseExerciseModel
      .findByIdAndUpdate(id, { visible: false }, { new: true })
      .exec();

    if (!deletedCourseExercise) {
      throw new NotFoundException('Course exercise not found');
    }

    // Get the previous and next exercises to reconnect them
    const previousExerciseId = deletedCourseExercise.previousExerciseId;
    const nextExerciseId = deletedCourseExercise.nextExerciseId;

    // Reconnect the linked list: connect previous to next
    if (previousExerciseId && nextExerciseId) {
      // Middle exercise: connect previous to next
      await this.courseExerciseModel.updateOne(
        { _id: previousExerciseId },
        { nextExerciseId: nextExerciseId }
      ).exec();
      await this.courseExerciseModel.updateOne(
        { _id: nextExerciseId },
        { previousExerciseId: previousExerciseId }
      ).exec();
    } else if (previousExerciseId) {
      // Last exercise: remove nextExerciseId from previous
      await this.courseExerciseModel.updateOne(
        { _id: previousExerciseId },
        { nextExerciseId: null }
      ).exec();
    } else if (nextExerciseId) {
      // First exercise: remove previousExerciseId from next
      await this.courseExerciseModel.updateOne(
        { _id: nextExerciseId },
        { previousExerciseId: null }
      ).exec();
    }

    // Mark corresponding StudentExercises as visible: false and reconnect their linked lists
    const studentExercises = await this.studentExerciseModel.find({
      courseExerciseId: new Types.ObjectId(id),
      visible: true
    }).exec();

    for (const studentExercise of studentExercises) {
      // Mark as invisible
      await this.studentExerciseModel.updateOne(
        { _id: studentExercise._id },
        { visible: false }
      ).exec();

      // Reconnect the student's linked list
      const studentPrevId = studentExercise.previousExerciseId;
      const studentNextId = studentExercise.nextExerciseId;

      if (studentPrevId && studentNextId) {
        // Middle exercise: connect previous to next
        await this.studentExerciseModel.updateOne(
          { _id: studentPrevId },
          { nextExerciseId: studentNextId }
        ).exec();
        await this.studentExerciseModel.updateOne(
          { _id: studentNextId },
          { previousExerciseId: studentPrevId }
        ).exec();
      } else if (studentPrevId) {
        // Last exercise: remove nextExerciseId from previous
        await this.studentExerciseModel.updateOne(
          { _id: studentPrevId },
          { nextExerciseId: null }
        ).exec();
      } else if (studentNextId) {
        // First exercise: remove previousExerciseId from next
        await this.studentExerciseModel.updateOne(
          { _id: studentNextId },
          { previousExerciseId: null }
        ).exec();
      }
    }

    return deletedCourseExercise;
  }
}
