import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import TeacherService from '../../../../services/teacher.service';
import ModuleForm from '../../../../components/ModuleForm';

export default function EditModulePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [module, setModule] = useState<any>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'teacher') {
        router.push('/');
      } else {
        setIsAuthorized(true);
        if (id) {
          loadModule();
        }
      }
    }
  }, [user, isLoading, router, id]);

  const loadModule = async () => {
    try {
      const teacherService = TeacherService.getInstance();
      const moduleData = await teacherService.getTeacherModuleById(id as string);
      setModule(moduleData);
    } catch (error) {
      console.error('Error loading module:', error);
      alert('Error loading module. Please try again.');
      router.push('/teacher/creator/modules');
    }
  };

  const handleSubmit = async (moduleData: any) => {
    try {
      setLoading(true);
      const teacherService = TeacherService.getInstance();
      
      const moduleToUpdate = {
        ...moduleData,
        tags: moduleData.tags,
        order: Number(moduleData.order) || 1
      };

      await teacherService.updateTeacherModule(id as string, moduleToUpdate);
      router.push('/teacher/creator/modules');
    } catch (error) {
      console.error('Error updating module:', error);
      alert('Error updating module. Please try again.');
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

  if (!module) {
    return <div className="min-h-screen flex items-center justify-center">Loading module...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Edit Module</h1>
            <button
              onClick={() => router.push('/teacher/creator/modules')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              <ArrowLeft className="w-4 h-4 mr-2 hidden sm:block" />
              <ArrowLeft className="w-3 h-3 sm:hidden" />
            </button>
          </div>

          <ModuleForm
            moduleId={id as string}
            initialData={module}
            onSave={handleSubmit}
            onCancel={() => router.push('/teacher/creator?tab=modules')}
            context="teacher"
          />
        </div>
      </div>
    </div>
  );
}
