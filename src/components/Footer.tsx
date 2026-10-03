import React from 'react'
import { Activity } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="mt-6 text-[var(--mut)] text-xs flex justify-between flex-wrap gap-2 pt-3 border-t border-[var(--line)]">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[var(--on)] animate-pulse" />
        <span className="font-semibold text-[var(--ink)]">
          ASCON MULTIPRATAMA
        </span>
        <span>· Monitoring &amp; kontrol</span>
      </div>
      <div className="flex items-center gap-1.5 font-mono">
        <Activity className="w-3.5 h-3.5 text-[var(--water)]" />
        <span>Data contoh · Arduino Uno belum terhubung</span>
      </div>
    </footer>
  )
}
