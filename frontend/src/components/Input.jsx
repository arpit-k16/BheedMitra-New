/**
 * Reusable Input Component
 * Supports various types, states, and icons
 */
import React, { forwardRef } from 'react';

const Input = forwardRef(function Input({
  id,
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  disabled = false,
  required = false,
  icon = null,
  helperText = '',
  className = '',
  ...props
}, ref) {
  const hasError = !!error;
  
  const baseInputClasses = `
    block w-full py-3.5 bg-surface-container-lowest border-none rounded-xl 
    text-on-surface placeholder:text-outline/50 
    focus:ring-2 transition-all duration-200 font-medium outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
  `;
  
  const errorClasses = hasError ? 'focus:ring-error/30' : 'focus:ring-primary/30';
  const paddingClasses = icon ? 'pl-12 pr-4' : 'px-4';
  
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label 
          htmlFor={id} 
          className="block font-headline text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1"
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors duration-200">
              {icon}
            </span>
          </div>
        )}
        
        <input
          ref={ref}
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`${baseInputClasses} ${errorClasses} ${paddingClasses}`}
          {...props}
        />
      </div>
      
      {(error || helperText) && (
        <p className={`text-xs px-1 ${hasError ? 'text-error' : 'text-on-surface-variant'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

export default Input;
