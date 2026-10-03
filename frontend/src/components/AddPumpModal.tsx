import React, { useState, useEffect } from 'react'
import type { AreaRoom, DeviceGateway, AddPumpInput, PumpSubtype } from '../types/pump'
import { CustomSelect, type SelectOption } from './CustomSelect'
import { PlusCircle, X, Check, Shield } from 'lucide-react'

interface AddPumpModalProps {
  isOpen: boolean
  onClose: () => void
  onAddPump: (payload: AddPumpInput) => void
  rooms: AreaRoom[]
  gateways: DeviceGateway[]
}

export const AddPumpModal: React.FC<AddPumpModalProps> = ({
  isOpen,
  onClose,
  onAddPump,
  rooms,
  gateways,
}) => {
  const [code, setCode] = useState(`P-0${Math.floor(Math.random() * 90 + 10)}`)
  const [name, setName] = useState('')
  const [subtype, setSubtype] = useState<PumpSubtype>('MAIN_PUMP')
  const [areaId, setAreaId] = useState(rooms[0]?.id || 'room-01')
  const [deviceId, setDeviceId] = useState(gateways[0]?.id || 'gw-001')
  const [motorIndex, setMotorIndex] = useState<0 | 1>(0)
  const [ratedPowerKw, setRatedPowerKw] = useState(18.5)
  const [ratedFlowM3h, setRatedFlowM3h] = useState(50.0)
  const [ratedPressureBar, setRatedPressureBar] = useState(4.5)
  const [controlEnabled, setControlEnabled] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const subtypeOptions: SelectOption[] = [
    { value: 'MAIN_PUMP', label: 'Main Pump (Intake Utama)' },
    { value: 'BOOSTER_PUMP', label: 'Booster Pump (Distribusi)' },
    { value: 'TRANSFER_PUMP', label: 'Transfer Pump (Pemindahan)' },
    { value: 'HEATER_PUMP', label: 'Heater Pump (Pemanas)' },
    { value: 'AUXILIARY_PUMP', label: 'Auxiliary (Cadangan)' },
  ]

  const areaOptions: SelectOption[] = rooms.map((r) => ({
    value: r.id,
    label: `${r.name} (${r.number})`,
    sublabel: r.code,
  }))

  const motorSlotOptions: SelectOption[] = [
    { value: 0, label: 'Motor 1 (Slot Utama)' },
    { value: 1, label: 'Motor 2 (Slot Cadangan)' },
  ]

  const gatewayOptions: SelectOption[] = gateways.map((g) => ({
    value: g.id,
    label: `${g.code} · ${g.name.replace('Gateway Utama - ', '').replace('Gateway Distribusi - ', '')}`,
    sublabel: `IP: ${g.ip}`,
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onAddPump({
      code: code.trim(),
      name: name.trim(),
      subtype,
      areaId,
      deviceId,
      motorIndex,
      ratedPowerKw: Number(ratedPowerKw),
      ratedFlowM3h: Number(ratedFlowM3h),
      ratedPressureBar: Number(ratedPressureBar),
      controlEnabled,
    })

    setIsSuccess(true)
    setTimeout(() => {
      setIsSuccess(false)
      onClose()
    }, 800)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--amp-teal)] text-white flex items-center justify-center shadow-xs">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg text-slate-900 m-0 leading-tight">
                Tambah Pompa Baru
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Pendaftaran Asset Pompa &amp; Pengaturan SCADA
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Success Banner */}
          {isSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Pompa berhasil didaftarkan ke sistem!</span>
            </div>
          )}

          {/* Row 1: Code & Subtype */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kode Asset / Pompa *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Contoh: P-07"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:bg-white focus:border-[var(--amp-teal)] focus:ring-1 focus:ring-[var(--amp-teal)] outline-hidden transition-all"
              />
            </div>

            <div>
              <CustomSelect
                label="Subtype Pompa"
                options={subtypeOptions}
                value={subtype}
                onChange={(val) => setSubtype(val as PumpSubtype)}
                colorTheme="teal"
              />
            </div>
          </div>

          {/* Row 2: Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Lengkap Pompa *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Pump 07 (Booster Reserve)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-[var(--amp-teal)] focus:ring-1 focus:ring-[var(--amp-teal)] outline-hidden transition-all"
            />
          </div>

          {/* Row 3: Area Assignment & Motor Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <CustomSelect
                label="Ruangan / Area Lokasi"
                options={areaOptions}
                value={areaId}
                onChange={(val) => setAreaId(val)}
                colorTheme="teal"
              />
            </div>

            <div>
              <CustomSelect
                label="Posisi Slot Motor"
                options={motorSlotOptions}
                value={motorIndex}
                onChange={(val) => setMotorIndex(Number(val) as 0 | 1)}
                colorTheme="teal"
              />
            </div>
          </div>

          {/* Row 4: Gateway IoT Source */}
          <div>
            <CustomSelect
              label="Gateway IoT / PLC Source"
              options={gatewayOptions}
              value={deviceId}
              onChange={(val) => setDeviceId(val)}
              colorTheme="teal"
            />
          </div>

          {/* Row 5: Technical Rating (Rated Power, Flow, Pressure) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <span className="block font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">
              Spesifikasi Desain &amp; Nameplate
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-medium text-[11px] text-slate-500 mb-0.5">
                  Daya (kW)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={ratedPowerKw}
                  onChange={(e) => setRatedPowerKw(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-medium text-[11px] text-slate-500 mb-0.5">
                  Debit (m³/h)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={ratedFlowM3h}
                  onChange={(e) => setRatedFlowM3h(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-medium text-[11px] text-slate-500 mb-0.5">
                  Tekanan (bar)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={ratedPressureBar}
                  onChange={(e) => setRatedPressureBar(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Row 6: Capability Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--amp-teal)]" />
              <div>
                <span className="block font-bold text-slate-800">
                  Aktifkan Kontrol Remote SCADA
                </span>
                <span className="text-[11px] text-slate-500">
                  Izinkan operator mengirim command start/stop dari web
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={controlEnabled}
              onChange={(e) => setControlEnabled(e.target.checked)}
              className="w-4 h-4 accent-[var(--amp-teal)] rounded cursor-pointer"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-[var(--amp-teal)] hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              Simpan Pompa
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
