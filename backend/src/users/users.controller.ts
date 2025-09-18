import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // get all users with optional filters and pagination
  @Get()
  async getAllUsers(@Query() query: any) {
    return this.usersService.getAllUsers(query);
  }

  // get teachers with course and student counts
  @Get('teachers/stats')
  async getTeachersStats() {
    return this.usersService.getTeachersStats();
  }

  // get students with teacher and course info
  @Get('students/stats')
  async getStudentsStats() {
    return this.usersService.getStudentsStats();
  }

  // get students by teacher ID
  @Get('teacher/:teacherId/students')
  async getStudentsByTeacher(@Param('teacherId') teacherId: string) {
    return this.usersService.getStudentsByTeacher(teacherId);
  }

  // get student by ID
  @Get('students/:studentId')
  async getStudentById(@Param('studentId') studentId: string) {
    return this.usersService.getStudentById(studentId);
  }

  // create new student and associate with teacher
  @Post('teacher/:teacherId/students')
  async createStudentWithTeacher(
    @Param('teacherId') teacherId: string,
    @Body() createStudentDto: any
  ) {
    return this.usersService.createStudentWithTeacher(createStudentDto, teacherId);
  }

  @Delete('teacher/:teacherId/students/:studentId')
  async removeStudentFromTeacher(
    @Param('teacherId') teacherId: string,
    @Param('studentId') studentId: string
  ) {
    return this.usersService.removeStudentFromTeacher(studentId, teacherId);
  }

  // create new user
  @Post()
  async createUser(@Body() createUserDto: any) {
    return this.usersService.createUser(createUserDto);
  }

  // get user by id
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  // get user details with related data
  @Get(':id/details')
  async getUserDetails(@Param('id') id: string) {
    return this.usersService.getUserDetails(id);
  }

  // update user completely
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  // partial update of user
  @Patch(':id')
  async partialUpdateUser(@Param('id') id: string, @Body() partialUpdateDto: any) {
    return this.usersService.partialUpdateUser(id, partialUpdateDto);
  }

  // update only user role
  @Patch(':id/role')
  async updateUserRole(@Param('id') id: string, @Body() roleUpdateDto: any) {
    return this.usersService.updateUserRole(id, roleUpdateDto);
  }

  // delete or deactivate user
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
