import { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, FlaskConical, CheckCircle, Clock, Layers } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import { asesor } from '../services/api'

const USO_SIGPAC = {
  TA: 'Tierra Arable', VI: 'Viñedo', OV: 'Olivar', PR: 'Prado/Pradera',
  FS: 'Frutos Secos', EB: 'Erial', TBL: 'Tierra Blanca', TDU: 'Uso Diverso',
}

function EmptyState() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', gap: 20 }}>
      <div style={{ width: 108, height: 108, borderRadius: 28, background: 'linear-gradient(145deg,#f0f7ec,#e4f3db)', border: '1px solid #d0ebc0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FlaskConical size={52} color="#a0c890" />
      </div>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#1f2937', marginBottom: 8, letterSpacing: '-0.2px' }}>Sin tratamientos registrados</div>
        <div style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.65 }}>Este recinto no tiene tratamientos en su historial todavía.</div>
      </div>
    </div>
  )
}

export default function RecintoTratamientosPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const recintoNumero     = location.state?.recintoNumero      ?? null
  const recintoCultivo    = location.state?.recintoCultivo     ?? null
  const recintoUso        = location.state?.recintoUso         ?? null
  const recintoSuperficie = location.state?.recintoSuperficie  ?? null
  const parcelaId         = location.state?.parcelaId          ?? null
  const parcelaRefCatastral = location.state?.parcelaRefCatastral ?? null
  const explotacionId     = location.state?.explotacionId      ?? null
  const explotacionNombre = location.state?.explotacionNombre  ?? null
  const granjeroNombre    = location.state?.granjeroNombre     ?? null
  const granjeroId        = location.state?.granjeroId         ?? null

  const [tratamientos, setTratamientos] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTratamientos = useCallback(async () => {
    setLoading(true)
    try {
      const data = await asesor.tratamientosPorRecinto(id)
      setTratamientos(data ?? [])
    } catch { /* handled globally */ }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchTratamientos() }, [fetchTratamientos])

  const volverPath  = parcelaId ? `/parcelas/${parcelaId}/recintos` : '/explotaciones'
  const volverState = parcelaId
    ? { refCatastral: parcelaRefCatastral, municipio: null, explotacionId, explotacionNombre, granjeroNombre, granjeroId }
    : undefined

  const titulo = recintoNumero != null
    ? `Tratamientos — Recinto ${recintoNumero}`
    : `Tratamientos del Recinto #${id}`

  const validados  = tratamientos.filter(t => t.validado).length
  const pendientes = tratamientos.filter(t => !t.validado).length
  const rp = '12px 20px'

  return (
    <AppLayout title="Tratamientos" searchPlaceholder="Buscar tratamiento…">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, height: '100%' }}>

        {/* Page header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <button
              onClick={() => navigate(volverPath, { state: volverState })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 10, color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <ArrowLeft size={14} color="#6b7280" />
              Volver a Recintos
            </button>
          </div>

          {/* Breadcrumb */}
          {(granjeroNombre || explotacionNombre || parcelaRefCatastral) && (
            <div style={{ fontSize: 12.5, color: '#9ca3af', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {granjeroNombre    && <><span style={{ fontWeight: 600, color: '#6b7280' }}>{granjeroNombre}</span><span>›</span></>}
              {explotacionNombre && <><span style={{ fontWeight: 600, color: '#6b7280' }}>{explotacionNombre}</span><span>›</span></>}
              {parcelaRefCatastral && (
                <><span style={{ fontFamily: "'SFMono-Regular','Consolas',monospace", fontSize: 11.5 }}>{parcelaRefCatastral}</span><span>›</span></>
              )}
              {recintoNumero != null && (
                <span style={{ fontWeight: 600, color: '#6b7280', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Layers size={11} />
                  Recinto {recintoNumero}
                </span>
              )}
            </div>
          )}

          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px' }}>{titulo}</div>

          {/* Recinto context pill */}
          {(recintoCultivo || recintoUso || recintoSuperficie) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
              {recintoUso && (
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#3a5aaa', background: '#f0f4ff', padding: '3px 10px', borderRadius: 20, border: '1px solid #b8c8f0' }}>
                  {USO_SIGPAC[recintoUso] ?? recintoUso}
                </span>
              )}
              {recintoCultivo && (
                <span style={{ fontSize: 12, color: '#6b7280', background: '#f3f4f6', padding: '3px 10px', borderRadius: 20, border: '1px solid #e5e7eb', fontFamily: 'monospace' }}>
                  {recintoCultivo}
                </span>
              )}
              {recintoSuperficie && (
                <span style={{ fontSize: 12.5, color: '#9ca3af' }}>
                  {parseFloat(recintoSuperficie).toFixed(2)} ha
                </span>
              )}
            </div>
          )}
        </div>

        {/* KPI strip */}
        {!loading && tratamientos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            {[
              { label: 'Total tratamientos', value: tratamientos.length, iconBg: '#f0f4ff', icon: <FlaskConical size={20} color="#3a5aaa" /> },
              { label: 'Validados', value: validados, iconBg: '#edf7e8', icon: <CheckCircle size={20} color="#267a40" /> },
              { label: 'Pendientes de validar', value: pendientes, iconBg: '#fdf6e4', icon: <Clock size={20} color="#8a6010" /> },
            ].map((kpi, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: kpi.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {kpi.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{kpi.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table card */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #eceef5', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Historial de Tratamientos</span>
            {!loading && tratamientos.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>{tratamientos.length} {tratamientos.length === 1 ? 'tratamiento' : 'tratamientos'}</span>
            )}
          </div>

          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
              Cargando tratamientos…
            </div>
          ) : tratamientos.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f7f8fc' }}>
                    {['Fecha', 'Producto', 'Plaga / Motivo', 'Dosis', 'Superficie', 'Estado'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', borderBottom: '1px solid #eceef5', fontSize: 11.5, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tratamientos.map((t, i) => {
                    const displayName = t.aliasAgric || t.productoNombre
                    const validado = t.validado
                    const estadoBadge = validado
                      ? { bg: '#edf7e8', color: '#267a40', border: '#c0e8b0', label: 'Validado' }
                      : { bg: '#fdf6e4', color: '#8a6010', border: '#f5d878', label: 'Pendiente' }
                    const motivoLabel = { PR: 'Preventivo', CU: 'Curativo', ED: 'Erradicación' }[t.motivoTratamiento] ?? t.motivoTratamiento

                    return (
                      <tr key={t.id} style={{ background: i % 2 === 1 ? '#fafbfe' : 'transparent' }}>

                        {/* Fecha */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>
                            {t.fecha
                              ? new Date(t.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '—'}
                          </div>
                        </td>

                        {/* Producto */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5', maxWidth: 220 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{displayName}</div>
                          {t.aliasAgric && (
                            <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>{t.productoNombre}</div>
                          )}
                          {t.productoPrincipioActivo && (
                            <div style={{ fontSize: 11, color: '#b0b8c8', marginTop: 1 }}>{t.productoPrincipioActivo}</div>
                          )}
                        </td>

                        {/* Plaga / Motivo */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <div style={{ fontSize: 13, color: '#374151' }}>{t.plagaObjetivo ?? t.codigoPlaga ?? '—'}</div>
                          {motivoLabel && (
                            <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>{motivoLabel}</div>
                          )}
                        </td>

                        {/* Dosis */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5', whiteSpace: 'nowrap' }}>
                          {t.dosis ? (
                            <>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{t.dosis}</span>
                              <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>{t.unidades ?? ''}</span>
                            </>
                          ) : <span style={{ color: '#c8ccd8', fontSize: 13 }}>—</span>}
                        </td>

                        {/* Superficie tratada */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5', whiteSpace: 'nowrap' }}>
                          {t.superficieTratada ? (
                            <>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{t.superficieTratada}</span>
                              <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>ha</span>
                            </>
                          ) : <span style={{ color: '#c8ccd8', fontSize: 13 }}>—</span>}
                        </td>

                        {/* Estado */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 12, background: estadoBadge.bg, color: estadoBadge.color, border: `1px solid ${estadoBadge.border}`, fontSize: 12, fontWeight: 600, width: 'fit-content' }}>
                              {validado ? <CheckCircle size={11} /> : <Clock size={11} />}
                              {estadoBadge.label}
                            </span>
                            {t.observacionesValidador && (
                              <span style={{ fontSize: 11.5, color: '#6b7280', fontStyle: 'italic', maxWidth: 180 }} title={t.observacionesValidador}>
                                {t.observacionesValidador.length > 40
                                  ? t.observacionesValidador.slice(0, 40) + '…'
                                  : t.observacionesValidador}
                              </span>
                            )}
                          </div>
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
  )
}
