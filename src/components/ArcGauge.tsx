import React from 'react'

interface ArcGaugeProps {
  pressure: number
  maxPressure?: number
}

export const ArcGauge: React.FC<ArcGaugeProps> = ({
  pressure,
  maxPressure = 10,
}) => {
  const normalizedP = Math.max(0, pressure)
  const ratio = Math.min(1, normalizedP / maxPressure)
  const dashFilled = (ratio * 157).toFixed(1)
  const isWarning = normalizedP > 8

  return (
    <div className="relative w-full">
      <svg className="w-full block" viewBox="0 0 120 68">
        {/* Background Track Arc */}
        <path
          d="M10 62A50 50 0 0 1 110 62"
          fill="none"
          stroke="var(--cas)"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Dynamic Pressure Indicator Arc */}
        <path
          d="M10 62A50 50 0 0 1 110 62"
          fill="none"
          stroke={isWarning ? 'var(--warn)' : 'var(--water)'}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dashFilled} 158`}
          style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.4s ease' }}
        />
      </svg>

      {/* Centered Value */}
      <div className="absolute inset-x-0 bottom-0.5 text-center leading-none">
        <b className="font-heading font-extrabold text-[26px] sm:text-[30px] tabular-nums text-[var(--ink)]">
          {normalizedP.toFixed(2)}
        </b>
        <small className="text-[var(--mut)] ml-1 text-xs">bar</small>
      </div>
    </div>
  )
}
