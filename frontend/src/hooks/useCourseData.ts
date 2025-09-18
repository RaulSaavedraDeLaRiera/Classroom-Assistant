import { useState, useEffect, useCallback } from 'react';
import { courseApiService, CourseModule, CourseExercise } from '../services/courseApi';

interface Course {
  _id: string;
  title: string;
  description: string;
  teacherId: string;
  modules: string[];
  students: string[];
  visible: boolean;
  tags: string[];
  estimatedTime: number;
  status: string;
  maxStudents: number;
  createdAt: string;
  updatedAt: string;
}

export function useCourseData(course: Course) {
  const [courseExercises, setCourseExercises] = useState<CourseExercise[]>([]);
  const [teacherModules, setTeacherModules] = useState<any[]>([]);
  const [templateModules, setTemplateModules] = useState<any[]>([]);
  const [teacherExercises, setTeacherExercises] = useState<any[]>([]);
  const [templateExercises, setTemplateExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExercises = useCallback(async () => {
    try {
      const exercisesData = await courseApiService.getCourseExercises(course._id);
      
      // Check for duplicate IDs
      const exerciseIds = exercisesData.map(e => e._id);
      const uniqueIds = new Set(exerciseIds);
      if (exerciseIds.length !== uniqueIds.size) {
        console.error('DUPLICATE EXERCISE IDs FOUND:', exerciseIds);
        const duplicates = exerciseIds.filter((id: string, index: number) => exerciseIds.indexOf(id) !== index);
        console.error('Duplicate IDs:', duplicates);
      }
      
      setCourseExercises(exercisesData);
    } catch (err) {
      console.error('Error loading exercises:', err);
      setError(err instanceof Error ? err.message : 'Failed to load exercises');
    }
  }, [course._id]);

  const loadTeacherModules = useCallback(async () => {
    try {
      const modulesData = await courseApiService.getTeacherModules();
      setTeacherModules(modulesData);
    } catch (err) {
      console.error('Error loading teacher modules:', err);
      setError(err instanceof Error ? err.message : 'Failed to load teacher modules');
    }
  }, []);

  const loadTemplateModules = useCallback(async () => {
    try {
      const modulesData = await courseApiService.getTemplateModules();
      setTemplateModules(modulesData);
    } catch (err) {
      console.error('Error loading template modules:', err);
      setError(err instanceof Error ? err.message : 'Failed to load template modules');
    }
  }, []);

  const loadTeacherExercises = useCallback(async () => {
    try {
      const exercisesData = await courseApiService.getTeacherExercises();
      setTeacherExercises(exercisesData);
    } catch (err) {
      console.error('Error loading teacher exercises:', err);
      setError(err instanceof Error ? err.message : 'Failed to load teacher exercises');
    }
  }, []);

  const loadTemplateExercises = useCallback(async () => {
    try {
      const exercisesData = await courseApiService.getTemplateExercises();
      setTemplateExercises(exercisesData);
    } catch (err) {
      console.error('Error loading template exercises:', err);
      setError(err instanceof Error ? err.message : 'Failed to load template exercises');
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadExercises(),
        loadTeacherModules(),
        loadTemplateModules(),
        loadTeacherExercises(),
        loadTemplateExercises()
      ]);
    } catch (err) {
      console.error('Error loading course data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  }, [loadExercises, loadTeacherModules, loadTemplateModules, loadTeacherExercises, loadTemplateExercises]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return {
    courseExercises,
    teacherModules,
    templateModules,
    teacherExercises,
    templateExercises,
    loading,
    error,
    refetch: loadAllData
  };
}
