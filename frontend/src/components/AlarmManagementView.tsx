import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  Pencil,
  Gauge,
  Droplets,
  Zap,
  Thermometer,
  Layers,
  Power,
  Clock,
  Building2,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react'

interface AlarmManagementViewProps {
  alarms: AlarmItem[]
  rooms: AreaRoom[]
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
  rooms,
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
  const [editingRule, setEditingRule] = useState<AlarmRuleItem | null>(null)
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
      (alm.pumpName && alm.pumpName.toLowerCase().includes(alarmSearch.toLowerCase()))

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

    toast.success('Alarm Telah Diselesaikan', `Alarm ${resolvingAlarm.code} dinyatakan normal.`)
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
      toast.success('Aturan Alarm Diaktifkan', `${rule.name} sekarang aktif memonitor sensor.`)
    } else {
      toast.info('Aturan Alarm Dinonaktifkan', `${rule.name} dinonaktifkan sementara.`)
    }
  }

  // Add Rule
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRuleCode.trim() || !newRuleName.trim()) {
      toast.error('Form Tidak Lengkap', 'Harap isi kode dan nama aturan.')
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
      description: newRuleDesc || 'Aturan pengawasan telemetri otomatis.',
    }

    setRulesList((prev) => [newRule, ...prev])
    setIsAddRuleOpen(false)
    setNewRuleCode('')
    setNewRuleName('')
    setNewRuleDesc('')
    toast.success('Aturan Alarm Ditambahkan', `Aturan ${newRule.name} telah disimpan.`)
  }

  // Delete Rule
  const handleDeleteRule = async () => {
    if (!deleteRuleCandidate) return
    if (isBackendOnline) {
      api.alarmRules.delete(deleteRuleCandidate.id).catch(console.warn)
    }
    setRulesList((prev) => prev.filter((r) => r.id !== deleteRuleCandidate.id))
    toast.warning('Aturan Dihapus', `Aturan ${deleteRuleCandidate.name} telah dihapus.`)
    setDeleteRuleCandidate(null)
  }

  // Severity Badges
  const getSeverityBadge = (severity: AlarmItem['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white inline-flex items-center gap-1 shadow-2xs font-mono">
            <AlertOctagon className="w-3 h-3 text-white" />
            CRITICAL
          </span>
        )
      case 'HIGH':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white inline-flex items-center gap-1 shadow-2xs font-mono">
            <AlertTriangle className="w-3 h-3 text-white" />
            HIGH
          </span>
        )
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-600 text-white inline-flex items-center gap-1 shadow-2xs font-mono">
            <Info className="w-3 h-3 text-white" />
            MEDIUM
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 inline-flex items-center gap-1 font-mono">
            LOW
          </span>
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
    { value: 'ALL', label: 'Semua Severity', icon: <Shield className="w-3.5 h-3.5 text-slate-400" /> },
    { value: 'CRITICAL', label: 'Critical', sublabel: 'Stop Pompa', icon: <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0"></span> },
    { value: 'HIGH', label: 'High', sublabel: 'Peringatan Serius', icon: <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span> },
    { value: 'MEDIUM', label: 'Medium', sublabel: 'Standar', icon: <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 shrink-0"></span> },
    { value: 'LOW', label: 'Low', sublabel: 'Info', icon: <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span> },
  ]

  const statusFilterOptions: SelectOption[] = [
    { value: 'ALL', label: 'Semua Status', icon: <Layers className="w-3.5 h-3.5 text-slate-400" /> },
    { value: 'OPEN', label: 'Open', sublabel: 'Belum Diakui', icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> },
    { value: 'ACKNOWLEDGED', label: 'Acknowledged', sublabel: 'Dikonfirmasi', icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#00799e]" /> },
    { value: 'RESOLVED', label: 'Resolved', sublabel: 'Selesai Normal', icon: <Check className="w-3.5 h-3.5 text-emerald-600" /> },
  ]

  const metricOptions: SelectOption[] = [
    { value: 'pressure_bar', label: 'Tekanan Pipa (bar)', icon: <Gauge className="w-3.5 h-3.5 text-[#00799e]" />, sublabel: 'Manifold' },
    { value: 'flow_m3h', label: 'Debit Aliran (m³/h)', icon: <Droplets className="w-3.5 h-3.5 text-cyan-600" />, sublabel: 'Flowmeter' },
    { value: 'power_kw', label: 'Daya Listrik (kW)', icon: <Zap className="w-3.5 h-3.5 text-amber-500" />, sublabel: 'Kwh Panel' },
    { value: 'motor_temp_c', label: 'Suhu Motor (°C)', icon: <Thermometer className="w-3.5 h-3.5 text-rose-500" />, sublabel: 'Stator Temp' },
    { value: 'tank_level_pct', label: 'Level Tangki (%)', icon: <Layers className="w-3.5 h-3.5 text-emerald-600" />, sublabel: 'Reservoir' },
  ]

  const conditionOptions: SelectOption[] = [
    { value: '>', label: '> (Lebih Dari)', sublabel: 'Nilai di atas ambang' },
    { value: '<', label: '< (Kurang Dari)', sublabel: 'Nilai di bawah ambang' },
    { value: '>=', label: '>= (Lebih Dari / Sama)', sublabel: 'Batas maksimum toleransi' },
    { value: '<=', label: '<= (Kurang Dari / Sama)', sublabel: 'Batas minimum toleransi' },
  ]

  const severityModalOptions: SelectOption[] = [
    { value: 'CRITICAL', label: 'CRITICAL', sublabel: 'Bahaya Tinggi / Auto Stop', icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> },
    { value: 'HIGH', label: 'HIGH', sublabel: 'Peringatan Serius', icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> },
    { value: 'MEDIUM', label: 'MEDIUM', sublabel: 'Peringatan Standar', icon: <Info className="w-3.5 h-3.5 text-cyan-600" /> },
    { value: 'LOW', label: 'LOW', sublabel: 'Informasi Operasional', icon: <Info className="w-3.5 h-3.5 text-slate-400" /> },
  ]

  const pageSizeOptions: SelectOption[] = [
    { value: 5, label: '5 / halaman' },
    { value: 10, label: '10 / halaman' },
    { value: 20, label: '20 / halaman' },
    { value: 50, label: '50 / halaman' },
  ]

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* 1. Header Bar with Tabs Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading font-semibold text-xl sm:text-2xl text-slate-800 tracking-tight leading-none">
            Pusat Alarm &amp; Aturan Operasional
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-1.5 m-0">
            Monitoring anomali telemetri, proteksi anti-flicker pipa, dan manajemen aturan threshold
          </p>
        </div>

        {/* View Switcher Capsule */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveSubTab('feed')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'feed'
                  ? 'bg-white text-[#00799e] font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Daftar Alarm ({openCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('rules')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'rules'
                  ? 'bg-white text-[#00799e] font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Aturan Threshold ({rulesList.length})</span>
            </button>
          </div>

          {activeSubTab === 'rules' && (
            <button
              type="button"
              onClick={() => setIsAddRuleOpen(true)}
              className="px-3.5 py-1.5 bg-[#00799e] hover:bg-[#006887] text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Aturan Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Alarm Terbuka</span>
            <span className="font-heading font-bold text-2xl sm:text-3xl text-rose-600 block mt-0.5">
              {openCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Status Kritis</span>
            <span className="font-heading font-bold text-2xl sm:text-3xl text-slate-800 block mt-0.5">
              {criticalCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Telah Dikonfirmasi</span>
            <span className="font-heading font-bold text-2xl sm:text-3xl text-[#00799e] block mt-0.5">
              {ackCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#00799e]/10 text-[#00799e] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">Aturan Pengawasan</span>
            <span className="font-heading font-bold text-2xl sm:text-3xl text-slate-800 block mt-0.5">
              {activeRulesCount} <span className="text-xs font-normal text-slate-400">Aktif</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
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
                placeholder="Cari alarm berdasarkan kode, lokasi, atau pesan..."
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
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            {filteredAlarms.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                <h4 className="font-heading font-semibold text-base text-slate-800 mb-1">
                  Seluruh Sistem Normal
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Tidak ada alarm aktif yang cocok dengan kriteria filter saat ini.
                </p>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Severity &amp; Kode</th>
                        <th className="py-3 px-4">Penyebab Anomali</th>
                        <th className="py-3 px-4">Sumber / Unit Mesin</th>
                        <th className="py-3 px-4">Nilai vs Threshold</th>
                        <th className="py-3 px-4">Waktu Terjadi</th>
                        <th className="py-3 px-4">Status &amp; Konfirmasi</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedAlarms.map((alm) => {
                        const isOpen = alm.status === 'OPEN'
                        const isAck = alm.status === 'ACKNOWLEDGED'

                        return (
                          <tr key={alm.id} className="hover:bg-slate-50/70 transition-colors">
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
                                {alm.roomName || 'Area Distribusi Utama'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                {alm.pumpName || 'Sensor Jaringan'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-mono text-xs">
                                <span className="font-bold text-rose-600">
                                  {alm.currentValue} {alm.unit}
                                </span>
                                <span className="text-slate-400 text-[11px] block mt-0.5">
                                  Batas: {alm.threshold} {alm.unit}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {alm.timestamp}
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
                                      oleh {alm.acknowledgedBy}
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
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#00799e]/10 text-[#00799e] hover:bg-[#00799e] hover:text-white transition-all cursor-pointer"
                                    title="Konfirmasi tahu alarm"
                                  >
                                    Akui
                                  </button>
                                )}

                                {(isOpen || isAck) && (
                                  <button
                                    type="button"
                                    onClick={() => setResolvingAlarm(alm)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                                    title="Selesaikan masalah"
                                  >
                                    Selesai
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
                      Menampilkan{' '}
                      <strong className="text-slate-700 font-semibold">
                        {filteredAlarms.length > 0 ? alarmStartIdx + 1 : 0} -{' '}
                        {Math.min(alarmStartIdx + alarmPageSize, filteredAlarms.length)}
                      </strong>{' '}
                      dari <strong className="text-slate-700 font-semibold">{filteredAlarms.length}</strong> alarm
                    </span>

                    <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                      <span className="text-[11px] text-slate-400 font-normal">Tampilkan:</span>
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
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {Array.from({ length: totalAlarmPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setAlarmPage(pageNum)}
                        className={`min-w-[28px] h-7 px-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
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
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Halaman Selanjutnya"
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
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="font-heading font-semibold text-base text-slate-800 m-0">
                  Daftar Aturan Threshold Otomatis
                </h3>
                <p className="text-xs text-slate-400 m-0 font-normal mt-0.5">
                  Proteksi anti-flicker dan pemicu anomali pompa berdasarkan telemetri sensor
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddRuleOpen(true)}
                className="px-3.5 py-1.5 bg-[#00799e] hover:bg-[#006887] text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Aturan Baru</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Aturan &amp; Kode</th>
                    <th className="py-3 px-4">Parameter Sensor</th>
                    <th className="py-3 px-4">Kondisi Pemicu</th>
                    <th className="py-3 px-4">Tingkat Bahaya</th>
                    <th className="py-3 px-4">Anti-Flicker Debounce</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
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
                          {rule.debounceSeconds} Detik
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleRule(rule)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            rule.isEnabled ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              rule.isEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteRuleCandidate(rule)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus aturan"
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
                  Menampilkan{' '}
                  <strong className="text-slate-700 font-semibold">
                    {rulesList.length > 0 ? ruleStartIdx + 1 : 0} -{' '}
                    {Math.min(ruleStartIdx + rulePageSize, rulesList.length)}
                  </strong>{' '}
                  dari <strong className="text-slate-700 font-semibold">{rulesList.length}</strong> aturan
                </span>

                <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                  <span className="text-[11px] text-slate-400 font-normal">Tampilkan:</span>
                  <CustomSelect
                    options={[
                      { value: 4, label: '4 / halaman' },
                      { value: 6, label: '6 / halaman' },
                      { value: 10, label: '10 / halaman' },
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
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: totalRulePages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setRulePage(pageNum)}
                    className={`min-w-[28px] h-7 px-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
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
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Resolve Modal */}
      {resolvingAlarm &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setResolvingAlarm(null)
            }}
          >
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-slate-900 m-0">
                    Selesaikan / Normalisasi Alarm
                  </h3>
                  <p className="text-xs text-slate-400 m-0 font-mono">
                    {resolvingAlarm.code} - {resolvingAlarm.message}
                  </p>
                </div>
              </div>

              <form onSubmit={handleResolve} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Penyelesaian Masalah
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Contoh: Tekanan manifold telah dinormalkan setelah valve dibuka kembali..."
                    value={resolveReason}
                    onChange={(e) => setResolveReason(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00799e] focus:bg-white outline-hidden font-normal"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResolvingAlarm(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer"
                  >
                    Konfirmasi Selesai
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* 6. Add Alarm Rule Modal with CustomSelect */}
      {isAddRuleOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAddRuleOpen(false)
            }}
          >
            <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-[#00799e]/10 text-[#00799e] flex items-center justify-center shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-slate-900 m-0">
                    Buat Aturan Threshold Baru
                  </h3>
                  <p className="text-xs text-slate-400 m-0 font-normal">
                    Konfigurasi parameter pemicu peringatan otomatis SCADA
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateRule} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kode Aturan
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="RULE-PRESS-MAX"
                      value={newRuleCode}
                      onChange={(e) => setNewRuleCode(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-[#00799e] focus:bg-white outline-hidden font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tingkat Bahaya (Severity)
                    </label>
                    <CustomSelect
                      options={severityModalOptions}
                      value={newRuleSeverity}
                      onChange={(val) => setNewRuleSeverity(val)}
                      size="md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Aturan Pengawasan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Proteksi Tekanan Maksimum Manifold"
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-[#00799e] focus:bg-white outline-hidden font-normal"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Metrik
                    </label>
                    <CustomSelect
                      options={metricOptions}
                      value={newRuleMetric}
                      onChange={(val) => setNewRuleMetric(val)}
                      size="md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kondisi
                    </label>
                    <CustomSelect
                      options={conditionOptions}
                      value={newRuleCondition}
                      onChange={(val) => setNewRuleCondition(val)}
                      size="md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nilai Batas (Threshold)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newRuleThreshold}
                      onChange={(e) => setNewRuleThreshold(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-[#00799e] focus:bg-white outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Debounce Delay (Detik)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={newRuleDebounce}
                    onChange={(e) => setNewRuleDebounce(parseInt(e.target.value) || 5)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-[#00799e] focus:bg-white outline-hidden font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Durasi sensor harus berada di luar ambang batas sebelum alarm dibunyikan (anti-flicker).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deskripsi Masalah / Prosedur Operator
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Instruksi tindakan yang harus diambil operator saat alarm terpicu..."
                    value={newRuleDesc}
                    onChange={(e) => setNewRuleDesc(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00799e] focus:bg-white outline-hidden font-normal"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddRuleOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#00799e] hover:bg-[#006887] shadow-xs cursor-pointer"
                  >
                    Simpan Aturan
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* 7. Delete Rule Confirmation Modal */}
      {deleteRuleCandidate &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeleteRuleCandidate(null)
            }}
          >
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
              <div className="flex items-center gap-3 text-rose-600 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-base text-slate-900 m-0">
                    Konfirmasi Hapus Aturan Alarm
                  </h4>
                  <p className="text-xs text-slate-500 m-0 font-normal">
                    Aturan ini tidak akan lagi memonitor telemetri
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Aturan:</span>
                  <strong className="text-slate-800">{deleteRuleCandidate.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kondisi:</span>
                  <span className="font-mono text-rose-600">
                    {deleteRuleCandidate.condition} {deleteRuleCandidate.threshold} {deleteRuleCandidate.unit}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteRuleCandidate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteRule}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer"
                >
                  Ya, Hapus Aturan
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
