import React from 'react';

export interface CommonTextFieldProps {
  id?: string;
  name?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'month' | 'tel' | 'url';
  label?: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  minLength?: number;
  maxLength?: number;
  className?: string;
  labelClassName?: string;
  error?: string;
  helperText?: string;
  showRequired?: boolean;
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const CommonTextField: React.FC<CommonTextFieldProps> = ({
  id,
  name,
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  min,
  max,
  step,
  minLength,
  maxLength,
  className = '',
  labelClassName = '',
  error,
  helperText,
  showRequired = true,
  icon,
  endIcon
}) => {
  const baseInputClasses = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors';
  const errorClasses = error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '';
  const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : '';
  const iconPadding = icon ? 'pl-10' : '';
  const endIconPadding = endIcon ? 'pr-10' : '';

  return (
    <div>
      {label && (
        <label 
          htmlFor={id || name} 
          className={`block text-sm font-medium text-gray-700 mb-2 ${labelClassName}`}
        >
          {label}
          {required && showRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={id || name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          minLength={minLength}
          maxLength={maxLength}
          className={`${baseInputClasses} ${errorClasses} ${disabledClasses} ${iconPadding} ${endIconPadding} ${className}`}
        />
        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {endIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default CommonTextField;

