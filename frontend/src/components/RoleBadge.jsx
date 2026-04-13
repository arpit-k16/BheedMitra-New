/**
 * Role Badge Component
 * Displays user role with appropriate styling
 */
import React from 'react';

const roleStyles = {
  passenger: {
    bg: 'bg-gradient-to-br from-green-500 to-green-600',
    icon: 'directions_walk',
    label: 'Passenger Mode'
  },
  admin: {
    bg: 'bg-gradient-to-br from-primary to-primary-container',
    icon: 'admin_panel_settings',
    label: 'Admin Control Panel'
  },
  operator: {
    bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
    icon: 'engineering',
    label: 'Operator Mode'
  }
};

function RoleBadge({ 
  role = 'passenger', 
  system = 'DMRC',
  showSystem = true,
  size = 'md',
  className = '' 
}) {
  const roleConfig = roleStyles[role] || roleStyles.passenger;
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-[10px]',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm'
  };
  
  const iconSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span 
        className={`${roleConfig.bg} ${sizeClasses[size]} text-white font-bold rounded-full inline-flex items-center gap-1.5`}
      >
        <span className={`material-symbols-outlined ${iconSizes[size]}`}>
          {roleConfig.icon}
        </span>
        {roleConfig.label}
      </span>
      
      {showSystem && (
        <span className="text-on-surface-variant text-xs">
          System: {system} | Demo Mode
        </span>
      )}
    </div>
  );
}

export default RoleBadge;
