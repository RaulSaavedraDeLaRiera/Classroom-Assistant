import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  // Template Courses
  @Get('courses')
  async getAllTemplateCourses(@Query() query: any) {
    // Get all template courses with optional filters
    return this.templatesService.getAllTemplateCourses(query);
  }

  @Post('courses')
  async createTemplateCourse(@Body() createTemplateCourseDto: any) {
    // Create new template course (admin/authorized teacher only)
    return this.templatesService.createTemplateCourse(createTemplateCourseDto);
  }

  @Get('courses/:id')
  async getTemplateCourseById(@Param('id') id: string) {
    // Get specific template course by ID
    return this.templatesService.getTemplateCourseById(id);
  }

  @Put('courses/:id')
  async updateTemplateCourse(@Param('id') id: string, @Body() updateTemplateCourseDto: any) {
    // Update complete template course
    return this.templatesService.updateTemplateCourse(id, updateTemplateCourseDto);
  }

  @Patch('courses/:id')
  async partialUpdateTemplateCourse(@Param('id') id: string, @Body() partialUpdateDto: any) {
    // Partial update of template course (title, modules, description)
    return this.templatesService.partialUpdateTemplateCourse(id, partialUpdateDto);
  }

  @Delete('courses/:id')
  async deleteTemplateCourse(@Param('id') id: string) {
    // Soft delete - hide template course (visible=false)
    return this.templatesService.deleteTemplateCourse(id);
  }

  // Template Modules
  @Get('modules')
  async getAllTemplateModules(@Query() query: any) {
    // Get all template modules with optional filters
    return this.templatesService.getAllTemplateModules(query);
  }

  @Post('modules')
  async createTemplateModule(@Body() createTemplateModuleDto: any) {
    // Create new template module
    return this.templatesService.createTemplateModule(createTemplateModuleDto);
  }

  @Get('modules/:id')
  async getTemplateModuleById(@Param('id') id: string) {
    // Get specific template module by ID
    return this.templatesService.getTemplateModuleById(id);
  }

  @Put('modules/:id')
  async updateTemplateModule(@Param('id') id: string, @Body() updateTemplateModuleDto: any) {
    // Update complete template module
    return this.templatesService.updateTemplateModule(id, updateTemplateModuleDto);
  }

  @Patch('modules/:id')
  async partialUpdateTemplateModule(@Param('id') id: string, @Body() partialUpdateDto: any) {
    // Partial update of template module
    return this.templatesService.partialUpdateTemplateModule(id, partialUpdateDto);
  }

  @Delete('modules/:id')
  async deleteTemplateModule(@Param('id') id: string) {
    // Soft delete - hide template module (visible=false)
    return this.templatesService.deleteTemplateModule(id);
  }

  // Template Exercises
  @Get('exercises')
  async getAllTemplateExercises(@Query() query: any) {
    // Get all template exercises with optional filters
    return this.templatesService.getAllTemplateExercises(query);
  }

  @Post('exercises')
  async createTemplateExercise(@Body() createTemplateExerciseDto: any) {
    // Create new template exercise
    return this.templatesService.createTemplateExercise(createTemplateExerciseDto);
  }

  @Get('exercises/:id')
  async getTemplateExerciseById(@Param('id') id: string) {
    // Get specific template exercise by ID
    return this.templatesService.getTemplateExerciseById(id);
  }

  @Put('exercises/:id')
  async updateTemplateExercise(@Param('id') id: string, @Body() updateTemplateExerciseDto: any) {
    // Update complete template exercise
    return this.templatesService.updateTemplateExercise(id, updateTemplateExerciseDto);
  }

  @Patch('exercises/:id')
  async partialUpdateTemplateExercise(@Param('id') id: string, @Body() partialUpdateDto: any) {
    // Partial update of template exercise
    return this.templatesService.partialUpdateTemplateExercise(id, partialUpdateDto);
  }

  @Delete('exercises/:id')
  async deleteTemplateExercise(@Param('id') id: string) {
    // Soft delete - hide template exercise (visible=false)
    return this.templatesService.deleteTemplateExercise(id);
  }
}
