import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request
} from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('teachers')
@UseGuards(JwtAuthGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  // Teacher Modules
  @Get('modules')
  async getTeacherModules(@Request() req, @Query() query: any) {
    const teacherId = req.user.id;
    return this.teachersService.getTeacherModules(teacherId, query);
  }

  @Post('modules')
  async createTeacherModule(@Request() req, @Body() createModuleDto: any) {
    const teacherId = req.user.id;
    return this.teachersService.createTeacherModule({
      ...createModuleDto,
      teacherId
    });
  }

  @Get('modules/:id')
  async getTeacherModuleById(@Request() req, @Param('id') id: string) {
    const teacherId = req.user.id;
    return this.teachersService.getTeacherModuleById(id, teacherId);
  }

  @Put('modules/:id')
  async updateTeacherModule(
    @Request() req,
    @Param('id') id: string,
    @Body() updateModuleDto: any
  ) {
    const teacherId = req.user.id;
    return this.teachersService.updateTeacherModule(id, teacherId, updateModuleDto);
  }

  @Delete('modules/:id')
  async deleteTeacherModule(@Request() req, @Param('id') id: string) {
    const teacherId = req.user.id;
    return this.teachersService.deleteTeacherModule(id, teacherId);
  }

  @Post('modules/copy-from-template/:templateId')
  async copyFromTemplateModule(
    @Request() req,
    @Param('templateId') templateId: string
  ) {
    const teacherId = req.user.id;
    return this.teachersService.copyFromTemplateModule(templateId, teacherId);
  }

  @Get('templates/modules')
  async getPublicTemplateModules(@Request() req, @Query() query: any) {
    return this.teachersService.getPublicTemplateModules(query);
  }

  @Get('templates/exercises')
  async getPublicTemplateExercises(@Request() req, @Query() query: any) {
    return this.teachersService.getPublicTemplateExercises(query);
  }

  // Teacher Exercises
  @Get('exercises')
  async getTeacherExercises(@Request() req, @Query() query: any) {
    const teacherId = req.user.id;
    return this.teachersService.getTeacherExercises(teacherId, query);
  }

  @Post('exercises')
  async createTeacherExercise(@Request() req, @Body() createExerciseDto: any) {
    const teacherId = req.user.id;
    return this.teachersService.createTeacherExercise({
      ...createExerciseDto,
      teacherId
    });
  }

  @Get('exercises/:id')
  async getTeacherExerciseById(@Request() req, @Param('id') id: string) {
    const teacherId = req.user.id;
    return this.teachersService.getTeacherExerciseById(id, teacherId);
  }

  @Put('exercises/:id')
  async updateTeacherExercise(
    @Request() req,
    @Param('id') id: string,
    @Body() updateExerciseDto: any
  ) {
    const teacherId = req.user.id;
    return this.teachersService.updateTeacherExercise(id, teacherId, updateExerciseDto);
  }

  @Delete('exercises/:id')
  async deleteTeacherExercise(@Request() req, @Param('id') id: string) {
    const teacherId = req.user.id;
    return this.teachersService.deleteTeacherExercise(id, teacherId);
  }

  @Post('exercises/copy-from-template/:templateId')
  async copyFromTemplateExercise(
    @Request() req,
    @Param('templateId') templateId: string,
    @Body() body: { teacherModuleId?: string }
  ) {
    const teacherId = req.user.id;
    return this.teachersService.copyFromTemplateExercise(
      templateId, 
      teacherId, 
      body.teacherModuleId
    );
  }

  // Teacher Stats
  @Get('stats')
  async getTeacherStats(@Request() req) {
    const teacherId = req.user.id;
    return this.teachersService.getTeacherStats(teacherId);
  }

  // Course integration endpoints
  @Get('modules/for-course')
  async getModulesForCourse(@Request() req, @Query('courseId') courseId?: string) {
    const teacherId = req.user.id;
    return this.teachersService.getModulesForCourse(teacherId, courseId);
  }

  @Post('modules/:moduleId/add-to-course/:courseId')
  async addModuleToCourse(
    @Request() req,
    @Param('moduleId') moduleId: string,
    @Param('courseId') courseId: string
  ) {
    const teacherId = req.user.id;
    return this.teachersService.addModuleToCourse(moduleId, courseId, teacherId);
  }

  @Delete('modules/:moduleId/remove-from-course/:courseId')
  async removeModuleFromCourse(
    @Request() req,
    @Param('moduleId') moduleId: string,
    @Param('courseId') courseId: string
  ) {
    const teacherId = req.user.id;
    return this.teachersService.removeModuleFromCourse(moduleId, courseId, teacherId);
  }
}
