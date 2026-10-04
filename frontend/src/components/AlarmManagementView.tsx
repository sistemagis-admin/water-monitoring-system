import React, { useState, useEffect } from 'react'
import type { AlarmItem, AlarmRuleItem, AreaRoom } from '../types/pump'
import { api, type ApiUser } from '../services/api'
import { useToast } from '../context/ToastContext'
import { CustomSelect, type SelectOption } from './CustomSelect'
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  Sliders,
  Plus,
  Search,
  Check,
  RotateCcw,
  Trash2,
  Gauge,
  Droplets,
  Zap,
  Thermometer,
  Layers,
  Clock,
  Building2,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

interface AlarmManagementViewProps {
  alarms: AlarmItem[]
  rooms?: AreaRoom[]
  currentUser?: ApiUser | null
  isBackendOnline?: boolean
  onAcknowledgeAlarm: (alarmId: string) => Promise<void>
}

const INITIAL_RULES: AlarmRuleItem[] = [
  {
    id: 'rule-001',
    code: 'RULE-PRESS-HIGH',
    name: 'Overpressure Proteksi Pipa Utama',
    metricCode: 'pressure_bar',
    condition: '>',
    threshold: 6.5,
    unit: 'bar',
    severity: 'CRITICAL',
    debounceSeconds: 5,
    isEnabled: true,
    description: 'Memicu emergency stop jika tekanan manifold melebihi toleransi pipa.',
  },
  {
    id: 'rule-002',
    code: 'RULE-PRESS-LOW',
    name: 'Dry Run & Tekanan Rendah',
    metricCode: 'pressure_bar',
    condition: '<',
    threshold: 1.5,
    unit: 'bar',
    severity: 'HIGH',
    debounceSeconds: 10,
    isEnabled: true,
    description: 'Peringatan awal indikasi kavitasi atau kekosongan air pada pipa hisap.',
  },
  {
    id: 'rule-003',
    code: 'RULE-TEMP-HIGH',
    name: 'Overheating Suhu Gulungan Motor',
    metricCode: 'motor_temp_c',
    condition: '>',
    threshold: 55.0,
    unit: '°C',
    severity: 'HIGH',
    debounceSeconds: 15,
    isEnabled: true,
    description: 'Mencegah kerusakan isolasi stator akibat temperatur kerja berlebih.',
  },
  {
    id: 'rule-004',
    code: 'RULE-POWER-SURGE',
    name: 'Beban Daya Listrik Berlebih',
    metricCode: 'power_kw',
    condition: '>',
    threshold: 24.0,
    unit: 'kW',
    severity: 'MEDIUM',
    debounceSeconds: 8,
    isEnabled: true,
    description: 'Indikasi sumbatan impeller atau gesekan mekanikal pada bearing.',
  },
  {
    id: 'rule-005',
    code: 'RULE-TANK-LOW',
    name: 'Batas Minimum Reservoir Air Baku',
    metricCode: 'tank_level_pct',
    condition: '<',
    threshold: 20.0,
    unit: '%',
    severity: 'LOW',
    debounceSeconds: 30,
    isEnabled: false,
    description: 'Notifikasi level air baku di tangki penampungan utama rendah.',
  },
]

export const AlarmManagementView: React.FC<AlarmManagementViewProps> = ({
  alarms: initialAlarms,
  rooms: _rooms,
  currentUser,
  isBackendOnline,
  onAcknowledgeAlarm,
}) => {
  const toast = useToast()
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'rules'>('feed')

  // Alarms Feed State & Pagination
  const [alarmsList, setAlarmsList] = useState<AlarmItem[]>(initialAlarms)
  const [severityFilter, setSeverityFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [alarmSearch, setAlarmSearch] = useState('')
  const [alarmPage, setAlarmPage] = useState<number>(1)
  const [alarmPageSize, setAlarmPageSize] = useState<number>(10)

  // Resolve Modal State
  const [resolvingAlarm, setResolvingAlarm] = useState<AlarmItem | null>(null)
  const [resolveReason, setResolveReason] = useState('')

  // Alarm Rules State & Pagination
  const [rulesList, setRulesList] = useState<AlarmRuleItem[]>(INITIAL_RULES)
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false)
  const [deleteRuleCandidate, setDeleteRuleCandidate] = useState<AlarmRuleItem | null>(null)
  const [rulePage, setRulePage] = useState<number>(1)
  const [rulePageSize, setRulePageSize] = useState<number>(6)

  // Add Rule Form
  const [newRuleCode, setNewRuleCode] = useState('')
  const [newRuleName, setNewRuleName] = useState('')
  const [newRuleMetric, setNewRuleMetric] = useState('pressure_bar')
  const [newRuleCondition, setNewRuleCondition] = useState<'>' | '<' | '>=' | '<='>('>')
  const [newRuleThreshold, setNewRuleThreshold] = useState<number>(6.0)
  const [newRuleSeverity, setNewRuleSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH')
  const [newRuleDebounce, setNewRuleDebounce] = useState<number>(5)
  const [newRuleDesc, setNewRuleDesc] = useState('')

  // Sync initial alarms
  useEffect(() => {
    setAlarmsList(initialAlarms)
  }, [initialAlarms])

  // Reset pagination on filter change
  useEffect(() => {
    setAlarmPage(1)
  }, [severityFilter, statusFilter, alarmSearch, alarmPageSize])

  useEffect(() => {
    setRulePage(1)
  }, [rulePageSize])

  // Fetch backend alarm rules if online
  useEffect(() => {
    if (isBackendOnline) {
      api.alarmRules
        .list()
        .then((res) => {
          if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
            const mapped: AlarmRuleItem[] = res.data.map((r: any) => ({
              id: r.id,
              code: r.code,
              name: r.name,
              metricCode: r.metric_code || 'pressure_bar',
              condition: r.condition || '>',
              threshold: Number(r.threshold) || 5.0,
              unit: r.metric_code?.includes('pressure')
                ? 'bar'
                : r.metric_code?.includes('flow')
                ? 'm³/h'
                : r.metric_code?.includes('temp')
                ? '°C'
                : 'kW',
              severity: r.severity || 'HIGH',
              debounceSeconds: r.debounce_seconds || 5,
              isEnabled: r.is_enabled !== false,
              description: r.description || '',
            }))
            setRulesList(mapped)
          }
        })
        .catch(console.warn)
    }
  }, [isBackendOnline])

  // Filter Alarms
  const filteredAlarms = alarmsList.filter((alm) => {
    const matchesSeverity = severityFilter === 'ALL' || alm.severity === severityFilter
    const matchesStatus = statusFilter === 'ALL' || alm.status === statusFilter
    const matchesSearch =
      alm.message.toLowerCase().includes(alarmSearch.toLowerCase()) ||
      alm.code.toLowerCase().includes(alarmSearch.toLowerCase()) ||
      (alm.assetName && alm.assetName.toLowerCase().includes(alarmSearch.toLowerCase()))

    return matchesSeverity && matchesStatus && matchesSearch
  })

  // Alarms Pagination Calculation
  const totalAlarmPages = Math.ceil(filteredAlarms.length / alarmPageSize) || 1
  const safeAlarmPage = Math.min(Math.max(1, alarmPage), totalAlarmPages)
  const alarmStartIdx = (safeAlarmPage - 1) * alarmPageSize
  const paginatedAlarms = filteredAlarms.slice(alarmStartIdx, alarmStartIdx + alarmPageSize)

  // Rules Pagination Calculation
  const totalRulePages = Math.ceil(rulesList.length / rulePageSize) || 1
  const safeRulePage = Math.min(Math.max(1, rulePage), totalRulePages)
  const ruleStartIdx = (safeRulePage - 1) * rulePageSize
  const paginatedRules = rulesList.slice(ruleStartIdx, ruleStartIdx + rulePageSize)

  // Stats Counters
  const openCount = alarmsList.filter((a) => a.status === 'OPEN').length
  const criticalCount = alarmsList.filter((a) => a.severity === 'CRITICAL' && a.status === 'OPEN').length
  const ackCount = alarmsList.filter((a) => a.status === 'ACKNOWLEDGED').length
  const activeRulesCount = rulesList.filter((r) => r.isEnabled).length

  // Acknowledge Action
  const handleAcknowledge = async (alarm: AlarmItem) => {
    await onAcknowledgeAlarm(alarm.id)
    setAlarmsList((prev) =>
      prev.map((a) =>
        a.id === alarm.id
          ? {
              ...a,
              status: 'ACKNOWLEDGED',
              acknowledgedAt: new Date().toLocaleTimeString('id-ID'),
              acknowledgedBy: currentUser?.full_name || 'Operator SCADA',
            }
          : a
      )
    )
  }

  // Resolve Action
  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolvingAlarm) return

    if (isBackendOnline) {
      api.alarms.resolve(resolvingAlarm.id, resolveReason || 'Masalah telah dinormalisasi oleh operator').catch(console.warn)
    }

    setAlarmsList((prev) =>
      prev.map((a) =>
        a.id === resolvingAlarm.id
          ? {
              ...a,
              status: 'RESOLVED',
            }
          : a
      )
    )

    toast.success('Alarm Resolved', `Alarm ${resolvingAlarm.code} status set to resolved.`)
    setResolvingAlarm(null)
    setResolveReason('')
  }

  // Toggle Rule Enable/Disable
  const handleToggleRule = async (rule: AlarmRuleItem) => {
    const nextState = !rule.isEnabled
    if (isBackendOnline) {
      if (nextState) {
        api.alarmRules.enable(rule.id).catch(console.warn)
      } else {
        api.alarmRules.disable(rule.id).catch(console.warn)
      }
    }

    setRulesList((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, isEnabled: nextState } : r))
    )

    if (nextState) {
      toast.success('Alarm Rule Enabled', `${rule.name} is now actively evaluating live telemetry.`)
    } else {
      toast.info('Alarm Rule Disabled', `${rule.name} has been paused.`)
    }
  }

  // Add Rule
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRuleCode.trim() || !newRuleName.trim()) {
      toast.error('Incomplete Form', 'Please provide both rule code and rule name.')
      return
    }

    let unit = 'bar'
    if (newRuleMetric.includes('flow')) unit = 'm³/h'
    if (newRuleMetric.includes('temp')) unit = '°C'
    if (newRuleMetric.includes('power')) unit = 'kW'
    if (newRuleMetric.includes('level')) unit = '%'

    let resolvedId = `rule-${Date.now()}`
    if (isBackendOnline) {
      try {
        const res = await api.alarmRules.create({
          code: newRuleCode.trim(),
          name: newRuleName.trim(),
          metric_code: newRuleMetric,
          condition: newRuleCondition,
          threshold: newRuleThreshold,
          severity: newRuleSeverity,
          debounce_seconds: newRuleDebounce,
          description: newRuleDesc,
        })
        if (res?.success && res.data?.id) {
          resolvedId = res.data.id
        }
      } catch (err) {
        console.warn('Backend alarm rule create error:', err)
      }
    }

    const newRule: AlarmRuleItem = {
      id: resolvedId,
      code: newRuleCode.trim(),
      name: newRuleName.trim(),
      metricCode: newRuleMetric,
      condition: newRuleCondition,
      threshold: newRuleThreshold,
      unit,
      severity: newRuleSeverity,
      debounceSeconds: newRuleDebounce,
      isEnabled: true,
      description: newRuleDesc || 'Automated telemetry supervisory rule.',
    }

    setRulesList((prev) => [newRule, ...prev])
    setIsAddRuleOpen(false)
    setNewRuleCode('')
    setNewRuleName('')
    setNewRuleDesc('')
    toast.success('Alarm Rule Created', `Rule ${newRule.name} saved successfully.`)
  }

  // Delete Rule
  const handleDeleteRule = async () => {
    if (!deleteRuleCandidate) return
    if (isBackendOnline) {
      api.alarmRules.delete(deleteRuleCandidate.id).catch(console.warn)
    }
    setRulesList((prev) => prev.filter((r) => r.id !== deleteRuleCandidate.id))
    toast.warning('Alarm Rule Deleted', `Rule ${deleteRuleCandidate.name} has been removed.`)
    setDeleteRuleCandidate(null)
  }

  // Severity Badges using shadcn Badge
  const getSeverityBadge = (severity: AlarmItem['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <Badge variant="destructive" className="font-mono text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs">
            <AlertOctagon className="size-3" />
            CRITICAL
          </Badge>
        )
      case 'HIGH':
        return (
          <Badge variant="outline" className="font-mono text-[10px] font-bold bg-amber-500 text-white border-amber-500 inline-flex items-center gap-1 shadow-2xs">
            <AlertTriangle className="size-3" />
            HIGH
          </Badge>
        )
      case 'MEDIUM':
        return (
          <Badge variant="secondary" className="font-mono text-[10px] font-bold bg-cyan-600 text-white border-cyan-600 inline-flex items-center gap-1 shadow-2xs">
            <Info className="size-3" />
            MEDIUM
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="font-mono text-[10px] font-bold">
            LOW
          </Badge>
        )
    }
  }

  const getMetricIcon = (metricCode: string) => {
    if (metricCode.includes('pressure')) return <Gauge className="w-3.5 h-3.5 text-[#00799e]" />
    if (metricCode.includes('flow')) return <Droplets className="w-3.5 h-3.5 text-cyan-600" />
    if (metricCode.includes('power')) return <Zap className="w-3.5 h-3.5 text-amber-500" />
    if (metricCode.includes('temp')) return <Thermometer className="w-3.5 h-3.5 text-rose-500" />
    return <Layers className="w-3.5 h-3.5 text-slate-500" />
  }

  // Options for CustomSelect filters
  const severityFilterOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Severities', icon: <Shield className="w-3.5 h-3.5 text-slate-400" /> },
    { value: 'CRITICAL', label: 'Critical', sublabel: 'Auto Stop / Trip', icon: <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0"></span> },
    { value: 'HIGH', label: 'High', sublabel: 'Urgent Warning', icon: <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span> },
    { value: 'MEDIUM', label: 'Medium', sublabel: 'Advisory Warning', icon: <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 shrink-0"></span> },
    { value: 'LOW', label: 'Low', sublabel: 'Notice', icon: <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span> },
  ]

  const statusFilterOptions: SelectOption[] = [
    { value: 'ALL', label: 'All Statuses', icon: <Layers className="w-3.5 h-3.5 text-slate-400" /> },
    { value: 'OPEN', label: 'Open', sublabel: 'Unacknowledged', icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> },
    { value: 'ACKNOWLEDGED', label: 'Acknowledged', sublabel: 'Investigating', icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#00799e]" /> },
    { value: 'RESOLVED', label: 'Resolved', sublabel: 'Cleared', icon: <Check className="w-3.5 h-3.5 text-emerald-600" /> },
  ]

  const metricOptions: SelectOption[] = [
    { value: 'pressure_bar', label: 'Pressure (bar)', icon: <Gauge className="w-3.5 h-3.5 text-[#00799e]" />, sublabel: 'Manifold' },
    { value: 'flow_m3h', label: 'Flow Rate (m³/h)', icon: <Droplets className="w-3.5 h-3.5 text-cyan-600" />, sublabel: 'Flowmeter' },
    { value: 'power_kw', label: 'Active Power (kW)', icon: <Zap className="w-3.5 h-3.5 text-amber-500" />, sublabel: 'VFD Load' },
    { value: 'motor_temp_c', label: 'Motor Temp (°C)', icon: <Thermometer className="w-3.5 h-3.5 text-rose-500" />, sublabel: 'Stator' },
    { value: 'tank_level_pct', label: 'Tank Level (%)', icon: <Layers className="w-3.5 h-3.5 text-emerald-600" />, sublabel: 'Reservoir' },
  ]

  const conditionOptions: SelectOption[] = [
    { value: '>', label: '> (Greater Than)', sublabel: 'Value above limit' },
    { value: '<', label: '< (Less Than)', sublabel: 'Value below limit' },
    { value: '>=', label: '>= (Greater or Equal)', sublabel: 'Maximum threshold' },
    { value: '<=', label: '<= (Less or Equal)', sublabel: 'Minimum threshold' },
  ]

  const severityModalOptions: SelectOption[] = [
    { value: 'CRITICAL', label: 'CRITICAL', sublabel: 'Safety Trip / Auto Stop', icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> },
    { value: 'HIGH', label: 'HIGH', sublabel: 'Urgent Intervention', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> },
    { value: 'MEDIUM', label: 'MEDIUM', sublabel: 'Operational Warning', icon: <Info className="w-3.5 h-3.5 text-cyan-600" /> },
    { value: 'LOW', label: 'LOW', sublabel: 'Advisory Notice', icon: <Info className="w-3.5 h-3.5 text-slate-400" /> },
  ]

  const pageSizeOptions: SelectOption[] = [
    { value: 5, label: '5 / page' },
    { value: 10, label: '10 / page' },
    { value: 20, label: '20 / page' },
    { value: 50, label: '50 / page' },
  ]

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* 1. SCADA Alarm Dispatch Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-mono font-medium shadow-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                openCount > 0 ? 'bg-rose-500 led-pulse-rose' : 'bg-emerald-400 led-pulse-emerald'
              }`}
            ></span>
            <span className="tracking-wider text-[11px]">ALARM DISPATCH CENTER</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-mono shadow-2xs">
            <span className="text-slate-400">UNRESOLVED:</span>
            <span className={`font-bold ${openCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {openCount} EVENTS
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-amber-600 font-bold">{criticalCount} CRITICAL</span>
          </div>
        </div>

        {/* View Switcher using shadcn Tabs & Button */}
        <div className="flex items-center gap-2">
          <Tabs value={activeSubTab} onValueChange={(val) => setActiveSubTab(val as 'feed' | 'rules')}>
            <TabsList className="bg-slate-100 border border-slate-200/80 p-0.5 h-auto">
              <TabsTrigger
                value="feed"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#00799e] data-[state=active]:shadow-2xs cursor-pointer"
              >
                <Bell className="size-3.5" />
                <span>Active Alarms ({openCount})</span>
              </TabsTrigger>
              <TabsTrigger
                value="rules"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#00799e] data-[state=active]:shadow-2xs cursor-pointer"
              >
                <Sliders className="size-3.5" />
                <span>Alarm Rules ({rulesList.length})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeSubTab === 'rules' && (
            <Button
              type="button"
              size="sm"
              onClick={() => setIsAddRuleOpen(true)}
              className="bg-[#00799e] hover:bg-[#006887] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Create Alarm Rule</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Top Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500">
              ACTIVE UNRESOLVED
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="my-0.5">
            <span className="font-mono tabular-nums font-bold text-2xl sm:text-3xl text-rose-600 tracking-tight">
              {openCount}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <span>PRIORITY:</span>
            <span className="font-bold text-rose-600">{criticalCount} CRITICAL</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500">
              TRIP / CRITICAL
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-0.5">
            <span className="font-mono tabular-nums font-bold text-2xl sm:text-3xl text-slate-800 tracking-tight">
              {criticalCount}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <span>INTERLOCK:</span>
            <span className="font-semibold text-amber-600">AUTO STOP</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500">
              ACKNOWLEDGED
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#00799e]/10 text-[#00799e] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-0.5">
            <span className="font-mono tabular-nums font-bold text-2xl sm:text-3xl text-[#00799e] tracking-tight">
              {ackCount}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <span>OPERATOR:</span>
            <span className="font-semibold text-slate-700">IN REVIEW</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500">
              ACTIVE RULES
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <div className="my-0.5">
            <span className="font-mono tabular-nums font-bold text-2xl sm:text-3xl text-slate-800 tracking-tight">
              {activeRulesCount} <span className="text-xs font-normal text-slate-400">/ {rulesList.length}</span>
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <span>ANTI-FLICKER:</span>
            <span className="font-semibold text-emerald-600">ENABLED</span>
          </div>
        </div>
      </div>

      {/* 3. SUBTAB 1: ALARMS FEED */}
      {activeSubTab === 'feed' && (
        <div className="space-y-4">
          {/* Filter Toolbar with Sleek CustomSelect */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search alarms by code, location, or tag..."
                value={alarmSearch}
                onChange={(e) => setAlarmSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00799e] focus:bg-white outline-hidden shadow-2xs font-normal transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <CustomSelect
                options={severityFilterOptions}
                value={severityFilter}
                onChange={(val) => setSeverityFilter(val)}
                size="sm"
                className="w-44"
                minPopoverWidth="200px"
              />

              <CustomSelect
                options={statusFilterOptions}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                size="sm"
                className="w-44"
                minPopoverWidth="210px"
              />
            </div>
          </div>

          {/* Alarms Feed List Table */}
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden">
              {filteredAlarms.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center text-slate-400">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                  <h4 className="font-heading font-semibold text-base text-slate-800 mb-1">
                    All Alarms Cleared
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm font-mono">
                    No active alarms matching current filters.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Severity &amp; Code</th>
                          <th className="py-2.5 px-4">Condition / Description</th>
                          <th className="py-2.5 px-4">Station / Asset</th>
                          <th className="py-2.5 px-4">Trigger Value vs Limit</th>
                          <th className="py-2.5 px-4">Timestamp</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                      {paginatedAlarms.map((alm) => {
                        const isOpen = alm.status === 'OPEN'
                        const isAck = alm.status === 'ACKNOWLEDGED'

                        return (
                          <tr key={alm.id} className="hover:bg-slate-50/70 transition-colors duration-150 ease-out">
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1 items-start">
                                {getSeverityBadge(alm.severity)}
                                <span className="font-mono text-[11px] text-slate-500 font-semibold">
                                  {alm.code}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-900 block leading-tight">
                                {alm.message}
                              </span>
                              <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                                {alm.areaName || 'Main Distribution Area'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                {alm.assetName || 'Network Sensor'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-mono text-xs">
                                <span className="font-bold text-rose-600">
                                  {alm.value} {alm.unit}
                                </span>
                                <span className="text-slate-400 text-[11px] block mt-0.5">
                                  Limit: {alm.threshold} {alm.unit}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {alm.openedAt}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              {isOpen && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                                  <AlertOctagon className="w-3 h-3 text-rose-500 animate-pulse" />
                                  Open
                                </span>
                              )}
                              {isAck && (
                                <div>
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-50 text-[#00799e] border border-cyan-200 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Acknowledged
                                  </span>
                                  {alm.acknowledgedBy && (
                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                      by {alm.acknowledgedBy}
                                    </span>
                                  )}
                                </div>
                              )}
                              {alm.status === 'RESOLVED' && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  Resolved
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isOpen && (
                                  <button
                                    type="button"
                                    onClick={() => handleAcknowledge(alm)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#00799e]/10 text-[#00799e] hover:bg-[#00799e] hover:text-white transition-colors duration-150 ease-out active:scale-[0.975] cursor-pointer"
                                    title="Acknowledge alarm event"
                                  >
                                    Acknowledge
                                  </button>
                                )}

                                {(isOpen || isAck) && (
                                  <button
                                    type="button"
                                    onClick={() => setResolvingAlarm(alm)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors duration-150 ease-out active:scale-[0.975] cursor-pointer"
                                    title="Resolve condition"
                                  >
                                    Resolve
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Alarms Feed Pagination Bar */}
                <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="font-normal text-[11px] text-slate-500">
                      Showing{' '}
                      <strong className="text-slate-700 font-semibold">
                        {filteredAlarms.length > 0 ? alarmStartIdx + 1 : 0} -{' '}
                        {Math.min(alarmStartIdx + alarmPageSize, filteredAlarms.length)}
                      </strong>{' '}
                      of <strong className="text-slate-700 font-semibold">{filteredAlarms.length}</strong> alarms
                    </span>

                    <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                      <span className="text-[11px] text-slate-400 font-normal">Show:</span>
                      <CustomSelect
                        options={pageSizeOptions}
                        value={alarmPageSize}
                        onChange={(val) => {
                          setAlarmPageSize(Number(val))
                          setAlarmPage(1)
                        }}
                        size="sm"
                        className="w-32"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safeAlarmPage <= 1}
                      onClick={() => setAlarmPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 ease-out active:scale-[0.975] cursor-pointer"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {Array.from({ length: totalAlarmPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setAlarmPage(pageNum)}
                        className={`min-w-[28px] h-7 px-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 ease-out active:scale-[0.975] cursor-pointer ${
                          pageNum === safeAlarmPage
                            ? 'bg-[#00799e] text-white shadow-2xs'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={safeAlarmPage >= totalAlarmPages}
                      onClick={() => setAlarmPage((p) => Math.min(totalAlarmPages, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 ease-out active:scale-[0.975] cursor-pointer"
                      title="Next Page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. SUBTAB 2: ALARM RULES & THRESHOLDS */}
      {activeSubTab === 'rules' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <h3 className="font-heading font-semibold text-base text-slate-800 m-0">
                    Automatic Alarm Rules
                  </h3>
                  <p className="text-xs text-slate-400 m-0 font-normal mt-0.5">
                    Configured trip conditions and debounce filters for telemetry signals
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddRuleOpen(true)}
                  className="px-3.5 py-1.5 bg-[#00799e] hover:bg-[#006887] text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors duration-150 ease-out active:scale-[0.975]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Rule</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Rule Name &amp; Code</th>
                      <th className="py-2.5 px-4">Telemetry Metric</th>
                      <th className="py-2.5 px-4">Trip Condition</th>
                      <th className="py-2.5 px-4">Severity</th>
                      <th className="py-2.5 px-4">Debounce Delay</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors duration-150 ease-out">
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block leading-tight">
                          {rule.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                          {rule.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                          {getMetricIcon(rule.metricCode)}
                          <span className="font-mono text-slate-900 font-bold">{rule.metricCode}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-rose-600">
                        {rule.condition} {rule.threshold} {rule.unit}
                      </td>

                      <td className="py-3.5 px-4">{getSeverityBadge(rule.severity)}</td>

                      <td className="py-3.5 px-4">
                        <span className="text-xs text-slate-600 font-mono">
                          {rule.debounceSeconds}s
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <Switch
                          checked={rule.isEnabled}
                          onCheckedChange={() => handleToggleRule(rule)}
                        />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteRuleCandidate(rule)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors duration-150 ease-out active:scale-[0.975] cursor-pointer"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rules Pagination Bar */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span className="font-normal text-[11px] text-slate-500">
                  Showing{' '}
                  <strong className="text-slate-700 font-semibold">
                    {rulesList.length > 0 ? ruleStartIdx + 1 : 0} -{' '}
                    {Math.min(ruleStartIdx + rulePageSize, rulesList.length)}
                  </strong>{' '}
                  of <strong className="text-slate-700 font-semibold">{rulesList.length}</strong> rules
                </span>

                <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                  <span className="text-[11px] text-slate-400 font-normal">Show:</span>
                  <CustomSelect
                    options={[
                      { value: 4, label: '4 / page' },
                      { value: 6, label: '6 / page' },
                      { value: 10, label: '10 / page' },
                    ]}
                    value={rulePageSize}
                    onChange={(val) => {
                      setRulePageSize(Number(val))
                      setRulePage(1)
                    }}
                    size="sm"
                    className="w-32"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safeRulePage <= 1}
                  onClick={() => setRulePage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 ease-out active:scale-[0.975] cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: totalRulePages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setRulePage(pageNum)}
                    className={`min-w-[28px] h-7 px-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 ease-out active:scale-[0.975] cursor-pointer ${
                      pageNum === safeRulePage
                        ? 'bg-[#00799e] text-white shadow-2xs'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={safeRulePage >= totalRulePages}
                  onClick={() => setRulePage((p) => Math.min(totalRulePages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 ease-out active:scale-[0.975] cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Resolve Modal using shadcn Dialog */}
      <Dialog
        open={resolvingAlarm !== null}
        onOpenChange={(open) => !open && setResolvingAlarm(null)}
      >
        <DialogContent className="sm:max-w-md bg-white border-0 rounded-2xl shadow-xl p-6">
          <DialogHeader className="flex flex-col gap-1 pb-2">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <RotateCcw className="size-5" />
              </div>
              <div>
                <DialogTitle className="font-heading font-semibold text-lg text-slate-900 leading-tight">
                  Resolve / Clear Alarm
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 font-mono mt-0.5">
                  {resolvingAlarm?.code} - {resolvingAlarm?.message}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleResolve} className="flex flex-col gap-4 text-xs pt-1">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-700">
                Resolution Notes
              </label>
              <Textarea
                rows={3}
                required
                placeholder="e.g. Manifold pressure returned to nominal range after discharge valve reopened..."
                value={resolveReason}
                onChange={(e) => setResolveReason(e.target.value)}
                className="text-xs bg-slate-50 border-slate-200 focus:bg-white resize-none"
              />
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setResolvingAlarm(null)}
                className="text-xs font-medium text-slate-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs"
              >
                Confirm Resolved
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Add Alarm Rule Modal using shadcn Dialog */}
      <Dialog open={isAddRuleOpen} onOpenChange={setIsAddRuleOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white border-0 rounded-2xl shadow-xl p-6">
          <DialogHeader className="flex flex-col gap-1 pb-2">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-[#00799e]/10 text-[#00799e] flex items-center justify-center shrink-0">
                <Sliders className="size-5" />
              </div>
              <div>
                <DialogTitle className="font-heading font-semibold text-lg text-slate-900 leading-tight">
                  Create Alarm Rule
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 font-normal mt-0.5">
                  Configure automated trip triggers and debounce thresholds
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateRule} className="flex flex-col gap-4 text-xs pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">Rule Code</label>
                <Input
                  type="text"
                  required
                  placeholder="RULE-PRESS-MAX"
                  value={newRuleCode}
                  onChange={(e) => setNewRuleCode(e.target.value.toUpperCase())}
                  className="font-mono text-xs uppercase bg-slate-50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">Severity Level</label>
                <CustomSelect
                  options={severityModalOptions}
                  value={newRuleSeverity}
                  onChange={(val) => setNewRuleSeverity(val)}
                  size="md"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-700">Rule Description Name</label>
              <Input
                type="text"
                required
                placeholder="e.g. Manifold Maximum Pressure Protection"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                className="text-xs bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">Telemetry Metric</label>
                <CustomSelect
                  options={metricOptions}
                  value={newRuleMetric}
                  onChange={(val) => setNewRuleMetric(val)}
                  size="md"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">Condition</label>
                <CustomSelect
                  options={conditionOptions}
                  value={newRuleCondition}
                  onChange={(val) => setNewRuleCondition(val)}
                  size="md"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-700">Threshold Value</label>
                <Input
                  type="number"
                  step="0.1"
                  required
                  value={newRuleThreshold}
                  onChange={(e) => setNewRuleThreshold(parseFloat(e.target.value) || 0)}
                  className="font-mono text-xs bg-slate-50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-700">Debounce Delay (Seconds)</label>
              <Input
                type="number"
                min="1"
                max="120"
                required
                value={newRuleDebounce}
                onChange={(e) => setNewRuleDebounce(parseInt(e.target.value) || 5)}
                className="font-mono text-xs bg-slate-50"
              />
              <span className="text-[10px] text-slate-400">
                Duration sensor must remain outside safe limit before triggering alarm (anti-flicker).
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-700">Operator SOP / Recovery Notes</label>
              <Textarea
                rows={2}
                placeholder="Actionable instructions for operators when this condition triggers..."
                value={newRuleDesc}
                onChange={(e) => setNewRuleDesc(e.target.value)}
                className="text-xs bg-slate-50 resize-none"
              />
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddRuleOpen(false)}
                className="text-xs font-medium text-slate-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-semibold text-white bg-[#00799e] hover:bg-[#006887] shadow-xs"
              >
                Save Alarm Rule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 7. Delete Rule Confirmation Modal using shadcn AlertDialog */}
      <AlertDialog
        open={deleteRuleCandidate !== null}
        onOpenChange={(open) => !open && setDeleteRuleCandidate(null)}
      >
        <AlertDialogContent className="sm:max-w-md bg-white border-0 shadow-xl p-6">
          <AlertDialogHeader className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="size-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="size-5" />
              </div>
              <div>
                <AlertDialogTitle className="font-heading font-semibold text-base text-slate-900 m-0">
                  Delete Alarm Rule
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-slate-500 m-0 font-normal mt-0.5">
                  This rule will no longer trigger alarms or evaluate sensor thresholds
                </AlertDialogDescription>
              </div>
            </div>

            {deleteRuleCandidate && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 my-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Rule Name:</span>
                  <strong className="text-slate-800">{deleteRuleCandidate.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Condition:</span>
                  <span className="font-mono text-rose-600 font-bold">
                    {deleteRuleCandidate.condition} {deleteRuleCandidate.threshold} {deleteRuleCandidate.unit}
                  </span>
                </div>
              </div>
            )}
          </AlertDialogHeader>

          <AlertDialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <AlertDialogCancel asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteRuleCandidate(null)}
                className="text-xs font-medium text-slate-600"
              >
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteRule}
                className="text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs"
              >
                Delete Rule
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
