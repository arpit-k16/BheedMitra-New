/**
 * Reusable Button Component
 * Supports various variants, sizes, and states
 */
import React from 'react';

const variants = {
  primary: 'bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed shadow-lg shadow-primary/20 hover:shadow-primary/30',
  secondary: 'bg-surface-container text-on-surface border border-outline-variant/30 hover:bg-surface-container-high',
  success: 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/20',
  danger: 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/20',
  outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary/10',
  ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-variant/20'
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg'
};

function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  icon = null,
  iconPosition = 'right',
  onClick,
  type = 'button',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';
  
  const variantClasses = variants[variant] || variants.primary;
  const sizeClasses = sizes[size] || sizes.md;
  const widthClasses = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${widthClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <span className="animate-spin text-lg">⌛</span>
          {children && <span>Loading...</span>}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="material-symbols-outlined">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="material-symbols-outlined">{icon}</span>}
        </>
      )}
    </button>
  );
}

export default Button;
