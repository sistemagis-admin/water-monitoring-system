import React, { useState, useEffect } from 'react'
import logoAmp from '../assets/logo/amp.png'
import {
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Wifi,
  WifiOff,
  Droplets,
  Globe,
  Crown,
  UserCheck,
  Wrench,
} from 'lucide-react'

interface LoginPageProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>
  isBackendOnline?: boolean
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isBackendOnline = true }) => {
  const [email, setEmail] = useState('admin@ascon.co.id')
  const [password, setPassword] = useState('Admin@123')
  const [fullName, setFullName] = useState('Super Admin Ascon')
  const [username, setUsername] = useState('admin_ascon')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Strictly lock body scroll when login page is active
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
      document.documentElement.style.overflow = 'unset'
    }
  }, [])

  const handleQuickSelect = (
    quickEmail: string,
    quickPass: string,
    quickName: string,
    quickUser: string
  ) => {
    setEmail(quickEmail)
    setPassword(quickPass)
    setFullName(quickName)
    setUsername(quickUser)
    setErrorMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Silakan lengkapi email dan kata sandi.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await onLogin({ email: email.trim(), password })
      if (!result.success) {
        setErrorMessage(result.error || 'Email atau kata sandi tidak valid.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghubungi server autentikasi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-white sm:bg-slate-50 flex items-center justify-center p-3 sm:p-4 lg:p-6 select-none">
      {/* Main Floating Rounded Card */}
      <div className="w-full max-w-[1020px] max-h-[96vh] sm:max-h-[92vh] bg-white rounded-[32px] sm:rounded-[38px] shadow-xl sm:shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: Deep Blue Atmospheric Panel */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 bg-gradient-to-b from-[#1e40af] via-[#2563eb] to-[#3b82f6] p-7 sm:p-10 lg:p-11 flex flex-col justify-between text-white relative overflow-hidden">
          
          {/* Subtle Glow Lighting Effect */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-sky-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-blue-900/40 rounded-full blur-3xl pointer-events-none" />

          {/* Top: Logo & Brand + Backend Status Badge */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-1 flex items-center justify-center shadow-xs">
                <img src={logoAmp} alt="Logo" className="w-full h-full object-contain filter brightness-0 invert" />
              </div>
              <span className="font-extrabold text-sm tracking-wide text-white">
                amp.swpms
              </span>
            </div>

            {/* Backend Online Status Pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/20 backdrop-blur-md border border-white/15 text-[10px] font-semibold text-white">
              {isBackendOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <Wifi className="w-3 h-3 text-emerald-300" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <WifiOff className="w-3 h-3 text-amber-300" />
                  <span className="hidden sm:inline">Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Main Content Area (Badge, Headline & Subtitle) */}
          <div className="my-auto py-8 relative z-10">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-semibold mb-4 shadow-2xs">
              <span>Water Monitoring SCADA</span>
              <Droplets className="w-3.5 h-3.5 text-sky-200" />
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-white tracking-tight leading-[1.12] mb-3.5">
              Start your Journey
            </h1>
            <p className="text-sm sm:text-base text-blue-100/90 font-medium leading-relaxed max-w-md">
              Follow these simple steps to access the smart industrial water pump monitoring and control platform.
            </p>
          </div>

          {/* Footer note inside left panel */}
          <div className="relative z-10 text-[11px] text-blue-150/80 font-medium pt-2 border-t border-white/15 flex items-center justify-between">
            <span>WTP Plant SCADA System</span>
            <span className="opacity-80">PT Ascon Multi Pratama</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Clean White Form */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-8 lg:p-9 flex flex-col justify-between overflow-y-auto">
          <div className="max-w-md mx-auto w-full">
            {/* Header Title */}
            <div className="text-center mb-4">
              <h2 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
                Join Us
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Akses sistem kendali &amp; telemetri SCADA WTP Plant
              </p>
            </div>

            {/* Error Notification Alert */}
            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
              {/* Field 1: Phone / Email Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email / Nomor Akses
                </label>
                <div className="flex items-center px-3 py-2 sm:py-2.5 rounded-xl bg-slate-100/90 border border-slate-200/70 focus-within:bg-white focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <div className="flex items-center gap-1.5 pr-2 border-r border-slate-300 mr-2 shrink-0 text-xs font-semibold text-slate-700">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span>ID +62</span>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@ascon.co.id"
                    className="w-full bg-transparent text-xs sm:text-[13px] font-semibold text-slate-900 outline-hidden placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Field 2 & 3: Full Name & Username (2 Columns, exact match) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <div className="flex items-center px-3 py-2 sm:py-2.5 rounded-xl bg-slate-100/90 border border-slate-200/70 focus-within:bg-white focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Juliette Karapetyan"
                      className="w-full bg-transparent text-xs sm:text-[13px] font-semibold text-slate-900 outline-hidden placeholder-slate-400"
                    />
                    <span className="text-slate-400 font-light ml-0.5 text-xs animate-pulse">|</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Username
                  </label>
                  <div className="flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-xl bg-slate-100/90 border border-slate-200/70 focus-within:bg-white focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="julietux"
                      className="w-full bg-transparent text-xs sm:text-[13px] font-semibold text-slate-900 outline-hidden placeholder-slate-400"
                    />
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                  </div>
                </div>
              </div>

              {/* Field 4: Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-xl bg-slate-100/90 border border-slate-200/70 focus-within:bg-white focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-transparent text-xs sm:text-[13px] font-mono font-semibold text-slate-900 outline-hidden placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer ml-1 shrink-0"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                  At least 8 characters, letters, numbers, and symbols.
                </p>
              </div>

              {/* Primary Blue Button (Continue) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-md active:scale-98 flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </form>

            {/* Already have account line */}
            <div className="text-center mt-2">
              <span className="text-[11px] text-slate-500 font-medium">
                Pilih akun instan?{' '}
                <button
                  type="button"
                  onClick={() => handleQuickSelect('admin@ascon.co.id', 'Admin@123', 'Super Admin Ascon', 'admin')}
                  className="font-bold text-[#2563eb] hover:underline cursor-pointer"
                >
                  Admin Auto-fill
                </button>
              </span>
            </div>

            {/* Divider 'Or' */}
            <div className="flex items-center my-2.5">
              <div className="flex-1 border-t border-slate-200" />
              <span className="px-2.5 text-[10px] text-slate-400 font-medium">Or</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            {/* Google / Quick SSO Button */}
            <button
              type="button"
              onClick={() => handleQuickSelect('operator@ascon.co.id', 'Operator@123', 'Plant Operator SCADA', 'operator_wtp')}
              className="w-full py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-[11px] transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-2 active:scale-98"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign in with Google (Demo Operator)</span>
            </button>

            {/* Quick Role Select Chips for 1-Click Login (Clean Lucide Icons) */}
            <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
              <button
                type="button"
                onClick={() => handleQuickSelect('admin@ascon.co.id', 'Admin@123', 'Super Admin Ascon', 'superadmin')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold cursor-pointer transition-colors"
              >
                <Crown className="w-2.5 h-2.5 text-purple-600" />
                <span>Super Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect('operator@ascon.co.id', 'Operator@123', 'Plant Operator SCADA', 'operator_wtp')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold cursor-pointer transition-colors"
              >
                <UserCheck className="w-2.5 h-2.5 text-emerald-600" />
                <span>Operator</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect('engineer@ascon.co.id', 'Engineer@123', 'Field SCADA Engineer', 'eng_scada')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold cursor-pointer transition-colors"
              >
                <Wrench className="w-2.5 h-2.5 text-blue-600" />
                <span>Engineer</span>
              </button>
            </div>
          </div>

          {/* Legal Footer Note */}
          <div className="text-center mt-3 pt-2">
            <p className="text-[9px] text-slate-400 leading-normal max-w-sm mx-auto">
              By signing up I confirm that I carefully have read and agree to the Ninth{' '}
              <a href="#terms" className="text-[#2563eb] hover:underline font-semibold">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="#terms" className="text-[#2563eb] hover:underline font-semibold">
                Terms of Service
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
