import { useState, useEffect } from 'react';
import { useModuleManagement } from './useModuleManagement';
import { useExerciseManagement } from './useExerciseManagement';
import { useCourseData } from './useCourseData';
import { Course, CourseModule } from '../types/course.types';

export function useExerciseData(course: Course, modules: CourseModule[] = []) {
  // Local state for modules and exercises for automatic updates
  const [localModules, setLocalModules] = useState<CourseModule[]>(modules || []);
  const [localCourseExercises, setLocalCourseExercises] = useState<any[]>([]);
  const [studentModules, setStudentModules] = useState<any[]>([]);
  const [studentExercises, setStudentExercises] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  const selectModuleByPriority = (modules: any[], exercises: any[]) => {
    const priorityOrder = ['completed', 'in_progress', 'reviewed'];
    
    const exercisesByModule = exercises.reduce((acc, exercise) => {
      const moduleId = exercise.studentModuleId || exercise.courseModuleId;
      if (!acc[moduleId]) acc[moduleId] = [];
      acc[moduleId].push(exercise);
      return acc;
    }, {} as Record<string, any[]>);
    
    let hasAnyPriorityExercises = false;
    for (const module of modules) {
      const moduleExercises = exercisesByModule[module._id] || [];
      const hasPriorityStatus = moduleExercises.some((ex: any) => priorityOrder.includes(ex.status));
      if (hasPriorityStatus) {
        hasAnyPriorityExercises = true;
        break;
      }
    }
    
    if (!hasAnyPriorityExercises) {
      return null;
    }
    
    for (const priority of priorityOrder) {
      for (let i = modules.length - 1; i >= 0; i--) {
        const module = modules[i];
        const moduleExercises = exercisesByModule[module._id] || [];
        const hasPriorityStatus = moduleExercises.some((ex: any) => ex.status === priority);
        if (hasPriorityStatus) {
          return module;
        }
      }
    }
    
    return null;
  };
  
  // Callback when a module is moved
  const onModuleMoved = () => {
    // Force re-render
    setForceUpdate(prev => prev + 1);
  };
  
  // Hook to load course exercises
  const {
    courseExercises,
    loading: exercisesLoading,
    error: exercisesError
  } = useCourseData(course);

  // Sync local state with props
  useEffect(() => {
    if (modules) {
      setLocalModules(modules);
    }
  }, [modules]);

  // Initialize course exercises from hook
  useEffect(() => {
    if (courseExercises) {
      setLocalCourseExercises(courseExercises);
    }
  }, [courseExercises]);

  useEffect(() => {
    const loadStudentData = async () => {
      setSelectedModuleId(null);
      
      if (!selectedStudentId) {
        setStudentModules([]);
        setStudentExercises([]);
        setForceUpdate(prev => prev + 1);
        window.dispatchEvent(new CustomEvent('clearExpandedModules'));
        return;
      }

      try {
        // Import the API service
        const { courseApiService } = await import('../services/courseApi');

        // Load student modules first
        const modulesData = await courseApiService.getStudentModules(course._id, selectedStudentId);

        let exercisesData = [];
        try {
          exercisesData = await courseApiService.getStudentExercises(course._id, selectedStudentId);
        } catch (exerciseError) {
          console.error('Error loading student exercises:', exerciseError);
          exercisesData = [];
        }

        setStudentModules(modulesData);
        setStudentExercises(exercisesData);
        
        if (modulesData.length > 0 && exercisesData.length > 0) {
          setTimeout(() => {
            const selectedModule = selectModuleByPriority(modulesData, exercisesData);
            if (selectedModule) {
              setSelectedModuleId(selectedModule._id);
              
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('expandModule', { 
                  detail: { moduleId: selectedModule._id } 
                }));
              }, 50);
            } else {
              setSelectedModuleId(null);
            }
          }, 300);
        } else {
          setSelectedModuleId(null);
        }
      } catch (error) {
        console.error('Error loading student data:', error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
        // Fallback to empty arrays on error
        setStudentModules([]);
        setStudentExercises([]);
      }
    };

    loadStudentData();
  }, [selectedStudentId, course._id]);

  // Listen for exercise updates to refresh local state
  useEffect(() => {
    const handleForceRefresh = (event: CustomEvent) => {
      const { exerciseId, content, score, maxScore, status, type, module } = event.detail;
      console.log('Force refresh event received:', { exerciseId, content, score, maxScore, status, type, module });
      
      // Module addition is handled in the callback; avoid duplication here
      if (type === 'moduleAdded' && module) {
        return;
      }
      
      // Update local course exercises
      if (exerciseId) {
        setLocalCourseExercises(prev => prev.map(ex => {
          if (ex._id === exerciseId) {
            const updatedExercise = { ...ex };
            if (content !== undefined) updatedExercise.content = content;
            if (score !== undefined) updatedExercise.score = score;
            if (maxScore !== undefined) updatedExercise.maxScore = maxScore;
            if (status !== undefined) updatedExercise.status = status;
            else if (score !== null) updatedExercise.status = 'reviewed';
            else if (score === null) updatedExercise.status = 'ready';
            return updatedExercise;
          }
          return ex;
        }));
        console.log('Local course exercises updated');
      }
      
      // Update student exercises if a student is selected
      if (selectedStudentId) {
        setStudentExercises(prev => prev.map(ex => {
          // Check if this student exercise is based on the course exercise being updated
          const courseExerciseId = ex.courseExerciseId && 
            typeof ex.courseExerciseId === 'object' 
            ? ex.courseExerciseId._id || ex.courseExerciseId.id
            : ex.courseExerciseId;
          
          if (courseExerciseId === exerciseId) {
            const updatedExercise = { ...ex };
            if (content !== undefined) updatedExercise.content = content;
            if (score !== undefined) updatedExercise.score = score;
            if (maxScore !== undefined) updatedExercise.maxScore = maxScore;
            if (status !== undefined) updatedExercise.status = status;
            else if (score !== null) updatedExercise.status = 'reviewed';
            else if (score === null) updatedExercise.status = 'ready';
            return updatedExercise;
          }
          return ex;
        }));
        console.log('Student exercises updated locally');
      }
      
      // Force a re-render
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('forceRefresh', handleForceRefresh as EventListener);
    
    return () => {
      window.removeEventListener('forceRefresh', handleForceRefresh as EventListener);
    };
  }, [selectedStudentId]);

  // Hooks for module and exercise management
  const { 
    showAddModule,
    setShowAddModule,
    editingModule,
    setEditingModule,
    editModuleData,
    setEditModuleData,
    addModuleToCourse,
    updateModule,
    moveModule, 
    startEditModule, 
    deleteModule 
  } = useModuleManagement(
    course._id, 
    () => onModuleMoved(), // onSuccess
    (newModule) => {
      // Update local state instead of reloading the page
      console.log('Module added, updating local state:', newModule);
      
      // Add the new module to local state
      setLocalModules(prev => [...prev, newModule]);
      
      // Also update from server to ensure consistency
      const refreshModules = async () => {
        try {
          const { courseApiService } = await import('../services/courseApi');
          const modulesData = await courseApiService.getCourseModules(course._id);
          setLocalModules(modulesData);
        } catch (error) {
          console.error('Error refreshing modules after add:', error);
        }
      };
      refreshModules();

      // Refresh course exercises as the new module may include copied exercises
      const refreshCourseExercises = async () => {
        try {
          const { courseApiService } = await import('../services/courseApi');
          const exercisesData = await courseApiService.getCourseExercises(course._id);
          setLocalCourseExercises(exercisesData);
        } catch (error) {
          console.error('Error refreshing course exercises after module add:', error);
        }
      };
      refreshCourseExercises();
      
      // Dispatch event for other components to update
      window.dispatchEvent(new CustomEvent('moduleAdded', {
        detail: newModule
      }));
      
      // Force re-render
      setForceUpdate(prev => prev + 1);
    }, // onModuleAdded
    () => { // onModuleMoved
      const refreshModules = async () => {
        try {
          const { courseApiService } = await import('../services/courseApi');
          const modulesData = await courseApiService.getCourseModules(course._id);
          setLocalModules(modulesData);
        } catch (error) {
          console.error('Error refreshing modules after move:', error);
        }
      };
      refreshModules();
    },
    (deletedModuleId) => {
      // Update local state immediately and fix references
      setLocalModules(prev => {
        // Find the module being deleted to get its neighbors
        const deletedModule = prev.find(module => module._id === deletedModuleId);
        if (!deletedModule) return prev.filter(module => module._id !== deletedModuleId);
        
        const previousModuleId = deletedModule.previousModuleId;
        const nextModuleId = deletedModule.nextModuleId;
        
        // Update the modules array
        const updatedModules = prev.filter(module => module._id !== deletedModuleId);
        
        // Update the previous module to point to the next module
        if (previousModuleId) {
          const prevModuleIndex = updatedModules.findIndex(m => m._id === previousModuleId);
          if (prevModuleIndex !== -1) {
            updatedModules[prevModuleIndex] = {
              ...updatedModules[prevModuleIndex],
              nextModuleId: nextModuleId
            };
          }
        }
        
        // Update the next module to point to the previous module
        if (nextModuleId) {
          const nextModuleIndex = updatedModules.findIndex(m => m._id === nextModuleId);
          if (nextModuleIndex !== -1) {
            updatedModules[nextModuleIndex] = {
              ...updatedModules[nextModuleIndex],
              previousModuleId: previousModuleId
            };
          }
        }
        
        return updatedModules;
      });
      
      // Also update local exercises to remove those from the deleted module
      setLocalCourseExercises(prev => {
        return prev.filter(exercise => exercise.courseModuleId !== deletedModuleId);
      });
      
      // If there's a selected student, also update their data
      if (selectedStudentId) {
        setStudentModules(prev => {
          return prev.filter(module => module._id !== deletedModuleId);
        });
        
        setStudentExercises(prev => {
          return prev.filter(exercise => {
            const moduleIdToCheck = (exercise as any).studentModuleId || exercise.courseModuleId;
            return moduleIdToCheck !== deletedModuleId;
          });
        });
      }
      
      // Dispatch event for other components to update
      window.dispatchEvent(new CustomEvent('moduleDeleted', {
        detail: { type: 'moduleDeleted', moduleId: deletedModuleId }
      }));
      
      // Force re-render
      setForceUpdate(prev => prev + 1);
    } // onModuleDeleted
  );

  const { moveExercise } = useExerciseManagement(
    () => {
      // Refresh course exercises when moved
      const refreshCourseExercises = async () => {
        try {
          const { courseApiService } = await import('../services/courseApi');
          const exercisesData = await courseApiService.getCourseExercises(course._id);
          setLocalCourseExercises(exercisesData);
        } catch (error) {
          console.error('Error refreshing course exercises:', error);
        }
      };
      refreshCourseExercises();
    },
    (newExercise) => {
      // Add new student exercise to local state
      setStudentExercises(prev => [...prev, newExercise]);
    },
    () => {
      // Refresh student exercises when moved
      if (selectedStudentId) {
        const loadStudentExercises = async () => {
          try {
            const { courseApiService } = await import('../services/courseApi');
            const exercisesData = await courseApiService.getStudentExercises(course._id, selectedStudentId);
            setStudentExercises(exercisesData);
            // Do NOT refresh student modules here to preserve their order
          } catch (error) {
            console.error('Error refreshing student exercises:', error);
          }
        };
        loadStudentExercises();
      }
    },
    () => {
      // Refresh from server when exercise is added (only course exercises)
      const refreshCourseExercises = async () => {
        try {
          const { courseApiService } = await import('../services/courseApi');
          const exercisesData = await courseApiService.getCourseExercises(course._id);
          setLocalCourseExercises(exercisesData);
        } catch (error) {
          console.error('Error refreshing course exercises:', error);
        }
      };
      refreshCourseExercises();
    }
  );

  // Determine which data to display based on student selection
  const displayModules = selectedStudentId ? studentModules : localModules;
  const displayExercises = selectedStudentId ? studentExercises : localCourseExercises;
  
  
  
  
  // Sort modules by 'order' when available, otherwise by creation date
  const sortedDisplayModules = [...displayModules].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    // Fallback: sort by creation date
    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  });
  

  // Module reordering function (using original implementation)
  const handleMoveModule = (moduleId: string, direction: 'up' | 'down') => {
    // Use the original hook function directly
    moveModule(moduleId, direction, displayModules);
  };

  const handleMoveExercise = (exerciseId: string, direction: 'up' | 'down', moduleId: string) => {
    // Function to get ordered exercises
    const getOrderedExercises = (moduleId: string) => {
      // Filter exercises for this module
      let moduleExercises;

      if (selectedStudentId) {
        // When a student is selected, filter by studentModuleId or courseModuleId
        moduleExercises = displayExercises.filter(ex => {
          // For student exercises, check studentModuleId
          if ((ex as any).studentModuleId) {
            return (ex as any).studentModuleId === moduleId;
          }
          // For regular exercises, check courseModuleId
          return ex.courseModuleId === moduleId;
        });
      } else {
        // When no student is selected, filter by courseModuleId
        moduleExercises = displayExercises.filter(ex => ex.courseModuleId === moduleId);
      }

      if (moduleExercises.length === 0) {
        return [];
      }

      // Remove duplicates based on _id
      const uniqueExercises = moduleExercises.reduce((acc, current) => {
        const existing = acc.find((item: any) => item._id === current._id);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, [] as any[]);

      if (uniqueExercises.length !== moduleExercises.length) {
        return uniqueExercises;
      }

      // For student exercises, use linked list ordering (same as course exercises)
      if (selectedStudentId) {
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
        const orderedExercises: any[] = [];
        let currentExercise: any | undefined = headExercise;
        
        while (currentExercise) {
          orderedExercises.push(currentExercise);
          const nextId: string | undefined = (currentExercise as any).nextExerciseId;
          const nextExercise: any | undefined = nextId ? moduleExercises.find(ex => ex._id === nextId) : undefined;
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
      const orderedExercises: any[] = [];
      let currentExercise: any | undefined = headExercise;
      
      while (currentExercise) {
        orderedExercises.push(currentExercise);
        const nextId: string | undefined = (currentExercise as any).nextExerciseId;
        const nextExercise: any | undefined = nextId ? moduleExercises.find(ex => ex._id === nextId) : undefined;
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
    
    // Call the hook's reordering function
    moveExercise(exerciseId, direction, displayExercises, getOrderedExercises, course._id, selectedStudentId || undefined);
    
    // Force re-render while preserving expansion state
    setTimeout(() => {
      setForceUpdate(prev => prev + 1);
    }, 100);
  };

  return {
    // states
    selectedStudentId,
    setSelectedStudentId,
    selectedModuleId,
    setSelectedModuleId,
    displayModules: sortedDisplayModules,
    displayExercises,
    forceUpdate,
    exercisesLoading,
    exercisesError,
    
    // Setters for direct update
    setLocalCourseExercises,
    setStudentExercises,
    setLocalModules,
    setStudentModules,
    setForceUpdate,
    
    // Module management functions
    showAddModule,
    setShowAddModule,
    editingModule,
    setEditingModule,
    editModuleData,
    setEditModuleData,
    addModuleToCourse,
    updateModule,
    
    // Functions
    handleMoveModule,
    handleMoveExercise,
    handleEditModule: startEditModule,
    handleDeleteModule: deleteModule
  };
}
