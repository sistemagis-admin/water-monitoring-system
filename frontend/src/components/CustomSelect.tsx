import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value: string | number
  label: string
  sublabel?: string
  icon?: React.ReactNode
  badge?: React.ReactNode
}

interface CustomSelectProps {
  label?: string
  options: SelectOption[]
  value: string | number
  onChange: (value: any) => void
  placeholder?: string
  colorTheme?: 'blue' | 'teal' | 'magenta' | 'slate' | 'emerald'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  align?: 'left' | 'right'
  minPopoverWidth?: string
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Pilih opsi...',
  colorTheme = 'blue',
  size = 'md',
  className = '',
  align = 'left',
  minPopoverWidth,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => String(opt.value) === String(value))

  const themeBorderFocus =
    colorTheme === 'blue' || colorTheme === 'teal'
      ? 'border-[#00799e] ring-1 ring-[#00799e]'
      : colorTheme === 'emerald'
      ? 'border-emerald-500 ring-1 ring-emerald-500'
      : colorTheme === 'magenta'
      ? 'border-pink-600 ring-1 ring-pink-600'
      : 'border-slate-800 ring-1 ring-slate-800'

  const themeOptionHover =
    colorTheme === 'blue' || colorTheme === 'teal'
      ? 'hover:bg-[#00799e]/10 text-slate-900 hover:text-[#00799e]'
      : colorTheme === 'emerald'
      ? 'hover:bg-emerald-50 text-slate-900 hover:text-emerald-700'
      : colorTheme === 'magenta'
      ? 'hover:bg-pink-50 text-slate-900 hover:text-pink-600'
      : 'hover:bg-slate-100 text-slate-900'

  const themeActiveBg =
    colorTheme === 'blue' || colorTheme === 'teal'
      ? 'bg-[#00799e] text-white font-semibold'
      : colorTheme === 'emerald'
      ? 'bg-emerald-600 text-white font-semibold'
      : colorTheme === 'magenta'
      ? 'bg-pink-600 text-white font-semibold'
      : 'bg-slate-900 text-white font-semibold'

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1.5 text-xs rounded-xl'
      : size === 'lg'
      ? 'px-4 py-2.5 text-sm rounded-xl'
      : 'px-3 py-2 text-xs rounded-xl'

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
    <div className={`relative select-none ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block font-semibold text-xs text-slate-700 mb-1">
          {label}
        </label>
      )}

      {/* Select Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-white border font-medium text-slate-800 flex items-center justify-between gap-2 transition-all cursor-pointer shadow-2xs ${sizeClasses} ${
          isOpen
            ? `bg-white ${themeBorderFocus} shadow-xs`
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
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
          {selectedOption?.badge && (
            <span className="shrink-0">{selectedOption.badge}</span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? 'rotate-180 text-[#00799e]' : ''
          }`}
        />
      </button>

      {/* Dropdown Options Popover */}
      {isOpen && (
        <div
          className={`absolute z-50 top-[calc(100%+4px)] bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden animate-fade-in p-1 max-h-60 overflow-y-auto ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${minPopoverWidth ? minPopoverWidth : 'min-w-[190px] w-full'}`}
          style={{ minWidth: minPopoverWidth }}
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value)

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
                  {opt.badge && !isSelected && (
                    <span className="shrink-0">{opt.badge}</span>
                  )}
                </div>

                {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
