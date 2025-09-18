import { useState } from 'react';

interface TemplateSelectorProps {
  onSelectMethod: (method: 'scratch' | 'own' | 'admin') => void;
  onSelectTemplate: (template: any, type: 'own' | 'admin') => void;
  ownTemplates: any[];
  adminTemplates: any[];
  isVisible: boolean;
  onClose: () => void;
}

export default function TemplateSelector({
  onSelectMethod,
  onSelectTemplate,
  ownTemplates,
  adminTemplates,
  isVisible,
  onClose
}: TemplateSelectorProps) {
  const [templateType, setTemplateType] = useState<'own' | 'admin'>('admin');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  if (!isVisible) return null;

  const handleMethodSelect = (method: 'scratch' | 'own' | 'admin') => {
    if (method === 'scratch') {
      onSelectMethod('scratch');
    } else {
      setTemplateType(method);
    }
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
  };

  const handleConfirmTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate, templateType);
      setSelectedTemplate(null);
    }
  };

  const renderTemplateList = (templates: any[], type: 'own' | 'admin') => {
    if (templates.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No {type === 'own' ? 'own' : 'admin'} templates available</p>
        </div>
      );
    }

    return (
      <div className="max-h-60 overflow-y-auto space-y-2">
        {templates.map((template) => (
          <div
            key={template._id}
            onClick={() => handleTemplateSelect(template)}
            className={`p-3 border rounded-lg cursor-pointer ${
              selectedTemplate?._id === template._id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="font-medium">{template.title}</div>
            <div className="text-sm text-gray-600">
              {template.description || template.content?.substring(0, 100) || 'No description'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {template.estimatedDuration && `Duration: ${template.estimatedDuration}h | `}
              {template.type && `Type: ${template.type} | `}
              {template.difficulty && `Difficulty: ${template.difficulty} | `}
              {template.estimatedTime && `Time: ${template.estimatedTime}min | `}
              Tags: {template.tags?.join(', ') || 'None'}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-900 mb-3">Choose Creation Method</h3>
      
      {/* Method Selection Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <button
          onClick={() => handleMethodSelect('scratch')}
          className="p-3 rounded-lg border-2 text-center border-blue-500 bg-blue-100 text-blue-900 hover:bg-blue-200"
        >
          <div className="font-medium">Create from Scratch</div>
          <div className="text-sm text-blue-600">Start with empty content</div>
        </button>
        
        <button
          onClick={() => handleMethodSelect('own')}
          className={`p-3 rounded-lg border-2 text-center ${
            templateType === 'own'
              ? 'border-green-500 bg-green-100 text-green-900' 
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="font-medium">Copy from Own</div>
          <div className="text-sm text-gray-600">Use your existing content</div>
        </button>
        
        <button
          onClick={() => handleMethodSelect('admin')}
          className={`p-3 rounded-lg border-2 text-center ${
            templateType === 'admin'
              ? 'border-purple-500 bg-purple-100 text-purple-900' 
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="font-medium">Copy from Admin</div>
          <div className="text-sm text-gray-600">Use public templates</div>
        </button>
      </div>

      {/* Template Selector */}
      {(templateType === 'own' || templateType === 'admin') && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold">
              Select {templateType === 'own' ? 'Own' : 'Admin'} Template
            </h4>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          
          {renderTemplateList(
            templateType === 'own' ? ownTemplates : adminTemplates,
            templateType
          )}
          
          {selectedTemplate && (
            <div className="mt-3 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-3 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Copy Template
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
