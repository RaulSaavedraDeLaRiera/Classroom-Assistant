import React from 'react';
import { BookOpen, Clock, FileText, CheckCircle, Edit, Trash2 } from 'lucide-react';
import ProgressIndicator from '../common/ProgressIndicator';

interface Exercise {
  _id: string;
  title: string;
  status: 'pending' | 'completed' | 'in_progress' | 'reviewed';
  score?: number;
  maxScore?: number;
  completedAt?: string;
  estimatedTime?: number;
}

interface Module {
  _id: string;
  title: string;
  description: string;
  estimatedTime: number;
  status: string;
  exercises?: Exercise[];
  content?: {
    exercises: Exercise[];
  };
  order?: number;
}

interface ModuleCardProps {
  module: Module;
  isExpanded: boolean;
  selectedStudentId: string | null;
  moduleProgress: number;
  moduleEstimatedTime?: number;
  onToggle: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  showReorderButtons?: boolean;
  exercises?: Exercise[];
  onEdit?: () => void;
  onDelete?: () => void;
  showEditDeleteButtons?: boolean;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  isExpanded,
  selectedStudentId,
  moduleProgress,
  moduleEstimatedTime,
  onToggle,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  showReorderButtons = false,
  exercises: propExercises,
  onEdit,
  onDelete,
  showEditDeleteButtons = false
}) => {
  const exercises = propExercises || module.exercises || module.content?.exercises || [];

  return (
    <div className="w-80 flex-shrink-0 min-w-[320px]">
      <div className={`rounded-lg border shadow-md hover:shadow-lg transition-all duration-200 ${
        isExpanded 
          ? 'bg-blue-50 border-blue-300 shadow-lg ring-2 ring-blue-200' 
          : 'bg-white border-gray-200 ring-1 ring-gray-200'
      }`}>
        {/* Module header */}
        <div 
          className="p-4 cursor-pointer"
          onClick={onToggle}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Module icon */}
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              
              <div className="flex-1">
                <h3 className={`font-semibold text-gray-900 ${
                  selectedStudentId ? 'text-base' : 'text-lg'
                }`}>
                  {module.title}
                </h3>
                <p className={`text-gray-600 mt-1 line-clamp-2 ${
                  selectedStudentId ? 'text-xs' : 'text-sm'
                }`}>
                  {module.description}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Edit/Delete buttons - only when expanded and no student selected */}
              {showEditDeleteButtons && isExpanded && !selectedStudentId && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.();
                    }}
                    className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors"
                    title="Edit module"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.();
                    }}
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                    title="Delete module"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Module progress */}
              {selectedStudentId && (
                <div className="flex items-center space-x-2 min-w-[80px]">
                  <ProgressIndicator
                    progress={moduleProgress}
                    size="sm"
                    showPercentage={false}
                    color="green"
                  />
                  <span className="text-xs font-medium text-gray-700">
                    {Math.round(moduleProgress)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Module stats */}
          <div className={`mt-3 flex items-center space-x-4 text-gray-500 ${
            selectedStudentId ? 'text-xs space-x-4' : 'text-sm space-x-6'
          }`}>
            <div className="flex items-center space-x-1">
              <Clock className={selectedStudentId ? 'w-3 h-3' : 'w-4 h-4'} />
              <span>{moduleEstimatedTime !== undefined ? moduleEstimatedTime : module.estimatedTime}min</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className={selectedStudentId ? 'w-3 h-3' : 'w-4 h-4'} />
              <span>{exercises.length} exercises</span>
            </div>
            {selectedStudentId && (
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>{exercises.filter(e => e.status === 'completed' || e.status === 'reviewed').length} completed</span>
              </div>
            )}
          </div>
        </div>

        {/* Reorder point only if there is a next module */}
        {showReorderButtons && onMoveDown && canMoveDown && (
          <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              className="w-6 h-6 bg-gray-400 hover:bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold transition-colors"
              title="Swap with next module"
            >
              •
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleCard;