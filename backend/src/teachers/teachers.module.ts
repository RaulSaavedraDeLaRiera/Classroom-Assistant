import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { TeacherModule, TeacherModuleSchema } from './schemas/teacher-module.schema';
import { TeacherExercise, TeacherExerciseSchema } from './schemas/teacher-exercise.schema';
import { TemplateModule, TemplateModuleSchema } from '../templates/schemas/template-module.schema';
import { TemplateExercise, TemplateExerciseSchema } from '../templates/schemas/template-exercise.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TeacherModule.name, schema: TeacherModuleSchema },
      { name: TeacherExercise.name, schema: TeacherExerciseSchema },
      { name: TemplateModule.name, schema: TemplateModuleSchema },
      { name: TemplateExercise.name, schema: TemplateExerciseSchema }
    ])
  ],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService]
})
export class TeachersModule {}
