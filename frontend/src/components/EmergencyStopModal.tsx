import React from 'react'
import { AlertOctagon, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

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
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="sm:max-w-md bg-white border-0 rounded-2xl shadow-xl p-6">
        <AlertDialogHeader className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertOctagon className="size-5" />
            </div>
            <div>
              <AlertDialogTitle className="font-heading font-bold text-base text-slate-900 leading-snug">
                Emergency Plant Shutdown
              </AlertDialogTitle>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Safety Interlock Protocol
              </div>
            </div>
          </div>
          <AlertDialogDescription className="text-sm text-slate-700 font-medium leading-relaxed pt-2">
            Are you sure you want to trigger an immediate Emergency Stop across all pump stations?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-slate-700 flex items-start gap-2.5 my-2">
          <AlertTriangle className="size-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-snug">
            This command will immediately trip and stop all{' '}
            <strong className="text-rose-700 font-bold">
              {runningCount} operating pump motors
            </strong>{' '}
            across all connected plant stations simultaneously.
          </div>
        </div>

        <AlertDialogFooter className="pt-2 flex items-center justify-end gap-2">
          <AlertDialogCancel
            onClick={onClose}
            className="h-9 px-4 rounded-xl text-xs font-medium border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer active:scale-[0.975] transition-transform duration-150"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="h-9 px-4 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs flex items-center gap-2 cursor-pointer active:scale-[0.975] transition-transform duration-150"
          >
            <AlertOctagon className="size-4 text-white" />
            <span>Trip All Pumps Now</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

