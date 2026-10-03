import React, { useState, useEffect } from 'react'
import logoAmp from '../assets/logo/amp.png'
import {
  Sparkles,
  Layers,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  ArrowDownLeft,
} from 'lucide-react'

export interface SidebarProps {
  activeTab?: string
  onSelectTab?: (tabId: string) => void
  onQuickAction?: () => void
}

interface NavItem {
  id: string
  type: 'icon' | 'badge'
  label: string
  sublabel?: string
  icon?: React.ReactNode
  badgeText?: string
  accentColor?: string
  bgSoft?: string
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab = 'dashboard',
  onSelectTab,
  onQuickAction,
}) => {
  const [currentTab, setCurrentTab] = useState(activeTab)
  const [currentTime, setCurrentTime] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Real-time digital clock (HH:mm)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      setCurrentTime(`${hours}:${minutes}`)
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const handleItemClick = (id: string) => {
    setCurrentTab(id)
    onSelectTab?.(id)
  }

  // Navigation Items matching the reference layout & AMP logo colors
  const navItems: NavItem[] = [
    {
      id: 'overview',
      type: 'icon',
      label: 'Ringkasan Sistem',
      icon: <Sparkles className="w-4 h-4 text-slate-400 group-hover:text-[var(--amp-purple)] transition-colors" />,
    },
    {
      id: 'pressure',
      type: 'badge',
      label: 'Telemetri Tekanan',
      badgeText: 'PT',
      accentColor: 'var(--amp-teal)',
      bgSoft: 'var(--amp-teal-soft)',
    },
    {
      id: 'flow',
      type: 'badge',
      label: 'Telemetri Debit',
      badgeText: 'FT',
      accentColor: 'var(--amp-purple)',
      bgSoft: 'var(--amp-purple-soft)',
    },
    {
      id: 'bar',
      type: 'badge',
      label: 'Unit Tekanan (Bar)',
      badgeText: 'BAR',
      accentColor: 'var(--amp-teal)',
      bgSoft: 'var(--amp-teal-soft)',
    },
    {
      id: 'flowrate',
      type: 'badge',
      label: 'Debit Aliran (L/min)',
      badgeText: 'L/M',
      accentColor: 'var(--amp-magenta)',
      bgSoft: 'var(--amp-magenta-soft)',
    },
    {
      id: 'motors',
      type: 'icon',
      label: 'Kontrol Pompa & Motor',
      icon: <SlidersHorizontal className="w-4 h-4 text-slate-400 group-hover:text-[var(--amp-magenta)] transition-colors" />,
    },
    {
      id: 'dashboard',
      type: 'icon',
      label: 'Layer SCADA',
      icon: <Layers className="w-4 h-4" />,
      accentColor: 'var(--amp-teal)',
      bgSoft: 'var(--amp-teal-soft)',
    },
  ]

  return (
    <aside className="w-[72px] sm:w-[76px] py-4 px-2 flex flex-col items-center justify-between shrink-0 select-none bg-white border border-slate-200/90 rounded-[32px] shadow-xs my-3 ml-3 min-h-[calc(100vh-24px)] sticky top-3 z-30 transition-all">
      {/* 1. Top Section: Logo AMP & Brand Label */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-11 h-11 rounded-2xl p-1.5 flex items-center justify-center bg-slate-50 border border-slate-100 shadow-2xs hover:scale-105 transition-transform cursor-pointer">
          <img
            src={logoAmp}
            alt="AMP Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <span className="text-[12px] font-extrabold tracking-wider text-slate-800 uppercase">
          AMP
        </span>
      </div>

      {/* 2. Middle Navigation Items Stack */}
      <div className="flex flex-col items-center gap-2.5 my-auto py-2">
        {navItems.map((item) => {
          const isActive = currentTab === item.id

          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => handleItemClick(item.id)}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'text-white shadow-sm scale-105'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 active:scale-95'
                }`}
                style={{
                  backgroundColor: isActive
                    ? item.accentColor || 'var(--amp-teal)'
                    : undefined,
                }}
                aria-label={item.label}
              >
                {item.type === 'icon' ? (
                  item.icon
                ) : (
                  <span className="text-[11px] sm:text-xs font-mono font-bold tracking-tight">
                    {item.badgeText}
                  </span>
                )}
              </button>

              {/* Floating Tooltip on Hover */}
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-150 z-50">
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
              </div>
            </div>
          )
        })}

        {/* Live Clock Pill Widget */}
        <div className="mt-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/70 text-[11px] font-mono font-bold text-slate-700 tracking-tight shadow-2xs tabular-nums">
          {currentTime || '00:00'}
        </div>
      </div>

      {/* 3. Bottom Action Buttons Stack */}
      <div className="flex flex-col items-center gap-2.5">
        {/* Fullscreen Toggle */}
        <div className="relative group">
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 bg-slate-100/80 hover:bg-slate-200/80 transition-all cursor-pointer active:scale-95"
            aria-label={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Tooltip */}
          <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-150 z-50">
            {isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
          </div>
        </div>

        {/* Dark Circle Action Button with Diagonal Arrow (matching reference image) */}
        <div className="relative group">
          <button
            onClick={() => {
              if (onQuickAction) {
                onQuickAction()
              } else {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
              }
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all cursor-pointer active:scale-90"
            aria-label="Aksi Cepat"
          >
            <ArrowDownLeft className="w-4 h-4 text-white" />
          </button>

          {/* Tooltip */}
          <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-150 z-50">
            Scroll ke Riwayat / Footer
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
          </div>
        </div>
      </div>
    </aside>
  )
}
