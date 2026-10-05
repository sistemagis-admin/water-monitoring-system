import React, { useState } from 'react'
import type { AreaRoom } from '../types/pump'
import {
  Building2,
  Plus,
  Trash2,
  Layers,
  Search,
  Pencil,
  Power,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

interface AreaManagementViewProps {
  rooms: AreaRoom[]
  onOpenAddArea: () => void
  onOpenEditArea: (room: AreaRoom) => void
  onDeleteArea: (areaId: string) => void
}

export const AreaManagementView: React.FC<AreaManagementViewProps> = ({
  rooms,
  onOpenAddArea,
  onOpenEditArea,
  onDeleteArea,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteCandidate, setDeleteCandidate] = useState<{
    id: string
    name: string
    code: string
    pumpsCount: number
  } | null>(null)

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleConfirmDelete = () => {
    if (deleteCandidate) {
      onDeleteArea(deleteCandidate.id)
      setDeleteCandidate(null)
    }
  }

  // Calculate real totals
  const totalPumps = rooms.reduce((acc, r) => acc + r.pumps.length, 0)
  const runningPumps = rooms.reduce(
    (acc, r) => acc + r.pumps.filter((p) => p.status === 'RUNNING').length,
    0
  )

  return (
    <div className="space-y-5 animate-fade-in select-none">
      {/* 1. Tactical Action Strip (Replaces duplicate H1) */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00799e]/10 border border-[#00799e]/20 text-[#00799e] flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-heading font-bold text-sm text-slate-900 block leading-tight">
              Plant Stations &amp; Areas
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              {rooms.length} Stations Configured
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search bar */}
          {rooms.length > 0 && (
            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search station name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#00799e] w-48 sm:w-56 h-8"
              />
            </div>
          )}

          {/* Add Area Button */}
          <Button
            onClick={onOpenAddArea}
            className="h-8 px-4 rounded-xl bg-[#00799e] hover:bg-[#006887] text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm shadow-[#00799e]/20 transition-all cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add Station</span>
          </Button>
        </div>
      </div>

      {/* 2. Real Summary Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
              TOTAL STATIONS
            </span>
            <span className="font-mono text-2xl font-extrabold text-slate-900 leading-tight mt-1 block tabular-nums">
              {rooms.length} <span className="text-xs text-slate-400 font-sans font-medium">Stations</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#00799e]/10 text-[#00799e] flex items-center justify-center shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
              TOTAL PUMPS
            </span>
            <span className="font-mono text-2xl font-extrabold text-slate-900 leading-tight mt-1 block tabular-nums">
              {totalPumps} <span className="text-xs text-slate-400 font-sans font-medium">Installed</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
              PUMPS RUNNING
            </span>
            <span className="font-mono text-2xl font-extrabold text-slate-900 leading-tight mt-1 block tabular-nums">
              {runningPumps} <span className="text-xs text-emerald-600 font-sans font-semibold">Active</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
            <Power className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Main Area Content */}
      {rooms.length === 0 ? (
        /* CLEAN EMPTY STATE HERO */
        <div className="bg-white rounded-2xl p-10 sm:p-14 text-center shadow-xs flex flex-col items-center justify-center min-h-[360px]">
          <div className="w-16 h-16 rounded-2xl bg-[#00799e] text-white flex items-center justify-center mb-4 shadow-md shadow-[#00799e]/20">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-heading font-semibold text-xl text-slate-900 mb-1.5">
            No Stations Registered
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed font-normal">
            Get started by configuring your first plant area or pump station (e.g. Raw Water Intake, Filtration, or Booster Distribution).
          </p>
          <button
            onClick={onOpenAddArea}
            className="px-5 py-2.5 rounded-xl bg-[#00799e] hover:bg-[#006887] active:scale-95 text-white text-xs font-medium shadow-md shadow-[#00799e]/25 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Station</span>
          </button>
        </div>
      ) : (
        /* ROOM CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room, idx) => {
            const pumpCount = room.pumps.length
            const runningCount = room.pumps.filter((p) => p.status === 'RUNNING').length

            return (
              <div
                key={room.id}
                className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full"
              >
                <div>
                  {/* Card Top: Code badge & Delete button */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="size-7 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                        {room.number || `0${idx + 1}`}
                      </span>
                      <Badge variant="outline" className="font-mono font-bold text-xs bg-slate-100 text-slate-800 border-0">
                        {room.code}
                      </Badge>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setDeleteCandidate({
                          id: room.id,
                          name: room.name,
                          code: room.code,
                          pumpsCount: pumpCount,
                        })
                      }
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer rounded-lg h-8 w-8"
                      title={`Delete Station ${room.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  {/* Area Title */}
                  <h3 className="font-heading font-bold text-base text-slate-900 mb-1 leading-snug">
                    {room.name}
                  </h3>
                  <p className="text-xs text-slate-400 m-0 mb-4 font-mono">
                    SENSOR TAG: {room.sensorTag || room.code}
                  </p>

                  {/* Pump count info pill */}
                  <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Layers className="size-4 text-[#00799e]" />
                      <span className="text-xs font-semibold text-slate-700">
                        Assigned Pumps
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs font-mono font-bold border-0 ${
                        pumpCount > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {pumpCount} UNITS {runningCount > 0 && `(${runningCount} ACTIVE)`}
                    </Badge>
                  </div>
                </div>

                {/* Card Actions: Edit Data Ruangan */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <Button
                    onClick={() => onOpenEditArea(room)}
                    className="w-full h-8 py-2 px-3 rounded-xl bg-[#00799e] hover:bg-[#006887] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="size-3.5" />
                    <span>Edit Station</span>
                  </Button>
                </div>
              </div>
            )
          })}

          {/* Add Area Slot Card */}
          <div
            onClick={onOpenAddArea}
            className="border-2 border-dashed border-slate-200 hover:border-[#00799e] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-white/80 group min-h-[200px]"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-[#00799e] text-slate-400 group-hover:text-white flex items-center justify-center mb-2.5 transition-colors shadow-2xs group-hover:scale-105">
              <Plus className="w-5 h-5" />
            </div>
            <span className="font-medium text-xs sm:text-sm text-slate-700 group-hover:text-[#00799e] transition-colors">
              Add New Station
            </span>
            <p className="text-[11px] text-slate-400 m-0 mt-0.5 max-w-[180px] font-normal">
              Register a new plant station for pump placement
            </p>
          </div>
        </div>
      )}

      {/* 4. Delete Confirmation Modal */}
      <AlertDialog open={!!deleteCandidate} onOpenChange={(open) => !open && setDeleteCandidate(null)}>
        <AlertDialogContent className="sm:max-w-md bg-white border-0 rounded-2xl shadow-xl p-6">
          <AlertDialogHeader className="flex flex-col gap-2">
            <div className="flex items-center gap-3 text-red-600">
              <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="size-5" />
              </div>
              <div>
                <AlertDialogTitle className="font-heading font-semibold text-base text-slate-900 m-0">
                  Delete Station
                </AlertDialogTitle>
                <div className="text-xs text-slate-500 m-0 font-normal">
                  Permanently remove station from system
                </div>
              </div>
            </div>
            <AlertDialogDescription className="text-xs text-slate-600 m-0 leading-relaxed font-normal pt-2">
              Are you sure you want to delete this station? All associated configuration and assignments will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteCandidate && (
            <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1 my-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-normal">Station Code:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {deleteCandidate.code}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-normal">Station Name:</span>
                <span className="font-medium text-slate-900">
                  {deleteCandidate.name}
                </span>
              </div>
              {deleteCandidate.pumpsCount > 0 && (
                <div className="flex justify-between text-amber-600 font-medium pt-1">
                  <span>Assigned Pumps:</span>
                  <span>{deleteCandidate.pumpsCount} Units</span>
                </div>
              )}
            </div>
          )}

          <AlertDialogFooter className="flex items-center justify-end gap-2 pt-2">
            <AlertDialogCancel
              onClick={() => setDeleteCandidate(null)}
              className="h-9 px-4 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer border-0 bg-slate-100"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="h-9 px-4 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs cursor-pointer border-0"
            >
              Delete Station
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
