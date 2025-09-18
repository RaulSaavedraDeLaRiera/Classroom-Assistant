import React from 'react';
import { LayoutTemplate, Plus } from 'lucide-react';

interface CourseCreationOptionsProps {
  onUseTemplate: () => void;
  onCreateFromScratch: () => void;
}

export const CourseCreationOptions: React.FC<CourseCreationOptionsProps> = ({
  onUseTemplate,
  onCreateFromScratch
}) => {
  return (
    <div className="mb-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Creation Method</h2>
        <p className="text-gray-600">Select how you'd like to start building your course</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Public Template Card */}
        <div
          onClick={onUseTemplate}
          className="group cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-8 hover:border-blue-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition-colors">
              <LayoutTemplate className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-blue-900 mb-3">Use Public Template</h3>
            <p className="text-blue-700 mb-4">Start with a pre-designed course template and customize it to your needs</p>
            <div className="text-sm text-blue-600 font-medium group-hover:text-blue-800">
              Browse Templates →
            </div>
          </div>
        </div>

        {/* Create from Scratch Card */}
        <div
          onClick={onCreateFromScratch}
          className="group cursor-pointer bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-8 hover:border-green-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 transition-colors">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-900 mb-3">Create from Scratch</h3>
            <p className="text-green-700 mb-4">Build your course completely from scratch with your own modules and content</p>
            <div className="text-sm text-green-600 font-medium group-hover:text-green-800">
              Start Building →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCreationOptions;
