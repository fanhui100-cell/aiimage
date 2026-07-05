'use client'

interface LuminousControlsPanelProps {
  pointSize: number
  tailAlpha: number
  tint: string
  onPointSizeChange: (value: number) => void
  onTailAlphaChange: (value: number) => void
  onTintChange: (value: string) => void
  onReplay: () => void
}

const SWATCHES = [
  { label: 'Silver white', labelZh: '银白', value: '#ffffff', display: '#cfe2ee' },
  { label: 'Cyan', labelZh: '赛博青', value: '#5fd8f0', display: '#5fd8f0' },
  { label: 'Life green', labelZh: '生命绿', value: '#7dffb0', display: '#7dffb0' },
  { label: 'Soft violet', labelZh: '幽紫', value: '#c79bff', display: '#c79bff' },
]

export function LuminousControlsPanel({
  pointSize,
  tailAlpha,
  tint,
  onPointSizeChange,
  onTailAlphaChange,
  onTintChange,
  onReplay,
}: LuminousControlsPanelProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: '12px',
        transform: 'translateX(-50%)',
        width: 'min(900px, calc(100vw - 32px))',
        padding: '9px 12px',
        background: 'rgba(8, 12, 18, 0.58)',
        border: '1px solid rgba(150, 190, 210, 0.22)',
        borderRadius: '8px',
        backdropFilter: 'blur(6px)',
        color: '#cfe3ee',
        fontSize: '10px',
        letterSpacing: '0.08em',
        userSelect: 'none',
        zIndex: 12,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'nowrap',
        overflowX: 'auto',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.16em',
          color: '#eaf6ff',
          opacity: 0.95,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        PARTICLE CONTROLS
      </h2>

      <ControlRow label="粒子大小" value={pointSize.toFixed(1)} width={142}>
        <input
          type="range"
          min="0.5"
          max="6"
          step="0.1"
          value={pointSize}
          onChange={e => onPointSizeChange(Number(e.target.value))}
          style={rangeStyle}
        />
      </ControlRow>

      <ControlRow label="拖尾亮度" value={tailAlpha.toFixed(2)} width={142}>
        <input
          type="range"
          min="0"
          max="0.6"
          step="0.01"
          value={tailAlpha}
          onChange={e => onTailAlphaChange(Number(e.target.value))}
          style={rangeStyle}
        />
      </ControlRow>

      <div style={{ flexShrink: 0 }}>
        <div style={{ marginBottom: '7px', opacity: 0.9 }}>颜色预设</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {SWATCHES.map(swatch => {
            const active = tint.toLowerCase() === swatch.value
            return (
              <button
                key={swatch.value}
                onClick={() => onTintChange(swatch.value)}
                title={`${swatch.label} / ${swatch.labelZh}`}
                aria-label={`${swatch.label} / ${swatch.labelZh}`}
                style={{
                  width: '34px',
                  height: '18px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: swatch.display,
                  border: active ? '1px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                  boxShadow: active ? '0 0 12px rgba(255,255,255,0.6)' : 'none',
                }}
              />
            )
          })}
        </div>
      </div>

      <ControlRow label="自定义颜色" width={70}>
        <input
          type="color"
          value={tint}
          onChange={e => onTintChange(e.target.value)}
          style={{
              width: '62px',
              height: '22px',
            border: '1px solid rgba(150,190,210,0.3)',
            borderRadius: '5px',
            background: 'transparent',
            cursor: 'pointer',
          }}
        />
      </ControlRow>

      <button
        onClick={onReplay}
        style={{
          minWidth: '92px',
          padding: '7px 12px',
          borderRadius: '6px',
          border: '1px solid rgba(127, 249, 255, 0.35)',
          background: 'rgba(127, 249, 255, 0.08)',
          color: '#9fe4f5',
          cursor: 'pointer',
          fontSize: '10px',
          letterSpacing: '0.1em',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        重新生长
      </button>
    </div>
  )
}

function ControlRow({
  label,
  value,
  children,
  width,
}: {
  label: string
  value?: string
  children: React.ReactNode
  width?: number
}) {
  return (
    <div style={{ width, flexShrink: 0 }}>
      <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', opacity: 0.9 }}>
        <span>{label}</span>
        {value && <span style={{ color: '#9fe4f5', fontWeight: 700 }}>{value}</span>}
      </label>
      {children}
    </div>
  )
}

const rangeStyle: React.CSSProperties = {
  width: '100%',
  height: '2px',
  accentColor: '#9fe4f5',
  cursor: 'pointer',
}
