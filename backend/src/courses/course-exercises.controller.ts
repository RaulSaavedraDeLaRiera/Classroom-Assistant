import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CourseExercisesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('exercises')
  @UseGuards(JwtAuthGuard)
  async getAllCourseExercises(@Param() query: any) {
    return this.coursesService.getAllCourseExercises(query);
  }

  @Post('exercises')
  @UseGuards(JwtAuthGuard)
  async createCourseExercise(@Body() createCourseExerciseDto: any) {
    return this.coursesService.createCourseExercise(createCourseExerciseDto);
  }

  @Get('exercises/:id')
  @UseGuards(JwtAuthGuard)
  async getCourseExerciseById(@Param('id') id: string) {
    return this.coursesService.getCourseExerciseById(id);
  }

  @Put('exercises/:id')
  @UseGuards(JwtAuthGuard)
  async updateCourseExercise(@Param('id') id: string, @Body() updateCourseExerciseDto: any) {
    return this.coursesService.updateCourseExercise(id, updateCourseExerciseDto);
  }

  @Patch('exercises/:id')
  @UseGuards(JwtAuthGuard)
  async partialUpdateCourseExercise(@Param('id') id: string, @Body() partialUpdateDto: any, @Request() req: any) {
    try {
      // Check if this is ONLY a maxScore update (no other fields)
      const hasOtherFields = Object.keys(partialUpdateDto).some(key => key !== 'maxScore');
      const isOnlyMaxScore = partialUpdateDto.maxScore !== undefined && !hasOtherFields;
      
      // If there's content being updated, always use the general method
      if (partialUpdateDto.content !== undefined) {
        return await this.coursesService.partialUpdateCourseExercise(id, partialUpdateDto);
      }
      
      // If ONLY updating maxScore (no other fields), use the specialized method
      if (isOnlyMaxScore) {
        return await this.coursesService.updateExerciseMaxScore(id, partialUpdateDto.maxScore, req.user.id);
      } else {
        // For updates with multiple fields or without maxScore, use the general method
        return await this.coursesService.partialUpdateCourseExercise(id, partialUpdateDto);
      }
    } catch (error) {
      console.error('Update failed:', error);
      throw error;
    }
  }

  @Delete('exercises/:id')
  @UseGuards(JwtAuthGuard)
  async deleteCourseExercise(@Param('id') id: string) {
    return this.coursesService.deleteCourseExercise(id);
  }

  @Get(':id/exercises')
  @UseGuards(JwtAuthGuard)
  async getCourseExercises(@Request() req, @Param('id') courseId: string) {
    const teacherId = req.user.id;
    return this.coursesService.getCourseExercises(courseId, teacherId);
  }

  @Post('modules/:moduleId/add-exercise')
  @UseGuards(JwtAuthGuard)
  async addExerciseToModule(
    @Param('moduleId') moduleId: string,
    @Body() body: { exerciseId: string },
    @Request() req: any
  ) {
    const teacherId = req.user.id;
    return this.coursesService.addExerciseToModule(moduleId, body.exerciseId, teacherId);
  }

  @Patch('exercises/:id/reorder')
  @UseGuards(JwtAuthGuard)
  async reorderExercise(
    @Param('id') id: string,
    @Body() body: { previousExerciseId?: string | null; nextExerciseId?: string | null },
    @Request() req: any
  ) {
    return this.coursesService.reorderExercise(id, body.previousExerciseId, body.nextExerciseId, req.user.id);
  }

  @Patch('modules/:moduleId/exercises/:id/reorder-by-index')
  @UseGuards(JwtAuthGuard)
  async reorderExerciseByIndex(
    @Param('moduleId') moduleId: string,
    @Param('id') id: string,
    @Body() body: { targetIndex: number },
    @Request() req: any
  ) {
    return this.coursesService.reorderExerciseByIndex(moduleId, id, Number(body.targetIndex), req.user.id);
  }
}
