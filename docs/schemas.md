# MongoDB Schemas Documentation

## System Architecture

```
Templates (fijos, admin) 
    ↓ copia
Teacher Modules/Exercises (reutilizables, profesor)
    ↓ copia
Courses (profesor, inmutable)
    ↓ base + personalizaciones
Student Modules/Exercises (acumulativo, dinámico)
```

## Template Entities (Base Structure)

### TemplateCourse
Plantilla base para cursos que los profesores pueden copiar y personalizar.

**Colección:** `template_courses`

**Campos:**
- `title`: Título del curso (requerido, string)
- `description`: Descripción del curso (requerido, string)
- `visible`: Bandera de visibilidad (boolean, default: true)
- `tags`: Array de etiquetas para categorización (string[], default: [])
- `estimatedDuration`: Duración estimada en horas (number, default: 0)
- `isPublic`: Si el template es público (boolean, default: false)
- `content`: Contenido del template con módulos (object, default: { modules: [] })
- `createdAt`, `updatedAt`: Timestamps automáticos

### TemplateModule
Módulos de plantilla que pertenecen a un template de curso.

**Colección:** `template_modules`

**Campos:**
- `title`: Título del módulo (requerido, string)
- `description`: Descripción del módulo (requerido, string)
- `templateCourseId`: Referencia al template de curso padre (ObjectId, opcional)
- `visible`: Bandera de visibilidad (boolean, default: true)
- `tags`: Array de etiquetas (string[], default: [])
- `estimatedTime`: Tiempo estimado en minutos (number)
- `status`: Estado del módulo (string, default: 'active')
- `type`: Tipo de módulo (enum: 'all', 'progress', default: 'all')
- `prerequisites`: Array de módulos prerequisitos (ObjectId[], default: [])
- `content`: Contenido con ejercicios (object, default: { exercises: [] })
- `createdAt`, `updatedAt`: Timestamps automáticos

### TemplateExercise
Ejercicios de plantilla que pertenecen a un módulo de plantilla.

**Colección:** `template_exercises`

**Campos:**
- `title`: Título del ejercicio (requerido, string)
- `description`: Descripción del ejercicio (string)
- `content`: Contenido/instrucciones del ejercicio (requerido, string)
- `type`: Tipo de ejercicio (enum: 'quiz', 'writing', 'reading', 'listening', 'speaking', 'grammar', 'vocabulary', 'assignment', 'project', 'discussion', 'presentation')
- `templateModuleId`: Referencia al módulo de plantilla padre (ObjectId, opcional)
- `visible`: Bandera de visibilidad (boolean, default: true)
- `tags`: Array de etiquetas (string[], default: [])
- `estimatedTime`: Tiempo estimado en minutos (number)
- `difficulty`: Nivel de dificultad (enum: 'beginner', 'intermediate', 'advanced', default: 'intermediate')
- `estimatedScore`: Puntuación estimada (number, min: 0, max: 100)
- `metadata`: Objeto flexible para datos específicos del ejercicio (object)
- `createdAt`, `updatedAt`: Timestamps automáticos

## Teacher Entities (Reusable Content)

### TeacherModule
Módulos reutilizables creados por profesores que pueden usarse en múltiples cursos.

**Colección:** `teacher_modules`

**Campos:**
- `title`: Título del módulo (requerido, string)
- `description`: Descripción del módulo (string)
- `teacherId`: Referencia al usuario profesor (requerido, ObjectId)
- `templateModuleId`: Referencia al módulo de plantilla base (ObjectId, opcional)
- `visible`: Bandera de visibilidad (boolean, default: true)
- `tags`: Array de etiquetas (string[], default: [])
- `estimatedTime`: Tiempo estimado en minutos (requerido, number, default: 0)
- `status`: Estado del módulo (string, default: 'active')
- `type`: Tipo de módulo (enum: 'all', 'progress', default: 'all')
- `prerequisites`: Array de módulos prerequisitos (ObjectId[], default: [])
- `isReusable`: Si puede ser reutilizado en múltiples cursos (boolean, default: true)
- `usageCount`: Cuántos cursos lo usan (number, default: 0)
- `content`: Contenido con ejercicios (object, default: { exercises: [] })
- `createdAt`, `updatedAt`: Timestamps automáticos

### TeacherExercise
Ejercicios reutilizables creados por profesores que pueden usarse en múltiples módulos.

**Colección:** `teacher_exercises`

**Campos:**
- `title`: Título del ejercicio (requerido, string)
- `description`: Descripción del ejercicio (string)
- `content`: Contenido/instrucciones del ejercicio (requerido, string)
- `type`: Tipo de ejercicio (enum: 'quiz', 'writing', 'reading', 'listening', 'speaking', 'grammar', 'vocabulary')
- `teacherModuleId`: Referencia al módulo de profesor (ObjectId, opcional)
- `templateExerciseId`: Referencia al ejercicio de plantilla base (ObjectId, opcional)
- `teacherId`: Referencia al usuario profesor (requerido, ObjectId)
- `visible`: Bandera de visibilidad (boolean, default: true)
- `tags`: Array de etiquetas (string[], default: [])
- `estimatedTime`: Tiempo estimado en minutos (number)
- `difficulty`: Nivel de dificultad (enum: 'beginner', 'intermediate', 'advanced', default: 'intermediate')
- `metadata`: Objeto flexible para datos específicos (object)
- `status`: Estado del ejercicio (string, default: 'active')
- `isReusable`: Si puede ser reutilizado en múltiples módulos (boolean, default: true)
- `usageCount`: Cuántos módulos lo usan (number, default: 0)
- `createdAt`, `updatedAt`: Timestamps automáticos

## Course Entities (Teacher's Version)

### Course
Copia del profesor de un template de curso (inmutable una vez creado).

**Colección:** `courses`

**Campos:**
- `title`: Título del curso (requerido, string)
- `description`: Descripción del curso (requerido, string)
- `teacherId`: Referencia al usuario profesor (requerido, ObjectId)
- `templateCourseId`: Referencia al template base (ObjectId, opcional)
- `modules`: Array de IDs de módulos (ObjectId[], default: [])
- `students`: Lista de estudiantes inscritos (ObjectId[], default: [])
- `visible`: Bandera de visibilidad (boolean, default: true)
- `tags`: Array de etiquetas (string[], default: [])
- `estimatedTime`: Tiempo estimado en horas (number, default: 0)
- `status`: Estado del curso (string, default: 'active')
- `maxStudents`: Máximo número de estudiantes (number, default: 50)
- `publishedAt`: Fecha de publicación (Date)
- `createdAt`, `updatedAt`: Timestamps automáticos

### CourseModule
Copia del profesor de un módulo de plantilla dentro de un curso.

**Colección:** `course_modules`

**Campos:**
- `title`: Título del módulo (requerido, string)
- `description`: Descripción del módulo (string)
- `courseId`: Referencia al curso padre (requerido, ObjectId)
- `templateModuleId`: Referencia al módulo de plantilla base (ObjectId, opcional)
- `teacherModuleId`: Referencia al módulo de profesor (ObjectId, opcional)
- `previousModuleId`: Referencia al módulo anterior (ObjectId, opcional)
- `nextModuleId`: Referencia al módulo siguiente (ObjectId, opcional)
- `visible`: Bandera de visibilidad (boolean, default: true)
- `tags`: Array de etiquetas (string[], default: [])
- `estimatedTime`: Tiempo estimado en minutos (number)
- `progress`: Progreso del módulo (number, default: 0)
- `type`: Tipo de módulo (enum: 'all', 'progress', default: 'all')
- `status`: Estado del módulo (enum: 'active', 'inactive', default: 'inactive')
- `prerequisites`: Array de módulos prerequisitos (ObjectId[], default: [])
- `content`: Contenido con ejercicios (object, default: { exercises: [] })
- `createdAt`, `updatedAt`: Timestamps automáticos

### CourseExercise
Copia del profesor de un ejercicio de plantilla dentro de un módulo de curso.

**Colección:** `course_exercises`

**Campos:**
- `title`: Título del ejercicio (requerido, string)
- `description`: Descripción del ejercicio (string)
- `content`: Contenido/instrucciones del ejercicio (requerido, string)
- `type`: Tipo de ejercicio (enum: 'quiz', 'writing', 'reading', 'listening', 'speaking', 'grammar', 'vocabulary')
- `courseModuleId`: Referencia al módulo de curso padre (requerido, ObjectId)
- `templateExerciseId`: Referencia al ejercicio de plantilla base (ObjectId, opcional)
- `teacherExerciseId`: Referencia al ejercicio de profesor (ObjectId, opcional)
- `previousExerciseId`: Referencia al ejercicio anterior (ObjectId, opcional)
- `nextExerciseId`: Referencia al ejercicio siguiente (ObjectId, opcional)
- `visible`: Bandera de visibilidad (boolean, default: true)
- `tags`: Array de etiquetas (string[], default: [])
- `estimatedTime`: Tiempo estimado en minutos (number)
- `maxScore`: Puntuación máxima (number, min: 1, default: 10)
- `difficulty`: Nivel de dificultad (enum: 'beginner', 'intermediate', 'advanced', default: 'intermediate')
- `metadata`: Objeto flexible para datos específicos (object)
- `status`: Estado del ejercicio (string, default: 'active')
- `createdAt`, `updatedAt`: Timestamps automáticos

## Student Entities (Personalized Content)

### StudentModule
Módulo personalizado del estudiante (módulo de curso base + personalizaciones).

**Colección:** `student_modules`

**Campos:**
- `title`: Título del módulo (requerido, string)
- `description`: Descripción del módulo (string)
- `courseId`: Referencia al curso padre (requerido, ObjectId)
- `courseModuleId`: Referencia al módulo de curso base (requerido, ObjectId)
- `studentId`: Referencia al usuario estudiante (requerido, ObjectId)
- `previousModuleId`: Referencia al módulo anterior (ObjectId, opcional)
- `nextModuleId`: Referencia al módulo siguiente (ObjectId, opcional)
- `order`: Orden de visualización (requerido, number, default: 0)
- `visible`: Bandera de visibilidad (boolean, default: true)
- `tags`: Array de etiquetas (string[], default: [])
- `status`: Estado del módulo (string, default: 'active')
- `progress`: Progreso de finalización (number, default: 0)
- `studentExerciseIds`: Array de referencias a ejercicios del estudiante (ObjectId[], default: [])
- `type`: Tipo de módulo (enum: 'all', 'progress', default: 'all')
- `startedAt`: Fecha de inicio (Date)
- `lastActivityAt`: Última actividad (Date)
- `createdAt`, `updatedAt`: Timestamps automáticos

### StudentExercise
Ejercicio personalizado del estudiante con seguimiento de progreso.

**Colección:** `student_exercises`

**Campos:**
- `title`: Título del ejercicio (requerido, string)
- `description`: Descripción del ejercicio (string)
- `content`: Contenido/instrucciones del ejercicio (string)
- `type`: Tipo de ejercicio (requerido, string)
- `studentModuleId`: Referencia al módulo del estudiante padre (requerido, ObjectId)
- `courseExerciseId`: Referencia al ejercicio de curso base (ObjectId, opcional)
- `teacherExerciseId`: Referencia al ejercicio de profesor (ObjectId, opcional)
- `templateExerciseId`: Referencia al ejercicio de plantilla (ObjectId, opcional)
- `studentId`: Referencia al usuario estudiante (requerido, ObjectId)
- `courseId`: Referencia al curso (ObjectId, opcional)
- `teacherId`: Referencia al profesor (ObjectId, opcional)
- `previousExerciseId`: Referencia al ejercicio anterior (ObjectId, opcional)
- `nextExerciseId`: Referencia al ejercicio siguiente (ObjectId, opcional)
- `visible`: Bandera de visibilidad (boolean, default: true)
- `tags`: Array de etiquetas (string[], default: [])
- `status`: Estado del ejercicio (enum: 'pending', 'ready', 'in_progress', 'completed', 'reviewed', 'blocked', default: 'pending')
- `score`: Puntuación de finalización (number, min: 0, max: 100)
- `maxScore`: Puntuación máxima (number, min: 1, default: 10)
- `estimatedTime`: Tiempo estimado en minutos (number, default: 0)
- `difficulty`: Nivel de dificultad (string, default: 'intermediate')
- `feedback`: Retroalimentación del profesor (string)
- `timeSpent`: Tiempo dedicado al ejercicio en minutos (number)
- `metadata`: Objeto flexible para datos específicos (object)
- `completedAt`: Timestamp de finalización (Date)
- `attempts`: Número de intentos (number, default: 0)
- `bestScore`: Mejor puntuación (number, min: 0, max: 100, default: 0)
- `scores`: Array de puntuaciones históricas (Array<{score: number, timestamp: Date}>, default: [])
- `startedAt`: Fecha de inicio (Date)
- `lastActivityAt`: Última actividad (Date)
- `createdAt`, `updatedAt`: Timestamps automáticos

## User Entities

### User
Usuarios del sistema con control de acceso basado en roles.

**Colección:** `users`

**Campos:**
- `name`: Nombre completo del usuario (requerido, string)
- `email`: Dirección de email única (requerido, string, unique)
- `password`: Contraseña encriptada (requerido, string)
- `role`: Rol del usuario (enum: 'student', 'teacher', 'admin', default: 'student')
- `active`: Estado de la cuenta (boolean, default: true)
- `visible`: Bandera de visibilidad (boolean, default: true)
- `tags`: Array de etiquetas del usuario (string[], default: [])
- `teacherIds`: Array de profesores relacionados con este estudiante (ObjectId[], default: [])
- `profile`: Objeto flexible para datos adicionales del perfil (object, default: {})
- `lastLoginAt`: Timestamp del último login (Date)
- `createdAt`, `updatedAt`: Timestamps automáticos

## Enrollment Entities

### CourseEnrollment
Inscripción de un estudiante en un curso con seguimiento de progreso.

**Colección:** `course_enrollments`

**Campos:**
- `courseId`: Referencia al curso (requerido, ObjectId)
- `studentId`: Referencia al estudiante (requerido, ObjectId)
- `teacherId`: Referencia al profesor (requerido, ObjectId)
- `status`: Estado de la inscripción (string, default: 'active')
- `enrolledAt`: Fecha de inscripción (Date, default: Date.now)
- `completedAt`: Fecha de finalización (Date)
- `endedAt`: Fecha de finalización de la inscripción (Date)
- `previousEnrollmentId`: Referencia a inscripción anterior (ObjectId, opcional)
- `progress`: Progreso general (number, default: 0)
- `totalExercises`: Total de ejercicios (number, default: 0)
- `completedExercises`: Ejercicios completados (number, default: 0)
- `totalModules`: Total de módulos (number, default: 0)
- `completedModules`: Módulos completados (number, default: 0)
- `averageScore`: Puntuación promedio (number, default: 0)
- `totalPoints`: Puntos totales (number, default: 0)
- `earnedPoints`: Puntos ganados (number, default: 0)
- `exerciseScores`: Array de puntuaciones de ejercicios (number[], default: [])
- `completedExerciseIds`: IDs de ejercicios completados (ObjectId[], default: [])
- `completedModuleIds`: IDs de módulos completados (ObjectId[], default: [])
- `visible`: Bandera de visibilidad (boolean, default: true)
- `notes`: Notas adicionales (string)
- `createdAt`, `updatedAt`: Timestamps automáticos

## Communication Entities

### Chat
Conversación entre profesor y estudiante en un curso específico.

**Colección:** `chats`

**Campos:**
- `teacherId`: Referencia al profesor (requerido, ObjectId)
- `studentId`: Referencia al estudiante (requerido, ObjectId)
- `courseId`: Referencia al curso (requerido, ObjectId)
- `enrollmentId`: Referencia a la inscripción (requerido, ObjectId)
- `active`: Si el chat está activo (boolean, default: true)
- `lastMessageAt`: Fecha del último mensaje (Date)
- `lastMessage`: Contenido del último mensaje (string)
- `lastMessageBy`: Quien envió el último mensaje (ObjectId)
- `createdAt`, `updatedAt`: Timestamps automáticos

### ChatMessage
Mensaje individual en una conversación.

**Colección:** `chat_messages`

**Campos:**
- `chatId`: Referencia al chat (requerido, ObjectId)
- `senderId`: Referencia al remitente (requerido, ObjectId)
- `message`: Contenido del mensaje (requerido, string)
- `isRead`: Si el mensaje ha sido leído (boolean, default: false)
- `readAt`: Fecha de lectura (Date)
- `type`: Tipo de mensaje (string, default: 'text')
- `metadata`: Metadatos adicionales (object)
- `createdAt`, `updatedAt`: Timestamps automáticos

### Notification
Notificación del sistema para profesores.

**Colección:** `notifications`

**Campos:**
- `teacherId`: Referencia al profesor (requerido, ObjectId)
- `studentId`: Referencia al estudiante (requerido, ObjectId)
- `courseId`: Referencia al curso (requerido, ObjectId)
- `enrollmentId`: Referencia a la inscripción (requerido, ObjectId)
- `type`: Tipo de notificación (enum: 'exercise_completed', 'message_received', requerido)
- `title`: Título de la notificación (requerido, string)
- `message`: Mensaje de la notificación (requerido, string)
- `isRead`: Si la notificación ha sido leída (boolean, default: false)
- `readAt`: Fecha de lectura (Date)
- `metadata`: Datos adicionales específicos del tipo (object)
- `priority`: Prioridad de la notificación (number, default: 1)
- `createdAt`, `updatedAt`: Timestamps automáticos

## Exercise Types
- `quiz`: Preguntas de opción múltiple
- `writing`: Ejercicios de escritura
- `reading`: Comprensión lectora
- `listening`: Ejercicios de audio
- `speaking`: Práctica de habla
- `grammar`: Ejercicios de gramática
- `vocabulary`: Práctica de vocabulario
- `assignment`: Tareas
- `project`: Proyectos
- `discussion`: Discusiones
- `presentation`: Presentaciones

## Relationships
```
TemplateCourse (1) → (N) TemplateModule (1) → (N) TemplateExercise
    ↓ (copy)
TeacherModule (1) → (N) TeacherExercise
    ↓ (copy)
Course (1) → (N) CourseModule (1) → (N) CourseExercise
    ↓ (personalize)
StudentModule (1) → (N) StudentExercise

Course (1) → (N) CourseEnrollment (N) ← (1) User
CourseEnrollment (1) → (1) Chat (1) → (N) ChatMessage
CourseEnrollment (1) → (N) Notification
```

## Status Values
- **Course/Module/Exercise**: `active`, `archived`, `draft`
- **Student Exercise**: `pending`, `ready`, `in_progress`, `completed`, `reviewed`, `blocked`
- **CourseEnrollment**: `active`, `completed`, `dropped`, `suspended`, `historical`, `removed`
- **User**: `active` (boolean)
- **Chat**: `active` (boolean)
- **Notification**: `isRead` (boolean)
