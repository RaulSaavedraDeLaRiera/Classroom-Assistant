import React, { useEffect } from 'react';
import { Course, CourseStats, Student, EnhancedActiveTab, CourseModule } from '../../types/course.types';
import StudentList from '../students/StudentList';
import AddStudentModal from '../students/AddStudentModal';
import CourseProgressView from './CourseProgressViewMain';
import DataTab from './DataTab';
import NotificationsTab from './NotificationsTab';
import { useExerciseData } from '../../hooks/useExerciseData';
import { useCourseData } from '../../hooks/useCourseData';
import { useExpansionState } from '../../hooks/useExpansionState';
import { downloadExercisePDF } from '../../utils/pdfGenerator';
import { courseApiService } from '../../services/courseApi';
import { useExerciseManagement } from '../../hooks/useExerciseManagement';
import ContentModal from '../ContentModal';
import EditExerciseModal from './EditExerciseModal';
import EditModuleModal from './EditModuleModal';
import AddModuleModal from './AddModuleModal';
import AddExerciseModal from './AddExerciseModal';
import { CorrectionPreview } from '../students/CorrectionEditor';
import { useState } from 'react';

interface EnhancedCourseTabContentProps {
  activeTab: EnhancedActiveTab;
  course: Course;
  courseStats: CourseStats | null;
  enrolledStudents: Student[];
  showAddStudent: boolean;
  onShowModulesView: () => void;
  onAddStudent: () => void;
  onCloseAddStudent: () => void;
  onUnenrollStudent: (studentId: string) => void;
  onEnrollStudent: (studentId: string) => void;
  availableStudents: Student[];
  loading?: boolean;
  onOpenChatWithStudent?: (studentId: string) => void;
  onNavigateToExercise?: (exerciseId: string, studentId: string) => void;
  modules?: CourseModule[];
  onModuleReorder?: (dragIndex: number, hoverIndex: number) => void;
  onExerciseReorder?: (moduleId: string, dragIndex: number, hoverIndex: number) => void;
  onModuleClick?: (moduleId: string) => void;
  onExerciseClick?: (exerciseId: string) => void;
  onModuleStatusChange?: (moduleId: string, status: 'active' | 'inactive') => void;
  onExerciseStatusChange?: (exerciseId: string, status: string) => void;
  onExerciseCompletionChange?: (exerciseId: string, completed: boolean, score?: number) => void;
  onAddModule?: () => void;
  onUnreadNotificationsChange?: (count: number) => void;
  onViewExercise?: (exerciseId: string) => void;
  onEditExercise?: (exercise: any) => void;
  onDownloadExercise?: (exerciseId: string) => void;
  onDeleteExercise?: (exerciseId: string) => void;
  onCompleteExercise?: (exerciseId: string) => void;
  onCorrectExercise?: (exerciseId: string, newScore: number) => void;
  onChangeScoreExercise?: (exerciseId: string, newScore: number) => void;
  initialSelectedStudentId?: string;
}

export default function EnhancedCourseTabContent({
  activeTab,
  course,
  courseStats,
  enrolledStudents,
  showAddStudent,
  onShowModulesView,
  onAddStudent,
  onCloseAddStudent,
  onUnenrollStudent,
  onEnrollStudent,
  availableStudents,
  loading = false,
  onOpenChatWithStudent,
  onNavigateToExercise,
  modules = [],
  onModuleReorder,
  onExerciseReorder,
  onModuleClick,
  onExerciseClick,
  onModuleStatusChange,
  onExerciseStatusChange,
  onExerciseCompletionChange,
  onAddModule,
  onUnreadNotificationsChange,
  onViewExercise,
  onEditExercise,
  onDownloadExercise,
  onDeleteExercise,
  onCompleteExercise,
  onCorrectExercise,
  onChangeScoreExercise,
  initialSelectedStudentId
}: EnhancedCourseTabContentProps) {
  
  // Custom hooks
  const {
    selectedStudentId,
    setSelectedStudentId,
    selectedModuleId,
    setSelectedModuleId,
    displayModules,
    displayExercises,
    forceUpdate,
    exercisesLoading,
    exercisesError,
    setLocalCourseExercises,
    setStudentExercises,
    setLocalModules,
    setStudentModules,
    setForceUpdate,
    showAddModule,
    setShowAddModule,
    editingModule,
    setEditingModule,
    editModuleData,
    setEditModuleData,
    addModuleToCourse,
    updateModule,
    handleMoveModule,
    handleMoveExercise,
    handleEditModule,
    handleDeleteModule
  } = useExerciseData(course, modules);

  // Sync external initial selected student when provide
  useEffect(() => {
    if (initialSelectedStudentId) {
      setSelectedStudentId(initialSelectedStudentId);
    }
  }, [initialSelectedStudentId, setSelectedStudentId]);

  // Course data for modals
  const {
    teacherModules,
    templateModules,
    teacherExercises,
    templateExercises
  } = useCourseData(course);

  // Exercise management hook
  const {
    showAddExercise,
    setShowAddExercise,
    startEditExercise,
    deleteExercise,
    updateExercise,
    addExerciseToModule
  } = useExerciseManagement(
    () => {
    // Refresh callback - can be implemented later
    },
    () => {
      // Add callback - can be implemented later
    },
    () => {
      // Refresh student exercises callback - can be implemented later
    },
    () => {
      // Course exercise added callback - refresh course exercises
      const refreshCourseExercises = async () => {
        try {
          const { courseApiService } = await import('../../services/courseApi');
          const exercisesData = await courseApiService.getCourseExercises(course._id);
          setLocalCourseExercises(exercisesData);
        } catch (error) {
          console.error('Error refreshing course exercises after add:', error);
        }
      };
      refreshCourseExercises();
    }
  );



  // Custom delete function that updates local state
  const handleDeleteExercise = async (exerciseId: string, courseId?: string, selectedStudentId?: string, moduleId?: string) => {
    try {
      await deleteExercise(exerciseId, courseId, selectedStudentId, moduleId);
      
      // Update local state after successful deletion
      if (selectedStudentId) {
        // Remove from student exercises
        setStudentExercises(prev => prev.filter(ex => ex._id !== exerciseId));
      } else {
        // Remove from course exercises
        setLocalCourseExercises(prev => prev.filter(ex => ex._id !== exerciseId));
      }
    } catch (error) {
      console.error('Error deleting exercise:', error);
      throw error;
    }
  };

  // State for exercise view modal
  const [viewExerciseModal, setViewExerciseModal] = useState<{
    isOpen: boolean;
    exercise: any | null;
  }>({
    isOpen: false,
    exercise: null
  });

  // State for exercise edit modal
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [editExerciseData, setEditExerciseData] = useState({
    title: '',
    content: '',
    type: 'text',
    estimatedTime: 30,
    difficulty: 'medium',
    tags: [],
    description: ''
  });
  const [showCorrectionPreview, setShowCorrectionPreview] = useState(false);
  const [correctionExerciseId, setCorrectionExerciseId] = useState<string | null>(null);
  const [currentExerciseMaxScore, setCurrentExerciseMaxScore] = useState<number>(10);

  // State for module edit modal
  const [editingModuleData, setEditingModuleData] = useState<any | null>(null);

  // Listen for exercise updates to refresh the modal
  useEffect(() => {
    const handleExerciseUpdate = (event: CustomEvent) => {
      const { exerciseId, maxScore, title, content, type, estimatedTime, difficulty, tags, status } = event.detail;
      
      if (exerciseId === correctionExerciseId) {
        setCurrentExerciseMaxScore(maxScore);
        console.log('Modal maxScore updated via event:', maxScore);
      }
      
      // Update local course exercises
      setLocalCourseExercises(prevExercises => 
        prevExercises.map(exercise => 
          exercise._id === exerciseId 
            ? { 
                ...exercise, 
                ...(maxScore !== undefined && { maxScore }),
                ...(title !== undefined && { title }),
                ...(content !== undefined && { content }),
                ...(type !== undefined && { type }),
                ...(estimatedTime !== undefined && { estimatedTime }),
                ...(difficulty !== undefined && { difficulty }),
                ...(tags !== undefined && { tags }),
                ...(status !== undefined && { status })
              }
            : exercise
        )
      );

      // Update student exercises if any student is selected
      if (selectedStudentId) {
        setStudentExercises(prevExercises => 
          prevExercises.map(exercise => 
            exercise._id === exerciseId 
              ? { 
                  ...exercise, 
                  ...(maxScore !== undefined && { maxScore }),
                  ...(title !== undefined && { title }),
                  ...(content !== undefined && { content }),
                  ...(type !== undefined && { type }),
                  ...(estimatedTime !== undefined && { estimatedTime }),
                  ...(difficulty !== undefined && { difficulty }),
                  ...(tags !== undefined && { tags }),
                  ...(status !== undefined && { status })
                }
              : exercise
          )
        );
      }
    };

    const handleExerciseContentUpdate = (event: CustomEvent) => {
      const { exerciseId, content, score, maxScore, status } = event.detail;
      console.log('Exercise content updated via event:', { exerciseId, content, score, maxScore, status });
      console.log('Current selectedStudentId:', selectedStudentId);
      
      // Update local course exercises
      setLocalCourseExercises(prevExercises =>
        prevExercises.map(exercise =>
          exercise._id === exerciseId
            ? { ...exercise, content, score, maxScore, status: status || 'reviewed' }
            : exercise
        )
      );

      // Update student exercises if any student is selected
      if (selectedStudentId) {
        setStudentExercises(prevExercises =>
          prevExercises.map(exercise =>
            exercise._id === exerciseId
              ? { ...exercise, content, score, maxScore, status: status || 'reviewed' }
              : exercise
          )
        );
      }
      
      // Force a re-render by dispatching a custom event that the parent can listen to
      window.dispatchEvent(new CustomEvent('forceRefresh', {
        detail: { exerciseId, content, score, maxScore, status: status || 'reviewed' }
      }));
    };

    const handleModuleAdded = (event: CustomEvent) => {
      const newModule = event.detail;
      console.log('Module added event received:', newModule);
      // Force a refresh of the course data
      window.dispatchEvent(new CustomEvent('forceRefresh', {
        detail: { type: 'moduleAdded', module: newModule }
      }));
    };

    window.addEventListener('exerciseUpdated', handleExerciseUpdate as EventListener);
    window.addEventListener('exerciseContentUpdated', handleExerciseContentUpdate as EventListener);
    window.addEventListener('moduleAdded', handleModuleAdded as EventListener);
    
    return () => {
      window.removeEventListener('exerciseUpdated', handleExerciseUpdate as EventListener);
      window.removeEventListener('exerciseContentUpdated', handleExerciseContentUpdate as EventListener);
      window.removeEventListener('moduleAdded', handleModuleAdded as EventListener);
    };
  }, [correctionExerciseId]);

  // Function to download pDF
  const handleDownloadExercise = (exerciseId: string) => {
    // Find exercise in displayExercises
    const exercise = displayExercises.find(ex => ex._id === exerciseId);
    if (exercise) {
      try {
        const exerciseData = {
          title: exercise.title,
          content: exercise.content || 'No content available',
          type: exercise.type,
          difficulty: exercise.difficulty,
          estimatedTime: exercise.estimatedTime,
          maxScore: exercise.maxScore || 10,
          description: exercise.description
        };

        downloadExercisePDF(exerciseData, {
          includeMetadata: true,
          includeInstructions: true
        });
      } catch (error) {
        console.error('Error downloading PDF:', error);
      }
    }
  };

  // Function to view exercise
  const handleViewExercise = (exerciseId: string) => {
    // Find exercise in displayExercises
    const exercise = displayExercises.find(ex => ex._id === exerciseId);
    if (exercise) {
      setViewExerciseModal({
        isOpen: true,
        exercise: exercise
      });
    }
  };

  // Wrapper function to edit exercise
  const handleEditExercise = (exercise: any) => {
    // Load exercise data into the form
    setEditExerciseData({
      title: exercise.title || '',
      content: exercise.content || '',
      type: exercise.type || 'text',
      estimatedTime: exercise.estimatedTime || 30,
      difficulty: exercise.difficulty || 'medium',
      tags: exercise.tags || [],
      description: exercise.description || ''
    });
    
    setEditingExercise(exercise._id);
    startEditExercise(exercise);
  };

  // Function to open correction modal for grading
  const handleCompleteExercise = async (exerciseId: string) => {
    // Open correction modal for grading and evaluation
    console.log(`Opening correction modal for exercise ${exerciseId}`);
    console.log('Current state:', { showCorrectionPreview, correctionExerciseId, selectedStudentId });
    
    // Find the exercise and set its current maxScore
    const exercise = displayExercises.find(ex => ex._id === exerciseId);
    if (exercise) {
      const correctMaxScore = getExerciseMaxScore(exerciseId);
      setCurrentExerciseMaxScore(correctMaxScore);
      console.log('Current exercise maxScore:', correctMaxScore);
      console.log('Exercise details:', {
        id: exercise._id,
        courseExerciseId: exercise.courseExerciseId,
        studentMaxScore: exercise.maxScore,
        isExtra: !exercise.courseExerciseId,
        status: exercise.status,
        score: exercise.score,
        completedAt: exercise.completedAt,
        reviewed: exercise.reviewed
      });
    }
    
    setCorrectionExerciseId(exerciseId);
    setShowCorrectionPreview(true);
    console.log('State updated, should show modal now');
  };

  // Function to correct exercise
  const handleCorrectExercise = async (exerciseId: string, newScore: number | null) => {
    try {
      console.log(`Correcting exercise ${exerciseId} with score: ${newScore}`);
      
      if (newScore === null) {
        // Remove evaluation - mark as not completed
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/courses/enrollments/${course._id}/students/${selectedStudentId}/exercises/${exerciseId}/uncomplete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to remove exercise evaluation');
        }

        // Use the exercise completion change handler if available
        if (onExerciseCompletionChange) {
          onExerciseCompletionChange(exerciseId, false);
        }
        
        // Also update the status to 'ready' via API
        const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/courses/${course._id}/student-exercises/${exerciseId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'ready' })
        });
        
        if (!statusResponse.ok) {
          console.warn('Failed to update exercise status to ready');
        }
        
        console.log(`Exercise ${exerciseId} evaluation removed`);
      } else {
        // Update exercise via API like ExerciseCompletion does
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/courses/enrollments/${course._id}/students/${selectedStudentId}/exercises/${exerciseId}/complete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ score: newScore })
        });

        if (!response.ok) {
          throw new Error('Failed to correct exercise');
        }

        // Use the exercise completion change handler if available - mark as reviewed, not completed
        if (onExerciseCompletionChange) {
          onExerciseCompletionChange(exerciseId, true, newScore);
        }
        
        // Also update the status to 'reviewed' via API
        const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/courses/${course._id}/student-exercises/${exerciseId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'reviewed' })
        });
        
        if (!statusResponse.ok) {
          console.warn('Failed to update exercise status to reviewed');
        }
        
        console.log(`Exercise ${exerciseId} marked as reviewed with score: ${newScore}`);
      }
    } catch (error) {
      console.error('Error correcting exercise:', error);
    }
  };

  // Function to change maximum score for exercises
  const handleChangeScoreExercise = async (exerciseId: string, newMaxScore: number) => {
    try {
      console.log('=== handleChangeScoreExercise ===');
      console.log('Exercise ID:', exerciseId);
      console.log('New max score:', newMaxScore);
      console.log('Course ID:', course._id);
      console.log('Selected Student ID:', selectedStudentId);
      
      // Find the exercise to determine its type
      const exercise = displayExercises.find(ex => ex._id === exerciseId);
      if (!exercise) {
        throw new Error('Exercise not found');
      }
      
      const token = localStorage.getItem('access_token');
      let url: string;
      let requestBody: any;
      
      // Determine if this is a CourseExercise or StudentExercise
      if (selectedStudentId) {
        // This is a StudentExercise (including extra exercises) - use student-exercises endpoint
        url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/courses/${course._id}/student-exercises/${exerciseId}`;
        requestBody = { 
          maxScore: newMaxScore,
          status: 'reviewed' // Mark as reviewed when max score is changed
        };
      } else {
        // This is a CourseExercise - use course exercises endpoint
        url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/courses/exercises/${exerciseId}`;
        requestBody = { 
          maxScore: newMaxScore
        };
      }
      
   
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error body:', errorText);
        throw new Error(`Failed to update exercise max score: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
    
      
      // Update local state without page reload
      // Update the current exercise maxScore state
      setCurrentExerciseMaxScore(newMaxScore);
      
      // Update local course exercises (same logic as CourseView.tsx)
      setLocalCourseExercises(prevExercises => {
        const updated = prevExercises.map(exercise => 
          exercise._id === exerciseId 
            ? { ...exercise, maxScore: newMaxScore }
            : exercise
        );
        console.log('Updated localCourseExercises:', updated.find(ex => ex._id === exerciseId));
        return updated;
      });

      // Update student exercises if any student is selected
      if (selectedStudentId) {
        setStudentExercises(prevExercises => {
          const updated = prevExercises.map(exercise => 
            exercise._id === exerciseId 
              ? { ...exercise, maxScore: newMaxScore, status: 'reviewed' }
              : exercise
          );
          console.log('Updated studentExercises:', updated.find(ex => ex._id === exerciseId));
          return updated;
        });
      }
      
      console.log('Local state updated - maxScore changed to:', newMaxScore);
      
      // Force a re-render by updating the forceUpdate counter
      // This will trigger a re-render of the component
      window.dispatchEvent(new CustomEvent('exerciseUpdated', { 
        detail: { exerciseId, maxScore: newMaxScore, status: selectedStudentId ? 'reviewed' : undefined } 
      }));
      
      // Also dispatch a forceRefresh event to update the parent component
      window.dispatchEvent(new CustomEvent('forceRefresh', {
        detail: { exerciseId, maxScore: newMaxScore, status: selectedStudentId ? 'reviewed' : undefined }
      }));
      
      // Also trigger the completion change handler if available
      if (onExerciseCompletionChange) {
        onExerciseCompletionChange(exerciseId, false, 0);
      }
    } catch (error) {
      console.error('Error updating maximum score:', error);
      alert('Error updating exercise max score');
    }
  };

  // Function to handle module editing
  const handleEditModuleData = (module: any) => {
    setEditingModuleData(module);
  };

  // Function to save module changes
  const handleSaveModule = async (moduleId: string, data: any) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/courses/modules/${moduleId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Failed to update module: ${response.status} ${response.statusText}`);
      }

      // Update local state
      setLocalModules(prevModules =>
        prevModules.map(module =>
          module._id === moduleId
            ? { ...module, ...data }
            : module
        )
      );

      // If a student is selected, also update student modules
      if (selectedStudentId) {
        setStudentModules(prevModules =>
          prevModules.map(module =>
            module._id === moduleId
              ? { ...module, ...data }
              : module
          )
        );
      }

      // Force refresh
      setForceUpdate(prev => prev + 1);
    } catch (error) {
      console.error('Error updating module:', error);
      alert('Error updating module');
    }
  };

  // Function to get the correct maxScore for an exercise
  const getExerciseMaxScore = (exerciseId: string) => {
    const exercise = displayExercises.find(ex => ex._id === exerciseId);
    if (!exercise) {
      console.log('Exercise not found for ID:', exerciseId);
      return 10;
    }
    
    console.log('Getting maxScore for exercise:', {
      id: exercise._id,
      courseExerciseId: exercise.courseExerciseId,
      studentMaxScore: exercise.maxScore,
      isExtra: !exercise.courseExerciseId
    });
    
    // For extra exercises (no courseExerciseId), use the StudentExercise maxScore
    if (!exercise.courseExerciseId) {
      console.log('Extra exercise - using StudentExercise maxScore:', exercise.maxScore);
      return exercise.maxScore || 10;
    }
    
    // For regular exercises, we need to get the maxScore from the CourseExercise
    // For now, we'll use the StudentExercise maxScore as it should be synced
    console.log('Regular exercise - using StudentExercise maxScore:', exercise.maxScore);
    return exercise.maxScore || 10;
  };

  // Wrapper function for max score change in modal
  const handleMaxScoreChange = (newMaxScore: number) => {
    console.log('=== handleMaxScoreChange ===');
    console.log('correctionExerciseId:', correctionExerciseId);
    console.log('newMaxScore:', newMaxScore);
    
    if (correctionExerciseId) {
      handleChangeScoreExercise(correctionExerciseId, newMaxScore);
    } else {
      console.error('No correctionExerciseId available');
    }
  };

    const {
    expandedModules,
    expandedExercises,
    toggleModule,
    toggleExercises,
    expandModule
  } = useExpansionState();


  // Data Tab
  if (activeTab === 'data') {
    return (
      <DataTab
        course={course}
        courseStats={courseStats}
        onShowModulesView={onShowModulesView}
        onAddStudent={onAddStudent}
      />
    );
  }

  // Modules Tab
  if (activeTab === 'modules') {
    return (
      <div>
        <CourseProgressView
        key={`${selectedStudentId}-${displayExercises.length}-${displayModules.length}-${forceUpdate}`}
        course={course}
        modules={displayModules}
        courseExercises={displayExercises}
        students={enrolledStudents}
        selectedStudentId={selectedStudentId}
        selectedModuleId={selectedModuleId}
        onStudentSelect={setSelectedStudentId}
        onModuleClick={onModuleClick}
        onExerciseClick={onExerciseClick}
        onModuleStatusChange={onModuleStatusChange}
        onExerciseStatusChange={onExerciseStatusChange}
        onExerciseCompletionChange={onExerciseCompletionChange}
        onMoveModule={handleMoveModule}
        onMoveExercise={handleMoveExercise}
        expandedModules={expandedModules}
        expandedExercises={expandedExercises}
        onToggleModule={toggleModule}
        onToggleExercises={toggleExercises}
        onExpandModule={expandModule}
        onEditModule={handleEditModuleData}
        onDeleteModule={handleDeleteModule}
        onViewExercise={handleViewExercise}
        onEditExercise={handleEditExercise}
        onDownloadExercise={handleDownloadExercise}
        onDeleteExercise={handleDeleteExercise}
        onCompleteExercise={handleCompleteExercise}
        onCorrectExercise={handleCorrectExercise}
        onChangeScoreExercise={handleChangeScoreExercise}
        onAddModule={() => {
          setShowAddModule(true);
        }}
        onAddExercise={(moduleId) => {
          setShowAddExercise(moduleId);
        }}
      />
      
      {/* Exercise view modal */}
      {viewExerciseModal.isOpen && viewExerciseModal.exercise && (
        <ContentModal
          isOpen={viewExerciseModal.isOpen}
          onClose={() => setViewExerciseModal({ isOpen: false, exercise: null })}
          content={viewExerciseModal.exercise.content || 'No content available'}
          title={viewExerciseModal.exercise.title || 'Exercise'}
          type="exercise"
        />
      )}
      
      {/* Exercise edit modal */}
      {editingExercise && (
        <EditExerciseModal
          isOpen={!!editingExercise}
          exerciseId={editingExercise}
          onClose={() => setEditingExercise(null)}
          onSave={async () => {
            try {
              // Determine if this is a student exercise or course exercise
              const exercise = displayExercises.find(ex => ex._id === editingExercise);
              const isStudentExercise = exercise && (exercise as any).studentModuleId;
              
              
              if (isStudentExercise && selectedStudentId) {
                // For student exercises, use the student-exercises endpoint
                await courseApiService.updateStudentExercise(course._id, selectedStudentId, editingExercise, editExerciseData);
              } else {
                // For course exercises, use the regular exercises endpoint
                // The backend will automatically update all related student exercises
                await courseApiService.updateExercise(editingExercise, editExerciseData);
              }
              
              // Update local state for the exercise
              const exerciseIndex = displayExercises.findIndex(ex => ex._id === editingExercise);
              if (exerciseIndex !== -1) {
                // Create a custom event to update the exercise in the parent component
                window.dispatchEvent(new CustomEvent('exerciseUpdated', {
                  detail: {
                    exerciseId: editingExercise,
                    title: editExerciseData.title,
                    content: editExerciseData.content,
                    type: editExerciseData.type,
                    estimatedTime: editExerciseData.estimatedTime,
                    difficulty: editExerciseData.difficulty,
                    tags: editExerciseData.tags
                  }
                }));
                
              }
              
              setEditingExercise(null);
            } catch (error) {
              console.error('Error updating exercise:', error);
            }
          }}
          formData={editExerciseData}
          onFormDataChange={setEditExerciseData}
        />
      )}
      
      {/* Correction Preview Modal */}
      {showCorrectionPreview && correctionExerciseId && selectedStudentId && (
         <CorrectionPreview
           isOpen={showCorrectionPreview}
           content={displayExercises.find(ex => ex._id === correctionExerciseId)?.content || 'No content available'}
           maxScore={currentExerciseMaxScore}
           currentScore={displayExercises.find(ex => ex._id === correctionExerciseId)?.score || 0}
           isExtra={!displayExercises.find(ex => ex._id === correctionExerciseId)?.courseExerciseId}
           isReviewed={displayExercises.find(ex => ex._id === correctionExerciseId)?.status === 'reviewed'}
           currentStatus={displayExercises.find(ex => ex._id === correctionExerciseId)?.status || 'ready'}
           onMaxScoreChange={handleMaxScoreChange}
           onSave={async (correctedContent: string, score?: number | null) => {
             try {
               console.log('Saving corrected content for student:', correctedContent);

               // Save to student exercise using the API method
               await courseApiService.updateStudentExerciseContent(course._id, correctionExerciseId!, correctedContent);

               // If score is provided, mark exercise as completed with that score
               if (score !== undefined) {
                 await handleCorrectExercise(correctionExerciseId!, score);
                 
                 // Force refresh of exercise data
                 if (onExerciseCompletionChange) {
                   onExerciseCompletionChange(correctionExerciseId!, score !== null, score || undefined);
                 }
               }

               // Update local state for the exercise
               const exerciseIndex = displayExercises.findIndex(ex => ex._id === correctionExerciseId);
               if (exerciseIndex !== -1) {
                 // Create a custom event to update the exercise in the parent component
                // Determine the correct status based on whether there's a score
                const newStatus = score !== null && score !== undefined ? 'reviewed' : 'ready';
                
                window.dispatchEvent(new CustomEvent('exerciseContentUpdated', {
                  detail: {
                    exerciseId: correctionExerciseId,
                    content: correctedContent,
                    score: score,
                    maxScore: currentExerciseMaxScore,
                    status: newStatus
                  }
                }));
                 
                 console.log('Local state updated for exercise:', correctionExerciseId, 'with status:', newStatus);
               }

               console.log('Student exercise content saved successfully');
               
               // Force refresh of the component without page reload
             } catch (error) {
               console.error('Error saving corrected content:', error);
             } finally {
               setShowCorrectionPreview(false);
               setCorrectionExerciseId(null);
             }
           }}
          onCancel={() => {
            setShowCorrectionPreview(false);
            setCorrectionExerciseId(null);
          }}
        />
      )}
      
      {/* Add Module Modal */}
      <AddModuleModal
        isOpen={showAddModule}
        onClose={() => setShowAddModule(false)}
        teacherModules={teacherModules || []}
        templateModules={templateModules || []}
        onAddModule={addModuleToCourse}
      />

      {/* Add Exercise Modal */}
      <AddExerciseModal
        isOpen={!!showAddExercise}
        moduleId={showAddExercise || ''}
        onClose={() => setShowAddExercise(null)}
        teacherExercises={teacherExercises || []}
        templateExercises={templateExercises || []}
        onAddExercise={async (exerciseId, moduleId) => {
          try {
            const newExercise = await addExerciseToModule(exerciseId, moduleId, course._id, selectedStudentId || undefined);

            // Update local state
            if (selectedStudentId) {
              // If student is selected, add to student exercises
              // Ensure the exercise has the correct studentModuleId
              const exerciseWithModuleId = {
                ...newExercise,
                studentModuleId: moduleId
              };
              setStudentExercises(prev => [...prev, exerciseWithModuleId]);
            } else {
              // If no student selected, add to course exercises
              setLocalCourseExercises(prev => [...prev, newExercise]);
            }

            // Force refresh
            setForceUpdate(prev => prev + 1);
          } catch (error) {
            console.error('Error adding exercise:', error);
          }
        }}
      />

      {/* Edit Module Modal */}
      <EditModuleModal
        isOpen={!!editingModuleData}
        module={editingModuleData}
        onClose={() => setEditingModuleData(null)}
        onSave={handleSaveModule}
      />
      </div>
    );
  }

  // Students Tab
  if (activeTab === 'students') {
    return (
      <div className="space-y-6">
        <StudentList
          enrolledStudents={enrolledStudents}
          courseId={course._id}
          onAddStudent={onAddStudent}
          onUnenrollStudent={onUnenrollStudent}
          onOpenChatWithStudent={(studentId) => {
            onOpenChatWithStudent?.(studentId);
          }}
          initialSelectedStudentId={initialSelectedStudentId || null}
        />
        
        <AddStudentModal
          isOpen={showAddStudent}
          onClose={onCloseAddStudent}
          availableStudents={availableStudents}
          onEnrollStudent={onEnrollStudent}
          loading={loading}
        />
        
        {/* Correction Preview Modal */}
        {showCorrectionPreview && correctionExerciseId && selectedStudentId && (
         <CorrectionPreview
           isOpen={showCorrectionPreview}
           content={displayExercises.find(ex => ex._id === correctionExerciseId)?.content || 'No content available'}
           maxScore={currentExerciseMaxScore}
           currentScore={displayExercises.find(ex => ex._id === correctionExerciseId)?.score || 0}
           isExtra={!displayExercises.find(ex => ex._id === correctionExerciseId)?.courseExerciseId}
           isReviewed={displayExercises.find(ex => ex._id === correctionExerciseId)?.status === 'reviewed'}
           currentStatus={displayExercises.find(ex => ex._id === correctionExerciseId)?.status || 'ready'}
           onMaxScoreChange={handleMaxScoreChange}
           onSave={async (correctedContent: string, score?: number | null) => {
             try {
               console.log('Saving corrected content for student:', correctedContent);

               // Save to student exercise using the API method
               await courseApiService.updateStudentExerciseContent(course._id, correctionExerciseId!, correctedContent);

               // If score is provided, mark exercise as completed with that score
               if (score !== undefined) {
                 await handleCorrectExercise(correctionExerciseId!, score);
                 
                 // Force refresh of exercise data
                 if (onExerciseCompletionChange) {
                   onExerciseCompletionChange(correctionExerciseId!, score !== null, score || undefined);
                 }
               }

               // Update local state for the exercise
               const exerciseIndex = displayExercises.findIndex(ex => ex._id === correctionExerciseId);
               if (exerciseIndex !== -1) {
                 // Create a custom event to update the exercise in the parent component
                // Determine the correct status based on whether there's a score
                const newStatus = score !== null && score !== undefined ? 'reviewed' : 'ready';
                
                window.dispatchEvent(new CustomEvent('exerciseContentUpdated', {
                  detail: {
                    exerciseId: correctionExerciseId,
                    content: correctedContent,
                    score: score,
                    maxScore: currentExerciseMaxScore,
                    status: newStatus
                  }
                }));
                 
                 console.log('Local state updated for exercise:', correctionExerciseId, 'with status:', newStatus);
               }

               console.log('Student exercise content saved successfully');
               
               // Force refresh of the component without page reload
             } catch (error) {
               console.error('Error saving corrected content:', error);
             } finally {
               setShowCorrectionPreview(false);
               setCorrectionExerciseId(null);
             }
           }}
            onCancel={() => {
              setShowCorrectionPreview(false);
              setCorrectionExerciseId(null);
            }}
          />
        )}
      </div>
    );
  }

  // Notifications Tab
  if (activeTab === 'notifications') {
    return (
      <>
        <NotificationsTab
          onOpenChatWithStudent={onOpenChatWithStudent}
          onShowModulesView={onShowModulesView}
          onNavigateToExercise={onNavigateToExercise}
          onUnreadNotificationsChange={onUnreadNotificationsChange}
        />
        
        {/* Correction Preview Modal */}
        {showCorrectionPreview && correctionExerciseId && selectedStudentId && (
         <CorrectionPreview
           isOpen={showCorrectionPreview}
           content={displayExercises.find(ex => ex._id === correctionExerciseId)?.content || 'No content available'}
           maxScore={currentExerciseMaxScore}
           currentScore={displayExercises.find(ex => ex._id === correctionExerciseId)?.score || 0}
           isExtra={!displayExercises.find(ex => ex._id === correctionExerciseId)?.courseExerciseId}
           isReviewed={displayExercises.find(ex => ex._id === correctionExerciseId)?.status === 'reviewed'}
           currentStatus={displayExercises.find(ex => ex._id === correctionExerciseId)?.status || 'ready'}
           onMaxScoreChange={handleMaxScoreChange}
           onSave={async (correctedContent: string, score?: number | null) => {
             try {
               console.log('Saving corrected content for student:', correctedContent);

               // Save to student exercise using the API method
               await courseApiService.updateStudentExerciseContent(course._id, correctionExerciseId!, correctedContent);

               // If score is provided, mark exercise as completed with that score
               if (score !== undefined) {
                 await handleCorrectExercise(correctionExerciseId!, score);
                 
                 // Force refresh of exercise data
                 if (onExerciseCompletionChange) {
                   onExerciseCompletionChange(correctionExerciseId!, score !== null, score || undefined);
                 }
               }

               // Update local state for the exercise
               const exerciseIndex = displayExercises.findIndex(ex => ex._id === correctionExerciseId);
               if (exerciseIndex !== -1) {
                 // Create a custom event to update the exercise in the parent component
                // Determine the correct status based on whether there's a score
                const newStatus = score !== null && score !== undefined ? 'reviewed' : 'ready';
                
                window.dispatchEvent(new CustomEvent('exerciseContentUpdated', {
                  detail: {
                    exerciseId: correctionExerciseId,
                    content: correctedContent,
                    score: score,
                    maxScore: currentExerciseMaxScore,
                    status: newStatus
                  }
                }));
                 
                 console.log('Local state updated for exercise:', correctionExerciseId, 'with status:', newStatus);
               }

               console.log('Student exercise content saved successfully');
               
               // Force refresh of the component without page reload
               // The component will re-render when the state changes
             } catch (error) {
               console.error('Error saving corrected content:', error);
             } finally {
               setShowCorrectionPreview(false);
               setCorrectionExerciseId(null);
             }
           }}
            onCancel={() => {
              setShowCorrectionPreview(false);
              setCorrectionExerciseId(null);
            }}
          />
        )}
      </>
    );
  }

  // Default return for other tabs
  return (
    <>
      {/* Correction Preview Modal */}
      {showCorrectionPreview && correctionExerciseId && selectedStudentId && (
         <CorrectionPreview
           isOpen={showCorrectionPreview}
           content={displayExercises.find(ex => ex._id === correctionExerciseId)?.content || 'No content available'}
           maxScore={currentExerciseMaxScore}
           currentScore={displayExercises.find(ex => ex._id === correctionExerciseId)?.score || 0}
           isExtra={!displayExercises.find(ex => ex._id === correctionExerciseId)?.courseExerciseId}
           isReviewed={displayExercises.find(ex => ex._id === correctionExerciseId)?.status === 'reviewed'}
           currentStatus={displayExercises.find(ex => ex._id === correctionExerciseId)?.status || 'ready'}
           onMaxScoreChange={handleMaxScoreChange}
           onSave={async (correctedContent: string, score?: number | null) => {
             try {
               console.log('Saving corrected content for student:', correctedContent);

               // Save to student exercise using the API method
               await courseApiService.updateStudentExerciseContent(course._id, correctionExerciseId!, correctedContent);

               // If score is provided, mark exercise as completed with that score
               if (score !== undefined) {
                 await handleCorrectExercise(correctionExerciseId!, score);
                 
                 // Force refresh of exercise data
                 if (onExerciseCompletionChange) {
                   onExerciseCompletionChange(correctionExerciseId!, score !== null, score || undefined);
                 }
               }

               // Update local state for the exercise
               const exerciseIndex = displayExercises.findIndex(ex => ex._id === correctionExerciseId);
               if (exerciseIndex !== -1) {
                 // Create a custom event to update the exercise in the parent component
                // Determine the correct status based on whether there's a score
                const newStatus = score !== null && score !== undefined ? 'reviewed' : 'ready';
                
                window.dispatchEvent(new CustomEvent('exerciseContentUpdated', {
                  detail: {
                    exerciseId: correctionExerciseId,
                    content: correctedContent,
                    score: score,
                    maxScore: currentExerciseMaxScore,
                    status: newStatus
                  }
                }));
                 
                 console.log('Local state updated for exercise:', correctionExerciseId, 'with status:', newStatus);
               }

               console.log('Student exercise content saved successfully');
               
               // Force refresh of the component without page reload
               // The component will re-render when the state changes
             } catch (error) {
               console.error('Error saving corrected content:', error);
             } finally {
               setShowCorrectionPreview(false);
               setCorrectionExerciseId(null);
             }
           }}
          onCancel={() => {
            setShowCorrectionPreview(false);
            setCorrectionExerciseId(null);
          }}
        />
      )}

    </>
  );
}
