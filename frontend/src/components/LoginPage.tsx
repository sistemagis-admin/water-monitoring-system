import React, { useState } from 'react'
import logoAmp from '../assets/logo/amp.png'
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Activity,
  Waves,
  Cpu,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

interface LoginPageProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>
  isBackendOnline?: boolean
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isBackendOnline = true }) => {
  const [email, setEmail] = useState('admin@ascon.co.id')
  const [password, setPassword] = useState('Admin@123')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleQuickSelect = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail)
    setPassword(quickPass)
    setErrorMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Silakan masukkan email dan password.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await onLogin({ email: email.trim(), password })
      if (!result.success) {
        setErrorMessage(result.error || 'Email atau password tidak sesuai.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal terhubung ke server autentikasi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 select-none">
      <div className="w-full max-w-5xl bg-slate-800 border border-slate-700/80 rounded-[32px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Left Col: Brand Presentation & System Highlights */}
        <div className="lg:col-span-6 bg-slate-950 p-8 sm:p-10 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          <div>
            {/* Brand Logo & Pill */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl p-1.5 bg-slate-900 border border-slate-700 shadow-md flex items-center justify-center">
                <img src={logoAmp} alt="AMP Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-xs font-extrabold tracking-widest text-[var(--amp-teal)] uppercase">
                  PT Ascon Multi Pratama
                </span>
                <h2 className="text-lg font-extrabold text-white leading-tight">
                  SWPMS Enterprise
                </h2>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Smart Water Pump <br className="hidden sm:inline" />
              Monitoring System
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed mb-8">
              Platform SCADA IoT industri untuk pemantauan telemetri pompa, visualisasi debit &amp; tekanan real-time, serta sistem kendali keselamatan otomatis.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/90">
                <div className="w-8 h-8 rounded-xl bg-[var(--amp-teal)] text-white flex items-center justify-center shrink-0">
                  <Waves className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Telemetri Sub-detik Real-time</h4>
                  <p className="text-[11px] text-slate-400">Streaming SSE &amp; Ingestion broker MQTT QoS 1</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/90">
                <div className="w-8 h-8 rounded-xl bg-[var(--amp-magenta)] text-white flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Rule Engine &amp; Alarm Abnormal</h4>
                  <p className="text-[11px] text-slate-400">Deteksi otomatis overheat, kavitasi &amp; dry-run</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800/90">
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Kendali Jarak Jauh Terverifikasi</h4>
                  <p className="text-[11px] text-slate-400">Perintah SCADA Start/Stop &amp; E-STOP terenkripsi</p>
                </div>
              </div>
            </div>
          </div>

          {/* Backend Status Pill */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isBackendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="font-semibold text-slate-300">
                {isBackendOnline ? 'Fastify Server Online' : 'Connecting to Server...'}
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">v1.0.0 (WTP Plant)</span>
          </div>
        </div>

        {/* Right Col: Login Form */}
        <div className="lg:col-span-6 bg-slate-800 p-8 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700/60 text-slate-300 text-xs font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--amp-teal)]" />
                <span>Autentikasi SCADA Operator</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Masuk ke Akun Anda
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Masukkan email dan kata sandi yang telah terdaftar pada sistem.
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  Alamat Email *
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@ascon.co.id"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 font-medium focus:bg-slate-950 focus:border-[var(--amp-teal)] focus:ring-1 focus:ring-[var(--amp-teal)] outline-hidden transition-all text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  Kata Sandi *
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 font-medium focus:bg-slate-950 focus:border-[var(--amp-teal)] focus:ring-1 focus:ring-[var(--amp-teal)] outline-hidden transition-all text-xs sm:text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[var(--amp-teal)] hover:bg-[#007085] active:scale-98 text-white font-extrabold text-sm transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke SCADA System</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="mt-6 pt-5 border-t border-slate-700/60">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Akun Demo &amp; Role Sistem:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickSelect('admin@ascon.co.id', 'Admin@123')}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    email === 'admin@ascon.co.id'
                      ? 'bg-slate-900 border-[var(--amp-teal)] text-white'
                      : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Super Admin</span>
                    {email === 'admin@ascon.co.id' && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--amp-teal)]" />}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">admin@ascon.co.id</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSelect('operator@ascon.co.id', 'Operator@123')}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    email === 'operator@ascon.co.id'
                      ? 'bg-slate-900 border-[var(--amp-teal)] text-white'
                      : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Operator SCADA</span>
                    {email === 'operator@ascon.co.id' && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--amp-teal)]" />}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">operator@ascon.co.id</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSelect('engineer@ascon.co.id', 'Engineer@123')}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    email === 'engineer@ascon.co.id'
                      ? 'bg-slate-900 border-[var(--amp-teal)] text-white'
                      : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Field Engineer</span>
                    {email === 'engineer@ascon.co.id' && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--amp-teal)]" />}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">engineer@ascon.co.id</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSelect('viewer@ascon.co.id', 'Viewer@123')}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    email === 'viewer@ascon.co.id'
                      ? 'bg-slate-900 border-[var(--amp-teal)] text-white'
                      : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Auditor / Viewer</span>
                    {email === 'viewer@ascon.co.id' && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--amp-teal)]" />}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">viewer@ascon.co.id</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center text-[11px] text-slate-500">
            &copy; 2026 PT Ascon Multi Pratama · All rights reserved.
          </div>
        </div>
      </div>
    </div>
  )
}
