/**
 * Reusable Card Component
 * Provides consistent card styling across the app
 */
import React from 'react';

const variants = {
  default: 'bg-surface-container-low border-outline-variant/10',
  elevated: 'bg-surface-container shadow-2xl shadow-black/60',
  outlined: 'bg-transparent border-2 border-outline-variant/30',
  gradient: 'bg-gradient-to-br from-surface-container to-surface-container-high'
};

function Card({
  children,
  variant = 'default',
  className = '',
  padding = 'p-6',
  rounded = 'rounded-xl',
  hover = false,
  onClick = null,
  ...props
}) {
  const baseClasses = 'relative transition-all duration-200';
  const variantClasses = variants[variant] || variants.default;
  const hoverClasses = hover ? 'hover:transform hover:scale-[1.02] hover:shadow-xl cursor-pointer' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';
  
  return (
    <div
      className={`${baseClasses} ${variantClasses} ${padding} ${rounded} ${hoverClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

// Sub-components for Card structure
Card.Header = function CardHeader({ children, className = '' }) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
};

Card.Title = function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-xl font-bold font-headline text-on-surface ${className}`}>
      {children}
    </h3>
  );
};

Card.Subtitle = function CardSubtitle({ children, className = '' }) {
  return (
    <p className={`text-sm text-on-surface-variant mt-1 ${className}`}>
      {children}
    </p>
  );
};

Card.Body = function CardBody({ children, className = '' }) {
  return (
    <div className={`text-on-surface-variant ${className}`}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-4 border-t border-outline-variant/10 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
