import React from 'react'
import type { ApiUser } from '../services/api'
import logoAmp from '../assets/logo/amp.png'
import {
  LayoutDashboard,
  Building2,
  Layers,
  Radio,
  Server,
  Bell,
  Users,
  LogOut,
} from 'lucide-react'

export interface SidebarProps {
  activeTab: string
  currentUser?: ApiUser | null
  openAlarmsCount?: number
  onSelectTab: (tabId: string) => void
  onProfileClick?: () => void
  onOpenAddArea?: () => void
  onLogout?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  currentUser,
  openAlarmsCount = 0,
  onSelectTab,
  onLogout,
  onProfileClick,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'areas', label: 'Area & Ruangan', icon: Building2 },
    { id: 'pumps', label: 'Manajemen Pompa', icon: Layers },
    { id: 'sensors', label: 'Sensor & Binding', icon: Radio },
    { id: 'devices', label: 'Gateway IoT', icon: Server },
    { id: 'alarms', label: 'Pusat Alarm', icon: Bell, badge: openAlarmsCount > 0 ? openAlarmsCount : undefined },
    { id: 'users', label: 'Manajemen User', icon: Users },
  ]

  return (
    <aside className="w-full flex-1 flex flex-col justify-between select-none">
      <div>
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 mb-6 px-1 pb-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-1 shrink-0 overflow-hidden">
            <img src={logoAmp} alt="PT. Ascon Multipratama" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading font-bold text-sm tracking-tight text-slate-900 leading-tight truncate" title="PT. Ascon Multipratama">
              PT. Ascon Multipratama
            </h2>
            <span className="text-[10px] font-medium text-slate-400 block tracking-normal mt-0.5">
              Water Monitoring System
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <span className="px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Menu Utama
          </span>

          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#00799e] text-white font-semibold shadow-sm shadow-[#00799e]/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-transparent text-slate-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-[#00799e]' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom User Profile & Logout Widget */}
      <div className="mt-6 p-4 rounded-2xl bg-[#00799e] text-white shadow-xs flex flex-col justify-between min-h-[135px]">
        {/* User Role Badge */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-white/90 tracking-wider uppercase font-mono">
            {currentUser?.role || 'SUPER_ADMIN'}
          </span>
        </div>

        {/* User Name & Email */}
        <div className="my-1.5 min-w-0">
          <h3 className="font-heading font-semibold text-sm leading-snug m-0 text-white truncate" title={currentUser?.full_name || 'Super Admin Ascon'}>
            {currentUser?.full_name || 'Super Admin Ascon'}
          </h3>
          <p className="text-[11px] text-white/80 font-normal m-0 mt-0.5 truncate" title={currentUser?.email || 'admin@ascon.co.id'}>
            {currentUser?.email || 'admin@ascon.co.id'}
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout || onProfileClick}
          className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs border border-slate-800"
        >
          <LogOut className="w-3.5 h-3.5 text-white" />
          <span className="text-white">Logout</span>
        </button>
      </div>
    </aside>
  )
}
