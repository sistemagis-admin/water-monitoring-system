import React from 'react'

interface PumpSceneSvgProps {
  stationName: string
  motors: [number, number]
  flowRate: number
}

export const PumpSceneSvg: React.FC<PumpSceneSvgProps> = ({
  stationName,
  motors,
  flowRate,
}) => {
  const isLive = flowRate > 1

  // Dynamic animation speeds based on flow rate
  const flowSpeed = `${Math.max(0.35, 1.6 - flowRate / 80).toFixed(2)}s`
  const spinSpeed = `${Math.max(0.3, 2.2 - flowRate / 40).toFixed(2)}s`

  // Render individual pump unit with centered origin at (cx, 108)
  const renderPumpUnit = (cx: number, motorIndex: 0 | 1, label: string) => {
    const isRunning = motors[motorIndex] === 1

    return (
      <g
        className={`pump-unit ${isRunning ? 'is-running' : ''}`}
        style={{ '--spd': spinSpeed } as React.CSSProperties}
      >
        {/* Motor Top Casing with vibration shake when running */}
        <g className={isRunning ? 'animate-shake-motor' : ''}>
          <rect
            className="fill-[var(--mot)]"
            x={cx - 19}
            y={22}
            width={38}
            height={52}
            rx={7}
          />
          {/* Cooling Fins */}
          {[30, 38, 46, 54].map((y, idx) => (
            <line
              key={idx}
              className="stroke-[var(--card)] opacity-45 stroke-2"
              x1={cx - 19}
              x2={cx + 19}
              y1={y + 14}
              y2={y + 14}
            />
          ))}

          {/* LED Status Beacon */}
          <circle
            className={`transition-colors ${
              isRunning ? 'fill-[var(--on)] animate-pulse-led' : 'fill-[var(--mut)]'
            }`}
            cx={cx + 11}
            cy={31}
            r={3}
          />

          {/* Motor Label (M1, M2) */}
          <text
            className="fill-white font-bold text-[11px] select-none"
            x={cx - 4}
            y={35}
            textAnchor="middle"
          >
            {label}
          </text>
        </g>

        {/* Neck connector */}
        <rect x={cx - 6} y={74} width={12} height={9} fill="var(--pipe)" />

        {/* Pump Housing & Impeller Centered around (cx, 108) */}
        <g transform={`translate(${cx}, 108)`}>
          {/* Pump Outer Casing */}
          <circle
            cx={0}
            cy={0}
            r={27}
            className="fill-[var(--cas)] stroke-[var(--pipe)] stroke-[3]"
          />

          {/* Impeller with 6 curved blades rotating strictly at local (0,0) */}
          <g
            className={isRunning ? 'animate-spin-local' : ''}
            style={{ transformOrigin: '0px 0px', transformBox: 'view-box' }}
          >
            {[0, 60, 120, 180, 240, 300].map((angle, bladeIdx) => (
              <path
                key={bladeIdx}
                className={`fill-none stroke-[3.5] stroke-linecap-round transition-colors ${
                  isRunning ? 'stroke-[var(--water)]' : 'stroke-[var(--mut)]'
                }`}
                d="M0 0Q11 -10 1 -22"
                transform={`rotate(${angle})`}
              />
            ))}
            {/* Center Hub */}
            <circle cx={0} cy={0} r={5} fill="var(--pipe)" />
          </g>
        </g>
      </g>
    )
  }

  return (
    <svg
      className="w-full h-auto block my-1.5 overflow-hidden"
      viewBox="0 0 360 150"
      role="img"
      aria-label={`Skema pompa ${stationName}`}
      style={{ '--fs': flowSpeed } as React.CSSProperties}
    >
      {/* Base Solid Pipe */}
      <line
        x1="0"
        x2="360"
        y1="108"
        y2="108"
        className="stroke-[var(--pipe)] stroke-[18]"
      />

      {/* Pipe inner highlight */}
      <line
        x1="0"
        x2="360"
        y1="108"
        y2="108"
        className="stroke-[var(--card)] stroke-[12] opacity-35"
      />

      {/* Animated Water Flow Dashes */}
      {isLive && (
        <line
          x1="-16"
          x2="360"
          y1="108"
          y2="108"
          className="stroke-[var(--water)] stroke-[5] stroke-linecap-round animate-pipe-flow"
          strokeDasharray="7 9"
        />
      )}

      {/* Pump 1 (M1) at cx = 100 */}
      {renderPumpUnit(100, 0, 'M1')}

      {/* Pump 2 (M2) at cx = 260 */}
      {renderPumpUnit(260, 1, 'M2')}
    </svg>
  )
}
