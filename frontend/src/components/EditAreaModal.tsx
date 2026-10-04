import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { AreaRoom } from '../types/pump'
import { X, Check, Building2, Pencil } from 'lucide-react'

interface EditAreaModalProps {
  isOpen: boolean
  onClose: () => void
  room: AreaRoom | null
  onUpdateArea: (areaId: string, payload: { code: string; name: string; description?: string }) => void
}

export const EditAreaModal: React.FC<EditAreaModalProps> = ({
  isOpen,
  onClose,
  room,
  onUpdateArea,
}) => {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (room && isOpen) {
      document.body.style.overflow = 'hidden'
      setCode(room.code || '')
      setName(room.name || '')
      setDescription('')
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [room, isOpen])

  if (!isOpen || !room) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return

    onUpdateArea(room.id, {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim() || undefined,
    })

    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00799e] text-white flex items-center justify-center shadow-xs shrink-0">
              <Pencil className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-base text-slate-900 m-0 leading-tight">
                Edit Data Ruangan
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5 font-normal">
                Perbarui informasi nama dan kode area kerja
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">

          {/* Row 1: Code */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Kode Area / Ruangan *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Contoh: ROOM-01 atau INTAKE-A"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#00799e] outline-hidden transition-all"
            />
          </div>

          {/* Row 2: Name */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Nama Lengkap Area / Ruangan *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Pump Room 01 (Intake / Raw Water)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#00799e] outline-hidden transition-all"
            />
          </div>

          {/* Row 3: Description */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Deskripsi / Keterangan Lokasi
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Stasiun filtrasi dan pengolahan air bersih utama"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#00799e] outline-hidden transition-all resize-none font-normal"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-[#00799e] hover:bg-[#006887] active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
