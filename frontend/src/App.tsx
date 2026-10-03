import { useState, useEffect } from 'react'
import { usePumpSystem } from './hooks/usePumpSystem'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { StatsBar } from './components/StatsBar'
import { PumpCard } from './components/PumpCard'
import { TrendChart } from './components/TrendChart'
import { AlarmsPanel } from './components/AlarmsPanel'
import { DeviceHealthTable } from './components/DeviceHealthTable'
import { SensorManagementTable } from './components/SensorManagementTable'
import { AddPumpModal } from './components/AddPumpModal'
import { AddSensorModal } from './components/AddSensorModal'
import { Footer } from './components/Footer'
import { EmergencyStopModal } from './components/EmergencyStopModal'

export function App() {
  const {
    rooms,
    stations,
    gateways,
    sensors,
    alarms,
    stats,
    addPump,
    addSensor,
    deleteSensor,
    toggleMotor,
    emergencyStop,
    acknowledgeAlarm,
  } = usePumpSystem()

  // Navigation tab state
  const [activeTab, setActiveTab] = useState('dashboard')

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Modal states
  const [isStopModalOpen, setIsStopModalOpen] = useState(false)
  const [isAddPumpOpen, setIsAddPumpOpen] = useState(false)
  const [isAddSensorOpen, setIsAddSensorOpen] = useState(false)

  // Sync theme with HTML data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--ink)] antialiased transition-colors duration-250 flex">
      {/* Sleek Capsule Sidebar with AMP Brand Styling */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onProfileClick={() => setIsStopModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col justify-between">
        <div>
          {/* Header Bar */}
          <Header
            theme={theme}
            onToggleTheme={toggleTheme}
            onEmergencyStop={() => setIsStopModalOpen(true)}
            onOpenAddPump={() => setIsAddPumpOpen(true)}
            onOpenAddSensor={() => setIsAddSensorOpen(true)}
          />

          {/* Unified KPI Stat Blocks */}
          <StatsBar
            stats={stats}
            onAlarmClick={() => setActiveTab('alarms')}
          />

          {/* 1. Pump Station Cards Grid (Visible on Dashboard & Pumps tab) */}
          {(activeTab === 'dashboard' || activeTab === 'pumps') && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 mb-6">
              {stations.map((station, index) => (
                <PumpCard
                  key={station.id}
                  station={station}
                  stationIndex={index}
                  onToggleMotor={toggleMotor}
                />
              ))}
            </section>
          )}

          {/* 2. Real-time Trend Chart Section (Visible on Dashboard & Pumps tab) */}
          {(activeTab === 'dashboard' || activeTab === 'pumps') && (
            <div className="mb-6">
              <TrendChart stations={stations} />
            </div>
          )}

          {/* 3. Sensor Management Table (Visible on Dashboard & Sensors tab) */}
          {(activeTab === 'dashboard' || activeTab === 'sensors') && (
            <SensorManagementTable
              sensors={sensors}
              onOpenAddSensor={() => setIsAddSensorOpen(true)}
              onDeleteSensor={deleteSensor}
            />
          )}

          {/* 4. Alarms & Device Connectivity Panels Grid */}
          {(activeTab === 'dashboard' || activeTab === 'alarms' || activeTab === 'devices') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 mb-6">
              {(activeTab === 'dashboard' || activeTab === 'alarms') && (
                <AlarmsPanel alarms={alarms} onAcknowledge={acknowledgeAlarm} />
              )}
              {(activeTab === 'dashboard' || activeTab === 'devices') && (
                <DeviceHealthTable gateways={gateways} />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <Footer />
      </main>

      {/* Add Pump Modal */}
      <AddPumpModal
        isOpen={isAddPumpOpen}
        onClose={() => setIsAddPumpOpen(false)}
        onAddPump={addPump}
        rooms={rooms}
        gateways={gateways}
      />

      {/* Add Sensor Modal */}
      <AddSensorModal
        isOpen={isAddSensorOpen}
        onClose={() => setIsAddSensorOpen(false)}
        onAddSensor={addSensor}
        rooms={rooms}
        gateways={gateways}
      />

      {/* Safety Emergency Stop Confirmation Modal */}
      <EmergencyStopModal
        isOpen={isStopModalOpen}
        onClose={() => setIsStopModalOpen(false)}
        onConfirm={emergencyStop}
        runningCount={stats.runningPumps}
      />
    </div>
  )
}

export default App
