import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../hooks/useAuth';
import TemplatesService from '../../../../services/templates.service';

export default function CourseTemplatePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query; // Get the ID from URL if editing
  const isEditing = Boolean(id);
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    estimatedDuration: 0,
    isPublic: false,
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [availableModules, setAvailableModules] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [template, setTemplate] = useState<any>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/');
      } else {
        setIsAuthorized(true);
        loadAvailableModules();
        if (isEditing && id) {
      
          loadExistingTemplate(id as string);
        }
      }
    }
  }, [user, isLoading, router, isEditing, id]);

  // Update duration when availableModules are loaded and we have selected modules
  useEffect(() => {
    if (availableModules.length > 0 && selectedModules.length > 0 && isEditing) {
      updateDurationFromModules(selectedModules);
    }
  }, [availableModules, selectedModules, isEditing]);

  const loadAvailableModules = async () => {
    try {
      const templatesService = TemplatesService.getInstance();
      const modules = await templatesService.getTemplateModules();
      setAvailableModules(modules);
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  };

  const loadExistingTemplate = async (templateId: string) => {
    try {
  
      const templatesService = TemplatesService.getInstance();
      const templateData = await templatesService.getTemplateCourseById(templateId);
      
      
      
      if (templateData) {
        setTemplate(templateData);
        setFormData({
          title: templateData.title || '',
          description: templateData.description || '',
          estimatedDuration: templateData.estimatedDuration || 0,
          isPublic: templateData.isPublic || false,
          tags: templateData.tags?.join(', ') || ''
        });
        
        // Set selected modules if content exists
        if (templateData.content?.modules) {
          setSelectedModules(templateData.content.modules);
          // Don't call updateDurationFromModules here as availableModules might not be loaded yet
        }
      }
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Error loading template. Please try again.');
    }
  };

  const handleAddModule = (moduleId: string) => {
    // Allow adding the same module multiple times
    const newSelectedModules = [...selectedModules, moduleId];
    setSelectedModules(newSelectedModules);
    // Update duration with the new array
    updateDurationFromModules(newSelectedModules);
  };

  const handleRemoveModule = (index: number) => {
    const newSelectedModules = selectedModules.filter((_, i) => i !== index);
    setSelectedModules(newSelectedModules);
    // Update duration with the new array
    updateDurationFromModules(newSelectedModules);
  };

  const updateDurationFromModules = (modules: string[]) => {
    try {
      const totalDuration = modules.reduce((total, moduleId) => {
        const module = availableModules.find(m => m._id === moduleId);
        return total + (module?.estimatedDuration || 0);
      }, 0);
      
      // Round to nearest 0.1 for precision
      const roundedDuration = Math.round(totalDuration * 10) / 10;
      
      // Always update the duration when modules change
      setFormData(prev => ({ ...prev, estimatedDuration: roundedDuration }));
    } catch (error) {
      console.error('Error updating duration from modules:', error);
    }
  };

  const getCalculatedDuration = () => {
    const total = selectedModules.reduce((total, moduleId) => {
      const module = availableModules.find(m => m._id === moduleId);
      return total + (module?.estimatedDuration || 0);
    }, 0);
    return Math.round(total * 10) / 10; // Round to nearest 0.1
  };

  const filteredModules = availableModules.filter(module =>
    module.title.toLowerCase().includes(searchTerm.toLowerCase())
  );



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedModules.length === 0) {
      alert('Please select at least one module');
      return;
    }

    try {
      setLoading(true);
      
      const templatesService = TemplatesService.getInstance();
      
      const templateData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        estimatedDuration: Number(formData.estimatedDuration),
        content: { modules: selectedModules }
      };

      if (isEditing && id) {
        await templatesService.updateTemplateCourse(id as string, templateData);
      } else {
        await templatesService.createTemplateCourse(templateData);
      }
      
      router.push('/admin/templates');
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error creating template. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  if (isEditing && !template) {
    return <div className="min-h-screen flex items-center justify-center">Loading template...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Course Template' : 'Create Course Template'}
            </h1>
            <button
              onClick={() => router.push('/admin/templates')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Back to Templates
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter template name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter template description"
              />
            </div>

            <div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Modules
                    </label>
                                         <input
                       type="text"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       placeholder="Search by module name..."
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Modules
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {filteredModules.length === 0 ? (
                        <p className="text-gray-500 text-sm">No modules found</p>
                      ) : (
                        filteredModules.map((module) => (
                          <div
                            key={module._id}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div>
                              <p className="font-medium text-sm">{module.title}</p>
                              <p className="text-xs text-gray-600">{module.description}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddModule(module._id)}
                              className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 border border-blue-600 rounded hover:bg-blue-50"
                            >
                              Add
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                                     <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Selected Modules
                     </label>
                     <div className="border border-gray-300 rounded-md p-2 min-h-20">
                       {selectedModules.length === 0 ? (
                         <p className="text-gray-500 text-sm">No modules selected</p>
                       ) : (
                         selectedModules.map((moduleId, index) => {
                           const module = availableModules.find(m => m._id === moduleId);
                           return (
                             <div
                               key={`${moduleId}-${index}`}
                               className="flex items-center justify-between p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                             >
                               <div className="flex items-center space-x-2">
                                 <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                   {index + 1}
                                 </span>
                                 <div>
                                   <p className="font-medium text-sm">{module?.title || 'Unknown Module'}</p>
                                   <p className="text-xs text-gray-600">{module?.description || ''}</p>
                                 </div>
                               </div>
                                                            <div className="flex space-x-2">
                               <button
                                 type="button"
                                 onClick={() => handleRemoveModule(index)}
                                 className="text-red-600 hover:text-red-800 text-sm px-2 py-1 border border-red-600 rounded hover:bg-red-50"
                               >
                                 Remove
                               </button>
                             </div>
                             </div>
                           );
                         })
                       )}
                     </div>
                   </div>
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration (hours)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  min="0"
                  value={formData.estimatedDuration === 0 ? '' : formData.estimatedDuration.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty, integers, and decimals like 0.4, 1.5, etc.
                    if (value === '' || /^\d*\.?\d+$/.test(value)) {
                      setFormData({ ...formData, estimatedDuration: value === '' ? 0 : Number(value) });
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, estimatedDuration: getCalculatedDuration() }))}
                  className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded"
                  title="Reset to calculated duration"
                >
                  Reset
                </button>
              </div>
                             {selectedModules.length > 0 && formData.estimatedDuration !== getCalculatedDuration() && (
                 <div className="mt-2 text-sm text-gray-600">
                   <span className="font-medium">Total hours suggested:</span> {getCalculatedDuration().toString()}h
                 </div>
               )}
            </div>

                         

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Tags (comma-separated)
               </label>
                              <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="english, spanish, beginner, grammar, vocabulary"
                />
             </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                Make this template public
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded"
              >
                {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Template' : 'Create Template')}
              </button>
              <button
                type="button"
                onClick={() => router.push('/admin/templates')}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>


    </div>
  );
}
