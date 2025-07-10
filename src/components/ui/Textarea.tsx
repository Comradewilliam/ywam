import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  fullWidth = false,
  className = '',
  id,
  ...props
}, ref) => {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        ref={ref}
        className={`
          w-full rounded-md border-gray-300 shadow-sm
          focus:border-blue-500 focus:ring-blue-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${error ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;