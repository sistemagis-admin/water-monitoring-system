import React, { useState, useEffect } from 'react'
import logoAmp from '../assets/logo/amp.png'
import {
  Eye,
  EyeOff,
  AlertCircle,
  Mail,
  Lock,
  LogIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LoginPageProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>
  isBackendOnline?: boolean
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('')
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
    const inputEmail = email.trim()
    const inputPass = password.trim()

    if (!inputEmail || !inputPass) {
      setErrorMessage('Mohon masukkan alamat email dan kata sandi Anda.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await onLogin({ email: inputEmail, password: inputPass })
      if (!result.success) {
        // OWASP Security Guideline: Generic error message to prevent user enumeration & credential disclosure
        setErrorMessage('Email atau kata sandi yang Anda masukkan salah. Silakan coba kembali.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Tidak dapat terhubung ke server SCADA. Periksa koneksi jaringan Anda.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-white sm:bg-slate-50 flex items-center justify-center p-3 sm:p-4 lg:p-6 select-none">
      {/* Main Floating Rounded Card */}
      <div className="w-full max-w-[960px] max-h-[96vh] sm:max-h-[90vh] bg-white rounded-[32px] sm:rounded-[38px] shadow-xl sm:shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: Deep Teal Atmospheric Panel (#00799e) */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 bg-gradient-to-b from-[#004e66] via-[#006887] to-[#00799e] p-7 sm:p-10 lg:p-11 flex flex-col justify-between text-white relative overflow-hidden">
          
          {/* Subtle Glow Lighting Effect */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#00a8d6]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#002f3d]/50 rounded-full blur-3xl pointer-events-none" />

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
              Water SCADA &amp; Telemetry System
            </h1>
            <p className="text-xs sm:text-sm text-[#e0f3f8]/90 font-medium leading-relaxed max-w-md">
              Integrated industrial supervisory platform for real-time reservoir levels, flow distribution rates, discharge pressure, and pump motor automation.
            </p>
          </div>

          {/* Footer note inside left panel */}
          <div className="relative z-10 text-[11px] text-[#e0f3f8]/80 font-medium pt-2 border-t border-white/15 flex items-center justify-between">
            <span>PT. Ascon Multipratama</span>
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
                Sign In to SCADA
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Enter your credentials to access system telemetry
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
              {/* Field 1: Email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="flex items-center px-3.5 py-2.5 sm:py-3 rounded-xl bg-slate-100/90 border border-slate-200/70 focus-within:bg-white focus-within:border-[#00799e] focus-within:ring-2 focus-within:ring-[#00799e]/20 transition-all">
                  <Mail className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@ascon.co.id"
                    autoComplete="email"
                    className="w-full bg-transparent text-xs sm:text-[13px] font-semibold text-slate-900 outline-hidden placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="flex items-center justify-between px-3.5 py-2.5 sm:py-3 rounded-xl bg-slate-100/90 border border-slate-200/70 focus-within:bg-white focus-within:border-[#00799e] focus-within:ring-2 focus-within:ring-[#00799e]/20 transition-all">
                  <div className="flex items-center flex-1 mr-2">
                    <Lock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••••••"
                      autoComplete="current-password"
                      className="w-full bg-transparent text-xs sm:text-[13px] font-mono font-semibold text-slate-900 outline-hidden placeholder-slate-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer ml-1 shrink-0"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Teal Button (#00799e) */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-[#00799e] hover:bg-[#006887] active:bg-[#005872] active:scale-[0.985] text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-[#00799e]/25 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="size-4" />
                    <span>Sign In to SCADA</span>
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Legal Footer Note */}
          <div className="text-center mt-6 pt-2">
            <p className="text-[10px] text-slate-400 leading-normal max-w-sm mx-auto">
              Protected industrial SCADA telemetry terminal. Authorized personnel access only.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
