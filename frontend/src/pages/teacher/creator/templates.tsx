import React from 'react';
import { useRouter } from 'next/router';
import { Layers, FileText } from 'lucide-react';
import { DashboardCard, PageHeader, DashboardContainer } from '../../../components/layout';

const TemplatesPage = () => {
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
        title="Templates"
        subtitle="Browse and use public templates"
        showBackButton={true}
        backButtonText="Back to Creator"
        onBackClick={() => router.push('/teacher/creator')}
        titleGradient="from-purple-500 to-purple-700"
        headerHeight="h-16"
      />

      {/* Mobile: Full screen layout */}
      <div className="h-[calc(100vh-4rem)] flex flex-col lg:hidden">
        <div className="flex-1 p-2">
          <DashboardCard
            title="Module Templates"
            subtitle="Browse and use module templates"
            description=""
            icon={Layers}
            onClick={() => router.push('/teacher/creator/templates/modules')}
            gradientFrom="from-blue-400"
            gradientTo="to-blue-600"
            hoverFrom="from-blue-500"
            hoverTo="to-blue-700"
            variant="compact"
          />
        </div>
        <div className="flex-1 p-2">
          <DashboardCard
            title="Exercise Templates"
            subtitle="Browse and use exercise templates"
            description=""
            icon={FileText}
            onClick={() => router.push('/teacher/creator/templates/exercises')}
            gradientFrom="from-green-400"
            gradientTo="to-green-600"
            hoverFrom="from-green-500"
            hoverTo="to-green-700"
            variant="compact"
          />
        </div>
      </div>

      {/* Desktop: Normal layout */}
      <DashboardContainer spacing="tight" innerHeight="h-full" className="hidden lg:flex">
        {/* Module Templates */}
        <div className="w-full h-1/2 lg:h-full lg:w-1/2">
          <DashboardCard
            title="Module Templates"
            subtitle="Browse and use module templates"
            description=""
            icon={Layers}
            onClick={() => router.push('/teacher/creator/templates/modules')}
            gradientFrom="from-blue-400"
            gradientTo="to-blue-600"
            hoverFrom="from-blue-500"
            hoverTo="to-blue-700"
            variant="compact"
          />
        </div>

        {/* Exercise Templates */}
        <div className="w-full h-1/2 lg:h-full lg:w-1/2">
          <DashboardCard
            title="Exercise Templates"
            subtitle="Browse and use exercise templates"
            description=""
            icon={FileText}
            onClick={() => router.push('/teacher/creator/templates/exercises')}
            gradientFrom="from-green-400"
            gradientTo="to-green-600"
            hoverFrom="from-green-500"
            hoverTo="to-green-700"
            variant="compact"
          />
        </div>
      </DashboardContainer>
      </div>
    </div>
  );
};

export default TemplatesPage;
