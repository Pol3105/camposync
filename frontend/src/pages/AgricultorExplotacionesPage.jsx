import { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Map, ArrowLeft, Info, Eye, X, Download } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import { asesor } from '../services/api'

const ORIENTACION_LABEL = {
  CE: 'Cereal',   VI: 'Viñedo',  OL: 'Olivar',
  FS: 'Frutos Secos', HO: 'Hortícola', PA: 'Pastizal', OT: 'Otros',
}
const ORIENTACION_CHIP = {
  CE: { bg: '#fdf6e4', color: '#8a6010', border: '#f5d878' },
  VI: { bg: '#f7f0f8', color: '#6a3078', border: '#d0a0e0' },
  OL: { bg: '#f0f7e8', color: '#3a6a20', border: '#b0d880' },
  FS: { bg: '#fff2ea', color: '#8a3a18', border: '#f5a878' },
  HO: { bg: '#e8f7f2', color: '#1a6a50', border: '#80d0b8' },
  PA: { bg: '#f0f4e8', color: '#4a5a28', border: '#a8be78' },
}
const DEFAULT_CHIP = { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' }

const TIPO_LABEL = { PF: 'Persona Física', SA: 'Soc. Agraria', SC: 'Soc. Civil', SL: 'Soc. Limitada' }

function SiexModal({ exp, onClose }) {
  const chip = ORIENTACION_CHIP[exp.orientacionProductiva] ?? DEFAULT_CHIP
  const rows = [
    ['Código REA',            exp.codigoRea           ?? '—'],
    ['Tipo Explotación',      TIPO_LABEL[exp.tipoExplotacion] ?? exp.tipoExplotacion ?? '—'],
    ['Orientación Productiva',`${ORIENTACION_LABEL[exp.orientacionProductiva] ?? exp.orientacionProductiva ?? '—'} (${exp.orientacionProductiva ?? '—'})`],
    ['Provincia (INE)',        exp.provinciaExplotacion ?? '—'],
    ['Municipio (INE)',        exp.municipioExplotacion ?? '—'],
    ['Año Declaración',       exp.anioDeclaracion      ?? '—'],
    ['Ref. SIGPAC',           exp.refSig               ?? '—'],
    ['Estado',                exp.estado               ?? '—'],
  ]
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
               display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 18, padding: 28, width: '100%', maxWidth: 460,
                 boxShadow: '0 24px 64px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', gap: 18 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Ficha SIEX</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', letterSpacing: '-0.2px' }}>{exp.nombre}</div>
            <span style={{ display: 'inline-flex', alignItems: 'center', marginTop: 6, padding: '3px 10px',
                           borderRadius: 20, background: chip.bg, color: chip.color, border: `1px solid ${chip.border}`,
                           fontSize: 12, fontWeight: 600 }}>
              {ORIENTACION_LABEL[exp.orientacionProductiva] ?? exp.orientacionProductiva ?? '—'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', border: 'none',
                     display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <X size={16} color="#6b7280" />
          </button>
        </div>

        {/* Data rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 10, border: '1px solid #eceef5', overflow: 'hidden' }}>
          {rows.map(([label, value], i) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                      padding: '10px 16px', background: i % 2 === 1 ? '#f9fafb' : '#fff',
                                      borderBottom: i < rows.length - 1 ? '1px solid #eceef5' : 'none' }}>
              <span style={{ fontSize: 12.5, color: '#6b7280', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13, color: '#111827', fontWeight: 600, textAlign: 'right', maxWidth: 240,
                             fontFamily: label.includes('REA') || label.includes('SIGPAC') ? "'SFMono-Regular','Consolas',monospace" : 'inherit' }}>
                {value}
              </span>
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
  const [siexInfo, setSiexInfo] = useState(null)

  const fetchExplotaciones = useCallback(async () => {
    setLoading(true)
    try {
      const data = await asesor.explotacionesPorGranjero(id)
      setExplotaciones(data ?? [])
    } catch { /* handled globally */ }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchExplotaciones() }, [fetchExplotaciones])

  const handleExportPdf = async (expId, expNombre) => {
    try {
      const blob = await asesor.exportarCuePdfPorExplotacion(expId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CUE_${expNombre.replace(/\s+/g, '_')}_${expId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error detallado:', err)
      alert('Error al exportar el PDF. Por favor inténtalo de nuevo.')
    }
  }

  const titulo = nombreFromState ? `Explotaciones de ${nombreFromState}` : `Explotaciones del Agricultor #${id}`
  const totalHa = explotaciones.reduce((a, e) => a + (parseFloat(e.superficieTotal) || 0), 0).toFixed(1)
  const totalParcelas = explotaciones.reduce((a, e) => a + (e.numParcelas ?? 0), 0)
  const rp = '11px 20px'

  return (
    <AppLayout title="Explotaciones" searchPlaceholder="Buscar explotación…">
      {siexInfo && <SiexModal exp={siexInfo} onClose={() => setSiexInfo(null)} />}

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
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px' }}>{titulo}</div>
            {!loading && (
              <div style={{ fontSize: 13.5, color: '#9ca3af', marginTop: 3 }}>
                {explotaciones.length} {explotaciones.length === 1 ? 'explotación' : 'explotaciones'}
                {' · '}{totalHa} ha totales
                {' · '}{totalParcelas} {totalParcelas === 1 ? 'parcela' : 'parcelas'}
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
                    {['Explotación', 'Orientación Productiva', 'Superficie Total', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', borderBottom: '1px solid #eceef5', fontSize: 11.5, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {explotaciones.map((exp, i) => {
                    const chip = ORIENTACION_CHIP[exp.orientacionProductiva] ?? DEFAULT_CHIP
                    const label = ORIENTACION_LABEL[exp.orientacionProductiva] ?? (exp.orientacionProductiva ?? '—')
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

                        {/* Orientación */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 20, background: chip.bg, color: chip.color, border: `1px solid ${chip.border}`, fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {label}
                          </span>
                        </td>

                        {/* Superficie */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
                            {exp.superficieTotal != null ? parseFloat(exp.superficieTotal).toFixed(1) : '?'}
                          </span>
                          <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>ha</span>
                        </td>

                        {/* Acciones */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              onClick={() => setSiexInfo(exp)}
                              title="Ver ficha SIEX"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 10, color: '#6b7280', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                            >
                              <Info size={14} color="#6b7280" />
                              Info SIEX
                            </button>
                            <button
                              onClick={() => navigate(`/explotaciones/${exp.id}/parcelas`, {
                                state: { nombre: exp.nombre, granjeroNombre: nombreFromState, granjeroId: id }
                              })}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#f0f4ff', border: '1px solid #b8c8f0', borderRadius: 10, color: '#2a4a8a', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                            >
                              <Eye size={14} color="#3a5aaa" />
                              Ver Parcelas
                            </button>
                            <button
                              onClick={() => handleExportPdf(exp.id, exp.nombre)}
                              title="Exportar CUE (PDF)"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#fdf6e3', border: '1px solid #f0d080', borderRadius: 10, color: '#b58900', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                            >
                              <Download size={14} color="#b58900" />
                              Exportar PDF
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
