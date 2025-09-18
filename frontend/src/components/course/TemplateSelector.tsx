import React from 'react';

interface TemplateCourse {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  estimatedDuration: number;
  modules: any[];
  isPublic: boolean;
  content?: {
    modules: string[];
  };
}

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  templates: TemplateCourse[];
  loadingTemplates: boolean;
  onSelectTemplate: (template: TemplateCourse) => void;
  loadingTemplateModules: boolean;
  templateModuleDetails: {[key: string]: any[]};
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  templates,
  loadingTemplates,
  onSelectTemplate,
  loadingTemplateModules,
  templateModuleDetails
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Select Public Template</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        {loadingTemplates ? (
          <div className="text-center py-8">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No public templates available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div
                key={template._id}
                className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900 mb-2">{template.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500 font-medium">
                    Course Duration: {template.estimatedDuration || 0} hours
                  </span>
                </div>
              
                {/* Show calculated total time from modules */}
                {template.content?.modules && template.content.modules.length > 0 && templateModuleDetails[template._id] && (
                  <div className="text-xs text-gray-600 mb-2">
                    Modules included: {template.content.modules.length} module{template.content.modules.length !== 1 ? 's' : ''}
                  </div>
                )}
                 {template.tags && template.tags.length > 0 && (
                 <div className="flex flex-wrap gap-1">
                   {template.tags.slice(0, 3).map((tag, index) => (
                     <span key={index} className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                       {tag}
                     </span>
                   ))}
                   {template.tags.length > 3 && (
                     <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                       +{template.tags.length - 3} more
                     </span>
                   )}
                 </div>
               )}
               
               {/* Show template modules preview */}
               {template.content?.modules && template.content.modules.length > 0 && (
                 <div className="mt-3 p-2 bg-gray-50 rounded border">
                   <div className="text-xs font-medium text-gray-700 mb-2">Template Modules:</div>
                   <div className="space-y-1">
                     {templateModuleDetails[template._id] ? (
                       templateModuleDetails[template._id].slice(0, 3).map((module, index) => (
                         <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                           <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                           <span className="font-medium">{module.title}</span>
                           <span className="text-gray-500">
                             ({Math.round(module.estimatedTime || 0)} min)
                           </span>
                         </div>
                       ))
                     ) : (
                       template.content.modules.slice(0, 3).map((moduleId, index) => (
                         <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                           <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                           <span>Module {index + 1}</span>
                         </div>
                       ))
                     )}
                     {template.content.modules.length > 3 && (
                       <div className="text-xs text-gray-500 italic">
                         +{template.content.modules.length - 3} more modules
                       </div>
                     )}
                   </div>
                 </div>
               )}
               
               {/* Clickable area to select template */}
               <div 
                 onClick={() => onSelectTemplate(template)}
                 className="mt-4 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-center"
               >
                 {loadingTemplateModules ? 'Loading...' : 'Click to Use This Template'}
               </div>
             </div>
           ))}
         </div>
       )}
       
       <div className="mt-6 flex justify-end">
         <button
           onClick={onClose}
           className="px-4 py-2 text-gray-600 hover:text-gray-800"
         >
           Cancel
         </button>
       </div>
     </div>
   </div>
 );
};

export default TemplateSelector;
