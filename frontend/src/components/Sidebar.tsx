import React, { useState, useEffect } from 'react'
import logoAmp from '../assets/logo/amp.png'
import {
  LayoutDashboard,
  User,
} from 'lucide-react'

export interface SidebarProps {
  activeTab?: string
  onSelectTab?: (tabId: string) => void
  onProfileClick?: () => void
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
  onProfileClick,
}) => {
  const [currentTab, setCurrentTab] = useState(activeTab)
  const [currentTime, setCurrentTime] = useState('')

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

  const handleItemClick = (id: string) => {
    setCurrentTab(id)
    onSelectTab?.(id)
  }

  // Navigation Items: Dashboard only as requested
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      type: 'icon',
      label: 'Dashboard Monitoring',
      icon: <LayoutDashboard className="w-5 h-5 text-white" />,
      accentColor: 'var(--amp-teal)',
      bgSoft: 'var(--amp-teal-soft)',
    },
  ]

  return (
    <aside className="w-[68px] sm:w-[72px] py-4 px-1.5 flex flex-col items-center justify-between shrink-0 select-none bg-white border border-slate-200/90 rounded-[32px] shadow-xs my-3 ml-3 h-[calc(100vh-24px)] sticky top-3 z-30 overflow-hidden transition-all">
      {/* 1. Top Section: Logo AMP & Brand Label */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="w-10 h-10 rounded-2xl p-1 flex items-center justify-center bg-slate-50 border border-slate-100 shadow-2xs hover:scale-105 transition-transform cursor-pointer">
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

      {/* 2. Middle Navigation Items Stack (Non-scrollable, perfectly fitted) */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1.5 sm:gap-2 py-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id

          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => handleItemClick(item.id)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 cursor-pointer ${
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
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-tight">
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
        <div className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/70 text-[10px] sm:text-[11px] font-mono font-bold text-slate-700 tracking-tight shadow-2xs tabular-nums">
          {currentTime || '00:00'}
        </div>
      </div>

      {/* 3. Bottom Section: Profile / User Avatar Icon */}
      <div className="flex flex-col items-center shrink-0 pt-1">
        <div className="relative group">
          <button
            onClick={onProfileClick}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200/90 text-slate-700 border border-slate-200/80 shadow-2xs hover:border-[var(--amp-teal)] transition-all cursor-pointer active:scale-95"
            aria-label="Profil Operator"
          >
            <User className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-slate-700" />
          </button>

          {/* Tooltip */}
          <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-150 z-50">
            Profil Operator
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
          </div>
        </div>
      </div>
    </aside>
  )
}
