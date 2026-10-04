import { useState } from 'react'
import type { AreaRoom, PumpAsset } from './types/pump'
import { usePumpSystem } from './hooks/usePumpSystem'
import { useToast } from './context/ToastContext'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { DashboardMonitoringView } from './components/DashboardMonitoringView'
import { AreaManagementView } from './components/AreaManagementView'
import { PumpAreaView } from './components/PumpAreaView'
import { DeviceHealthTable } from './components/DeviceHealthTable'
import { SensorManagementTable } from './components/SensorManagementTable'
import { AlarmsPanel } from './components/AlarmsPanel'
import { AddAreaModal } from './components/AddAreaModal'
import { EditAreaModal } from './components/EditAreaModal'
import { AddPumpModal } from './components/AddPumpModal'
import { EditPumpModal } from './components/EditPumpModal'
import { AddSensorModal } from './components/AddSensorModal'
import { AddDeviceModal } from './components/AddDeviceModal'
import { EmergencyStopModal } from './components/EmergencyStopModal'
import { LogoutConfirmModal } from './components/LogoutConfirmModal'
import { LoginPage } from './components/LoginPage'
import { ProfileModal } from './components/ProfileModal'
import { UserManagementView } from './components/UserManagementView'
import { AlarmManagementView } from './components/AlarmManagementView'
import { Loader2 } from 'lucide-react'

export function App() {
  const toast = useToast()
  const {
    rooms,
    gateways,
    sensors,
    alarms,
    stats,
    isLoading,
    isAuthenticated,
    isBackendOnline,
    currentUser,
    login,
    logout,
    addArea,
    updateArea,
    deleteArea,
    addPump,
    updatePump,
    deletePump,
    addSensor,
    deleteSensor,
    addGateway,
    deleteGateway,
    toggleMotor,
    emergencyStop,
    acknowledgeAlarm,
  } = usePumpSystem()

  // Navigation tab state (Default to Dashboard)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Modal states
  const [isStopModalOpen, setIsStopModalOpen] = useState(false)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const [isAddAreaOpen, setIsAddAreaOpen] = useState(false)
  const [selectedEditArea, setSelectedEditArea] = useState<AreaRoom | null>(null)
  const [isEditAreaOpen, setIsEditAreaOpen] = useState(false)
  const [isAddPumpOpen, setIsAddPumpOpen] = useState(false)
  const [addPumpAreaId, setAddPumpAreaId] = useState<string | undefined>(undefined)
  const [selectedEditPump, setSelectedEditPump] = useState<PumpAsset | null>(null)
  const [isEditPumpOpen, setIsEditPumpOpen] = useState(false)
  const [isAddSensorOpen, setIsAddSensorOpen] = useState(false)
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleOpenAddPump = (areaId?: string) => {
    setAddPumpAreaId(areaId)
    setIsAddPumpOpen(true)
  }

  const handleOpenEditPump = (pump: PumpAsset) => {
    setSelectedEditPump(pump)
    setIsEditPumpOpen(true)
  }

  const handleOpenEditArea = (room: AreaRoom) => {
    setSelectedEditArea(room)
    setIsEditAreaOpen(true)
  }

  // Wrapped Handlers with Toast Feedback
  const handleAddArea = async (payload: { code: string; name: string; description?: string }) => {
    try {
      await addArea(payload)
      toast.success('Area Berhasil Ditambahkan', `Ruangan ${payload.name} (${payload.code}) telah terdaftar.`)
    } catch {
      toast.error('Gagal Menambahkan Area', 'Terjadi kesalahan saat menyimpan data ruangan.')
    }
  }

  const handleUpdateArea = async (
    areaId: string,
    payload: { code: string; name: string; description?: string }
  ) => {
    try {
      await updateArea(areaId, payload)
      toast.success('Data Ruangan Diperbarui', `Informasi area ${payload.name} berhasil disimpan.`)
    } catch {
      toast.error('Gagal Memperbarui Area', 'Terjadi kesalahan saat memperbarui data ruangan.')
    }
  }

  const handleDeleteArea = async (areaId: string) => {
    try {
      await deleteArea(areaId)
      toast.info('Area Dihapus', 'Ruangan berhasil dihapus dari sistem.')
    } catch {
      toast.error('Gagal Menghapus Area', 'Terjadi kesalahan saat menghapus ruangan.')
    }
  }

  const handleAddPump = async (payload: any) => {
    try {
      await addPump(payload)
      toast.success('Pompa Berhasil Didaftarkan', `Unit ${payload.name} (${payload.code}) siap dioperasikan.`)
    } catch {
      toast.error('Gagal Menambahkan Pompa', 'Terjadi kesalahan saat menyimpan data pompa.')
    }
  }

  const handleUpdatePump = async (pumpId: string, payload: any) => {
    try {
      await updatePump(pumpId, payload)
      toast.success('Data Pompa Diperbarui', `Konfigurasi pompa ${payload.name} berhasil disimpan.`)
    } catch {
      toast.error('Gagal Memperbarui Pompa', 'Terjadi kesalahan saat memperbarui data pompa.')
    }
  }

  const handleDeletePump = async (pumpId: string) => {
    try {
      await deletePump(pumpId)
      toast.info('Pompa Dihapus', 'Unit pompa berhasil dihapus dari sistem.')
    } catch {
      toast.error('Gagal Menghapus Pompa', 'Terjadi kesalahan saat menghapus pompa.')
    }
  }

  const handleAddSensor = async (payload: any) => {
    try {
      await addSensor(payload)
      toast.success('Sensor Berhasil Terhubung', `Instrument ${payload.code} (${payload.name}) aktif.`)
    } catch {
      toast.error('Gagal Menambahkan Sensor', 'Terjadi kesalahan saat menghubungkan sensor.')
    }
  }

  const handleDeleteSensor = async (sensorId: string) => {
    try {
      await deleteSensor(sensorId)
      toast.info('Sensor Dihapus', 'Instrumentasi sensor telah dihapus.')
    } catch {
      toast.error('Gagal Menghapus Sensor', 'Terjadi kesalahan saat menghapus sensor.')
    }
  }

  const handleAddGateway = async (payload: { code: string; name: string; ip: string; firmware?: string; siteId?: string }) => {
    try {
      await addGateway(payload)
      toast.success('Gateway IoT Ditambahkan', `Perangkat ${payload.code} (${payload.name}) aktif.`)
    } catch {
      toast.error('Gagal Menambahkan Gateway', 'Terjadi kesalahan saat mendaftarkan gateway.')
    }
  }

  const handleDeleteGateway = async (gatewayId: string) => {
    try {
      await deleteGateway(gatewayId)
      toast.info('Gateway IoT Dihapus', 'Perangkat gateway telah dihapus dari sistem.')
    } catch {
      toast.error('Gagal Menghapus Gateway', 'Terjadi kesalahan saat menghapus gateway.')
    }
  }

  const handleToggleMotor = async (pumpIdOrRoomIdx: string | number, motorIndex?: number) => {
    let targetPump: PumpAsset | undefined

    if (typeof pumpIdOrRoomIdx === 'string') {
      for (const room of rooms) {
        const found = room.pumps.find((p) => p.id === pumpIdOrRoomIdx)
        if (found) {
          targetPump = found
          break
        }
      }
    } else {
      const targetRoom = rooms[pumpIdOrRoomIdx]
      if (targetRoom && motorIndex !== undefined) {
        targetPump = targetRoom.pumps[motorIndex]
      }
    }

    const willBeRunning = targetPump?.status !== 'RUNNING'

    await toggleMotor(pumpIdOrRoomIdx, motorIndex)
    if (willBeRunning) {
      toast.success('Pompa Dinyalakan', `Unit ${targetPump?.code || targetPump?.name || 'Pompa'} telah aktif beroperasi.`)
    } else {
      toast.info('Pompa Dimatikan', `Unit ${targetPump?.code || targetPump?.name || 'Pompa'} dinonaktifkan.`)
    }
  }

  const handleEmergencyStop = async () => {
    await emergencyStop()
    setIsStopModalOpen(false)
    toast.warning('Emergency Stop Diaktifkan', 'Seluruh unit pompa telah dimatikan seketika demi keselamatan.')
  }

  const handleAcknowledgeAlarm = async (alarmId: string) => {
    await acknowledgeAlarm(alarmId)
    toast.info('Alarm Diakui', 'Status konfirmasi alarm telah dicatat ke sistem.')
  }

  // If not authenticated, render Login Page
  if (!isAuthenticated) {
    return <LoginPage onLogin={login} isBackendOnline={isBackendOnline} />
  }

  // Loading Screen while verifying session
  if (isLoading && rooms.length === 0) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center text-white select-none">
        <div className="w-12 h-12 rounded-2xl bg-[#00799e] text-white flex items-center justify-center mb-4 shadow-lg animate-bounce">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <h3 className="font-heading font-semibold text-xl mb-1">
          Memuat Sistem SCADA...
        </h3>
        <p className="text-xs text-slate-400">
          Menghubungkan ke Fastify Backend &amp; Stream Telemetri Real-time
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#F4F7FB] text-slate-900 flex antialiased selection:bg-[#00799e] selection:text-white">
      {/* Left Sidebar (Sticky Full-Height Panel) */}
      <div className="w-64 lg:w-72 bg-white border-r border-slate-200/80 p-6 flex flex-col justify-between shrink-0 sticky top-0 h-screen overflow-y-auto">
        <Sidebar
          activeTab={activeTab}
          currentUser={currentUser}
          openAlarmsCount={alarms.filter((a) => a.status === 'OPEN').length}
          onSelectTab={setActiveTab}
          onProfileClick={() => setIsProfileOpen(true)}
          onOpenAddArea={() => setIsAddAreaOpen(true)}
          onLogout={() => setIsLogoutConfirmOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-6 sm:p-8 lg:p-8 flex flex-col justify-between overflow-y-auto min-h-screen">
        <div>
          {/* Top Navigation Bar with Capsule Tabs & User Profile */}
          <Header
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            currentUser={currentUser}
            onProfileClick={() => setIsProfileOpen(true)}
            onOpenAddArea={() => setIsAddAreaOpen(true)}
            onOpenAddPump={() => handleOpenAddPump()}
          />

          {/* TAB 0: DASHBOARD MONITORING SCADA */}
          {activeTab === 'dashboard' && (
            <DashboardMonitoringView
              rooms={rooms}
              onToggleMotor={handleToggleMotor}
              onOpenAddPump={() => handleOpenAddPump()}
            />
          )}

          {/* TAB 1: AREA & RUANGAN */}
          {activeTab === 'areas' && (
            <AreaManagementView
              rooms={rooms}
              onOpenAddArea={() => setIsAddAreaOpen(true)}
              onOpenEditArea={handleOpenEditArea}
              onDeleteArea={handleDeleteArea}
            />
          )}

          {/* TAB 2: MANAJEMEN POMPA */}
          {activeTab === 'pumps' && (
            <PumpAreaView
              rooms={rooms}
              onOpenAddPump={handleOpenAddPump}
              onOpenEditPump={handleOpenEditPump}
              onDeletePump={handleDeletePump}
              onToggleMotor={handleToggleMotor}
            />
          )}

          {/* TAB 3: SENSOR & BINDING */}
          {activeTab === 'sensors' && (
            <SensorManagementTable
              sensors={sensors}
              onOpenAddSensor={() => setIsAddSensorOpen(true)}
              onDeleteSensor={handleDeleteSensor}
            />
          )}

          {/* TAB 4: GATEWAY IOT */}
          {activeTab === 'devices' && (
            <DeviceHealthTable
              gateways={gateways}
              onOpenAddDevice={() => setIsAddDeviceOpen(true)}
              onDeleteDevice={handleDeleteGateway}
            />
          )}

          {/* TAB 5: PUSAT ALARM & ATURAN */}
          {activeTab === 'alarms' && (
            <AlarmManagementView
              alarms={alarms}
              rooms={rooms}
              currentUser={currentUser}
              isBackendOnline={isBackendOnline}
              onAcknowledgeAlarm={handleAcknowledgeAlarm}
            />
          )}

          {/* TAB 6: MANAJEMEN USER & AKSES */}
          {activeTab === 'users' && (
            <UserManagementView
              currentUser={currentUser}
              isBackendOnline={isBackendOnline}
            />
          )}
        </div>

        {/* Compact Footer (Clean typography without dot) */}
        <div className="mt-8 pt-4 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>&copy; {new Date().getFullYear()} PT. Ascon Multipratama. All systems operational.</span>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className={isBackendOnline ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold'}>
              {isBackendOnline ? 'Data Online' : 'Data Offline'}
            </span>
          </div>
        </div>
      </main>

      {/* Add Area Modal */}
      <AddAreaModal
        isOpen={isAddAreaOpen}
        onClose={() => setIsAddAreaOpen(false)}
        onAddArea={handleAddArea}
      />

      {/* Edit Area Modal */}
      <EditAreaModal
        isOpen={isEditAreaOpen}
        onClose={() => {
          setIsEditAreaOpen(false)
          setSelectedEditArea(null)
        }}
        room={selectedEditArea}
        onUpdateArea={handleUpdateArea}
      />

      {/* Add Pump Modal */}
      <AddPumpModal
        isOpen={isAddPumpOpen}
        onClose={() => {
          setIsAddPumpOpen(false)
          setAddPumpAreaId(undefined)
        }}
        onAddPump={handleAddPump}
        rooms={rooms}
        gateways={gateways}
        initialAreaId={addPumpAreaId}
      />

      {/* Edit Pump Modal */}
      <EditPumpModal
        isOpen={isEditPumpOpen}
        onClose={() => {
          setIsEditPumpOpen(false)
          setSelectedEditPump(null)
        }}
        pump={selectedEditPump}
        rooms={rooms}
        gateways={gateways}
        onUpdatePump={handleUpdatePump}
      />

      {/* Add Sensor Modal */}
      <AddSensorModal
        isOpen={isAddSensorOpen}
        onClose={() => setIsAddSensorOpen(false)}
        onAddSensor={handleAddSensor}
        rooms={rooms}
        gateways={gateways}
      />

      {/* Add IoT Device Modal */}
      <AddDeviceModal
        isOpen={isAddDeviceOpen}
        onClose={() => setIsAddDeviceOpen(false)}
        onAddGateway={handleAddGateway}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onLogout={() => {
          setIsProfileOpen(false)
          setIsLogoutConfirmOpen(true)
        }}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={logout}
        userName={currentUser?.full_name}
      />

      {/* Safety Emergency Stop Confirmation Modal */}
      <EmergencyStopModal
        isOpen={isStopModalOpen}
        onClose={() => setIsStopModalOpen(false)}
        onConfirm={handleEmergencyStop}
        runningCount={stats.runningPumps}
      />
    </div>
  )
}

export default App
