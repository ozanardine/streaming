import React from 'react';

/**
 * Reusable Button component with various variants
 * 
 * @param {string} variant - button style variant (primary, secondary, outline, danger, success, text)
 * @param {string} size - button size (sm, md, lg)
 * @param {boolean} fullWidth - whether button should take full width
 * @param {boolean} disabled - whether button is disabled
 * @param {boolean} isLoading - whether button is in loading state
 * @param {Function} onClick - click handler
 * @param {React.ReactNode} children - button content
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  isLoading = false,
  type = 'button',
  onClick,
  className = '',
  children,
  ...props
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary';
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-dark text-white shadow-sm',
    secondary: 'bg-secondary hover:bg-secondary-dark text-white shadow-sm',
    outline: 'border border-primary text-primary hover:bg-primary-lighter',
    danger: 'bg-error hover:bg-error-light text-white shadow-sm',
    success: 'bg-success hover:bg-success-light text-white shadow-sm',
    text: 'text-primary hover:text-primary-dark hover:bg-background-light',
    dark: 'bg-background-light hover:bg-background text-white shadow-sm',
  };
  
  // Disabled classes
  const disabledClasses = 'opacity-60 cursor-not-allowed';
  
  // Loading classes
  const loadingClasses = 'relative !text-transparent';
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Combine classes
  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size] || sizeClasses.md}
    ${variantClasses[variant] || variantClasses.primary}
    ${disabled || isLoading ? disabledClasses : ''}
    ${isLoading ? loadingClasses : ''}
    ${widthClasses}
    ${className}
  `;

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {children}
      
      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
    </button>
  );
};

export default Button;