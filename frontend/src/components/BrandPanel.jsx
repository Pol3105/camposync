import logoImg from '../assets/logo.jpg'

export default function BrandPanel({ headline, sub, children }) {
  return (
    <div
      className="hidden lg:flex flex-col justify-between flex-shrink-0 relative overflow-hidden"
      style={{
        width: 520,
        padding: '52px 52px 48px',
        background: 'linear-gradient(160deg,#1c3829 0%,#2e5c38 60%,#3a7a48 100%)',
      }}
    >
      {/* Decorative circles */}
      <div className="absolute rounded-full" style={{ top: -80, right: -80, width: 280, height: 280, background: 'rgba(255,255,255,0.04)' }} />
      <div className="absolute rounded-full" style={{ bottom: -60, left: -60, width: 220, height: 220, background: 'rgba(255,255,255,0.04)' }} />
      <div className="absolute rounded-full" style={{ bottom: 120, right: 40, width: 120, height: 120, background: 'rgba(110,200,80,0.06)' }} />

      {/* Logo */}
      <div className="relative flex items-center gap-3">
        <img src={logoImg} alt="Camposync" className="rounded-xl object-contain bg-white flex-shrink-0" style={{ width: 42, height: 42 }} />
        <span className="font-bold text-xl tracking-tight" style={{ color: '#e4f5d4', letterSpacing: '-0.3px' }}>Camposync</span>
      </div>

      {/* Main copy */}
      <div className="relative">
        <div className="font-bold text-white leading-snug mb-4" style={{ fontSize: 30, letterSpacing: '-0.5px', whiteSpace: 'pre-line' }}>
          {headline}
        </div>
        <p className="leading-relaxed" style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', maxWidth: 340 }}>
          {sub}
        </p>
        {children}
      </div>

      <p className="relative" style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
        © 2026 Camposync · Todos los derechos reservados
      </p>
    </div>
  )
}
