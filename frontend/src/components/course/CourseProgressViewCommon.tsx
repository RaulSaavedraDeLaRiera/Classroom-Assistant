import React from 'react';
import { CheckCircle, Play, Timer } from 'lucide-react';

// Common interfaces
export interface Exercise {
  _id: string;
  title: string;
  status: 'pending' | 'completed' | 'in_progress' | 'reviewed';
  score?: number;
  maxScore?: number;
  completedAt?: string;
  estimatedTime?: number;
  courseModuleId?: string;
  studentModuleId?: string;
}

export interface Module {
  _id: string;
  title: string;
  description: string;
  estimatedTime: number;
  status: string;
  exercises?: Exercise[];
  content?: {
    exercises: Exercise[];
  };
  order?: number;
  previousModuleId?: string | null;
  nextModuleId?: string | null;
  createdAt?: string;
}

export interface Student {
  _id: string;
  name: string;
  email: string;
  enrollmentId?: string;
  progress?: number;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  maxStudents: number;
  estimatedTime: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgressViewProps {
  course: Course;
  modules: Module[];
  courseExercises: Exercise[];
  students: Student[];
  selectedStudentId: string | null;
  selectedModuleId?: string | null;
  onStudentSelect: (studentId: string | null) => void;
  onModuleClick?: (moduleId: string) => void;
  onExerciseClick?: (exerciseId: string) => void;
  onModuleStatusChange?: (moduleId: string, status: 'active' | 'inactive') => void;
  onExerciseStatusChange?: (exerciseId: string, status: string) => void;
  onExerciseCompletionChange?: (exerciseId: string, completed: boolean, score?: number) => void;
  onMoveModule?: (moduleId: string, direction: 'up' | 'down') => void;
  onMoveExercise?: (exerciseId: string, direction: 'up' | 'down', moduleId: string) => void;
  expandedModules?: Set<string>;
  expandedExercises?: Set<string>;
  onToggleModule?: (moduleId: string) => void;
  onToggleExercises?: (moduleId: string) => void;
  onExpandModule?: (moduleId: string) => void;
  onEditModule?: (module: Module) => void;
  onDeleteModule?: (moduleId: string) => void;
  onViewExercise?: (exerciseId: string) => void;
  onEditExercise?: (exercise: any) => void;
  onDownloadExercise?: (exerciseId: string) => void;
  onDeleteExercise?: (exerciseId: string, courseId?: string, selectedStudentId?: string, moduleId?: string) => void;
  onCompleteExercise?: (exerciseId: string) => void;
  onCorrectExercise?: (exerciseId: string, newScore: number) => void;
  onChangeScoreExercise?: (exerciseId: string, newScore: number) => void;
  onAddModule?: () => void;
  onAddExercise?: (moduleId: string) => void;
}

// Utilidades comunes
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'reviewed':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'in_progress':
      return <Play className="w-4 h-4" />;
    case 'reviewed':
      return <CheckCircle className="w-4 h-4" />;
    default:
      return <Timer className="w-4 h-4" />;
  }
};

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  React.useEffect(() => {
    const checkIsMobile = () => {
      const newIsMobile = window.innerWidth < 1024;
      setIsMobile(newIsMobile);
    };

    if (typeof window !== 'undefined') {
      checkIsMobile();
      window.addEventListener('resize', checkIsMobile);
      
      return () => window.removeEventListener('resize', checkIsMobile);
    }
  }, []);

  return isMobile;
};

// Get ordered exercises using a linked list
export const getOrderedExercises = (moduleId: string, courseExercises: Exercise[], selectedStudentId: string | null, studentData?: { exercises: Exercise[] }): Exercise[] => {
  // Filter exercises for this module
  let moduleExercises;

  if (selectedStudentId && studentData) {
    // When a student is selected, rely ONLY on the student's exercises for this module
    // to avoid mixing with course exercises that can break the linked-list order
    moduleExercises = studentData.exercises.filter(ex => ex && (ex as any).studentModuleId === moduleId);
  } else {
    // When no student selected, filter by courseModuleId
    moduleExercises = courseExercises.filter(ex => ex && ex.courseModuleId === moduleId);
  }

  if (moduleExercises.length === 0) {
    return [];
  }

  // Find head exercise (no previousExerciseId)
  const headExercise = moduleExercises.find(ex => !(ex as any).previousExerciseId);
  
  if (!headExercise) {
    // Fallback: return exercises sorted by creation date or ID
    return moduleExercises.sort((a, b) => {
      if ((a as any).createdAt && (b as any).createdAt) {
        return new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime();
      }
      return a._id.localeCompare(b._id);
    });
  }

  // Build ordered list following the linked list
  const orderedExercises: Exercise[] = [];
  let currentExercise: Exercise | undefined = headExercise;
  
  while (currentExercise) {
    orderedExercises.push(currentExercise);
    const nextId: string | undefined = (currentExercise as any).nextExerciseId;
    
    // Check if nextId points to the same exercise (infinite loop)
    if (nextId === currentExercise._id) {
      break;
    }
    
    const nextExercise: Exercise | undefined = nextId ? moduleExercises.find(ex => ex._id === nextId) : undefined;
    currentExercise = nextExercise;
    
    // Prevent infinite loops
    if (orderedExercises.length > moduleExercises.length) {
      break;
    }
  }

  // Add any orphaned exercises (not in the linked list)
  const orderedIds = new Set(orderedExercises.map(ex => ex._id));
  const orphanedExercises = moduleExercises.filter(ex => !orderedIds.has(ex._id));
  
  if (orphanedExercises.length > 0) {
    orderedExercises.push(...orphanedExercises);
  }
  
  return orderedExercises;
};

// Sort modules using a linked list
export const getSortedModules = (modules: Module[]): Module[] => {
  if (!modules || modules.length === 0) {
    return [];
  }
  
  // Find the first module (without previousModuleId)
  const firstModule = modules.find(module => !module.previousModuleId);
  
  if (!firstModule) {
    // If there is no firstModule, fallback to creation date order
    return [...modules].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  }
  
  const sorted = [firstModule];
  let current = firstModule;
  
  // Follow the nextModuleId chain
  while (current.nextModuleId) {
    const nextModule = modules.find(m => m._id === current.nextModuleId);
    
    if (nextModule && !sorted.find(m => m._id === nextModule._id)) {
      sorted.push(nextModule);
      current = nextModule;
    } else {
      break;
    }
  }
  
  return sorted;
};

// Calculate module progress
export const getModuleProgress = (module: Module, courseExercises: Exercise[], selectedStudentId: string | null): number => {
  if (!selectedStudentId) return 0;
  const exercises = courseExercises.filter(ex => {
    if (!ex) return false;
    // For student exercises, check studentModuleId
    if ((ex as any).studentModuleId) {
      return (ex as any).studentModuleId === module._id;
    }
    // For regular exercises, check courseModuleId
    return ex.courseModuleId === module._id;
  });
  const completedExercises = exercises.filter(e => e && (e.status === 'completed' || e.status === 'reviewed')).length;
  return exercises.length > 0 ? (completedExercises / exercises.length) * 100 : 0;
};

// Calculate module estimated time
export const getModuleEstimatedTime = (module: Module, courseExercises: Exercise[], selectedStudentId: string | null): number => {
  if (!selectedStudentId) {
    // When no student is selected, use the module's estimatedTime
    return module.estimatedTime;
  }
  
  // When student is selected, calculate time from exercises
  const exercises = courseExercises.filter(ex => {
    // For student exercises, check studentModuleId
    if ((ex as any).studentModuleId) {
      return (ex as any).studentModuleId === module._id;
    }
    // For regular exercises, check courseModuleId
    return ex.courseModuleId === module._id;
  });
  
  // Sum up the estimatedTime from all exercises
  const totalTime = exercises.reduce((total, exercise) => {
    return total + (exercise.estimatedTime || 0);
  }, 0);
  
  return totalTime;
};
