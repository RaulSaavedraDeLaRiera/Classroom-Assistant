import React, { useEffect, useState } from 'react';
import { useCourseData } from '../hooks/useCourseData';
import { useModuleManagement } from '../hooks/useModuleManagement';
import { useExerciseManagement } from '../hooks/useExerciseManagement';
import AddModuleModal from './course/AddModuleModal';
import AddExerciseModal from './course/AddExerciseModal';
import EditExerciseModal from './course/EditExerciseModal';
import ModuleList from './course/ModuleList';
import StudentSelector from './students/StudentSelector';
import StudentChat from './students/StudentChat';
import { Student } from '../types/course.types';
import { ArrowLeft } from 'lucide-react';

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

interface CourseModule {
  _id: string;
  title: string;
  description: string;
  courseId: string;
  teacherModuleId: string;
  visible: boolean;
  tags: string[];
  estimatedTime: number;
  status: string;
  type: string;
  prerequisites: string[];
  content: {
    exercises: string[];
  };
  previousModuleId: string | null;
  nextModuleId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CourseViewProps {
  course: Course;
  courseModules: CourseModule[];
  enrolledStudents: Student[];
  onBack: () => void;
  initialStudentId?: string;
  initialChatOpen?: boolean;
  initialExerciseId?: string;
}

export default function CourseView({ course, courseModules, enrolledStudents, onBack, initialStudentId, initialChatOpen, initialExerciseId }: CourseViewProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(initialStudentId || null);
  const [studentModules, setStudentModules] = useState<any[]>([]);
  const [studentExercises, setStudentExercises] = useState<any[]>([]);
  const [localCourseModules, setLocalCourseModules] = useState<CourseModule[]>(courseModules);
  const [localCourseExercises, setLocalCourseExercises] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(initialChatOpen || false);
  // Custom hooks for data management
  const {
    courseExercises,
    teacherModules,
    templateModules,
    teacherExercises,
    templateExercises,
    loading,
    error,
    refetch
  } = useCourseData(course);

  // Update local state when props change
  useEffect(() => {
    setLocalCourseModules(courseModules);
  }, [courseModules]);

  useEffect(() => {
    if (courseExercises) {
      setLocalCourseExercises(courseExercises);
    }
  }, [courseExercises]);

  // Debug logging - solo una vez al montar
  useEffect(() => {
    console.log('CourseView received:', { 
      courseId: course._id, 
      courseTitle: course.title,
      modulesCount: courseModules?.length,
      modules: courseModules?.map(m => ({ id: m._id, title: m.title, prev: m.previousModuleId, next: m.nextModuleId }))
    });
  }, []); // Solo se ejecuta al montar

  // Handle initial navigation parameters
  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
    }
    if (initialChatOpen) {
      setIsChatOpen(true);
    }
  }, [initialStudentId, initialChatOpen]);

  // Load student data when student is selected
  useEffect(() => {
    const loadStudentData = async () => {
      if (!selectedStudentId) {
        setStudentModules([]);
        setStudentExercises([]);
        return;
      }

      try {
        // Import the API service
        const { courseApiService } = await import('../services/courseApi');

        // Load student modules first
        const modulesData = await courseApiService.getStudentModules(course._id, selectedStudentId);

        // Use the courseId from the first student module for exercises
        let exercisesData = [];
        if (modulesData.length > 0) {
          const studentModuleCourseId = modulesData[0].courseId || course._id;
          exercisesData = await courseApiService.getStudentExercises(studentModuleCourseId, selectedStudentId);
        }

        setStudentModules(modulesData);
        setStudentExercises(exercisesData);
      } catch (error) {
        console.error('Error loading student data:', error);
        // For now, set empty arrays on error
        setStudentModules([]);
        setStudentExercises([]);
      }
    };

    loadStudentData();
  }, [selectedStudentId, course._id]);


  // Handle exercise completion changes
  const handleExerciseCompletionChange = (exerciseId: string, completed: boolean, score?: number) => {
    setStudentExercises(prevExercises => 
      prevExercises.map(exercise => 
        exercise._id === exerciseId 
          ? { 
              ...exercise, 
              status: completed ? (score !== undefined ? 'reviewed' : 'completed') : 'pending',
              score: completed ? score : undefined,
              completedAt: completed ? new Date().toISOString() : null
            }
          : exercise
      )
    );
  };

  // Handle exercise status changes
  const handleExerciseStatusChange = (exerciseId: string, newStatus: string) => {
    setStudentExercises(prevExercises => 
      prevExercises.map(exercise => 
        exercise._id === exerciseId 
          ? { ...exercise, status: newStatus }
          : exercise
      )
    );
  };

  // Handle exercise max score changes
  const handleExerciseMaxScoreChange = async (exerciseId: string, newMaxScore: number) => {
    try {
      // Update course exercise maxScore
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/courses/exercises/${exerciseId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ maxScore: newMaxScore })
      });

      if (!response.ok) {
        throw new Error('Failed to update exercise max score');
      }

      // Update local course exercises
      setLocalCourseExercises(prevExercises => 
        prevExercises.map(exercise => 
          exercise._id === exerciseId 
            ? { ...exercise, maxScore: newMaxScore }
            : exercise
        )
      );

      // Update student exercises if any student is selected
      if (selectedStudentId) {
        setStudentExercises(prevExercises => 
          prevExercises.map(exercise => {
            // Check if this student exercise is based on the course exercise being updated
            const courseExerciseId = typeof exercise.courseExerciseId === 'object' 
              ? exercise.courseExerciseId._id || exercise.courseExerciseId.id
              : exercise.courseExerciseId;
            
            if (courseExerciseId === exerciseId) {
              // Recalculate score proportionally if exercise is completed
              if (exercise.status === 'completed' && exercise.score !== undefined) {
                const oldMaxScore = exercise.maxScore || 10;
                const percentage = exercise.score / oldMaxScore;
                const newScore = Math.round(percentage * newMaxScore);
                return { 
                  ...exercise, 
                  maxScore: newMaxScore,
                  score: newScore
                };
              }
              return { ...exercise, maxScore: newMaxScore };
            }
            return exercise;
          })
        );
      }
    } catch (error) {
      console.error('Error updating exercise max score:', error);
      alert('Error updating exercise max score');
    }
  };

  const handleModuleStatusChange = async (moduleId: string, status: 'active' | 'inactive') => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/courses/${course._id}/modules/${moduleId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update module status');
      }

      // Update local state
      setLocalCourseModules(prev => 
        prev.map(module => 
          module._id === moduleId ? { ...module, status } : module
        )
      );

      console.log(`Module ${moduleId} status changed to:`, status);
    } catch (error) {
      console.error('Error updating module status:', error);
      alert('Error updating module status. Please try again.');
    }
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };


  const {
    showAddModule,
    setShowAddModule,
    editingModule,
    setEditingModule,
    editModuleData,
    setEditModuleData,
    addModuleToCourse,
    updateModule,
    deleteModule,
    moveModule,
    startEditModule
  } = useModuleManagement(course._id, () => window.location.reload(), (newModule) => {
    // Add new module to local state
    setLocalCourseModules(prev => {
      const updated = [...prev, newModule];
      return updated;
    });
    // Refresh course modules to ensure linked-list pointers are up to date
    const refreshCourseModules = async () => {
      try {
        const { courseApiService } = await import('../services/courseApi');
        const modulesData = await courseApiService.getCourseModules(course._id);
        setLocalCourseModules(modulesData);
      } catch (error) {
        console.error('Error refreshing course modules after adding module:', error);
      }
    };
    refreshCourseModules();
    // Also refresh course exercises so the new module's exercises appear without a full reload
    const refreshCourseExercises = async () => {
      try {
        const { courseApiService } = await import('../services/courseApi');
        const exercisesData = await courseApiService.getCourseExercises(course._id);
        setLocalCourseExercises(exercisesData);
      } catch (error) {
        console.error('Error refreshing course exercises after adding module:', error);
      }
    };
    refreshCourseExercises();
  }, () => {
    // Refresh course modules when moved
    const refreshCourseModules = async () => {
      try {
        const { courseApiService } = await import('../services/courseApi');
        const modulesData = await courseApiService.getCourseModules(course._id);
        setLocalCourseModules(modulesData);
      } catch (error) {
        console.error('Error refreshing course modules:', error);
      }
    };
    refreshCourseModules();
  }, () => {
    // Refresh course modules and exercises when deleted
    const refreshAfterDelete = async () => {
      try {
        const { courseApiService } = await import('../services/courseApi');
        const [modulesData, exercisesData] = await Promise.all([
          courseApiService.getCourseModules(course._id),
          courseApiService.getCourseExercises(course._id)
        ]);
        setLocalCourseModules(modulesData);
        setLocalCourseExercises(exercisesData);
      } catch (error) {
        console.error('Error refreshing after module deletion:', error);
      }
    };
    refreshAfterDelete();
  });

  const {
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
  } = useExerciseManagement(
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
        const loadStudentData = async () => {
          try {
            const { courseApiService } = await import('../services/courseApi');
            const exercisesData = await courseApiService.getStudentExercises(course._id, selectedStudentId);
            setStudentExercises(exercisesData);
          } catch (error) {
            console.error('Error refreshing student exercises:', error);
          }
        };
        loadStudentData();
      }
    },
    () => {
      // Refresh course exercises when added
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
  const displayModules = selectedStudentId ? studentModules : localCourseModules;
  const displayExercises = selectedStudentId ? studentExercises : localCourseExercises;



  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={refetch}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Course
          </button>
        </div>

        {/* Course title */}
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-2xl font-semibold text-blue-900">{course.title}</h2>
          <p className="text-blue-700 mt-2">{course.description}</p>
        </div>

        {/* Student Selector */}
        <StudentSelector
          students={enrolledStudents}
          selectedStudentId={selectedStudentId}
          onStudentSelect={setSelectedStudentId}
          courseId={course._id}
          enrollmentId={selectedStudentId ? enrolledStudents.find(s => s._id === selectedStudentId)?.enrollmentId : undefined}
          onOpenChat={handleOpenChat}
        />

        {/* Modules List */}
        <ModuleList
          courseModules={displayModules}
          courseExercises={displayExercises}
          courseId={course._id}
          selectedStudentId={selectedStudentId || undefined}
          onMoveModule={(moduleId, direction) => moveModule(moduleId, direction, displayModules)}
          onMoveExercise={(exerciseId, direction, getOrderedExercises) => moveExercise(exerciseId, direction, displayExercises, getOrderedExercises, course._id, selectedStudentId || undefined)}
          onEditModule={startEditModule}
          onDeleteModule={deleteModule}
          onEditExercise={startEditExercise}
          onDeleteExercise={deleteExercise}
          onAddExercise={setShowAddExercise}
          editingModule={editingModule}
          editModuleData={editModuleData}
          onEditModuleDataChange={setEditModuleData}
          onUpdateModule={updateModule}
          onCancelEditModule={() => setEditingModule(null)}
          onExerciseCompletionChange={handleExerciseCompletionChange}
          onExerciseStatusChange={selectedStudentId ? handleExerciseStatusChange : undefined}
          onExerciseMaxScoreChange={!selectedStudentId ? handleExerciseMaxScoreChange : undefined}
          onModuleStatusChange={!selectedStudentId ? handleModuleStatusChange : undefined}
        />

        {/* Add Module Button - Only show when no student is selected */}
        {!selectedStudentId && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowAddModule(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg font-medium"
            >
              Add Module
            </button>
          </div>
        )}

        {/* Modals */}
        <AddModuleModal
          isOpen={showAddModule}
          onClose={() => setShowAddModule(false)}
          teacherModules={teacherModules}
          templateModules={templateModules}
          onAddModule={addModuleToCourse}
        />

        <AddExerciseModal
          isOpen={!!showAddExercise}
          moduleId={showAddExercise}
          onClose={() => setShowAddExercise(null)}
          teacherExercises={teacherExercises}
          templateExercises={templateExercises}
          onAddExercise={(exerciseId, moduleId) => addExerciseToModule(exerciseId, moduleId, course._id, selectedStudentId || undefined)}
        />

        <EditExerciseModal
          isOpen={!!editingExercise}
          exerciseId={editingExercise}
          onClose={() => setEditingExercise(null)}
          onSave={() => updateExercise(editingExercise!)}
          formData={editExerciseData}
          onFormDataChange={setEditExerciseData}
        />

        {/* Student Chat */}
        {selectedStudentId && (
          <StudentChat
            courseId={course._id}
            studentId={selectedStudentId}
            enrollmentId={enrolledStudents.find(s => s._id === selectedStudentId)?.enrollmentId || ''}
            isOpen={isChatOpen}
            onClose={handleCloseChat}
          />
        )}

      </div>
    </div>
  );
}
