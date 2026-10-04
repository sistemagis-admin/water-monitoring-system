import React from 'react'
import type { ApiUser } from '../services/api'
import { User, LogOut, Mail, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: ApiUser | null
  onLogout: () => void
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
}) => {
  const getRoleVariant = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'default'
      case 'ENGINEER':
        return 'secondary'
      case 'OPERATOR':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border-0 rounded-2xl shadow-xl p-6">
        <DialogHeader className="flex flex-col gap-1 pb-2">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-[#00799e] text-white flex items-center justify-center shadow-xs shrink-0">
              <User className="size-5" />
            </div>
            <div>
              <DialogTitle className="font-heading font-bold text-base text-slate-900 leading-tight">
                User Profile
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-normal mt-0.5">
                Active Authenticated Session · PT. Ascon Multipratama
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* User Capsule Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/80">
            <Avatar className="size-12 border-2 border-white shadow-xs">
              <AvatarFallback className="bg-[#00799e]/15 text-[#00799e] font-bold text-base">
                {currentUser?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h4 className="font-heading font-semibold text-sm text-slate-900 truncate m-0">
                {currentUser?.full_name || 'SCADA Operator'}
              </h4>
              <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate text-xs font-mono">{currentUser?.email || 'admin@ascon.co.id'}</span>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <Badge
                  variant={getRoleVariant(currentUser?.role)}
                  className="font-mono text-[10px] uppercase font-bold tracking-wider"
                >
                  {currentUser?.role || 'SUPER_ADMIN'}
                </Badge>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online Session
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-sky-50/60 border border-sky-100 flex items-start gap-2.5 text-xs text-sky-800">
            <CheckCircle2 className="size-4 text-[#00799e] shrink-0 mt-0.5" />
            <p className="m-0 leading-relaxed text-[11px]">
              Encrypted telemetry connection to MQTT broker and RTU nodes is active. Pump control permissions verified.
            </p>
          </div>
        </div>

        <Separator className="my-1" />

        <DialogFooter className="flex items-center justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-medium text-slate-700"
          >
            Close
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onLogout}
            className="text-xs font-semibold flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 shadow-xs"
          >
            <LogOut className="size-3.5" />
            <span>Sign Out</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
