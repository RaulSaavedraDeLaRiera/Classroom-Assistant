import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, CheckCircle, Play, Pause, Clock, Users, ChevronDown, ChevronRight, Bell, FileText, Timer, Search, X, ArrowUpDown, ArrowLeftRight } from 'lucide-react';
import ProgressIndicator from '../common/ProgressIndicator';
import StudentAvatar from '../common/StudentAvatar';
import ModuleCard from './ModuleCard';
import ExerciseCard from './ExerciseCard';
import StudentFilterBar from '../common/StudentFilterBar';
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
      
      if (!modulesContainerRef.current) return;
      
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

  // Loader reutilizable
  const loadStudentData = React.useCallback(async () => {
    if (!selectedStudentId || !course) {
      setStudentData({ modules: [], exercises: [] });
      return;
    }

    try {
      const { courseApiService } = await import('../../services/courseApi');
      const [modulesData, exercisesData] = await Promise.all([
        courseApiService.getStudentModules(course._id, selectedStudentId),
        courseApiService.getStudentExercises(course._id, selectedStudentId)
      ]);
      setStudentData({ modules: modulesData, exercises: exercisesData });
    } catch (error) {
      console.error('Error loading student data:', error);
      setStudentData({ modules: [], exercises: [] });
    }
  }, [selectedStudentId, course]);

  // Load on mount/selection change
  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  // Listen to forceRefresh to reload student data after external actions (e.g., add extra)
  useEffect(() => {
    const handler = () => {
      loadStudentData();
    };
    window.addEventListener('forceRefresh', handler as EventListener);
    return () => window.removeEventListener('forceRefresh', handler as EventListener);
  }, [loadStudentData]);


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
        // If exercise is selected, deselect it
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

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header with student filter */}
        <div className="mb-8">
          {/* Student filter */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
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
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onStudentSelect(null)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedStudentId === null
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Students
                  </button>
                  {filteredStudents.map((student) => (
                  <button
                    key={student._id}
                    onClick={() => onStudentSelect(student._id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedStudentId === student._id
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {student.name}
                  </button>
                ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modules with visual connection */}
        <div ref={modulesContainerRef} className="space-y-4">
          {sortedModules.map((module, index) => {
            const isExpanded = expandedModules.has(module._id);
            const exercisesExpanded = expandedExercises.has(module._id);
            const moduleProgress = getModuleProgress(module, courseExercises, selectedStudentId);
            const exercises = getOrderedExercises(module._id, courseExercises, selectedStudentId, selectedStudentId ? studentData : undefined);


            return (
              <React.Fragment key={module._id}>
                <div id={`module-${module._id}`} className="relative flex">
                  {/* Main module */}
                  <ModuleCard
                    module={module}
                    isExpanded={isExpanded}
                    selectedStudentId={selectedStudentId}
                    moduleProgress={moduleProgress}
                    moduleEstimatedTime={getModuleEstimatedTime(module, courseExercises, selectedStudentId)}
                    onToggle={() => toggleModule(module._id)}
                    onMoveUp={onMoveModule ? () => onMoveModule(module._id, 'up') : undefined}
                    onMoveDown={onMoveModule ? () => onMoveModule(module._id, 'down') : undefined}
                    canMoveUp={index > 0}
                    canMoveDown={index < sortedModules.length - 1}
                    showReorderButtons={false} // Disable buttons in ModuleCard
                    exercises={exercises}
                    onEdit={!selectedStudentId && onEditModule ? () => onEditModule(module) : undefined}
                    onDelete={!selectedStudentId && onDeleteModule ? () => onDeleteModule(module._id) : undefined}
                    showEditDeleteButtons={!selectedStudentId && !!(onEditModule && onDeleteModule)}
                  />

                  {/* Expanded exercises - to the right of the module */}
                  {isExpanded && (
                    <div className="flex-1 ml-4">
                      <div className="mb-4">
                        <h4 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span>Exercises</span>
                        </h4>
                      </div>

                      {exercises.length === 0 ? (
                        <p className="text-gray-500 italic">No exercises in this module</p>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2 max-w-full">
                          {exercises.map((exercise, exIndex) => (
                            <React.Fragment key={`${module._id}-${exercise._id}-${exIndex}`}>
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
                              
                              {/* Swap arrow between exercises */}
                              {exIndex < exercises.length - 1 && onMoveExercise && (
                                <button
                                  onClick={() => onMoveExercise(exercise._id, 'down', module._id)}
                                  className="w-6 h-6 bg-gray-400 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors"
                                  title="Swap with next exercise"
                                >
                                  <ArrowLeftRight className="w-3 h-3" />
                                </button>
                              )}
                            </React.Fragment>
                          ))}
                          
                          {/* Add Exercise Button - Green + button at the end of exercises */}
                          {onAddExercise && (
                            <div className="mt-3 flex justify-center">
                              <button
                                onClick={() => onAddExercise(module._id)}
                                className="bg-green-600 hover:bg-green-700 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold shadow-md hover:shadow-lg transition-all duration-200"
                                title="Add Exercise"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Swap arrow between modules - Only when no student selected */}
                {index < sortedModules.length - 1 && onMoveModule && !selectedStudentId && (
                  <div className="w-80 flex-shrink-0 min-w-[320px] flex justify-center my-2">
                    <button
                      onClick={() => onMoveModule?.(module._id, 'down')}
                      className="w-6 h-6 bg-gray-400 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors"
                      title="Swap with next module"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Add Module Card - Only show when no student is selected */}
        {!selectedStudentId && onAddModule && (
          <div className="mt-6">
            <div className="relative flex">
              <div className="w-80 flex-shrink-0 min-w-[320px]">
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
