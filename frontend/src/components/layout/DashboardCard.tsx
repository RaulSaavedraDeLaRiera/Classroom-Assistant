import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  isSelected?: boolean;
  gradientFrom: string;
  gradientTo: string;
  hoverFrom: string;
  hoverTo: string;
  borderColor?: string;
  variant?: 'default' | 'compact';
  textColor?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  description,
  icon: Icon,
  onClick,
  isSelected = false,
  gradientFrom,
  gradientTo,
  hoverFrom,
  hoverTo,
  borderColor = '',
  variant = 'default',
  textColor = 'text-white'
}) => {
  const isCompact = variant === 'compact';
  
  const baseClasses = "w-full h-full rounded-2xl transition-all duration-300 cursor-pointer text-left group hover:scale-105";
  const selectedClasses = `bg-gradient-to-br ${gradientFrom} ${gradientTo} shadow-2xl border-4 ${borderColor}`;
  const normalClasses = `bg-gradient-to-br ${gradientFrom} ${gradientTo} hover:${hoverFrom} hover:${hoverTo} shadow-xl`;
  
  return (
    <button 
      onClick={onClick}
      className={`${baseClasses} ${isSelected ? selectedClasses : normalClasses}`}
    >
      <div className={`${isCompact ? 'p-4 lg:p-6' : 'p-8 lg:p-12'} h-full flex flex-col justify-center text-center ${textColor}`}>
        <div className={`${isCompact ? 'w-12 h-12 lg:w-16 lg:h-16' : 'w-20 h-20 lg:w-24 lg:h-24'} mx-auto ${isCompact ? 'mb-2 lg:mb-3' : 'mb-4 lg:mb-6'} bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`${isCompact ? 'w-6 h-6 lg:w-8 lg:h-8' : 'w-10 h-10 lg:w-12 lg:h-12'}`} />
        </div>
        <h3 className={`${isCompact ? 'text-lg lg:text-xl' : 'text-2xl lg:text-3xl'} font-bold ${isCompact ? 'mb-1 lg:mb-2' : 'mb-3 lg:mb-4'} text-white`}>{title}</h3>
        <p className={`${isCompact ? 'text-sm lg:text-base mb-1 lg:mb-2' : 'text-lg lg:text-xl mb-2'} text-white/90`}>{subtitle}</p>
        <p className={`${isCompact ? 'text-xs lg:text-sm' : 'text-base lg:text-lg'} text-white/80`}>{description}</p>
      </div>
    </button>
  );
};

export default DashboardCard;
