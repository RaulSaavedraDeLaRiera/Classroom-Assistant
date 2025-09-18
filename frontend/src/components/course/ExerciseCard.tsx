import React from 'react';
import { Clock, Eye, Edit, Download, Trash2, CheckCircle, FileCheck, PenTool, Plus } from 'lucide-react';
import { useState } from 'react';

interface Exercise {
  _id: string;
  title: string;
  status: 'pending' | 'ready' | 'completed' | 'in_progress' | 'reviewed' | 'blocked';
  score?: number;
  maxScore?: number;
  completedAt?: string;
  estimatedTime?: number;
  isExtra?: boolean;
  courseExerciseId?: string;
}

interface ExerciseCardProps {
  exercise: Exercise;
  onClick: () => void;
  selectedStudentId?: string | null;
  onView?: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onComplete?: () => void;
  onCorrect?: (newScore: number) => void;
  onChangeScore?: (newScore: number) => void;
  showButtons?: boolean;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onClick,
  selectedStudentId,
  onView,
  onEdit,
  onDownload,
  onDelete,
  onComplete,
  onCorrect,
  onChangeScore,
  showButtons = false
}) => {
  const getStatusColor = (status: string) => {
    if (!selectedStudentId) {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reviewed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ready':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-gray-300 text-gray-900 border-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="relative">
      {/* Main exercise card */}
      <div
        className={`relative p-2 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md min-w-[120px] max-w-[150px] ring-1 ring-gray-200 ${
          getStatusColor(exercise.status)
        } ${selectedStudentId && !exercise.courseExerciseId ? 'pb-6' : ''}`}
        onClick={onClick}
      >
        {/* Extra Exercise Indicator - centered at card bottom, mobile-safe */}
        {selectedStudentId && !exercise.courseExerciseId && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <span className="bg-yellow-500 text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold block text-center">
              EXTRA
            </span>
          </div>
        )}
        
        {/* Title */}
        <div className="flex items-center justify-center space-x-1 mb-2">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
            !selectedStudentId ? 'bg-gray-400' :
            exercise.status === 'completed' ? 'bg-green-500' :
            exercise.status === 'in_progress' ? 'bg-blue-500' :
            exercise.status === 'reviewed' ? 'bg-purple-500' :
            exercise.status === 'ready' ? 'bg-gray-400' :
            exercise.status === 'blocked' ? 'bg-red-500' :
            exercise.status === 'pending' ? 'bg-gray-600' :
            'bg-gray-400'
          }`}></div>
          <div className="flex items-center justify-center flex-1 min-w-0">
            <h5 className="font-medium text-xs text-gray-900 line-clamp-2 leading-tight text-center">{exercise.title}</h5>
          </div>
        </div>
        
        {/* Duration and Score */}
        <div className="text-center space-y-1">
          {exercise.estimatedTime && (
            <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
              <Clock className="w-2 h-2" />
              <span className="text-xs">{exercise.estimatedTime}min</span>
            </div>
          )}
          
        </div>
      </div>

      {/* Action buttons in circular wheel */}
      {showButtons && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          {/* White background circle */}
          <div className="absolute w-24 h-24 bg-white rounded-full shadow-lg border-2 border-gray-200 z-50"></div>
          
          {/* Button circle */}
          <div className="relative w-20 h-20 flex items-center justify-center z-50">
            {/* Edit Button - All exercises in course view, only extra exercises in student view */}
            {onEdit && ((!selectedStudentId) || (selectedStudentId && !exercise.courseExerciseId)) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="absolute w-6 h-6 bg-gray-500 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-all duration-200 pointer-events-auto shadow-md hover:scale-110 z-50"
                style={{ transform: selectedStudentId && !exercise.courseExerciseId ? 'translate(0px, -10px)' : 'translate(-18px, -30px)' }}
                title="Edit exercise"
              >
                <Edit className="w-3 h-3" />
              </button>
            )}

            {/* Score Input Circle - Only when no student selected */}
            {onChangeScore && !selectedStudentId && (
              <ScoreInput 
                exercise={exercise} 
                onChangeScore={onChangeScore}
                position={{ transform: 'translate(18px, -30px)' }}
              />
            )}

            {/* Student Evaluate Button - Only when student is selected, positioned higher up */}
            {selectedStudentId && onComplete && (
              <UnifiedScoreButton 
                exercise={exercise} 
                onComplete={onComplete}
                onCorrect={onCorrect}
                position={{ transform: 'translate(0px, -40px)' }}
              />
            )}

            {/* View Button */}
            {onView && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                }}
                className="absolute w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-all duration-200 pointer-events-auto shadow-md hover:scale-110 z-50"
                style={{ transform: 'translate(-30px, 0px)' }}
                title="View exercise"
              >
                <Eye className="w-3 h-3" />
              </button>
            )}

            {/* download Button */}
            {onDownload && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
                className="absolute w-6 h-6 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-all duration-200 pointer-events-auto shadow-md hover:scale-110 z-50"
                style={{ transform: 'translate(30px, 0px)' }}
                title="Download PDF"
              >
                <Download className="w-3 h-3" />
              </button>
            )}

            {/* delete Button */}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="absolute w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all duration-200 pointer-events-auto shadow-md hover:scale-110 z-50"
                style={{ transform: 'translate(0px, 30px)' }}
                title="Delete exercise"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Component for expandable score input
interface ScoreInputProps {
  exercise: Exercise;
  onChangeScore: (newScore: number) => void;
  position: { transform: string };
}

const ScoreInput: React.FC<ScoreInputProps> = ({ exercise, onChangeScore, position }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempValue, setTempValue] = useState(String(exercise.maxScore || 10));

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
    setTempValue(String(exercise.maxScore || 10));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempValue(value);
  };

  const handleBlur = async () => {
    const numericValue = parseInt(tempValue);
    if (!isNaN(numericValue) && numericValue > 0 && numericValue !== exercise.maxScore) {
      try {
        await onChangeScore(numericValue);
        exercise.maxScore = numericValue;
      } catch (error) {
        console.error('Error updating score:', error);
        setTempValue(String(exercise.maxScore || 10));
      }
    }
    setIsExpanded(false);
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      await handleBlur();
    }
    if (e.key === 'Escape') {
      setTempValue(String(exercise.maxScore || 10));
      setIsExpanded(false);
    }
  };

  return (
    <div
      className={`absolute pointer-events-auto transition-all duration-200 z-50 ${
        isExpanded 
          ? 'w-12 h-7 bg-purple-100 border border-purple-300 rounded-full shadow-md flex items-center' 
          : 'w-6 h-6 bg-purple-500 hover:bg-purple-600 rounded-full shadow-sm hover:shadow-md'
      }`}
      style={position}
      title="Change maximum score"
    >
      {isExpanded ? (
        <input
          type="text"
          value={tempValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full text-[11px] text-center bg-transparent border-none outline-none text-purple-800 font-bold focus:outline-none focus:ring-0"
          placeholder="10"
          autoFocus
        />
      ) : (
        <button
          onClick={handleClick}
          className="w-full h-full flex items-center justify-center text-white font-bold text-xs"
        >
          {exercise.maxScore || 10}
        </button>
      )}
    </div>
  );
};

// Component for student score input (similar to ScoreInput but for student scoring)
interface StudentScoreInputProps {
  exercise: Exercise;
  onCorrect: (newScore: number) => void;
  position: { transform: string };
}

const StudentScoreInput: React.FC<StudentScoreInputProps> = ({ exercise, onCorrect, position }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempScore, setTempScore] = useState('');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
    setTempScore('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempScore(value);
  };

  const handleBlur = async () => {
    const numericScore = parseInt(tempScore);
    const maxScore = exercise.maxScore || 10;
    
    if (tempScore.trim() !== '' && !isNaN(numericScore) && numericScore >= 0 && numericScore <= maxScore) {
      try {
        await onCorrect(numericScore);
        exercise.score = numericScore;
        exercise.status = 'reviewed';
      } catch (error) {
        console.error('Error updating score:', error);
        setTempScore('');
      }
    } else {
      setTempScore('');
    }
    setIsExpanded(false);
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      await handleBlur();
    }
    if (e.key === 'Escape') {
      setTempScore('');
      setIsExpanded(false);
    }
  };

  const currentScore = exercise.score || 0;
  const maxScore = exercise.maxScore || 10;
  const hasScore = currentScore > 0;

  return (
        <div
          className={`absolute pointer-events-auto transition-all duration-200 z-50 ${
            isExpanded
              ? 'w-12 h-7 bg-purple-100 border border-purple-300 rounded-full shadow-md flex items-center'
              : 'w-6 h-6 bg-purple-500 hover:bg-purple-600 rounded-full shadow-sm hover:shadow-md'
          }`}
      style={position}
      title="Correct exercise"
    >
      {isExpanded ? (
        <>
          <input
            type="text"
            value={tempScore}
            onChange={(e) => setTempScore(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-7 h-full text-[11px] text-center bg-transparent border-none outline-none text-purple-800 font-bold focus:outline-none focus:ring-0"
            placeholder="0"
            autoFocus
          />
          <span className="text-[11px] text-purple-600 font-semibold px-1">/{maxScore}</span>
        </>
      ) : (
        <button
          onClick={handleClick}
          className="w-full h-full flex items-center justify-center text-white font-bold text-xs"
        >
          {hasScore ? currentScore : <PenTool className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
};

// Unified Score Button Component
interface UnifiedScoreButtonProps {
  exercise: Exercise;
  onComplete: () => void;
  onCorrect?: (newScore: number) => void;
  position: { transform: string };
}

const UnifiedScoreButton: React.FC<UnifiedScoreButtonProps> = ({ exercise, onComplete, onCorrect, position }) => {
  const hasScore = exercise.score !== undefined && exercise.score > 0;
  const isEvaluated = exercise.status === 'reviewed' || hasScore;
  const isExtra = !exercise.courseExerciseId;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onComplete();
      }}
      className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-white transition-all duration-200 pointer-events-auto shadow-md hover:scale-110 z-50 ${
        isEvaluated 
          ? 'bg-purple-500 hover:bg-purple-600' 
          : 'bg-yellow-500 hover:bg-yellow-600'
      }`}
      style={position}
      title={
        isEvaluated 
          ? `Evaluated: ${exercise.score}/${exercise.maxScore || 10}${isExtra ? ' (Extra - can change max score)' : ''}` 
          : `Grade & Evaluate${isExtra ? ' (Extra - can change max score)' : ''}`
      }
    >
      {isEvaluated ? (
        <span className="text-xs font-bold">{exercise.score}</span>
      ) : (
        <PenTool className="w-3 h-3" />
      )}
    </button>
  );
};

export default ExerciseCard;
