import React from 'react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui/select'
import { cn } from 'cn'

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
  disabled?: boolean
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Pilih opsi...',
  size = 'md',
  className = '',
  align = 'left',
  minPopoverWidth,
  disabled = false,
}) => {
  const stringValue = value !== undefined && value !== null ? String(value) : ''
  const selectedOption = options.find((opt) => String(opt.value) === stringValue)

  const sizeClasses =
    size === 'sm'
      ? 'h-8 text-xs py-1 px-2.5 rounded-xl'
      : size === 'lg'
      ? 'h-11 text-sm py-2 px-3.5 rounded-xl'
      : 'h-9 text-xs py-1.5 px-3 rounded-xl'

  return (
    <div className={cn("select-none flex flex-col gap-1 w-full", className)}>
      {label && (
        <label className="font-semibold text-xs text-slate-700">
          {label}
        </label>
      )}

      <Select
        value={stringValue}
        onValueChange={(val) => {
          const original = options.find((opt) => String(opt.value) === val)
          onChange(original ? original.value : val)
        }}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            "w-full bg-white border border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50 focus-visible:border-[#00799e] focus-visible:ring-1 focus-visible:ring-[#00799e] shadow-2xs font-medium cursor-pointer transition-colors",
            sizeClasses
          )}
        >
          <SelectValue placeholder={placeholder}>
            {selectedOption && (
              <div className="flex items-center gap-2 flex-1 min-w-0 text-left">
                {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
                <span className="truncate font-semibold">{selectedOption.label}</span>
                {selectedOption.sublabel && (
                  <span className="text-[10px] text-slate-400 font-normal shrink-0 hidden sm:inline">
                    · {selectedOption.sublabel}
                  </span>
                )}
                {selectedOption.badge && <span className="shrink-0">{selectedOption.badge}</span>}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>

        <SelectContent
          position="popper"
          align={align === 'right' ? 'end' : 'start'}
          className={cn(
            "bg-white border-slate-200 rounded-2xl shadow-xl p-1 z-50 max-h-64 overflow-y-auto",
            minPopoverWidth ? undefined : "min-w-[190px] w-full"
          )}
          style={minPopoverWidth ? { minWidth: minPopoverWidth } : undefined}
        >
          <SelectGroup>
            {options.map((opt) => {
              const optVal = String(opt.value)

              return (
                <SelectItem
                  key={optVal}
                  value={optVal}
                  className="rounded-xl py-2 px-2.5 text-xs cursor-pointer hover:bg-slate-100 focus:bg-[#00799e]/10 focus:text-[#00799e] transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate font-semibold text-slate-900">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-slate-400 truncate">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {opt.badge && (
                      <span className="shrink-0 ml-1">{opt.badge}</span>
                    )}
                  </div>
                </SelectItem>
              )
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
