'use client'

import { ReactNode, FormHTMLAttributes, useId } from 'react'

interface FormFieldProps {
  label: string
  children: ReactNode
  error?: string
  description?: string
  required?: boolean
  className?: string
}

export function FormField({
  label,
  children,
  error,
  description,
  required = false,
  className = ''
}: FormFieldProps) {
  const fieldId = useId()
  const descriptionId = useId()
  const errorId = useId()

  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {description && (
        <p 
          id={descriptionId}
          className="text-sm text-gray-600"
        >
          {description}
        </p>
      )}
      
      <div className="relative">
        {/* Clone children and add accessibility props */}
        {typeof children === 'object' && children !== null && 'type' in children ? (
          children.type === 'input' || children.type === 'textarea' || children.type === 'select' ? (
            <children.type
              {...children.props}
              id={fieldId}
              aria-describedby={`${description ? descriptionId : ''} ${error ? errorId : ''}`.trim() || undefined}
              aria-invalid={error ? 'true' : 'false'}
              aria-required={required}
              className={`
                ${children.props.className || ''}
                w-full px-3 py-2 border rounded-lg 
                focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent
                ${error 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300'
                }
              `}
            />
          ) : children
        ) : children}
      </div>
      
      {error && (
        <p 
          id={errorId}
          role="alert"
          className="text-sm text-red-600 flex items-center gap-1"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

interface AccessibleFormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode
  title?: string
  description?: string
  errors?: Record<string, string>
}

export default function AccessibleForm({
  children,
  title,
  description,
  errors = {},
  className = '',
  ...props
}: AccessibleFormProps) {
  const formId = useId()
  const hasErrors = Object.keys(errors).length > 0

  return (
    <form
      {...props}
      className={`space-y-6 ${className}`}
      noValidate
    >
      {title && (
        <div>
          <h2 className="text-xl font-semibold text-black">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
      
      {hasErrors && (
        <div 
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="text-sm font-medium text-red-800">
              Please correct the following errors:
            </h3>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {children}
    </form>
  )
}