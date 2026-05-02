import { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import { asesor } from '../services/api'

const CULTIVO_COLORS = {
  'Cereal':    { bg: '#fdf6e4', color: '#8a6010', border: '#f5d878' },
  'Olivar':    { bg: '#f0f7e8', color: '#3a6a20', border: '#b0d880' },
  'Viñedo':    { bg: '#f7f0f8', color: '#6a3078', border: '#d0a0e0' },
  'Hortícola': { bg: '#e8f7f2', color: '#1a6a50', border: '#80d0b8' },
  'Pastizal':  { bg: '#f0f4e8', color: '#4a5a28', border: '#a8be78' },
  'Frutales':  { bg: '#fff2ea', color: '#8a3a18', border: '#f5a878' },
}
const DEFAULT_CHIP = { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' }

function EmptyState() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', gap: 20 }}>
      <div style={{ width: 108, height: 108, borderRadius: 28, background: 'linear-gradient(145deg,#f0f7ec,#e4f3db)', border: '1px solid #d0ebc0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="52" height="52" viewBox="0 0 20 20" fill="none" stroke="#a0c890" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="2,5 10,2 18,5 18,16 10,19 2,16"/>
          <line x1="10" y1="2" x2="10" y2="19"/>
        </svg>
      </div>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#1f2937', marginBottom: 8, letterSpacing: '-0.2px' }}>Sin parcelas registradas</div>
        <div style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.65 }}>Esta explotación aún no tiene parcelas vinculadas.</div>
      </div>
    </div>
  )
}

export default function ExplotacionParcelasPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const expNombre = location.state?.nombre ?? `Explotación #${id}`
  const granjeroNombre = location.state?.granjeroNombre ?? null
  const granjeroId = location.state?.granjeroId ?? null

  const [parcelas, setParcelas] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchParcelas = useCallback(async () => {
    setLoading(true)
    try {
      const data = await asesor.parcelasDeExplotacion(id)
      setParcelas(data ?? [])
    } catch { /* handled globally */ }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchParcelas() }, [fetchParcelas])

  const totalHa = parcelas.reduce((a, p) => a + (p.superficie ?? 0), 0).toFixed(2)
  const rp = '11px 20px'

  const volverPath = granjeroId ? `/agricultores/${granjeroId}/explotaciones` : '/explotaciones'
  const volverState = granjeroNombre ? { nombre: granjeroNombre } : undefined

  return (
    <AppLayout title="Parcelas" searchPlaceholder="Buscar parcela…">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, height: '100%' }}>

        {/* Page header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <button
              onClick={() => navigate(volverPath, { state: volverState })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 10, color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <ArrowLeft size={14} color="#6b7280" />
              Volver a Explotaciones
            </button>
          </div>

          {granjeroNombre && (
            <div style={{ fontSize: 12.5, color: '#9ca3af', marginBottom: 4 }}>
              Agricultor: <span style={{ fontWeight: 600, color: '#6b7280' }}>{granjeroNombre}</span>
            </div>
          )}
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px' }}>
            Parcelas de {expNombre}
          </div>
          {!loading && (
            <div style={{ fontSize: 13.5, color: '#9ca3af', marginTop: 3 }}>
              {parcelas.length} {parcelas.length === 1 ? 'parcela' : 'parcelas'} · {totalHa} ha totales
            </div>
          )}
        </div>

        {/* Table card */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #eceef5', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Parcelas vinculadas</span>
            {!loading && parcelas.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>{parcelas.length} registradas</span>
            )}
          </div>

          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
              Cargando parcelas…
            </div>
          ) : parcelas.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f7f8fc' }}>
                    {['Referencia Catastral', 'Cultivo', 'Municipio', 'Superficie (ha)', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', borderBottom: '1px solid #eceef5', fontSize: 11.5, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parcelas.map((p, i) => {
                    const chip = CULTIVO_COLORS[p.cultivo] ?? DEFAULT_CHIP
                    return (
                      <tr key={p.id} style={{ background: i % 2 === 1 ? '#fafbfe' : 'transparent' }}>

                        {/* Referencia Catastral */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <code style={{ fontSize: 12.5, color: '#2d3748', background: '#f7f8fa', padding: '4px 10px', borderRadius: 7, border: '1px solid #e8eaee', fontFamily: "'SFMono-Regular','Consolas',monospace", whiteSpace: 'nowrap' }}>
                            {p.refCatastral ?? '—'}
                          </code>
                        </td>

                        {/* Cultivo */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 20, background: chip.bg, color: chip.color, border: `1px solid ${chip.border}`, fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {p.cultivo ?? '—'}
                          </span>
                        </td>

                        {/* Municipio */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <span style={{ fontSize: 13.5, color: '#374151' }}>{p.municipio ?? '—'}</span>
                        </td>

                        {/* Superficie */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{p.superficie?.toFixed(2) ?? '?'}</span>
                          <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>ha</span>
                        </td>

                        {/* Acciones */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <button
                            onClick={() => navigate(`/parcelas/${p.id}/tratamientos`, {
                              state: {
                                refCatastral: p.refCatastral,
                                cultivo: p.cultivo,
                                municipio: p.municipio,
                                explotacionId: id,
                                explotacionNombre: expNombre,
                                granjeroNombre,
                                granjeroId,
                              }
                            })}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#f5f0ff', border: '1px solid #c8b0f0', borderRadius: 10, color: '#5a3a8a', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                          >
                            <ClipboardList size={14} color="#6a4aaa" />
                            Ver Tratamientos
                          </button>
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
