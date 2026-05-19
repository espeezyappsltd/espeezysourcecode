'use client'

import type { ReactNode } from 'react'

export type SearchFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  placeholder?: string
  className?: string
  inputClassName?: string
  leadingIcon?: ReactNode
  disabled?: boolean
}

/**
 * Accessible search control: visible or sr-only label, searchbox role, clear control.
 */
export function SearchField({
  id,
  label,
  value,
  onChange,
  onClear,
  placeholder,
  className = '',
  inputClassName = 'form-input',
  leadingIcon,
  disabled,
}: SearchFieldProps) {
  const showClear = Boolean(value.length > 0 && onClear)

  return (
    <div className={`search-field${leadingIcon ? ' search-field--with-icon' : ''}${className ? ` ${className}` : ''}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {leadingIcon ? <span className="search-field__icon" aria-hidden>{leadingIcon}</span> : null}
      <input
        id={id}
        type="search"
        role="searchbox"
        className={inputClassName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        disabled={disabled}
      />
      {showClear ? (
        <button
          type="button"
          className="search-field__clear"
          onClick={onClear}
          aria-label={`Clear ${label}`}
          disabled={disabled}
        >
          <span aria-hidden>×</span>
        </button>
      ) : null}
    </div>
  )
}
