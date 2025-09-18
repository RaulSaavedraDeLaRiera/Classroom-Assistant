import React from 'react';
import ProgressIndicator from './ProgressIndicator';

interface StudentAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  isSelected?: boolean;
  showProgress?: boolean;
  progress?: number;
}

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
  name,
  size = 'md',
  className = '',
  onClick,
  isSelected = false,
  showProgress = false,
  progress = 0
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg'
  };

  const baseClasses = `
    ${sizeClasses[size]}
    rounded-full
    flex items-center justify-center
    font-semibold
    transition-all duration-200
    ${onClick ? 'cursor-pointer hover:scale-105' : ''}
    ${isSelected ? 'ring-2 ring-blue-500' : ''}
    ${className}
  `;

  const getBackgroundColor = () => {
    if (isSelected) return 'bg-blue-500 text-white';
    
    // Generar color aleatorio basado en el nombre
    const colors = [
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-yellow-400 to-yellow-600',
      'bg-gradient-to-br from-red-400 to-red-600',
      'bg-gradient-to-br from-indigo-400 to-indigo-600',
      'bg-gradient-to-br from-teal-400 to-teal-600',
      'bg-gradient-to-br from-orange-400 to-orange-600',
      'bg-gradient-to-br from-cyan-400 to-cyan-600'
    ];
    
    // Use the name to generate a consistent index
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const colorIndex = Math.abs(hash) % colors.length;
    
    return `${colors[colorIndex]} text-white`;
  };

  return (
    <div className="relative">
      <div
        className={`${baseClasses} ${getBackgroundColor()}`}
        onClick={onClick}
      >
        {getInitials(name)}
      </div>
      {showProgress && (
        <div className="absolute -bottom-1 -right-1">
          <ProgressIndicator
            progress={progress}
            size="sm"
            showPercentage={false}
            color="green"
            className="w-6 h-6"
          />
        </div>
      )}
    </div>
  );
};

export default StudentAvatar;
