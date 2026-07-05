// liquid-ui.jsx — faithful port of components/lexiverse/liquid-ui/index.tsx
// Pure presentational primitives. Visual system: blur · thin border · signature
// glow · 12–14px radius. Exported to window for the other babel scripts.

const LIQUID = {
  bg: 'rgba(10,14,24,0.62)',
  border: 'rgba(126,249,255,0.14)',
  borderHover: 'rgba(126,249,255,0.32)',
  glow: 'rgba(126,249,255,0.10)',
  text: '#ECFBFF',
  textDim: '#9FB6C6',
  textMuted: '#6F8AA0',
  radius: 14,
  radiusSmall: 10,
  blur: 'blur(18px) saturate(1.15)',
  elevation: '0 18px 50px rgba(0,0,0,0.45)',
};

function LiquidGlassPanel({ children, className, style, accent = '#7EF9FF', padding = 18 }) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        background: LIQUID.bg,
        border: `1px solid ${LIQUID.border}`,
        borderRadius: LIQUID.radius,
        backdropFilter: LIQUID.blur,
        WebkitBackdropFilter: LIQUID.blur,
        boxShadow: LIQUID.elevation,
        padding,
        color: LIQUID.text,
        overflow: 'hidden',
        ...style,
      }}
    >
      <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${accent}AA, transparent)`, pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

function LiquidGlassCard({ children, accent = '#7EF9FF', width, className, style }) {
  return (
    <div
      className={className}
      style={{
        background: LIQUID.bg,
        border: `1px solid ${LIQUID.border}`,
        borderRadius: LIQUID.radiusSmall,
        backdropFilter: 'blur(12px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(12px) saturate(1.1)',
        padding: 12,
        color: LIQUID.text,
        boxShadow: `0 8px 24px rgba(0,0,0,0.35), inset 0 0 0 1px ${accent}11`,
        width,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function LiquidIconButton({ children, onClick, label, size = 32, accent = '#7EF9FF' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: size, height: size, borderRadius: '50%',
        border: `1px solid ${LIQUID.border}`,
        background: 'rgba(255,255,255,0.04)',
        color: LIQUID.textDim, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, transition: 'all 0.18s ease',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}88`; e.currentTarget.style.color = accent; e.currentTarget.style.background = `${accent}14`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = LIQUID.border; e.currentTarget.style.color = LIQUID.textDim; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
    >
      {children}
    </button>
  );
}

function LiquidActionButton({ children, onClick, variant = 'primary', disabled, accent = '#7EF9FF', fullWidth, iconStart }) {
  const primary = variant === 'primary';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: fullWidth ? '100%' : undefined,
        padding: '12px 18px', borderRadius: 12,
        border: primary ? 'none' : `1px solid ${LIQUID.border}`,
        background: primary ? `linear-gradient(135deg, ${accent}, ${accent}CC)` : 'rgba(255,255,255,0.03)',
        color: primary ? '#04202B' : LIQUID.textDim,
        fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        boxShadow: primary ? `0 8px 26px ${accent}44` : 'none',
        transition: 'transform 0.16s ease, box-shadow 0.16s ease',
      }}
      onMouseEnter={e => {
        if (disabled) return;
        e.currentTarget.style.transform = 'translateY(-2px)';
        if (primary) e.currentTarget.style.boxShadow = `0 12px 34px ${accent}66`;
        else { e.currentTarget.style.borderColor = `${accent}66`; e.currentTarget.style.color = LIQUID.text; }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        if (primary) e.currentTarget.style.boxShadow = `0 8px 26px ${accent}44`;
        else { e.currentTarget.style.borderColor = LIQUID.border; e.currentTarget.style.color = LIQUID.textDim; }
      }}
    >
      {iconStart}
      {children}
    </button>
  );
}

function LiquidBadge({ children, color = '#7EF9FF', size = 'md' }) {
  const sm = size === 'sm';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: sm ? 10 : 11, fontWeight: 600,
      padding: sm ? '2px 7px' : '3px 9px', borderRadius: 6,
      background: `${color}1E`, color, border: `1px solid ${color}40`,
      whiteSpace: 'nowrap', lineHeight: 1.3,
    }}>
      {children}
    </span>
  );
}

Object.assign(window, { LIQUID, LiquidGlassPanel, LiquidGlassCard, LiquidIconButton, LiquidActionButton, LiquidBadge });
