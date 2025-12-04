import React from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <div className="group relative flex">
      {children}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 scale-0 transition-all rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100 whitespace-nowrap z-50">
        {content}
      </span>
    </div>
  );
};
