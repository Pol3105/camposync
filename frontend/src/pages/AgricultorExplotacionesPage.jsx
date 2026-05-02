import { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Map, ArrowLeft, FileCode, Eye } from 'lucide-react'
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
        <Map size={52} color="#a0c890" />
      </div>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#1f2937', marginBottom: 8, letterSpacing: '-0.2px' }}>Sin explotaciones asignadas</div>
        <div style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.65 }}>Este agricultor aún no tiene explotaciones asignadas.</div>
      </div>
    </div>
  )
}

export default function AgricultorExplotacionesPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const nombreFromState = location.state?.nombre ?? null
  const [explotaciones, setExplotaciones] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchExplotaciones = useCallback(async () => {
    setLoading(true)
    try {
      const data = await asesor.explotacionesPorGranjero(id)
      setExplotaciones(data ?? [])
    } catch { /* handled globally */ }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchExplotaciones() }, [fetchExplotaciones])

  const titulo = nombreFromState ? `Explotaciones de ${nombreFromState}` : `Explotaciones del Agricultor #${id}`
  const totalHa = explotaciones.reduce((a, e) => a + (e.superficieHa ?? 0), 0).toFixed(1)
  const rp = '11px 20px'

  return (
    <AppLayout title="Explotaciones" searchPlaceholder="Buscar explotación…">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, height: '100%' }}>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <button
                onClick={() => navigate('/agricultores')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 10, color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <ArrowLeft size={14} color="#6b7280" />
                Volver
              </button>
              <button
                onClick={() => alert('Exportación SIEX (XML) — próximamente')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(46,92,56,0.32)' }}
              >
                <FileCode size={15} color="#fff" />
                Exportar SIEX (XML)
              </button>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px' }}>{titulo}</div>
            {!loading && (
              <div style={{ fontSize: 13.5, color: '#9ca3af', marginTop: 3 }}>
                {explotaciones.length} {explotaciones.length === 1 ? 'explotación' : 'explotaciones'} · {totalHa} ha totales
              </div>
            )}
          </div>
        </div>

        {/* Table card */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #eceef5', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Listado de Explotaciones</span>
            {!loading && explotaciones.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>{explotaciones.length} registradas</span>
            )}
          </div>

          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
              Cargando explotaciones…
            </div>
          ) : explotaciones.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f7f8fc' }}>
                    {['Explotación', 'Cultivo Principal', 'Superficie', 'Ref. SIGPAC', 'Parcelas', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', borderBottom: '1px solid #eceef5', fontSize: 11.5, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {explotaciones.map((exp, i) => {
                    const chip = CULTIVO_COLORS[exp.cultivo] ?? DEFAULT_CHIP
                    const numParc = exp.numParcelas ?? 0
                    return (
                      <tr key={exp.id} style={{ background: i % 2 === 1 ? '#fafbfe' : 'transparent' }}>

                        {/* Nombre */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(145deg,#e4f5e0,#c8e8b8)', border: '1px solid #b0d890', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Map size={17} color="#3a7030" />
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: '-0.1px' }}>{exp.nombre}</div>
                              <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 1 }}>ID #{exp.id}</div>
                            </div>
                          </div>
                        </td>

                        {/* Cultivo */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 20, background: chip.bg, color: chip.color, border: `1px solid ${chip.border}`, fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {exp.cultivo ?? '—'}
                          </span>
                        </td>

                        {/* Superficie */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{exp.superficieHa?.toFixed(1) ?? '?'}</span>
                          <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>ha</span>
                        </td>

                        {/* Ref. SIGPAC */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          {exp.refSig ? (
                            <code style={{ fontSize: 12, color: '#4a5568', background: '#f7f8fa', padding: '3px 8px', borderRadius: 6, border: '1px solid #e8eaee', fontFamily: "'SFMono-Regular','Consolas',monospace", whiteSpace: 'nowrap' }}>
                              {exp.refSig}
                            </code>
                          ) : <span style={{ color: '#c8ccd8', fontSize: 13 }}>—</span>}
                        </td>

                        {/* Parcelas badge */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: numParc > 0 ? '#edf7e8' : '#f3f4f6', color: numParc > 0 ? '#267a40' : '#9ca3af', border: `1px solid ${numParc > 0 ? '#c0e8b0' : '#e5e7eb'}`, fontSize: 12.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            {numParc}
                            <span style={{ fontWeight: 500, fontSize: 11.5 }}>{numParc === 1 ? 'parcela' : 'parcelas'}</span>
                          </span>
                        </td>

                        {/* Acciones */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <button
                            onClick={() => navigate(`/explotaciones/${exp.id}/parcelas`, {
                              state: { nombre: exp.nombre, granjeroNombre: nombreFromState, granjeroId: id }
                            })}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#f0f4ff', border: '1px solid #b8c8f0', borderRadius: 10, color: '#2a4a8a', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                          >
                            <Eye size={14} color="#3a5aaa" />
                            Ver Parcelas
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
