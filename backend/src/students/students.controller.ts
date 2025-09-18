import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { StudentsService } from './students.service';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // Student Modules endpoints
  @Get('modules')
  async getAllStudentModules(@Query() query: any) {
    // Get all student modules with optional filters
    return this.studentsService.getAllStudentModules(query);
  }

  @Post('modules')
  async createStudentModule(@Body() createStudentModuleDto: any) {
    // Create new personalized module for student
    return this.studentsService.createStudentModule(createStudentModuleDto);
  }

  @Get('modules/:id')
  async getStudentModuleById(@Param('id') id: string) {
    // Get specific student module by ID
    return this.studentsService.getStudentModuleById(id);
  }

  @Put('modules/:id')
  async updateStudentModule(@Param('id') id: string, @Body() updateStudentModuleDto: any) {
    // Update complete student module
    return this.studentsService.updateStudentModule(id, updateStudentModuleDto);
  }

  @Patch('modules/:id')
  async partialUpdateStudentModule(@Param('id') id: string, @Body() partialUpdateDto: any) {
    // Partial update (status, progress, exercises)
    return this.studentsService.partialUpdateStudentModule(id, partialUpdateDto);
  }

  @Delete('modules/:id')
  async deleteStudentModule(@Param('id') id: string) {
    // Soft delete - hide student module (visible=false)
    return this.studentsService.deleteStudentModule(id);
  }

  // Student Exercises endpoints
  @Get('exercises')
  async getAllStudentExercises(@Query() query: any) {
    // Get all student exercises with optional filters
    return this.studentsService.getAllStudentExercises(query);
  }

  @Post('exercises')
  async createStudentExercise(@Body() createStudentExerciseDto: any) {
    // Create new personalized exercise for student
    return this.studentsService.createStudentExercise(createStudentExerciseDto);
  }

  @Get('exercises/:id')
  async getStudentExerciseById(@Param('id') id: string) {
    // Get specific student exercise by ID
    return this.studentsService.getStudentExerciseById(id);
  }

  @Put('exercises/:id')
  async updateStudentExercise(@Param('id') id: string, @Body() updateStudentExerciseDto: any) {
    // Update complete student exercise
    return this.studentsService.updateStudentExercise(id, updateStudentExerciseDto);
  }

  @Patch('exercises/:id')
  async partialUpdateStudentExercise(@Param('id') id: string, @Body() partialUpdateDto: any) {
    // Partial update (status, score, feedback, timeSpent)
    return this.studentsService.partialUpdateStudentExercise(id, partialUpdateDto);
  }

  @Delete('exercises/:id')
  async deleteStudentExercise(@Param('id') id: string) {
    // Soft delete - hide student exercise (visible=false)
    return this.studentsService.deleteStudentExercise(id);
  }
}
