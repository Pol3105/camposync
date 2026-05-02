import { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Layers, FlaskConical, Info, X } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import { asesor } from '../services/api'

const USO_SIGPAC = {
  TA: 'Tierra Arable', VI: 'Viñedo', OV: 'Olivar', PR: 'Prado/Pradera',
  PA: 'Pasto Arbolado', FS: 'Frutos Secos', EB: 'Erial/Baldío',
  TBL: 'Tierra Blanca Secano', TDU: 'Tierra Uso Diverso',
  GI: 'Girasol', CE: 'Cereal', AV: 'Avena', IS: 'Improductivo',
}
const SISTEMA_CULTIVO = { SE: 'Secano', RG: 'Regadío', ER: 'Estacional' }

const USO_CHIP = {
  VI:  { bg: '#f7f0f8', color: '#6a3078', border: '#d0a0e0' },
  OV:  { bg: '#f0f7e8', color: '#3a6a20', border: '#b0d880' },
  TA:  { bg: '#fdf6e4', color: '#8a6010', border: '#f5d878' },
  FS:  { bg: '#fff2ea', color: '#8a3a18', border: '#f5a878' },
  PR:  { bg: '#f0f4e8', color: '#4a5a28', border: '#a8be78' },
  PA:  { bg: '#f0f4e8', color: '#4a5a28', border: '#a8be78' },
  TBL: { bg: '#fdf6e4', color: '#8a6010', border: '#f5d878' },
  TDU: { bg: '#fdf6e4', color: '#8a6010', border: '#f5d878' },
}
const DEFAULT_CHIP = { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' }

function RecintoInfoModal({ recinto, onClose }) {
  const rows = [
    ['Número de Recinto', `Recinto ${recinto.numeroRecinto}`],
    ['Superficie',        `${parseFloat(recinto.superficie ?? 0).toFixed(4)} ha`],
    ['Uso SIGPAC',        `${USO_SIGPAC[recinto.usoSigpac] ?? recinto.usoSigpac ?? '—'} (${recinto.usoSigpac ?? '—'})`],
    ['Sistema de Cultivo', `${SISTEMA_CULTIVO[recinto.sistemaCultivo] ?? recinto.sistemaCultivo ?? '—'}`],
    ['Código Cultivo',    recinto.cultivo ?? '—'],
    ['Parcela (ID)',       recinto.parcelaId ?? '—'],
  ]
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
               display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 18, padding: 28, width: '100%', maxWidth: 420,
                 boxShadow: '0 24px 64px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', gap: 18 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Ficha Recinto SIGPAC</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Recinto {recinto.numeroRecinto}</div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', border: 'none',
                     display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={16} color="#6b7280" />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 10, border: '1px solid #eceef5', overflow: 'hidden' }}>
          {rows.map(([label, value], i) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                      padding: '10px 16px', background: i % 2 === 1 ? '#f9fafb' : '#fff',
                                      borderBottom: i < rows.length - 1 ? '1px solid #eceef5' : 'none' }}>
              <span style={{ fontSize: 12.5, color: '#6b7280', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{ padding: '9px 20px', background: '#f3f4f6', border: '1px solid #e5e7eb',
                   borderRadius: 10, color: '#374151', fontSize: 13.5, fontWeight: 600,
                   cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-end' }}
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', gap: 20 }}>
      <div style={{ width: 108, height: 108, borderRadius: 28, background: 'linear-gradient(145deg,#f0f7ec,#e4f3db)', border: '1px solid #d0ebc0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Layers size={52} color="#a0c890" />
      </div>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#1f2937', marginBottom: 8, letterSpacing: '-0.2px' }}>Sin recintos registrados</div>
        <div style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.65 }}>Esta parcela aún no tiene recintos SIGPAC vinculados.</div>
      </div>
    </div>
  )
}

export default function ParcelaRecintosPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const refCatastral   = location.state?.refCatastral     ?? `Parcela #${id}`
  const municipio      = location.state?.municipio         ?? null
  const explotacionId  = location.state?.explotacionId    ?? null
  const explotacionNombre = location.state?.explotacionNombre ?? null
  const granjeroNombre = location.state?.granjeroNombre   ?? null
  const granjeroId     = location.state?.granjeroId       ?? null

  const [recintos, setRecintos] = useState([])
  const [loading, setLoading] = useState(true)
  const [recintoInfo, setRecintoInfo] = useState(null)

  const fetchRecintos = useCallback(async () => {
    setLoading(true)
    try {
      const data = await asesor.recintosPorParcela(id)
      setRecintos(data ?? [])
    } catch { /* handled globally */ }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchRecintos() }, [fetchRecintos])

  const totalHa = recintos.reduce((a, r) => a + (parseFloat(r.superficie) || 0), 0).toFixed(2)
  const rp = '11px 20px'

  const volverPath  = explotacionId ? `/explotaciones/${explotacionId}/parcelas` : '/explotaciones'
  const volverState = explotacionId
    ? { nombre: explotacionNombre, granjeroNombre, granjeroId }
    : undefined

  return (
    <AppLayout title="Recintos" searchPlaceholder="Buscar recinto…">
      {recintoInfo && <RecintoInfoModal recinto={recintoInfo} onClose={() => setRecintoInfo(null)} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, height: '100%' }}>

        {/* Page header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <button
              onClick={() => navigate(volverPath, { state: volverState })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 10, color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <ArrowLeft size={14} color="#6b7280" />
              Volver a Parcelas
            </button>
          </div>

          {/* Breadcrumb */}
          {(granjeroNombre || explotacionNombre) && (
            <div style={{ fontSize: 12.5, color: '#9ca3af', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              {granjeroNombre && <span style={{ fontWeight: 600, color: '#6b7280' }}>{granjeroNombre}</span>}
              {granjeroNombre && <span>›</span>}
              {explotacionNombre && <span style={{ fontWeight: 600, color: '#6b7280' }}>{explotacionNombre}</span>}
              <span>›</span>
              <span style={{ fontFamily: "'SFMono-Regular','Consolas',monospace", fontSize: 11.5 }}>{refCatastral}</span>
            </div>
          )}

          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px' }}>
            Recintos de{' '}
            <code style={{ fontSize: 18, background: '#f3f4f6', padding: '2px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontFamily: "'SFMono-Regular','Consolas',monospace" }}>
              {refCatastral}
            </code>
          </div>
          {!loading && (
            <div style={{ fontSize: 13.5, color: '#9ca3af', marginTop: 5 }}>
              {recintos.length} {recintos.length === 1 ? 'recinto' : 'recintos'}
              {municipio && ` · ${municipio}`}
              {' · '}{totalHa} ha totales
            </div>
          )}
        </div>

        {/* Table card */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #eceef5', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Recintos SIGPAC</span>
            {!loading && recintos.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>{recintos.length} registrados</span>
            )}
          </div>

          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
              Cargando recintos…
            </div>
          ) : recintos.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f7f8fc' }}>
                    {['Recinto', 'Superficie', 'Uso SIGPAC', 'Sistema Cultivo', 'Cultivo', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', borderBottom: '1px solid #eceef5', fontSize: 11.5, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recintos.map((r, i) => {
                    const chip = USO_CHIP[r.usoSigpac] ?? DEFAULT_CHIP
                    const usoLabel = USO_SIGPAC[r.usoSigpac] ?? r.usoSigpac ?? '—'
                    const sistLabel = SISTEMA_CULTIVO[r.sistemaCultivo] ?? r.sistemaCultivo ?? '—'
                    return (
                      <tr key={r.id} style={{ background: i % 2 === 1 ? '#fafbfe' : 'transparent' }}>

                        {/* Recinto # */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(145deg,#e8f0ff,#d0e0f8)', border: '1px solid #b8d0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Layers size={15} color="#3a5aaa" />
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Recinto {r.numeroRecinto}</div>
                          </div>
                        </td>

                        {/* Superficie */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
                            {parseFloat(r.superficie ?? 0).toFixed(2)}
                          </span>
                          <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>ha</span>
                        </td>

                        {/* Uso SIGPAC */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, background: chip.bg, color: chip.color, border: `1px solid ${chip.border}`, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {r.usoSigpac && <span style={{ fontFamily: 'monospace', marginRight: 4, opacity: 0.7 }}>{r.usoSigpac}</span>}
                            {usoLabel}
                          </span>
                        </td>

                        {/* Sistema Cultivo */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <span style={{ fontSize: 13, color: '#374151' }}>{sistLabel}</span>
                        </td>

                        {/* Cultivo */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <code style={{ fontSize: 12, color: '#4a5568', background: '#f7f8fa', padding: '3px 8px', borderRadius: 6, border: '1px solid #e8eaee', fontFamily: "'SFMono-Regular','Consolas',monospace" }}>
                            {r.cultivo ?? '—'}
                          </code>
                        </td>

                        {/* Acciones */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              onClick={() => setRecintoInfo(r)}
                              title="Ver detalles del recinto"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 10, color: '#6b7280', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                            >
                              <Info size={14} color="#6b7280" />
                              Detalles
                            </button>
                            <button
                              onClick={() => navigate(`/recintos/${r.id}/tratamientos`, {
                                state: {
                                  recintoNumero: r.numeroRecinto,
                                  recintoCultivo: r.cultivo,
                                  recintoUso: r.usoSigpac,
                                  recintoSuperficie: r.superficie,
                                  parcelaId: id,
                                  parcelaRefCatastral: refCatastral,
                                  explotacionId,
                                  explotacionNombre,
                                  granjeroNombre,
                                  granjeroId,
                                }
                              })}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#fdf0e8', border: '1px solid #f0c8a0', borderRadius: 10, color: '#8a4010', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                            >
                              <FlaskConical size={14} color="#9a5020" />
                              Ver Tratamientos
                            </button>
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
