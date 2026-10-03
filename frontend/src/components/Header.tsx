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
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-md bg-[var(--amp-teal)] text-white text-[11px] font-extrabold uppercase tracking-wide">
            PT Ascon Multi Pratama
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-extrabold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            SSE Live 1s
          </span>
        </div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-[34px] tracking-tight m-0 mb-1 leading-none text-slate-900">
          Smart Water Pump Monitoring System
        </h1>
        <p className="m-0 text-slate-500 text-xs sm:text-sm font-medium">
          Site: <strong>SITE-DEMO (WTP Plant)</strong> · 3 Area/Ruangan · 6 Unit Pompa Industrial
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
