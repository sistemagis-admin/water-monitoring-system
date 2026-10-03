import React from 'react'
import { Sun, Moon, AlertOctagon } from 'lucide-react'

interface HeaderProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onEmergencyStop: () => void
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onEmergencyStop,
}) => {
  return (
    <header className="flex flex-wrap gap-4 justify-between items-center mb-6 pb-4 border-b border-[var(--line)]">
      <div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-[40px] tracking-tight m-0 mb-1 leading-none text-[var(--ink)]">
          Monitoring Pump System
        </h1>
        <p className="m-0 text-[var(--mut)] text-sm sm:text-base">
          Tekanan, debit, dan kontrol 6 motor di tiga lokasi.
        </p>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Emergency Stop Button (Solid Red, White Text) */}
        <button
          onClick={onEmergencyStop}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
          title="Buka konfirmasi Emergency Stop"
        >
          <AlertOctagon className="w-4 h-4 text-white" />
          <span>E-STOP</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-full bg-[var(--card)] border border-[var(--line)] text-[var(--mut)] hover:text-[var(--ink)] hover:bg-[var(--line)]/40 transition-colors cursor-pointer shadow-xs"
          title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          aria-label="Ganti tema"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
        </button>
      </div>
    </header>
  )
}
