import React from 'react';

interface DashboardContainerProps {
  children: React.ReactNode;
  className?: string;
  mobileLayout?: 'stacked' | 'full-height';
  desktopLayout?: 'side-by-side' | 'stacked';
  spacing?: 'tight' | 'normal' | 'loose';
  innerHeight?: 'h-4/5' | 'h-full';
}

const DashboardContainer: React.FC<DashboardContainerProps> = ({
  children,
  className = '',
  mobileLayout = 'stacked',
  desktopLayout = 'side-by-side',
  spacing = 'normal',
  innerHeight = 'h-4/5'
}) => {
  const getSpacingClass = () => {
    switch (spacing) {
      case 'tight': return 'space-y-1';
      case 'loose': return 'space-y-4';
      default: return 'space-y-4';
    }
  };

  const getMobileLayout = () => {
    return mobileLayout === 'stacked' ? 'flex-col' : 'flex-col';
  };

  const getDesktopLayout = () => {
    return desktopLayout === 'side-by-side' ? 'lg:flex-row lg:space-y-0 lg:space-x-6' : 'lg:flex-col';
  };

  const baseClasses = `h-[calc(100vh-5rem)] flex ${getMobileLayout()} ${getDesktopLayout()} ${getSpacingClass()} lg:justify-center pt-2 pb-6 px-6 sm:items-center sm:p-6`;

  return (
    <div className={`${baseClasses} ${className}`}>
      <div className="w-full lg:max-w-6xl">
        <div className={`flex ${getMobileLayout()} ${getDesktopLayout()} ${getSpacingClass()} ${innerHeight} lg:h-96`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardContainer;
