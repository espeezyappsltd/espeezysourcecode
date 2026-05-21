'use client'

type FilterTabGroupProps<T extends string> = {
  label: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  formatLabel?: (value: T) => string
}

export function FilterTabGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  formatLabel = (v) => v,
}: FilterTabGroupProps<T>) {
  return (
    <div
      className="assets-filter-tabs ui-panel ui-panel--inset ui-panel--compact"
      role="tablist"
      aria-label={label}
    >
      {options.map((option) => {
        const selected = value === option
        return (
          <button
            key={option}
            type="button"
            role="tab"
            id={`assets-filter-${option}`}
            aria-selected={selected}
            aria-controls="assets-filter-panel"
            tabIndex={selected ? 0 : -1}
            className={selected ? 'active' : ''}
            onClick={() => onChange(option)}
          >
            {formatLabel(option)}
          </button>
        )
      })}
    </div>
  )
}
