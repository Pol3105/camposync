import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Map, FlaskConical, CheckCircle2, X } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import { asesor } from '../services/api'

/* ── design tokens ── */
const S = {
  pageBg:    '#f0f2f7',
  card:      { bg: '#ffffff', radius: 16, shadow: '0 2px 12px rgba(0,0,0,0.07)' },
  cardAlert: { bg: '#fff8f2', shadow: '0 2px 12px rgba(220,100,20,0.10)' },
  kpi:       { normal: '#4e9a5f', alert: '#e07830' },
  table:     { header: '#f7f8fc', rowAlt: '#fafbfe', border: '#eceef5' },
  chip:      {
    pendiente: { bg: '#fff3e6', color: '#c25c10', border: '#fdd8b4' },
    validado:  { bg: '#edf7e8', color: '#267a40', border: '#c0e8b0' },
  },
  cta: { bg: '#e07830', radius: 10, shadow: '0 2px 8px rgba(220,100,20,0.30)' },
}

/* ── Validation modal ── */
function ValidarModal({ tratamiento, onClose, onConfirm, saving }) {
  const [obs, setObs] = useState('')
  if (!tratamiento) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.40)' }}
      onClick={onClose}
    >
      <div
        className="flex flex-col"
        style={{ width: 480, background: '#fff', borderRadius: 20, padding: '32px 36px', boxShadow: '0 16px 60px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold" style={{ fontSize: 18, color: '#111827', letterSpacing: '-0.3px' }}>Revisar Tratamiento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={20} /></button>
        </div>

        <div className="flex flex-col gap-2.5 mb-6 rounded-xl p-4" style={{ background: S.table.header, border: `1px solid ${S.table.border}` }}>
          <InfoRow label="Fecha"    value={tratamiento.fecha} />
          <InfoRow label="Granjero" value={tratamiento.granjeroUsername ?? '—'} />
          <InfoRow label="Parcela"  value={`${tratamiento.parcelaRefCatastral} · ${tratamiento.parcelaMunicipio}`} />
          <InfoRow label="Producto" value={tratamiento.productoNombre} />
          <InfoRow label="Dosis"    value={`${tratamiento.dosis} ${tratamiento.unidades}`} />
          {tratamiento.plagaObjetivo && <InfoRow label="Plaga" value={tratamiento.plagaObjetivo} />}
        </div>

        <div className="mb-5">
          <label className="block mb-1.5 font-medium" style={{ fontSize: 12.5, color: '#374151' }}>Observaciones del validador (opcional)</label>
          <textarea
            value={obs}
            onChange={e => setObs(e.target.value)}
            placeholder="Ej. Dosis y producto correctos para el cultivo…"
            rows={3}
            className="w-full resize-none focus:outline-none focus:border-[#4e9a5f] transition"
            style={{ border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '10px 14px', fontSize: 13.5, background: '#f9fafb', color: '#111827', fontFamily: 'inherit' }}
          />
        </div>

        <div className="flex gap-3 mt-1">
          <button
            onClick={onClose}
            className="flex-1 font-medium transition hover:bg-gray-50"
            style={{ height: 44, border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 14, color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit', background: '#fff' }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(tratamiento.id, obs)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
            style={{ height: 44, background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 12, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(46,92,56,0.30)' }}
          >
            <CheckCircle2 size={16} />
            {saving ? 'Validando…' : 'Confirmar validación'}
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-baseline">
      <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, minWidth: 90 }}>{label}</span>
      <span style={{ fontSize: 13.5, color: '#111827', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

/* ── Main component ── */
export default function DashboardPage() {
  const [granjeros, setGranjeros]         = useState([])
  const [explotaciones, setExplotaciones] = useState([])
  const [tratamientos, setTratamientos]   = useState([])
  const [loading, setLoading]             = useState(true)
  const [modalTrat, setModalTrat]         = useState(null)
  const [saving, setSaving]               = useState(false)

  const navigate = useNavigate()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [g, e, t] = await Promise.all([
        asesor.granjeros(),
        asesor.explotaciones(),
        asesor.tratamientos(),
      ])
      setGranjeros(g ?? [])
      setExplotaciones(e ?? [])
      setTratamientos(t ?? [])
    } catch { /* handled globally */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleValidar(id, observaciones) {
    setSaving(true)
    try {
      const updated = await asesor.validarTratamiento(id, true, observaciones)
      setTratamientos(prev => prev.map(t => t.id === id ? updated : t))
      setModalTrat(null)
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const pendientes = tratamientos.filter(t => !t.validado)

  const kpis = [
    { label: 'Agricultores Vinculados',    value: granjeros.length,     sub: 'vinculados a tu asesoría', accent: S.kpi.normal, isAlert: false, Icon: Users        },
    { label: 'Explotaciones Activas',   value: explotaciones.length, sub: 'registradas',               accent: S.kpi.normal, isAlert: false, Icon: Map          },
    { label: 'Tratamientos Pendientes', value: pendientes.length,    sub: 'Requieren validación',      accent: S.kpi.alert,  isAlert: true,  Icon: FlaskConical },
  ]

  const cardBase = { background: S.card.bg, borderRadius: S.card.radius, boxShadow: S.card.shadow, border: '1px solid transparent' }

  return (
    <>
      <AppLayout greeting>
        <div className="flex flex-col gap-5 h-full">

          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-4">
            {kpis.map(({ label, value, sub, accent, isAlert, Icon }) => (
              <div key={label} style={{ ...cardBase, ...(isAlert ? { background: S.cardAlert.bg, boxShadow: S.cardAlert.shadow } : {}), display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 4, background: accent, borderRadius: `${S.card.radius}px ${S.card.radius}px 0 0` }} />
                <div style={{ padding: '18px 20px 20px' }}>
                  <div className="flex justify-between items-start mb-3.5">
                    <span className="uppercase" style={{ fontSize: 12.5, fontWeight: 500, color: '#6b7280', letterSpacing: '0.04em' }}>{label}</span>
                    <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 8, background: isAlert ? '#fff0e4' : '#edf7e8' }}>
                      <Icon size={20} color={accent} />
                    </div>
                  </div>
                  <div className="font-bold" style={{ fontSize: 40, color: isAlert ? accent : '#111827', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {loading ? '—' : value}
                  </div>
                  <div className="mt-2" style={{ fontSize: 12.5, color: isAlert ? '#c06010' : '#9ca3af' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Treatments table */}
          <div style={{ ...cardBase, flex: 1, minHeight: 0 }}>
            <div className="flex justify-between items-center" style={{ padding: '16px 22px', borderBottom: `1px solid ${S.table.border}` }}>
              <div className="flex items-baseline gap-2.5">
                <span className="font-bold" style={{ fontSize: 15, color: '#111827' }}>Últimos Tratamientos Registrados</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>Últimos 7 días</span>
              </div>
              <button className="flex items-center gap-1 transition hover:text-gray-800" style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${S.table.border}`, borderRadius: 10, fontSize: 12.5, fontWeight: 500, color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}>
                Ver todos
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center" style={{ height: 200, color: '#9ca3af', fontSize: 14 }}>Cargando tratamientos…</div>
            ) : tratamientos.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2" style={{ height: 200, color: '#9ca3af' }}>
                <FlaskConical size={32} color="#d1d5db" />
                <p style={{ fontSize: 14 }}>No hay tratamientos registrados aún</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: S.table.header }}>
                      {['Fecha', 'Agricultor', 'Parcela', 'Producto', 'Dosis', 'Estado', 'Acción'].map(h => (
                        <th key={h} className="text-left uppercase whitespace-nowrap" style={{ padding: '10px 18px', borderBottom: `1px solid ${S.table.border}`, fontSize: 11.5, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tratamientos.map((t, i) => {
                      const isPending = !t.validado
                      const chip = isPending ? S.chip.pendiente : S.chip.validado
                      return (
                        <tr key={t.id} style={{ background: i % 2 === 1 ? S.table.rowAlt : 'transparent' }}>
                          <td style={{ padding: '11px 18px', borderBottom: `1px solid ${S.table.border}`, fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{t.fecha}</td>
                          <td style={{ padding: '11px 18px', borderBottom: `1px solid ${S.table.border}`, fontSize: 13.5, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>{t.granjeroUsername ?? '—'}</td>
                          <td style={{ padding: '11px 18px', borderBottom: `1px solid ${S.table.border}`, fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{t.parcelaRefCatastral}</td>
                          <td style={{ padding: '11px 18px', borderBottom: `1px solid ${S.table.border}`, fontSize: 13, color: '#374151' }}>{t.productoNombre}</td>
                          <td style={{ padding: '11px 18px', borderBottom: `1px solid ${S.table.border}`, fontSize: 13, color: '#374151', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{t.dosis} {t.unidades}</td>
                          <td style={{ padding: '11px 18px', borderBottom: `1px solid ${S.table.border}` }}>
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap" style={{ padding: '3px 10px', borderRadius: 20, background: chip.bg, color: chip.color, border: `1px solid ${chip.border}`, fontSize: 12, fontWeight: 600 }}>
                              {!isPending && <CheckCircle2 size={11} />}
                              {isPending ? 'Pendiente' : 'Validado'}
                            </span>
                          </td>
                          <td style={{ padding: '11px 18px', borderBottom: `1px solid ${S.table.border}` }}>
                            {isPending ? (
                              <button
                                onClick={() => navigate(`/tratamientos/${t.id}/revision`, { state: { tratamiento: t } })}
                                className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold text-white transition active:scale-95"
                                style={{ padding: '7px 14px', background: S.cta.bg, border: 'none', borderRadius: S.cta.radius, boxShadow: S.cta.shadow, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.1px' }}
                              >
                                <CheckCircle2 size={13} color="#fff" />
                                Revisar y Validar
                              </button>
                            ) : (
                              <span style={{ fontSize: 13, color: '#c8ccd8' }}>—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppLayout>

      <ValidarModal
        tratamiento={modalTrat}
        onClose={() => setModalTrat(null)}
        onConfirm={handleValidar}
        saving={saving}
      />
    </>
  )
}
