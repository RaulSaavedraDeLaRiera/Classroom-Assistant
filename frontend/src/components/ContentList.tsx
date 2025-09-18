import React, { useState } from 'react';
import { downloadExercisePDF } from '../utils/pdfGenerator';
import ContentModal from './ContentModal';

interface ContentListProps {
  items: any[];
  type: 'modules' | 'exercises';
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  allTags: string[];
  selectedTagFilter: string;
  onFilterChange: (tag: string) => void;
  onViewExercises?: (module: any) => void; // Add optional prop for viewing module exercises
}

export default function ContentList({
  items,
  type,
  loading,
  onEdit,
  onDelete,
  onCreate,
  allTags,
  selectedTagFilter,
  onFilterChange,
  onViewExercises
}: ContentListProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const renderTags = (tags: string[]) => {
    if (!tags || tags.length === 0) return <span className="text-gray-400">No tags</span>;
    
    return (
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  const renderItem = (item: any) => {
    if (type === 'modules') {
      const exerciseCount = item.content?.exercises?.length || 0;
      
      return (
        <div key={item._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="text-gray-600 mt-1">{item.description}</p>
              <div className="flex space-x-4 mt-3 text-sm text-gray-500">
                <span>Order: {item.order}</span>
                <span>Status: {item.status}</span>
                <span>Exercises: {exerciseCount}</span>
                <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-2">
                {renderTags(item.tags)}
              </div>
            </div>
            <div className="flex flex-col space-y-2 items-end">
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(item._id)}
                  className="text-green-600 hover:text-green-800 px-3 py-1 border border-green-600 rounded hover:bg-green-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(item._id)}
                  className="text-red-600 hover:text-red-800 px-3 py-1 border border-red-600 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
              {onViewExercises && exerciseCount > 0 && (
                <button
                  onClick={() => onViewExercises(item)}
                  className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-600 rounded hover:bg-blue-50"
                  title="View exercises in this module"
                >
                  View Exercises ({exerciseCount})
                </button>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div key={item._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="text-gray-600 mt-1">{item.description}</p>
              <div className="flex space-x-4 mt-3 text-sm text-gray-500">
                <span>Type: {item.type}</span>
                <span>Difficulty: {item.difficulty}</span>
                <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-2">
                {renderTags(item.tags)}
              </div>
            </div>
            <div className="flex flex-col space-y-2 items-end">
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(item._id)}
                  className="text-green-600 hover:text-green-800 px-3 py-1 border border-green-600 rounded hover:bg-green-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(item._id)}
                  className="text-red-600 hover:text-red-800 px-3 py-1 border border-red-600 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    // Use the item data directly
                    setSelectedItem(item);
                    setIsModalOpen(true);
                  }}
                  className="text-purple-600 hover:text-purple-800 px-3 py-1 border border-purple-600 rounded hover:bg-purple-50"
                  title="View content in full screen"
                >
                  View Content
                </button>
                <button
                  onClick={() => {
                    // Use the content from the item directly
                    const exerciseData = {
                      title: item.title,
                      content: item.content || item.description || 'No content available',
                      type: item.type,
                      difficulty: item.difficulty,
                      estimatedTime: item.estimatedTime || 10,
                      maxScore: item.maxScore || 10,
                      description: item.description
                    };
                    
                    downloadExercisePDF(exerciseData, {
                      includeMetadata: true,
                      includeInstructions: true
                    });
                  }}
                  className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-600 rounded hover:bg-blue-50"
                  title="Download exercise as PDF"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading content...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg mb-2">No {type} found</p>
        <p className="text-sm">Create your first {type.slice(0, -1)} to get started!</p>
        <button
          onClick={onCreate}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Create Your First {type.slice(0, -1).charAt(0).toUpperCase() + type.slice(0, -1).slice(1)}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map(renderItem)}
      
      {/* Content Modal */}
      {selectedItem && (
        <ContentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          content={selectedItem.content || selectedItem.description || 'No content available'}
          title={selectedItem.title}
          type={type === 'exercises' ? 'exercise' : 'module'}
        />
      )}
    </div>
  );
}
