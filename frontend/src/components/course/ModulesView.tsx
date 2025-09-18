import React, { useState, useEffect } from 'react';
import DraggableModule from './DraggableModule';
import { Plus } from 'lucide-react';

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

interface ModulesViewProps {
  modules: Module[];
  selectedStudentId: string | null;
  onModuleReorder: (dragIndex: number, hoverIndex: number) => void;
  onExerciseReorder: (moduleId: string, dragIndex: number, hoverIndex: number) => void;
  onModuleClick: (moduleId: string) => void;
  onExerciseClick: (exerciseId: string) => void;
  onModuleStatusChange: (moduleId: string, status: 'active' | 'inactive') => void;
  onExerciseStatusChange: (exerciseId: string, status: string) => void;
  onExerciseCompletionChange: (exerciseId: string, completed: boolean, score?: number) => void;
  onAddModule: () => void;
  isStudentView?: boolean;
  students?: Student[];
}


export const ModulesView: React.FC<ModulesViewProps> = ({
  modules,
  selectedStudentId,
  onModuleReorder,
  onExerciseReorder,
  onModuleClick,
  onExerciseClick,
  onModuleStatusChange,
  onExerciseStatusChange,
  onExerciseCompletionChange,
  onAddModule,
  isStudentView = false,
  students = []
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleModuleToggle = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        // If the module is already expanded, collapse it
        newSet.delete(moduleId);
      } else {
        // If the module is not expanded, collapse others and expand only this
        newSet.clear();
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const sortedModules = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Course Modules</h2>
          <p className="text-gray-600">
            {selectedStudentId 
              ? `Viewing progress for ${students.find(s => s._id === selectedStudentId)?.name || 'selected student'}`
              : 'Manage course modules and exercises'
            }
          </p>
        </div>
        
        {!isStudentView && (
          <button
            onClick={onAddModule}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Module</span>
          </button>
        )}
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {sortedModules.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No modules yet</h3>
            <p className="text-gray-500 mb-4">Start by adding your first module to the course</p>
            {!isStudentView && (
              <button
                onClick={onAddModule}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add First Module
              </button>
            )}
          </div>
        ) : (
          sortedModules.map((module, index) => (
            <DraggableModule
              key={module._id}
              module={module}
              index={index}
              isStudentView={isStudentView}
              selectedStudentId={selectedStudentId}
              students={students}
              onModuleClick={onModuleClick}
              onModuleStatusChange={onModuleStatusChange}
              onExerciseClick={onExerciseClick}
              onExerciseStatusChange={onExerciseStatusChange}
              onExerciseCompletionChange={onExerciseCompletionChange}
              onMove={onModuleReorder}
              isDragging={draggedIndex === index}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ModulesView;
