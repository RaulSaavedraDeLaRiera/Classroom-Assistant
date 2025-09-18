import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StudentModule, StudentModuleDocument } from './schemas/student-module.schema';
import { StudentExercise, StudentExerciseDocument } from './schemas/student-exercise.schema';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(StudentModule.name) private studentModuleModel: Model<StudentModuleDocument>,
    @InjectModel(StudentExercise.name) private studentExerciseModel: Model<StudentExerciseDocument>,
  ) {}

  // Student Modules methods
  async getAllStudentModules(query: any): Promise<StudentModule[]> {
    // Build filters based on query parameters
    const filter: any = { visible: true };

    if (query.studentId) {
      filter.studentId = query.studentId;
    }

    if (query.courseId) {
      filter.courseId = query.courseId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.visible !== undefined) {
      filter.visible = query.visible === 'true';
    }

    return this.studentModuleModel.find(filter).exec();
  }

  async createStudentModule(createStudentModuleDto: any): Promise<StudentModule> {
    // Create new student module document
    const createdStudentModule = new this.studentModuleModel(createStudentModuleDto);
    return createdStudentModule.save();
  }

  async getStudentModuleById(id: string): Promise<StudentModule> {
    // Find student module by ID or throw error if not found
    const studentModule = await this.studentModuleModel.findById(id).exec();
    if (!studentModule) {
      throw new NotFoundException(`Student module with ID ${id} not found`);
    }
    return studentModule;
  }

  async updateStudentModule(id: string, updateStudentModuleDto: any): Promise<StudentModule> {
    // Update complete student module document
    const updatedStudentModule = await this.studentModuleModel
      .findByIdAndUpdate(id, updateStudentModuleDto, { new: true })
      .exec();

    if (!updatedStudentModule) {
      throw new NotFoundException(`Student module with ID ${id} not found`);
    }

    return updatedStudentModule;
  }

  async partialUpdateStudentModule(id: string, partialUpdateDto: any): Promise<StudentModule> {
    // Partial update using $set operator
    const updatedStudentModule = await this.studentModuleModel
      .findByIdAndUpdate(id, { $set: partialUpdateDto }, { new: true })
      .exec();

    if (!updatedStudentModule) {
      throw new NotFoundException(`Student module with ID ${id} not found`);
    }

    return updatedStudentModule;
  }

  async deleteStudentModule(id: string): Promise<StudentModule> {
    // Soft delete - set visible to false
    const deletedStudentModule = await this.studentModuleModel
      .findByIdAndUpdate(id, { visible: false }, { new: true })
      .exec();

    if (!deletedStudentModule) {
      throw new NotFoundException(`Student module with ID ${id} not found`);
    }

    return deletedStudentModule;
  }

  // Student Exercises methods
  async getAllStudentExercises(query: any): Promise<StudentExercise[]> {
    // Build filters based on query parameters
    const filter: any = { visible: true };

    if (query.studentId) {
      filter.studentId = query.studentId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.visible !== undefined) {
      filter.visible = query.visible === 'true';
    }

    return this.studentExerciseModel.find(filter).exec();
  }

  async createStudentExercise(createStudentExerciseDto: any): Promise<StudentExercise> {
    // Create new student exercise document
    const createdStudentExercise = new this.studentExerciseModel(createStudentExerciseDto);
    return createdStudentExercise.save();
  }

  async getStudentExerciseById(id: string): Promise<StudentExercise> {
    // Find student exercise by ID or throw error if not found
    const studentExercise = await this.studentExerciseModel.findById(id).exec();
    if (!studentExercise) {
      throw new NotFoundException(`Student exercise with ID ${id} not found`);
    }
    return studentExercise;
  }

  async updateStudentExercise(id: string, updateStudentExerciseDto: any): Promise<StudentExercise> {
    // Update complete student exercise document
    const updatedStudentExercise = await this.studentExerciseModel
      .findByIdAndUpdate(id, updateStudentExerciseDto, { new: true })
      .exec();

    if (!updatedStudentExercise) {
      throw new NotFoundException(`Student exercise with ID ${id} not found`);
    }

    return updatedStudentExercise;
  }

  async partialUpdateStudentExercise(id: string, partialUpdateDto: any): Promise<StudentExercise> {
    // Partial update using $set operator
    const updatedStudentExercise = await this.studentExerciseModel
      .findByIdAndUpdate(id, { $set: partialUpdateDto }, { new: true })
      .exec();

    if (!updatedStudentExercise) {
      throw new NotFoundException(`Student exercise with ID ${id} not found`);
    }

    return updatedStudentExercise;
  }

  async deleteStudentExercise(id: string): Promise<StudentExercise> {
    // Soft delete - set visible to false
    const deletedStudentExercise = await this.studentExerciseModel
      .findByIdAndUpdate(id, { visible: false }, { new: true })
      .exec();

    if (!deletedStudentExercise) {
      throw new NotFoundException(`Student exercise with ID ${id} not found`);
    }

    return deletedStudentExercise;
  }
}
