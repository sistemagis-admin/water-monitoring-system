import React, { useState, useEffect } from 'react'
import type { SystemUserItem } from '../types/pump'
import { api, type ApiUser } from '../services/api'
import { useToast } from '../context/ToastContext'
import { CustomSelect } from './CustomSelect'
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Trash2,
  Pencil,
  CheckCircle2,
  XCircle,
  Mail,
  Lock,
  Building2,
  Key,
  Layers,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

interface UserManagementViewProps {
  currentUser?: ApiUser | null
  isBackendOnline?: boolean
}

type UserRole = 'SUPER_ADMIN' | 'OPERATOR' | 'ENGINEER' | 'VIEWER'

interface RoleOption {
  id: UserRole
  title: string
  label: string
  badgeText: string
  icon: React.ComponentType<{ className?: string }>
  badgeBg: string
  badgeTextCol: string
  activeBorder: string
  activeBg: string
  desc: string
  level: string
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'OPERATOR',
    title: 'Field Operator',
    label: 'OPERATOR',
    badgeText: 'OPERATOR',
    icon: Shield,
    badgeBg: 'bg-emerald-500',
    badgeTextCol: 'text-emerald-700',
    activeBorder: 'border-emerald-500',
    activeBg: 'bg-emerald-50/60',
    desc: 'Pump motor start/stop control, real-time telemetry monitoring, and alarm acknowledgement.',
    level: 'Field Operations',
  },
  {
    id: 'ENGINEER',
    title: 'Engineer & Maintenance',
    label: 'ENGINEER',
    badgeText: 'ENGINEER',
    icon: ShieldCheck,
    badgeBg: 'bg-[#00799e]',
    badgeTextCol: 'text-[#00799e]',
    activeBorder: 'border-[#00799e]',
    activeBg: 'bg-[#00799e]/10',
    desc: 'Sensor calibration, IoT gateway configuration, and alarm threshold tuning.',
    level: 'Engineering & Calibration',
  },
  {
    id: 'SUPER_ADMIN',
    title: 'Super Administrator',
    label: 'SUPER_ADMIN',
    badgeText: 'SUPER ADMIN',
    icon: ShieldAlert,
    badgeBg: 'bg-slate-900',
    badgeTextCol: 'text-amber-500',
    activeBorder: 'border-slate-900',
    activeBg: 'bg-slate-100',
    desc: 'Full administrative access, user account management, and station configuration.',
    level: 'Root Administrator',
  },
  {
    id: 'VIEWER',
    title: 'Viewer / Audit Tamu',
    label: 'VIEWER',
    badgeText: 'VIEWER',
    icon: Eye,
    badgeBg: 'bg-slate-500',
    badgeTextCol: 'text-slate-600',
    activeBorder: 'border-slate-400',
    activeBg: 'bg-slate-50',
    desc: 'Read-only telemetry trends, live status viewing, and historical log auditing.',
    level: 'Read-Only Audit',
  },
]

interface PermissionItem {
  id: string
  module: string
  name: string
  desc: string
  roles: {
    SUPER_ADMIN: boolean
    ENGINEER: boolean
    OPERATOR: boolean
    VIEWER: boolean
  }
}

const PERMISSIONS_DATA: PermissionItem[] = [
  // 1. Pump Operations
  {
    id: 'p_pump_toggle',
    module: 'Pump Operations',
    name: 'Manual Pump Start / Stop Switch',
    desc: 'Start and stop motor pump units manually via web interface.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: true, VIEWER: false },
  },
  {
    id: 'p_pump_estop',
    module: 'Pump Operations',
    name: 'Emergency Station Stop',
    desc: 'Instantly shut down all station pumps upon critical conditions.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: true, VIEWER: false },
  },
  {
    id: 'p_pump_reset',
    module: 'Pump Operations',
    name: 'Reset Trip & Overload State',
    desc: 'Clear pump protective lockouts once electrical or mechanical issues are resolved.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: true, VIEWER: false },
  },
  {
    id: 'p_pump_vfd',
    module: 'Pump Operations',
    name: 'VFD Speed & Pressure Setpoints',
    desc: 'Adjust inverter output frequency and discharge manifold target pressure.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: false, VIEWER: false },
  },

  // 2. Telemetry & Sensors
  {
    id: 'p_telem_view',
    module: 'Telemetry & Sensors',
    name: 'Live Telemetry & Trend Graphs',
    desc: 'View real-time discharge pressure, flow rate, active load, and temperature.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: true, VIEWER: true },
  },
  {
    id: 'p_telem_export',
    module: 'Telemetry & Sensors',
    name: 'Export Telemetry Reports (PDF/CSV)',
    desc: 'Download historical logging summaries and pump operational records.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: true, VIEWER: true },
  },
  {
    id: 'p_sensor_calibrate',
    module: 'Telemetry & Sensors',
    name: 'Calibration & Dynamic Sensor Binding',
    desc: 'Configure sensor zero/span offsets and input signal channel mapping.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: false, VIEWER: false },
  },

  // 3. Alarm Center
  {
    id: 'p_alarm_view',
    module: 'Alarm Center',
    name: 'View Active Alarms & Events',
    desc: 'Inspect open, acknowledged, and resolved alarm records.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: true, VIEWER: true },
  },
  {
    id: 'p_alarm_ack',
    module: 'Alarm Center',
    name: 'Acknowledge Active Alarms',
    desc: 'Record operator awareness and assign acknowledgement ownership.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: true, VIEWER: false },
  },
  {
    id: 'p_alarm_resolve',
    module: 'Alarm Center',
    name: 'Resolve & Clear Alarm Events',
    desc: 'Close active alarm conditions with documented resolution notes.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: true, VIEWER: false },
  },
  {
    id: 'p_alarm_rules',
    module: 'Alarm Center',
    name: 'Manage Trip Rules & Debounce',
    desc: 'Create and modify trip thresholds and anti-flicker delay timers.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: false, VIEWER: false },
  },

  // 4. Asset Configuration
  {
    id: 'p_asset_area',
    module: 'Asset Configuration',
    name: 'Station & Area Management',
    desc: 'Create, modify, and delete plant stations and rated discharge capacities.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: false, VIEWER: false },
  },
  {
    id: 'p_asset_pump',
    module: 'Asset Configuration',
    name: 'Pump Asset Registration',
    desc: 'Register centrifugal pump assets, rated motor kW, and flow specifications.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: false, VIEWER: false },
  },
  {
    id: 'p_device_gateway',
    module: 'Asset Configuration',
    name: 'IoT Gateway Node Management',
    desc: 'Configure IP addresses, MQTT telemetry topics, and heartbeat intervals.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: false, VIEWER: false },
  },

  // 5. Security & RBAC
  {
    id: 'p_user_view',
    module: 'Security & RBAC',
    name: 'View Registered Users',
    desc: 'View operator and engineer user accounts and session timestamps.',
    roles: { SUPER_ADMIN: true, ENGINEER: false, OPERATOR: false, VIEWER: false },
  },
  {
    id: 'p_user_manage',
    module: 'Security & RBAC',
    name: 'Create & Update Accounts',
    desc: 'Register system accounts and modify active status privileges.',
    roles: { SUPER_ADMIN: true, ENGINEER: false, OPERATOR: false, VIEWER: false },
  },
  {
    id: 'p_user_role',
    module: 'Security & RBAC',
    name: 'Role & Permission Assignment',
    desc: 'Assign Super Admin, Engineer, Operator, or Viewer authorization roles.',
    roles: { SUPER_ADMIN: true, ENGINEER: false, OPERATOR: false, VIEWER: false },
  },
  {
    id: 'p_user_delete',
    module: 'Security & RBAC',
    name: 'Delete & Revoke User Accounts',
    desc: 'Permanently revoke user access and remove authentication records.',
    roles: { SUPER_ADMIN: true, ENGINEER: false, OPERATOR: false, VIEWER: false },
  },
]

const INITIAL_USERS: SystemUserItem[] = [
  {
    id: 'usr-001',
    email: 'admin@ascon.co.id',
    fullName: 'Super Admin Ascon',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    siteName: 'WTP Plant Bandung',
    createdAt: '12 Jan 2026',
    lastLogin: 'Hari ini, 12:45',
  },
  {
    id: 'usr-002',
    email: 'operator1@ascon.co.id',
    fullName: 'Budi Santoso',
    role: 'OPERATOR',
    status: 'ACTIVE',
    siteName: 'WTP Plant Bandung',
    createdAt: '15 Jan 2026',
    lastLogin: 'Kemarin, 18:20',
  },
  {
    id: 'usr-003',
    email: 'engineer.wtp@ascon.co.id',
    fullName: 'Rian Hidayat, S.T.',
    role: 'ENGINEER',
    status: 'ACTIVE',
    siteName: 'WTP Plant Bandung',
    createdAt: '01 Feb 2026',
    lastLogin: '03 Okt, 09:15',
  },
  {
    id: 'usr-004',
    email: 'viewer.audit@ascon.co.id',
    fullName: 'Siti Rahmawati',
    role: 'VIEWER',
    status: 'ACTIVE',
    siteName: 'WTP Plant Bandung',
    createdAt: '20 Feb 2026',
    lastLogin: '28 Sep, 14:00',
  },
]

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  isBackendOnline,
}) => {
  const toast = useToast()
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'permissions'>('users')

  // Users State & Pagination
  const [users, setUsers] = useState<SystemUserItem[]>(INITIAL_USERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [userPage, setUserPage] = useState<number>(1)
  const [userPageSize, setUserPageSize] = useState<number>(5)

  // Matrix Filter State & Pagination
  const [matrixSearch, setMatrixSearch] = useState('')
  const [matrixModuleFilter, setMatrixModuleFilter] = useState<string>('ALL')
  const [matrixPage, setMatrixPage] = useState<number>(1)
  const [matrixPageSize, setMatrixPageSize] = useState<number>(8)

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUserItem | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<SystemUserItem | null>(null)

  // Add Form State
  const [addEmail, setAddEmail] = useState('')
  const [addFullName, setAddFullName] = useState('')
  const [addPassword, setAddPassword] = useState('')
  const [addRole, setAddRole] = useState<UserRole>('OPERATOR')

  // Edit Form State
  const [editFullName, setEditFullName] = useState('')
  const [editRole, setEditRole] = useState<UserRole>('OPERATOR')
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')

  // Reset pagination when filters change
  useEffect(() => {
    setUserPage(1)
  }, [searchQuery, roleFilter, userPageSize])

  useEffect(() => {
    setMatrixPage(1)
  }, [matrixSearch, matrixModuleFilter, matrixPageSize])

  // Fetch users from backend if online
  useEffect(() => {
    if (isBackendOnline) {
      api.users
        .list()
        .then((res) => {
          if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
            const mapped: SystemUserItem[] = res.data.map((u: any) => ({
              id: u.id,
              email: u.email,
              fullName: u.full_name || u.name || 'User',
              role: u.role || 'OPERATOR',
              status: u.is_active !== false ? 'ACTIVE' : 'INACTIVE',
              siteName: u.site_name || 'WTP Plant Bandung',
              createdAt: u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '01 Okt 2026',
              lastLogin: u.last_login_at ? new Date(u.last_login_at).toLocaleTimeString('id-ID') : 'Aktif',
            }))
            setUsers(mapped)
          }
        })
        .catch(console.warn)
    }
  }, [isBackendOnline])

  // Filtered Users & Pagination Calculation
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRole && matchesSearch
  })

  const totalUserPages = Math.ceil(filteredUsers.length / userPageSize) || 1
  const safeUserPage = Math.min(Math.max(1, userPage), totalUserPages)
  const userStartIdx = (safeUserPage - 1) * userPageSize
  const paginatedUsers = filteredUsers.slice(userStartIdx, userStartIdx + userPageSize)

  // Filtered Permissions & Pagination Calculation
  const filteredPermissions = PERMISSIONS_DATA.filter((p) => {
    const matchesModule = matrixModuleFilter === 'ALL' || p.module === matrixModuleFilter
    const matchesSearch =
      p.name.toLowerCase().includes(matrixSearch.toLowerCase()) ||
      p.desc.toLowerCase().includes(matrixSearch.toLowerCase()) ||
      p.module.toLowerCase().includes(matrixSearch.toLowerCase())
    return matchesModule && matchesSearch
  })

  const totalMatrixPages = Math.ceil(filteredPermissions.length / matrixPageSize) || 1
  const safeMatrixPage = Math.min(Math.max(1, matrixPage), totalMatrixPages)
  const matrixStartIdx = (safeMatrixPage - 1) * matrixPageSize
  const paginatedPermissions = filteredPermissions.slice(matrixStartIdx, matrixStartIdx + matrixPageSize)

  // Unique modules for matrix filter
  const matrixModules = Array.from(new Set(PERMISSIONS_DATA.map((p) => p.module)))

  // Handle Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addEmail.trim() || !addFullName.trim() || !addPassword.trim()) {
      toast.error('Incomplete Form', 'Please fill in all registration fields.')
      return
    }

    if (addPassword.length < 6) {
      toast.error('Password Too Short', 'Password must be at least 6 characters.')
      return
    }

    let createdId = `usr-${Date.now()}`
    if (isBackendOnline) {
      try {
        const res = await api.users.create({
          email: addEmail.trim(),
          full_name: addFullName.trim(),
          password: addPassword,
          role: addRole,
        })
        if (!res?.success) {
          const errMsg = res?.error?.message || 'Failed to register account on server.'
          toast.error('Failed to Create User', errMsg)
          return
        }
        if (res.data?.id) {
          createdId = res.data.id
        }
      } catch (err: any) {
        toast.error('Failed to Create User', err?.message || 'Connection error to Fastify server.')
        return
      }
    }

    const newUser: SystemUserItem = {
      id: createdId,
      email: addEmail.trim(),
      fullName: addFullName.trim(),
      role: addRole,
      status: 'ACTIVE',
      siteName: 'WTP Plant Bandung',
      createdAt: new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
      lastLogin: 'Never',
    }

    setUsers((prev) => [newUser, ...prev])
    setIsAddOpen(false)
    setAddEmail('')
    setAddFullName('')
    setAddPassword('')
    toast.success('User Created', `Account for ${newUser.fullName} (${newUser.role}) has been registered.`)
  }

  // Handle Edit User
  const handleOpenEdit = (user: SystemUserItem) => {
    setEditingUser(user)
    setEditFullName(user.fullName)
    setEditRole(user.role)
    setEditStatus(user.status)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    if (isBackendOnline) {
      api.users
        .update(editingUser.id, {
          full_name: editFullName,
          role: editRole,
          status: editStatus,
        })
        .catch(console.warn)
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id
          ? { ...u, fullName: editFullName, role: editRole, status: editStatus }
          : u
      )
    )

    setEditingUser(null)
    toast.info('User Updated', `Account for ${editFullName} has been updated.`)
  }

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!deleteCandidate) return
    if (isBackendOnline) {
      api.users.delete(deleteCandidate.id).catch(console.warn)
    }
    setUsers((prev) => prev.filter((u) => u.id !== deleteCandidate.id))
    toast.warning('User Deleted', `Account for ${deleteCandidate.fullName} has been removed.`)
    setDeleteCandidate(null)
  }

  const getRoleBadge = (role: SystemUserItem['role']) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <Badge className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white inline-flex items-center gap-1 shadow-2xs font-mono border-0">
            <ShieldAlert className="size-3 text-amber-400" />
            SUPER ADMIN
          </Badge>
        )
      case 'ENGINEER':
        return (
          <Badge className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00799e] hover:bg-[#00799e] text-white inline-flex items-center gap-1 shadow-2xs font-mono border-0">
            <ShieldCheck className="size-3 text-cyan-200" />
            ENGINEER
          </Badge>
        )
      case 'OPERATOR':
        return (
          <Badge className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 hover:bg-emerald-600 text-white inline-flex items-center gap-1 shadow-2xs font-mono border-0">
            <Shield className="size-3 text-white" />
            OPERATOR
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border-slate-200 inline-flex items-center gap-1 font-mono">
            <Eye className="size-3 text-slate-500" />
            VIEWER
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* 1. RBAC Access Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-mono font-medium shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 led-pulse-emerald"></span>
            <span className="tracking-wider text-[11px]">ACCESS CONTROL &amp; RBAC</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-mono shadow-2xs">
            <span className="text-slate-400">TOTAL:</span>
            <span className="font-bold text-slate-800">{users.length} REGISTERED</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-600 font-bold">
              {users.filter((u) => u.status === 'ACTIVE').length} ACTIVE
            </span>
          </div>
        </div>

        {/* View Switcher Capsule & Action Button */}
        <div className="flex items-center gap-2">
          <Tabs
            value={activeSubTab}
            onValueChange={(val) => setActiveSubTab(val as 'users' | 'permissions')}
            className="w-auto"
          >
            <TabsList className="bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 h-auto">
              <TabsTrigger
                value="users"
                className="px-3 py-1.5 rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-[#00799e] data-[state=active]:font-semibold data-[state=active]:shadow-2xs gap-1.5 cursor-pointer"
              >
                <Users className="size-3.5" />
                <span>User Accounts ({users.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="permissions"
                className="px-3 py-1.5 rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-[#00799e] data-[state=active]:font-semibold data-[state=active]:shadow-2xs gap-1.5 cursor-pointer"
              >
                <Key className="size-3.5" />
                <span>Role Permissions Matrix</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeSubTab === 'users' && (
            <Button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="h-8 px-4 bg-[#00799e] hover:bg-[#006887] text-white text-xs font-semibold rounded-xl shadow-xs gap-1.5 cursor-pointer"
            >
              <UserPlus className="size-3.5" />
              <span>Add User</span>
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: USER ACCOUNTS                                                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'users' && (
        <div className="space-y-4 animate-fade-in">
          {/* Top Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500">
                  TOTAL USERS
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#00799e]/10 text-[#00799e] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="my-1">
                <span className="font-mono tabular-nums font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                  {users.length}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>DIRECTORY:</span>
                <span className="font-semibold text-slate-700">SYSTEM DB</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500">
                  SUPER ADMIN
                </span>
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="my-1">
                <span className="font-mono tabular-nums font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                  {users.filter((u) => u.role === 'SUPER_ADMIN').length}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>LEVEL:</span>
                <span className="font-semibold text-amber-600">MASTER ACCESS</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500">
                  FIELD OPERATIONS
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="my-1">
                <span className="font-mono tabular-nums font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                  {users.filter((u) => u.role === 'OPERATOR' || u.role === 'ENGINEER').length}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>OPERATIONS:</span>
                <span className="font-semibold text-emerald-600">CERTIFIED</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500">
                  ACTIVE USERS
                </span>
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="my-1">
                <span className="font-mono tabular-nums font-bold text-2xl sm:text-3xl text-emerald-600 tracking-tight">
                  {users.filter((u) => u.status === 'ACTIVE').length}{' '}
                  <span className="text-xs font-normal text-slate-400">/ {users.length}</span>
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>SECURITY:</span>
                <span className="font-semibold text-emerald-600">NOMINAL</span>
              </div>
            </div>
          </div>

          {/* Search & Sleek Role Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl shadow-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#00799e] h-9"
              />
            </div>

            {/* Custom Pill Filter Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setRoleFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors duration-150 ease-out active:scale-[0.975] ${
                  roleFilter === 'ALL'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                All ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('SUPER_ADMIN')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors duration-150 ease-out active:scale-[0.975] flex items-center gap-1 ${
                  roleFilter === 'SUPER_ADMIN'
                    ? 'bg-slate-900 text-amber-300 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <ShieldAlert className="w-3 h-3 text-amber-500" />
                Super Admin ({users.filter((u) => u.role === 'SUPER_ADMIN').length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('ENGINEER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors duration-150 ease-out active:scale-[0.975] flex items-center gap-1 ${
                  roleFilter === 'ENGINEER'
                    ? 'bg-[#00799e] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <ShieldCheck className="w-3 h-3 text-cyan-300" />
                Engineer ({users.filter((u) => u.role === 'ENGINEER').length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('OPERATOR')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors duration-150 ease-out active:scale-[0.975] flex items-center gap-1 ${
                  roleFilter === 'OPERATOR'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Shield className="w-3 h-3 text-emerald-200" />
                Operator ({users.filter((u) => u.role === 'OPERATOR').length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('VIEWER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors duration-150 ease-out active:scale-[0.975] flex items-center gap-1 ${
                  roleFilter === 'VIEWER'
                    ? 'bg-slate-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Eye className="w-3 h-3" />
                Viewer ({users.filter((u) => u.role === 'VIEWER').length})
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden">
              {filteredUsers.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center text-slate-400">
                  <Users className="w-10 h-10 text-slate-300 mb-2" />
                  <h4 className="font-heading font-semibold text-base text-slate-800 mb-1">
                    No Users Found
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mb-4 font-mono">
                    {searchQuery ? `No users match "${searchQuery}".` : 'No users registered under this filter.'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50 text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500 border-b border-slate-200">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="py-2.5 px-4 font-mono font-semibold text-slate-500">Full Name &amp; Email</TableHead>
                          <TableHead className="py-2.5 px-4 font-mono font-semibold text-slate-500">Access Role</TableHead>
                          <TableHead className="py-2.5 px-4 font-mono font-semibold text-slate-500">Assigned Plant</TableHead>
                          <TableHead className="py-2.5 px-4 font-mono font-semibold text-slate-500">Account Status</TableHead>
                          <TableHead className="py-2.5 px-4 font-mono font-semibold text-slate-500">Created Date</TableHead>
                          <TableHead className="py-2.5 px-4 text-right font-mono font-semibold text-slate-500">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100 bg-white">
                      {paginatedUsers.map((u) => (
                        <TableRow key={u.id} className="hover:bg-slate-50/70 transition-colors duration-150 ease-out">
                          <TableCell className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-[#00799e]/10 text-[#00799e] font-bold text-xs flex items-center justify-center shrink-0 border border-[#00799e]/20">
                                {u.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 block leading-tight">
                                  {u.fullName}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-3.5 px-4">{getRoleBadge(u.role)}</TableCell>

                          <TableCell className="py-3.5 px-4">
                            <span className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                              <Building2 className="size-3.5 text-slate-400" />
                              {u.siteName || 'WTP Plant Bandung'}
                            </span>
                          </TableCell>

                          <TableCell className="py-3.5 px-4">
                            {u.status === 'ACTIVE' ? (
                              <Badge variant="outline" className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle2 className="size-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border-rose-200 inline-flex items-center gap-1">
                                <XCircle className="size-3" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="py-3.5 px-4 text-[11px] font-mono text-slate-500">
                            {u.createdAt}
                          </TableCell>

                          <TableCell className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleOpenEdit(u)}
                                className="text-slate-400 hover:text-[#00799e] hover:bg-[#00799e]/10 cursor-pointer"
                                title={`Edit account ${u.fullName}`}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              {u.email !== currentUser?.email && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => setDeleteCandidate(u)}
                                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  title={`Delete user ${u.fullName}`}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* User List Pagination Bar */}
                <div className="p-3.5 bg-slate-50/70 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="font-normal text-[11px] text-slate-500">
                      Showing{' '}
                      <strong className="text-slate-700 font-semibold">
                        {filteredUsers.length > 0 ? userStartIdx + 1 : 0} -{' '}
                        {Math.min(userStartIdx + userPageSize, filteredUsers.length)}
                      </strong>{' '}
                      of <strong className="text-slate-700 font-semibold">{filteredUsers.length}</strong> users
                    </span>

                    <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                      <span className="text-[11px] text-slate-400 font-normal">Show:</span>
                      <CustomSelect
                        options={[
                          { value: 5, label: '5 / page' },
                          { value: 10, label: '10 / page' },
                          { value: 20, label: '20 / page' },
                          { value: 50, label: '50 / page' },
                        ]}
                        value={userPageSize}
                        onChange={(val) => {
                          setUserPageSize(Number(val))
                          setUserPage(1)
                        }}
                        size="sm"
                        className="w-32"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safeUserPage <= 1}
                      onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 ease-out active:scale-[0.975] cursor-pointer"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {Array.from({ length: totalUserPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setUserPage(pageNum)}
                        className={`min-w-[28px] h-7 px-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 ease-out active:scale-[0.975] cursor-pointer ${
                          pageNum === safeUserPage
                            ? 'bg-[#00799e] text-white shadow-2xs'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={safeUserPage >= totalUserPages}
                      onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
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

      {/* ========================================================================= */}
      {/* SUBTAB 2: ROLE & MATRIKS HAK AKSES (RBAC MATRIX)                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'permissions' && (
        <div className="space-y-6 animate-fade-in">
          {/* 4 Role Profile Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {ROLE_OPTIONS.map((r) => {
              const Icon = r.icon
              const count = users.filter((u) => u.role === r.id).length
              return (
                <div key={r.id} className="bg-white rounded-2xl p-5 shadow-xs hover:shadow-md transition-[box-shadow,transform] duration-150 ease-out flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl ${r.badgeBg} text-white flex items-center justify-center shadow-xs`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-heading font-semibold text-sm text-slate-900 m-0">
                            {r.label}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            {r.level}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                        {count} Accounts
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-normal leading-relaxed m-0 mb-3">
                      {r.desc}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">ACCESS:</span>
                    <span className={`font-semibold ${r.badgeTextCol}`}>
                      {r.id === 'SUPER_ADMIN' ? '100% ROOT' : r.id === 'ENGINEER' ? '80% TECH' : r.id === 'OPERATOR' ? '60% OPS' : '20% VIEW'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Interactive Permission Matrix Table */}
          <div className="bg-white rounded-2xl shadow-xs overflow-hidden">
              {/* Header / Filter inside Table */}
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <h3 className="font-heading font-semibold text-base text-slate-800 m-0">
                    Role-Based Access Control (RBAC) Matrix
                  </h3>
                  <p className="text-xs text-slate-400 m-0 font-normal mt-0.5">
                    Module permission mapping across operator, engineering, and administrative roles
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search permissions..."
                    value={matrixSearch}
                    onChange={(e) => setMatrixSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00799e] outline-hidden font-normal"
                  />
                </div>

                <CustomSelect
                  options={[
                    { value: 'ALL', label: `All Modules (${PERMISSIONS_DATA.length})` },
                    ...matrixModules.map((m) => ({
                      value: m,
                      label: `Module: ${m}`,
                      sublabel: `${PERMISSIONS_DATA.filter((p) => p.module === m).length} permissions`,
                    })),
                  ]}
                  value={matrixModuleFilter}
                  onChange={(val) => setMatrixModuleFilter(val)}
                  size="sm"
                  className="w-56"
                  minPopoverWidth="230px"
                />
              </div>
            </div>

            {/* Matrix Table */}
            {filteredPermissions.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center text-slate-400">
                <Search className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-700 m-0">No Permissions Found</p>
                <span className="text-[11px] text-slate-400">
                  Try adjusting your search query or module filter.
                </span>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-100/70 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="py-3 px-4 w-[38%] font-semibold text-slate-600">Feature &amp; Authorization Description</TableHead>
                        <TableHead className="py-3 px-4 w-[16%] font-semibold text-slate-600">Security Module</TableHead>
                        <TableHead className="py-3 px-3 text-center w-[11.5%] font-semibold text-slate-600">
                          <div className="flex flex-col items-center">
                            <span className="text-slate-900 font-bold">SUPER ADMIN</span>
                            <span className="text-[9px] text-amber-600 font-mono font-normal">Root / Master</span>
                          </div>
                        </TableHead>
                        <TableHead className="py-3 px-3 text-center w-[11.5%] font-semibold text-slate-600">
                          <div className="flex flex-col items-center">
                            <span className="text-[#00799e] font-bold">ENGINEER</span>
                            <span className="text-[9px] text-slate-400 font-mono font-normal">Technical &amp; IoT</span>
                          </div>
                        </TableHead>
                        <TableHead className="py-3 px-3 text-center w-[11.5%] font-semibold text-slate-600">
                          <div className="flex flex-col items-center">
                            <span className="text-emerald-700 font-bold">OPERATOR</span>
                            <span className="text-[9px] text-slate-400 font-mono font-normal">Pump Control</span>
                          </div>
                        </TableHead>
                        <TableHead className="py-3 px-3 text-center w-[11.5%] font-semibold text-slate-600">
                          <div className="flex flex-col items-center">
                            <span className="text-slate-600 font-bold">VIEWER</span>
                            <span className="text-[9px] text-slate-400 font-mono font-normal">Monitoring</span>
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100">
                      {paginatedPermissions.map((perm) => (
                        <TableRow key={perm.id} className="hover:bg-slate-50/70 transition-colors duration-150 ease-out">
                          <TableCell className="py-3 px-4">
                            <span className="font-semibold text-slate-900 block leading-tight">
                              {perm.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal block mt-0.5 leading-snug">
                              {perm.desc}
                            </span>
                          </TableCell>

                          <TableCell className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                              <Layers className="size-3 text-slate-400" />
                              {perm.module}
                            </span>
                          </TableCell>

                          {/* SUPER_ADMIN */}
                          <TableCell className="py-3 px-3 text-center">
                            {perm.roles.SUPER_ADMIN ? (
                              <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-600 shadow-2xs">
                                <Check className="size-3.5 stroke-[2.5]" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center size-6 rounded-full bg-slate-100 text-slate-300">
                                <XCircle className="size-3.5" />
                              </span>
                            )}
                          </TableCell>

                          {/* ENGINEER */}
                          <TableCell className="py-3 px-3 text-center">
                            {perm.roles.ENGINEER ? (
                              <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-600 shadow-2xs">
                                <Check className="size-3.5 stroke-[2.5]" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center size-6 rounded-full bg-slate-100 text-slate-300">
                                <XCircle className="size-3.5" />
                              </span>
                            )}
                          </TableCell>

                          {/* OPERATOR */}
                          <TableCell className="py-3 px-3 text-center">
                            {perm.roles.OPERATOR ? (
                              <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-600 shadow-2xs">
                                <Check className="size-3.5 stroke-[2.5]" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center size-6 rounded-full bg-slate-100 text-slate-300">
                                <XCircle className="size-3.5" />
                              </span>
                            )}
                          </TableCell>

                          {/* VIEWER */}
                          <TableCell className="py-3 px-3 text-center">
                            {perm.roles.VIEWER ? (
                              <span className="inline-flex items-center justify-center size-6 rounded-full bg-emerald-100 text-emerald-600 shadow-2xs">
                                <Check className="size-3.5 stroke-[2.5]" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center size-6 rounded-full bg-slate-100 text-slate-300">
                                <XCircle className="size-3.5" />
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Matrix Pagination Bar */}
                <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="font-normal text-[11px] text-slate-500">
                      Showing{' '}
                      <strong className="text-slate-700 font-semibold">
                        {filteredPermissions.length > 0 ? matrixStartIdx + 1 : 0} -{' '}
                        {Math.min(matrixStartIdx + matrixPageSize, filteredPermissions.length)}
                      </strong>{' '}
                      of <strong className="text-slate-700 font-semibold">{filteredPermissions.length}</strong> permissions
                    </span>

                    <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                      <span className="text-[11px] text-slate-400 font-normal">Show:</span>
                      <CustomSelect
                        options={[
                          { value: 6, label: '6 / page' },
                          { value: 8, label: '8 / page' },
                          { value: 12, label: '12 / page' },
                          { value: 18, label: '18 / page' },
                          { value: 25, label: '25 / page' },
                        ]}
                        value={matrixPageSize}
                        onChange={(val) => {
                          setMatrixPageSize(Number(val))
                          setMatrixPage(1)
                        }}
                        size="sm"
                        className="w-32"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safeMatrixPage <= 1}
                      onClick={() => setMatrixPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 ease-out active:scale-[0.975] cursor-pointer"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {Array.from({ length: totalMatrixPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setMatrixPage(pageNum)}
                        className={`min-w-[28px] h-7 px-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 ease-out active:scale-[0.975] cursor-pointer ${
                          pageNum === safeMatrixPage
                            ? 'bg-[#00799e] text-white shadow-2xs'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={safeMatrixPage >= totalMatrixPages}
                      onClick={() => setMatrixPage((p) => Math.min(totalMatrixPages, p + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 ease-out active:scale-[0.975] cursor-pointer"
                      title="Next Page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Matrix Footer Note */}
            <div className="p-3 bg-slate-100/70 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs"></span>
                  <strong className="text-slate-700">Authorized:</strong> Full execution &amp; control privileges
                </span>
                <span className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                  <strong className="text-slate-700">Restricted:</strong> Access denied by system policy
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Role-Based Access Control Specification
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ADD USER MODAL WITH SLEEK CUSTOM ROLE SELECTOR CARDS                  */}
      {/* ========================================================================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white border-0 rounded-2xl shadow-xl p-6">
          <DialogHeader className="flex flex-col gap-1 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-[#00799e]/10 text-[#00799e] flex items-center justify-center shrink-0">
                <UserPlus className="size-5" />
              </div>
              <div>
                <DialogTitle className="font-heading font-semibold text-lg text-slate-900 m-0">
                  Add System User
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 m-0 font-normal">
                  Create a new account with role-based system privileges
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Budi Santoso, S.T."
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  className="bg-slate-50 border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#00799e] h-9"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Login ID)
                </label>
                <div className="relative">
                  <Mail className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <Input
                    type="email"
                    required
                    placeholder="operator@ascon.co.id"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="pl-9 bg-slate-50 border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#00799e] h-9"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Password
              </label>
              <div className="relative">
                <Lock className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters..."
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#00799e] h-9"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Password must be at least 6 characters.
              </span>
            </div>

            {/* Custom Modern Role Selector Cards */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Assign Access Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ROLE_OPTIONS.map((r) => {
                  const Icon = r.icon
                  const isSelected = addRole === r.id
                  return (
                    <div
                      key={r.id}
                      onClick={() => setAddRole(r.id)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-colors duration-150 ease-out active:scale-[0.98] flex flex-col justify-between ${
                        isSelected
                          ? `${r.activeBorder} ${r.activeBg} shadow-xs`
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`size-7 rounded-lg ${r.badgeBg} text-white flex items-center justify-center shrink-0 shadow-2xs`}
                          >
                            <Icon className="size-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block leading-tight">
                              {r.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              {r.level}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`size-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'border-[#00799e] bg-[#00799e] text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="size-2.5 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug m-0 font-normal">
                        {r.desc}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="h-9 px-4 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-5 rounded-xl text-xs font-semibold text-white bg-[#00799e] hover:bg-[#006887] shadow-xs cursor-pointer"
              >
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 6. EDIT USER MODAL WITH SLEEK CUSTOM ROLE SELECTOR CARDS                 */}
      {/* ========================================================================= */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white border-0 rounded-2xl shadow-xl p-6">
          <DialogHeader className="flex flex-col gap-1 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-[#00799e]/10 text-[#00799e] flex items-center justify-center shrink-0">
                <Pencil className="size-5" />
              </div>
              <div>
                <DialogTitle className="font-heading font-semibold text-lg text-slate-900 m-0">
                  Edit User Account
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 m-0 font-mono">
                  {editingUser?.email}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleUpdateUser} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <Input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="bg-slate-50 border-slate-200 rounded-xl text-xs text-slate-800 focus-visible:ring-1 focus-visible:ring-[#00799e] h-9"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus('ACTIVE')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border transition-colors duration-150 ease-out active:scale-[0.975] ${
                      editStatus === 'ACTIVE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <span>Active</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditStatus('INACTIVE')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border transition-colors duration-150 ease-out active:scale-[0.975] ${
                      editStatus === 'INACTIVE'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <XCircle className="size-3.5 text-rose-600" />
                    <span>Inactive</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Role Selector Cards */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Modify Access Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ROLE_OPTIONS.map((r) => {
                  const Icon = r.icon
                  const isSelected = editRole === r.id
                  return (
                    <div
                      key={r.id}
                      onClick={() => setEditRole(r.id)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-colors duration-150 ease-out active:scale-[0.98] flex flex-col justify-between ${
                        isSelected
                          ? `${r.activeBorder} ${r.activeBg} shadow-xs`
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`size-7 rounded-lg ${r.badgeBg} text-white flex items-center justify-center shrink-0 shadow-2xs`}
                          >
                            <Icon className="size-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block leading-tight">
                              {r.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              {r.level}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`size-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'border-[#00799e] bg-[#00799e] text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="size-2.5 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug m-0 font-normal">
                        {r.desc}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingUser(null)}
                className="h-9 px-4 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-5 rounded-xl text-xs font-semibold text-white bg-[#00799e] hover:bg-[#006887] shadow-xs cursor-pointer"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 7. DELETE CONFIRMATION MODAL                                              */}
      {/* ========================================================================= */}
      <AlertDialog open={!!deleteCandidate} onOpenChange={(open) => !open && setDeleteCandidate(null)}>
        <AlertDialogContent className="sm:max-w-md bg-white border-0 rounded-2xl shadow-xl p-6">
          <AlertDialogHeader className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="size-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="size-5" />
              </div>
              <div>
                <AlertDialogTitle className="font-heading font-semibold text-base text-slate-900 m-0">
                  Delete User Account
                </AlertDialogTitle>
                <div className="text-xs text-slate-500 m-0 font-normal">
                  Permanently revokes system access for this user
                </div>
              </div>
            </div>
            <AlertDialogDescription className="text-xs text-slate-600 m-0 leading-relaxed font-normal pt-2">
              Are you sure you want to delete this user? They will no longer be able to sign in or operate the system.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteCandidate && (
            <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1.5 my-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <strong className="text-slate-800">{deleteCandidate.fullName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-700">{deleteCandidate.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Role:</span>
                <span className="font-semibold text-[#00799e]">{deleteCandidate.role}</span>
              </div>
            </div>
          )}

          <AlertDialogFooter className="flex items-center justify-end gap-2 pt-2">
            <AlertDialogCancel
              onClick={() => setDeleteCandidate(null)}
              className="h-9 px-4 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="h-9 px-4 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
