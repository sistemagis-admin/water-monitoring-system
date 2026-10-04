import React, { useState, useEffect } from 'react'
import type { AreaRoom } from '../types/pump'
import { Pencil } from 'lucide-react'
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

  useEffect(() => {
    if (room && isOpen) {
      setCode(room.code || '')
      setName(room.name || '')
      setDescription('')
    }
  }, [room, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!room || !name.trim() || !code.trim()) return

    onUpdateArea(room.id, {
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
            <div className="size-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Pencil className="size-5 text-white" />
            </div>
            <div>
              <DialogTitle className="font-heading font-semibold text-base text-slate-900 leading-tight">
                Edit Plant Station
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-normal mt-0.5">
                Update station name and area location notes
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
              placeholder="e.g. ROOM-01"
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
              className="text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 shadow-xs"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
