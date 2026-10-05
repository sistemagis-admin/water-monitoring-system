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
  User,
  ChevronRight,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from 'cn'

export interface SidebarProps {
  activeTab: string
  currentUser?: ApiUser | null
  openAlarmsCount?: number
  onSelectTab: (tabId: string) => void
  onProfileClick?: () => void
  onOpenAddArea?: () => void
  onLogout?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  currentUser,
  openAlarmsCount = 0,
  onSelectTab,
  onLogout,
  onProfileClick,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'areas', label: 'Stations & Areas', icon: Building2 },
    { id: 'pumps', label: 'Pump Management', icon: Layers },
    { id: 'sensors', label: 'Sensors & Signals', icon: Radio },
    { id: 'devices', label: 'IoT Gateways', icon: Server },
    { id: 'alarms', label: 'Alarm Center', icon: Bell, badge: openAlarmsCount > 0 ? openAlarmsCount : undefined },
    { id: 'users', label: 'User Management', icon: Users },
  ]

  const getRoleVariant = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'default'
      case 'ENGINEER':
        return 'secondary'
      case 'OPERATOR':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <aside className="w-full flex-1 flex flex-col justify-between select-none">
      <div className="flex flex-col gap-4">
        {/* Brand Header: 100% Full Width for Logo & Company Name */}
        <div
          className={cn(
            "flex items-center pb-4 border-b border-slate-100 transition-all",
            isCollapsed ? "justify-center px-0" : "gap-3 px-1"
          )}
        >
          <div
            onClick={isCollapsed ? onToggleCollapse : undefined}
            className={cn(
              "size-10 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-1 shrink-0 overflow-hidden",
              isCollapsed && "cursor-pointer hover:border-slate-300 transition-colors"
            )}
            title={isCollapsed ? "Klik untuk perbesar sidebar" : undefined}
          >
            <img src={logoAmp} alt="PT. Ascon Multipratama" className="w-full h-full object-contain" />
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h2 className="font-heading font-bold text-sm tracking-tight text-slate-900 leading-tight whitespace-nowrap">
                PT. Ascon Multipratama
              </h2>
              <span className="text-[10px] font-medium text-slate-400 block tracking-normal mt-0.5 whitespace-nowrap">
                Water Monitoring System
              </span>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex flex-col gap-1">
          {!isCollapsed && (
            <span className="px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Navigasi
            </span>
          )}

          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={item.label}
                className={cn(
                  "w-full flex items-center rounded-xl font-medium text-xs transition-all cursor-pointer relative group",
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2",
                  isActive
                    ? "bg-[#00799e] text-white font-semibold shadow-sm shadow-[#00799e]/25"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                )}
              >
                <div className={cn("flex items-center gap-2.5 truncate", isCollapsed && "justify-center")}>
                  <div
                    className={cn(
                      "size-6 rounded-lg flex items-center justify-center shrink-0",
                      isActive ? "bg-white/20 text-white" : "bg-transparent text-slate-400"
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {/* Badge Alert */}
                {item.badge !== undefined && (
                  isCollapsed ? (
                    <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
                  ) : (
                    <Badge
                      variant={isActive ? "secondary" : "destructive"}
                      className="h-5 px-1.5 font-mono text-[10px] font-bold"
                    >
                      {item.badge}
                    </Badge>
                  )
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom User Profile Section */}
      <div className="mt-6 flex flex-col gap-3 pt-3">
        <Separator className="bg-slate-100" />

        {isCollapsed ? (
          /* Minimized Profile View */
          <div className="flex flex-col items-center gap-2.5">
            <div
              onClick={onProfileClick}
              className="relative cursor-pointer group"
              title={`Profil: ${currentUser?.full_name || 'Super Admin'}`}
            >
              <Avatar className="size-9 shadow-xs group-hover:ring-2 group-hover:ring-[#00799e] transition-all">
                <AvatarFallback className="bg-gradient-to-tr from-[#005a75] to-[#00799e] text-white font-bold text-xs">
                  {currentUser?.full_name?.charAt(0) || <User className="size-4" />}
                </AvatarFallback>
              </Avatar>
              <span className="size-2 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 ring-2 ring-white" />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="size-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Keluar / Sign Out"
            >
              <LogOut className="size-4 text-rose-500" />
            </Button>
          </div>
        ) : (
          /* Full Expanded Profile View */
          <div
            onClick={onProfileClick}
            className="p-3 rounded-2xl bg-slate-100/70 hover:bg-slate-200/60 transition-all cursor-pointer group flex flex-col gap-2.5"
            title="Lihat profil pengguna"
          >
            {/* User Details Row */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <Avatar className="size-10 shadow-xs">
                  <AvatarFallback className="bg-gradient-to-tr from-[#005a75] to-[#00799e] text-white font-bold text-xs group-hover:scale-105 transition-transform">
                    {currentUser?.full_name?.charAt(0) || <User className="size-4" />}
                  </AvatarFallback>
                </Avatar>
                <span className="size-2.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 ring-2 ring-white" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-heading font-bold text-xs text-slate-900 truncate leading-tight block group-hover:text-[#00799e] transition-colors">
                    {currentUser?.full_name || 'Super Admin'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono truncate block leading-tight mt-0.5">
                  {currentUser?.email || 'admin@ascon.co.id'}
                </span>
                <div className="mt-1.5 flex items-center justify-between">
                  <Badge
                    variant={getRoleVariant(currentUser?.role)}
                    className="font-mono text-[9px] uppercase font-bold tracking-wider px-1.5 py-0"
                  >
                    {currentUser?.role || 'SUPER_ADMIN'}
                  </Badge>
                  <span className="text-[10px] text-slate-400 group-hover:text-[#00799e] transition-colors flex items-center">
                    Profil <ChevronRight className="size-3 ml-0.5" />
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Logout Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onLogout?.()
              }}
              className="w-full text-xs font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center gap-1.5"
              title="Keluar / Sign Out"
            >
              <LogOut className="size-3.5 text-rose-500" />
              <span>Keluar</span>
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}

