import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentModule, StudentModuleSchema } from './schemas/student-module.schema';
import { StudentExercise, StudentExerciseSchema } from './schemas/student-exercise.schema';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentModule.name, schema: StudentModuleSchema },
      { name: StudentExercise.name, schema: StudentExerciseSchema },
    ]),
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [MongooseModule, StudentsService],
})
export class StudentsModule {}
