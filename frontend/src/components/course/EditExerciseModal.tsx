import React, { useState } from 'react';
import ExerciseContentEditor from './ExerciseContentEditor';

interface EditExerciseModalProps {
  isOpen: boolean;
  exerciseId: string | null;
  onClose: () => void;
  onSave: () => void;
  formData: {
    title: string;
    content: string;
    type: string;
    estimatedTime: number;
    difficulty: string;
    tags: string[];
  };
  onFormDataChange: (data: any) => void;
}

export default function EditExerciseModal({ 
  isOpen, 
  exerciseId,
  onClose, 
  onSave,
  formData,
  onFormDataChange
}: EditExerciseModalProps) {
  const [showContentEditor, setShowContentEditor] = useState(false);

  if (!isOpen || !exerciseId) return null;

  const handleContentSave = () => {
    setShowContentEditor(false);
  };

  const handleContentCancel = () => {
    setShowContentEditor(false);
  };

  if (showContentEditor) {
    return (
      <ExerciseContentEditor
        content={formData.content}
        onChange={(content) => onFormDataChange({...formData, content})}
        onSave={handleContentSave}
        onCancel={handleContentCancel}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h3 className="text-lg font-semibold mb-4">Edit Exercise</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Exercise Title"
            value={formData.title}
            onChange={(e) => onFormDataChange({...formData, title: e.target.value})}
            className="w-full p-2 border rounded"
          />
          
          {/* Content Editor Button */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <button
              onClick={() => setShowContentEditor(true)}
              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-left hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="text-sm text-gray-600">
                {formData.content ? 'Click to edit content...' : 'Click to add content...'}
              </div>
              {formData.content && (
                <div className="text-xs text-gray-500 mt-1 truncate">
                  {formData.content.substring(0, 100)}
                  {formData.content.length > 100 ? '...' : ''}
                </div>
              )}
            </button>
          </div>

          <select
            value={formData.type}
            onChange={(e) => onFormDataChange({...formData, type: e.target.value})}
            className="w-full p-2 border rounded"
          >
            <option value="quiz">Quiz</option>
            <option value="writing">Writing</option>
            <option value="reading">Reading</option>
            <option value="listening">Listening</option>
            <option value="speaking">Speaking</option>
          </select>
          <input
            type="number"
            placeholder="Estimated Time (minutes)"
            value={formData.estimatedTime}
            onChange={(e) => onFormDataChange({...formData, estimatedTime: parseInt(e.target.value)})}
            className="w-full p-2 border rounded"
          />
          <select
            value={formData.difficulty}
            onChange={(e) => onFormDataChange({...formData, difficulty: e.target.value})}
            className="w-full p-2 border rounded"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div className="flex space-x-2 mt-6">
          <button
            onClick={onSave}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
