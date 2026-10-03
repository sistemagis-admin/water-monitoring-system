import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value: string | number
  label: string
  sublabel?: string
  icon?: React.ReactNode
}

interface CustomSelectProps {
  label?: string
  options: SelectOption[]
  value: string | number
  onChange: (value: any) => void
  placeholder?: string
  colorTheme?: 'teal' | 'magenta' | 'slate'
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Pilih opsi...',
  colorTheme = 'teal',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  const themeBorderFocus =
    colorTheme === 'magenta'
      ? 'border-[var(--amp-magenta)] ring-1 ring-[var(--amp-magenta)]'
      : colorTheme === 'teal'
      ? 'border-[var(--amp-teal)] ring-1 ring-[var(--amp-teal)]'
      : 'border-slate-800 ring-1 ring-slate-800'

  const themeOptionHover =
    colorTheme === 'magenta'
      ? 'hover:bg-pink-50 text-slate-900 hover:text-[var(--amp-magenta)]'
      : colorTheme === 'teal'
      ? 'hover:bg-cyan-50 text-slate-900 hover:text-[var(--amp-teal)]'
      : 'hover:bg-slate-100 text-slate-900'

  const themeActiveBg =
    colorTheme === 'magenta'
      ? 'bg-[var(--amp-magenta)] text-white font-bold'
      : colorTheme === 'teal'
      ? 'bg-[var(--amp-teal)] text-white font-bold'
      : 'bg-slate-900 text-white font-bold'

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative w-full select-none" ref={dropdownRef}>
      {label && (
        <label className="block font-bold text-xs text-slate-700 mb-1">
          {label}
        </label>
      )}

      {/* Select Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl font-semibold text-xs text-slate-900 flex items-center justify-between transition-all cursor-pointer ${
          isOpen
            ? `bg-white ${themeBorderFocus} shadow-xs`
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 text-left">
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate font-semibold">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.sublabel && (
            <span className="text-[10px] text-slate-400 font-normal shrink-0 hidden sm:inline">
              · {selectedOption.sublabel}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1.5 ${
            isOpen ? 'rotate-180 text-slate-700' : ''
          }`}
        />
      </button>

      {/* Dropdown Options Popover */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-fade-in p-1 max-h-60 overflow-y-auto min-w-[220px]">
          {options.map((opt) => {
            const isSelected = opt.value === value

            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer mb-0.5 last:mb-0 ${
                  isSelected ? themeActiveBg : themeOptionHover
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate font-semibold">{opt.label}</span>
                    {opt.sublabel && (
                      <span
                        className={`text-[10px] truncate ${
                          isSelected ? 'text-white/80' : 'text-slate-400'
                        }`}
                      >
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                </div>

                {isSelected && <Check className="w-4 h-4 shrink-0 ml-2" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
