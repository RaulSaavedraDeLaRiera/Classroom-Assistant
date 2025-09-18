import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from './schemas/course.schema';
import { CourseEnrollment, CourseEnrollmentDocument } from './schemas/course-enrollment.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { StudentModule, StudentModuleDocument } from '../students/schemas/student-module.schema';
import { StudentExercise, StudentExerciseDocument } from '../students/schemas/student-exercise.schema';
import { CourseModule, CourseModuleDocument } from './schemas/course-module.schema';
import { CourseExercise, CourseExerciseDocument } from './schemas/course-exercise.schema';
import { TeacherExercise, TeacherExerciseDocument } from '../teachers/schemas/teacher-exercise.schema';
import { TemplateExercise, TemplateExerciseDocument } from '../templates/schemas/template-exercise.schema';
import { ProgressTrackingService } from './progress-tracking.service';
import { CourseContentService } from './course-content.service';
import { OrderService } from './order.service';
import { CourseAccessService } from './course-access.service';
import { StudentSyncService } from './student-sync.service';
import { StudentExerciseManagementService } from './enrollment/student-exercise-management.service';
import { StudentStatisticsService } from './enrollment/student-statistics.service';
import { EnrollmentHistoryService } from './enrollment/enrollment-history.service';

@Injectable()
export class CourseEnrollmentService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(CourseEnrollment.name) private courseEnrollmentModel: Model<CourseEnrollmentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(StudentModule.name) private studentModuleModel: Model<StudentModuleDocument>,
    @InjectModel(StudentExercise.name) private studentExerciseModel: Model<StudentExerciseDocument>,
    @InjectModel(CourseModule.name) private courseModuleModel: Model<CourseModuleDocument>,
    @InjectModel(CourseExercise.name) private courseExerciseModel: Model<CourseExerciseDocument>,
    @InjectModel(TeacherExercise.name) private teacherExerciseModel: Model<TeacherExerciseDocument>,
    @InjectModel(TemplateExercise.name) private templateExerciseModel: Model<TemplateExerciseDocument>,
    private progressTrackingService: ProgressTrackingService,
    @Inject(forwardRef(() => CourseContentService))
    private courseContentService: CourseContentService,
    private orderService: OrderService,
    private courseAccessService: CourseAccessService,
    private studentSyncService: StudentSyncService,
    private studentExerciseManagementService: StudentExerciseManagementService,
    private studentStatisticsService: StudentStatisticsService,
    private enrollmentHistoryService: EnrollmentHistoryService,
  ) {
    this.initializeIndexes();
  }

  private async initializeIndexes() {
    try {
      // Get all existing indexes
      const existingIndexes = await this.courseEnrollmentModel.collection.indexes();
      console.log('Current indexes:', existingIndexes.map(idx => idx.name));

      // Drop all enrollment-related indexes
      for (const index of existingIndexes) {
        if (index.name.includes('courseId') && index.name.includes('studentId')) {
          try {
            await this.courseEnrollmentModel.collection.dropIndex(index.name);
            console.log(`Dropped index: ${index.name}`);
          } catch (error) {
            console.log(`Could not drop index ${index.name}:`, error.message);
          }
        }
      }

      // Clean up duplicate active enrollments (keep only the most recent)
      const duplicates = await this.courseEnrollmentModel.aggregate([
        {
          $match: { status: 'active' }
        },
        {
          $group: {
            _id: { courseId: '$courseId', studentId: '$studentId' },
            docs: { $push: '$$ROOT' },
            count: { $sum: 1 }
          }
        },
        {
          $match: { count: { $gt: 1 } }
        }
      ]);

      for (const duplicate of duplicates) {
        // Sort by enrolledAt descending and keep only the first (most recent)
        const sortedDocs = duplicate.docs.sort((a, b) => 
          new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime()
        );
        
        // Mark all but the first as historical
        for (let i = 1; i < sortedDocs.length; i++) {
          await this.courseEnrollmentModel.updateOne(
            { _id: sortedDocs[i]._id },
            { 
              $set: { 
                status: 'historical', 
                visible: false, 
                endedAt: new Date() 
              } 
            }
          );
          console.log(`Marked duplicate enrollment as historical: ${sortedDocs[i]._id}`);
        }
      }

      // Create new partial index for active enrollments only
      await this.courseEnrollmentModel.collection.createIndex(
        { courseId: 1, studentId: 1, status: 1 },
        { 
          unique: true, 
          partialFilterExpression: { status: 'active' },
          name: 'courseId_1_studentId_1_status_1_active'
        }
      );
      console.log('Created new enrollment index for active enrollments only');
      
    } catch (error) {
      console.error('Error initializing enrollment indexes:', error);
    }
  }

  async getCourseStudents(courseId: string, teacherId: string) {
    // Verify course exists and teacher has access
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Get all active enrollments for this course
    const enrollments = await this.courseEnrollmentModel.find({
      courseId: new Types.ObjectId(courseId),
      status: 'active'
    }).populate('studentId', 'name email role').exec();

    // Transform enrollments to student format with enrollmentId
    const studentsWithEnrollment = enrollments.map(enrollment => ({
      _id: (enrollment.studentId as any)._id,
      name: (enrollment.studentId as any).name,
      email: (enrollment.studentId as any).email,
      role: (enrollment.studentId as any).role,
      active: true,
      enrollmentId: enrollment._id // This is the enrollment ID, not student ID
    }));

    return studentsWithEnrollment;
  }

  async addStudentToCourse(courseId: string, studentId: string, teacherId: string) {
    // Verify course exists and teacher has access
    const course = await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Note: We allow re-enrollment, so we don't check for existing active enrollments here
    // The logic below will handle existing enrollments (active or historical)

    // Check course capacity
    const currentEnrollments = await this.courseEnrollmentModel.countDocuments({
      courseId: new Types.ObjectId(courseId),
      status: 'active',
      visible: true
    });

    if (currentEnrollments >= course.maxStudents) {
      throw new NotFoundException('Course is at maximum capacity');
    }

    // Verify that the student belongs to this teacher
    const student = await this.userModel.findOne({
      _id: studentId,
      role: 'student',
      visible: true,
      teacherIds: { $in: [new Types.ObjectId(teacherId)] }
    }).exec();

    if (!student) {
      throw new NotFoundException('Student not found or not associated with this teacher');
    }

    // Check if enrollment already exists (even if marked as invisible)
    const existingEnrollment = await this.courseEnrollmentModel.findOne({
      courseId: new Types.ObjectId(courseId),
      studentId: new Types.ObjectId(studentId)
    }).exec();

    let previousProgress = 0;
    let previousEnrollmentId = null;

    if (existingEnrollment) {
      // Mark existing enrollment as historical
      existingEnrollment.status = 'historical';
      existingEnrollment.visible = false;
      existingEnrollment.endedAt = new Date();
      await existingEnrollment.save();
      
      // Preserve progress from previous enrollment
      previousProgress = existingEnrollment.progress || 0;
      previousEnrollmentId = existingEnrollment._id;
    }

    // Always create a new enrollment
    const enrollment = new this.courseEnrollmentModel({
      courseId: new Types.ObjectId(courseId),
      studentId: new Types.ObjectId(studentId),
      teacherId: new Types.ObjectId(teacherId),
      status: 'active',
      enrolledAt: new Date(),
      progress: previousProgress, // Preserve previous progress
      visible: true,
      previousEnrollmentId: previousEnrollmentId // Reference to previous enrollment
    });

    await enrollment.save();

    // Add student to course.students array
    const updateResult = await this.courseModel.findByIdAndUpdate(
      courseId,
      { $addToSet: { students: new Types.ObjectId(studentId) } },
      { new: true }
    ).exec();

    // Always copy course content and initialize stats for new enrollment
    // Copy course content to student records
    await this.copyCourseContentToStudent(courseId, studentId, teacherId);

    // Sync student modules order to ensure proper linked list
    await this.studentSyncService.syncModuleOrderToStudents(courseId, teacherId);

    // Sync exercise order for each student module to fix linked list
    console.log('Syncing exercise order for newly enrolled student...');
    const studentModules = await this.studentModuleModel.find({
      courseId: new Types.ObjectId(courseId),
      studentId: new Types.ObjectId(studentId),
      visible: true
    }).exec();

    for (const studentModule of studentModules) {
      try {
        await this.studentSyncService.syncExerciseOrderToStudents(studentModule.courseModuleId.toString(), teacherId);
      } catch (error) {
        console.error(`Error syncing exercise order for student ${studentId} in module ${studentModule._id}:`, error);
      }
    }

    // Initialize enrollment statistics
    await this.progressTrackingService.initializeEnrollmentStats(courseId, studentId);

    return enrollment;
  }

  async removeStudentFromCourse(courseId: string, studentId: string, teacherId: string) {
    // Verify course exists and teacher has access
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Find and mark enrollment as removed
    const enrollment = await this.courseEnrollmentModel.findOneAndUpdate(
      {
        courseId: new Types.ObjectId(courseId),
        studentId: new Types.ObjectId(studentId),
        teacherId: new Types.ObjectId(teacherId),
        status: 'active',
        visible: true
      },
      { 
        status: 'removed',
        visible: false,
        endedAt: new Date()
      },
      { new: true }
    ).exec();

    if (!enrollment) {
      throw new NotFoundException('Student enrollment not found');
    }

    // Remove student from course.students array
    await this.courseModel.findByIdAndUpdate(
      courseId,
      { $pull: { students: new Types.ObjectId(studentId) } }
    ).exec();

    // Set visible=false for all StudentModule and StudentExercise records
    await this.studentModuleModel.updateMany(
      {
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
        visible: true
      },
      { visible: false }
    ).exec();

    // First get all StudentModule IDs for this student and course
    const studentModules = await this.studentModuleModel.find(
      {
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId)
      },
      { _id: 1 }
    ).exec();

    const studentModuleIds = studentModules.map(sm => sm._id);

    // Set visible=false for StudentExercises by studentModuleId
    if (studentModuleIds.length > 0) {
      await this.studentExerciseModel.updateMany(
        {
          studentModuleId: { $in: studentModuleIds },
          visible: true
        },
        { visible: false }
      ).exec();
    }

    // Also set visible=false for any remaining StudentExercises by direct course reference
    await this.studentExerciseModel.updateMany(
      {
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
        visible: true
      },
      { visible: false }
    ).exec();

    return enrollment;
  }

  async updateStudentStatus(courseId: string, studentId: string, teacherId: string, status: string, notes?: string) {
    // Verify course exists and teacher has access
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Update enrollment status
    const updateData: any = { status };
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const enrollment = await this.courseEnrollmentModel.findOneAndUpdate(
      {
        courseId: new Types.ObjectId(courseId),
        studentId: new Types.ObjectId(studentId),
        teacherId: new Types.ObjectId(teacherId),
        visible: true
      },
      updateData,
      { new: true }
    ).populate('studentId', 'name email role').exec();

    if (!enrollment) {
      throw new NotFoundException('Student enrollment not found');
    }

    return enrollment;
  }

  private async copyCourseContentToStudent(courseId: string, studentId: string, teacherId: string) {
    
    // Get course modules and exercises (only visible ones)
    const courseModules = await this.courseModuleModel.find({
      courseId: new Types.ObjectId(courseId),
      visible: true
    }).populate({
      path: 'content.exercises',
      select: 'title description content type estimatedTime maxScore difficulty tags visible status previousExerciseId nextExerciseId'
    }).exec();


    // Filter out exercises that are not visible (only copy exercises marked as visible)
    courseModules.forEach(module => {
      if (module.content?.exercises) {
        module.content.exercises = (module.content.exercises as any[]).filter(
          (exercise: any) => exercise.visible === true
        );
      }
    });

    // Create mapping for module references
    const courseToStudentModuleMap = new Map<string, string>();

    // First pass: Create all StudentModules without references
    for (const module of courseModules) {
      const studentModule = new this.studentModuleModel({
        studentId: new Types.ObjectId(studentId),
        courseModuleId: new Types.ObjectId(module._id.toString()),
        courseId: new Types.ObjectId(courseId),
        teacherId: new Types.ObjectId(teacherId),
        title: module.title,
        description: module.description,
        estimatedTime: module.estimatedTime,
        status: module.status || 'inactive', // Use course module status, default to 'inactive'
        progress: 0,
        tags: module.tags || [],
        type: module.type || 'all',
        prerequisites: module.prerequisites || []
      });

      await studentModule.save();
      courseToStudentModuleMap.set(module._id.toString(), studentModule._id.toString());
    }

    // Second pass: Update module references
    for (const module of courseModules) {
      const studentModuleId = courseToStudentModuleMap.get(module._id.toString());
      if (studentModuleId) {
        const updateData: any = {};

        if (module.previousModuleId) {
          const prevStudentModuleId = courseToStudentModuleMap.get(module.previousModuleId.toString());
          if (prevStudentModuleId) {
            updateData.previousModuleId = new Types.ObjectId(prevStudentModuleId);
          }
        } else {
          updateData.previousModuleId = null;
        }

        if (module.nextModuleId) {
          const nextStudentModuleId = courseToStudentModuleMap.get(module.nextModuleId.toString());
          if (nextStudentModuleId) {
            updateData.nextModuleId = new Types.ObjectId(nextStudentModuleId);
          }
        } else {
          updateData.nextModuleId = null;
        }

        if (Object.keys(updateData).length > 0) {
          await this.studentModuleModel.findByIdAndUpdate(studentModuleId, updateData).exec();
        }
      }
    }

    // Third pass: Process exercises for each module
    for (const module of courseModules) {
      const studentModuleId = courseToStudentModuleMap.get(module._id.toString());
      if (!studentModuleId) continue;

      const studentModule = await this.studentModuleModel.findById(studentModuleId).exec();
      if (!studentModule) continue;

      // Create StudentExercise for each exercise in the module
      const studentExerciseIds: Types.ObjectId[] = [];
      const courseToStudentExerciseMap = new Map<string, string>();

      if (module.content?.exercises && module.content.exercises.length > 0) {
        // First pass: Create all StudentExercises without references
        for (let i = 0; i < module.content.exercises.length; i++) {
          const exercise = module.content.exercises[i] as any;
          
          // Determine exercise status based on module status and type
          let exerciseStatus = 'pending'; // All exercises start as pending
          
          // Only set to ready if module is active
          if (studentModule.status === 'active') {
            if (studentModule.type === 'all') {
              // If module type is 'all', all exercises are ready when module is active
              exerciseStatus = 'ready';
            } else {
              // If module type is 'progress', only first exercise is ready when module is active
              if (i === 0) {
                exerciseStatus = 'ready';
              }
            }
          }
          
          const studentExercise = new this.studentExerciseModel({
            studentId: new Types.ObjectId(studentId),
            courseExerciseId: new Types.ObjectId(exercise._id.toString()),
            courseModuleId: new Types.ObjectId(module._id.toString()),
            studentModuleId: new Types.ObjectId(studentModuleId),
            courseId: new Types.ObjectId(courseId),
            teacherId: new Types.ObjectId(teacherId),
            title: exercise.title,
            description: exercise.description || '',
            content: exercise.content || '',
            type: exercise.type || 'exercise',
            estimatedTime: exercise.estimatedTime || 0,
            maxScore: exercise.maxScore || 10,
            difficulty: exercise.difficulty || 'intermediate',
            tags: exercise.tags || [],
            status: exerciseStatus,
            completedAt: null,
            score: null,
            attempts: 0,
            bestScore: 0,
            scores: []
          });

          await studentExercise.save();
          studentExerciseIds.push(new Types.ObjectId(studentExercise._id.toString()));
          courseToStudentExerciseMap.set(exercise._id.toString(), studentExercise._id.toString());
        }

        // Second pass: Rebuild references using the same order as course exercises
        // Find head exercise (no previousExerciseId)
        const headExercise = module.content.exercises.find((ex: any) => !ex.previousExerciseId);
        if (headExercise) {
          let currentExercise = headExercise;
          let previousStudentExerciseId: string | null = null;

          while (currentExercise) {
            const currentStudentExerciseId = courseToStudentExerciseMap.get(currentExercise._id.toString());
            if (currentStudentExerciseId) {
              const updateData: any = {};

              if (previousStudentExerciseId) {
                updateData.previousExerciseId = new Types.ObjectId(previousStudentExerciseId);
              } else {
                updateData.previousExerciseId = null;
              }

              // Find next exercise in the chain
              const nextExercise = module.content.exercises.find((ex: any) =>
                ex.previousExerciseId?.toString() === currentExercise._id.toString()
              );

              if (nextExercise) {
                const nextStudentExerciseId = courseToStudentExerciseMap.get(nextExercise._id.toString());
                if (nextStudentExerciseId) {
                  updateData.nextExerciseId = new Types.ObjectId(nextStudentExerciseId);
                }
              } else {
                updateData.nextExerciseId = null;
              }

              await this.studentExerciseModel.findByIdAndUpdate(currentStudentExerciseId, updateData).exec();

              previousStudentExerciseId = currentStudentExerciseId;
              currentExercise = nextExercise;
            } else {
              break;
            }
          }
        }

        // Update StudentModule with the exercise IDs
        await this.studentModuleModel.findByIdAndUpdate(
          studentModuleId,
          { studentExerciseIds: studentExerciseIds },
          { new: true }
        ).exec();
      }
    }
  }

  // Progress tracking methods
  async markExerciseCompleted(courseId: string, studentId: string, exerciseId: string, score?: number, teacherId?: string) {
    // Verify course exists and teacher has access (if teacherId provided)
    if (teacherId) {
      await this.courseAccessService.validateCourseAccess(courseId, teacherId);
    }

    await this.progressTrackingService.markExerciseCompleted(courseId, studentId, exerciseId, score);
    return { success: true, message: 'Exercise marked as completed' };
  }

  async markExerciseNotCompleted(courseId: string, studentId: string, exerciseId: string, teacherId: string) {
    // Verify course exists and teacher has access
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    await this.progressTrackingService.markExerciseNotCompleted(courseId, studentId, exerciseId);
    return { success: true, message: 'Exercise marked as not completed' };
  }

  async getStudentProgress(courseId: string, studentId: string, teacherId: string) {
    // Verify course exists and teacher has access
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    return await this.progressTrackingService.getEnrollmentProgress(courseId, studentId);
  }

  async updateStudentProgress(courseId: string, studentId: string, teacherId: string) {
    // Verify course exists and teacher has access
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    await this.progressTrackingService.updateEnrollmentProgress(courseId, studentId);
    return { success: true, message: 'Student progress updated' };
  }

  // Update module status and sync to all student modules
  async updateModuleStatus(courseId: string, moduleId: string, status: 'active' | 'inactive', teacherId: string) {
    // Verify the teacher has access to this course
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Update the course module status
    await this.courseModuleModel.findByIdAndUpdate(
      moduleId,
      { status: status },
      { new: true }
    ).exec();

    // Update all student modules that reference this course module
    await this.studentModuleModel.updateMany(
      { courseModuleId: new Types.ObjectId(moduleId) },
      { status: status }
    ).exec();

    // Update exercise statuses for all students in this module
    if (status === 'active') {
      // When activating a module, set appropriate exercises to ready
      await this.activateModuleExercises(courseId, moduleId);
    } else {
      // When deactivating a module, set all exercises to pending (except completed ones)
      await this.deactivateModuleExercises(courseId, moduleId);
    }

    return { success: true, message: `Module ${status === 'active' ? 'activated' : 'deactivated'} successfully` };
  }

  // Activate exercises in a module based on module type
  private async activateModuleExercises(courseId: string, moduleId: string) {
    const courseModule = await this.courseModuleModel.findById(moduleId).exec();
    if (!courseModule) return;

    // Get all student exercises for this module
    const studentExercises = await this.studentExerciseModel.find({
      courseModuleId: new Types.ObjectId(moduleId),
      visible: true
    }).exec();

    for (const studentExercise of studentExercises) {
      const studentModule = await this.studentModuleModel.findById(studentExercise.studentModuleId).exec();
      if (!studentModule) continue;

      let shouldBeReady = false;

      if (studentModule.type === 'all') {
        // All exercises should be ready
        shouldBeReady = true;
      } else {
        // Only first exercise should be ready
        const isFirstExercise = !studentExercise.previousExerciseId;
        shouldBeReady = isFirstExercise;
      }

      // Only update if exercise is not completed, not reviewed, and not in_progress
      if (studentExercise.status !== 'completed' && studentExercise.status !== 'reviewed' && studentExercise.status !== 'in_progress') {
        await this.studentExerciseModel.findByIdAndUpdate(
          studentExercise._id,
          { status: shouldBeReady ? 'ready' : 'pending' }
        ).exec();
      }
    }
  }

  // Deactivate exercises in a module
  private async deactivateModuleExercises(courseId: string, moduleId: string) {
    // Set all non-completed and non-reviewed exercises to pending
    await this.studentExerciseModel.updateMany(
      {
        courseModuleId: new Types.ObjectId(moduleId),
        status: { $nin: ['completed', 'reviewed', 'in_progress'] },
        visible: true
      },
      { status: 'pending' }
    ).exec();
  }

  async checkEnrollment(courseId: string, studentId: string, teacherId: string) {
    // Verify course exists and teacher has access
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Check enrollment
    const enrollment = await this.courseEnrollmentModel.findOne({
      courseId: new Types.ObjectId(courseId),
      studentId: new Types.ObjectId(studentId),
      visible: true
    }).exec();


    return {
      enrolled: !!enrollment,
      enrollment: enrollment ? {
        id: enrollment._id,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress
      } : null
    };
  }

  // Alias methods for backward compatibility
  async enrollStudentToCourse(courseId: string, studentId: string, teacherId: string, enrolledAt?: string) {
    return this.addStudentToCourse(courseId, studentId, teacherId);
  }

  async unenrollStudentFromCourse(courseId: string, studentId: string, teacherId: string) {
    return this.removeStudentFromCourse(courseId, studentId, teacherId);
  }

  async getStudentModules(courseId: string, studentId: string, teacherId: string) {
    // Verify course exists and teacher has access
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Get student modules for this course and student (only visible ones)
    const studentModules = await this.studentModuleModel.find({
      courseId: new Types.ObjectId(courseId),
      studentId: new Types.ObjectId(studentId),
      visible: true
    }).populate('courseModuleId').exec();


    return studentModules;
  }

  async getStudentExercises(courseId: string, studentId: string, teacherId: string) {
    return this.studentExerciseManagementService.getStudentExercises(courseId, studentId, teacherId);
  }

  async getStudentExerciseById(exerciseId: string, courseId: string, teacherId: string) {
    return this.studentExerciseManagementService.getStudentExerciseById(exerciseId, courseId, teacherId);
  }

  async deleteStudentExercise(courseId: string, studentId: string, moduleId: string, exerciseId: string, teacherId: string) {
    return this.studentExerciseManagementService.deleteStudentExercise(courseId, studentId, moduleId, exerciseId, teacherId);
  }

  async updateStudentExerciseContent(exerciseId: string, courseId: string, content: string, teacherId: string) {
    return this.studentExerciseManagementService.updateStudentExerciseContent(exerciseId, courseId, content, teacherId);
  }

  async updateStudentExercise(exerciseId: string, courseId: string, updateData: any, teacherId: string) {
    return this.studentExerciseManagementService.updateStudentExercise(exerciseId, courseId, updateData, teacherId);
  }

  async reorderStudentExerciseByIndex(courseId: string, studentId: string, moduleId: string, exerciseId: string, targetIndex: number, teacherId: string) {
    return this.studentExerciseManagementService.reorderStudentExerciseByIndex(courseId, studentId, moduleId, exerciseId, targetIndex, teacherId);
  }

  async addExerciseToStudentModule(courseId: string, studentId: string, moduleId: string, exerciseId: string, teacherId: string) {
    return this.studentExerciseManagementService.addExerciseToStudentModule(courseId, studentId, moduleId, exerciseId, teacherId);
  }


  async getStudentModule(moduleId: string) {
    return this.studentModuleModel.findById(moduleId).exec();
  }

  async getEnrollmentHistory(courseId: string, teacherId: string) {
    return this.enrollmentHistoryService.getEnrollmentHistory(courseId, teacherId);
  }

  async getStudentEnrollmentHistory(courseId: string, studentId: string, teacherId: string) {
    return this.enrollmentHistoryService.getStudentEnrollmentHistory(courseId, studentId, teacherId);
  }

  async updateExerciseStatus(courseId: string, studentId: string, exerciseId: string, status: string, teacherId: string) {
    return this.studentExerciseManagementService.updateExerciseStatus(courseId, studentId, exerciseId, status, teacherId);
  }

  // Get all enrollments for a specific student
  async getStudentEnrollments(studentId: string, teacherId: string) {
    return this.studentStatisticsService.getStudentEnrollments(studentId, teacherId);
  }

  // Get student statistics across all courses
  async getStudentStatistics(studentId: string, teacherId: string) {
    return this.studentStatisticsService.getStudentStatistics(studentId, teacherId);
  }

  // Get last exercise completed by student
  async getLastExerciseCompleted(studentId: string, teacherId: string) {
    return this.studentStatisticsService.getLastExerciseCompleted(studentId, teacherId);
  }
}
