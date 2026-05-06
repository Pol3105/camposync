import { useNavigate } from 'react-router-dom'
import { ChevronRight, Map } from 'lucide-react'
import AgricultorLayout from './AgricultorLayout'
import { MOCK_EXPLOTACIONES } from './mock'

const ORIENT = {
  OL: { bg: '#f0f7e8', color: '#3a6a20', border: '#b0d880', label: 'Olivar',        emoji: '🫒' },
  CE: { bg: '#fdf6e4', color: '#8a6010', border: '#f5d878', label: 'Cereal',        emoji: '🌾' },
  VI: { bg: '#f7f0f8', color: '#6a3078', border: '#d0a0e0', label: 'Viñedo',        emoji: '🍇' },
  FS: { bg: '#fff2ea', color: '#8a3a18', border: '#f5a878', label: 'Frutos Secos',  emoji: '🌰' },
  HO: { bg: '#e8f7f2', color: '#1a6a50', border: '#80d0b8', label: 'Hortícola',     emoji: '🥬' },
  PA: { bg: '#f0f4e8', color: '#4a5a28', border: '#a8be78', label: 'Pastizal',      emoji: '🌿' },
  OT: { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb', label: 'Otros',         emoji: '🌱' },
}

export default function FincasAgricultor() {
  const navigate = useNavigate()
  const totalHa  = MOCK_EXPLOTACIONES.reduce((a, e) => a + e.superficie, 0).toFixed(1)

  return (
    <AgricultorLayout>
      {/* ── Header ── */}
      <div
        style={{
          background: 'linear-gradient(145deg, #1c3829 0%, #2e5c38 100%)',
          padding: '20px 18px 22px',
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', marginBottom: 2 }}>
          Mis Explotaciones
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)' }}>
          {MOCK_EXPLOTACIONES.length} explotaciones · {totalHa} ha totales
        </p>
      </div>

      {/* ── List ── */}
      <div style={{ padding: '16px 16px 12px' }}>
        {MOCK_EXPLOTACIONES.length === 0 ? (
          <div
            style={{
              background: '#fff',
              borderRadius: 18,
              padding: '48px 24px',
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            }}
          >
            <Map size={40} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: '#9ca3af' }}>Sin fincas asignadas</p>
            <p style={{ fontSize: 12.5, color: '#c8ccd8', marginTop: 4 }}>Tu asesor aún no ha vinculado ninguna explotación</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {MOCK_EXPLOTACIONES.map(exp => {
              const oc = ORIENT[exp.orientacion] ?? ORIENT.OT
              return (
                <button
                  key={exp.id}
                  onClick={() => navigate(`/cuaderno/fincas/${exp.id}`)}
                  style={{
                    background: '#fff',
                    borderRadius: 20,
                    padding: '14px 14px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  {/* Top row */}
                  <div className="flex items-center gap-3">
                    {/* Emoji avatar */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: `linear-gradient(145deg, ${oc.bg}, ${oc.bg})`,
                        border: `1.5px solid ${oc.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        flexShrink: 0,
                      }}
                    >
                      {oc.emoji}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>
                        {exp.nombre}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 3 }}>
                        📍 {exp.municipio}
                      </div>
                    </div>

                    <ChevronRight size={18} color="#d1d5db" />
                  </div>

                  {/* Stats strip */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      borderTop: '1px solid #f3f4f6',
                      paddingTop: 12,
                    }}
                  >
                    {/* Orientación chip */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 10px',
                        borderRadius: 20,
                        background: oc.bg,
                        color: oc.color,
                        border: `1px solid ${oc.border}`,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {oc.label}
                    </span>

                    <div style={{ flex: 1 }} />

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
                        {exp.superficie}
                      </span>
                      <span style={{ fontSize: 11.5, color: '#9ca3af', marginLeft: 3 }}>ha</span>
                    </div>

                    <div
                      style={{
                        background: '#f0f4ff',
                        borderRadius: 10,
                        padding: '4px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#2a4a8a', fontVariantNumeric: 'tabular-nums' }}>
                        {exp.numParcelas}
                      </span>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>
                        {exp.numParcelas === 1 ? 'parcela' : 'parcelas'}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </AgricultorLayout>
  )
}
