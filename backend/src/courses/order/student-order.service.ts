import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StudentModule, StudentModuleDocument } from '../../students/schemas/student-module.schema';
import { StudentExercise, StudentExerciseDocument } from '../../students/schemas/student-exercise.schema';
import { CourseModule, CourseModuleDocument } from '../schemas/course-module.schema';
import { CourseExercise, CourseExerciseDocument } from '../schemas/course-exercise.schema';
import { Course, CourseDocument } from '../schemas/course.schema';

@Injectable()
export class StudentOrderService {
  constructor(
    @InjectModel(StudentModule.name) private studentModuleModel: Model<StudentModuleDocument>,
    @InjectModel(StudentExercise.name) private studentExerciseModel: Model<StudentExerciseDocument>,
    @InjectModel(CourseModule.name) private courseModuleModel: Model<CourseModuleDocument>,
    @InjectModel(CourseExercise.name) private courseExerciseModel: Model<CourseExerciseDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>
  ) {}

  /**
   * Calculate and fix the order of student exercises in a module
   * This method ensures that student exercises have proper linked list structure
   * @param courseId - The course ID
   * @param studentId - The student ID
   * @param moduleId - The student module ID
   * @param teacherId - The teacher ID
   */
  async calculateStudentExerciseOrder(courseId: string, studentId: string, moduleId: string, teacherId: string) {
    // Verify the teacher has access to this course
    const course = await this.courseModel.findOne({
      _id: new Types.ObjectId(courseId),
      teacherId: new Types.ObjectId(teacherId),
    }).exec();

    if (!course) {
      throw new Error('Course not found or access denied');
    }

    // Get the student module to find the corresponding course module
    const studentModule = await this.studentModuleModel.findById(moduleId).exec();
    if (!studentModule) {
      throw new Error('Student module not found');
    }

    // Get the ordered course exercises for this module
    const orderedCourseExercises = await this.courseExerciseModel.find({
      courseModuleId: studentModule.courseModuleId,
      courseId: new Types.ObjectId(courseId),
      visible: true
    }).exec();

    if (orderedCourseExercises.length === 0) {
      return { message: 'No course exercises found' };
    }

    // Find head exercise (no previousExerciseId)
    const headExercise = orderedCourseExercises.find(e => !e.previousExerciseId);
    if (!headExercise) {
      return { message: 'No head exercise found' };
    }

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

    // Get all student exercises for this student in this module
    const studentExercises = await this.studentExerciseModel.find({
      studentId: new Types.ObjectId(studentId),
      studentModuleId: new Types.ObjectId(moduleId),
      courseId: new Types.ObjectId(courseId),
      visible: true
    }).exec();

    if (studentExercises.length === 0) {
      return { message: 'No student exercises to order' };
    }

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

    return { message: `Ordered ${studentExercises.length} student exercises following course exercise order` };
  }

  /**
   * Returns the tail (last) student exercise for a student's module, determined robustly
   * by preferring nodes that are not referenced as previousExerciseId and selecting the
   * one with the longest backward chain.
   */
  async getStudentTail(courseId: string, studentId: string, moduleId: string) {
    const normalizedStudentExercises = await this.studentExerciseModel.find({
      studentId: new Types.ObjectId(studentId),
      studentModuleId: new Types.ObjectId(moduleId),
      courseId: new Types.ObjectId(courseId),
      visible: true
    }).exec();

    if (!normalizedStudentExercises || normalizedStudentExercises.length === 0) return null;

    const referencedPrev = new Set<string>();
    normalizedStudentExercises.forEach(ex => {
      if (ex.previousExerciseId) referencedPrev.add(ex.previousExerciseId.toString());
    });

    const tailCandidates = normalizedStudentExercises.filter(ex => !referencedPrev.has(ex._id.toString()));

    const byId = new Map<string, any>(normalizedStudentExercises.map(e => [e._id.toString(), e]));
    const lengthFromTail = (ex: any): number => {
      let len = 1;
      let current = ex;
      const guard = new Set<string>();
      while (current && current.previousExerciseId) {
        const prevId = current.previousExerciseId.toString();
        if (guard.has(prevId)) break;
        guard.add(prevId);
        const prev = byId.get(prevId);
        if (!prev) break;
        len += 1;
        current = prev;
      }
      return len;
    };

    if (tailCandidates.length > 0) {
      return tailCandidates.reduce((best: any, cur: any) => {
        if (!best) return cur;
        const lb = lengthFromTail(best);
        const lc = lengthFromTail(cur);
        return lc >= lb ? cur : best;
      }, null as any);
    }

    // Fallback: any exercise that no one points to as next (by scan)
    const tail = normalizedStudentExercises.find(ex => !normalizedStudentExercises.some(nx => nx.previousExerciseId && nx.previousExerciseId.toString() === ex._id.toString())) || null;
    return tail;
  }
}
