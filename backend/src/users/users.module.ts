import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Course, CourseSchema } from '../courses/schemas/course.schema';
import { StudentModule, StudentModuleSchema } from '../students/schemas/student-module.schema';
import { CourseEnrollment, CourseEnrollmentSchema } from '../courses/schemas/course-enrollment.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema },
      { name: StudentModule.name, schema: StudentModuleSchema },
      { name: CourseEnrollment.name, schema: CourseEnrollmentSchema }
    ])
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule]
})
export class UsersModule {}
