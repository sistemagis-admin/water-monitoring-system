import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { AreaRoom, DeviceGateway, PumpAsset, PumpSubtype } from '../types/pump'
import { CustomSelect, type SelectOption } from './CustomSelect'
import { Pencil, X, Check, Shield } from 'lucide-react'

interface EditPumpModalProps {
  isOpen: boolean
  onClose: () => void
  pump: PumpAsset | null
  rooms: AreaRoom[]
  gateways: DeviceGateway[]
  onUpdatePump: (
    pumpId: string,
    payload: {
      code: string
      name: string
      subtype?: PumpSubtype
      areaId?: string
      deviceId?: string
      ratedPowerKw?: number
      ratedFlowM3h?: number
      ratedPressureBar?: number
      controlEnabled?: boolean
    }
  ) => void
}

export const EditPumpModal: React.FC<EditPumpModalProps> = ({
  isOpen,
  onClose,
  pump,
  rooms,
  gateways,
  onUpdatePump,
}) => {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [subtype, setSubtype] = useState<PumpSubtype>('MAIN_PUMP')
  const [areaId, setAreaId] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [ratedPowerKw, setRatedPowerKw] = useState(18.5)
  const [ratedFlowM3h, setRatedFlowM3h] = useState(50.0)
  const [ratedPressureBar, setRatedPressureBar] = useState(4.5)
  const [controlEnabled, setControlEnabled] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (pump && isOpen) {
      document.body.style.overflow = 'hidden'
      setCode(pump.code || '')
      setName(pump.name || '')
      setAreaId(pump.areaId || rooms[0]?.id || '')
      setDeviceId(gateways[0]?.id || '')
      setControlEnabled(pump.controlEnabled ?? true)
      setRatedPowerKw(pump.metrics?.power_kw ? +pump.metrics.power_kw.toFixed(1) : 18.5)
      setRatedFlowM3h(pump.metrics?.flow_m3h ? +pump.metrics.flow_m3h.toFixed(1) : 50.0)
      setRatedPressureBar(pump.metrics?.pressure_bar ? +pump.metrics.pressure_bar.toFixed(1) : 4.5)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [pump, isOpen, rooms, gateways])

  if (!isOpen || !pump) return null

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

  const gatewayOptions: SelectOption[] = gateways.map((g) => ({
    value: g.id,
    label: `${g.code} · ${g.name.replace('Gateway Utama - ', '').replace('Gateway Distribusi - ', '')}`,
    sublabel: `IP: ${g.ip}`,
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return

    onUpdatePump(pump.id, {
      code: code.trim(),
      name: name.trim(),
      subtype,
      areaId,
      deviceId,
      ratedPowerKw: Number(ratedPowerKw),
      ratedFlowM3h: Number(ratedFlowM3h),
      ratedPressureBar: Number(ratedPressureBar),
      controlEnabled,
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
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00799e] text-white flex items-center justify-center shadow-xs shrink-0">
              <Pencil className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-base text-slate-900 m-0 leading-tight">
                Edit Data Pompa
              </h3>
              <p className="text-xs text-slate-500 m-0 mt-0.5 font-normal">
                Perbarui spesifikasi teknis &amp; lokasi penempatan pompa
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

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">

          {/* Row 1: Code & Subtype */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Kode Asset / Pompa *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Contoh: P-01"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#00799e] outline-hidden transition-all"
              />
            </div>

            <div>
              <CustomSelect
                label="Subtype Pompa"
                options={subtypeOptions}
                value={subtype}
                onChange={(val) => setSubtype(val as PumpSubtype)}
                colorTheme="blue"
              />
            </div>
          </div>

          {/* Row 2: Name */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Nama Lengkap Pompa *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Pump 01 (Intake Utama)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#00799e] outline-hidden transition-all"
            />
          </div>

          {/* Row 3: Area Assignment */}
          <div>
            <CustomSelect
              label="Ruangan / Area Lokasi"
              options={areaOptions}
              value={areaId}
              onChange={(val) => setAreaId(val)}
              colorTheme="blue"
            />
          </div>

          {/* Row 4: Gateway IoT Source */}
          <div>
            <CustomSelect
              label="Gateway IoT / PLC Source"
              options={gatewayOptions}
              value={deviceId}
              onChange={(val) => setDeviceId(val)}
              colorTheme="blue"
            />
          </div>

          {/* Row 5: Technical Rating */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="block font-semibold text-slate-800 text-xs">
              Spesifikasi Desain &amp; Kapasitas
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block font-normal text-[11px] text-slate-500 mb-0.5">
                  Daya (kW)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={ratedPowerKw}
                  onChange={(e) => setRatedPowerKw(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs font-medium text-slate-900 focus:border-[#00799e] outline-hidden"
                />
              </div>
              <div>
                <label className="block font-normal text-[11px] text-slate-500 mb-0.5">
                  Debit (m³/h)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={ratedFlowM3h}
                  onChange={(e) => setRatedFlowM3h(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs font-medium text-slate-900 focus:border-[#00799e] outline-hidden"
                />
              </div>
              <div>
                <label className="block font-normal text-[11px] text-slate-500 mb-0.5">
                  Tekanan (bar)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={ratedPressureBar}
                  onChange={(e) => setRatedPressureBar(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs font-medium text-slate-900 focus:border-[#00799e] outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Row 6: Capability Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00799e]" />
              <div>
                <span className="block font-medium text-slate-800">
                  Aktifkan Kontrol Remote
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Izinkan operator mengirim perintah start/stop dari sistem
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={controlEnabled}
              onChange={(e) => setControlEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#00799e] rounded cursor-pointer"
            />
          </div>

          {/* Modal Actions */}
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
