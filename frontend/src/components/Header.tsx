import React from 'react'
import { Bell, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  activeTab: string
  openAlarmsCount?: number
  onSelectTab?: (tabId: string) => void
  onOpenAddArea?: () => void
  onOpenAddPump?: () => void
}

const MENU_INFO: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Monitoring Dashboard',
    subtitle: 'Real-time telemetry, pump operations, and plant overview',
  },
  areas: {
    title: 'Plant Areas & Stations',
    subtitle: 'Intake, filtration zones, and clean water distribution',
  },
  pumps: {
    title: 'Pump Management',
    subtitle: 'Motor operational controls, flow rates, and discharge pressure',
  },
  sensors: {
    title: 'Sensors & Signal Binding',
    subtitle: 'Pressure transmitters, reservoir level sensors, and flow meters',
  },
  devices: {
    title: 'IoT Gateways & Edge Nodes',
    subtitle: 'MQTT broker connectivity and RTU telemetry health',
  },
  alarms: {
    title: 'Alarm Center',
    subtitle: 'Active threshold alerts, incident logs, and operator acknowledgments',
  },
  users: {
    title: 'User Management & RBAC',
    subtitle: 'Operator accounts, role permissions, and access control',
  },
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  openAlarmsCount = 0,
  onSelectTab,
}) => {
  const currentMenu = MENU_INFO[activeTab] || {
    title: 'Water Monitoring System',
    subtitle: 'Industrial IoT & Telemetry Dashboard',
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-200/60 select-none">
      {/* Left: Active Menu Name & Subtitle */}
      <div>
        <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight m-0 leading-tight">
          {currentMenu.title}
        </h1>
        <p className="text-xs text-slate-500 m-0 mt-1 font-normal">
          {currentMenu.subtitle}
        </p>
      </div>

      {/* Right Controls: WTP Status Badge, Date, Alarm Quick Link */}
      <div className="flex items-center gap-2.5">
        {/* Real-time Status Badge */}
        <Badge
          variant="outline"
          className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border-emerald-200/70 text-emerald-700 text-xs font-semibold shadow-2xs"
        >
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>WTP Bandung · Online</span>
        </Badge>

        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-600 text-xs font-medium shadow-2xs font-mono">
          <Clock className="size-3.5 text-slate-400" />
          <span>{currentDate}</span>
        </div>

        {/* Alarm Bell Quick Action */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onSelectTab?.('alarms')}
          className="relative size-9 rounded-xl bg-white border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs"
          title="Alarm Center"
        >
          <Bell className="size-4" />
          {openAlarmsCount > 0 && (
            <span className="size-2.5 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5 ring-2 ring-white" />
          )}
        </Button>
      </div>
    </header>
  )
}
