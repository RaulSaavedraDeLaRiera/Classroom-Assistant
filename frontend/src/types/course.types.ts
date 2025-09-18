export interface Course {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  status: string;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  teacherId: string;
  maxStudents: number;
  // Additional fields for CourseView compatibility
  modules: string[];
  students: string[];
  estimatedTime: number;
}

export interface CourseModule {
  _id: string;
  title: string;
  description: string;
  estimatedTime: number;
  progress: number;
  content: {
    exercises: any[];
  };
  // Additional fields for CourseView compatibility
  courseId: string;
  teacherModuleId: string;
  visible: boolean;
  tags: string[];
  status: string;
  type: string;
  prerequisites: string[];
  previousModuleId: string | null;
  nextModuleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseExercise {
  _id: string;
  title: string;
  description?: string;
  type: string;
  difficulty: string;
  estimatedTime: number;
  status: string;
}

export interface CourseStats {
  courseId: string;
  courseTitle: string;
  modulesCount: number;
  totalExercises: number;
  enrolledStudents: number;
  maxStudents: number;
  courseStatus: string;
  progress?: number;
}

export interface Student {
  _id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  enrollmentId?: string;
}

export type ActiveTab = 'course' | 'overview' | 'students';

export type EnhancedActiveTab = 'modules' | 'students' | 'notifications' | 'data';

export interface StudentExercise {
  _id: string;
  title: string;
  description?: string;
  content?: string;
  type: string;
  studentModuleId: string;
  courseExerciseId: string;
  studentId: string;
  status: string;
  score?: number;
  maxScore: number;
  feedback?: string;
  timeSpent?: number;
  completedAt?: string;
  startedAt?: string;
  lastActivityAt?: string;
  attempts: number;
  bestScore: number;
  scores: Array<{ score: number; timestamp: string }>;
}

export interface StudentModule {
  _id: string;
  title: string;
  description?: string;
  courseId: string;
  courseModuleId: string;
  studentId: string;
  status: string;
  progress: number;
  startedAt?: string;
  lastActivityAt?: string;
}
