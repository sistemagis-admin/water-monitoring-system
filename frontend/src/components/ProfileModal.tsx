import React from 'react'
import { createPortal } from 'react-dom'
import type { ApiUser } from '../services/api'
import { User, LogOut, X, Shield, Mail, CheckCircle2 } from 'lucide-react'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: ApiUser | null
  onLogout: () => void
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
}) => {
  if (!isOpen) return null

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-600 text-white'
      case 'ENGINEER':
        return 'bg-[#00799e] text-white'
      case 'OPERATOR':
        return 'bg-emerald-600 text-white'
      default:
        return 'bg-slate-600 text-white'
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-fade-in flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00799e] text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 m-0 leading-tight">
                Profil Pengguna SCADA
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Sesi autentikasi &amp; hak akses aktif
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-[#00799e]/15 text-[#00799e] flex items-center justify-center font-bold text-lg shrink-0">
              {currentUser?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-heading font-semibold text-sm text-slate-900 truncate m-0">
                {currentUser?.full_name || 'Operator SCADA'}
              </h4>
              <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate text-xs">{currentUser?.email || 'admin@ascon.co.id'}</span>
              </div>
              <div className="mt-2">
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase ${getRoleBadge(
                    currentUser?.role
                  )}`}
                >
                  {currentUser?.role || 'SUPER_ADMIN'}
                </span>
              </div>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <Shield className="w-3.5 h-3.5 text-[#00799e]" />
              <span>Hak Akses Terdaftar ({currentUser?.permissions?.length || 0}):</span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
              {(currentUser?.permissions || [
                'site.view',
                'asset.view',
                'pump.control',
                'alarm.ack',
                'dashboard.view',
              ]).map((perm, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-medium"
                >
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  {perm}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar / Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
