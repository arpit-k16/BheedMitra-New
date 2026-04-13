/**
 * Loading Spinner Component
 * Displays a loading animation with optional message
 */
import React from 'react';

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
  xl: 'w-16 h-16 border-4'
};

function LoadingSpinner({
  size = 'md',
  message = '',
  fullScreen = false,
  className = ''
}) {
  const sizeClasses = sizes[size] || sizes.md;
  
  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div 
        className={`${sizeClasses} border-primary/30 border-t-primary rounded-full animate-spin`}
      />
      {message && (
        <p className="text-on-surface-variant text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }
  
  return spinner;
}

// Skeleton loader for content placeholders
LoadingSpinner.Skeleton = function Skeleton({ 
  width = 'w-full', 
  height = 'h-4',
  rounded = 'rounded',
  className = ''
}) {
  return (
    <div 
      className={`${width} ${height} ${rounded} bg-surface-container animate-pulse ${className}`}
    />
  );
};

// Overlay loading state
LoadingSpinner.Overlay = function LoadingOverlay({ 
  visible = false, 
  message = 'Loading...' 
}) {
  if (!visible) return null;
  
  return (
    <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
      <LoadingSpinner size="lg" message={message} />
    </div>
  );
};

export default LoadingSpinner;
