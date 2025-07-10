import React, { forwardRef } from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  error,
  className = '',
  id,
  ...props
}, ref) => {
  const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="flex items-start mb-4">
      <div className="flex items-center h-5">
        <input
          id={checkboxId}
          type="checkbox"
          ref={ref}
          className={`
            h-4 w-4 rounded border-gray-300 text-blue-600
            focus:ring-blue-500 focus:ring-offset-0
            ${error ? 'border-red-300' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      <div className="ml-3 text-sm">
        {label && (
          <label htmlFor={checkboxId} className="font-medium text-gray-700">
            {label}
          </label>
        )}
        {error && <p className="text-red-600">{error}</p>}
      </div>
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;