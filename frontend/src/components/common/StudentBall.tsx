import React from 'react';

interface StudentBallProps {
  student: {
    _id: string;
    name: string;
    email: string;
  };
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  isSelected?: boolean;
}

const StudentBall: React.FC<StudentBallProps> = ({
  student,
  position,
  size = 'md',
  onClick,
  isSelected = false
}) => {
  // Extract initials from name
  const getInitials = (name: string) => {
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  // Position classes
  const positionClasses = {
    'top-left': 'top-1 left-1',
    'top-right': 'top-1 right-1',
    'bottom-left': 'bottom-1 left-1',
    'bottom-right': 'bottom-1 right-1',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  const initials = getInitials(student.name);

  return (
    <div
      className={`
        absolute ${positionClasses[position]} ${sizeClasses[size]}
        bg-blue-500 hover:bg-blue-600 text-white
        rounded-full flex items-center justify-center
        font-bold cursor-pointer transition-all duration-200
        shadow-md hover:shadow-lg hover:scale-110
        border-2 border-white
        ${isSelected ? 'ring-2 ring-blue-300 ring-offset-1' : ''}
        z-40
      `}
      onClick={onClick}
      title={`${student.name} (${student.email})`}
    >
      {initials}
    </div>
  );
};

export default StudentBall;
