import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { SystemUserItem } from '../types/pump'
import { api, type ApiUser } from '../services/api'
import { useToast } from '../context/ToastContext'
import { CustomSelect, type SelectOption } from './CustomSelect'
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
    title: 'Operator SCADA',
    label: 'OPERATOR',
    badgeText: 'OPERATOR',
    icon: Shield,
    badgeBg: 'bg-emerald-500',
    badgeTextCol: 'text-emerald-700',
    activeBorder: 'border-emerald-500',
    activeBg: 'bg-emerald-50/60',
    desc: 'Kontrol saklar pompa on/off, monitoring telemetri real-time, dan akui notifikasi alarm.',
    level: 'Operasional SCADA',
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
    desc: 'Kalibrasi sensor, konfigurasi gateway IoT, dan penyesuaian aturan threshold alarm.',
    level: 'Teknis & Kalibrasi',
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
    desc: 'Akses penuh administrasi sistem, manajemen akun pengguna, dan seluruh kontrol stasiun.',
    level: 'Akses Master',
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
    desc: 'Hanya dapat memantau grafik dashboard dan riwayat telemetri tanpa kontrol operasi.',
    level: 'Hanya Lihat (Read-Only)',
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
  // 1. Operasional SCADA & Kontrol Pompa
  {
    id: 'p_pump_toggle',
    module: 'Operasional SCADA',
    name: 'Saklar Pompa Manual (Start / Stop)',
    desc: 'Menyalakan dan mematikan unit pompa motor secara manual via web SCADA.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: true, VIEWER: false },
  },
  {
    id: 'p_pump_estop',
    module: 'Operasional SCADA',
    name: 'Emergency Stop Stasiun',
    desc: 'Mematikan seketika seluruh unit pompa darurat jika terjadi anomali kritis.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: true, VIEWER: false },
  },
  {
    id: 'p_pump_reset',
    module: 'Operasional SCADA',
    name: 'Reset Status Trip & Overload',
    desc: 'Mereset status proteksi pompa setelah gangguan mekanik diatasi.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: true, VIEWER: false },
  },
  {
    id: 'p_pump_vfd',
    module: 'Operasional SCADA',
    name: 'Override Kecepatan VFD & Setpoint',
    desc: 'Mengubah frekuensi Hz inverter pompa dan target tekanan pipa.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: false, VIEWER: false },
  },

  // 2. Telemetri & Visualisasi
  {
    id: 'p_telem_view',
    module: 'Telemetri & Sensor',
    name: 'Monitoring Grafik & Live Data',
    desc: 'Melihat grafik tekanan, debit aliran, arus listrik, dan temperatur real-time.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: true, VIEWER: true },
  },
  {
    id: 'p_telem_export',
    module: 'Telemetri & Sensor',
    name: 'Export Laporan Telemetri (PDF/CSV)',
    desc: 'Mengunduh log riwayat telemetri dan rekap operasional pompa.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: true, VIEWER: true },
  },
  {
    id: 'p_sensor_calibrate',
    module: 'Telemetri & Sensor',
    name: 'Kalibrasi & Dynamic Sensor Binding',
    desc: 'Menyesuaikan offset nilai sensor dan konfigurasi port analog/digital.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: false, VIEWER: false },
  },

  // 3. Pusat Alarm & Proteksi
  {
    id: 'p_alarm_view',
    module: 'Pusat Alarm',
    name: 'Memantau Log Alarm Masuk',
    desc: 'Melihat status alarm terbuka, acknowledged, dan riwayat notifikasi.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: true, VIEWER: true },
  },
  {
    id: 'p_alarm_ack',
    module: 'Pusat Alarm',
    name: 'Mengakui Alarm (Acknowledge)',
    desc: 'Mengonfirmasi bahwa alarm telah disadari oleh petugas jaga.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: true, VIEWER: false },
  },
  {
    id: 'p_alarm_resolve',
    module: 'Pusat Alarm',
    name: 'Menyelesaikan Alarm (Resolve & Catatan)',
    desc: 'Menutup status alarm dan menuliskan log tindakan mitigasi.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: true, VIEWER: false },
  },
  {
    id: 'p_alarm_rules',
    module: 'Pusat Alarm',
    name: 'Kelola Aturan Threshold & Debounce',
    desc: 'Tambah, edit nilai batas kritis, dan atur waktu proteksi anti-flicker.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: false, VIEWER: false },
  },

  // 4. Konfigurasi Aset & IoT Gateway
  {
    id: 'p_asset_area',
    module: 'Konfigurasi Aset',
    name: 'Manajemen Area & Ruangan Stasiun',
    desc: 'Menambah, mengubah kapasitas m³/jam, dan menghapus master ruangan.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: false, VIEWER: false },
  },
  {
    id: 'p_asset_pump',
    module: 'Konfigurasi Aset',
    name: 'Registrasi Pompa & Spesifikasi Teknis',
    desc: 'Menambah aset pompa baru, daya kW, debit m³/h, dan head bar.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: false, VIEWER: false },
  },
  {
    id: 'p_device_gateway',
    module: 'Konfigurasi Aset',
    name: 'Manajemen Gateway IoT & Modbus RTU',
    desc: 'Konfigurasi IP, port RS485, baudrate, dan interval polling gateway.',
    roles: { SUPER_ADMIN: true, ENGINEER: true, OPERATOR: false, VIEWER: false },
  },

  // 5. Manajemen Pengguna & Keamanan
  {
    id: 'p_user_view',
    module: 'Keamanan & Akun',
    name: 'Melihat Daftar Pengguna Terdaftar',
    desc: 'Melihat identitas, email, dan riwayat login operator/engineer.',
    roles: { SUPER_ADMIN: true, ENGINEER: false, OPERATOR: false, VIEWER: false },
  },
  {
    id: 'p_user_manage',
    module: 'Keamanan & Akun',
    name: 'Tambah & Edit Akun Pengguna',
    desc: 'Mendaftarkan operator baru dan mengubah status akun aktif/nonaktif.',
    roles: { SUPER_ADMIN: true, ENGINEER: false, OPERATOR: false, VIEWER: false },
  },
  {
    id: 'p_user_role',
    module: 'Keamanan & Akun',
    name: 'Penetapan Role & Hak Akses (RBAC)',
    desc: 'Memberikan level otoritas Super Admin, Engineer, Operator, atau Viewer.',
    roles: { SUPER_ADMIN: true, ENGINEER: false, OPERATOR: false, VIEWER: false },
  },
  {
    id: 'p_user_delete',
    module: 'Keamanan & Akun',
    name: 'Hapus & Cabut Akses Akun',
    desc: 'Menghapus permanen akun pengguna dari database sistem.',
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
      toast.error('Form Tidak Lengkap', 'Harap isi semua kolom pendaftaran akun.')
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
        if (res?.success && res.data?.id) {
          createdId = res.data.id
        }
      } catch (err) {
        console.warn('Backend user create error:', err)
      }
    }

    const newUser: SystemUserItem = {
      id: createdId,
      email: addEmail.trim(),
      fullName: addFullName.trim(),
      role: addRole,
      status: 'ACTIVE',
      siteName: 'WTP Plant Bandung',
      createdAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      lastLogin: 'Baru Dibuat',
    }

    setUsers((prev) => [newUser, ...prev])
    setIsAddOpen(false)
    setAddEmail('')
    setAddFullName('')
    setAddPassword('')
    toast.success('User Berhasil Dibuat', `Akun ${newUser.fullName} (${newUser.role}) telah terdaftar.`)
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
          is_active: editStatus === 'ACTIVE',
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
    toast.info('Data User Diperbarui', `Akun ${editFullName} telah diperbarui.`)
  }

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!deleteCandidate) return
    if (isBackendOnline) {
      api.users.delete(deleteCandidate.id).catch(console.warn)
    }
    setUsers((prev) => prev.filter((u) => u.id !== deleteCandidate.id))
    toast.warning('User Dinonaktifkan', `Akun ${deleteCandidate.fullName} telah dihapus.`)
    setDeleteCandidate(null)
  }

  const getRoleBadge = (role: SystemUserItem['role']) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white inline-flex items-center gap-1 shadow-2xs font-mono">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            SUPER ADMIN
          </span>
        )
      case 'ENGINEER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00799e] text-white inline-flex items-center gap-1 shadow-2xs font-mono">
            <ShieldCheck className="w-3 h-3 text-cyan-200" />
            ENGINEER
          </span>
        )
      case 'OPERATOR':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white inline-flex items-center gap-1 shadow-2xs font-mono">
            <Shield className="w-3 h-3 text-white" />
            OPERATOR
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1 font-mono">
            <Eye className="w-3 h-3 text-slate-500" />
            VIEWER
          </span>
        )
    }
  }

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* 1. Header Bar with Unified Subtab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading font-semibold text-xl sm:text-2xl text-slate-800 tracking-tight leading-none">
            Manajemen Pengguna &amp; Hak Akses
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-1.5 m-0">
            Kelola akun operator, tim teknis engineer, dan matriks otorisasi kontrol SCADA
          </p>
        </div>

        {/* View Switcher Capsule & Action Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveSubTab('users')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'users'
                  ? 'bg-white text-[#00799e] font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Daftar Pengguna ({users.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('permissions')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'permissions'
                  ? 'bg-white text-[#00799e] font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Role &amp; Hak Akses (RBAC)</span>
            </button>
          </div>

          {activeSubTab === 'users' && (
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 bg-[#00799e] hover:bg-[#006887] text-white text-xs font-semibold rounded-xl shadow-sm shadow-[#00799e]/20 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah User Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: DAFTAR PENGGUNA (USER MANAGEMENT)                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'users' && (
        <div className="space-y-5 animate-fade-in">
          {/* Top Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Total Pengguna</span>
                <span className="font-heading font-bold text-2xl sm:text-3xl text-slate-800 block mt-0.5">
                  {users.length} <span className="text-xs font-normal text-slate-400">Akun</span>
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#00799e]/10 text-[#00799e] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Super Admin &amp; Lead</span>
                <span className="font-heading font-bold text-2xl sm:text-3xl text-slate-800 block mt-0.5">
                  {users.filter((u) => u.role === 'SUPER_ADMIN').length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Operator &amp; Engineer</span>
                <span className="font-heading font-bold text-2xl sm:text-3xl text-slate-800 block mt-0.5">
                  {users.filter((u) => u.role === 'OPERATOR' || u.role === 'ENGINEER').length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Status Aktif</span>
                <span className="font-heading font-bold text-2xl sm:text-3xl text-emerald-600 block mt-0.5">
                  {users.filter((u) => u.status === 'ACTIVE').length} / {users.length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search & Sleek Role Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari pengguna berdasarkan nama atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00799e] focus:bg-white outline-hidden transition-all font-normal"
              />
            </div>

            {/* Custom Pill Filter Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setRoleFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  roleFilter === 'ALL'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Semua ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('SUPER_ADMIN')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
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
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center text-slate-400">
                <Users className="w-10 h-10 text-slate-300 mb-2" />
                <h4 className="font-heading font-semibold text-base text-slate-800 mb-1">
                  Tidak Ada Pengguna Ditemukan
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  {searchQuery ? `Tidak ada user yang cocok dengan "${searchQuery}".` : 'Belum ada data user dalam filter ini.'}
                </p>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Nama Lengkap &amp; Email</th>
                        <th className="py-3 px-4">Role Akses</th>
                        <th className="py-3 px-4">Lokasi Plant</th>
                        <th className="py-3 px-4">Status Akun</th>
                        <th className="py-3 px-4">Terdaftar</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#00799e]/10 text-[#00799e] font-bold text-xs flex items-center justify-center shrink-0 border border-[#00799e]/20">
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
                          </td>

                          <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>

                          <td className="py-3.5 px-4">
                            <span className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {u.siteName || 'WTP Plant Bandung'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {u.status === 'ACTIVE' ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Aktif
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                Nonaktif
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-[11px] font-mono text-slate-500">
                            {u.createdAt}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#00799e] hover:bg-[#00799e]/10 transition-colors cursor-pointer"
                                title={`Edit akun ${u.fullName}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {u.email !== currentUser?.email && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteCandidate(u)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title={`Hapus user ${u.fullName}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* User List Pagination Bar */}
                <div className="p-3.5 bg-slate-50/70 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="font-normal text-[11px] text-slate-500">
                      Menampilkan{' '}
                      <strong className="text-slate-700 font-semibold">
                        {filteredUsers.length > 0 ? userStartIdx + 1 : 0} -{' '}
                        {Math.min(userStartIdx + userPageSize, filteredUsers.length)}
                      </strong>{' '}
                      dari <strong className="text-slate-700 font-semibold">{filteredUsers.length}</strong> pengguna
                    </span>

                    <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                      <span className="text-[11px] text-slate-400 font-normal">Tampilkan:</span>
                      <CustomSelect
                        options={[
                          { value: 5, label: '5 / halaman' },
                          { value: 10, label: '10 / halaman' },
                          { value: 20, label: '20 / halaman' },
                          { value: 50, label: '50 / halaman' },
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
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {Array.from({ length: totalUserPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setUserPage(pageNum)}
                        className={`min-w-[28px] h-7 px-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
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
                <div
                  key={r.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-[#00799e]/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl ${r.badgeBg} text-white flex items-center justify-center shadow-xs`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-heading font-semibold text-sm text-slate-900 m-0">
                            {r.label}
                          </h4>
                          <span className="text-[10px] font-medium text-slate-400 block">
                            {r.level}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                        {count} Akun
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-normal leading-relaxed m-0 mb-3">
                      {r.desc}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Tingkat Akses:</span>
                    <span className={`font-semibold ${r.badgeTextCol}`}>
                      {r.id === 'SUPER_ADMIN' ? '100% Akses' : r.id === 'ENGINEER' ? '80% Teknis' : r.id === 'OPERATOR' ? '60% Operasi' : '20% Read-Only'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Interactive Permission Matrix Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            {/* Header / Filter inside Table */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="font-heading font-semibold text-base text-slate-800 m-0">
                  Matriks Hak Akses &amp; Otorisasi Fitur
                </h3>
                <p className="text-xs text-slate-400 m-0 font-normal mt-0.5">
                  Tabel pemetaan izin akses pengguna SCADA berdasarkan modul keamanan
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari izin fitur..."
                    value={matrixSearch}
                    onChange={(e) => setMatrixSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00799e] outline-hidden font-normal"
                  />
                </div>

                <CustomSelect
                  options={[
                    { value: 'ALL', label: `Semua Modul (${PERMISSIONS_DATA.length})` },
                    ...matrixModules.map((m) => ({
                      value: m,
                      label: `Modul: ${m}`,
                      sublabel: `${PERMISSIONS_DATA.filter((p) => p.module === m).length} izin`,
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
                <p className="text-xs font-semibold text-slate-700 m-0">Tidak Ada Izin Ditemukan</p>
                <span className="text-[11px] text-slate-400">
                  Coba gunakan kata kunci pencarian atau modul yang berbeda.
                </span>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100/70 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 w-[38%]">Fitur &amp; Deskripsi Otorisasi</th>
                        <th className="py-3 px-4 w-[16%]">Modul Keamanan</th>
                        <th className="py-3 px-3 text-center w-[11.5%]">
                          <div className="flex flex-col items-center">
                            <span className="text-slate-900 font-bold">SUPER ADMIN</span>
                            <span className="text-[9px] text-amber-600 font-mono font-normal">Root / Master</span>
                          </div>
                        </th>
                        <th className="py-3 px-3 text-center w-[11.5%]">
                          <div className="flex flex-col items-center">
                            <span className="text-[#00799e] font-bold">ENGINEER</span>
                            <span className="text-[9px] text-slate-400 font-mono font-normal">Teknis &amp; IoT</span>
                          </div>
                        </th>
                        <th className="py-3 px-3 text-center w-[11.5%]">
                          <div className="flex flex-col items-center">
                            <span className="text-emerald-700 font-bold">OPERATOR</span>
                            <span className="text-[9px] text-slate-400 font-mono font-normal">Kontrol Pompa</span>
                          </div>
                        </th>
                        <th className="py-3 px-3 text-center w-[11.5%]">
                          <div className="flex flex-col items-center">
                            <span className="text-slate-600 font-bold">VIEWER</span>
                            <span className="text-[9px] text-slate-400 font-mono font-normal">Monitoring</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedPermissions.map((perm) => (
                        <tr key={perm.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 block leading-tight">
                              {perm.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal block mt-0.5 leading-snug">
                              {perm.desc}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                              <Layers className="w-3 h-3 text-slate-400" />
                              {perm.module}
                            </span>
                          </td>

                          {/* SUPER_ADMIN */}
                          <td className="py-3 px-3 text-center">
                            {perm.roles.SUPER_ADMIN ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 shadow-2xs">
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-300">
                                <XCircle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </td>

                          {/* ENGINEER */}
                          <td className="py-3 px-3 text-center">
                            {perm.roles.ENGINEER ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 shadow-2xs">
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-300">
                                <XCircle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </td>

                          {/* OPERATOR */}
                          <td className="py-3 px-3 text-center">
                            {perm.roles.OPERATOR ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 shadow-2xs">
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-300">
                                <XCircle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </td>

                          {/* VIEWER */}
                          <td className="py-3 px-3 text-center">
                            {perm.roles.VIEWER ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 shadow-2xs">
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-300">
                                <XCircle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Matrix Pagination Bar */}
                <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="font-normal text-[11px] text-slate-500">
                      Menampilkan{' '}
                      <strong className="text-slate-700 font-semibold">
                        {filteredPermissions.length > 0 ? matrixStartIdx + 1 : 0} -{' '}
                        {Math.min(matrixStartIdx + matrixPageSize, filteredPermissions.length)}
                      </strong>{' '}
                      dari <strong className="text-slate-700 font-semibold">{filteredPermissions.length}</strong> hak akses
                    </span>

                    <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                      <span className="text-[11px] text-slate-400 font-normal">Tampilkan:</span>
                      <CustomSelect
                        options={[
                          { value: 6, label: '6 / halaman' },
                          { value: 8, label: '8 / halaman' },
                          { value: 12, label: '12 / halaman' },
                          { value: 18, label: '18 / halaman' },
                          { value: 25, label: '25 / halaman' },
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
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {Array.from({ length: totalMatrixPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setMatrixPage(pageNum)}
                        className={`min-w-[28px] h-7 px-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
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
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Halaman Selanjutnya"
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
                  <strong className="text-slate-700">Diizinkan:</strong> Memiliki wewenang eksekusi penuh
                </span>
                <span className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                  <strong className="text-slate-700">Dibatasi:</strong> Hak akses ditolak sistem
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Standar Keamanan RBAC ISO/IEC 27001
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ADD USER MODAL WITH SLEEK CUSTOM ROLE SELECTOR CARDS                  */}
      {/* ========================================================================= */}
      {isAddOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAddOpen(false)
            }}
          >
            <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-[#00799e]/10 text-[#00799e] flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-slate-900 m-0">
                    Tambah Pengguna Baru
                  </h3>
                  <p className="text-xs text-slate-400 m-0 font-normal">
                    Daftarkan akun operator, engineer, atau admin ke sistem SCADA
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso, S.T."
                      value={addFullName}
                      onChange={(e) => setAddFullName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00799e] focus:bg-white outline-hidden font-normal transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alamat Email (Login)
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        required
                        placeholder="operator@ascon.co.id"
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00799e] focus:bg-white outline-hidden font-normal transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password Awal
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="password"
                      required
                      placeholder="Minimal 8 karakter..."
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00799e] focus:bg-white outline-hidden font-normal transition-all"
                    />
                  </div>
                </div>

                {/* Custom Modern Role Selector Cards */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Pilih Hak Akses / Role Otorisasi
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ROLE_OPTIONS.map((r) => {
                      const Icon = r.icon
                      const isSelected = addRole === r.id
                      return (
                        <div
                          key={r.id}
                          onClick={() => setAddRole(r.id)}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? `${r.activeBorder} ${r.activeBg} shadow-xs`
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-lg ${r.badgeBg} text-white flex items-center justify-center shrink-0 shadow-2xs`}
                              >
                                <Icon className="w-3.5 h-3.5" />
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
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected
                                  ? 'border-[#00799e] bg-[#00799e] text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
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

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#00799e] hover:bg-[#006887] shadow-xs cursor-pointer transition-all"
                  >
                    Simpan Akun Baru
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* 6. EDIT USER MODAL WITH SLEEK CUSTOM ROLE SELECTOR CARDS                 */}
      {/* ========================================================================= */}
      {editingUser &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setEditingUser(null)
            }}
          >
            <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-[#00799e]/10 text-[#00799e] flex items-center justify-center shrink-0">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-slate-900 m-0">
                    Edit Data Pengguna
                  </h3>
                  <p className="text-xs text-slate-400 m-0 font-mono">
                    {editingUser.email}
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-[#00799e] focus:bg-white outline-hidden font-normal transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status Akun
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditStatus('ACTIVE')}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                          editStatus === 'ACTIVE'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Aktif</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditStatus('INACTIVE')}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                          editStatus === 'INACTIVE'
                            ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Nonaktif</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Custom Role Selector Cards */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Ubah Hak Akses / Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ROLE_OPTIONS.map((r) => {
                      const Icon = r.icon
                      const isSelected = editRole === r.id
                      return (
                        <div
                          key={r.id}
                          onClick={() => setEditRole(r.id)}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? `${r.activeBorder} ${r.activeBg} shadow-xs`
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-lg ${r.badgeBg} text-white flex items-center justify-center shrink-0 shadow-2xs`}
                              >
                                <Icon className="w-3.5 h-3.5" />
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
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected
                                  ? 'border-[#00799e] bg-[#00799e] text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
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

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#00799e] hover:bg-[#006887] shadow-xs cursor-pointer transition-all"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* 7. DELETE CONFIRMATION MODAL                                              */}
      {/* ========================================================================= */}
      {deleteCandidate &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeleteCandidate(null)
            }}
          >
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
              <div className="flex items-center gap-3 text-rose-600 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-base text-slate-900 m-0">
                    Konfirmasi Hapus Pengguna
                  </h4>
                  <p className="text-xs text-slate-500 m-0 font-normal">
                    Aksi ini akan mencabut izin akses akun secara permanen
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama:</span>
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

              <p className="text-xs text-slate-600 m-0 leading-relaxed font-normal mb-5">
                Apakah Anda yakin ingin menghapus akun ini dari sistem? User tidak akan dapat login lagi ke SCADA.
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteCandidate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs cursor-pointer"
                >
                  Ya, Hapus Pengguna
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
