'use client'

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'

type ControlProps = {
  id?: string
  name?: string
  className?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-required'?: boolean
  'aria-labelledby'?: string
}

export type FormFieldProps = {
  label: string
  hint?: string
  error?: string
  required?: boolean
  hideLabel?: boolean
  className?: string
  /** Shown on the same row as the label (e.g. AI assist button) */
  labelAction?: ReactNode
  /** Decorative icon inside the field (left) */
  icon?: ReactNode
  /** Content below the control (e.g. word count) */
  afterControl?: ReactNode
  /** Decorative overlay inside the control wrap (e.g. animated placeholder). */
  controlOverlay?: ReactNode
  children: ReactElement<ControlProps>
}

/** Associates label, hint, error, and ARIA attributes with a single form control. */
export function FormField({
  label,
  hint,
  error,
  required,
  hideLabel = false,
  className = '',
  labelAction,
  icon,
  afterControl,
  controlOverlay,
  children,
}: FormFieldProps) {
  const autoId = useId().replace(/:/g, '')
  const fieldId = (isValidElement(children) && children.props.id) || `field-${autoId}`
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  const control: ReactNode = isValidElement(children)
    ? cloneElement(children, {
        id: fieldId,
        'aria-describedby': describedBy || children.props['aria-describedby'],
        'aria-invalid': error ? true : children.props['aria-invalid'],
        'aria-required': required ?? children.props['aria-required'],
        'aria-labelledby': children.props['aria-labelledby'],
        className: ['form-input', children.props.className].filter(Boolean).join(' '),
      })
    : children

  return (
    <div
      className={`form-group${error ? ' form-group--invalid' : ''}${icon ? ' form-group--has-icon' : ''}${controlOverlay ? ' form-group--control-overlay' : ''}${className ? ` ${className}` : ''}`}
      style={{ marginBottom: 0 }}
    >
      {labelAction ? (
        <div className="form-label-row">
          <label htmlFor={fieldId} className={hideLabel ? 'sr-only' : 'form-label'} style={{ marginBottom: 0 }}>
            {label}
            {required ? (
              <>
                <span className="form-required" aria-hidden="true">
                  {' '}
                  *
                </span>
                <span className="sr-only"> (required)</span>
              </>
            ) : null}
          </label>
          {labelAction}
        </div>
      ) : (
        <label htmlFor={fieldId} className={hideLabel ? 'sr-only' : 'form-label'}>
          {label}
          {required ? (
            <>
              <span className="form-required" aria-hidden="true">
                {' '}
                *
              </span>
              <span className="sr-only"> (required)</span>
            </>
          ) : null}
        </label>
      )}
      <div
        className={[
          icon || controlOverlay ? 'form-field-control-wrap' : undefined,
          controlOverlay ? 'form-field-control-wrap--overlay' : undefined,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {icon ? (
          <span className="form-field-icon" aria-hidden>
            {icon}
          </span>
        ) : null}
        {control}
        {controlOverlay}
      </div>
      {hint ? (
        <p id={hintId} className="form-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {afterControl}
    </div>
  )
}

export type FormCheckProps = {
  id?: string
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
  required?: boolean
  disabled?: boolean
}

/** Accessible checkbox with visible label and optional hint. */
export function FormCheck({ id, label, hint, checked, onChange, required, disabled }: FormCheckProps) {
  const autoId = useId().replace(/:/g, '')
  const fieldId = id ?? `check-${autoId}`
  const hintId = hint ? `${fieldId}-hint` : undefined

  return (
    <div className="form-check">
      <input
        id={fieldId}
        type="checkbox"
        className="form-check__input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required={required}
        disabled={disabled}
        aria-describedby={hintId}
        aria-required={required || undefined}
      />
      <label htmlFor={fieldId} className="form-check__label">
        {label}
        {required ? <span className="sr-only"> (required)</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="form-hint form-hint--check">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
