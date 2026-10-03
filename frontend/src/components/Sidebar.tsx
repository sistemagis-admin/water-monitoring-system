import React, { useState } from 'react'
import logoAmp from '../assets/logo/amp.png'
import {
  LayoutDashboard,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export interface SidebarProps {
  activeTab?: string
  onSelectTab?: (tabId: string) => void
  onProfileClick?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab = 'dashboard',
  onSelectTab,
  onProfileClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentTab, setCurrentTab] = useState(activeTab)

  const handleItemClick = (id: string) => {
    setCurrentTab(id)
    onSelectTab?.(id)
  }

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev)
  }

  return (
    <aside
      className={`py-4 flex flex-col justify-between shrink-0 select-none bg-white border border-slate-200/90 rounded-[28px] shadow-xs my-3 ml-3 h-[calc(100vh-24px)] sticky top-3 z-30 overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-[230px] sm:w-[245px] px-3.5' : 'w-[68px] sm:w-[72px] px-1.5 items-center'
      }`}
    >
      {/* 1. Top Section: Logo & Toggle Button */}
      <div className="flex flex-col gap-2.5 shrink-0">
        <div className={`flex items-center ${isExpanded ? 'justify-between' : 'flex-col gap-1.5'}`}>
          <div
            onClick={toggleExpand}
            className="flex items-center gap-2.5 cursor-pointer group"
            title={isExpanded ? 'Klik untuk mengecilkan sidebar' : 'Klik untuk membuka sidebar'}
          >
            <div className="w-10 h-10 rounded-2xl p-1 flex items-center justify-center bg-slate-50 border border-slate-100 shadow-2xs group-hover:scale-105 group-hover:border-[var(--amp-teal)] transition-all shrink-0">
              <img
                src={logoAmp}
                alt="AMP Logo"
                className="w-full h-full object-contain"
              />
            </div>
            {isExpanded && (
              <div className="flex flex-col min-w-0 animate-fade-in">
                <span className="text-[13px] font-extrabold tracking-wider text-slate-800 uppercase leading-none">
                  AMP
                </span>
                <span className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                  Water Monitoring
                </span>
              </div>
            )}
          </div>

          {/* Toggle Button (Expanded: ChevronLeft, Collapsed: ChevronRight right at the top) */}
          {isExpanded ? (
            <button
              onClick={toggleExpand}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Kecilkan Sidebar"
              aria-label="Kecilkan Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="relative group">
              <button
                onClick={toggleExpand}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-[var(--amp-teal)] hover:bg-slate-100 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                title="Buka Sidebar"
                aria-label="Buka Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {/* Tooltip */}
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-150 z-50">
                Buka Sidebar
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Top-Aligned Navigation Items (Directly Under Logo & Header) */}
      <div className="flex-1 flex flex-col gap-2 mt-3 pt-2 border-t border-slate-100">
        {/* Dashboard Menu Button */}
        <div className="relative group">
          <button
            onClick={() => handleItemClick('dashboard')}
            className={`w-full rounded-2xl flex items-center transition-all duration-200 cursor-pointer ${
              currentTab === 'dashboard'
                ? 'text-white bg-[var(--amp-teal)] shadow-sm'
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900'
            } ${
              isExpanded
                ? 'px-3 py-2.5 gap-3 font-bold text-xs sm:text-sm'
                : 'w-10 h-10 sm:w-11 sm:h-11 mx-auto justify-center hover:scale-105 active:scale-95'
            }`}
            aria-label="Dashboard Monitoring"
          >
            <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            {isExpanded && (
              <span className="truncate tracking-tight font-bold">
                Dashboard
              </span>
            )}
          </button>

          {/* Floating Tooltip on Hover when Collapsed */}
          {!isExpanded && (
            <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-150 z-50">
              Dashboard Monitoring
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Section: Profile Avatar Only */}
      <div className="flex flex-col gap-2 shrink-0 pt-2 border-t border-slate-100">
        {/* Profile Card / Button */}
        <div className="relative group">
          <button
            onClick={onProfileClick}
            className={`w-full rounded-2xl flex items-center bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all duration-200 cursor-pointer active:scale-95 ${
              isExpanded
                ? 'p-2 gap-2.5 text-left'
                : 'w-10 h-10 sm:w-11 sm:h-11 mx-auto justify-center'
            }`}
            aria-label="Profil Operator"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>

            {isExpanded && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-800 truncate">
                  Operator SCADA
                </span>
                <span className="text-[10px] text-[var(--on)] font-semibold truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--on)]" />
                  Online
                </span>
              </div>
            )}
          </button>

          {/* Floating Tooltip when Collapsed */}
          {!isExpanded && (
            <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-150 z-50">
              Profil Operator
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
