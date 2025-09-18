import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllCourses(@Query() query: any, @Request() req: any) {
    // Get all courses with optional filters (teacherId, status, tags)
    // If no teacherId provided, use the authenticated user's ID
    if (!query.teacherId && req.user) {
      query.teacherId = req.user.id;
    }
    
    return this.coursesService.getAllCourses(query);
  }


  // Course CRUD operations (must be after specific routes)
  // MOVED TO END - specific routes must come before general :id route

  // Course Integration Endpoints
  @Get(':id/with-modules')
  @UseGuards(JwtAuthGuard)
  async getCourseWithModules(@Request() req, @Param('id') courseId: string) {
    const teacherId = req.user.id;
    return this.coursesService.getCourseWithModules(courseId, teacherId);
  }

  @Post('complete')
  @UseGuards(JwtAuthGuard)
  async createCompleteCourse(@Request() req, @Body() createCourseDto: any) {
    const teacherId = req.user.id;
    return this.coursesService.createCompleteCourse(createCourseDto, teacherId);
  }


  @Put(':id')
  async updateCourse(@Param('id') id: string, @Body() updateCourseDto: any) {
    // Update complete course
    return this.coursesService.updateCourse(id, updateCourseDto);
  }

  @Patch(':id')
  async partialUpdateCourse(@Param('id') id: string, @Body() partialUpdateDto: any) {
    // Partial update of course (title, modules, description)
    return this.coursesService.partialUpdateCourse(id, partialUpdateDto);
  }

  @Delete(':id')
  async deleteCourse(@Param('id') id: string) {
    // Soft delete - hide course (visible=false)
    return this.coursesService.deleteCourse(id);
  }

  // Course CRUD operations (must be after specific routes)
  @Get(':id')
  async getCourseById(@Param('id') id: string) {
    // Get specific course by ID
    return this.coursesService.getCourseById(id);
  }

  @Get(':id/enrollment-history')
  @UseGuards(JwtAuthGuard)
  async getEnrollmentHistory(@Request() req, @Param('id') courseId: string) {
    const teacherId = req.user.id;
    return this.coursesService.getEnrollmentHistory(courseId, teacherId);
  }

  @Get(':id/students/:studentId/enrollment-history')
  @UseGuards(JwtAuthGuard)
  async getStudentEnrollmentHistory(
    @Request() req, 
    @Param('id') courseId: string, 
    @Param('studentId') studentId: string
  ) {
    const teacherId = req.user.id;
    return this.coursesService.getStudentEnrollmentHistory(courseId, studentId, teacherId);
  }

  @Patch('exercises/:exerciseId/max-score')
  @UseGuards(JwtAuthGuard)
  async updateExerciseMaxScore(
    @Request() req,
    @Param('exerciseId') exerciseId: string,
    @Body() body: { maxScore: number }
  ) {
    const teacherId = req.user.id;
    return this.coursesService.updateExerciseMaxScore(exerciseId, body.maxScore, teacherId);
  }

  @Patch(':courseId/modules/:moduleId/status')
  @UseGuards(JwtAuthGuard)
  async updateModuleStatus(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() body: { status: 'active' | 'inactive' },
    @Request() req: any
  ) {
    const teacherId = req.user.id;
    return this.coursesService.updateModuleStatus(courseId, moduleId, body.status, teacherId);
  }

}
