import React, { useState, useEffect } from 'react'
import { Server } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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

  useEffect(() => {
    if (isOpen) {
      setCode(`gw-00${Math.floor(Math.random() * 80 + 10)}`)
      setName('')
      setIp(`192.168.1.${Math.floor(Math.random() * 150 + 100)}`)
      setFirmware('1.0.4')
      setSiteId('WTP Plant Bandung')
    }
  }, [isOpen])

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white border-0 rounded-2xl shadow-xl p-6">
        <DialogHeader className="flex flex-col gap-1 pb-2">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#00799e] text-white flex items-center justify-center shadow-xs shrink-0">
              <Server className="size-5 text-white" />
            </div>
            <div>
              <DialogTitle className="font-heading font-semibold text-base text-slate-900 leading-tight">
                Register IoT Gateway
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-normal mt-0.5">
                Configure edge telemetry node and MQTT transmission parameters
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs pt-1">
          {/* Row 1: Code */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-slate-700">Gateway Code *</label>
            <Input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. gw-001"
              className="font-mono text-xs font-semibold lowercase bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>

          {/* Row 2: Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-slate-700">Gateway Node Name *</label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Intake RTU Gateway 01"
              className="text-xs font-medium bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>

          {/* Row 3: IP Address & Firmware */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-slate-700">Static IP Address *</label>
              <Input
                type="text"
                required
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="192.168.1.105"
                className="font-mono text-xs bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-medium text-slate-700">Firmware Version</label>
              <Input
                type="text"
                value={firmware}
                onChange={(e) => setFirmware(e.target.value)}
                placeholder="1.0.4"
                className="font-mono text-xs bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
          </div>

          {/* Row 4: Site Location */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-slate-700">Assigned Plant / Location</label>
            <Input
              type="text"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              placeholder="WTP Plant Bandung"
              className="text-xs bg-slate-50 border-slate-200 focus:bg-white"
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
              Register Gateway
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
