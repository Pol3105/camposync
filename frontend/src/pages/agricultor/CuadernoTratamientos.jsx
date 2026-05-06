import { useState, useMemo } from 'react'
import { CheckCircle, Clock, FlaskConical } from 'lucide-react'
import AgricultorLayout from './AgricultorLayout'
import { MOCK_TRATAMIENTOS } from './mock'

const FILTROS = [
  { key: 'TODOS',     label: 'Todos'      },
  { key: 'PENDIENTE', label: 'Pendientes' },
  { key: 'VALIDADO',  label: 'Validados'  },
]

function formatFecha(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function groupByMonth(list) {
  const groups = {}
  list.forEach(t => {
    const key = new Date(t.fecha).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  })
  return Object.entries(groups)
}

export default function CuadernoTratamientos() {
  const [filtro, setFiltro] = useState('TODOS')

  const filtered = useMemo(() => {
    if (filtro === 'PENDIENTE') return MOCK_TRATAMIENTOS.filter(t => !t.validado)
    if (filtro === 'VALIDADO')  return MOCK_TRATAMIENTOS.filter(t =>  t.validado)
    return MOCK_TRATAMIENTOS
  }, [filtro])

  const grupos = groupByMonth(filtered)

  const counts = {
    total:     MOCK_TRATAMIENTOS.length,
    pendiente: MOCK_TRATAMIENTOS.filter(t => !t.validado).length,
    validado:  MOCK_TRATAMIENTOS.filter(t =>  t.validado).length,
  }

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
          Cuaderno de Campo
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)' }}>
          Historial de todos tus tratamientos
        </p>

        {/* Mini KPIs */}
        <div className="flex gap-2.5 mt-4">
          {[
            { label: 'Total',      value: counts.total,     color: 'rgba(255,255,255,0.90)' },
            { label: 'Pendientes', value: counts.pendiente, color: '#fbbf24' },
            { label: 'Validados',  value: counts.validado,  color: '#86efac' },
          ].map(k => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.10)', borderRadius: 12, padding: '8px 14px', flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: k.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', marginTop: 3 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter pills ── */}
      <div style={{ padding: '14px 16px 0' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            padding: 5,
            display: 'flex',
            gap: 4,
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          }}
        >
          {FILTROS.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              style={{
                flex: 1,
                padding: '7px 4px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 12.5,
                fontWeight: 700,
                transition: 'all 0.15s',
                background: filtro === f.key ? '#4e9a5f' : 'transparent',
                color: filtro === f.key ? '#fff' : '#9ca3af',
                boxShadow: filtro === f.key ? '0 2px 8px rgba(78,154,95,0.30)' : 'none',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div style={{ padding: '16px 16px 12px' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              background: '#fff',
              borderRadius: 18,
              padding: '40px 24px',
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            }}
          >
            <FlaskConical size={36} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: '#9ca3af' }}>Sin tratamientos en este filtro</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {grupos.map(([mes, tratamientos]) => (
              <div key={mes}>
                {/* Month label */}
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, paddingLeft: 4 }}>
                  {mes}
                </div>

                <div className="flex flex-col gap-2.5">
                  {tratamientos.map(t => (
                    <div
                      key={t.id}
                      style={{
                        background: '#fff',
                        borderRadius: 16,
                        padding: '11px 13px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                        borderLeft: `3.5px solid ${t.validado ? '#4e9a5f' : '#fbbf24'}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.producto}
                          </div>
                          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                            {t.plaga}
                          </div>
                        </div>
                        <span
                          style={{
                            flexShrink: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 20,
                            background: t.validado ? '#edf7e8' : '#fef9ed',
                            color: t.validado ? '#267a40' : '#8a6010',
                            border: `1px solid ${t.validado ? '#c0e8b0' : '#f5d878'}`,
                          }}
                        >
                          {t.validado
                            ? <><CheckCircle size={10} />&nbsp;Validado</>
                            : <><Clock size={10} />&nbsp;Pendiente</>
                          }
                        </span>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span style={{ fontSize: 12, color: '#6b7280' }}>
                          📍 {t.explotacion}
                        </span>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>
                          Recinto {t.recintoNum}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                          {t.dosis} {t.unidades}
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#c8ccd8', fontVariantNumeric: 'tabular-nums' }}>
                          {formatFecha(t.fecha)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AgricultorLayout>
  )
}
