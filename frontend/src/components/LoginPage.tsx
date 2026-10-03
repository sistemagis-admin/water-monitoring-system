import React, { useState, useEffect } from 'react'
import logoAmp from '../assets/logo/amp.png'
import {
  Eye,
  EyeOff,
  AlertCircle,
  User,
  Lock,
  LogIn,
} from 'lucide-react'

interface LoginPageProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>
  isBackendOnline?: boolean
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Silakan masukkan username dan kata sandi Anda.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await onLogin({ email: username.trim(), password })
      if (!result.success) {
        setErrorMessage(
          result.error ||
          'Username atau kata sandi tidak valid. Silakan coba kembali.'
        )
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal terhubung ke server backend (192.168.100.6:3000).')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-white sm:bg-slate-50 flex items-center justify-center p-3 sm:p-4 lg:p-6 select-none">
      {/* Main Floating Rounded Card */}
      <div className="w-full max-w-[960px] max-h-[96vh] sm:max-h-[90vh] bg-white rounded-[32px] sm:rounded-[38px] shadow-xl sm:shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: Deep Blue Atmospheric Panel */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 bg-gradient-to-b from-[#1e40af] via-[#2563eb] to-[#3b82f6] p-7 sm:p-10 lg:p-11 flex flex-col justify-between text-white relative overflow-hidden">
          
          {/* Subtle Glow Lighting Effect */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-sky-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-blue-900/40 rounded-full blur-3xl pointer-events-none" />

          {/* Top: Logo & Brand */}
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-1 flex items-center justify-center shadow-xs">
              <img src={logoAmp} alt="Logo" className="w-full h-full object-contain filter brightness-0 invert" />
            </div>
            <span className="font-extrabold text-sm tracking-wide text-white">
              PT Ascon Multi Pratama
            </span>
          </div>

          {/* Main Content Area (Headline & Description) */}
          <div className="my-auto py-8 relative z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-white tracking-tight leading-[1.2] mb-3.5">
              Sistem Monitoring &amp; Kendali Pompa Air
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium leading-relaxed max-w-md">
              Platform telemetri terintegrasi untuk pemantauan level tangki, debit aliran pipa, tekanan distribusi, dan status operasional pompa secara real-time.
            </p>
          </div>

          {/* Footer note inside left panel */}
          <div className="relative z-10 text-[11px] text-blue-100/80 font-medium pt-2 border-t border-white/15 flex items-center justify-between">
            <span>PT Ascon Multi Pratama</span>
            <span className="opacity-80">Water Monitoring System</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Clean White Form */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 bg-white p-7 sm:p-9 lg:p-11 flex flex-col justify-between overflow-y-auto">
          <div className="max-w-md mx-auto w-full my-auto">
            {/* Header Title */}
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
                Masuk ke Sistem
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Silakan masukkan username dan kata sandi akun Anda
              </p>
            </div>

            {/* Error Notification Alert */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Username */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Username
                </label>
                <div className="flex items-center px-3.5 py-2.5 sm:py-3 rounded-xl bg-slate-100/90 border border-slate-200/70 focus-within:bg-white focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <User className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className="w-full bg-transparent text-xs sm:text-[13px] font-semibold text-slate-900 outline-hidden placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Field 2: Kata Sandi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Kata Sandi
                </label>
                <div className="flex items-center justify-between px-3.5 py-2.5 sm:py-3 rounded-xl bg-slate-100/90 border border-slate-200/70 focus-within:bg-white focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <div className="flex items-center flex-1 mr-2">
                    <Lock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full bg-transparent text-xs sm:text-[13px] font-mono font-semibold text-slate-900 outline-hidden placeholder-slate-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer ml-1 shrink-0"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Blue Button (Masuk ke Sistem) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-md active:scale-98 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke Sistem</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Legal Footer Note */}
          <div className="text-center mt-6 pt-2">
            <p className="text-[10px] text-slate-400 leading-normal max-w-sm mx-auto">
              Dengan masuk ke sistem, Anda menyetujui{' '}
              <a href="#privacy" className="text-[#2563eb] hover:underline font-semibold">
                Kebijakan Privasi
              </a>{' '}
              dan{' '}
              <a href="#terms" className="text-[#2563eb] hover:underline font-semibold">
                Ketentuan Layanan
              </a>{' '}
              PT Ascon Multi Pratama.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
