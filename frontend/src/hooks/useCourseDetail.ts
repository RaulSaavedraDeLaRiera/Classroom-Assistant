import { useState, useEffect, useCallback } from 'react';
import { courseDetailApiService } from '../services/courseDetailApi';
import { Course, CourseModule, CourseExercise, CourseStats } from '../types/course.types';

export function useCourseDetail(courseId: string | string[] | undefined) {
  const [course, setCourse] = useState<Course | null>(null);
  const [courseModules, setCourseModules] = useState<CourseModule[]>([]);
  const [courseExercises, setCourseExercises] = useState<CourseExercise[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourseData = useCallback(async () => {
    if (!courseId || typeof courseId !== 'string') return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load all course data in parallel
      const [courseData, modulesData, exercisesData, statsData] = await Promise.all([
        courseDetailApiService.getCourse(courseId),
        courseDetailApiService.getCourseModules(courseId),
        courseDetailApiService.getCourseExercises(courseId),
        courseDetailApiService.getCourseStats(courseId)
      ]);

      setCourse(courseData);
      setCourseModules(modulesData);
      setCourseExercises(exercisesData);
      setCourseStats(statsData);
    } catch (err) {
      console.error('Error loading course data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  // Functions to update local state
  const updateCourse = useCallback((updatedCourse: Course) => {
    setCourse(updatedCourse);
  }, []);

  const updateCourseModules = useCallback((updatedModules: CourseModule[]) => {
    setCourseModules(updatedModules);
  }, []);

  const addCourseModule = useCallback((newModule: CourseModule) => {
    setCourseModules(prev => [...prev, newModule]);
  }, []);

  const updateCourseModule = useCallback((moduleId: string, updatedModule: Partial<CourseModule>) => {
    setCourseModules(prev => prev.map(module => 
      module._id === moduleId ? { ...module, ...updatedModule } : module
    ));
  }, []);

  const removeCourseModule = useCallback((moduleId: string) => {
    setCourseModules(prev => prev.filter(module => module._id !== moduleId));
  }, []);

  const updateCourseExercises = useCallback((updatedExercises: CourseExercise[]) => {
    setCourseExercises(updatedExercises);
  }, []);

  const addCourseExercise = useCallback((newExercise: CourseExercise) => {
    setCourseExercises(prev => [...prev, newExercise]);
  }, []);

  const updateCourseExercise = useCallback((exerciseId: string, updatedExercise: Partial<CourseExercise>) => {
    setCourseExercises(prev => prev.map(exercise => 
      exercise._id === exerciseId ? { ...exercise, ...updatedExercise } : exercise
    ));
  }, []);

  const removeCourseExercise = useCallback((exerciseId: string) => {
    setCourseExercises(prev => prev.filter(exercise => exercise._id !== exerciseId));
  }, []);

  return {
    course,
    courseModules,
    courseExercises,
    courseStats,
    loading,
    error,
    refetch: loadCourseData,
    // Local state update functions
    updateCourse,
    updateCourseModules,
    addCourseModule,
    updateCourseModule,
    removeCourseModule,
    updateCourseExercises,
    addCourseExercise,
    updateCourseExercise,
    removeCourseExercise
  };
}
