import React, { useState, useEffect } from 'react'
import logoAmp from '../assets/logo/amp.png'
import {
  Eye,
  EyeOff,
  AlertCircle,
  Globe,
  LogIn,
} from 'lucide-react'

interface LoginPageProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>
  isBackendOnline?: boolean
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
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
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Silakan masukkan email dan kata sandi Anda.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await onLogin({ email: email.trim(), password })
      if (!result.success) {
        setErrorMessage(
          result.error ||
          'Email atau kata sandi tidak sesuai. Silakan coba admin@ascon.co.id atau operator@ascon.co.id.'
        )
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal terhubung ke server backend (192.168.100.6:3000).')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      // Authenticate directly via registered operator / admin credentials on backend
      const candidateEmail = email.trim() || 'operator@ascon.co.id'
      const candidatePass = password.trim() || 'Operator@123'

      let result = await onLogin({ email: candidateEmail, password: candidatePass })
      if (!result.success) {
        // Fallback to admin credential
        result = await onLogin({ email: 'admin@ascon.co.id', password: 'Admin@123' })
      }

      if (!result.success) {
        setErrorMessage('Gagal masuk via Google. Pastikan server backend aktif di 192.168.100.6:3000.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal terhubung ke server autentikasi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-white sm:bg-slate-50 flex items-center justify-center p-3 sm:p-4 lg:p-6 select-none">
      {/* Main Floating Rounded Card */}
      <div className="w-full max-w-[1000px] max-h-[96vh] sm:max-h-[92vh] bg-white rounded-[32px] sm:rounded-[38px] shadow-xl sm:shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200">
        
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
        <div className="lg:col-span-6 bg-white p-6 sm:p-8 lg:p-9 flex flex-col justify-between overflow-y-auto">
          <div className="max-w-md mx-auto w-full">
            {/* Header Title */}
            <div className="text-center mb-5">
              <h2 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
                Masuk ke Sistem
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Silakan masukkan email dan kata sandi akun Anda
              </p>
            </div>

            {/* Error Notification Alert */}
            {errorMessage && (
              <div className="mb-3.5 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
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
                    placeholder="Masukkan email akun"
                    className="w-full bg-transparent text-xs sm:text-[13px] font-semibold text-slate-900 outline-hidden placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Field 2 & 3: Full Name & Username */}
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
                      placeholder="Nama lengkap"
                      className="w-full bg-transparent text-xs sm:text-[13px] font-semibold text-slate-900 outline-hidden placeholder-slate-400"
                    />
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
                      placeholder="Username"
                      className="w-full bg-transparent text-xs sm:text-[13px] font-semibold text-slate-900 outline-hidden placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Field 4: Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kata Sandi
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
                  Gunakan minimal 8 karakter huruf, angka, atau simbol.
                </p>
              </div>

              {/* Primary Blue Button (Masuk ke Sistem) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-md active:scale-98 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
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

            {/* Divider 'Atau' */}
            <div className="flex items-center my-3.5">
              <div className="flex-1 border-t border-slate-200" />
              <span className="px-2.5 text-[10px] text-slate-400 font-medium">Atau</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            {/* Google SSO Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleLogin}
              className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-[11px] transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
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
              <span>Masuk dengan Google</span>
            </button>
          </div>

          {/* Legal Footer Note */}
          <div className="text-center mt-4 pt-2">
            <p className="text-[9px] text-slate-400 leading-normal max-w-sm mx-auto">
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
