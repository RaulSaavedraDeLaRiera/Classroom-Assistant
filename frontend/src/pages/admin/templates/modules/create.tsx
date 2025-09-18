import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../hooks/useAuth';
import TemplatesService from '../../../../services/templates.service';
import ModuleForm from '../../../../components/ModuleForm';

export default function ModuleTemplatePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query; // Get the ID from URL if editing
  const isEditing = Boolean(id);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<any>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/');
      } else {
        setIsAuthorized(true);
        if (isEditing && id) {
          loadExistingTemplate(id as string);
        }
      }
    }
  }, [user, isLoading, router]);

  const loadExistingTemplate = async (templateId: string) => {
    try {
      const templatesService = TemplatesService.getInstance();
      const templateData = await templatesService.getTemplateModuleById(templateId);
      
      if (templateData) {
        setTemplate(templateData);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Error loading template. Please try again.');
    }
  };

  const handleSubmit = async (moduleData: any) => {
    try {
      setLoading(true);
      
      const templatesService = TemplatesService.getInstance();
      
      const templateData = {
        ...moduleData,
        tags: moduleData.tags,
        estimatedTime: moduleData.estimatedTime, // Use estimatedTime in minutes
        content: { exercises: moduleData.content.exercises }
      };

      if (isEditing && id) {
        await templatesService.updateTemplateModule(id as string, templateData);
      } else {
        await templatesService.createTemplateModule(templateData);
      }
      
      router.push('/admin/templates?tab=modules');
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Module Template' : 'Create Module Template'}
            </h1>
            <button
              onClick={() => router.push('/admin/templates')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Back to Templates
            </button>
          </div>

          <ModuleForm
            moduleId={id as string}
            initialData={template}
            onSave={handleSubmit}
            onCancel={() => router.push('/admin/templates')}
            context="admin"
          />
        </div>
      </div>
    </div>
  );
}
