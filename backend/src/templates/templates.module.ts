import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplateCourse, TemplateCourseSchema } from './schemas/template-course.schema';
import { TemplateModule, TemplateModuleSchema } from './schemas/template-module.schema';
import { TemplateExercise, TemplateExerciseSchema } from './schemas/template-exercise.schema';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  imports: [
    // Register MongoDB schemas for template entities
    MongooseModule.forFeature([
      { name: TemplateCourse.name, schema: TemplateCourseSchema },
      { name: TemplateModule.name, schema: TemplateModuleSchema },
      { name: TemplateExercise.name, schema: TemplateExerciseSchema },
    ]),
  ],
  controllers: [TemplatesController], // Template management endpoints
  providers: [TemplatesService], // Template business logic
  exports: [MongooseModule, TemplatesService], // Export for other modules
})
export class TemplatesModule {}
