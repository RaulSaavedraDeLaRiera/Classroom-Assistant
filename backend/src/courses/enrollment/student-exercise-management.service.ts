import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StudentExercise, StudentExerciseDocument } from '../../students/schemas/student-exercise.schema';
import { StudentModule, StudentModuleDocument } from '../../students/schemas/student-module.schema';
import { CourseEnrollment, CourseEnrollmentDocument } from '../schemas/course-enrollment.schema';
import { TeacherExercise, TeacherExerciseDocument } from '../../teachers/schemas/teacher-exercise.schema';
import { TemplateExercise, TemplateExerciseDocument } from '../../templates/schemas/template-exercise.schema';
import { CourseAccessService } from '../course-access.service';
import { ProgressTrackingService } from '../progress-tracking.service';
import { OrderService } from '../order.service';

@Injectable()
export class StudentExerciseManagementService {
  constructor(
    @InjectModel(StudentExercise.name) private studentExerciseModel: Model<StudentExerciseDocument>,
    @InjectModel(StudentModule.name) private studentModuleModel: Model<StudentModuleDocument>,
    @InjectModel(CourseEnrollment.name) private courseEnrollmentModel: Model<CourseEnrollmentDocument>,
    @InjectModel(TeacherExercise.name) private teacherExerciseModel: Model<TeacherExerciseDocument>,
    @InjectModel(TemplateExercise.name) private templateExerciseModel: Model<TemplateExerciseDocument>,
    private courseAccessService: CourseAccessService,
    private progressTrackingService: ProgressTrackingService,
    private orderService: OrderService
  ) {}

  async getStudentExercises(courseId: string, studentId: string, teacherId: string) {
    // Verify course exists and teacher has access
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Get student modules for this course and student first (only visible ones)
    const studentModules = await this.studentModuleModel.find({
      courseId: new Types.ObjectId(courseId),
      studentId: new Types.ObjectId(studentId),
      visible: true
    }).exec();

    if (studentModules.length === 0) {
      return [];
    }

    // Get all student module IDs
    const studentModuleIds = studentModules.map(module => module._id);

    // Get student exercises that belong to these modules (only visible ones)
    const studentExercises = await this.studentExerciseModel.find({
      studentModuleId: { $in: studentModuleIds },
      visible: true
    }).populate('courseExerciseId').exec();

    return studentExercises;
  }

  async getStudentExerciseById(exerciseId: string, courseId: string, teacherId: string) {
    // Find the student exercise
    const studentExercise = await this.studentExerciseModel.findById(exerciseId).populate('courseExerciseId').exec();

    if (!studentExercise) {
      throw new NotFoundException('Student exercise not found');
    }

    // Verify the teacher has access to this course using the courseId from URL
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    return studentExercise;
  }

  async deleteStudentExercise(courseId: string, studentId: string, moduleId: string, exerciseId: string, teacherId: string) {
    // Verify teacher access
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Find the student exercise
    const studentExercise = await this.studentExerciseModel.findOne({
      _id: new Types.ObjectId(exerciseId),
      studentId: new Types.ObjectId(studentId),
      studentModuleId: new Types.ObjectId(moduleId),
      visible: true
    }).exec();

    if (!studentExercise) {
      throw new NotFoundException('Student exercise not found');
    }

    // Reconnect linked list
    const prevId = studentExercise.previousExerciseId;
    const nextId = studentExercise.nextExerciseId;
    if (prevId && nextId) {
      await this.studentExerciseModel.updateOne({ _id: prevId }, { nextExerciseId: nextId }).exec();
      await this.studentExerciseModel.updateOne({ _id: nextId }, { previousExerciseId: prevId }).exec();
    } else if (prevId) {
      await this.studentExerciseModel.updateOne({ _id: prevId }, { nextExerciseId: null }).exec();
    } else if (nextId) {
      await this.studentExerciseModel.updateOne({ _id: nextId }, { previousExerciseId: null }).exec();
    }

    // Soft delete
    await this.studentExerciseModel.updateOne({ _id: studentExercise._id }, { visible: false }).exec();

    return { message: 'Student exercise deleted' };
  }

  async updateStudentExerciseContent(exerciseId: string, courseId: string, content: string, teacherId: string) {
    // Verify the teacher has access to this course
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Update the student exercise content
    const updatedExercise = await this.studentExerciseModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(exerciseId),
        courseId: new Types.ObjectId(courseId),
        visible: true
      },
      { content: content },
      { new: true }
    ).exec();

    if (!updatedExercise) {
      throw new NotFoundException('Student exercise not found');
    }

    return updatedExercise;
  }

  async updateStudentExercise(exerciseId: string, courseId: string, updateData: any, teacherId: string) {
    // Verify the teacher has access to this course
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Find the student exercise
    const existingExercise = await this.studentExerciseModel.findOne({
      _id: new Types.ObjectId(exerciseId),
      courseId: new Types.ObjectId(courseId),
      visible: true
    }).exec();

    if (!existingExercise) {
      throw new NotFoundException('Student exercise not found');
    }

    // Update the student exercise
    const updatedExercise = await this.studentExerciseModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(exerciseId),
        courseId: new Types.ObjectId(courseId),
        visible: true
      },
      { $set: updateData },
      { new: true }
    ).exec();

    if (!updatedExercise) {
      throw new NotFoundException('Failed to update student exercise');
    }

    return updatedExercise;
  }

  async reorderStudentExerciseByIndex(courseId: string, studentId: string, moduleId: string, exerciseId: string, targetIndex: number, teacherId: string) {
    // Verify the teacher has access to this course
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Get all student exercises for this student in this module
    const studentExercises = await this.studentExerciseModel
      .find({
        studentId: new Types.ObjectId(studentId),
        studentModuleId: new Types.ObjectId(moduleId),
        courseId: new Types.ObjectId(courseId),
        visible: true
      })
      .exec();

    if (studentExercises.length === 0) {
      throw new NotFoundException('No student exercises found for this module');
    }

    // Find the exercise to move
    const exerciseToMove = studentExercises.find(ex => ex._id.toString() === exerciseId);
    if (!exerciseToMove) {
      throw new NotFoundException('Student exercise not found');
    }

    // Build ordered list robustly, even if the linked list is inconsistent
    const orderedExercises: any[] = [];
    const byId = new Map<string, any>();
    const prevToCurrent = new Map<string, any>();
    const hasPrev = new Set<string>();

    for (const ex of studentExercises) {
      const id = ex._id.toString();
      byId.set(id, ex);
      if (ex.previousExerciseId) {
        const prevId = ex.previousExerciseId.toString();
        prevToCurrent.set(prevId, ex);
        hasPrev.add(id);
      }
    }

    // Start chains from nodes with no or invalid previous pointers
    const startingNodes: any[] = [];
    for (const ex of studentExercises) {
      if (!ex.previousExerciseId || !byId.has(ex.previousExerciseId.toString())) {
        startingNodes.push(ex);
      }
    }

    const visited = new Set<string>();
    for (const start of startingNodes) {
      let current: any = start;
      while (current && !visited.has(current._id.toString())) {
        orderedExercises.push(current);
        visited.add(current._id.toString());
        const next = studentExercises.find(nx =>
          nx.previousExerciseId && nx.previousExerciseId.toString() === current._id.toString()
        );
        current = next || null;
      }
    }

    // Append any unvisited nodes to ensure all exercises are included
    for (const ex of studentExercises) {
      const id = ex._id.toString();
      if (!visited.has(id)) {
        orderedExercises.push(ex);
        visited.add(id);
      }
    }

    // Get current index
    const currentIndex = orderedExercises.findIndex(ex => ex._id.toString() === exerciseId);
    if (currentIndex === -1) {
      // As a final fallback, place the exercise at the end
      orderedExercises.push(exerciseToMove);
      // currentIndex becomes last index
    }
    const effectiveCurrentIndex = currentIndex === -1 ? (orderedExercises.length - 1) : currentIndex;

    // Clamp target index
    const clampedTargetIndex = Math.max(0, Math.min(targetIndex, orderedExercises.length - 1));
    
    if (effectiveCurrentIndex === clampedTargetIndex) {
      return { message: 'No change needed' };
    }

    // Create new order array
    const newOrder = orderedExercises.map(ex => ex._id.toString());
    newOrder.splice(effectiveCurrentIndex, 1);
    newOrder.splice(clampedTargetIndex, 0, exerciseId);

    // Get the exercises that will be affected by the reordering
    const exerciseToMoveData = byId.get(exerciseId) || orderedExercises[effectiveCurrentIndex];
    const targetPositionExercise = byId.get(newOrder[clampedTargetIndex]) || orderedExercises[clampedTargetIndex];
    
    // Check if we need to swap statuses
    // Only swap if: the exercise being moved is 'ready' and the target position exercise is 'pending'
    const isAdjacentMove = Math.abs(currentIndex - clampedTargetIndex) === 1;
    const shouldSwapStatuses = 
      isAdjacentMove &&
      exerciseToMoveData.status === 'ready' && 
      targetPositionExercise.status === 'pending';

    // Update linked list pointers for all exercises
    for (let i = 0; i < newOrder.length; i++) {
      const exerciseId = newOrder[i];
      const prevId = i > 0 ? newOrder[i - 1] : null;
      const nextId = i < newOrder.length - 1 ? newOrder[i + 1] : null;

      // Prevent circular references
      const updateData: any = {};
      if (prevId && prevId !== exerciseId) {
        updateData.previousExerciseId = new Types.ObjectId(prevId);
      } else {
        updateData.previousExerciseId = null;
      }
      
      if (nextId && nextId !== exerciseId) {
        updateData.nextExerciseId = new Types.ObjectId(nextId);
      } else {
        updateData.nextExerciseId = null;
      }

      // If we need to swap statuses, do it for the affected exercises
      if (shouldSwapStatuses) {
        if (exerciseId === exerciseToMoveData._id.toString()) {
          // The exercise that was 'ready' becomes 'pending'
          updateData.status = 'pending';
        } else if (exerciseId === targetPositionExercise._id.toString()) {
          // The exercise that was 'pending' becomes 'ready'
          updateData.status = 'ready';
        }
      }

      await this.studentExerciseModel.updateOne(
        { _id: new Types.ObjectId(exerciseId) },
        updateData
      );
    }

    return { 
      message: 'Exercise reordered successfully',
      statusSwapped: shouldSwapStatuses,
      details: shouldSwapStatuses ? 
        `Status swapped: Adjacent move - Exercise moved from 'ready' to 'pending', target exercise from 'pending' to 'ready'` : 
        isAdjacentMove ? 'Adjacent move but no status swap needed' : 'Non-adjacent move - no status changes'
    };
  }

  async addExerciseToStudentModule(courseId: string, studentId: string, moduleId: string, exerciseId: string, teacherId: string) {
    // Verify the teacher has access to this course
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Verify the student is enrolled in the course
    const enrollment = await this.courseEnrollmentModel.findOne({
      courseId: new Types.ObjectId(courseId),
      studentId: new Types.ObjectId(studentId),
    }).exec();

    if (!enrollment) {
      throw new NotFoundException('Student is not enrolled in this course');
    }

    // Get the exercise to copy (could be from teacher exercises or template exercises)
    let sourceExercise: any = await this.teacherExerciseModel.findById(exerciseId).exec();
    let exerciseSource = 'teacher';
    
    // If not found in teacher exercises, try template exercises
    if (!sourceExercise) {
      sourceExercise = await this.templateExerciseModel.findById(exerciseId).exec();
      exerciseSource = 'template';
    }
    
    if (!sourceExercise) {
      throw new NotFoundException('Exercise not found in teacher or template exercises');
    }

    // Get the student module
    const studentModule = await this.studentModuleModel.findById(moduleId).exec();
    if (!studentModule) {
      throw new NotFoundException('Student module not found');
    }

    // Allow duplicate exercises - no need to check for existing exercises
    // Students can have multiple exercises with the same source (teacher/template)

    // Find the last exercise in the linked list to append the new one
    // First, get all exercises for this student in this module
    const allStudentExercises = await this.studentExerciseModel
      .find({
        studentId: new Types.ObjectId(studentId),
        studentModuleId: new Types.ObjectId(moduleId),
        visible: true
      })
      .exec();

    // Normalize existing order using OrderService to ensure a consistent chain
    await this.orderService.calculateStudentExerciseOrder(courseId, studentId, moduleId, teacherId);

    // For debugging: log current order chain
    const normalizedStudentExercises = await this.studentExerciseModel
      .find({
        studentId: new Types.ObjectId(studentId),
        studentModuleId: new Types.ObjectId(moduleId),
        courseId: new Types.ObjectId(courseId),
        visible: true
      })
      .exec();
    const byIdForLog = new Map<string, any>(normalizedStudentExercises.map(e => [e._id.toString(), e]));
    const headForLog = normalizedStudentExercises.find(ex => !ex.previousExerciseId || !byIdForLog.has(ex.previousExerciseId.toString())) || null;
    const visitedForLog = new Set<string>();
    const chainForLog: string[] = [];
    let walker: any = headForLog;
    while (walker && !visitedForLog.has(walker._id.toString())) {
      visitedForLog.add(walker._id.toString());
      chainForLog.push(`${walker._id.toString()}:${walker.title || ''}`);
      const nextId = walker.nextExerciseId ? walker.nextExerciseId.toString() : null;
      walker = nextId && byIdForLog.has(nextId) ? byIdForLog.get(nextId) : null;
    }

    // Determine tail via OrderService
    const lastExercise = await this.orderService.getStudentTail(courseId, studentId, moduleId);

    // Determine exercise status based on module type
    let exerciseStatus = 'pending';
    if (studentModule.type === 'all') {
      exerciseStatus = 'ready';
    } else {
      // For 'progress' type, only ready if it's the first exercise and first module
      if (!lastExercise && !studentModule.previousModuleId) {
        exerciseStatus = 'ready';
      }
    }

    // Create the student exercise
    const studentExerciseData: any = {
      title: sourceExercise.title,
      description: sourceExercise.description,
      content: sourceExercise.content,
      type: sourceExercise.type,
      studentModuleId: new Types.ObjectId(moduleId),
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      teacherId: new Types.ObjectId(teacherId),
      previousExerciseId: lastExercise ? lastExercise._id : null,
      nextExerciseId: null,
      visible: true,
      tags: sourceExercise.tags,
      status: exerciseStatus,
      maxScore: sourceExercise.maxScore || sourceExercise.estimatedScore || 10, // Use maxScore, estimatedScore, or default to 10
      estimatedTime: sourceExercise.estimatedTime,
      difficulty: sourceExercise.difficulty,
    };

    // Add the appropriate reference based on the source
    if (exerciseSource === 'teacher') {
      studentExerciseData.teacherExerciseId = new Types.ObjectId(exerciseId);
    } else {
      studentExerciseData.templateExerciseId = new Types.ObjectId(exerciseId);
    }

    const studentExercise = new this.studentExerciseModel(studentExerciseData);

    await studentExercise.save();

    // Update the previous exercise to point to this new one
    if (lastExercise) {
      await this.studentExerciseModel.updateOne(
        { _id: lastExercise._id },
        { nextExerciseId: studentExercise._id }
      );
    }

    // Ensure the new exercise doesn't have circular references
    await this.studentExerciseModel.updateOne(
      { _id: studentExercise._id },
      {
        previousExerciseId: lastExercise ? lastExercise._id : null,
        nextExerciseId: null
      }
    );

    return studentExercise;
  }

  async updateExerciseStatus(courseId: string, studentId: string, exerciseId: string, status: string, teacherId: string) {
    // Verify teacher access to course
    await this.courseAccessService.validateCourseAccess(courseId, teacherId);

    // Validate status
    const validStatuses = ['pending', 'ready', 'in_progress', 'completed', 'reviewed', 'blocked'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Find the student exercise
    const studentExercise = await this.studentExerciseModel.findOne({
      _id: new Types.ObjectId(exerciseId),
      studentId: new Types.ObjectId(studentId),
      courseId: new Types.ObjectId(courseId),
      visible: true
    }).exec();

    if (!studentExercise) {
      throw new NotFoundException('Student exercise not found');
    }

    // Update the status
    const updatedExercise = await this.studentExerciseModel.findByIdAndUpdate(
      exerciseId,
      { status: status },
      { new: true }
    ).exec();

    // Update sequential exercise statuses based on the new status
    await this.progressTrackingService.updateSequentialExerciseStatuses(courseId, studentId, exerciseId, status);

    // Update enrollment progress
    await this.progressTrackingService.updateEnrollmentProgress(courseId, studentId);

    return updatedExercise;
  }
}
