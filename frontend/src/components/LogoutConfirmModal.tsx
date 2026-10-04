import React from 'react'
import { createPortal } from 'react-dom'
import { LogOut, AlertTriangle, X } from 'lucide-react'

interface LogoutConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  userName?: string
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
}) => {
  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shadow-2xs shrink-0">
              <LogOut className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 leading-tight">
                Konfirmasi Keluar
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Sesi SCADA PT. Ascon Multipratama
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 text-xs text-slate-600">
          <p className="text-sm font-medium text-slate-800">
            Apakah Anda yakin ingin logout dari sistem?
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            {userName ? (
              <>
                Pengguna saat ini: <strong className="text-slate-700 font-semibold">{userName}</strong>. Anda perlu login kembali untuk mengakses kontrol dan telemetri pompa.
              </>
            ) : (
              'Anda perlu memasukkan kembali kredensial Anda untuk mengakses dashboard dan kontrol SCADA.'
            )}
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Ya, Keluar</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
