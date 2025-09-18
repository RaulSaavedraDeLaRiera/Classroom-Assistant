# Classroom Assistant

A full-stack web application for managing learning courses. The primary user is the Teacher, who can create courses from templates or custom content, organize modules and exercises, enroll students, monitor progress, send feedback, and communicate through an integrated chat and notifications system.

## Overview
- Backend: NestJS + Mongoose (MongoDB)
- Frontend: Next.js (React + TypeScript)
- Database: MongoDB
- Auth: JWT (configurable expiration via `JWT_EXPIRES_IN`)

Key domains:
- Templates (admin-curated base content)
- Teacher content (reusable modules/exercises)
- Courses (teacher-owned copies)
- Student personalization (student modules/exercises)

For technical details, see:
- Development and environment: `docs/development.md`
- Data model and relationships: `docs/schemas.md`
- Demo data scripts: `backend/scripts/README.md`
- Demo limitations and notes: `docs/read.md`

## Content Model and How It Works
The system is designed to make course creation fast, modular, and reusable.

- Templates
  - Admin or curator creates `TemplateCourse`, `TemplateModule`, and `TemplateExercise` as base content.
  - Templates are intended for the wider community and can be copied by teachers to bootstrap new courses quickly.

- Teacher Content
  - Teachers can create their own `TeacherModule` and `TeacherExercise` independent of templates.
  - This content is reusable across multiple courses and can be mixed with template content.

- Courses
  - A Course is a teacher-owned copy that references modules and exercises.
  - Courses contain Modules; Modules contain Exercises.
  - Modules can be connected via prerequisites and types (all/progress) to define pacing.

- Student Personalization
  - Students receive personalized `StudentModule` and `StudentExercise` copies derived from the course.
  - This enables targeted changes per student without altering the base course for others.

Diagram and fields: see `docs/schemas.md`.

## Why Templates
Templates let a community share high-quality, structured content (courses/modules/exercises) that any teacher can copy and adapt. A teacher can:
- Start from a `TemplateCourse` and adapt it.
- Compose modules and exercises from templates and teacher-created content.
- Reuse proven blocks across multiple courses to accelerate setup.

## Reuse and Fast Assembly
- Modules are self-contained units that can be reused across courses.
- Exercises are interchangeable inside modules.
- You can quickly assemble a course by combining existing modules, reordering, and adding your own exercises.

## Reordering and Personalization
- Course-level ordering
  - Reorder modules and exercises within a course to match the desired flow.
  - Add or remove modules and exercises at any point.

- Per-student ordering and content
  - For each student, you can customize the order of their exercises and even their content.
  - Add extra exercises for specific students or adjust difficulty.
  - This enables highly personalized learning paths, giving each student a unique experience.

## Impact of Edits
- Editing a module or exercise in a Course
  - Affects the course view for all enrolled students unless a student has a personalized override for that item.
  - Common use: fix instructions, change visibility, adjust difficulty or max score.

- Adding extra exercises for students
  - Only affects the targeted student’s `StudentModule` and `StudentExercise` copies.
  - The base Course remains unchanged for other students.

## Teacher Workflow Highlights
- Create a course from templates or teacher content.
- Add modules and exercises, set visibility, tags, difficulty, and scoring rules.
- Reorder modules/exercises; define prerequisites and module progression.
- Enroll students and track overall progress and scores.
- Personalize the experience by adding or adjusting exercises for specific students.
- Communicate via chat and receive notifications when students complete activities.

## Getting Started
For local development, environment variables, ports, and commands, see:
- `docs/development.md`

Essentials:
- Backend runs on `PORT` (default `3000`)
- Frontend runs on port `3001` (configured in `frontend/package.json` scripts)
- Frontend expects backend URL in `frontend/.env` as `NEXT_PUBLIC_API_URL`
- MongoDB default: `mongodb://localhost:27017/classroom_assistant`

## Demo Data and Scripts
To generate a demo environment with sample data (templates, users, courses, enrollments, etc.), use the scripts documented in:
- `backend/scripts/README.md`

Important notice about demo data:
- DEMO DATA IS ARTIFICIAL AND MAY HAVE INCOMPLETE RELATIONSHIPS; ERRORS CAN APPEAR THAT WOULD NOT OCCUR IN A CLEAN FROM-SCRATCH SETUP. IT IS PRIMARILY INTENDED FOR DEMONSTRATION PURPOSES.
- For stable development, prefer seeding a clean database from zero.
- In demo mode, initial course and student progress states may appear randomized to showcase variety. As soon as you grade or adjust exercises (e.g., score, mark as completed/visible), the student's progress is recalculated and reflects the real status for that course.

Additional context and limitations are described in:
- `docs/read.md`

## Tech Stack
- Backend: NestJS, Mongoose, Passport-JWT
- Frontend: Next.js (React), TypeScript, Tailwind CSS
- Database: MongoDB
- Testing (backend): Jest (see `backend/tests`)

## Configuration
Backend (`backend/.env`) recommended variables:
```
PORT=3000
MONGO_URI=mongodb://localhost:27017/classroom_assistant
JWT_SECRET=a-magic-secret-key
JWT_EXPIRES_IN=24h
```

Frontend (`frontend/.env`) recommended variables:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Scripts (Quick Reference)
- Backend
  - `npm install`
  - `npm run start:dev` (development)
  - `npm run build` (build)
- Frontend
  - `npm install`
  - `npm run dev` (development, configured to `-p 3001` in `package.json`)
  - `npm run build` (build)
- Backend tests
  - From `backend/tests`: `npm install` then `npm test`

## Limitations and Roadmap
- Student-side exercise solving and full progress tracking are not fully implemented yet.
- Some operations assume teacher workflows; student UX will be completed in future iterations.
- See `docs/read.md` for critical demo limitations and next steps.

---
This repository is intended to showcase the teacher-facing flows and the overall architecture for a classroom assistant, with clear documentation and a demo setup for quick exploration.

Provenance note: This is a clean, promoted project intended for portfolio and documentation purposes. The original project continued under a different account/repository with an active, non-public workflow. This public repository reflects a stable snapshot suitable for review and demonstration.
