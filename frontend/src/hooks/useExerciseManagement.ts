import { useState, useCallback } from 'react';
import { courseApiService } from '../services/courseApi';
import CoursesService from '../services/courses.service';

interface ExerciseFormData {
  title: string;
  content: string;
  type: string;
  estimatedTime: number;
  difficulty: string;
  tags: string[];
}

export function useExerciseManagement(onSuccess?: () => void, onExerciseAdded?: (exercise: any) => void, onExerciseMoved?: () => void, onCourseExerciseAdded?: () => void) {
  const [showAddExercise, setShowAddExercise] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [editExerciseData, setEditExerciseData] = useState<ExerciseFormData>({
    title: '',
    content: '',
    type: 'quiz',
    estimatedTime: 15,
    difficulty: 'intermediate',
    tags: []
  });

  const addExerciseToModule = useCallback(async (selectedExerciseId: string, moduleId: string, courseId?: string, selectedStudentId?: string) => {
    try {
      console.log(`[addExerciseToModule] Adding exercise ${selectedExerciseId} to module ${moduleId}`);
      console.log(`[addExerciseToModule] Course ID: ${courseId}, Student ID: ${selectedStudentId}`);
      
      if (selectedStudentId && courseId) {
        // Add to student module
        console.log(`[addExerciseToModule] Adding exercise to student module using student API`);
        const newStudentExercise = await CoursesService.getInstance().addExerciseToStudentModule(courseId, selectedStudentId, moduleId, selectedExerciseId);
        onExerciseAdded?.(newStudentExercise);
        setShowAddExercise(null);
        return newStudentExercise; // Return the created exercise
      } else {
        // Add to course module
        await courseApiService.addExerciseToModule(moduleId, selectedExerciseId);
        onCourseExerciseAdded?.();
        setShowAddExercise(null);
        return null; // No exercise object returned from API
      }
    } catch (error) {
      console.error('[addExerciseToModule] Error adding exercise to module:', error);
      throw error;
    }
  }, [onSuccess, onExerciseAdded, onCourseExerciseAdded]);

  const updateExercise = useCallback(async (exerciseId: string) => {
    try {
      await courseApiService.updateExercise(exerciseId, editExerciseData);
      setEditingExercise(null);
      setEditExerciseData({ 
        title: '', 
        content: '', 
        type: 'quiz', 
        estimatedTime: 15, 
        difficulty: 'intermediate', 
        tags: [] 
      });
      onSuccess?.();
    } catch (error) {
      console.error('Error updating exercise:', error);
      throw error;
    }
  }, [editExerciseData, onSuccess]);

  const deleteExercise = useCallback(async (exerciseId: string, courseId?: string, selectedStudentId?: string, moduleId?: string) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return;
    
    try {
      if (selectedStudentId && courseId) {
        // For student exercises, use the student-exercises endpoint
        await courseApiService.deleteStudentExercise(courseId, selectedStudentId, moduleId || '', exerciseId);
        onExerciseMoved?.();
      } else {
        // For course exercises, use the regular exercises endpoint
        await courseApiService.deleteExercise(exerciseId);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error deleting exercise:', error);
      throw error;
    }
  }, [onSuccess, onExerciseMoved]);

  const moveExercise = useCallback(async (exerciseId: string, direction: 'up' | 'down', courseExercises: any[], getOrderedExercises: (moduleId: string) => any[], courseId?: string, selectedStudentId?: string) => {
    try {
      const exercise = courseExercises.find(e => e._id === exerciseId);
      if (!exercise) {
        console.error('[moveExercise] Exercise not found in courseExercises:', exerciseId);
        return;
      }

      // Check if this is a student exercise (has studentModuleId instead of courseModuleId)
      const isStudentExercise = (exercise as any).studentModuleId;
      const moduleId = isStudentExercise ? (exercise as any).studentModuleId : exercise.courseModuleId;
      
      const moduleExercises = getOrderedExercises(moduleId);
      
      const currentIndex = moduleExercises.findIndex(e => e._id === exerciseId);
      if (currentIndex === -1) {
        console.error('[moveExercise] Exercise not found in ordered list:', exerciseId);
        onSuccess?.();
        return;
      }

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= moduleExercises.length) {
        return;
      }
      if (targetIndex === currentIndex) return; // No-op guard

      console.log(`[moveExercise] Exercise ID: ${exerciseId}, Position: ${currentIndex} → ${targetIndex}`);
      
      if (isStudentExercise && courseId && selectedStudentId) {
        // Reorder student exercise
        await CoursesService.getInstance().reorderStudentExerciseByIndex(courseId, selectedStudentId, moduleId, exerciseId, targetIndex);
        onExerciseMoved?.();
      } else {
        // Reorder course exercise
        await CoursesService.getInstance().reorderExerciseByIndex(moduleId, exerciseId, targetIndex);
        onSuccess?.();
      }
    } catch (error) {
      console.error('[moveExercise] Error moving exercise:', error);
      throw error;
    }
  }, [onSuccess, onExerciseMoved]);

  const startEditExercise = useCallback((exercise: any) => {
    setEditingExercise(exercise._id);
    setEditExerciseData({
      title: exercise.title,
      content: exercise.content,
      type: exercise.type,
      estimatedTime: exercise.estimatedTime,
      difficulty: exercise.difficulty,
      tags: exercise.tags
    });
  }, []);

  return {
    showAddExercise,
    setShowAddExercise,
    editingExercise,
    setEditingExercise,
    editExerciseData,
    setEditExerciseData,
    addExerciseToModule,
    updateExercise,
    deleteExercise,
    moveExercise,
    startEditExercise
  };
}
