import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../hooks/useAuth';
import TemplatesService from '../../../../services/templates.service';
import ExerciseForm from '../../../../components/ExerciseForm';

export default function ExerciseTemplatePage() {
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
  }, [user, isLoading, router, isEditing, id]);

  const loadExistingTemplate = async (templateId: string) => {
    try {
      const templatesService = TemplatesService.getInstance();
      const templateData = await templatesService.getTemplateExerciseById(templateId);
      
      if (templateData) {
        setTemplate(templateData);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Error loading template. Please try again.');
    }
  };

  const handleSubmit = async (exerciseData: any) => {
    try {
      setLoading(true);

      const templatesService = TemplatesService.getInstance();
      
      const templateData = {
        ...exerciseData,
        tags: exerciseData.tags,
        estimatedTime: Number(exerciseData.estimatedTime),
        estimatedScore: 50, // Default value for admin templates
        templateModuleId: undefined // No requerido para templates de admin
      };

      if (isEditing && id) {
        await templatesService.updateTemplateExercise(id as string, templateData);
      } else {
        await templatesService.createTemplateExercise(templateData);
      }
       
      router.push('/admin/templates?tab=exercises');
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
              {isEditing ? 'Edit Exercise Template' : 'Create Exercise Template'}
            </h1>
            <button
              onClick={() => router.push('/admin/templates')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Back to Templates
            </button>
          </div>

          <ExerciseForm
            exercise={template}
            isEditing={isEditing}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/admin/templates')}
            loading={loading}
            title="Exercise Template Form"
            submitText={isEditing ? 'Update Template' : 'Create Template'}
          />
        </div>
      </div>
    </div>
  );
}
