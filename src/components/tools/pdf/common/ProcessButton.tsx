import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../common/utils';

interface ProcessButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isProcessing: boolean;
  progress?: number;
  processingMessage?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}

export function ProcessButton({
  isProcessing,
  progress = 0,
  processingMessage = 'Processing...',
  icon: Icon,
  children,
  className,
  disabled,
  ...props
}: ProcessButtonProps) {
  return (
    <button
      disabled={isProcessing || disabled}
      className={cn(
        "w-full py-4 rounded-xl font-bold text-lg shadow-lg relative overflow-hidden transition-all transform active:scale-95",
        !isProcessing && !disabled
          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
          : "bg-gray-100 text-gray-400 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {isProcessing && (
        <div 
          className="absolute inset-0 bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {processingMessage} {progress > 0 && `(${progress}%)`}
          </>
        ) : (
          <>
            {Icon && <Icon className="w-5 h-5" />}
            {children}
          </>
        )}
      </span>
    </button>
  );
}
