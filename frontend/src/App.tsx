import { useState, useEffect } from 'react'
import { usePumpSystem } from './hooks/usePumpSystem'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { StatsBar } from './components/StatsBar'
import { PumpCard } from './components/PumpCard'
import { TrendChart } from './components/TrendChart'
import { Footer } from './components/Footer'
import { EmergencyStopModal } from './components/EmergencyStopModal'

export function App() {
  const {
    stations,
    stats,
    toggleMotor,
    emergencyStop,
  } = usePumpSystem()

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Emergency Stop confirmation modal state
  const [isStopModalOpen, setIsStopModalOpen] = useState(false)

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
      <Sidebar onProfileClick={() => setIsStopModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col justify-between">
        <div>
          {/* Header Bar */}
          <Header
            theme={theme}
            onToggleTheme={toggleTheme}
            onEmergencyStop={() => setIsStopModalOpen(true)}
          />

          {/* 4 Unified KPI Stat Blocks */}
          <StatsBar stats={stats} />

          {/* 3 Pump Station Cards Grid spanning full width */}
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

          {/* Real-time Trend Chart Section spanning full width */}
          <TrendChart stations={stations} />
        </div>

        {/* Footer */}
        <Footer />
      </main>

      {/* Safety Emergency Stop Confirmation Modal */}
      <EmergencyStopModal
        isOpen={isStopModalOpen}
        onClose={() => setIsStopModalOpen(false)}
        onConfirm={emergencyStop}
        runningCount={stats.runningMotors}
      />
    </div>
  )
}

export default App
