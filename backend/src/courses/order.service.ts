import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseModule, CourseModuleDocument } from './schemas/course-module.schema';
import { CourseExercise, CourseExerciseDocument } from './schemas/course-exercise.schema';
import { StudentModule, StudentModuleDocument } from '../students/schemas/student-module.schema';
import { StudentExercise, StudentExerciseDocument } from '../students/schemas/student-exercise.schema';
import { Course, CourseDocument } from './schemas/course.schema';
import { ModuleOrderService } from './order/module-order.service';
import { ExerciseOrderService } from './order/exercise-order.service';
import { StudentOrderService } from './order/student-order.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(CourseModule.name) private courseModuleModel: Model<CourseModuleDocument>,
    @InjectModel(CourseExercise.name) private courseExerciseModel: Model<CourseExerciseDocument>,
    @InjectModel(StudentModule.name) private studentModuleModel: Model<StudentModuleDocument>,
    @InjectModel(StudentExercise.name) private studentExerciseModel: Model<StudentExerciseDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    private moduleOrderService: ModuleOrderService,
    private exerciseOrderService: ExerciseOrderService,
    private studentOrderService: StudentOrderService
  ) {}

  // ===== MODULE ORDER MANAGEMENT =====
  
  /**
   * Adds a module to the end of the course queue
   * @param courseId - The course ID
   * @param moduleId - The module ID to add
   */
  async addModuleToCourse(courseId: string, moduleId: string): Promise<void> {
    return this.moduleOrderService.addModuleToCourse(courseId, moduleId);
  }

  /**
   * Adds a module to the course at a specific index (respecting selection order)
   * @param courseId - The course ID
   * @param moduleId - The module ID to add
   * @param index - The position where the module should be placed
   */
  async addModuleToCourseByIndex(courseId: string, moduleId: string, index: number): Promise<void> {
    return this.moduleOrderService.addModuleToCourseByIndex(courseId, moduleId, index);
  }

  /**
   * Removes a module from the course queue and reconnects the chain
   * @param moduleId - The module ID to remove
   */
  async removeModuleFromCourse(moduleId: string): Promise<void> {
    return this.moduleOrderService.removeModuleFromCourse(moduleId);
  }

  /**
   * Reorders a module by updating its previous and next references
   * @param moduleId - The module ID to reorder
   * @param previousModuleId - The new previous module ID (null for first position)
   * @param nextModuleId - The new next module ID (null for last position)
   */
  async reorderModule(moduleId: string, previousModuleId: string | null, nextModuleId: string | null): Promise<void> {
    return this.moduleOrderService.reorderModule(moduleId, previousModuleId, nextModuleId);
  }

  /**
   * Swaps two modules in the queue
   */
  private async swapModules(moduleId1: string, moduleId2: string): Promise<void> {
    const module1 = await this.courseModuleModel.findById(moduleId1).exec();
    const module2 = await this.courseModuleModel.findById(moduleId2).exec();
    
    if (!module1 || !module2) return;

    // Store original references
    const module1Prev = module1.previousModuleId;
    const module1Next = module1.nextModuleId;
    const module2Prev = module2.previousModuleId;
    const module2Next = module2.nextModuleId;

    // Update module1 to point to module2's neighbors
    await this.courseModuleModel.findByIdAndUpdate(moduleId1, {
      previousModuleId: module2Prev,
      nextModuleId: module2Next
    }).exec();

    // Update module2 to point to module1's neighbors
    await this.courseModuleModel.findByIdAndUpdate(moduleId2, {
      previousModuleId: module1Prev,
      nextModuleId: module1Next
    }).exec();

    // Update neighbors to point to the swapped modules
    if (module1Prev) {
      await this.courseModuleModel.findByIdAndUpdate(module1Prev, {
        nextModuleId: new Types.ObjectId(moduleId2)
      }).exec();
    }
    
    if (module1Next) {
      await this.courseModuleModel.findByIdAndUpdate(module1Next, {
        previousModuleId: new Types.ObjectId(moduleId2)
      }).exec();
    }
    
    if (module2Prev) {
      await this.courseModuleModel.findByIdAndUpdate(module2Prev, {
        nextModuleId: new Types.ObjectId(moduleId1)
      }).exec();
    }
    
    if (module2Next) {
      await this.courseModuleModel.findByIdAndUpdate(module2Next, {
        previousModuleId: new Types.ObjectId(moduleId1)
      }).exec();
    }
  }

  /**
   * Inserts a module before another module in the queue
   * @param moduleId - The module ID to insert
   * @param targetModuleId - The target module ID to insert before
   */
  async insertModuleBefore(moduleId: string, targetModuleId: string): Promise<void> {
    const targetModule = await this.courseModuleModel.findById(targetModuleId).exec();
    if (!targetModule) return;

    const previousModuleId = targetModule.previousModuleId;

    // Update the module to be inserted
    await this.courseModuleModel.findByIdAndUpdate(moduleId, {
      previousModuleId: previousModuleId,
      nextModuleId: targetModule._id
    }).exec();

    // Update the target module
    await this.courseModuleModel.findByIdAndUpdate(targetModuleId, {
      previousModuleId: new Types.ObjectId(moduleId)
    }).exec();

    // Update the previous module (if exists)
    if (previousModuleId) {
      await this.courseModuleModel.findByIdAndUpdate(previousModuleId, {
        nextModuleId: new Types.ObjectId(moduleId)
      }).exec();
    }
  }

  /**
   * Gets all modules for a course in their correct order
   * @param courseId - The course ID
   * @returns Array of ordered modules
   */
  async getOrderedModules(courseId: string): Promise<CourseModule[]> {
    return this.moduleOrderService.getOrderedModules(courseId);
  }

  /**
   * Reorders a module by inserting it at a specific index within its course
   */
  async reorderModuleByIndex(courseId: string, moduleId: string, targetIndex: number): Promise<void> {
    return this.moduleOrderService.reorderModuleByIndex(courseId, moduleId, targetIndex);
  }

  /**
   * Sets the entire module order for a course based on the provided ordered IDs
   */
  private async setModuleOrder(courseId: string, orderedIds: string[]): Promise<void> {
    // Validate all IDs belong to the course
    const modules = await this.courseModuleModel
      .find({ courseId: new Types.ObjectId(courseId), visible: true })
      .exec();
    const moduleIdSet = new Set(modules.map(m => m._id.toString()));
    const filtered = orderedIds.filter(id => moduleIdSet.has(id));
    if (filtered.length === 0) return;

    // Apply previous/next pointers deterministically
    for (let i = 0; i < filtered.length; i++) {
      const prevId = i > 0 ? filtered[i - 1] : null;
      const nextId = i < filtered.length - 1 ? filtered[i + 1] : null;
      await this.courseModuleModel.findByIdAndUpdate(filtered[i], {
        previousModuleId: prevId ? new Types.ObjectId(prevId) : null,
        nextModuleId: nextId ? new Types.ObjectId(nextId) : null,
      }).exec();
    }
  }

  // ===== EXERCISE ORDER MANAGEMENT =====

  /**
   * Adds an exercise to the end of the module queue
   * @param moduleId - The module ID
   * @param exerciseId - The exercise ID to add
   */
  async addExerciseToModule(moduleId: string, exerciseId: string): Promise<void> {
    return this.exerciseOrderService.addExerciseToModule(moduleId, exerciseId);
  }

  /**
   * Adds an exercise to the module at a specific index (respecting module order)
   * @param moduleId - The module ID
   * @param exerciseId - The exercise ID to add
   * @param index - The position where the exercise should be placed
   */
  async addExerciseToModuleByIndex(moduleId: string, exerciseId: string, index: number): Promise<void> {
    return this.exerciseOrderService.addExerciseToModuleByIndex(moduleId, exerciseId, index);
  }

  /**
   * Removes an exercise from the module queue and reconnects the chain
   * @param exerciseId - The exercise ID to remove
   */
  async removeExerciseFromModule(exerciseId: string): Promise<void> {
    return this.exerciseOrderService.removeExerciseFromModule(exerciseId);
  }

  /**
   * Reorders an exercise by updating its previous and next references
   * @param exerciseId - The exercise ID to reorder
   * @param previousExerciseId - The new previous exercise ID (null for first position)
   * @param nextExerciseId - The new next exercise ID (null for last position)
   */
  async reorderExercise(exerciseId: string, previousExerciseId: string | null, nextExerciseId: string | null): Promise<void> {
    return this.exerciseOrderService.reorderExercise(exerciseId, previousExerciseId, nextExerciseId);
  }

  /**
   * Swaps two exercises in the queue
   */
  private async swapExercises(exerciseId1: string, exerciseId2: string): Promise<void> {
    const exercise1 = await this.courseExerciseModel.findById(exerciseId1).exec();
    const exercise2 = await this.courseExerciseModel.findById(exerciseId2).exec();
    
    if (!exercise1 || !exercise2) return;

    // Store original references
    const exercise1Prev = exercise1.previousExerciseId;
    const exercise1Next = exercise1.nextExerciseId;
    const exercise2Prev = exercise2.previousExerciseId;
    const exercise2Next = exercise2.nextExerciseId;

    // Update exercise1 to point to exercise2's neighbors
    await this.courseExerciseModel.findByIdAndUpdate(exerciseId1, {
      previousExerciseId: exercise2Prev,
      nextExerciseId: exercise2Next
    }).exec();

    // Update exercise2 to point to exercise1's neighbors
    await this.courseExerciseModel.findByIdAndUpdate(exerciseId2, {
      previousExerciseId: exercise1Prev,
      nextExerciseId: exercise1Next
    }).exec();

    // Update neighbors to point to the swapped exercises
    if (exercise1Prev) {
      await this.courseExerciseModel.findByIdAndUpdate(exercise1Prev, {
        nextExerciseId: new Types.ObjectId(exerciseId2)
      }).exec();
    }
    
    if (exercise1Next) {
      await this.courseExerciseModel.findByIdAndUpdate(exercise1Next, {
        previousExerciseId: new Types.ObjectId(exerciseId2)
      }).exec();
    }
    
    if (exercise2Prev) {
      await this.courseExerciseModel.findByIdAndUpdate(exercise2Prev, {
        nextExerciseId: new Types.ObjectId(exerciseId1)
      }).exec();
    }
    
    if (exercise2Next) {
      await this.courseExerciseModel.findByIdAndUpdate(exercise2Next, {
        previousExerciseId: new Types.ObjectId(exerciseId1)
      }).exec();
    }
  }

  /**
   * Inserts an exercise before another exercise in the queue
   * @param exerciseId - The exercise ID to insert
   * @param targetExerciseId - The target exercise ID to insert before
   */
  async insertExerciseBefore(exerciseId: string, targetExerciseId: string): Promise<void> {
    const targetExercise = await this.courseExerciseModel.findById(targetExerciseId).exec();
    if (!targetExercise) return;

    const previousExerciseId = targetExercise.previousExerciseId;

    // Update the exercise to be inserted
    await this.courseExerciseModel.findByIdAndUpdate(exerciseId, {
      previousExerciseId: previousExerciseId,
      nextExerciseId: targetExercise._id
    }).exec();

    // Update the target exercise
    await this.courseExerciseModel.findByIdAndUpdate(targetExerciseId, {
      previousExerciseId: new Types.ObjectId(exerciseId)
    }).exec();

    // Update the previous exercise (if exists)
    if (previousExerciseId) {
      await this.courseExerciseModel.findByIdAndUpdate(previousExerciseId, {
        nextExerciseId: new Types.ObjectId(exerciseId)
      }).exec();
    }
  }

  /**
   * Gets all exercises for a module in their correct order
   * @param moduleId - The module ID
   * @returns Array of ordered exercises
   */
  async getOrderedExercises(moduleId: string): Promise<CourseExercise[]> {
    return this.exerciseOrderService.getOrderedExercises(moduleId);
  }

  /**
   * Reorders an exercise by inserting it at a specific index within its module
   */
  async reorderExerciseByIndex(moduleId: string, exerciseId: string, targetIndex: number): Promise<void> {
    return this.exerciseOrderService.reorderExerciseByIndex(moduleId, exerciseId, targetIndex);
  }

  /**
   * Sets the entire exercise order for a module based on the provided ordered IDs
   */
  private async setExerciseOrder(moduleId: string, orderedIds: string[]): Promise<void> {
    // Validate all IDs belong to the module
    const exercises = await this.courseExerciseModel
      .find({ courseModuleId: new Types.ObjectId(moduleId), visible: true })
      .exec();
    const exerciseIdSet = new Set(exercises.map(e => e._id.toString()));
    const filtered = orderedIds.filter(id => exerciseIdSet.has(id));
    if (filtered.length === 0) return;

    // Apply previous/next pointers deterministically
    for (let i = 0; i < filtered.length; i++) {
      const prevId = i > 0 ? filtered[i - 1] : null;
      const nextId = i < filtered.length - 1 ? filtered[i + 1] : null;
      await this.courseExerciseModel.findByIdAndUpdate(filtered[i], {
        previousExerciseId: prevId ? new Types.ObjectId(prevId) : null,
        nextExerciseId: nextId ? new Types.ObjectId(nextId) : null,
      }).exec();
    }
  }

  /**
   * Cleans up duplicate exercises in a module and repairs the linked list
   * @param moduleId - The module ID to clean up
   */
  async cleanupDuplicateExercises(moduleId: string): Promise<void> {
    return this.exerciseOrderService.cleanupDuplicateExercises(moduleId);
  }

  /**
   * Cleans up duplicate modules in a course and repairs the linked list
   * @param courseId - The course ID to clean up
   */
  async cleanupDuplicateModules(courseId: string): Promise<void> {
    return this.moduleOrderService.cleanupDuplicateModules(courseId);
  }

  // ===== STUDENT EXERCISE ORDER MANAGEMENT =====
  
  /**
   * Calculate and fix the order of student exercises in a module
   * This method ensures that student exercises have proper linked list structure
   * @param courseId - The course ID
   * @param studentId - The student ID
   * @param moduleId - The student module ID
   * @param teacherId - The teacher ID
   */
  async calculateStudentExerciseOrder(courseId: string, studentId: string, moduleId: string, teacherId: string) {
    return this.studentOrderService.calculateStudentExerciseOrder(courseId, studentId, moduleId, teacherId);
  }

  /**
   * Proxy to get the robust tail (last) student exercise for a student module
   */
  async getStudentTail(courseId: string, studentId: string, moduleId: string) {
    return this.studentOrderService.getStudentTail(courseId, studentId, moduleId);
  }
}
