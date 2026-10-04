import React from 'react'
import { LogOut } from 'lucide-react'
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
import { Button } from '@/components/ui/button'

interface LogoutConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  userName?: string
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="sm:max-w-md bg-white border-0 rounded-2xl shadow-xl p-6">
        <AlertDialogHeader className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shadow-2xs shrink-0">
              <LogOut className="size-5 text-rose-600" />
            </div>
            <div>
              <AlertDialogTitle className="font-heading font-bold text-base text-slate-900 leading-tight">
                Confirm Sign Out
              </AlertDialogTitle>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                PT. Ascon Multipratama · Water Management
              </p>
            </div>
          </div>
          <AlertDialogDescription className="text-xs text-slate-600 leading-relaxed pt-2">
            {userName ? (
              <>
                Active user: <strong className="text-slate-800 font-semibold">{userName}</strong>. You will need to re-authenticate to access telemetry dashboards and pump controls.
              </>
            ) : (
              'Are you sure you want to sign out? You will need your credentials to regain access to the SCADA system.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <AlertDialogCancel asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-medium text-slate-700"
            >
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className="text-xs font-semibold flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
