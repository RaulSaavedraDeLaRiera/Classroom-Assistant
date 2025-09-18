import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TemplateCourse, TemplateCourseDocument } from './schemas/template-course.schema';
import { TemplateModule, TemplateModuleDocument } from './schemas/template-module.schema';
import { TemplateExercise, TemplateExerciseDocument } from './schemas/template-exercise.schema';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(TemplateCourse.name) private templateCourseModel: Model<TemplateCourseDocument>,
    @InjectModel(TemplateModule.name) private templateModuleModel: Model<TemplateModuleDocument>,
    @InjectModel(TemplateExercise.name) private templateExerciseModel: Model<TemplateExerciseDocument>
  ) {}

  // Template Courses
  async getAllTemplateCourses(query: any = {}) {
    // Get all template courses with optional filters
    const filter: any = { visible: true };
    
    // Basic filters
    if (query.isPublic !== undefined) {
      filter.isPublic = query.isPublic === 'true';
    }
    
    // Text search in title and description
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } }
      ];
    }
    
    // Filter by tags (exact match or partial match)
    if (query.tags) {
      if (Array.isArray(query.tags)) {
        filter.tags = { $in: query.tags };
      } else {
        filter.tags = { $regex: query.tags, $options: 'i' };
      }
    }
    
    // Filter by duration range
    if (query.minDuration !== undefined) {
      filter.estimatedTime = { $gte: Number(query.minDuration) };
    }
    if (query.maxDuration !== undefined) {
      if (filter.estimatedTime) {
        filter.estimatedTime.$lte = Number(query.maxDuration);
      } else {
        filter.estimatedTime = { $lte: Number(query.maxDuration) };
      }
    }
    
    // Filter by date range
    if (query.createdAfter) {
      filter.createdAt = { $gte: new Date(query.createdAfter) };
    }
    if (query.createdBefore) {
      if (filter.createdAt) {
        filter.createdAt.$lte = new Date(query.createdBefore);
      } else {
        filter.createdAt = { $lte: new Date(query.createdBefore) };
      }
    }
    
    // Sort options
    let sortOptions: any = {};
    if (query.sortBy) {
      const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
      sortOptions[query.sortBy] = sortOrder;
    } else {
      sortOptions = { createdAt: -1 }; // Default: newest first
    }
    
    return this.templateCourseModel.find(filter).sort(sortOptions).exec();
  }

  async createTemplateCourse(createTemplateCourseDto: any) {
    // Create new template course (admin/authorized teacher only)
    // Ensure modules array contains ObjectIds, not strings
    if (createTemplateCourseDto.content?.modules) {
      createTemplateCourseDto.content.modules = createTemplateCourseDto.content.modules.map((id: any) => {
        // If it's already an ObjectId, keep it; if it's a string, convert it
        return typeof id === 'string' ? new this.templateCourseModel.base.Types.ObjectId(id) : id;
      });
    }
    
    const newTemplateCourse = new this.templateCourseModel(createTemplateCourseDto);
    return newTemplateCourse.save();
  }

  async getTemplateCourseById(id: string) {
    // Get specific template course by ID
    const templateCourse = await this.templateCourseModel.findById(id).exec();
    if (!templateCourse || !templateCourse.visible) {
      throw new NotFoundException('Template course not found');
    }
    return templateCourse;
  }

  async updateTemplateCourse(id: string, updateTemplateCourseDto: any) {
    // Update complete template course
    // Ensure modules array contains ObjectIds, not strings
    if (updateTemplateCourseDto.content?.modules) {
      updateTemplateCourseDto.content.modules = updateTemplateCourseDto.content.modules.map((id: any) => {
        // If it's already an ObjectId, keep it; if it's a string, convert it
        return typeof id === 'string' ? new this.templateCourseModel.base.Types.ObjectId(id) : id;
      });
    }
    
    const updatedTemplateCourse = await this.templateCourseModel
      .findByIdAndUpdate(id, updateTemplateCourseDto, { new: true })
      .exec();
    
    if (!updatedTemplateCourse) {
      throw new NotFoundException('Template course not found');
    }
    return updatedTemplateCourse;
  }

  async partialUpdateTemplateCourse(id: string, partialUpdateDto: any) {
    // Partial update of template course (title, modules, description)
    // Ensure modules array contains ObjectIds, not strings
    if (partialUpdateDto.content?.modules) {
      partialUpdateDto.content.modules = partialUpdateDto.content.modules.map((id: any) => {
        // If it's already an ObjectId, keep it; if it's a string, convert it
        return typeof id === 'string' ? new this.templateCourseModel.base.Types.ObjectId(id) : id;
      });
    }
    
    const updatedTemplateCourse = await this.templateCourseModel
      .findByIdAndUpdate(id, { $set: partialUpdateDto }, { new: true })
      .exec();
    
    if (!updatedTemplateCourse) {
      throw new NotFoundException('Template course not found');
    }
    return updatedTemplateCourse;
  }

  async deleteTemplateCourse(id: string) {
    // Soft delete - hide template course (visible=false)
    const deletedTemplateCourse = await this.templateCourseModel
      .findByIdAndUpdate(id, { visible: false }, { new: true })
      .exec();
    
    if (!deletedTemplateCourse) {
      throw new NotFoundException('Template course not found');
    }
    return deletedTemplateCourse;
  }

  // Template Modules
  async getAllTemplateModules(query: any = {}) {
    // Get all template modules with optional filters
    const filter: any = { visible: true };
    
    if (query.templateCourseId) {
      filter.templateCourseId = query.templateCourseId;
    }
    
    if (query.status) {
      filter.status = query.status;
    }
    
    return this.templateModuleModel.find(filter).exec();
  }

  async createTemplateModule(createTemplateModuleDto: any) {
    // Create new template module
    // Ensure exercises array contains ObjectIds, not strings
    if (createTemplateModuleDto.content?.exercises) {
      createTemplateModuleDto.content.exercises = createTemplateModuleDto.content.exercises.map((id: any) => {
        // If it's already an ObjectId, keep it; if it's a string, convert it
        return typeof id === 'string' ? new this.templateModuleModel.base.Types.ObjectId(id) : id;
      });
    }
    
    const newTemplateModule = new this.templateModuleModel(createTemplateModuleDto);
    return newTemplateModule.save();
  }

  async getTemplateModuleById(id: string) {
    // Get specific template module by ID
    const templateModule = await this.templateModuleModel.findById(id).exec();
    if (!templateModule || !templateModule.visible) {
      throw new NotFoundException('Template module not found');
    }
    return templateModule;
  }

  async updateTemplateModule(id: string, updateTemplateModuleDto: any) {
    // Update complete template module
    // Ensure exercises array contains ObjectIds, not strings
    if (updateTemplateModuleDto.content?.exercises) {
      updateTemplateModuleDto.content.exercises = updateTemplateModuleDto.content.exercises.map((id: any) => {
        // If it's already an ObjectId, keep it; if it's a string, convert it
        return typeof id === 'string' ? new this.templateModuleModel.base.Types.ObjectId(id) : id;
      });
    }
    
    const updatedTemplateModule = await this.templateModuleModel
      .findByIdAndUpdate(id, updateTemplateModuleDto, { new: true })
      .exec();
    
    if (!updatedTemplateModule) {
      throw new NotFoundException('Template module not found');
    }
    return updatedTemplateModule;
  }

  async partialUpdateTemplateModule(id: string, partialUpdateDto: any) {
    // Partial update of template module
    // Ensure exercises array contains ObjectIds, not strings
    if (partialUpdateDto.content?.exercises) {
      partialUpdateDto.content.exercises = partialUpdateDto.content.exercises.map((id: any) => {
        // If it's already an ObjectId, keep it; if it's a string, convert it
        return typeof id === 'string' ? new this.templateModuleModel.base.Types.ObjectId(id) : id;
      });
    }
    
    const updatedTemplateModule = await this.templateModuleModel
      .findByIdAndUpdate(id, { $set: partialUpdateDto }, { new: true })
      .exec();
    
    if (!updatedTemplateModule) {
      throw new NotFoundException('Template module not found');
    }
    return updatedTemplateModule;
  }

  async deleteTemplateModule(id: string) {
    // Soft delete - hide template module (visible=false)
    const deletedTemplateModule = await this.templateModuleModel
      .findByIdAndUpdate(id, { visible: false }, { new: true })
      .exec();
    
    if (!deletedTemplateModule) {
      throw new NotFoundException('Template module not found');
    }
    return deletedTemplateModule;
  }

  // Template Exercises
  async getAllTemplateExercises(query: any = {}) {
    // Get all template exercises with optional filters
    const filter: any = { visible: true };
    
    if (query.templateModuleId) {
      filter.templateModuleId = new this.templateModuleModel.base.Types.ObjectId(query.templateModuleId);
    }
    
    if (query.type) {
      filter.type = query.type;
    }
    
    if (query.difficulty) {
      filter.difficulty = query.difficulty;
    }
    
    return this.templateExerciseModel.find(filter).exec();
  }

  async createTemplateExercise(createTemplateExerciseDto: any) {
    // Create new template exercise
    const newTemplateExercise = new this.templateExerciseModel(createTemplateExerciseDto);
    return newTemplateExercise.save();
  }

  async getTemplateExerciseById(id: string) {
    // Get specific template exercise by ID
    const templateExercise = await this.templateExerciseModel.findById(id).exec();
    if (!templateExercise || !templateExercise.visible) {
      throw new NotFoundException('Template exercise not found');
    }
    return templateExercise;
  }

  async updateTemplateExercise(id: string, updateTemplateExerciseDto: any) {
    // Update complete template exercise
    const updatedTemplateExercise = await this.templateExerciseModel
      .findByIdAndUpdate(id, updateTemplateExerciseDto, { new: true })
      .exec();
    
    if (!updatedTemplateExercise) {
      throw new NotFoundException('Template exercise not found');
    }
    return updatedTemplateExercise;
  }

  async partialUpdateTemplateExercise(id: string, partialUpdateDto: any) {
    // Partial update of template exercise
    const updatedTemplateExercise = await this.templateExerciseModel
      .findByIdAndUpdate(id, { $set: partialUpdateDto }, { new: true })
      .exec();
    
    if (!updatedTemplateExercise) {
      throw new NotFoundException('Template exercise not found');
    }
    return updatedTemplateExercise;
  }

  async deleteTemplateExercise(id: string) {
    // Soft delete - hide template exercise (visible=false)
    const deletedTemplateExercise = await this.templateExerciseModel
      .findByIdAndUpdate(id, { visible: false }, { new: true })
      .exec();
    
    if (!deletedTemplateExercise) {
      throw new NotFoundException('Template exercise not found');
    }
    return deletedTemplateExercise;
  }
}
