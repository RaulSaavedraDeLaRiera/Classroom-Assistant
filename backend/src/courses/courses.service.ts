import { Injectable } from '@nestjs/common';
import { CourseManagementService } from './course-management.service';
import { CourseEnrollmentService } from './course-enrollment.service';
import { CourseContentService } from './course-content.service';
import { OrderService } from './order.service';
import { StudentExerciseManagementService } from './enrollment/student-exercise-management.service';

@Injectable()
export class CoursesService {
  constructor(
    private courseManagementService: CourseManagementService,
    private courseEnrollmentService: CourseEnrollmentService,
    private courseContentService: CourseContentService,
    private orderService: OrderService,
    private studentExerciseManagementService: StudentExerciseManagementService
  ) {}

  // Course Management - delegate to CourseManagementService
  async getAllCourses(query: any = {}) {
    return this.courseManagementService.getAllCourses(query);
  }

  async getCourseById(id: string) {
    return this.courseManagementService.getCourseById(id);
  }

  async updateCourse(id: string, updateCourseDto: any) {
    return this.courseManagementService.updateCourse(id, updateCourseDto);
  }

  async partialUpdateCourse(id: string, partialUpdateDto: any) {
    return this.courseManagementService.partialUpdateCourse(id, partialUpdateDto);
  }

  async deleteCourse(id: string) {
    return this.courseManagementService.deleteCourse(id);
  }

  async getCourseStats(courseId: string, teacherId: string) {
    return this.courseManagementService.getCourseStats(courseId, teacherId);
  }

  // Course Content - delegate to CourseContentService
  async getAllCourseModules(query: any = {}) {
    return this.courseContentService.getAllCourseModules(query);
  }

  async createCourseModule(createCourseModuleDto: any) {
    return this.courseContentService.createCourseModule(createCourseModuleDto);
  }

  async getCourseModuleById(id: string) {
    return this.courseContentService.getCourseModuleById(id);
  }

  async updateCourseModule(id: string, updateCourseModuleDto: any) {
    return this.courseContentService.updateCourseModule(id, updateCourseModuleDto);
  }

  async partialUpdateCourseModule(id: string, partialUpdateDto: any) {
    return this.courseContentService.partialUpdateCourseModule(id, partialUpdateDto);
  }

  async deleteCourseModule(id: string) {
    return this.courseContentService.deleteCourseModule(id);
  }

  async getAllCourseExercises(query: any = {}) {
    return this.courseContentService.getAllCourseExercises(query);
  }

  async createCourseExercise(createCourseExerciseDto: any) {
    return this.courseContentService.createCourseExercise(createCourseExerciseDto);
  }

  async getCourseExerciseById(id: string) {
    return this.courseContentService.getCourseExerciseById(id);
  }

  async updateCourseExercise(id: string, updateCourseExerciseDto: any) {
    return this.courseContentService.updateCourseExercise(id, updateCourseExerciseDto);
  }

  async partialUpdateCourseExercise(id: string, partialUpdateDto: any) {
    return this.courseContentService.partialUpdateCourseExercise(id, partialUpdateDto);
  }

  async deleteCourseExercise(id: string) {
    return this.courseContentService.deleteCourseExercise(id);
  }

  async deleteStudentExercise(courseId: string, studentId: string, moduleId: string, exerciseId: string, teacherId: string) {
    return this.courseEnrollmentService.deleteStudentExercise(courseId, studentId, moduleId, exerciseId, teacherId);
  }

  async addTeacherModuleToCourse(courseId: string, teacherModuleId: string, teacherId: string) {
    return this.courseContentService.addTeacherModuleToCourse(courseId, teacherModuleId, teacherId);
  }

  async removeTeacherModuleFromCourse(courseId: string, teacherModuleId: string, teacherId: string) {
    return this.courseContentService.removeTeacherModuleFromCourse(courseId, teacherModuleId, teacherId);
  }

  async addExerciseToModule(moduleId: string, exerciseId: string, teacherId: string) {
    return this.courseContentService.addExerciseToModule(moduleId, exerciseId, teacherId);
  }

  async getCourseWithModules(courseId: string, teacherId: string) {
    return this.courseContentService.getCourseWithModules(courseId, teacherId);
  }

  async getAvailableTeacherModulesForCourse(courseId: string, teacherId: string) {
    return this.courseContentService.getAvailableTeacherModulesForCourse(courseId, teacherId);
  }

  async createCompleteCourse(createCourseDto: any, teacherId: string) {
    return this.courseContentService.createCompleteCourse(createCourseDto, teacherId);
  }

  async getCourseModules(courseId: string, teacherId: string) {
    return this.courseContentService.getCourseModules(courseId, teacherId);
  }

  async getCourseExercises(courseId: string, teacherId: string) {
    return this.courseContentService.getCourseExercises(courseId, teacherId);
  }

  // Course Enrollment - delegate to CourseEnrollmentService
  async getCourseStudents(courseId: string, teacherId: string) {
    return this.courseEnrollmentService.getCourseStudents(courseId, teacherId);
  }

  async addStudentToCourse(courseId: string, studentId: string, teacherId: string) {
    return this.courseEnrollmentService.addStudentToCourse(courseId, studentId, teacherId);
  }

  async removeStudentFromCourse(courseId: string, studentId: string, teacherId: string) {
    return this.courseEnrollmentService.removeStudentFromCourse(courseId, studentId, teacherId);
  }

  async updateStudentStatus(courseId: string, studentId: string, teacherId: string, status: string, notes?: string) {
    return this.courseEnrollmentService.updateStudentStatus(courseId, studentId, teacherId, status, notes);
  }

  async enrollStudentToCourse(courseId: string, studentId: string, teacherId: string, enrolledAt?: string) {
    return this.courseEnrollmentService.enrollStudentToCourse(courseId, studentId, teacherId, enrolledAt);
  }

  async unenrollStudentFromCourse(courseId: string, studentId: string, teacherId: string) {
    return this.courseEnrollmentService.unenrollStudentFromCourse(courseId, studentId, teacherId);
  }

  // Order operations - delegate to OrderService and CourseContentService for sync
  async reorderModule(moduleId: string, previousModuleId: string | null, nextModuleId: string | null, teacherId: string) {
    await this.orderService.reorderModule(moduleId, previousModuleId, nextModuleId);
    await this.courseContentService.syncModuleOrderToStudents(moduleId, teacherId);
    return { success: true };
  }

  async reorderModuleByIndex(courseId: string, moduleId: string, targetIndex: number, teacherId: string) {
    await this.orderService.reorderModuleByIndex(courseId, moduleId, targetIndex);
    await this.courseContentService.syncModuleOrderToStudents(courseId, teacherId);
    return { success: true };
  }

  async reorderExercise(exerciseId: string, previousExerciseId: string | null, nextExerciseId: string | null, teacherId: string) {
    await this.orderService.reorderExercise(exerciseId, previousExerciseId, nextExerciseId);
    await this.courseContentService.syncExerciseOrderToStudents(exerciseId, teacherId);
    return { success: true };
  }

  async reorderExerciseByIndex(moduleId: string, exerciseId: string, targetIndex: number, teacherId: string) {
    await this.orderService.reorderExerciseByIndex(moduleId, exerciseId, targetIndex);
    await this.courseContentService.syncExerciseOrderToStudents(moduleId, teacherId);
    return { success: true };
  }

  // Progress tracking methods - delegate to CourseEnrollmentService
  async markExerciseCompleted(courseId: string, studentId: string, exerciseId: string, score?: number, teacherId?: string) {
    return this.courseEnrollmentService.markExerciseCompleted(courseId, studentId, exerciseId, score, teacherId);
  }

  async markExerciseNotCompleted(courseId: string, studentId: string, exerciseId: string, teacherId: string) {
    return this.courseEnrollmentService.markExerciseNotCompleted(courseId, studentId, exerciseId, teacherId);
  }

  async reorderStudentExerciseByIndex(courseId: string, studentId: string, moduleId: string, exerciseId: string, targetIndex: number, teacherId: string) {
    return this.courseEnrollmentService.reorderStudentExerciseByIndex(courseId, studentId, moduleId, exerciseId, targetIndex, teacherId);
  }

  async addExerciseToStudentModule(courseId: string, studentId: string, moduleId: string, exerciseId: string, teacherId: string) {
    return this.courseEnrollmentService.addExerciseToStudentModule(courseId, studentId, moduleId, exerciseId, teacherId);
  }

  async calculateStudentExerciseOrder(courseId: string, studentId: string, moduleId: string, teacherId: string) {
    // Get the student module to find the course module ID
    const studentModule = await this.courseEnrollmentService.getStudentModule(moduleId);
    if (studentModule) {
      return this.courseContentService.syncExerciseOrderToStudents(studentModule.courseModuleId.toString(), teacherId);
    }
    return { message: 'Student module not found' };
  }

  async getStudentProgress(courseId: string, studentId: string, teacherId: string) {
    return this.courseEnrollmentService.getStudentProgress(courseId, studentId, teacherId);
  }

  async updateStudentProgress(courseId: string, studentId: string, teacherId: string) {
    return this.courseEnrollmentService.updateStudentProgress(courseId, studentId, teacherId);
  }

  async checkEnrollment(courseId: string, studentId: string, teacherId: string) {
    return this.courseEnrollmentService.checkEnrollment(courseId, studentId, teacherId);
  }

  async updateModuleStatus(courseId: string, moduleId: string, status: 'active' | 'inactive', teacherId: string) {
    return this.courseEnrollmentService.updateModuleStatus(courseId, moduleId, status, teacherId);
  }

  // Student-specific methods
  async getStudentModules(courseId: string, studentId: string, teacherId: string) {
    return this.courseEnrollmentService.getStudentModules(courseId, studentId, teacherId);
  }

  async getStudentExercises(courseId: string, studentId: string, teacherId: string) {
    return this.courseEnrollmentService.getStudentExercises(courseId, studentId, teacherId);
  }

  async getStudentExerciseById(exerciseId: string, courseId: string, teacherId: string) {
    return this.courseEnrollmentService.getStudentExerciseById(exerciseId, courseId, teacherId);
  }

  async updateStudentExerciseContent(exerciseId: string, courseId: string, content: string, teacherId: string) {
    return this.courseEnrollmentService.updateStudentExerciseContent(exerciseId, courseId, content, teacherId);
  }

  async updateStudentExercise(exerciseId: string, courseId: string, updateData: any, teacherId: string) {
    return this.studentExerciseManagementService.updateStudentExercise(exerciseId, courseId, updateData, teacherId);
  }

  async getEnrollmentHistory(courseId: string, teacherId: string) {
    return this.courseEnrollmentService.getEnrollmentHistory(courseId, teacherId);
  }

  async getStudentEnrollmentHistory(courseId: string, studentId: string, teacherId: string) {
    return this.courseEnrollmentService.getStudentEnrollmentHistory(courseId, studentId, teacherId);
  }

  async updateExerciseStatus(courseId: string, studentId: string, exerciseId: string, status: string, teacherId: string) {
    return this.courseEnrollmentService.updateExerciseStatus(courseId, studentId, exerciseId, status, teacherId);
  }

  async updateExerciseMaxScore(exerciseId: string, maxScore: number, teacherId: string) {
    return this.courseContentService.updateExerciseMaxScore(exerciseId, maxScore, teacherId);
  }

  // Get all enrollments for a specific student
  async getStudentEnrollments(studentId: string, teacherId: string) {
    return this.courseEnrollmentService.getStudentEnrollments(studentId, teacherId);
  }

  // Get student statistics across all courses
  async getStudentStatistics(studentId: string, teacherId: string) {
    return this.courseEnrollmentService.getStudentStatistics(studentId, teacherId);
  }

  // Get last exercise completed by student
  async getLastExerciseCompleted(studentId: string, teacherId: string) {
    return this.courseEnrollmentService.getLastExerciseCompleted(studentId, teacherId);
  }
}