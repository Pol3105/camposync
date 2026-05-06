import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Clock, FlaskConical } from 'lucide-react'
import AgricultorLayout from './AgricultorLayout'
import ModalNuevoTratamiento from '../../components/ModalNuevoTratamiento'
import { granjero } from '../../services/api'

function formatFecha(dateStr) {
  if (!dateStr) return '—'
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

export default function TratamientosRecinto() {
  const { expId, parcelaId, recintoId } = useParams()
  const navigate = useNavigate()

  const [explotacion, setExplotacion] = useState(null)
  const [parcela,     setParcela]     = useState(null)
  const [recinto,     setRecinto]     = useState(null)
  const [trat,        setTrat]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modal,       setModal]       = useState(false)

  useEffect(() => {
    Promise.all([
      granjero.explotaciones(),
      granjero.parcelasPorExplotacion(expId),
      granjero.recintosPorParcela(parcelaId),
      granjero.tratamientos(),
    ])
      .then(([exps, parcs, recs, trts]) => {
        setExplotacion((exps ?? []).find(e => String(e.id) === String(expId)) ?? null)
        setParcela((parcs ?? []).find(p => String(p.id) === String(parcelaId)) ?? null)
        setRecinto((recs ?? []).find(r => String(r.id) === String(recintoId)) ?? null)

        const filtered = (trts ?? [])
          .filter(t => String(t.recintoId) === recintoId)
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        setTrat(filtered)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [expId, parcelaId, recintoId])

  const counts = useMemo(() => ({
    total:     trat.length,
    pendiente: trat.filter(t => !t.validado).length,
    validado:  trat.filter(t =>  t.validado).length,
  }), [trat])

  const grupos = groupByMonth(trat)

  return (
    <AgricultorLayout>
      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(145deg, #1c3829 0%, #2e5c38 100%)', padding: '18px 18px 22px' }}>
        <button
          onClick={() => navigate(`/cuaderno/fincas/${expId}/parcelas/${parcelaId}`)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 10,
            padding: '6px 12px', color: 'rgba(255,255,255,0.80)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14,
          }}
        >
          <ArrowLeft size={14} />
          {parcela?.refCatastral ?? 'Parcela'}
        </button>

        {loading ? (
          <p style={{ fontSize: 16, fontWeight: 800, color: '#a8e890' }}>Cargando…</p>
        ) : (
          <>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#a8e890', marginBottom: 4 }}>
              Recinto {recinto?.numeroRecinto ?? recintoId}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)' }}>
              {explotacion?.nombre ?? ''}
              {recinto?.superficie ? ' · ' + Number(recinto.superficie).toFixed(2) + ' ha' : ''}
            </p>
          </>
        )}

        {/* KPI strip */}
        <div className="flex gap-2.5 mt-4">
          {[
            { label: 'Total',      value: counts.total,     color: 'rgba(255,255,255,0.90)' },
            { label: 'Pendientes', value: counts.pendiente, color: '#fbbf24' },
            { label: 'Validados',  value: counts.validado,  color: '#86efac' },
          ].map(k => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.10)', borderRadius: 12, padding: '8px 14px', flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: k.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {loading ? '–' : k.value}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', marginTop: 3 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Treatment list ── */}
      <div style={{ padding: '16px 16px 12px' }}>
        {loading ? (
          <div style={{ background: '#fff', borderRadius: 18, padding: '40px 24px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>Cargando…</p>
          </div>
        ) : trat.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 18, padding: '40px 24px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <FlaskConical size={36} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: '#9ca3af' }}>Sin tratamientos para este recinto</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {grupos.map(([mes, trts]) => (
              <div key={mes}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, paddingLeft: 4 }}>
                  {mes}
                </div>

                <div className="flex flex-col gap-2.5">
                  {trts.map(t => (
                    <div
                      key={t.id}
                      style={{
                        background: '#fff', borderRadius: 16, padding: '11px 13px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                        borderLeft: `3.5px solid ${t.validado ? '#4e9a5f' : '#fbbf24'}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.productoNombre ?? '—'}
                          </div>
                          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                            {t.plagaObjetivo ?? '—'}
                          </div>
                        </div>
                        <span style={{
                          flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                          background: t.validado ? '#edf7e8' : '#fef9ed',
                          color: t.validado ? '#267a40' : '#8a6010',
                          border: `1px solid ${t.validado ? '#c0e8b0' : '#f5d878'}`,
                        }}>
                          {t.validado
                            ? <><CheckCircle size={10} />&nbsp;Validado</>
                            : <><Clock size={10} />&nbsp;Pendiente</>
                          }
                        </span>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
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

      {/* ── FAB ── */}
      <button
        onClick={() => setModal(true)}
        style={{
          position: 'fixed', bottom: 80,
          right: 'max(24px, calc((100vw - 480px) / 2 + 24px))',
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)',
          border: 'none', color: '#fff', fontSize: 26, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(46,92,56,0.40)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30,
        }}
      >+</button>

      {/* ── Modal ── */}
      {modal && (
        <ModalNuevoTratamiento
          preselect={{ explotacionId: expId, parcelaId, recintoId }}
          onClose={() => setModal(false)}
          onCreado={t => { setTrat(ts => [t, ...ts]); setModal(false) }}
        />
      )}
    </AgricultorLayout>
  )
}
