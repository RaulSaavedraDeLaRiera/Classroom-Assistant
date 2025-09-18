import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from './schemas/course.schema';
import { CourseModule, CourseModuleDocument } from './schemas/course-module.schema';
import { CourseExercise, CourseExerciseDocument } from './schemas/course-exercise.schema';
import { TeacherModule, TeacherModuleDocument } from '../teachers/schemas/teacher-module.schema';
import { TeacherExercise, TeacherExerciseDocument } from '../teachers/schemas/teacher-exercise.schema';
import { TemplateModule, TemplateModuleDocument } from '../templates/schemas/template-module.schema';
import { TemplateExercise, TemplateExerciseDocument } from '../templates/schemas/template-exercise.schema';
import { StudentModule, StudentModuleDocument } from '../students/schemas/student-module.schema';
import { StudentExercise, StudentExerciseDocument } from '../students/schemas/student-exercise.schema';
import { OrderService } from './order.service';

// Import new services
import { CourseAccessService } from './course-access.service';
import { StudentSyncService } from './student-sync.service';
import { LinkedListService } from './linked-list.service';
import { CourseContentCopyService } from './content/course-content-copy.service';

@Injectable()
export class CourseContentService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(CourseModule.name) private courseModuleModel: Model<CourseModuleDocument>,
    @InjectModel(CourseExercise.name) private courseExerciseModel: Model<CourseExerciseDocument>,
    @InjectModel(TeacherModule.name) private teacherModuleModel: Model<TeacherModuleDocument>,
    @InjectModel(TeacherExercise.name) private teacherExerciseModel: Model<TeacherExerciseDocument>,
    @InjectModel(TemplateModule.name) private templateModuleModel: Model<TemplateModuleDocument>,
    @InjectModel(TemplateExercise.name) private templateExerciseModel: Model<TemplateExerciseDocument>,
    @InjectModel(StudentModule.name) private studentModuleModel: Model<StudentModuleDocument>,
    @InjectModel(StudentExercise.name) private studentExerciseModel: Model<StudentExerciseDocument>,
    private orderService: OrderService,
    // New services
    private courseAccessService: CourseAccessService,
    private studentSyncService: StudentSyncService,
    private linkedListService: LinkedListService,
    private courseContentCopyService: CourseContentCopyService
  ) {}

  // ===== MODULE METHODS =====
  
  async getAllCourseModules(query: any = {}) {
    return this.courseModuleModel.find({ ...query, visible: true }).exec();
  }

  async getCourseModuleById(id: string) {
    return this.courseModuleModel.findById(id).exec();
  }

  async createCourseModule(createCourseModuleDto: any) {
    const courseModule = new this.courseModuleModel(createCourseModuleDto);
    return courseModule.save();
  }

  async updateCourseModule(id: string, updateCourseModuleDto: any) {
    return this.courseModuleModel.findByIdAndUpdate(id, updateCourseModuleDto, { new: true }).exec();
  }

  async partialUpdateCourseModule(id: string, partialUpdateDto: any) {
    return this.courseModuleModel.findByIdAndUpdate(id, { $set: partialUpdateDto }, { new: true }).exec();
  }

  async deleteCourseModule(id: string) {
    // First, update the linked list to reconnect adjacent modules
    await this.orderService.removeModuleFromCourse(id);
    
    const deletedModule = await this.courseModuleModel.findByIdAndUpdate(
      id, 
      { visible: false }, 
      { new: true }
    ).exec();
    
    if (!deletedModule) {
      throw new NotFoundException('Course module not found');
    }
    
    // Mark associated CourseExercises as visible: false
    await this.courseExerciseModel.updateMany({
      courseModuleId: deletedModule._id,
      visible: true
    }, { visible: false }).exec();

    // Mark corresponding StudentModules and StudentExercises as visible: false
    await this.markStudentModulesInvisible(deletedModule._id.toString());

    return deletedModule;
  }

  // ===== EXERCISE METHODS =====

  async getAllCourseExercises(query: any = {}) {
    return this.courseExerciseModel.find({ ...query, visible: true }).exec();
  }

  async getCourseExerciseById(id: string) {
    return this.courseExerciseModel.findById(id).exec();
  }

  async createCourseExercise(createCourseExerciseDto: any) {
    const courseExercise = new this.courseExerciseModel(createCourseExerciseDto);
    return courseExercise.save();
  }

  async updateCourseExercise(id: string, updateCourseExerciseDto: any) {
    return this.courseExerciseModel.findByIdAndUpdate(id, updateCourseExerciseDto, { new: true }).exec();
  }

  async partialUpdateCourseExercise(id: string, partialUpdateDto: any) {
    // Update the course exercise
    const updatedExercise = await this.courseExerciseModel.findByIdAndUpdate(id, { $set: partialUpdateDto }, { new: true }).exec();
    
    if (!updatedExercise) {
      throw new NotFoundException('Course exercise not found');
    }
    
    // Update all related student exercises (only those NOT completed, reviewed, or in_progress)
    const studentExercisesUpdateResult = await this.studentExerciseModel.updateMany(
      { 
        courseExerciseId: new Types.ObjectId(id),
        visible: true,
        status: { $nin: ['completed', 'reviewed', 'in_progress'] }
      },
      { 
        $set: {
          title: partialUpdateDto.title,
          content: partialUpdateDto.content,
          type: partialUpdateDto.type,
          estimatedTime: partialUpdateDto.estimatedTime,
          difficulty: partialUpdateDto.difficulty,
          tags: partialUpdateDto.tags,
          description: partialUpdateDto.description
        }
      }
    ).exec();
    
    return updatedExercise;
  }

  async deleteCourseExercise(id: string) {
    const deletedExercise = await this.courseExerciseModel.findByIdAndUpdate(
      id, 
      { visible: false }, 
      { new: true }
    ).exec();
    
    if (!deletedExercise) {
      throw new NotFoundException('Course exercise not found');
    }
    
    return deletedExercise;
  }

  async updateExerciseMaxScore(exerciseId: string, maxScore: number, teacherId: string) {
    console.log('updateExerciseMaxScore called with:', { exerciseId, maxScore, teacherId });
    
    // Verify the exercise belongs to a course owned by the teacher
    const exercise = await this.courseExerciseModel.findById(exerciseId).exec();
    if (!exercise) {
      console.log('Exercise not found:', exerciseId);
      throw new NotFoundException('Exercise not found');
    }

    console.log('Exercise found:', { id: exercise._id, courseModuleId: exercise.courseModuleId });

    // Get the course module to find the course ID
    const courseModule = await this.courseModuleModel.findById(exercise.courseModuleId).exec();
    if (!courseModule) {
      console.log('Course module not found:', exercise.courseModuleId);
      throw new NotFoundException('Course module not found');
    }

    console.log('Course module found:', { id: courseModule._id, courseId: courseModule.courseId });

    const course = await this.courseAccessService.validateCourseAccess(courseModule.courseId.toString(), teacherId);
    console.log('Course access validated:', course._id);
    
    // Update the course exercise
    const result = await this.courseExerciseModel.findByIdAndUpdate(
      exerciseId,
      { maxScore: maxScore },
      { new: true }
    ).exec();
    
    console.log('Course exercise updated successfully:', result);

    // Update all student exercises that reference this course exercise (only those NOT completed, reviewed, or in_progress)
    const studentExercisesUpdateResult = await this.studentExerciseModel.updateMany(
      { 
        courseExerciseId: new Types.ObjectId(exerciseId),
        visible: true,
        status: { $nin: ['completed', 'reviewed', 'in_progress'] }
      },
      { 
        maxScore: maxScore 
      }
    ).exec();

    console.log(`Updated ${studentExercisesUpdateResult.modifiedCount} student exercises with new maxScore`);
    
    return result;
  }

  // ===== MODULE INTEGRATION METHODS =====

  async addTeacherModuleToCourse(courseId: string, teacherModuleId: string, teacherId: string) {
    // Verify the course belongs to the teacher
    const course = await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Try to find the module as a teacher module first
    let teacherModule = await this.teacherModuleModel.findOne({
      _id: teacherModuleId,
      teacherId: new Types.ObjectId(teacherId),
      visible: true
    }).exec();

    let templateModule = null;
    let isTemplateModule = false;

    if (!teacherModule) {
      // If not found as teacher module, try as template module
      templateModule = await this.templateModuleModel.findOne({
        _id: teacherModuleId,
        visible: true
      }).exec();

      if (templateModule) {
        isTemplateModule = true;
      } else {
        throw new NotFoundException('Module not found or access denied');
      }
    }

    const moduleData = isTemplateModule ? templateModule : teacherModule;

    // Create a copy as CourseModule for the course
    const courseModule = new this.courseModuleModel({
      title: moduleData.title,
      description: moduleData.description,
      courseId: new Types.ObjectId(courseId),
      teacherModuleId: isTemplateModule ? undefined : new Types.ObjectId(moduleData._id.toString()),
      templateModuleId: isTemplateModule ?
        new Types.ObjectId(moduleData._id.toString()) :
        (moduleData.templateModuleId ? new Types.ObjectId(moduleData.templateModuleId.toString()) : undefined),
      tags: moduleData.tags || [],
      estimatedTime: moduleData.estimatedTime,
      status: 'active',
      type: moduleData.type || 'all',
      prerequisites: moduleData.prerequisites || []
    });

    await courseModule.save();

    // Add the CourseModule ID to course modules array
    const updatedCourse = await this.courseModel.findByIdAndUpdate(
      courseId,
      { $addToSet: { modules: courseModule._id } },
      { new: true }
    ).exec();

    // Set the order for this module (add to end of course)
    await this.orderService.addModuleToCourse(courseId, courseModule._id.toString());

    // Sync new module to all enrolled students
    await this.courseContentCopyService.addNewModuleToEnrolledStudents(courseModule._id.toString(), courseId, teacherId);

    // Copy exercises from the original module
    await this.courseContentCopyService.copyExercisesFromModule(moduleData, courseModule, courseId, teacherId, isTemplateModule);

    return {
      course: updatedCourse,
      courseModule: courseModule,
      teacherModule: isTemplateModule ? null : teacherModule,
      templateModule: isTemplateModule ? templateModule : null
    };
  }

  async removeTeacherModuleFromCourse(courseId: string, teacherModuleId: string, teacherId: string) {
    // Verify course belongs to the teacher
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Remove teacher module from course
    const updatedCourse = await this.courseModel.findByIdAndUpdate(
      courseId,
      { $pull: { modules: teacherModuleId } },
      { new: true }
    ).exec();

    // Find and completely remove the corresponding CourseModule
    const courseModule = await this.courseModuleModel.findOne({
      courseId: courseId,
      templateModuleId: new Types.ObjectId(teacherModuleId)
    }).exec();

    if (courseModule) {
      // Remove the CourseModule completely
      await this.courseModuleModel.findByIdAndDelete(courseModule._id).exec();

      // Also remove associated CourseExercises
      await this.courseExerciseModel.deleteMany({
        courseModuleId: courseModule._id
      }).exec();

      // Mark corresponding StudentModules and StudentExercises as visible: false
      await this.markStudentModulesInvisible(courseModule._id.toString());
    }

    return updatedCourse;
  }

  // ===== EXERCISE INTEGRATION METHODS =====

  async addExerciseToModule(moduleId: string, exerciseId: string, teacherId: string) {
    // Verify the module belongs to a course owned by the teacher
    const courseModule = await this.courseModuleModel.findById(moduleId).exec();
    if (!courseModule) {
      throw new NotFoundException('Course module not found');
    }

    const course = await this.courseAccessService.validateCourseAccess(courseModule.courseId.toString(), teacherId);

    // Try to find the exercise as a teacher exercise first
    let teacherExercise = await this.teacherExerciseModel.findOne({
      _id: exerciseId,
      teacherId: new Types.ObjectId(teacherId),
      visible: true
    }).exec();

    let templateExercise = null;
    let isTemplateExercise = false;

    if (!teacherExercise) {
      // If not found as teacher exercise, try as template exercise
      templateExercise = await this.templateExerciseModel.findOne({
        _id: exerciseId,
        visible: true
      }).exec();

      if (templateExercise) {
        isTemplateExercise = true;
      } else {
        throw new NotFoundException('Exercise not found or access denied');
      }
    }

    const exerciseData = isTemplateExercise ? templateExercise : teacherExercise;

    // Create a copy as CourseExercise for the module
    const courseExercise = new this.courseExerciseModel({
      title: exerciseData.title,
      description: exerciseData.description, 
      content: exerciseData.content,
      type: exerciseData.type,
      courseId: new Types.ObjectId(course._id.toString()),
      courseModuleId: new Types.ObjectId(moduleId),
      templateExerciseId: isTemplateExercise ?
        new Types.ObjectId(exerciseData._id.toString()) :
        (exerciseData.templateExerciseId ? new Types.ObjectId(exerciseData.templateExerciseId.toString()) : undefined),
      teacherExerciseId: isTemplateExercise ? undefined : new Types.ObjectId(exerciseData._id.toString()),
      difficulty: exerciseData.difficulty,
      tags: exerciseData.tags || [],
      estimatedTime: exerciseData.estimatedTime,
      status: 'active'
    });

    await courseExercise.save();

    // Add exercise to the module's content.exercises array
    await this.courseModuleModel.findByIdAndUpdate(
      moduleId,
      { $push: { 'content.exercises': courseExercise._id } },
      { new: true }
    ).exec();

    // Set the order for this exercise (add to end of module)
    await this.orderService.addExerciseToModule(moduleId, courseExercise._id.toString());

    // Sync new exercise to all enrolled students
    await this.addNewExerciseToEnrolledStudents(courseExercise._id.toString(), moduleId, teacherId);

    return courseExercise;
  }

  // ===== SYNC METHODS =====

  async syncModuleOrderToStudents(courseId: string, teacherId: string): Promise<void> {
    await this.studentSyncService.syncModuleOrderToStudents(courseId, teacherId);
  }

  async syncExerciseOrderToStudents(moduleId: string, teacherId: string): Promise<void> {
    await this.studentSyncService.syncExerciseOrderToStudents(moduleId, teacherId);
  }

  // ===== COURSE CREATION METHODS =====

  async createCompleteCourse(createCourseDto: any, teacherId: string) {
    const { modules, ...courseData } = createCourseDto;

    if (!modules || modules.length === 0) {
      throw new Error('At least one module is required to create a course');
    }

    // Create the course first
    const newCourse = new this.courseModel({
      ...courseData,
      teacherId: new Types.ObjectId(teacherId),
      modules: [], // Will be populated with course module IDs as they're created
      status: 'active',
      visible: true
    });

    const savedCourse = await newCourse.save();

    // Create CourseModule copies for each selected module
    const courseModules = [];

    for (let i = 0; i < modules.length; i++) {
      const moduleId = modules[i];

      // Validate moduleId
      if (!moduleId || typeof moduleId !== 'string') {
        throw new Error(`Invalid module ID at index ${i}: ${moduleId}`);
      }

      let moduleData: any = null;
      let isTemplateModule = false;

      // First try to find as teacher module
      let teacherModule = await this.teacherModuleModel.findOne({
        _id: moduleId,
        teacherId: new Types.ObjectId(teacherId),
        visible: true
      }).exec();

      if (teacherModule) {
        moduleData = teacherModule;
        isTemplateModule = false;
      } else {
        // If not found as teacher module, try as template module
        try {
          // Check if the moduleId is a valid ObjectId
          if (!Types.ObjectId.isValid(moduleId)) {
            throw new Error(`Invalid ObjectId format: ${moduleId}`);
          }

          const templateModule = await this.templateModuleModel.findOne({
            _id: moduleId,
            visible: true
          }).exec();

          if (templateModule) {
            moduleData = templateModule;
            isTemplateModule = true;
          } else {
            throw new Error(`Module ${moduleId} not found as teacher module or template module`);
          }
        } catch (error) {
          throw new Error(`Module ${moduleId} not found as teacher module or template module`);
        }
      }

      // Create course module copy
      const courseModule = new this.courseModuleModel({
        title: moduleData.title,
        description: moduleData.description,
        courseId: savedCourse._id,
        templateModuleId: isTemplateModule ? new Types.ObjectId(moduleData._id.toString()) : (moduleData.templateModuleId ? new Types.ObjectId(moduleData.templateModuleId.toString()) : undefined),
        teacherModuleId: isTemplateModule ? undefined : new Types.ObjectId(moduleData._id.toString()),
        tags: moduleData.tags || [],
        estimatedTime: moduleData.estimatedTime || moduleData.estimatedDuration || 0,
        status: 'active',
        type: moduleData.type || 'all',
        prerequisites: moduleData.prerequisites || []
      });

      const savedCourseModule = await courseModule.save();
      courseModules.push(savedCourseModule);

      // Add the course module ID to the course's modules array
      await this.courseModel.findByIdAndUpdate(
        savedCourse._id,
        { $push: { modules: savedCourseModule._id } }
      ).exec();

      // Set the order for this module based on selection order (not creation order)
      await this.orderService.addModuleToCourseByIndex(savedCourse._id.toString(), savedCourseModule._id.toString(), i);

      // Create CourseExercise copies for each exercise in the module
      await this.copyExercisesFromModule(moduleData, savedCourseModule, savedCourse._id.toString(), teacherId, isTemplateModule);
    }

    return {
      course: savedCourse,
      courseModules: courseModules,
      message: 'Course created successfully with all modules and exercises'
    };
  }

  // ===== UTILITY METHODS =====

  async getCourseWithModules(courseId: string, teacherId: string) {
    // Get course with populated modules (both teacher and template)
    const course = await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Get course modules with populated exercises
    const courseModules = await this.courseModuleModel.find({
      courseId: courseId,
      visible: true
    }).populate('content.exercises').exec();

    return {
      course: course,
      courseModules: courseModules
    };
  }

  async getCourseModules(courseId: string, teacherId: string) {
    // Verify course exists and teacher has access
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Get course modules with populated exercises
    return this.courseModuleModel.find({
      courseId: new Types.ObjectId(courseId),
      visible: true
    }).populate('content.exercises').exec();
  }

  async getCourseExercises(courseId: string, teacherId: string) {
    // Verify course exists and teacher has access
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Get all course modules for this course
    const courseModules = await this.courseModuleModel.find({
      courseId: new Types.ObjectId(courseId),
      visible: true
    }).exec();

    // Get all exercises that belong to these modules
    const moduleIds = courseModules.map(module => module._id);

    const courseExercises = await this.courseExerciseModel.find({
      courseModuleId: { $in: moduleIds },
      visible: true
    }).exec();

    // Group exercises by module and get ordered exercises for each module
    const exercisesByModule: { [key: string]: any[] } = {};
    courseExercises.forEach(exercise => {
      const moduleId = exercise.courseModuleId.toString();
      if (!exercisesByModule[moduleId]) {
        exercisesByModule[moduleId] = [];
      }
      exercisesByModule[moduleId].push(exercise);
    });

    // Get ordered exercises for each module and flatten
    const allOrderedExercises = [];
    for (const moduleId in exercisesByModule) {
      const orderedExercises = await this.orderService.getOrderedExercises(moduleId);
      allOrderedExercises.push(...orderedExercises);
    }

    return allOrderedExercises;
  }

  async getAvailableTeacherModulesForCourse(courseId: string, teacherId: string) {
    // Get all teacher modules that can be added to this course
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    const course = await this.courseModel.findById(courseId).exec();

    // Get all teacher modules that are not already in the course
    const availableModules = await this.teacherModuleModel.find({
      teacherId: teacherId,
      visible: true,
      isReusable: true,
      _id: { $nin: course.modules || [] }
    }).sort({ title: 1 }).exec();

    return availableModules;
  }

  // ===== PRIVATE HELPER METHODS =====

  private async copyExercisesFromModule(moduleData: any, courseModule: CourseModuleDocument, courseId: string, teacherId: string, isTemplateModule: boolean) {
    return this.courseContentCopyService.copyExercisesFromModule(moduleData, courseModule, courseId, teacherId, isTemplateModule);
  }

  private async markStudentModulesInvisible(courseModuleId: string) {
    // Mark corresponding StudentModules and StudentExercises as visible: false
    const studentModulesResult = await this.studentModuleModel.updateMany(
      {
        courseModuleId: new Types.ObjectId(courseModuleId),
        visible: true
      },
      { visible: false }
    ).exec();
    
    // Get all StudentModule IDs that were just marked as invisible
    const studentModules = await this.studentModuleModel.find({
      courseModuleId: new Types.ObjectId(courseModuleId),
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
  }

  // Keep the existing methods that are still needed
  async addNewExerciseToEnrolledStudentsWithoutOrdering(exerciseId: string, moduleId: string, teacherId: string): Promise<void> {
    // Get the course module to find courseId
    const courseModule = await this.courseModuleModel.findById(moduleId).exec();
    if (!courseModule) return;

    const courseId = courseModule.courseId.toString();

    // Get the course exercise details
    const courseExercise = await this.courseExerciseModel.findById(exerciseId).exec();
    if (!courseExercise) return;

    // Get active enrolled students for this course
    const activeEnrollments = await this.courseModel.findOne({
      _id: courseId,
      teacherId: new Types.ObjectId(teacherId),
      visible: true
    }).populate('students').exec();

    if (!activeEnrollments || !activeEnrollments.students) return;

    const studentIds = activeEnrollments.students.map((s: any) => s._id);

    // For each enrolled student, add the exercise
    for (const studentId of studentIds) {
      // Find the student's module that corresponds to this course module
      const studentModule = await this.studentModuleModel.findOne({
        studentId: new Types.ObjectId(studentId),
        courseModuleId: new Types.ObjectId(moduleId),
        visible: true
      }).exec();

      if (studentModule) {
        // Create StudentExercise for this student
        const studentExercise = new this.studentExerciseModel({
          studentId: new Types.ObjectId(studentId),
          courseExerciseId: new Types.ObjectId(exerciseId),
          courseModuleId: new Types.ObjectId(moduleId),
          studentModuleId: studentModule._id,
          courseId: new Types.ObjectId(courseId),
          teacherId: new Types.ObjectId(teacherId),
          title: courseExercise.title,
          description: courseExercise.description || '',
          content: courseExercise.content || '',
          type: courseExercise.type || 'exercise',
          estimatedTime: courseExercise.estimatedTime || 0,
          difficulty: courseExercise.difficulty || 'intermediate',
          tags: courseExercise.tags || [],
          // If module type is 'all', exercises should start as 'ready'
          status: (studentModule as any).type === 'all' ? 'ready' : 'pending',
          completedAt: null,
          score: null,
          attempts: 0,
          bestScore: 0,
          scores: []
        });

        await studentExercise.save();

        // Add exercise to student's module
        await this.studentModuleModel.findByIdAndUpdate(
          studentModule._id,
          { $push: { studentExerciseIds: studentExercise._id } },
          { new: true }
        ).exec();

        // Find the robust tail (last exercise) in the student's module, considering multiple chains
        const lastExercise = await this.orderService.getStudentTail(courseId, studentId.toString(), studentModule._id.toString());

        // Connect the new exercise to the end of the linked list
        if (lastExercise) {
          // Update the new exercise to point to the last exercise
          await this.studentExerciseModel.updateOne(
            { _id: studentExercise._id },
            {
              previousExerciseId: lastExercise._id,
              nextExerciseId: null
            }
          );

          // Update the last exercise to point to the new exercise
          await this.studentExerciseModel.updateOne(
            { _id: lastExercise._id },
            { nextExerciseId: studentExercise._id }
          );
        } else {
          // If no exercises exist, this becomes the head
          await this.studentExerciseModel.updateOne(
            { _id: studentExercise._id },
            {
              previousExerciseId: null,
              nextExerciseId: null
            }
          );
        }
      }
    }
  }

  async addNewExerciseToEnrolledStudents(exerciseId: string, moduleId: string, teacherId: string): Promise<void> {
    // Append at tail for each student without reordering, so extras remain in place
    await this.addNewExerciseToEnrolledStudentsWithoutOrdering(exerciseId, moduleId, teacherId);
  }

  async addNewModuleToEnrolledStudents(moduleId: string, courseId: string, teacherId: string): Promise<void> {
    return this.courseContentCopyService.addNewModuleToEnrolledStudents(moduleId, courseId, teacherId);
  }

  async syncStudentModulesOrder(courseId: string, studentId: string): Promise<void> {
    return this.courseContentCopyService.syncStudentModulesOrder(courseId, studentId);
  }

  async getOrderedCourseModules(courseId: string): Promise<any[]> {
    return this.courseContentCopyService.getOrderedCourseModules(courseId);
  }
}
