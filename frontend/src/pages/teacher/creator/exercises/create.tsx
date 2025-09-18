import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import TeacherService from '../../../../services/teacher.service';
import ExerciseForm from '../../../../components/ExerciseForm';

export default function CreateExercisePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableModules, setAvailableModules] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'teacher') {
        router.push('/');
      } else {
        setIsAuthorized(true);
        loadAvailableModules();
      }
    }
  }, [user, isLoading, router]);

  const loadAvailableModules = async () => {
    try {
      const teacherService = TeacherService.getInstance();
      const modules = await teacherService.getTeacherModules();
      setAvailableModules(modules);
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  };

  const handleSubmit = async (exerciseData: any) => {
    try {
      setLoading(true);
      const teacherService = TeacherService.getInstance();
      
      const exerciseToCreate = {
        ...exerciseData,
        tags: exerciseData.tags,
        estimatedTime: Number(exerciseData.estimatedTime),
        teacherModuleId: exerciseData.teacherModuleId || undefined
      };

      await teacherService.createTeacherExercise(exerciseToCreate);
      router.push('/teacher/creator/exercises');
    } catch (error) {
      console.error('Error creating exercise:', error);
      alert('Error creating exercise. Please try again.');
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
            <h1 className="text-3xl font-bold text-gray-900">Create New Exercise</h1>
            <button
              onClick={() => router.push('/teacher/creator/exercises')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              <ArrowLeft className="w-4 h-4 mr-2 hidden sm:block" />
              <ArrowLeft className="w-3 h-3 sm:hidden" />
            </button>
          </div>

          <ExerciseForm
            exercise={undefined}
            isEditing={false}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/teacher/creator/exercises')}
            loading={loading}
            availableModules={availableModules}
            title="Create New Exercise"
            submitText="Create Exercise"
            showModuleAssignment={true}
          />
        </div>
      </div>
    </div>
  );
}
