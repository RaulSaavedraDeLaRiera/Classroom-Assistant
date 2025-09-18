import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  className?: string;
  inputClassName?: string;
}

// Helper function for text contains search
export const searchContains = (text: string, searchQuery: string): boolean => {
  if (!searchQuery.trim()) return true;
  
  const textLower = text.toLowerCase();
  const queryLower = searchQuery.toLowerCase().trim();
  
  return textLower.includes(queryLower);
};

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder,
  label,
  className = "",
  inputClassName = ""
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {label}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClassName}`}
      />
    </div>
  );
};

export default SearchBar;
