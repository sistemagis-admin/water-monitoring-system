import React from 'react'
import {
  Settings,
  Bell,
  User,
  Shield,
  Layers,
  Building2,
  Radio,
  Server,
  Activity,
} from 'lucide-react'
import type { ApiUser } from '../services/api'

interface HeaderProps {
  activeTab: string
  onSelectTab: (tabId: string) => void
  currentUser?: ApiUser | null
  onProfileClick?: () => void
  onOpenAddArea?: () => void
  onOpenAddPump?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onProfileClick,
}) => {
  const topTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Building2 },
    { id: 'areas', label: 'Area & Ruangan', icon: Building2 },
    { id: 'pumps', label: 'Manajemen Pompa', icon: Layers },
    { id: 'sensors', label: 'Sensor & Binding', icon: Radio },
  ]

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-1 select-none">
      {/* Top Capsule Navigation Bar */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-full border border-slate-200/70 shadow-2xs">
        {topTabs.map((tab) => {
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`px-4 py-1.5 rounded-full font-extrabold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-[#00799e] text-white shadow-md shadow-[#00799e]/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Right Controls: Circular Buttons + User Profile Capsule */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Settings Circular Button */}
        <button
          onClick={onProfileClick}
          className="w-9 h-9 rounded-full bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Pengaturan Sistem"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Bell Circular Button */}
        <div className="relative">
          <button
            onClick={onProfileClick}
            className="w-9 h-9 rounded-full bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Notifikasi Alarm"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 ring-2 ring-white" />
          </button>
        </div>

        {/* User Profile Capsule (Avatar circle, Name, Email) */}
        <div
          onClick={onProfileClick}
          className="flex items-center gap-2.5 bg-white border border-slate-200/90 rounded-full p-1 pr-3.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer group hover:border-slate-300"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#005a75] to-[#00799e] text-white flex items-center justify-center font-bold text-xs shadow-2xs group-hover:scale-105 transition-transform">
            {currentUser?.full_name?.charAt(0) || <User className="w-3.5 h-3.5" />}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800 leading-tight">
              {currentUser?.full_name || 'Super Admin'}
            </span>
            <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">
              {currentUser?.email || 'admin@ascon.co.id'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
