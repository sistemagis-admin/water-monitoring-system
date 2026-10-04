import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Header */}
        <div className="p-5 pb-3 flex items-start justify-between border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h3
                id="modal-title"
                className="font-heading font-bold text-base text-slate-900 leading-snug"
              >
                Konfirmasi Emergency Stop
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Protokol Keselamatan Sistem Pompa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-700 font-medium leading-relaxed">
            Anda yakin akan mematikan semua pompa pada sistem ini?
          </p>

          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-slate-700 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-snug">
              Tindakan ini akan menghentikan seluruh{' '}
              <strong className="text-rose-700 font-bold">
                {runningCount} motor yang sedang berjalan
              </strong>{' '}
              di seluruh stasiun pompa secara serentak.
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-5 pt-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl text-xs font-medium bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="py-2 px-4 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white transition-colors cursor-pointer shadow-xs flex items-center gap-2"
          >
            <AlertOctagon className="w-4 h-4 text-white" />
            <span>Ya, Hentikan Semua Pompa</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
