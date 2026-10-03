import React from 'react'
import { Sun, Moon, AlertOctagon, Plus, Radio, Wifi, WifiOff, RefreshCw, Server } from 'lucide-react'
import type { ApiUser } from '../services/api'

interface HeaderProps {
  theme: 'light' | 'dark'
  isBackendOnline?: boolean
  isLiveSSE?: boolean
  siteInfo?: { id: string; code: string; name: string } | null
  currentUser?: ApiUser | null
  onReconnect?: () => void
  onToggleTheme: () => void
  onEmergencyStop: () => void
  onOpenAddPump?: () => void
  onOpenAddSensor?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  isBackendOnline = false,
  isLiveSSE = false,
  siteInfo,
  currentUser,
  onReconnect,
  onToggleTheme,
  onEmergencyStop,
  onOpenAddPump,
  onOpenAddSensor,
}) => {
  return (
    <header className="flex flex-wrap gap-4 justify-between items-center mb-6 pb-4 border-b border-[var(--line)] select-none">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-md bg-[var(--amp-teal)] text-white text-[11px] font-extrabold uppercase tracking-wide">
            PT Ascon Multi Pratama
          </span>

          {/* Realtime API & SSE Connection Status Pill */}
          <button
            onClick={onReconnect}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
              isBackendOnline && isLiveSSE
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                : isBackendOnline
                ? 'bg-sky-100 text-sky-800 border border-sky-300 hover:bg-sky-200'
                : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
            }`}
            title="Klik untuk menyinkronkan ulang koneksi backend"
          >
            {isBackendOnline && isLiveSSE ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Backend Live (SSE)</span>
                <Wifi className="w-3 h-3 text-emerald-700" />
              </>
            ) : isBackendOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-sky-600" />
                <span>API Connected</span>
                <Server className="w-3 h-3 text-sky-700" />
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Simulated Mode</span>
                <WifiOff className="w-3 h-3 text-amber-700" />
              </>
            )}
            <RefreshCw className="w-2.5 h-2.5 opacity-60 ml-0.5" />
          </button>
        </div>

        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-[34px] tracking-tight m-0 mb-1 leading-none text-slate-900">
          Smart Water Pump Monitoring System
        </h1>
        <p className="m-0 text-slate-500 text-xs sm:text-sm font-medium">
          Site: <strong>{siteInfo?.name || 'SITE-DEMO (WTP Plant Bandung)'}</strong> ·{' '}
          {currentUser ? `User: ${currentUser.full_name} (${currentUser.role})` : 'Operator SCADA Standby'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Add Pump Button */}
        {onOpenAddPump && (
          <button
            onClick={onOpenAddPump}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--amp-teal)] hover:opacity-90 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs"
            title="Tambah pompa baru"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pompa</span>
          </button>
        )}

        {/* Add Sensor Button */}
        {onOpenAddSensor && (
          <button
            onClick={onOpenAddSensor}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--amp-magenta)] hover:opacity-90 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs"
            title="Tambah sensor & binding"
          >
            <Radio className="w-4 h-4" />
            <span>Tambah Sensor</span>
          </button>
        )}

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
