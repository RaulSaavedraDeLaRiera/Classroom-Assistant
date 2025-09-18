import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import Cookies from 'js-cookie';
import { BookOpen, Edit3, Users } from 'lucide-react';
import { DashboardCard, PageHeader, DashboardContainer } from '../components/layout';


export default function TeacherPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [lastSelection, setLastSelection] = useState<'courses' | 'creator' | 'students'>('courses');

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'teacher') {
        router.push('/');
      } else {
        setIsAuthorized(true);
        const savedSelection = Cookies.get('teacher_last_selection');
        if (savedSelection && (savedSelection === 'courses' || savedSelection === 'creator' || savedSelection === 'students')) {
          setLastSelection(savedSelection);
        }
      }
    }
  }, [user, isLoading, router]);

  const handleSelection = (selection: 'courses' | 'creator' | 'students') => {
    setLastSelection(selection);
    Cookies.set('teacher_last_selection', selection, { expires: 30 });
    router.push(selection === 'courses' ? '/teacher/courses' : selection === 'creator' ? '/teacher/creator' : '/teacher/students');
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with Dot Texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle, #64748b 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}></div>
        <div className="absolute inset-0 bg-white/50"></div>
      </div>

      <div className="relative z-10">
      <PageHeader
        title="Teacher Dashboard"
        subtitle="Manage your courses and create educational content"
        titleGradient="from-blue-600 to-purple-600"
        showLogout={true}
      />

      <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4 lg:flex-col lg:space-y-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-20 lg:py-16">
        <div className="w-full lg:w-full lg:max-w-7xl lg:mx-auto lg:h-auto" style={{flex: '4'}}>
          <div className="h-full lg:h-full lg:flex lg:flex-row lg:space-x-6 lg:mb-2" style={{height: '95%'}}>
            {/* Desktop Layout: Courses left (50% width, 100% height), Students and Creator right (50% width, 50% height each) */}
            <div className="hidden lg:flex lg:h-full lg:gap-6 lg:items-stretch w-full">
            {/* Courses Card - 50% width, 100% height */}
            <div className="w-1/2 h-full flex">
              <DashboardCard
                title="Courses"
                subtitle="View and manage your courses"
                description="Create courses from your modules and track student progress"
                icon={BookOpen}
                onClick={() => handleSelection('courses')}
                isSelected={lastSelection === 'courses'}
                gradientFrom="from-blue-500"
                gradientTo="to-blue-700"
                hoverFrom="from-blue-500"
                hoverTo="to-blue-700"
                borderColor="border-blue-300"
              />
            </div>
            
            {/* Right column - 50% width, centered */}
            <div className="w-1/2 h-full flex flex-col gap-6 justify-center">
              {/* Students Card - 50% height */}
              <div className="h-1/2 flex">
                <DashboardCard
                  title="Students"
                  subtitle="Manage your students"
                  description="Add students and track their progress"
                  icon={Users}
                  onClick={() => handleSelection('students')}
                  isSelected={lastSelection === 'students'}
                  gradientFrom="from-purple-500"
                  gradientTo="to-purple-700"
                  hoverFrom="from-purple-500"
                  hoverTo="to-purple-700"
                  borderColor="border-purple-300"
                  variant="compact"
                />
              </div>
              
              {/* Content Creator Card - 50% height */}
              <div className="h-1/2 flex">
                <DashboardCard
                  title="Content Creator"
                  subtitle="Create modules and exercises"
                  description="Build custom content or use templates"
                  icon={Edit3}
                  onClick={() => handleSelection('creator')}
                  isSelected={lastSelection === 'creator'}
                  gradientFrom="from-green-500"
                  gradientTo="to-green-700"
                  hoverFrom="from-green-500"
                  hoverTo="to-green-700"
                  borderColor="border-green-300"
                  variant="compact"
                />
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout: Stacked vertically with courses larger */}
        <div className="lg:hidden space-y-3">
            {/* Courses Card - Smaller on mobile */}
            <div className="h-48">
              <DashboardCard
                title="Courses"
                subtitle="View and manage your courses"
                description="Create courses from your modules and track student progress"
                icon={BookOpen}
                onClick={() => handleSelection('courses')}
                isSelected={lastSelection === 'courses'}
                gradientFrom="from-blue-500"
                gradientTo="to-blue-700"
                hoverFrom="from-blue-500"
                hoverTo="to-blue-700"
                borderColor="border-blue-300"
                variant="compact"
              />
            </div>
            
            {/* Students Card */}
            <div className="h-40">
              <DashboardCard
                title="Students"
                subtitle="Manage your students"
                description="Add students and track their progress"
                icon={Users}
                onClick={() => handleSelection('students')}
                isSelected={lastSelection === 'students'}
                gradientFrom="from-purple-500"
                gradientTo="to-purple-700"
                hoverFrom="from-purple-500"
                hoverTo="to-purple-700"
                borderColor="border-purple-300"
                variant="compact"
              />
            </div>
            
            {/* Content Creator Card */}
            <div className="h-40">
              <DashboardCard
                title="Content Creator"
                subtitle="Create modules and exercises"
                description="Build custom content or use templates"
                icon={Edit3}
                onClick={() => handleSelection('creator')}
                isSelected={lastSelection === 'creator'}
                gradientFrom="from-green-500"
                gradientTo="to-green-700"
                hoverFrom="from-green-500"
                hoverTo="to-green-700"
                borderColor="border-green-300"
                variant="compact"
              />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
