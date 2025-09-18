import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoursesService } from './courses.service';

@Controller('courses')
export class EnrollmentsController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get(':id/students')
  @UseGuards(JwtAuthGuard)
  async getCourseStudents(@Request() req, @Param('id') courseId: string) {
    const teacherId = req.user.id;
    return this.coursesService.getCourseStudents(courseId, teacherId);
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  async enrollStudentToCourse(
    @Request() req,
    @Param('id') courseId: string,
    @Body() body: { studentId: string; enrolledAt?: string }
  ) {
    const teacherId = req.user.id;
    return this.coursesService.enrollStudentToCourse(courseId, body.studentId, teacherId, body.enrolledAt);
  }

  @Post(':id/unenroll')
  @UseGuards(JwtAuthGuard)
  async unenrollStudentFromCourse(
    @Request() req,
    @Param('id') courseId: string,
    @Body() body: { studentId: string }
  ) {
    const teacherId = req.user.id;
    return this.coursesService.unenrollStudentFromCourse(courseId, body.studentId, teacherId);
  }

  @Post(':id/students')
  @UseGuards(JwtAuthGuard)
  async addStudentToCourse(
    @Request() req,
    @Param('id') courseId: string,
    @Body() body: { studentId: string }
  ) {
    const teacherId = req.user.id;
    return this.coursesService.addStudentToCourse(courseId, body.studentId, teacherId);
  }

  @Delete(':id/students/:studentId')
  @UseGuards(JwtAuthGuard)
  async removeStudentFromCourse(
    @Request() req,
    @Param('id') courseId: string,
    @Param('studentId') studentId: string
  ) {
    const teacherId = req.user.id;
    return this.coursesService.removeStudentFromCourse(courseId, studentId, teacherId);
  }

  @Patch(':id/students/:studentId/status')
  @UseGuards(JwtAuthGuard)
  async updateStudentStatus(
    @Request() req,
    @Param('id') courseId: string,
    @Param('studentId') studentId: string,
    @Body() body: { status: string; notes?: string }
  ) {
    const teacherId = req.user.id;
    return this.coursesService.updateStudentStatus(courseId, studentId, teacherId, body.status, body.notes);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  async getCourseStats(
    @Param('id') courseId: string,
    @Request() req
  ) {
    const teacherId = req.user.id;
    return this.coursesService.getCourseStats(courseId, teacherId);
  }

  @Post('enrollments/:courseId/students/:studentId/exercises/:exerciseId/complete')
  @UseGuards(JwtAuthGuard)
  async markExerciseCompleted(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @Param('exerciseId') exerciseId: string,
    @Body() body: { score?: number },
    @Request() req: any
  ) {
    return this.coursesService.markExerciseCompleted(courseId, studentId, exerciseId, body.score, req.user.id);
  }

  @Post('enrollments/:courseId/students/:studentId/exercises/:exerciseId/uncomplete')
  @UseGuards(JwtAuthGuard)
  async markExerciseNotCompleted(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @Param('exerciseId') exerciseId: string,
    @Request() req: any
  ) {
    return this.coursesService.markExerciseNotCompleted(courseId, studentId, exerciseId, req.user.id);
  }

  @Get('enrollments/:courseId/students/:studentId/progress')
  @UseGuards(JwtAuthGuard)
  async getStudentProgress(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @Request() req: any
  ) {
    return this.coursesService.getStudentProgress(courseId, studentId, req.user.id);
  }

  @Post('enrollments/:courseId/students/:studentId/progress/update')
  @UseGuards(JwtAuthGuard)
  async updateStudentProgress(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @Request() req: any
  ) {
    return this.coursesService.updateStudentProgress(courseId, studentId, req.user.id);
  }

  @Get('enrollments/:courseId/students/:studentId/check')
  @UseGuards(JwtAuthGuard)
  async checkEnrollment(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @Request() req: any
  ) {
    return this.coursesService.checkEnrollment(courseId, studentId, req.user.id);
  }

  @Get(':courseId/students/:studentId/modules')
  @UseGuards(JwtAuthGuard)
  async getStudentModules(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @Request() req: any
  ) {
    return this.coursesService.getStudentModules(courseId, studentId, req.user.id);
  }

  @Patch(':courseId/students/:studentId/exercises/:exerciseId/status')
  @UseGuards(JwtAuthGuard)
  async updateExerciseStatus(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @Param('exerciseId') exerciseId: string,
    @Body() body: { status: string },
    @Request() req: any
  ) {
    return this.coursesService.updateExerciseStatus(courseId, studentId, exerciseId, body.status, req.user.id);
  }

  // Get all enrollments for a specific student
  @Get('students/:studentId/enrollments')
  @UseGuards(JwtAuthGuard)
  async getStudentEnrollments(
    @Param('studentId') studentId: string,
    @Request() req: any
  ) {
    return this.coursesService.getStudentEnrollments(studentId, req.user.id);
  }

  // Get student statistics across all courses
  @Get('students/:studentId/statistics')
  @UseGuards(JwtAuthGuard)
  async getStudentStatistics(
    @Param('studentId') studentId: string,
    @Request() req: any
  ) {
    return this.coursesService.getStudentStatistics(studentId, req.user.id);
  }

  // Get last exercise completed by student
  @Get('students/:studentId/last-exercise')
  @UseGuards(JwtAuthGuard)
  async getLastExerciseCompleted(
    @Param('studentId') studentId: string,
    @Request() req: any
  ) {
    return this.coursesService.getLastExerciseCompleted(studentId, req.user.id);
  }
}
