import React, { useState, useEffect } from 'react'
import type { AreaRoom, DeviceGateway, AddPumpInput, PumpSubtype } from '../types/pump'
import { CustomSelect, type SelectOption } from './CustomSelect'
import { Shield, Layers } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

interface AddPumpModalProps {
  isOpen: boolean
  onClose: () => void
  onAddPump: (payload: AddPumpInput) => void
  rooms: AreaRoom[]
  gateways: DeviceGateway[]
  initialAreaId?: string
}

export const AddPumpModal: React.FC<AddPumpModalProps> = ({
  isOpen,
  onClose,
  onAddPump,
  rooms,
  gateways,
  initialAreaId,
}) => {
  const [code, setCode] = useState(`P-0${Math.floor(Math.random() * 90 + 10)}`)
  const [name, setName] = useState('')
  const [subtype, setSubtype] = useState<PumpSubtype>('MAIN_PUMP')
  const [areaId, setAreaId] = useState(initialAreaId || rooms[0]?.id || 'room-01')
  const [deviceId, setDeviceId] = useState(gateways[0]?.id || 'gw-001')
  const [ratedPowerKw, setRatedPowerKw] = useState(18.5)
  const [ratedFlowM3h, setRatedFlowM3h] = useState(50.0)
  const [ratedPressureBar, setRatedPressureBar] = useState(4.5)
  const [controlEnabled, setControlEnabled] = useState(true)

  useEffect(() => {
    if (initialAreaId) {
      setAreaId(initialAreaId)
    } else if (rooms[0]?.id) {
      setAreaId(rooms[0].id)
    }
  }, [initialAreaId, rooms, isOpen])

  const subtypeOptions: SelectOption[] = [
    { value: 'MAIN_PUMP', label: 'Main Intake Pump' },
    { value: 'BOOSTER_PUMP', label: 'Distribution Booster Pump' },
    { value: 'TRANSFER_PUMP', label: 'Transfer Pump' },
    { value: 'HEATER_PUMP', label: 'Heater Circulation Pump' },
    { value: 'AUXILIARY_PUMP', label: 'Auxiliary / Standby Pump' },
  ]

  const areaOptions: SelectOption[] = rooms.map((r) => ({
    value: r.id,
    label: `${r.name} (${r.number})`,
    sublabel: r.code,
  }))

  const gatewayOptions: SelectOption[] = gateways.map((g) => ({
    value: g.id,
    label: `${g.name} (${g.code})`,
    sublabel: g.ip,
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return

    const targetRoom = rooms.find((r) => r.id === areaId)
    const motorIndex = ((targetRoom?.pumps.length ?? 0) % 2) as 0 | 1

    onAddPump({
      code: code.trim().toUpperCase(),
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

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white border-0 rounded-2xl shadow-xl p-6">
        <DialogHeader className="flex flex-col gap-1 pb-2">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#00799e] text-white flex items-center justify-center shadow-xs shrink-0">
              <Layers className="size-5" />
            </div>
            <div>
              <DialogTitle className="font-heading font-semibold text-base text-slate-900 leading-tight">
                Add Pump Asset
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-normal mt-0.5">
                Register a new pump unit and configure telemetry parameters
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs pt-1">
          {/* Row 1: Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-slate-700">Pump Tag / Code *</label>
              <Input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. P-01"
                className="font-mono text-xs font-semibold uppercase bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-slate-700">Pump Equipment Name *</label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Intake Pump Primary 01"
                className="text-xs font-medium bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
          </div>

          {/* Row 2: Subtype */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-slate-700">Pump Classification *</label>
            <CustomSelect
              options={subtypeOptions}
              value={subtype}
              onChange={(val) => setSubtype(val as PumpSubtype)}
            />
          </div>

          {/* Row 3: Placement & Gateway */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-slate-700">Plant Station / Area *</label>
              <CustomSelect
                options={areaOptions}
                value={areaId}
                onChange={setAreaId}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-slate-700">IoT Telemetry Gateway *</label>
              <CustomSelect
                options={gatewayOptions}
                value={deviceId}
                onChange={setDeviceId}
              />
            </div>
          </div>

          {/* Row 4: Specifications */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
            <span className="font-semibold text-slate-800 text-xs">
              Design Specifications &amp; Nameplate Ratings
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="font-normal text-[11px] text-slate-500">
                  Rated Power (kW)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={ratedPowerKw}
                  onChange={(e) => setRatedPowerKw(parseFloat(e.target.value) || 0)}
                  className="font-mono text-xs font-medium bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-normal text-[11px] text-slate-500">
                  Rated Flow (m³/h)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={ratedFlowM3h}
                  onChange={(e) => setRatedFlowM3h(parseFloat(e.target.value) || 0)}
                  className="font-mono text-xs font-medium bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-normal text-[11px] text-slate-500">
                  Rated Head (bar)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={ratedPressureBar}
                  onChange={(e) => setRatedPressureBar(parseFloat(e.target.value) || 0)}
                  className="font-mono text-xs font-medium bg-white"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Capability Toggle with shadcn Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5">
              <Shield className="size-4 text-[#00799e]" />
              <div>
                <span className="block font-medium text-slate-800 text-xs">
                  Enable Remote Motor Control
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Allow authorized operators to trigger start / stop commands remotely
                </span>
              </div>
            </div>
            <Switch
              checked={controlEnabled}
              onCheckedChange={setControlEnabled}
            />
          </div>

          {/* Modal Actions */}
          <DialogFooter className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-medium text-slate-600 active:scale-[0.975] transition-transform duration-150"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs font-medium text-white bg-[#00799e] hover:bg-[#006887] shadow-xs active:scale-[0.975] transition-transform duration-150"
            >
              Save Pump Asset
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
