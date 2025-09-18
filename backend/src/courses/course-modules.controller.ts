import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CourseModulesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('modules')
  @UseGuards(JwtAuthGuard)
  async getAllCourseModules(@Param() query: any) {
    return this.coursesService.getAllCourseModules(query);
  }

  @Post('modules')
  @UseGuards(JwtAuthGuard)
  async createCourseModule(@Body() createCourseModuleDto: any) {
    return this.coursesService.createCourseModule(createCourseModuleDto);
  }

  @Get('modules/:id')
  async getCourseModuleById(@Param('id') id: string) {
    return this.coursesService.getCourseModuleById(id);
  }

  @Put('modules/:id')
  async updateCourseModule(@Param('id') id: string, @Body() updateCourseModuleDto: any) {
    return this.coursesService.updateCourseModule(id, updateCourseModuleDto);
  }

  @Patch('modules/:id')
  async partialUpdateCourseModule(@Param('id') id: string, @Body() partialUpdateDto: any) {
    return this.coursesService.partialUpdateCourseModule(id, partialUpdateDto);
  }

  @Delete('modules/:id')
  async deleteCourseModule(@Param('id') id: string) {
    return this.coursesService.deleteCourseModule(id);
  }

  @Get(':id/modules')
  @UseGuards(JwtAuthGuard)
  async getCourseModules(@Request() req, @Param('id') courseId: string) {
    const teacherId = req.user.id;
    return this.coursesService.getCourseModules(courseId, teacherId);
  }

  @Get(':id/available-teacher-modules')
  @UseGuards(JwtAuthGuard)
  async getAvailableTeacherModulesForCourse(@Request() req, @Param('id') courseId: string) {
    const teacherId = req.user.id;
    return this.coursesService.getAvailableTeacherModulesForCourse(courseId, teacherId);
  }

  @Post(':id/add-teacher-module/:teacherModuleId')
  @UseGuards(JwtAuthGuard)
  async addTeacherModuleToCourse(
    @Request() req,
    @Param('id') courseId: string,
    @Param('teacherModuleId') teacherModuleId: string
  ) {
    const teacherId = req.user.id;
    return this.coursesService.addTeacherModuleToCourse(courseId, teacherModuleId, teacherId);
  }

  @Delete(':id/remove-teacher-module/:teacherModuleId')
  @UseGuards(JwtAuthGuard)
  async removeTeacherModuleFromCourse(
    @Request() req,
    @Param('id') courseId: string,
    @Param('teacherModuleId') teacherModuleId: string
  ) {
    const teacherId = req.user.id;
    return this.coursesService.removeTeacherModuleFromCourse(courseId, teacherModuleId, teacherId);
  }

  @Patch('modules/:id/reorder')
  @UseGuards(JwtAuthGuard)
  async reorderModule(
    @Param('id') id: string,
    @Body() body: { previousModuleId?: string | null; nextModuleId?: string | null },
    @Request() req: any
  ) {
    return this.coursesService.reorderModule(id, body.previousModuleId, body.nextModuleId, req.user.id);
  }

  @Patch(':courseId/modules/:id/reorder-by-index')
  @UseGuards(JwtAuthGuard)
  async reorderModuleByIndex(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Body() body: { targetIndex: number },
    @Request() req: any
  ) {
    return this.coursesService.reorderModuleByIndex(courseId, id, Number(body.targetIndex), req.user.id);
  }
}
