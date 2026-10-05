import React, { useState, useEffect } from 'react'
import { Building2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface AddAreaModalProps {
  isOpen: boolean
  onClose: () => void
  onAddArea: (payload: { code: string; name: string; description?: string }) => void
}

export const AddAreaModal: React.FC<AddAreaModalProps> = ({
  isOpen,
  onClose,
  onAddArea,
}) => {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (isOpen) {
      setCode(`ROOM-0${Math.floor(Math.random() * 9 + 1)}`)
      setName('')
      setDescription('')
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return

    onAddArea({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim() || undefined,
    })

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white border-0 rounded-2xl shadow-xl p-6">
        <DialogHeader className="flex flex-col gap-1 pb-2">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#00799e] text-white flex items-center justify-center shadow-xs shrink-0">
              <Building2 className="size-5 text-white" />
            </div>
            <div>
              <DialogTitle className="font-heading font-semibold text-base text-slate-900 leading-tight">
                Add Plant Station
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-normal mt-0.5">
                Configure plant area or station location for pump assets
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs pt-2">
          {/* Row 1: Code */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-slate-700">
              Station Code *
            </label>
            <Input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. ROOM-01 or INTAKE-A"
              className="font-mono text-xs font-semibold uppercase bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>

          {/* Row 2: Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-slate-700">
              Station / Area Name *
            </label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Intake Station 01 (Raw Water)"
              className="text-xs font-medium bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>

          {/* Row 3: Description */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-slate-700">
              Description / Location Notes
            </label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Main intake pump station drawing from upstream reservoir"
              className="text-xs bg-slate-50 border-slate-200 focus:bg-white resize-none"
            />
          </div>

          {/* Actions */}
          <DialogFooter className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-medium text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs font-medium text-white bg-[#00799e] hover:bg-[#006887] shadow-xs"
            >
              Save Station
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
