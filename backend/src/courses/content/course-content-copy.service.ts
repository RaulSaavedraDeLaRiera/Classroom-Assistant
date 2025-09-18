import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CourseModule, CourseModuleDocument } from '../schemas/course-module.schema';
import { CourseExercise, CourseExerciseDocument } from '../schemas/course-exercise.schema';
import { StudentModule, StudentModuleDocument } from '../../students/schemas/student-module.schema';
import { StudentExercise, StudentExerciseDocument } from '../../students/schemas/student-exercise.schema';
import { TeacherModule, TeacherModuleDocument } from '../../teachers/schemas/teacher-module.schema';
import { TeacherExercise, TeacherExerciseDocument } from '../../teachers/schemas/teacher-exercise.schema';
import { TemplateModule, TemplateModuleDocument } from '../../templates/schemas/template-module.schema';
import { TemplateExercise, TemplateExerciseDocument } from '../../templates/schemas/template-exercise.schema';
import { Course, CourseDocument } from '../schemas/course.schema';
import { OrderService } from '../order.service';
import { StudentSyncService } from '../student-sync.service';

@Injectable()
export class CourseContentCopyService {
  constructor(
    @InjectModel(CourseModule.name) private courseModuleModel: Model<CourseModuleDocument>,
    @InjectModel(CourseExercise.name) private courseExerciseModel: Model<CourseExerciseDocument>,
    @InjectModel(StudentModule.name) private studentModuleModel: Model<StudentModuleDocument>,
    @InjectModel(StudentExercise.name) private studentExerciseModel: Model<StudentExerciseDocument>,
    @InjectModel(TeacherModule.name) private teacherModuleModel: Model<TeacherModuleDocument>,
    @InjectModel(TeacherExercise.name) private teacherExerciseModel: Model<TeacherExerciseDocument>,
    @InjectModel(TemplateModule.name) private templateModuleModel: Model<TemplateModuleDocument>,
    @InjectModel(TemplateExercise.name) private templateExerciseModel: Model<TemplateExerciseDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    private orderService: OrderService,
    private studentSyncService: StudentSyncService
  ) {}

  async copyExercisesFromModule(moduleData: any, courseModule: CourseModuleDocument, courseId: string, teacherId: string, isTemplateModule: boolean) {
    let exercisesArray: any[] = [];

    if (isTemplateModule) {
      exercisesArray = moduleData.content?.exercises || [];
    } else {
      // Teacher module - exercises are in content.exercises
      exercisesArray = moduleData.content?.exercises || [];
    }

    if (exercisesArray && exercisesArray.length > 0) {
      const createdExercises = [];
      
      // First pass: Create all exercises without ordering
      for (let j = 0; j < exercisesArray.length; j++) {
        const exerciseId = exercisesArray[j];

        let exerciseData: any = null;

        if (isTemplateModule) {
          // Get exercise from template
          try {
            exerciseData = await this.templateExerciseModel.findOne({
              _id: exerciseId,
              visible: true
            }).exec();
          } catch (error) {
            continue;
          }
        } else {
          // Get exercise from teacher
          exerciseData = await this.teacherExerciseModel.findOne({
            _id: exerciseId,
            teacherId: new Types.ObjectId(teacherId),
            visible: true
          }).exec();
        }

        if (exerciseData) {
          const courseExercise = new this.courseExerciseModel({
            title: exerciseData.title,
            description: exerciseData.description, // Copy description from source
            content: exerciseData.content,
            courseId: new Types.ObjectId(courseId),
            courseModuleId: new Types.ObjectId(courseModule._id.toString()),
            templateExerciseId: isTemplateModule ?
              new Types.ObjectId(exerciseData._id.toString()) :
              (exerciseData.templateExerciseId ? new Types.ObjectId(exerciseData.templateExerciseId.toString()) : undefined),
            teacherExerciseId: isTemplateModule ? undefined : new Types.ObjectId(exerciseData._id.toString()),
            type: exerciseData.type || 'exercise',
            difficulty: exerciseData.difficulty || 'medium',
            tags: exerciseData.tags || [],
            estimatedTime: exerciseData.estimatedTime || 0,
            status: 'active'
          });

          await courseExercise.save();
          createdExercises.push(courseExercise);

          // Add exercise ID to the module's content.exercises array
          await this.courseModuleModel.findByIdAndUpdate(
            courseModule._id,
            { $push: { 'content.exercises': courseExercise._id } },
            { new: true }
          ).exec();
        }
      }
      
      // Second pass: Set up the linked list manually
      for (let j = 0; j < createdExercises.length; j++) {
        const exercise = createdExercises[j];
        const previousExercise = j > 0 ? createdExercises[j - 1] : null;
        const nextExercise = j < createdExercises.length - 1 ? createdExercises[j + 1] : null;
        
        await this.courseExerciseModel.findByIdAndUpdate(exercise._id, {
          previousExerciseId: previousExercise ? previousExercise._id : null,
          nextExerciseId: nextExercise ? nextExercise._id : null
        }).exec();
      }
    }

    // Sync all copied exercises to enrolled students
    if (exercisesArray && exercisesArray.length > 0) {
      for (let j = 0; j < exercisesArray.length; j++) {
        const exerciseId = exercisesArray[j];
        const courseExercise = await this.courseExerciseModel.findOne({
          courseModuleId: new Types.ObjectId(courseModule._id.toString()),
          title: isTemplateModule ?
            (await this.templateExerciseModel.findById(exerciseId).exec())?.title :
            (await this.teacherExerciseModel.findById(exerciseId).exec())?.title
        }).exec();

        if (courseExercise) {
          await this.addNewExerciseToEnrolledStudentsWithoutOrdering(courseExercise._id.toString(), courseModule._id.toString(), teacherId);
        }
      }
      
      // After adding all exercises, sync the order to all students
      console.log('Syncing exercise order to all students after adding all exercises from Add Module...');
      await this.studentSyncService.syncExerciseOrderToStudents(courseModule._id.toString(), teacherId);
    }
  }

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
          status: 'pending',
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

        // Find the last exercise in the student's module (both course and student exercises)
        const allStudentExercises = await this.studentExerciseModel
          .find({
            studentModuleId: studentModule._id,
            visible: true
          })
          .exec();

        // Find the last exercise in the linked list
        let lastExercise = null;
        const headExercise = allStudentExercises.find(se => !se.previousExerciseId);
        if (headExercise) {
          let current = headExercise;
          while (current) {
            const nextExercise = allStudentExercises.find(se => 
              se.previousExerciseId && se.previousExerciseId.toString() === current._id.toString()
            );
            if (!nextExercise) {
              lastExercise = current;
              break;
            }
            current = nextExercise;
          }
        }

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

  async addNewModuleToEnrolledStudents(moduleId: string, courseId: string, teacherId: string): Promise<void> {
    // Get the course module details
    const courseModule = await this.courseModuleModel.findById(moduleId).exec();
    if (!courseModule) return;

    // Get active enrolled students for this course
    const activeEnrollments = await this.courseModel.findOne({
      _id: courseId,
      teacherId: new Types.ObjectId(teacherId),
      visible: true
    }).populate('students').exec();

    if (!activeEnrollments || !activeEnrollments.students) return;

    const studentIds = activeEnrollments.students.map((s: any) => s._id);

    // For each enrolled student, add the module
    for (const studentId of studentIds) {
      // Find the corresponding student modules for previous and next references
      let previousStudentModuleId = null;
      let nextStudentModuleId = null;

      if (courseModule.previousModuleId) {
        const previousStudentModule = await this.studentModuleModel.findOne({
          courseModuleId: courseModule.previousModuleId,
          studentId: new Types.ObjectId(studentId),
          courseId: new Types.ObjectId(courseId)
        }).exec();
        if (previousStudentModule) {
          previousStudentModuleId = previousStudentModule._id;
        }
      }

      if (courseModule.nextModuleId) {
        const nextStudentModule = await this.studentModuleModel.findOne({
          courseModuleId: courseModule.nextModuleId,
          studentId: new Types.ObjectId(studentId),
          courseId: new Types.ObjectId(courseId)
        }).exec();
        if (nextStudentModule) {
          nextStudentModuleId = nextStudentModule._id;
        }
      }

      // Create StudentModule for this student
      const studentModule = new this.studentModuleModel({
        studentId: new Types.ObjectId(studentId),
        courseModuleId: new Types.ObjectId(moduleId),
        courseId: new Types.ObjectId(courseId),
        teacherId: new Types.ObjectId(teacherId),
        title: courseModule.title,
        description: courseModule.description,
        estimatedTime: courseModule.estimatedTime,
        status: 'active',
        progress: 0,
        tags: courseModule.tags || [],
        type: courseModule.type || 'all',
        prerequisites: courseModule.prerequisites || [],
        // Map the order references to student modules
        previousModuleId: previousStudentModuleId,
        nextModuleId: nextStudentModuleId
      });

      await studentModule.save();

      // Set the order for this module in the student's course (add to end)
      await this.orderService.addModuleToCourse(courseId, studentModule._id.toString());
    }

    // After adding the new module, sync all student modules for all students
    for (const studentId of studentIds) {
      await this.syncStudentModulesOrder(courseId, studentId.toString());
    }
  }

  async syncStudentModulesOrder(courseId: string, studentId: string): Promise<void> {
    // Get all course modules ordered by their linked list
    const orderedCourseModules = await this.getOrderedCourseModules(courseId);

    // Get all student modules for this student
    const studentModules = await this.studentModuleModel.find({
      courseId: new Types.ObjectId(courseId),
      studentId: new Types.ObjectId(studentId),
      visible: true
    }).exec();

    // Create a map of courseModuleId -> studentModule
    const studentModuleMap = new Map();
    studentModules.forEach(sm => {
      studentModuleMap.set(sm.courseModuleId.toString(), sm);
    });

    // Update the linked list for each student module following the course module order
    for (let i = 0; i < orderedCourseModules.length; i++) {
      const courseModule = orderedCourseModules[i];
      const studentModule = studentModuleMap.get(courseModule._id.toString());
      
      if (!studentModule) {
        continue;
      }

      // Determine previous and next student module IDs
      let previousStudentModuleId = null;
      let nextStudentModuleId = null;

      if (i > 0) {
        // Previous module exists
        const previousCourseModule = orderedCourseModules[i - 1];
        const previousStudentModule = studentModuleMap.get(previousCourseModule._id.toString());
        if (previousStudentModule) {
          previousStudentModuleId = previousStudentModule._id;
        }
      }

      if (i < orderedCourseModules.length - 1) {
        // Next module exists
        const nextCourseModule = orderedCourseModules[i + 1];
        const nextStudentModule = studentModuleMap.get(nextCourseModule._id.toString());
        if (nextStudentModule) {
          nextStudentModuleId = nextStudentModule._id;
        }
      }

      // Update the student module with new order references
      await this.studentModuleModel.findByIdAndUpdate(studentModule._id, {
        previousModuleId: previousStudentModuleId,
        nextModuleId: nextStudentModuleId
      }).exec();
    }
  }

  async getOrderedCourseModules(courseId: string): Promise<any[]> {
    // Get all course modules
    const courseModules = await this.courseModuleModel.find({
      courseId: new Types.ObjectId(courseId),
      visible: true
    }).exec();

    if (courseModules.length === 0) return [];

    // Find the first module (no previousModuleId)
    const firstModule = courseModules.find(module => !module.previousModuleId);
    
    if (!firstModule) {
      // Fallback: sort by creation date
      return courseModules.sort((a, b) => new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime());
    }

    // Build ordered list following the linked list
    const ordered = [firstModule];
    let current = firstModule;
    
    while (current.nextModuleId) {
      const nextModule = courseModules.find(m => m._id.toString() === current.nextModuleId.toString());
      if (nextModule && !ordered.find(m => m._id.toString() === nextModule._id.toString())) {
        ordered.push(nextModule);
        current = nextModule;
      } else {
        break;
      }
    }

    return ordered;
  }
}
