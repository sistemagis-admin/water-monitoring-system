import React, { useEffect } from 'react'
import { AlertOctagon, X, AlertTriangle } from 'lucide-react'

interface EmergencyStopModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  runningCount: number
}

export const EmergencyStopModal: React.FC<EmergencyStopModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  runningCount,
}) => {
  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#0c2230] border border-slate-200 dark:border-[#1c3a4b] rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Header */}
        <div className="p-5 pb-3 flex items-start justify-between border-b border-slate-100 dark:border-[#1c3a4b]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h3
                id="modal-title"
                className="font-heading font-extrabold text-lg text-slate-900 dark:text-white leading-snug"
              >
                Konfirmasi Emergency Stop
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#85a5b5] mt-0.5">
                Protokol Keselamatan Sistem Pompa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-[#85a5b5] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#193647] transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
            Anda yakin akan mematikan semua pompa pada sistem ini?
          </p>

          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-[#193647] border border-red-200 dark:border-[#2b4a5a] text-xs text-slate-700 dark:text-[#e3f1f6] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="leading-snug">
              Tindakan ini akan menghentikan seluruh{' '}
              <strong className="text-red-700 dark:text-red-400 font-bold">
                {runningCount} motor yang sedang berjalan
              </strong>{' '}
              di Basement, Booster Pump, dan Heater Pump secara serentak.
            </div>
          </div>
        </div>

        {/* Modal Action Buttons (Solid Colors, No Gradient) */}
        <div className="p-5 pt-3 bg-slate-50 dark:bg-[#081822] border-t border-slate-100 dark:border-[#1c3a4b] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-[#193647] dark:hover:bg-[#224458] text-slate-800 dark:text-white transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="py-2.5 px-5 rounded-xl text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white transition-colors cursor-pointer shadow-xs flex items-center gap-2"
          >
            <AlertOctagon className="w-4 h-4 text-white" />
            <span>Ya, Hentikan Semua Pompa</span>
          </button>
        </div>
      </div>
    </div>
  )
}
