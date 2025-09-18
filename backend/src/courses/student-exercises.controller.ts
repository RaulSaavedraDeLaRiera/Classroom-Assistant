import { Controller, Get, Put, Patch, Delete, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoursesService } from './courses.service';

@Controller('courses')
export class StudentExercisesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get(':courseId/students/:studentId/exercises')
  @UseGuards(JwtAuthGuard)
  async getStudentExercises(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @Request() req: any
  ) {
    return this.coursesService.getStudentExercises(courseId, studentId, req.user.id);
  }

  @Get(':courseId/student-exercises/:exerciseId')
  @UseGuards(JwtAuthGuard)
  async getStudentExerciseById(
    @Param('courseId') courseId: string,
    @Param('exerciseId') exerciseId: string,
    @Request() req: any
  ) {
    return this.coursesService.getStudentExerciseById(exerciseId, courseId, req.user.id);
  }

  @Put(':courseId/student-exercises/:exerciseId/content')
  @UseGuards(JwtAuthGuard)
  async updateStudentExerciseContent(
    @Param('courseId') courseId: string,
    @Param('exerciseId') exerciseId: string,
    @Body() body: { content: string },
    @Request() req: any
  ) {
    return this.coursesService.updateStudentExerciseContent(exerciseId, courseId, body.content, req.user.id);
  }

  @Patch(':courseId/student-exercises/:exerciseId')
  @UseGuards(JwtAuthGuard)
  async updateStudentExercise(
    @Param('courseId') courseId: string,
    @Param('exerciseId') exerciseId: string,
    @Body() body: any,
    @Request() req: any
  ) {
    return this.coursesService.updateStudentExercise(exerciseId, courseId, body, req.user.id);
  }

  @Patch(':courseId/students/:studentId/modules/:moduleId/exercises/:exerciseId/reorder-by-index')
  @UseGuards(JwtAuthGuard)
  async reorderStudentExerciseByIndex(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @Param('moduleId') moduleId: string,
    @Param('exerciseId') exerciseId: string,
    @Body() body: { targetIndex: number },
    @Request() req: any
  ) {
    return this.coursesService.reorderStudentExerciseByIndex(courseId, studentId, moduleId, exerciseId, Number(body.targetIndex), req.user.id);
  }

  @Post(':courseId/students/:studentId/modules/:moduleId/add-exercise')
  @UseGuards(JwtAuthGuard)
  async addExerciseToStudentModule(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @Param('moduleId') moduleId: string,
    @Body() body: { exerciseId: string },
    @Request() req: any
  ) {
    return this.coursesService.addExerciseToStudentModule(courseId, studentId, moduleId, body.exerciseId, req.user.id);
  }

  @Patch(':courseId/students/:studentId/modules/:moduleId/calculate-exercise-order')
  @UseGuards(JwtAuthGuard)
  async calculateStudentExerciseOrder(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @Param('moduleId') moduleId: string,
    @Request() req: any
  ) {
    return this.coursesService.calculateStudentExerciseOrder(courseId, studentId, moduleId, req.user.id);
  }

  @Delete(':courseId/students/:studentId/modules/:moduleId/exercises/:exerciseId')
  @UseGuards(JwtAuthGuard)
  async deleteStudentExercise(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
    @Param('moduleId') moduleId: string,
    @Param('exerciseId') exerciseId: string,
    @Request() req: any
  ) {
    return this.coursesService.deleteStudentExercise(courseId, studentId, moduleId, exerciseId, req.user.id);
  }
}


