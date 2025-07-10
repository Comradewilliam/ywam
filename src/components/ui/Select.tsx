import React, { forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  fullWidth?: boolean;
  onChange?: (value: string) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  options,
  error,
  fullWidth = false,
  className = '',
  id,
  onChange,
  ...props
}, ref) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value);
  };
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={`
          w-full rounded-md border-gray-300 shadow-sm
          focus:border-blue-500 focus:ring-blue-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${error ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
        onChange={handleChange}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;