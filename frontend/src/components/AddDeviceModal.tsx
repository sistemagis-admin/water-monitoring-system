import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Server, X, Network, Radio, Cpu } from 'lucide-react'

interface AddDeviceModalProps {
  isOpen: boolean
  onClose: () => void
  onAddGateway: (payload: { code: string; name: string; ip: string; firmware?: string; siteId?: string }) => void
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  isOpen,
  onClose,
  onAddGateway,
}) => {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [ip, setIp] = useState('192.168.1.105')
  const [firmware, setFirmware] = useState('1.0.4')
  const [siteId, setSiteId] = useState('WTP Plant Bandung')

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setCode(`gw-00${Math.floor(Math.random() * 80 + 10)}`)
      setName('')
      setIp(`192.168.1.${Math.floor(Math.random() * 150 + 100)}`)
      setFirmware('1.0.4')
      setSiteId('WTP Plant Bandung')
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim() || !ip.trim()) return

    onAddGateway({
      code: code.trim().toLowerCase(),
      name: name.trim(),
      ip: ip.trim(),
      firmware: firmware.trim() || '1.0.4',
      siteId: siteId.trim() || 'WTP Plant Bandung',
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
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-base text-slate-900 m-0 leading-tight">
                Tambah Gateway IoT Baru
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5 font-normal">
                Pendaftaran Edge Gateway &amp; Modbus Ingestion Panel
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
          {/* Row 1: Code & IP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Kode / ID Gateway *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Contoh: gw-003"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#00799e] outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                IP Address Jaringan *
              </label>
              <input
                type="text"
                required
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="Contoh: 192.168.1.103"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#00799e] outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Row 2: Name */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Nama Gateway / Panel *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Gateway Distribusi - Edge Panel 3"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#00799e] outline-hidden transition-all"
            />
          </div>

          {/* Row 3: Site & Firmware */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Lokasi / Plant Site
              </label>
              <input
                type="text"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                placeholder="WTP Plant Bandung"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#00799e] outline-hidden transition-all font-normal"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Versi Firmware
              </label>
              <input
                type="text"
                value={firmware}
                onChange={(e) => setFirmware(e.target.value)}
                placeholder="1.0.4"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white focus:border-[#00799e] outline-hidden transition-all font-normal"
              />
            </div>
          </div>

          {/* Topic Preview */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-[11px] font-semibold text-slate-600 block mb-0.5">
              Topic MQTT Ingestion Otomatis:
            </span>
            <code className="font-mono text-[11px] text-[#00799e] block break-all">
              swpm/v1/{siteId.toLowerCase().replace(/\s+/g, '_')}/{code.toLowerCase() || 'gw-xxx'}/telemetry
            </code>
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
              Simpan Gateway
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
