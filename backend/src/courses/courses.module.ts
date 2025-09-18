import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from './schemas/course.schema';
import { CourseModule, CourseModuleSchema } from './schemas/course-module.schema';
import { CourseExercise, CourseExerciseSchema } from './schemas/course-exercise.schema';
import { CourseEnrollment, CourseEnrollmentSchema } from './schemas/course-enrollment.schema';
import { TeacherModule, TeacherModuleSchema } from '../teachers/schemas/teacher-module.schema';
import { TeacherExercise, TeacherExerciseSchema } from '../teachers/schemas/teacher-exercise.schema';
import { TemplateModule, TemplateModuleSchema } from '../templates/schemas/template-module.schema';
import { TemplateExercise, TemplateExerciseSchema } from '../templates/schemas/template-exercise.schema';
import { StudentModule, StudentModuleSchema } from '../students/schemas/student-module.schema';
import { StudentExercise, StudentExerciseSchema } from '../students/schemas/student-exercise.schema';
import { UsersModule } from '../users/users.module';
import { TemplatesModule } from '../templates/templates.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CoursesController } from './courses.controller';
import { CourseModulesController } from './course-modules.controller';
import { CourseExercisesController } from './course-exercises.controller';
import { EnrollmentsController } from './enrollments.controller';
import { StudentExercisesController } from './student-exercises.controller';
import { CoursesService } from './courses.service';
import { CourseManagementService } from './course-management.service';
import { CourseEnrollmentService } from './course-enrollment.service';
import { CourseContentService } from './course-content.service';
import { CourseModuleService } from './course-module.service';
import { CourseExerciseService } from './course-exercise.service';
import { StudentSyncService } from './student-sync.service';
import { OrderService } from './order.service';
import { ProgressTrackingService } from './progress-tracking.service';
import { CourseAccessService } from './course-access.service';
import { LinkedListService } from './linked-list.service';
import { StudentExerciseManagementService } from './enrollment/student-exercise-management.service';
import { StudentStatisticsService } from './enrollment/student-statistics.service';
import { EnrollmentHistoryService } from './enrollment/enrollment-history.service';
import { CourseContentCopyService } from './content/course-content-copy.service';
import { ModuleOrderService } from './order/module-order.service';
import { ExerciseOrderService } from './order/exercise-order.service';
import { StudentOrderService } from './order/student-order.service';

@Module({
  imports: [
    // Import UsersModule to access UserModel
    UsersModule,
    // Import TemplatesModule to access template models
    TemplatesModule,
    // Import NotificationsModule to access NotificationsService
    NotificationsModule,
    // Register MongoDB schemas for course entities
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: CourseModule.name, schema: CourseModuleSchema },
      { name: CourseExercise.name, schema: CourseExerciseSchema },
      { name: CourseEnrollment.name, schema: CourseEnrollmentSchema },
      { name: TeacherModule.name, schema: TeacherModuleSchema },
      { name: TeacherExercise.name, schema: TeacherExerciseSchema },
      { name: TemplateModule.name, schema: TemplateModuleSchema },
      { name: TemplateExercise.name, schema: TemplateExerciseSchema },
      { name: StudentModule.name, schema: StudentModuleSchema },
      { name: StudentExercise.name, schema: StudentExerciseSchema },
    ]),
  ],
  controllers: [
    CoursesController,
    CourseModulesController,
    CourseExercisesController,
    EnrollmentsController,
    StudentExercisesController
  ], // Course management endpoints
  providers: [
    CoursesService,
    CourseManagementService,
    CourseEnrollmentService,
    CourseContentService,
    CourseModuleService,
    CourseExerciseService,
    StudentSyncService,
    OrderService,
    ProgressTrackingService,
    CourseAccessService,
    LinkedListService,
    StudentExerciseManagementService,
    StudentStatisticsService,
    EnrollmentHistoryService,
    CourseContentCopyService,
    ModuleOrderService,
    ExerciseOrderService,
    StudentOrderService
  ], // Course business logic services
  exports: [MongooseModule, CoursesService], // Export for other modules
})
export class CoursesModule {}
