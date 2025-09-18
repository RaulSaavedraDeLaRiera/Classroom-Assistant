import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TeacherModule, TeacherModuleDocument } from './schemas/teacher-module.schema';
import { TeacherExercise, TeacherExerciseDocument } from './schemas/teacher-exercise.schema';
import { TemplateModule, TemplateModuleDocument } from '../templates/schemas/template-module.schema';
import { TemplateExercise, TemplateExerciseDocument } from '../templates/schemas/template-exercise.schema';

@Injectable()
export class TeachersService {
  constructor(
    @InjectModel(TeacherModule.name) private teacherModuleModel: Model<TeacherModuleDocument>,
    @InjectModel(TeacherExercise.name) private teacherExerciseModel: Model<TeacherExerciseDocument>,
    @InjectModel(TemplateModule.name) private templateModuleModel: Model<TemplateModuleDocument>,
    @InjectModel(TemplateExercise.name) private templateExerciseModel: Model<TemplateExerciseDocument>
  ) {}

  // Teacher Modules
  async getTeacherModules(teacherId: string, query: any = {}) {
    const filter: any = { 
      teacherId: new this.teacherModuleModel.base.Types.ObjectId(teacherId),
      visible: true 
    };
    
    if (query.status) {
      filter.status = query.status;
    }
    
    if (query.tags) {
      filter.tags = { $in: query.tags.split(',') };
    }
    
    if (query.isReusable !== undefined) {
      filter.isReusable = query.isReusable === 'true';
    }
    
    return this.teacherModuleModel.find(filter).sort({ order: 1 }).exec();
  }

  async createTeacherModule(createModuleDto: any) {
    // Ensure teacherId is ObjectId
    if (createModuleDto.teacherId && typeof createModuleDto.teacherId === 'string') {
      createModuleDto.teacherId = new this.teacherModuleModel.base.Types.ObjectId(createModuleDto.teacherId);
    }
    
    // Ensure exercises array contains ObjectIds, not strings
    if (createModuleDto.content?.exercises) {
      createModuleDto.content.exercises = createModuleDto.content.exercises.map((id: any) => {
        // If it's already an ObjectId, keep it; if it's a string, convert it
        return typeof id === 'string' ? new this.teacherModuleModel.base.Types.ObjectId(id) : id;
      });
    }
    
    const newModule = new this.teacherModuleModel(createModuleDto);
    return newModule.save();
  }

  async getTeacherModuleById(id: string, teacherId: string) {
    const module = await this.teacherModuleModel.findOne({ 
      _id: id, 
      teacherId: new this.teacherModuleModel.base.Types.ObjectId(teacherId),
      visible: true 
    }).exec();
    
    if (!module) {
      throw new NotFoundException('Teacher module not found');
    }
    return module;
  }

  async updateTeacherModule(id: string, teacherId: string, updateModuleDto: any) {
    // Ensure teacherId is ObjectId
    if (updateModuleDto.teacherId && typeof updateModuleDto.teacherId === 'string') {
      updateModuleDto.teacherId = new this.teacherModuleModel.base.Types.ObjectId(updateModuleDto.teacherId);
    }
    
    // Ensure exercises array contains ObjectIds, not strings
    if (updateModuleDto.content?.exercises) {
      updateModuleDto.content.exercises = updateModuleDto.content.exercises.map((id: any) => {
        // If it's already an ObjectId, keep it; if it's a string, convert it
        return typeof id === 'string' ? new this.teacherModuleModel.base.Types.ObjectId(id) : id;
      });
    }
    
    const updatedModule = await this.teacherModuleModel
      .findOneAndUpdate(
        { 
          _id: id, 
          teacherId: new this.teacherModuleModel.base.Types.ObjectId(teacherId),
          visible: true 
        },
        { ...updateModuleDto, teacherId: new this.teacherModuleModel.base.Types.ObjectId(teacherId) },
        { new: true }
      )
      .exec();
    
    if (!updatedModule) {
      throw new NotFoundException('Teacher module not found');
    }
    return updatedModule;
  }

  async deleteTeacherModule(id: string, teacherId: string) {
    const deletedModule = await this.teacherModuleModel
      .findOneAndUpdate(
        { _id: id, teacherId: new this.teacherModuleModel.base.Types.ObjectId(teacherId), visible: true },
        { visible: false },
        { new: true }
      )
      .exec();
    
    if (!deletedModule) {
      throw new NotFoundException('Teacher module not found');
    }
    return deletedModule;
  }

  async copyFromTemplateModule(templateModuleId: string, teacherId: string) {
    // Fetch the template module to copy
    const templateModule = await this.templateModuleModel.findById(templateModuleId).exec();
    if (!templateModule) {
      throw new NotFoundException('Template module not found');
    }

    // Create a copy with teacher ownership
    // Keep original exercises array for copying exercises later
    const originalExercisesArray = templateModule.content?.exercises || [];
    
    // Create exercises array for the new module (will be populated with copied exercise IDs)
    let exercisesArray: any[] = [];
    
    const newModule = new this.teacherModuleModel({
      title: templateModule.title,
      description: templateModule.description,
      teacherId: new this.teacherModuleModel.base.Types.ObjectId(teacherId),
      templateModuleId: new this.teacherModuleModel.base.Types.ObjectId(templateModuleId),
      order: 0,
      tags: templateModule.tags || [],
      estimatedTime: templateModule.estimatedTime, // Use estimatedTime in minutes
      status: 'active',
      type: 'all', // Default type since TemplateModule doesn't have this field
      prerequisites: templateModule.prerequisites || [],
      isReusable: true,
      usageCount: 0,
      content: { exercises: exercisesArray }
    });
    
    const savedModule = await newModule.save();
    
              // Now copy all exercises from the template module
     try {
               // Get exercises from the ORIGINAL template module's content.exercises array
        const templateExercises = originalExercisesArray;

       
       if (templateExercises.length > 0) {

         
         // Copy each exercise
         for (let i = 0; i < templateExercises.length; i++) {
           const exerciseId = templateExercises[i];
           
           // Try to find the exercise in TemplateExercise collection
           const templateExercise = await this.templateExerciseModel.findById(exerciseId).exec();
           
           if (templateExercise) {
             const newExercise = new this.teacherExerciseModel({
               title: templateExercise.title,
               description: templateExercise.description,
               content: templateExercise.content,
               teacherId: new this.teacherExerciseModel.base.Types.ObjectId(teacherId),
               teacherModuleId: savedModule._id,
               templateExerciseId: new this.teacherExerciseModel.base.Types.ObjectId(templateExercise._id.toString()), // Reference to original template exercise
               order: i, // Use index as order
               type: templateExercise.type || 'exercise',
               difficulty: templateExercise.difficulty || 'medium',
               tags: templateExercise.tags || [],
               estimatedTime: templateExercise.estimatedTime || 0,
               status: 'active',
               isReusable: true,
               usageCount: 0
             });
             
             await newExercise.save();
             
             // Add the copied exercise ID to the exercises array
             exercisesArray.push(newExercise._id);
           } else {

           }
         }
         

         
         // Update the teacher module with the copied exercise IDs
         await this.teacherModuleModel.findByIdAndUpdate(
           savedModule._id,
           { 'content.exercises': exercisesArray }
         ).exec();
         

       } else {

       }
     } catch (error) {
       console.error('Error copying exercises:', error);
       // Don't fail the entire operation if exercises fail to copy
     }
    
    return savedModule;
  }

  // Teacher Exercises
  async getTeacherExercises(teacherId: string, query: any = {}) {
    const filter: any = { 
      teacherId: new this.teacherExerciseModel.base.Types.ObjectId(teacherId),
      visible: true 
    };
    
    if (query.teacherModuleId) {
      filter.teacherModuleId = query.teacherModuleId;
    }
    
    if (query.type) {
      filter.type = query.type;
    }
    
    if (query.difficulty) {
      filter.difficulty = query.difficulty;
    }
    
    if (query.tags) {
      filter.tags = { $in: query.tags.split(',') };
    }
    
    if (query.isReusable !== undefined) {
      filter.isReusable = query.isReusable === 'true';
    }
    
    return this.teacherExerciseModel.find(filter).sort({ order: 1 }).exec();
  }

  async createTeacherExercise(createExerciseDto: any) {
    // Ensure teacherId is ObjectId
    if (createExerciseDto.teacherId && typeof createExerciseDto.teacherId === 'string') {
      createExerciseDto.teacherId = new this.teacherExerciseModel.base.Types.ObjectId(createExerciseDto.teacherId);
    }
    
    // Ensure templateExerciseId is ObjectId if it exists
    if (createExerciseDto.templateExerciseId && typeof createExerciseDto.templateExerciseId === 'string') {
      createExerciseDto.templateExerciseId = new this.teacherExerciseModel.base.Types.ObjectId(createExerciseDto.templateExerciseId);
    }
    
    // Ensure teacherModuleId is ObjectId if it exists
    if (createExerciseDto.teacherModuleId && typeof createExerciseDto.teacherModuleId === 'string') {
      createExerciseDto.teacherModuleId = new this.teacherExerciseModel.base.Types.ObjectId(createExerciseDto.teacherModuleId);
    }
    
    const newExercise = new this.teacherExerciseModel(createExerciseDto);
    return newExercise.save();
  }

  async getTeacherExerciseById(id: string, teacherId: string) {
    // First check if the ID is valid
    if (!this.teacherExerciseModel.base.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid exercise ID format');
    }

    const exercise = await this.teacherExerciseModel.findOne({
      _id: id,
      teacherId: new this.teacherExerciseModel.base.Types.ObjectId(teacherId),
      visible: true
    }).exec();

    if (!exercise) {
      throw new NotFoundException('Teacher exercise not found');
    }
    return exercise;
  }

  async updateTeacherExercise(id: string, teacherId: string, updateExerciseDto: any) {
    // Ensure templateExerciseId is ObjectId if it exists
    if (updateExerciseDto.templateExerciseId && typeof updateExerciseDto.templateExerciseId === 'string') {
      updateExerciseDto.templateExerciseId = new this.teacherExerciseModel.base.Types.ObjectId(updateExerciseDto.templateExerciseId);
    }
    
    // Ensure teacherModuleId is ObjectId if it exists
    if (updateExerciseDto.teacherModuleId && typeof updateExerciseDto.teacherModuleId === 'string') {
      updateExerciseDto.teacherModuleId = new this.teacherExerciseModel.base.Types.ObjectId(updateExerciseDto.teacherModuleId);
    }
    
    const updatedExercise = await this.teacherExerciseModel
      .findOneAndUpdate(
        { _id: id, teacherId: new this.teacherExerciseModel.base.Types.ObjectId(teacherId), visible: true },
        updateExerciseDto,
        { new: true }
      )
      .exec();
    
    if (!updatedExercise) {
      throw new NotFoundException('Teacher exercise not found');
    }
    return updatedExercise;
  }

  async deleteTeacherExercise(id: string, teacherId: string) {
    const deletedExercise = await this.teacherExerciseModel
      .findOneAndUpdate(
        { _id: id, teacherId: new this.teacherExerciseModel.base.Types.ObjectId(teacherId), visible: true },
        { visible: false },
        { new: true }
      )
      .exec();
    
    if (!deletedExercise) {
      throw new NotFoundException('Teacher exercise not found');
    }
    return deletedExercise;
  }

  async copyFromTemplateExercise(templateExerciseId: string, teacherId: string, teacherModuleId?: string) {
    // Fetch the template exercise to copy
    const templateExercise = await this.templateExerciseModel.findById(templateExerciseId).exec();
    if (!templateExercise) {
      throw new NotFoundException('Template exercise not found');
    }

    // Create a copy with teacher ownership
    const newExercise = new this.teacherExerciseModel({
      title: templateExercise.title,
      description: templateExercise.description,
      content: templateExercise.content,
      type: templateExercise.type,
      teacherId: new this.teacherExerciseModel.base.Types.ObjectId(teacherId),
      teacherModuleId: teacherModuleId ? new this.teacherExerciseModel.base.Types.ObjectId(teacherModuleId) : undefined,
      templateExerciseId: new this.teacherExerciseModel.base.Types.ObjectId(templateExerciseId),
      order: 0,
      tags: templateExercise.tags || [],
      estimatedTime: templateExercise.estimatedTime,
      difficulty: templateExercise.difficulty,
      metadata: templateExercise.metadata || {},
      status: 'active',
      isReusable: true,
      usageCount: 0
    });
    
    return newExercise.save();
  }

  // Utility methods
  async getTeacherStats(teacherId: string) {
    const [modulesCount, exercisesCount] = await Promise.all([
      this.teacherModuleModel.countDocuments({ teacherId: new this.teacherModuleModel.base.Types.ObjectId(teacherId), visible: true }),
      this.teacherExerciseModel.countDocuments({ teacherId: new this.teacherExerciseModel.base.Types.ObjectId(teacherId), visible: true })
    ]);

    const reusableModules = await this.teacherModuleModel.countDocuments({ 
      teacherId: new this.teacherModuleModel.base.Types.ObjectId(teacherId), 
      visible: true, 
      isReusable: true 
    });

    const reusableExercises = await this.teacherExerciseModel.countDocuments({ 
      teacherId: new this.teacherExerciseModel.base.Types.ObjectId(teacherId), 
      visible: true, 
      isReusable: true 
    });

    return {
      totalModules: modulesCount,
      totalExercises: exercisesCount,
      reusableModules,
      reusableExercises
    };
  }

  async updateUsageCount(moduleId: string, increment: boolean = true) {
    const change = increment ? 1 : -1;
    return this.teacherModuleModel.findByIdAndUpdate(
      moduleId,
      { $inc: { usageCount: change } },
      { new: true }
    ).exec();
  }

  // Course integration methods
  async getModulesForCourse(teacherId: string, courseId?: string) {
    const filter: any = { teacherId: new this.teacherModuleModel.base.Types.ObjectId(teacherId), visible: true, isReusable: true };
    
    // If courseId is provided, we could filter modules that are already in use
    // For now, return all reusable modules
    return this.teacherModuleModel.find(filter).sort({ title: 1 }).exec();
  }

  async addModuleToCourse(moduleId: string, courseId: string, teacherId: string) {
    // Verify the module belongs to the teacher
    const module = await this.teacherModuleModel.findOne({
      _id: moduleId,
      teacherId: new this.teacherModuleModel.base.Types.ObjectId(teacherId),
      visible: true
    }).exec();

    if (!module) {
      throw new NotFoundException('Teacher module not found');
    }

    // Update usage count
    await this.updateUsageCount(moduleId, true);

    // Note: The actual course update would be handled by the courses service
    // This method just validates and updates usage
    return module;
  }

  async removeModuleFromCourse(moduleId: string, courseId: string, teacherId: string) {
    // Verify the module belongs to the teacher
    const module = await this.teacherModuleModel.findOne({
      _id: moduleId,
      teacherId: new this.teacherModuleModel.base.Types.ObjectId(teacherId),
      visible: true
    }).exec();

    if (!module) {
      throw new NotFoundException('Teacher module not found');
    }
    
    // Update usage count
    await this.updateUsageCount(moduleId, false);

    return module;
  }

  // Public templates access
  async getPublicTemplateModules(query: any = {}) {
    const filter: any = { visible: true };
    
    // Add search filter
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } }
      ];
    }
    
    // Add tags filter
    if (query.tags) {
      filter.tags = { $in: query.tags.split(',') };
    }
    
    return this.templateModuleModel.find(filter).sort({ title: 1 }).exec();
  }

  async getPublicTemplateExercises(query: any = {}) {
    const filter: any = { visible: true };
    
    // Add search filter
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { content: { $regex: query.search, $options: 'i' } }
      ];
    }
    
    // Add type filter
    if (query.type) {
      filter.type = query.type;
    }
    
    // Add difficulty filter
    if (query.difficulty) {
      filter.difficulty = query.difficulty;
    }
    
    // Add tags filter
    if (query.tags) {
      filter.tags = { $in: query.tags.split(',') };
    }
    
    return this.templateExerciseModel.find(filter).sort({ title: 1 }).exec();
  }
}
