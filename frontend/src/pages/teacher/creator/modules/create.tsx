import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import TeacherService from '../../../../services/teacher.service';
import ModuleForm from '../../../../components/ModuleForm';

export default function CreateModulePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'teacher') {
        router.push('/');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (moduleData: any) => {
    try {
      setLoading(true);
      const teacherService = TeacherService.getInstance();
      
      const moduleToCreate = {
        ...moduleData,
        tags: moduleData.tags,
        order: Number(moduleData.order) || 1
      };

      await teacherService.createTeacherModule(moduleToCreate);
      router.push('/teacher/creator/modules');
    } catch (error) {
      console.error('Error creating module:', error);
      alert('Error creating module. Please try again.');
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Create New Module</h1>
            <button
              onClick={() => router.push('/teacher/creator/modules')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              <ArrowLeft className="w-4 h-4 mr-2 hidden sm:block" />
              <ArrowLeft className="w-3 h-3 sm:hidden" />
            </button>
          </div>

          <ModuleForm
            initialData={undefined}
            onSave={handleSubmit}
            onCancel={() => router.push('/teacher/creator/modules')}
            context="teacher"
          />
        </div>
      </div>
    </div>
  );
}
