import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, FileText, Search, X, ArrowLeftRight, Plus, Edit, Trash2 } from 'lucide-react';
import ModuleCard from './ModuleCard';
import ExerciseCard from './ExerciseCard';
import { 
  CourseProgressViewProps, 
  Exercise, 
  Module, 
  Student, 
  Course,
  getOrderedExercises,
  getSortedModules,
  getModuleProgress,
  getModuleEstimatedTime
} from './CourseProgressViewCommon';

export const CourseProgressView: React.FC<CourseProgressViewProps> = ({
  course,
  modules,
  courseExercises,
  students,
  selectedStudentId,
  selectedModuleId,
  onStudentSelect,
  onModuleClick,
  onExerciseClick,
  onModuleStatusChange,
  onExerciseStatusChange,
  onExerciseCompletionChange,
  onMoveModule,
  onMoveExercise,
  expandedModules: externalExpandedModules,
  expandedExercises: externalExpandedExercises,
  onToggleModule: externalToggleModule,
  onToggleExercises: externalToggleExercises,
  onExpandModule: externalExpandModule,
  onEditModule,
  onDeleteModule,
  onViewExercise,
  onEditExercise,
  onDownloadExercise,
  onDeleteExercise,
  onCompleteExercise,
  onCorrectExercise,
  onChangeScoreExercise,
  onAddModule,
  onAddExercise
}) => {
  // Use external state if provided, otherwise use internal state
  const [internalExpandedModules, setInternalExpandedModules] = useState<Set<string>>(new Set());
  const [internalExpandedExercises, setInternalExpandedExercises] = useState<Set<string>>(new Set());
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(students);
  const [studentFilterQuery, setStudentFilterQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  // Use external state if provided, otherwise use internal state
  const [studentData, setStudentData] = useState<{
    modules: any[];
    exercises: any[];
  }>({ modules: [], exercises: [] });
  
  // Ref for scrolling to selected module
  const modulesContainerRef = useRef<HTMLDivElement>(null);
  
  const expandedModules = externalExpandedModules || internalExpandedModules;
  const expandedExercises = externalExpandedExercises || internalExpandedExercises;

  useEffect(() => {
    if (selectedModuleId && modulesContainerRef.current) {
      setTimeout(() => {
        const moduleElement = document.getElementById(`module-${selectedModuleId}`);
        if (moduleElement) {
          moduleElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
    }
  }, [selectedModuleId]);

  // Listen for expand module events
  useEffect(() => {
    const handleExpandModule = (event: CustomEvent) => {
      const { moduleId } = event.detail;
      
      if (!modulesContainerRef.current) {
        return;
      }
      
      if (moduleId && externalExpandModule) {
        externalExpandModule(moduleId);
      } else if (moduleId && externalToggleModule) {
        externalToggleModule(moduleId);
      } else if (moduleId) {
        setInternalExpandedModules(prev => {
          const newSet = new Set(prev);
          if (newSet.has(moduleId)) {
            newSet.delete(moduleId);
          } else {
            newSet.add(moduleId);
          }
          return newSet;
        });
      }
    };

    const handleClearExpandedModules = () => {
      setInternalExpandedModules(new Set());
    };

    window.addEventListener('expandModule', handleExpandModule as EventListener);
    window.addEventListener('clearExpandedModules', handleClearExpandedModules);
    
    return () => {
      window.removeEventListener('expandModule', handleExpandModule as EventListener);
      window.removeEventListener('clearExpandedModules', handleClearExpandedModules);
    };
  }, [externalToggleModule]);

  // Load student data when student is selected
  useEffect(() => {
    const loadStudentData = async () => {
      if (!selectedStudentId || !course) {
        setStudentData({ modules: [], exercises: [] });
        return;
      }

      try {
        // Import the API service
        const { courseApiService } = await import('../../services/courseApi');

        // Load student modules and exercises in parallel
        const [modulesData, exercisesData] = await Promise.all([
          courseApiService.getStudentModules(course._id, selectedStudentId),
          courseApiService.getStudentExercises(course._id, selectedStudentId)
        ]);

        setStudentData({ modules: modulesData, exercises: exercisesData });
      } catch (error) {
        console.error('Error loading student data:', error);
        setStudentData({ modules: [], exercises: [] });
      }
    };

    loadStudentData();
  }, [selectedStudentId, course]);

  // Filter students based on search query
  const filterStudents = (query: string) => {
    setStudentFilterQuery(query);
    if (!query.trim()) {
      setFilteredStudents(students);
      return;
    }

    const searchQuery = query.toLowerCase();
    const filtered = students.filter(student => {
      return student.name.toLowerCase().includes(searchQuery);
    });
    
    setFilteredStudents(filtered);
  };

  // Update filtered students when students prop changes
  useEffect(() => {
    setFilteredStudents(students);
  }, [students]);


  const toggleModule = (moduleId: string) => {
    if (externalToggleModule) {
      externalToggleModule(moduleId);
    } else {
      setInternalExpandedModules(prev => {
        const newSet = new Set(prev);
        if (newSet.has(moduleId)) {
          newSet.delete(moduleId);
        } else {
          newSet.clear();
          newSet.add(moduleId);
        }
        return newSet;
      });
    }
  };

  const toggleExercises = (moduleId: string) => {
    if (externalToggleExercises) {
      externalToggleExercises(moduleId);
    } else {
      setInternalExpandedExercises(prev => {
        const newSet = new Set(prev);
        if (newSet.has(moduleId)) {
          // If exercises are expanded, collapse them
          newSet.delete(moduleId);
        } else {
          // If exercises are not expanded, collapse others and expand only this
          newSet.clear();
          newSet.add(moduleId);
        }
        return newSet;
      });
    }
  };

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        // If exercise is already selected, deselect it
        newSet.delete(exerciseId);
      } else {
        // If exercise is not selected, deselect others and select only this
        newSet.clear();
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  const getStudentProgress = (studentId: string) => {
    const student = students.find(s => s._id === studentId);
    return student?.progress || 0;
  };



  // Functions to update local state when changes occur
  const updateStudentExercise = (exerciseId: string, updates: Partial<Exercise>) => {
    if (!selectedStudentId) return;
    
    setStudentData(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex._id === exerciseId ? { ...ex, ...updates } : ex
      )
    }));
  };

  const addStudentExercise = (newExercise: Exercise) => {
    if (!selectedStudentId) return;
    
    setStudentData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
  };

  const removeStudentExercise = (exerciseId: string) => {
    if (!selectedStudentId) return;
    
    setStudentData(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex._id !== exerciseId)
    }));
  };

  const refreshStudentData = async () => {
    if (!selectedStudentId || !course) return;
    
    try {
      const { courseApiService } = await import('../../services/courseApi');
      const [modulesData, exercisesData] = await Promise.all([
        courseApiService.getStudentModules(course._id, selectedStudentId),
        courseApiService.getStudentExercises(course._id, selectedStudentId)
      ]);
      setStudentData({ modules: modulesData, exercises: exercisesData });
    } catch (error) {
      console.error('Error refreshing student data:', error);
    }
  };

  // Wrapper functions that update local state and call original functions
  const handleExerciseCompletionChange = (exerciseId: string, completed: boolean, score?: number) => {
    // Update local state
    updateStudentExercise(exerciseId, {
      score: score !== undefined ? score : undefined,
      status: completed ? (score !== undefined ? 'reviewed' : 'completed') : 'pending'
    });
    
    // Call original function
    onExerciseCompletionChange?.(exerciseId, completed, score);
  };

  const handleExerciseStatusChange = (exerciseId: string, status: 'pending' | 'completed' | 'in_progress' | 'reviewed') => {
    // Update local state
    updateStudentExercise(exerciseId, { status });
    
    // Call original function
    onExerciseStatusChange?.(exerciseId, status);
  };

  const getOverallProgress = () => {
    if (!selectedStudentId) return 0;
    const student = students.find(s => s._id === selectedStudentId);
    return student?.progress || 0;
  };

  // Sort modules using linked list
  const sortedModules = React.useMemo(() => {
    return getSortedModules(modules);
  }, [modules]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with Dot Texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle, #64748b 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}></div>
        <div className="absolute inset-0 bg-white/50"></div>
      </div>

      <div className="relative z-10 p-0 sm:p-6">
        <div className="w-full sm:max-w-7xl sm:mx-auto">
        {/* Header with student filter */}
        <div className="mb-4 sm:mb-8">
          {/* Student filter */}
          <div className="bg-white rounded-none sm:rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Search Toggle Button */}
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                    showSearch 
                      ? 'text-blue-700 bg-blue-100 hover:bg-blue-200' 
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                  title="Search students"
                >
                  <Search className="h-5 w-5" />
                </button>
                
                {/* Dynamic Search Bar */}
                {showSearch && (
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={studentFilterQuery}
                        onChange={(e) => {
                          setStudentFilterQuery(e.target.value);
                          filterStudents(e.target.value);
                        }}
                        placeholder="Search student by name..."
                        className="w-64 pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          setStudentFilterQuery('');
                          filterStudents('');
                          setShowSearch(false);
                        }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onStudentSelect(null)}
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                      selectedStudentId === null
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  {filteredStudents.map((student) => (
                  <button
                    key={student._id}
                    onClick={() => onStudentSelect(student._id)}
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors truncate max-w-[120px] sm:max-w-none ${
                      selectedStudentId === student._id
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={student.name}
                  >
                    {student.name}
                  </button>
                ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive layout: modules on the left, exercises on the right */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Modules - Left side (small on desktop, full width on mobile) */}
          <div className="w-full lg:w-1/5">
            <div ref={modulesContainerRef} className="space-y-3">
              {sortedModules.map((module, index) => {
                const isExpanded = expandedModules.has(module._id);
                const moduleProgress = getModuleProgress(module, courseExercises, selectedStudentId);
                const exercises = getOrderedExercises(module._id, courseExercises, selectedStudentId, selectedStudentId ? studentData : undefined);

                return (
                  <div id={`module-${module._id}`} key={module._id} className="relative">
                    {/* Compact module */}
                    <div className={`bg-white border rounded-lg p-3 transition-all duration-200 ${
                      isExpanded 
                        ? 'border-blue-300 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">{module.title}</h3>
                          <p className="text-xs text-gray-500 mt-1 truncate">{module.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">{exercises.length} exercises</span>
                            <span className="text-xs text-gray-500">{getModuleEstimatedTime(module, courseExercises, selectedStudentId)}min</span>
                          </div>
                        </div>
                        
                        {/* Module options */}
                        <div className="flex items-center space-x-1 ml-2">
                          {/* Reorder buttons - Only when NO student is selected */}
                          {!selectedStudentId && onMoveModule && (
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={() => onMoveModule(module._id, 'up')}
                                disabled={index === 0}
                                className="w-6 h-6 bg-gray-400 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-colors text-xs"
                                title="Move module up"
                              >
                                ↑
                              </button>
                              <button
                                onClick={() => onMoveModule(module._id, 'down')}
                                disabled={index === sortedModules.length - 1}
                                className="w-6 h-6 bg-gray-400 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-colors text-xs"
                                title="Move module down"
                              >
                                ↓
                              </button>
                            </div>
                          )}
                          
                          {/* Edit/Delete module buttons - Only when NO student is selected */}
                          {!selectedStudentId && (onEditModule || onDeleteModule) && (
                            <div className="flex space-x-1">
                              {onEditModule && (
                                <button
                                  onClick={() => onEditModule(module)}
                                  className="w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors"
                                  title="Edit module"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              )}
                              {onDeleteModule && (
                                <button
                                  onClick={() => onDeleteModule(module._id)}
                                  className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                                  title="Delete module"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Expand/collapse button */}
                      <button
                        onClick={() => toggleModule(module._id)}
                        className="w-full mt-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {isExpanded ? 'Hide Exercises' : 'Show Exercises'}
                      </button>
                    </div>

                    {/* Mobile exercises - appear right after the module */}
                    {isExpanded && (
                      <div className="lg:hidden mt-3">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="mb-4">
                            <h4 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <span>{module.title} - Exercises</span>
                            </h4>
                          </div>

                          {exercises.length === 0 ? (
                            <p className="text-gray-500 italic">No exercises in this module</p>
                          ) : (
                            <div className="space-y-3">
                              {exercises.map((exercise, exIndex) => (
                                <div key={`${module._id}-${exercise._id}-${exIndex}`} className="flex items-center space-x-3">
                                  {/* Exercise */}
                                  <div className="flex-1">
                                    <ExerciseCard
                                      exercise={exercise}
                                      onClick={() => {
                                        toggleExerciseSelection(exercise._id);
                                        onExerciseClick?.(exercise._id);
                                      }}
                                      onView={() => onViewExercise?.(exercise._id)}
                                      onEdit={() => onEditExercise?.(exercise)}
                                      onDownload={() => onDownloadExercise?.(exercise._id)}
                                      onDelete={() => onDeleteExercise?.(exercise._id, course?._id || undefined, selectedStudentId || undefined, module._id)}
                                      onComplete={onCompleteExercise ? () => onCompleteExercise(exercise._id) : undefined}
                                      onCorrect={(newScore) => handleExerciseCompletionChange(exercise._id, true, newScore)}
                                      onChangeScore={(newScore) => handleExerciseStatusChange(exercise._id, 'reviewed')}
                                      selectedStudentId={selectedStudentId}
                                      showButtons={selectedExercises.has(exercise._id) && !!(onViewExercise || onEditExercise || onDownloadExercise || onDeleteExercise || onCompleteExercise || onCorrectExercise)}
                                    />
                                  </div>
                                  
                                  {/* Flecha de intercambio de ejercicios */}
                                  {exIndex < exercises.length - 1 && onMoveExercise && (
                                    <button
                                      onClick={() => onMoveExercise(exercise._id, 'down', module._id)}
                                      className="w-8 h-8 bg-gray-400 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors flex-shrink-0"
                                      title="Swap with next exercise"
                                    >
                                      <ArrowLeftRight className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              
                              {/* Add Exercise button */}
                              {onAddExercise && (
                                <button
                                  onClick={() => onAddExercise(module._id)}
                                  className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
                                >
                                  <Plus className="w-5 h-5" />
                                  <span>Add Exercise</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exercises - Right side (4/5 width on desktop, hidden on mobile) */}
          <div className="hidden lg:block w-full lg:w-4/5">
          {sortedModules.map((module) => {
            const isExpanded = expandedModules.has(module._id);
            const exercises = getOrderedExercises(module._id, courseExercises, selectedStudentId, selectedStudentId ? studentData : undefined);

              if (!isExpanded) return null;

              return (
                <div key={`exercises-${module._id}`} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span>{module.title} - Exercises</span>
                    </h4>
                  </div>

                  {exercises.length === 0 ? (
                    <p className="text-gray-500 italic">No exercises in this module</p>
                  ) : (
                    <div className="space-y-3">
                      {exercises.map((exercise, exIndex) => (
                        <div key={`${module._id}-${exercise._id}-${exIndex}`} className="flex items-center space-x-3">
                          {/* Exercise */}
                          <div className="flex-1">
                            <ExerciseCard
                              exercise={exercise}
                              onClick={() => {
                                toggleExerciseSelection(exercise._id);
                                onExerciseClick?.(exercise._id);
                              }}
                              selectedStudentId={selectedStudentId}
                              onView={onViewExercise ? () => onViewExercise(exercise._id) : undefined}
                              onEdit={onEditExercise ? () => onEditExercise(exercise) : undefined}
                              onDownload={onDownloadExercise ? () => onDownloadExercise(exercise._id) : undefined}
                              onDelete={onDeleteExercise ? () => onDeleteExercise(exercise._id, selectedStudentId ? course._id : undefined, selectedStudentId || undefined, exercise.studentModuleId) : undefined}
                              onComplete={onCompleteExercise ? () => onCompleteExercise(exercise._id) : undefined}
                              onCorrect={onCorrectExercise ? (newScore: number) => onCorrectExercise(exercise._id, newScore) : undefined}
                              onChangeScore={onChangeScoreExercise ? (newScore: number) => onChangeScoreExercise(exercise._id, newScore) : undefined}
                              showButtons={selectedExercises.has(exercise._id) && !!(onViewExercise || onEditExercise || onDownloadExercise || onDeleteExercise || onCompleteExercise || onCorrectExercise)}
                            />
                          </div>
                          
                          {/* Flecha de intercambio de ejercicios */}
                          {exIndex < exercises.length - 1 && onMoveExercise && (
                            <button
                              onClick={() => onMoveExercise(exercise._id, 'down', module._id)}
                              className="w-8 h-8 bg-gray-400 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors flex-shrink-0"
                              title="Swap with next exercise"
                            >
                              <ArrowLeftRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      
                      {/* Add Exercise Button - Al final de la lista */}
                      {onAddExercise && (
                        <div className="pt-3 border-t border-gray-200">
                          <button
                            onClick={() => onAddExercise(module._id)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                          >
                            <span className="text-lg">+</span>
                            <span>Add Exercise</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Module Card - Only show when no student is selected */}
        {!selectedStudentId && onAddModule && (
          <div className="mt-6">
            <div className="bg-green-50 border-2 border-dashed border-green-300 rounded-lg p-4 hover:bg-green-100 transition-colors cursor-pointer" onClick={onAddModule}>
              <div className="text-center">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-lg font-bold">+</span>
                </div>
                <h3 className="text-sm font-medium text-green-800 mb-1">Add Module</h3>
                <p className="text-green-600 text-xs">Click to add a new module</p>
              </div>
            </div>
          </div>
        )}

        {/* Message when there are no modules */}
        {sortedModules.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
            <p className="text-gray-500">This course doesn't have any modules yet.</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default CourseProgressView;
