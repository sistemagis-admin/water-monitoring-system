import React, { useState } from 'react'
import type { AreaRoom, PumpAsset } from '../types/pump'
import { CustomSelect } from './CustomSelect'
import {
  Layers,
  Plus,
  Trash2,
  Zap,
  AlertCircle,
  Search,
  Pencil,
  Building2,
} from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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

interface PumpManagementTableProps {
  rooms: AreaRoom[]
  onOpenAddPump: () => void
  onOpenEditPump?: (pump: PumpAsset) => void
  onDeletePump: (pumpId: string) => void
  onToggleMotor?: (pumpId: string) => void
}

export const PumpManagementTable: React.FC<PumpManagementTableProps> = ({
  rooms,
  onOpenAddPump,
  onOpenEditPump,
  onDeletePump,
  onToggleMotor,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRoom, setFilterRoom] = useState<string>('ALL')
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; name: string; code: string } | null>(null)

  // Flatten all pumps across all rooms with their room context
  const allPumps: Array<{
    pump: PumpAsset
    room: AreaRoom
    roomIndex: number
    motorIndex: 0 | 1
  }> = []

  rooms.forEach((room, rIdx) => {
    room.pumps.forEach((pump, pIdx) => {
      allPumps.push({
        pump,
        room,
        roomIndex: rIdx,
        motorIndex: (pIdx % 2) as 0 | 1,
      })
    })
  })

  // Filter pumps
  const filteredPumps = allPumps.filter(({ pump, room }) => {
    const matchesSearch =
      pump.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pump.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRoom = filterRoom === 'ALL' || room.id === filterRoom

    return matchesSearch && matchesRoom
  })

  const getStatusBadge = (status: PumpAsset['status']) => {
    switch (status) {
      case 'RUNNING':
        return (
          <Badge variant="outline" className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200 inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500 led-pulse-emerald"></span>
            RUNNING
          </Badge>
        )
      case 'FAULT':
        return (
          <Badge variant="outline" className="font-mono text-[10px] font-bold text-rose-700 bg-rose-50 border-rose-200 inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-rose-500 led-pulse-rose"></span>
            TRIP / FAULT
          </Badge>
        )
      case 'STOPPED':
      default:
        return (
          <Badge variant="secondary" className="font-mono text-[10px] font-bold text-slate-600 inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-slate-400"></span>
            STANDBY
          </Badge>
        )
    }
  }

  const handleConfirmDelete = () => {
    if (deleteCandidate) {
      onDeletePump(deleteCandidate.id)
      setDeleteCandidate(null)
    }
  }

  return (
    <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs mb-6 select-none">
      <div>
        {/* Table Header & Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-slate-900 text-cyan-400 flex items-center justify-center shrink-0 shadow-xs">
              <Layers className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900 m-0 leading-tight">
                  Pump Assets Inventory
                </h3>
                <Badge variant="outline" className="font-mono text-[10px] font-bold">
                  {filteredPumps.length} UNITS
                </Badge>
              </div>
              <span className="text-xs font-mono text-slate-400 font-normal">
                Centrifugal Pump &amp; Motor Equipment Catalog
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search bar */}
            <div className="relative">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search pump name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs font-mono w-44 sm:w-56 h-8 bg-white"
              />
            </div>

            {/* Room filter with CustomSelect */}
            <CustomSelect
              options={[
                { value: 'ALL', label: `All Stations (${rooms.length})`, icon: <Building2 className="size-3.5 text-slate-400" /> },
                ...rooms.map((r) => ({
                  value: r.id,
                  label: r.name,
                  sublabel: `${r.pumps.length} pumps`,
                  icon: <Building2 className="size-3.5 text-[#00799e]" />,
                })),
              ]}
              value={filterRoom}
              onChange={(val) => setFilterRoom(val)}
              size="sm"
              className="w-48"
              minPopoverWidth="220px"
            />

            {/* Add Pump Button */}
            <Button
              type="button"
              size="sm"
              onClick={onOpenAddPump}
              className="bg-[#00799e] hover:bg-[#006887] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Add Pump</span>
            </Button>
          </div>
        </div>

        {/* Pumps Table */}
        {filteredPumps.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center text-slate-400 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            <Layers className="size-8 text-slate-300 mb-2" />
            <p className="font-bold text-sm text-slate-700 m-0">No Pumps Found</p>
            <span className="text-xs text-slate-500 font-mono">
              {searchQuery
                ? 'No pumps match the search criteria.'
                : 'Click "Add Pump" above to register a new unit to the system.'}
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/90 overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-mono text-[10px] uppercase font-bold text-slate-500 py-2.5 px-3">Tag / Code</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase font-bold text-slate-500 py-2.5 px-3">Pump Name</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase font-bold text-slate-500 py-2.5 px-3">Station / Area</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase font-bold text-slate-500 py-2.5 px-3">Motor Slot</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase font-bold text-slate-500 py-2.5 px-3">Operating Status</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase font-bold text-slate-500 py-2.5 px-3">Pressure &amp; Flow</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase font-bold text-slate-500 py-2.5 px-3">Active Power</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase font-bold text-slate-500 py-2.5 px-3 text-center">Motor Control</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase font-bold text-slate-500 py-2.5 px-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {filteredPumps.map(({ pump, room, motorIndex }) => {
                  const isRunning = pump.status === 'RUNNING'

                  return (
                    <TableRow key={pump.id || `${room.id}-${motorIndex}`} className="hover:bg-slate-50/60 transition-colors">
                      {/* Kode */}
                      <TableCell className="py-3 px-3">
                        <Badge variant="outline" className="font-mono font-bold text-slate-900 bg-slate-100 border-slate-200 text-[11px]">
                          {pump.code}
                        </Badge>
                      </TableCell>

                      {/* Nama Pompa */}
                      <TableCell className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs">{pump.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {pump.id.slice(0, 18)}...
                          </span>
                        </div>
                      </TableCell>

                      {/* Area / Lokasi */}
                      <TableCell className="py-3 px-3">
                        <Badge variant="secondary" className="font-mono text-[10px] font-bold text-slate-700 max-w-[180px] truncate" title={room.name}>
                          {room.name}
                        </Badge>
                      </TableCell>

                      {/* Slot Motor */}
                      <TableCell className="py-3 px-3">
                        <Badge variant="outline" className="font-mono text-[10px] font-bold bg-[#00799e]/10 text-[#00799e] border-[#00799e]/30">
                          Motor {motorIndex + 1} (M{motorIndex + 1})
                        </Badge>
                      </TableCell>

                      {/* Status Live */}
                      <TableCell className="py-3 px-3">
                        {getStatusBadge(pump.status)}
                      </TableCell>

                      {/* Tekanan & Debit */}
                      <TableCell className="py-3 px-3 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {pump.metrics.pressure_bar.toFixed(2)} bar
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600">
                            {pump.metrics.flow_m3h.toFixed(1)} m³/h
                          </span>
                        </div>
                      </TableCell>

                      {/* Daya Aktif */}
                      <TableCell className="py-3 px-3 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Zap className={`size-3 ${isRunning ? 'text-amber-500' : 'text-slate-300'}`} />
                          <span className="font-bold text-slate-800">
                            {pump.metrics.power_kw.toFixed(1)} kW
                          </span>
                        </div>
                      </TableCell>

                      {/* Kontrol Saklar Remote with shadcn Switch */}
                      <TableCell className="py-3 px-3 text-center">
                        {pump.controlEnabled === false ? (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400"
                            title="Remote control disabled for this pump"
                          >
                            <AlertCircle className="size-3 text-slate-300" />
                            Locked
                          </span>
                        ) : (
                          <div className="inline-flex items-center justify-center">
                            <Switch
                              checked={isRunning}
                              onCheckedChange={() => onToggleMotor?.(pump.id)}
                              title={`Click to ${isRunning ? 'Stop' : 'Start'} ${pump.name}`}
                            />
                          </div>
                        )}
                      </TableCell>

                      {/* Aksi Edit & Hapus */}
                      <TableCell className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onOpenEditPump && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => onOpenEditPump(pump)}
                              className="text-slate-400 hover:text-[#00799e] hover:bg-[#00799e]/10"
                              title={`Edit ${pump.name}`}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() =>
                              setDeleteCandidate({
                                id: pump.id,
                                name: pump.name,
                                code: pump.code,
                              })
                            }
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title={`Delete ${pump.name}`}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Delete using shadcn AlertDialog */}
      <AlertDialog
        open={deleteCandidate !== null}
        onOpenChange={(open) => !open && setDeleteCandidate(null)}
      >
        <AlertDialogContent className="sm:max-w-md bg-white border-0 rounded-2xl shadow-xl p-6">
          <AlertDialogHeader className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-red-600">
              <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="size-5" />
              </div>
              <div>
                <AlertDialogTitle className="font-heading font-semibold text-base text-slate-900 m-0">
                  Confirm Delete Pump
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-slate-500 m-0 font-normal mt-0.5">
                  This action will permanently remove the pump from the system
                </AlertDialogDescription>
              </div>
            </div>

            {deleteCandidate && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-normal">Pump Tag / Code:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {deleteCandidate.code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-normal">Pump Name:</span>
                  <span className="font-medium text-slate-900">
                    {deleteCandidate.name}
                  </span>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-600 m-0 leading-relaxed font-normal">
              Are you sure you want to delete this pump? All historical telemetry and sensor bindings associated with this unit will be unlinked.
            </p>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <AlertDialogCancel asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteCandidate(null)}
                className="text-xs font-medium text-slate-600"
              >
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs"
              >
                Delete Pump
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
