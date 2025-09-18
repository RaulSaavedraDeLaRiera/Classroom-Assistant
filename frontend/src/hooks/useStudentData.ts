import { useState, useEffect, useCallback } from 'react';
import { courseApiService } from '../services/courseApi';

interface StudentModule {
  _id: string;
  title: string;
  description: string;
  courseId: string;
  studentModuleId: string;
  studentId: string;
  status: string;
  estimatedTime: number;
  previousModuleId: string | null;
  nextModuleId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StudentExercise {
  _id: string;
  title: string;
  content: string;
  type: string;
  estimatedTime: number;
  difficulty: string;
  tags: string[];
  description: string;
  maxScore: number;
  score?: number;
  status: string;
  completed: boolean;
  courseId: string;
  studentId: string;
  courseModuleId: string;
  studentModuleId: string;
  courseExerciseId: string;
  previousExerciseId: string | null;
  nextExerciseId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useStudentData(courseId: string | string[] | undefined, selectedStudentId: string | null) {
  const [studentModules, setStudentModules] = useState<StudentModule[]>([]);
  const [studentExercises, setStudentExercises] = useState<StudentExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStudentData = useCallback(async () => {
    if (!courseId || typeof courseId !== 'string' || !selectedStudentId) {
      setStudentModules([]);
      setStudentExercises([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load student modules and exercises in parallel
      const [modulesData, exercisesData] = await Promise.all([
        courseApiService.getStudentModules(courseId, selectedStudentId),
        courseApiService.getStudentExercises(courseId, selectedStudentId)
      ]);

      setStudentModules(modulesData);
      setStudentExercises(exercisesData);
    } catch (err) {
      console.error('Error loading student data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load student data');
      setStudentModules([]);
      setStudentExercises([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, selectedStudentId]);

  // Load data when student is selected
  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  // Functions to update local state
  const updateStudentModule = useCallback((moduleId: string, updatedModule: Partial<StudentModule>) => {
    setStudentModules(prev => prev.map(module => 
      module._id === moduleId ? { ...module, ...updatedModule } : module
    ));
  }, []);

  const addStudentModule = useCallback((newModule: StudentModule) => {
    setStudentModules(prev => [...prev, newModule]);
  }, []);

  const removeStudentModule = useCallback((moduleId: string) => {
    setStudentModules(prev => prev.filter(module => module._id !== moduleId));
  }, []);

  const updateStudentExercise = useCallback((exerciseId: string, updatedExercise: Partial<StudentExercise>) => {
    setStudentExercises(prev => prev.map(exercise => 
      exercise._id === exerciseId ? { ...exercise, ...updatedExercise } : exercise
    ));
  }, []);

  const addStudentExercise = useCallback((newExercise: StudentExercise) => {
    setStudentExercises(prev => [...prev, newExercise]);
  }, []);

  const removeStudentExercise = useCallback((exerciseId: string) => {
    setStudentExercises(prev => prev.filter(exercise => exercise._id !== exerciseId));
  }, []);

  const refreshStudentData = useCallback(() => {
    loadStudentData();
  }, [loadStudentData]);

  return {
    studentModules,
    studentExercises,
    loading,
    error,
    // Update functions
    updateStudentModule,
    addStudentModule,
    removeStudentModule,
    updateStudentExercise,
    addStudentExercise,
    removeStudentExercise,
    refreshStudentData
  };
}
