import React from 'react';
import { useRouter } from 'next/router';
import { Layers, FileText, BookOpen } from 'lucide-react';
import { DashboardCard, PageHeader } from '../../components/layout';

const TeacherCreator = () => {
  const router = useRouter();

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
        title="Content Creator"
        subtitle="Create and manage your educational content"
        showBackButton={true}
        backButtonText="Back to Teacher"
        onBackClick={() => router.push('/teacher')}
        titleGradient="from-blue-600 to-purple-600"
        showLogout={true}
      />

      {/* Main Content - 100% height minus header */}
      <div className="h-[calc(100vh-5rem)] flex flex-col space-y-4 lg:flex-col lg:space-y-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-20 lg:py-16">
        {/* My Modules - 40% height on mobile, 80% width on desktop */}
        <div className="w-full h-2/5 lg:w-full lg:max-w-7xl lg:mx-auto lg:h-auto" style={{flex: '4'}}>
          <div className="h-full lg:h-full lg:flex lg:flex-row lg:space-x-6 lg:mb-2" style={{height: '95%'}}>
            <div className="w-full lg:w-1/2 h-full">
              <DashboardCard
                title="My Modules"
                subtitle="Manage your created modules"
                description=""
                icon={Layers}
                onClick={() => router.push('/teacher/creator/modules')}
                gradientFrom="from-blue-400"
                gradientTo="to-blue-600"
                hoverFrom="from-blue-500"
                hoverTo="to-blue-700"
                variant="compact"
              />
            </div>

            {/* My Exercises - 40% height on mobile, 50% width on desktop */}
            <div className="w-full lg:w-1/2 h-full hidden lg:block">
              <DashboardCard
                title="My Exercises"
                subtitle="Manage your created exercises"
                description=""
                icon={FileText}
                onClick={() => router.push('/teacher/creator/exercises')}
                gradientFrom="from-green-400"
                gradientTo="to-green-600"
                hoverFrom="from-green-500"
                hoverTo="to-green-700"
                variant="compact"
              />
            </div>
          </div>
        </div>

        {/* My Exercises - 40% height on mobile, hidden on desktop (shown above) */}
        <div className="w-full h-2/5 lg:hidden">
          <DashboardCard
            title="My Exercises"
            subtitle="Manage your created exercises"
            description=""
            icon={FileText}
            onClick={() => router.push('/teacher/creator/exercises')}
            gradientFrom="from-green-400"
            gradientTo="to-green-600"
            hoverFrom="from-green-500"
            hoverTo="to-green-700"
            variant="compact"
          />
        </div>
        
        {/* Templates Section - 20% height on mobile, 20% width on desktop */}
        <div className="w-full h-1/5 lg:w-full lg:max-w-7xl lg:mx-auto lg:h-auto" style={{flex: '1.2'}}>
          <DashboardCard
            title="Templates"
            subtitle="Browse and use public templates"
            description=""
            icon={BookOpen}
            onClick={() => router.push('/teacher/creator/templates')}
            gradientFrom="from-purple-400"
            gradientTo="to-purple-600"
            hoverFrom="from-purple-500"
            hoverTo="to-purple-700"
            variant="compact"
          />
        </div>
      </div>
      </div>
    </div>
  );
};

export default TeacherCreator;
