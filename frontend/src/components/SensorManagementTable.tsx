import React from 'react'
import type { SensorItem } from '../types/pump'
import { Radio, Plus, Trash2 } from 'lucide-react'
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

interface SensorManagementTableProps {
  sensors: SensorItem[]
  onOpenAddSensor: () => void
  onDeleteSensor: (id: string) => void
}

export const SensorManagementTable: React.FC<SensorManagementTableProps> = ({
  sensors,
  onOpenAddSensor,
  onDeleteSensor,
}) => {
  const getSensorTypeVariant = (type: SensorItem['sensorType']) => {
    switch (type) {
      case 'PRESSURE_SENSOR':
        return 'default'
      case 'FLOW_METER':
        return 'secondary'
      case 'LEVEL_SENSOR':
      case 'DISTANCE_SENSOR':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs mb-6 select-none">
      <div>
        {/* Table Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
              <Radio className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900 m-0 leading-tight">
                  Field Instrumentation &amp; Sensors
                </h3>
                <Badge variant="outline" className="font-mono text-[10px] font-bold">
                  {sensors.length} SENSORS
                </Badge>
              </div>
              <span className="text-xs font-mono text-slate-400 font-normal">
                Transmitter Channels &amp; Signal Mapping
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={onOpenAddSensor}
              className="bg-[#00799e] hover:bg-[#006887] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Add Sensor</span>
            </Button>
          </div>
        </div>

        {/* Sensor Table */}
        {sensors.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center text-slate-400 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            <Radio className="size-8 text-slate-300 mb-2" />
            <p className="font-bold text-sm text-slate-700 m-0">No Field Sensors Registered</p>
            <span className="text-xs font-mono text-slate-500 mt-1">
              Click &quot;Add Sensor&quot; above to bind field transmitter channels to station assets.
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/90 overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-mono text-[10px] uppercase font-bold text-slate-500 py-2.5 px-3">Tag / Code</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase font-bold text-slate-500 py-2.5 px-3">Instrument Name</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase font-bold text-slate-500 py-2.5 px-3">Sensor Type</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase font-bold text-slate-500 py-2.5 px-3">Bound Target</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase font-bold text-slate-500 py-2.5 px-3">Live Value</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase font-bold text-slate-500 py-2.5 px-3">Normal Threshold</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase font-bold text-slate-500 py-2.5 px-3">Status</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase font-bold text-slate-500 py-2.5 px-3 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {sensors.map((sensor) => {
                  const isAbnormal =
                    (sensor.minThreshold !== undefined && sensor.currentValue < sensor.minThreshold) ||
                    (sensor.maxThreshold !== undefined && sensor.currentValue > sensor.maxThreshold)

                  return (
                    <TableRow key={sensor.id} className="hover:bg-slate-50/70 transition-colors duration-150 ease-out">
                      <TableCell className="py-3 px-3">
                        <Badge variant="outline" className="font-mono font-bold text-xs text-slate-900 bg-slate-100 border-slate-200">
                          {sensor.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-3 font-semibold text-slate-900 text-xs">
                        {sensor.name}
                      </TableCell>
                      <TableCell className="py-3 px-3">
                        <Badge
                          variant={getSensorTypeVariant(sensor.sensorType)}
                          className="font-mono text-[10px] font-bold tracking-wider"
                        >
                          {sensor.sensorType.replace('_SENSOR', '').replace('_METER', '')}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-700">
                            {sensor.targetName}
                          </span>
                          <Badge variant="secondary" className="font-mono text-[9px] font-bold">
                            {sensor.targetType}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-3 font-mono">
                        <span
                          className={`font-bold text-xs sm:text-sm tabular-nums ${
                            isAbnormal ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {sensor.currentValue} <span className="text-[11px] font-normal text-slate-400">{sensor.unit}</span>
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-3 font-mono text-xs text-slate-500 tabular-nums">
                        {sensor.minThreshold !== undefined && sensor.maxThreshold !== undefined
                          ? `${sensor.minThreshold} - ${sensor.maxThreshold} ${sensor.unit}`
                          : '-'}
                      </TableCell>
                      <TableCell className="py-3 px-3">
                        {isAbnormal ? (
                          <Badge variant="outline" className="font-mono text-[10px] font-bold text-rose-700 bg-rose-50 border-0 inline-flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-rose-500 led-pulse-rose"></span>
                            ABNORMAL
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 border-0 inline-flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-emerald-500 led-pulse-emerald"></span>
                            NORMAL
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onDeleteSensor(sensor.id)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete Sensor"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </section>
  )
}
