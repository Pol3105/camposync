import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertCircle, FlaskConical } from 'lucide-react'
import AgricultorLayout from './AgricultorLayout'
import { granjero } from '../../services/api'

const CULTIVO_STYLE = {
  OL: { bg: '#f0f7e8', color: '#3a6a20', border: '#b0d880' },
  CE: { bg: '#fdf6e4', color: '#8a6010', border: '#f5d878' },
  VI: { bg: '#f7f0f8', color: '#6a3078', border: '#d0a0e0' },
  FS: { bg: '#fff2ea', color: '#8a3a18', border: '#f5a878' },
  HO: { bg: '#e8f7f2', color: '#1a6a50', border: '#80d0b8' },
  PA: { bg: '#f0f4e8', color: '#4a5a28', border: '#a8be78' },
}
const DEFAULT_CULTIVO = { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' }

export default function ParcelaDetalle() {
  const { expId, parcelaId } = useParams()
  const navigate             = useNavigate()

  const [exp, setExp]           = useState(null)
  const [parcela, setParcela]   = useState(null)
  const [recintos, setRecintos] = useState([])
  const [tratamientos, setTrat] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      granjero.explotaciones(),
      granjero.parcelasPorExplotacion(expId),
      granjero.recintosPorParcela(parcelaId),
      granjero.tratamientos(),
    ])
      .then(([exps, parcs, recs, trts]) => {
        setExp((exps ?? []).find(e => String(e.id) === String(expId)) ?? null)
        setParcela((parcs ?? []).find(p => String(p.id) === String(parcelaId)) ?? null)
        setRecintos(recs ?? [])
        setTrat(trts ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [expId, parcelaId])

  // pendientes per recinto: count treatments where validado=false and recintoId matches
  const pendientesPorRecinto = useMemo(() => {
    const map = {}
    tratamientos.filter(t => !t.validado).forEach(t => {
      map[t.recintoId] = (map[t.recintoId] ?? 0) + 1
    })
    return map
  }, [tratamientos])

  const totalPendientes = recintos.reduce((a, r) => a + (pendientesPorRecinto[r.id] ?? 0), 0)

  if (!loading && !parcela) {
    return (
      <AgricultorLayout>
        <div className="flex items-center justify-center" style={{ height: '60vh' }}>
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Parcela no encontrada</p>
        </div>
      </AgricultorLayout>
    )
  }

  return (
    <AgricultorLayout>
      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(145deg, #1c3829 0%, #2e5c38 100%)', padding: '18px 18px 22px' }}>
        <button
          onClick={() => navigate(`/cuaderno/fincas/${expId}`)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 10, padding: '6px 12px', color: 'rgba(255,255,255,0.80)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14 }}
        >
          <ArrowLeft size={14} />
          {exp?.nombre ?? 'Explotación'}
        </button>

        {loading ? (
          <p style={{ fontSize: 16, fontWeight: 800, color: '#a8e890' }}>Cargando…</p>
        ) : (
          <>
            <code style={{ fontSize: 16, fontWeight: 800, color: '#a8e890', fontFamily: "'SFMono-Regular','Consolas',monospace", letterSpacing: '0.02em' }}>
              {parcela.refCatastral}
            </code>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', marginTop: 4 }}>
              📍 {parcela.municipio} · Polígono {parcela.poligono} · Parcela {parcela.parcelaSigpac}
            </p>
          </>
        )}

        {totalPendientes > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, background: 'rgba(251,191,36,0.18)', border: '1px solid rgba(251,191,36,0.40)', borderRadius: 10, padding: '5px 12px', fontSize: 12.5, color: '#fbbf24', fontWeight: 600 }}>
            <AlertCircle size={13} />
            {totalPendientes} tratamiento{totalPendientes > 1 ? 's' : ''} pendiente{totalPendientes > 1 ? 's' : ''} de validar
          </div>
        )}
      </div>

      {/* ── Recintos ── */}
      <div style={{ padding: '16px 16px 12px' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, paddingLeft: 4 }}>
          Recintos · {recintos.length}
        </h2>

        {loading ? (
          <div style={{ background: '#fff', borderRadius: 18, padding: '40px 24px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>Cargando…</p>
          </div>
        ) : recintos.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 18, padding: '40px 24px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>Esta parcela no tiene recintos registrados</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recintos.map(r => {
              const cs        = CULTIVO_STYLE[r.usoSigpac] ?? DEFAULT_CULTIVO
              const pendientes = pendientesPorRecinto[r.id] ?? 0
              return (
                <div
                  key={r.id}
                  style={{ background: '#fff', borderRadius: 16, padding: '13px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div style={{ width: 32, height: 32, borderRadius: 11, background: '#1c3829', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#a8e890' }}>{r.numeroRecinto}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Recinto {r.numeroRecinto}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{Number(r.superficie ?? 0).toFixed(4)} ha</div>
                      </div>
                    </div>

                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 11px', borderRadius: 20, background: cs.bg, color: cs.color, border: `1px solid ${cs.border}`, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {r.cultivo ?? r.usoSigpac ?? '—'}
                    </span>
                  </div>

                  {pendientes > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 11px', background: '#fef9ed', border: '1px solid #f5d878', borderRadius: 10, fontSize: 12.5, color: '#8a6010', fontWeight: 600 }}>
                      <AlertCircle size={13} color="#d4a017" />
                      {pendientes} tratamiento{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''} de validación
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 11px', background: '#edf7e8', border: '1px solid #c0e8b0', borderRadius: 10, fontSize: 12.5, color: '#267a40', fontWeight: 600 }}>
                      ✓ Cuaderno al día
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/cuaderno/fincas/${expId}/parcelas/${parcelaId}/recintos/${r.id}/tratamientos`)}
                    style={{
                      marginTop: 8, width: '100%', padding: '8px 0',
                      borderRadius: 10, border: '1.5px solid #e5e7eb',
                      background: '#f9fafb', color: '#374151',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <FlaskConical size={13} color="#6b7280" />
                    Ver tratamientos
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AgricultorLayout>
  )
}
