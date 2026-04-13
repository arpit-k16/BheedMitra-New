/**
 * Demo Mode Banner Component
 * Displays a warning banner for demo/synthetic data mode
 */
import React from 'react';

function DemoBanner({ 
  message = "Demo Mode: Using synthetic data for demonstration purposes.",
  variant = 'warning',
  dismissible = false,
  onDismiss = null,
  className = ''
}) {
  const variants = {
    warning: 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-500/50 text-orange-200',
    info: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/50 text-blue-200',
    success: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50 text-green-200',
    error: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border-red-500/50 text-red-200'
  };
  
  const icons = {
    warning: 'science',
    info: 'info',
    success: 'check_circle',
    error: 'error'
  };
  
  const variantClasses = variants[variant] || variants.warning;
  const icon = icons[variant] || icons.warning;
  
  return (
    <div 
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${variantClasses} ${className}`}
    >
      <span className="material-symbols-outlined text-lg">
        {icon}
      </span>
      <p className="text-sm font-medium flex-1">
        {message}
      </p>
      {dismissible && onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-current hover:opacity-70 transition-opacity"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      )}
    </div>
  );
}

export default DemoBanner;
