import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import AgricultorLayout from './AgricultorLayout'
import { MOCK_EXPLOTACIONES, MOCK_PARCELAS } from './mock'

export default function FincaDetalle() {
  const { expId }  = useParams()
  const navigate   = useNavigate()
  const exp        = MOCK_EXPLOTACIONES.find(e => String(e.id) === expId)
  const parcelas   = MOCK_PARCELAS[Number(expId)] ?? []

  if (!exp) {
    return (
      <AgricultorLayout>
        <div className="flex items-center justify-center" style={{ height: '60vh' }}>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Explotación no encontrada</p>
        </div>
      </AgricultorLayout>
    )
  }

  return (
    <AgricultorLayout>
      {/* ── Header ── */}
      <div
        style={{
          background: 'linear-gradient(145deg, #1c3829 0%, #2e5c38 100%)',
          padding: '20px 20px 26px',
        }}
      >
        <button
          onClick={() => navigate('/cuaderno/fincas')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.12)',
            border: 'none',
            borderRadius: 10,
            padding: '6px 12px',
            color: 'rgba(255,255,255,0.80)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            marginBottom: 14,
          }}
        >
          <ArrowLeft size={14} />
          Mis Fincas
        </button>

        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', marginBottom: 2 }}>
          {exp.nombre}
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)' }}>
          📍 {exp.municipio} · {exp.superficie} ha · {parcelas.length} {parcelas.length === 1 ? 'parcela' : 'parcelas'}
        </p>
      </div>

      {/* ── Parcelas list ── */}
      <div style={{ padding: '16px 16px 12px' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, paddingLeft: 4 }}>
          Parcelas
        </h2>

        {parcelas.length === 0 ? (
          <div
            style={{
              background: '#fff',
              borderRadius: 18,
              padding: '40px 24px',
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            }}
          >
            <p style={{ fontSize: 14, color: '#9ca3af' }}>Esta finca no tiene parcelas asignadas</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {parcelas.map((p, i) => (
              <button
                key={p.id}
                onClick={() => navigate(`/cuaderno/fincas/${expId}/parcelas/${p.id}`)}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: '14px 16px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                {/* Number badge */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#f0f4ff',
                    border: '1px solid #c8d8f8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#2a4a8a' }}>{i + 1}</span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <code
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#111827',
                      fontFamily: "'SFMono-Regular','Consolas',monospace",
                      background: '#f7f8fa',
                      padding: '2px 8px',
                      borderRadius: 6,
                      border: '1px solid #e8eaee',
                    }}
                  >
                    {p.refCatastral}
                  </code>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                    {p.municipio} · Polígono {p.poligono} · Pda. {p.parcelaSigpac}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#5a3a8a',
                      background: '#f5f0ff',
                      border: '1px solid #c8b0f0',
                      borderRadius: 8,
                      padding: '3px 9px',
                    }}
                  >
                    {p.numRecintos} rec.
                  </span>
                  <ChevronRight size={14} color="#d1d5db" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AgricultorLayout>
  )
}
