import React, { useState } from 'react';
import { ArrowUpDown, GripVertical } from 'lucide-react';
import ModuleCard from './ModuleCard';

interface Exercise {
  _id: string;
  title: string;
  status: 'pending' | 'completed' | 'in_progress' | 'reviewed';
  score?: number;
  maxScore?: number;
  completedAt?: string;
}

interface Module {
  _id: string;
  title: string;
  description: string;
  estimatedTime: number;
  status: 'active' | 'inactive';
  exercises: Exercise[];
  order?: number;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  enrollmentId?: string;
  progress?: number;
}

interface DraggableModuleProps {
  module: Module;
  index: number;
  isStudentView: boolean;
  selectedStudentId: string | null;
  students: Student[];
  onModuleClick: (moduleId: string) => void;
  onModuleStatusChange: (moduleId: string, status: 'active' | 'inactive') => void;
  onExerciseClick: (exerciseId: string) => void;
  onExerciseStatusChange: (exerciseId: string, status: string) => void;
  onExerciseCompletionChange: (exerciseId: string, completed: boolean, score?: number) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  isDragging?: boolean;
}

export const DraggableModule: React.FC<DraggableModuleProps> = ({
  module,
  index,
  isStudentView,
  selectedStudentId,
  students,
  onModuleClick,
  onModuleStatusChange,
  onExerciseClick,
  onExerciseStatusChange,
  onExerciseCompletionChange,
  onMove,
  isDragging = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ index, module }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.index !== index) {
        onMove(data.index, index);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const getStudentProgress = (studentId: string) => {
    const student = students.find(s => s._id === studentId);
    return student?.progress || 0;
  };

  const getStudentLastExercise = (studentId: string) => {
    // This would typically come from the student's data
    // For now, we'll return a placeholder
    return undefined;
  };

  const exercises = module.exercises || [];
  const studentProgress = selectedStudentId ? {
    completedExercises: exercises.filter(e => e.status === 'completed').length,
    totalExercises: exercises.length,
    lastExercise: getStudentLastExercise(selectedStudentId)
  } : undefined;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        transition-all duration-200
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${dragOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
      `}
    >
      <div className="flex items-start space-x-3">
        {/* Drag Handle */}
        <div className="flex-shrink-0 pt-4">
          <div className="w-6 h-6 text-gray-400 hover:text-gray-600 cursor-move">
            <GripVertical className="w-full h-full" />
          </div>
        </div>

        {/* Module Card */}
        <div className="flex-1">
          <ModuleCard
            module={module}
            isExpanded={isExpanded}
            selectedStudentId={selectedStudentId}
            moduleProgress={getStudentProgress(selectedStudentId || '')}
            onToggle={() => setIsExpanded(!isExpanded)}
            exercises={module.exercises}
            showEditDeleteButtons={false}
          />
        </div>
      </div>
    </div>
  );
};

export default DraggableModule;
