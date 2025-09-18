import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from './schemas/course.schema';
import { CourseModule, CourseModuleDocument } from './schemas/course-module.schema';
import { CourseExercise, CourseExerciseDocument } from './schemas/course-exercise.schema';
import { StudentModule, StudentModuleDocument } from '../students/schemas/student-module.schema';
import { StudentExercise, StudentExerciseDocument } from '../students/schemas/student-exercise.schema';
import { OrderService } from './order.service';

@Injectable()
export class StudentSyncService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(CourseModule.name) private courseModuleModel: Model<CourseModuleDocument>,
    @InjectModel(CourseExercise.name) private courseExerciseModel: Model<CourseExerciseDocument>,
    @InjectModel(StudentModule.name) private studentModuleModel: Model<StudentModuleDocument>,
    @InjectModel(StudentExercise.name) private studentExerciseModel: Model<StudentExerciseDocument>,
    private orderService: OrderService
  ) {}

  async syncModuleOrderToStudents(courseId: string, teacherId: string): Promise<void> {
    // Get active enrolled students for this course
    const activeEnrollments = await this.courseModel.findOne({
      _id: courseId,
      teacherId: new Types.ObjectId(teacherId),
      visible: true
    }).populate('students').exec();

    if (!activeEnrollments || !activeEnrollments.students) return;

    const studentIds = activeEnrollments.students.map((s: any) => s._id);

    // Get the ordered course modules
    const orderedCourseModules = await this.courseModuleModel.find({
      courseId: new Types.ObjectId(courseId),
      visible: true
    }).exec();

    if (orderedCourseModules.length === 0) return;

    // Find head module (no previousModuleId)
    const headModule = orderedCourseModules.find(m => !m.previousModuleId);
    if (!headModule) return;

    // Traverse and build order map
    const moduleOrderMap = new Map<string, { prev: string | null, next: string | null }>();
    let current = headModule;

    while (current) {
      const nextModule = orderedCourseModules.find(m =>
        m.previousModuleId?.toString() === current._id.toString()
      );

      moduleOrderMap.set(current._id.toString(), {
        prev: current.previousModuleId?.toString() || null,
        next: nextModule?._id.toString() || null
      });

      current = nextModule || null;
    }

    // Apply order to each student's modules
    for (const studentId of studentIds) {
      const studentModules = await this.studentModuleModel.find({
        studentId: new Types.ObjectId(studentId),
        courseId: new Types.ObjectId(courseId),
        visible: true
      }).exec();

      // Create mapping from courseModuleId to studentModuleId
      const courseToStudentMap = new Map<string, string>();
      studentModules.forEach(sm => {
        courseToStudentMap.set(sm.courseModuleId.toString(), sm._id.toString());
      });

      // Update each student module's order
      for (const [courseModuleId, order] of moduleOrderMap.entries()) {
        const studentModuleId = courseToStudentMap.get(courseModuleId);
        if (studentModuleId) {
          const prevStudentModuleId = order.prev ? courseToStudentMap.get(order.prev) : null;
          const nextStudentModuleId = order.next ? courseToStudentMap.get(order.next) : null;

          await this.studentModuleModel.findByIdAndUpdate(studentModuleId, {
            previousModuleId: prevStudentModuleId ? new Types.ObjectId(prevStudentModuleId) : null,
            nextModuleId: nextStudentModuleId ? new Types.ObjectId(nextStudentModuleId) : null
          }).exec();
        }
      }
    }
  }

  async syncExerciseOrderToStudents(moduleId: string, teacherId: string): Promise<void> {
    // Get the course module to find courseId
    const courseModule = await this.courseModuleModel.findById(moduleId).exec();
    if (!courseModule) return;

    const courseId = courseModule.courseId.toString();

    // Get active enrolled students for this course
    const activeEnrollments = await this.courseModel.findOne({
      _id: courseId,
      teacherId: new Types.ObjectId(teacherId),
      visible: true
    }).populate('students').exec();

    if (!activeEnrollments || !activeEnrollments.students) return;

    const studentIds = activeEnrollments.students.map((s: any) => s._id);

    // Get the ordered course exercises for this module
    const orderedCourseExercises = await this.courseExerciseModel.find({
      courseModuleId: new Types.ObjectId(moduleId),
      visible: true
    }).exec();

    if (orderedCourseExercises.length === 0) return;

    // Find head exercise (no previousExerciseId)
    const headExercise = orderedCourseExercises.find(e => !e.previousExerciseId);
    if (!headExercise) return;

    // Traverse and build order map
    const exerciseOrderMap = new Map<string, { prev: string | null, next: string | null }>();
    let current = headExercise;

    while (current) {
      const nextExercise = orderedCourseExercises.find(e =>
        e.previousExerciseId?.toString() === current._id.toString()
      );

      exerciseOrderMap.set(current._id.toString(), {
        prev: current.previousExerciseId?.toString() || null,
        next: nextExercise?._id.toString() || null
      });

      current = nextExercise || null;
    }

    // Apply order to each student's exercises
    for (const studentId of studentIds) {
      // Find student's module that corresponds to this course module
      const studentModule = await this.studentModuleModel.findOne({
        studentId: new Types.ObjectId(studentId),
        courseModuleId: new Types.ObjectId(moduleId),
        visible: true
      }).exec();

      if (!studentModule) continue;

      const studentExercises = await this.studentExerciseModel.find({
        studentModuleId: studentModule._id,
        visible: true
      }).exec();

      // Create mapping from courseExerciseId to studentExerciseId
      const courseToStudentMap = new Map<string, string>();
      studentExercises.forEach(se => {
        if (se.courseExerciseId) {
          courseToStudentMap.set(se.courseExerciseId.toString(), se._id.toString());
        }
      });

      // Update each student exercise's order
      for (const [courseExerciseId, order] of exerciseOrderMap.entries()) {
        const studentExerciseId = courseToStudentMap.get(courseExerciseId);
        if (studentExerciseId) {
          const prevStudentExerciseId = order.prev ? courseToStudentMap.get(order.prev) : null;
          const nextStudentExerciseId = order.next ? courseToStudentMap.get(order.next) : null;

          await this.studentExerciseModel.findByIdAndUpdate(studentExerciseId, {
            previousExerciseId: prevStudentExerciseId ? new Types.ObjectId(prevStudentExerciseId) : null,
            nextExerciseId: nextStudentExerciseId ? new Types.ObjectId(nextStudentExerciseId) : null
          }).exec();
        }
      }

      // Handle student exercises that don't have courseExerciseId (created from templates/teacher)
      const studentExercisesWithoutCourseId = studentExercises.filter(se => !se.courseExerciseId);
      
      if (studentExercisesWithoutCourseId.length > 0) {
        // Rebuild the entire linked list for this student's module
        await this.rebuildStudentExerciseLinkedList(studentExercises, exerciseOrderMap, studentExercisesWithoutCourseId);
      }
    }
  }

  // Rebuild the entire linked list for student exercises
  private async rebuildStudentExerciseLinkedList(
    allStudentExercises: any[],
    exerciseOrderMap: Map<string, { prev: string | null, next: string | null }>,
    studentExercisesWithoutCourseId: any[]
  ): Promise<void> {
    
    // First, clear all previous/next references to avoid circular references
    for (const exercise of allStudentExercises) {
      await this.studentExerciseModel.updateOne(
        { _id: exercise._id },
        {
          previousExerciseId: null,
          nextExerciseId: null
        }
      );
    }

    // Build the new order: course exercises first, then student-specific exercises positioned relative to course exercises
    const newOrder: any[] = [];
    
    // Add course exercises in their correct order
    const courseExercisesWithPosition: Array<{id: string, position: number}> = [];
    let position = 0;
    
    // Find head exercise (no previous)
    let headExerciseId: string | null = null;
    for (const [courseExerciseId, order] of exerciseOrderMap.entries()) {
      if (!order.prev) {
        headExerciseId = courseExerciseId;
        break;
      }
    }
    
    // Traverse the linked list to get positions
    let currentId = headExerciseId;
    while (currentId) {
      courseExercisesWithPosition.push({ id: currentId, position });
      const order = exerciseOrderMap.get(currentId);
      currentId = order?.next || null;
      position++;
    }
    
    // Add course exercises to new order
    for (const courseEx of courseExercisesWithPosition) {
      const studentExercise = allStudentExercises.find(se => 
        se.courseExerciseId && se.courseExerciseId.toString() === courseEx.id
      );
      if (studentExercise) {
        newOrder.push(studentExercise);
      }
    }
    
    // Build helper maps
    const byId = new Map<string, any>();
    for (const ex of allStudentExercises) byId.set(ex._id.toString(), ex);

    const isStudentOnly = (ex: any) => !ex.courseExerciseId;

    // Identify heads of student-only chains (whose previous is null or not student-only)
    const visited = new Set<string>();
    const chainHeads: any[] = [];
    for (const ex of studentExercisesWithoutCourseId) {
      const prevId = ex.previousExerciseId?.toString();
      const prev = prevId ? byId.get(prevId) : null;
      if (!prev || !isStudentOnly(prev)) {
        chainHeads.push(ex);
      }
    }

    // For each chain head, collect the contiguous student-only chain preserving order
    for (const head of chainHeads) {
      if (visited.has(head._id.toString())) continue;
      const chain: any[] = [];
      let cur: any | null = head;
      while (cur && isStudentOnly(cur) && !visited.has(cur._id.toString())) {
        chain.push(cur);
        visited.add(cur._id.toString());
        // move to next student-only
        const next = allStudentExercises.find(se => se.previousExerciseId && se.previousExerciseId.toString() === cur._id.toString());
        if (next && isStudentOnly(next)) {
          cur = next;
        } else {
          break;
        }
      }

      // Determine insertion index for the chain:
      // 1) Prefer after nearest previous course exercise walking backwards from head
      const findNearestPrevCourseId = (): string | null => {
        let p = head.previousExerciseId ? byId.get(head.previousExerciseId.toString()) : null;
        while (p) {
          if (p.courseExerciseId) return p.courseExerciseId.toString();
          p = p.previousExerciseId ? byId.get(p.previousExerciseId.toString()) : null;
        }
        return null;
      };

      // 2) Else before nearest next course exercise walking forwards from tail
      const tail = chain[chain.length - 1];
      const findNearestNextCourseId = (): string | null => {
        let n = allStudentExercises.find(se => se.previousExerciseId && se.previousExerciseId.toString() === tail._id.toString());
        while (n) {
          if (n.courseExerciseId) return n.courseExerciseId.toString();
          n = allStudentExercises.find(se => se.previousExerciseId && se.previousExerciseId.toString() === n._id.toString());
        }
        return null;
      };

      let insertIndex = newOrder.length;
      let reason = 'END';

      // Special case: if head has no previousExerciseId, it should go at the beginning
      if (!head.previousExerciseId) {
        insertIndex = 0;
        reason = 'BEGINNING (no previous)';
      }
      // Special case: if tail has no nextExerciseId, it should go at the end
      else if (!tail.nextExerciseId) {
        insertIndex = newOrder.length;
        reason = 'END (no next)';
      }
      // Normal case: find position based on course exercises
      else {
        const prevCourseId = findNearestPrevCourseId();
        if (prevCourseId) {
          const targetAfter = newOrder.find(se => se.courseExerciseId && se.courseExerciseId.toString() === prevCourseId);
          if (targetAfter) {
            insertIndex = newOrder.indexOf(targetAfter) + 1;
            reason = `AFTER ${targetAfter.title} (nearest prev course)`;
          }
        } else {
          const nextCourseId = findNearestNextCourseId();
          if (nextCourseId) {
            const targetBefore = newOrder.find(se => se.courseExerciseId && se.courseExerciseId.toString() === nextCourseId);
            if (targetBefore) {
              insertIndex = newOrder.indexOf(targetBefore);
              reason = `BEFORE ${targetBefore.title} (nearest next course)`;
            }
          }
        }
      }

      // Insert the whole chain preserving order
      newOrder.splice(insertIndex, 0, ...chain);
    }
    
    // Update linked list pointers for all exercises
    for (let i = 0; i < newOrder.length; i++) {
      const exercise = newOrder[i];
      const prevExercise = i > 0 ? newOrder[i - 1] : null;
      const nextExercise = i < newOrder.length - 1 ? newOrder[i + 1] : null;

      await this.studentExerciseModel.updateOne(
        { _id: exercise._id },
        {
          previousExerciseId: prevExercise ? prevExercise._id : null,
          nextExerciseId: nextExercise ? nextExercise._id : null
        }
      );
    }
  }
}
