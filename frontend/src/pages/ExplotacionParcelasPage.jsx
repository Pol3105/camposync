import { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileCode, FileText, Info, Layers, Pencil, PlusCircle, Trash2, X } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import NuevaParcelaModal from '../components/NuevaParcelaModal'
import NuevoRecintoModal from '../components/NuevoRecintoModal'
import { asesor } from '../services/api'

function ParcelaInfoModal({ parcela, onClose }) {
  const rows = [
    ['Ref. Catastral', parcela.refCatastral ?? '—'],
    ['Municipio',      parcela.municipio    ?? '—'],
    ['Provincia',      parcela.provincia    ?? '—'],
    ['Polígono',       parcela.poligono     ?? '—'],
    ['Parcela SIGPAC', parcela.parcelaSigpac ?? '—'],
    ['Agregado',       parcela.agregado     ?? '0'],
    ['Zona',           parcela.zona         ?? '0'],
    ['Recintos',       `${parcela.numRecintos ?? 0} recintos`],
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
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Detalles SIGPAC</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', fontFamily: "'SFMono-Regular','Consolas',monospace" }}>
              {parcela.refCatastral}
            </div>
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

  const expNombre     = location.state?.nombre         ?? `Explotación #${id}`
  const granjeroNombre = location.state?.granjeroNombre ?? null
  const granjeroId    = location.state?.granjeroId     ?? null

  const [parcelas, setParcelas] = useState([])
  const [loading, setLoading] = useState(true)
  const [parcelaInfo,   setParcelaInfo]   = useState(null)
  const [editParcela,   setEditParcela]   = useState(null)
  const [recintoModal,  setRecintoModal]  = useState(null)
  const [pdfToast,      setPdfToast]      = useState(false)

  function handleGenerarPdf() {
    setPdfToast(true)
    setTimeout(() => setPdfToast(false), 4000)
  }

  async function handleDeleteParcela(parcela) {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta parcela? Esta acción no se puede deshacer.')) return
    try {
      await asesor.eliminarParcela(parcela.id)
      setParcelas(prev => prev.filter(p => p.id !== parcela.id))
    } catch { /* noop */ }
  }

  const fetchParcelas = useCallback(async () => {
    setLoading(true)
    try {
      const data = await asesor.parcelasDeExplotacion(id)
      setParcelas(data ?? [])
    } catch { /* handled globally */ }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchParcelas() }, [fetchParcelas])

  const rp = '11px 20px'
  const volverPath  = granjeroId ? `/agricultores/${granjeroId}/explotaciones` : '/explotaciones'
  const volverState = granjeroNombre ? { nombre: granjeroNombre } : undefined

  return (
    <AppLayout title="Parcelas" searchPlaceholder="Buscar parcela…">
      {parcelaInfo && <ParcelaInfoModal parcela={parcelaInfo} onClose={() => setParcelaInfo(null)} />}

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
            <button
              onClick={() => alert('Exportación SIEX (XML) — próximamente')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(46,92,56,0.28)' }}
            >
              <FileCode size={15} color="#fff" />
              Exportar SIEX (XML)
            </button>
            <button
              onClick={handleGenerarPdf}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: 'linear-gradient(135deg,#1e40af,#3b82f6)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(30,64,175,0.28)' }}
            >
              <FileText size={15} color="#fff" />
              Generar Cuaderno (PDF)
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
              {parcelas.length} {parcelas.length === 1 ? 'parcela' : 'parcelas'}
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
                    {['Ref. Catastral', 'Municipio', 'Polígono', 'Parcela SIGPAC', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', borderBottom: '1px solid #eceef5', fontSize: 11.5, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parcelas.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 1 ? '#fafbfe' : 'transparent' }}>

                      {/* Ref. Catastral */}
                      <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                        <code style={{ fontSize: 12.5, color: '#2d3748', background: '#f7f8fa', padding: '4px 10px', borderRadius: 7, border: '1px solid #e8eaee', fontFamily: "'SFMono-Regular','Consolas',monospace", whiteSpace: 'nowrap' }}>
                          {p.refCatastral ?? '—'}
                        </code>
                      </td>

                      {/* Municipio */}
                      <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                        <span style={{ fontSize: 13.5, color: '#374151' }}>{p.municipio ?? '—'}</span>
                      </td>

                      {/* Polígono */}
                      <td style={{ padding: rp, borderBottom: '1px solid #eceef5', textAlign: 'center' }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                          {p.poligono ?? '—'}
                        </span>
                      </td>

                      {/* Parcela SIGPAC */}
                      <td style={{ padding: rp, borderBottom: '1px solid #eceef5', textAlign: 'center' }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                          {p.parcelaSigpac ?? '—'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => setParcelaInfo(p)}
                            title="Ver detalles SIGPAC"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 10, color: '#6b7280', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                          >
                            <Info size={14} color="#6b7280" />
                            Info
                          </button>
                          <button
                            onClick={() => setRecintoModal(p)}
                            title="Añadir Recinto"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#f0faf3', border: '1px solid #a8d8b0', borderRadius: 10, color: '#267a40', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                          >
                            <PlusCircle size={14} color="#267a40" />
                            Añadir Recinto
                          </button>
                          <button
                            onClick={() => setEditParcela(p)}
                            title="Editar parcela"
                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                          >
                            <Pencil size={14} color="#6b7280" />
                          </button>
                          <button
                            onClick={() => handleDeleteParcela(p)}
                            title="Eliminar parcela"
                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fecaca', background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                          >
                            <Trash2 size={14} color="#ef4444" />
                          </button>
                          <button
                            onClick={() => navigate(`/parcelas/${p.id}/recintos`, {
                              state: {
                                refCatastral: p.refCatastral,
                                municipio: p.municipio,
                                explotacionId: id,
                                explotacionNombre: expNombre,
                                granjeroNombre,
                                granjeroId,
                              }
                            })}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#f5f0ff', border: '1px solid #c8b0f0', borderRadius: 10, color: '#5a3a8a', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                          >
                            <Layers size={14} color="#6a4aaa" />
                            Ver Recintos
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {editParcela && (
        <NuevaParcelaModal
          initialData={editParcela}
          onClose={() => setEditParcela(null)}
          onSaved={(updated) => {
            setParcelas(prev => prev.map(p => p.id === updated.id ? updated : p))
            setEditParcela(null)
          }}
        />
      )}

      {recintoModal && (
        <NuevoRecintoModal
          parcela={recintoModal}
          onClose={() => setRecintoModal(null)}
          onCreated={() => {
            setParcelas(prev => prev.map(p =>
              p.id === recintoModal.id ? { ...p, numRecintos: (p.numRecintos ?? 0) + 1 } : p
            ))
            setRecintoModal(null)
          }}
        />
      )}

      {pdfToast && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: '#1e40af', borderRadius: 14, boxShadow: '0 8px 30px rgba(30,64,175,0.30)', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: "'Inter',system-ui,sans-serif", maxWidth: 380 }}>
          <FileText size={18} color="#fff" style={{ flexShrink: 0 }} />
          <span>Generando Cuaderno de Campo en PDF... (Próximamente)</span>
          <button onClick={() => setPdfToast(false)} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: 0, display: 'flex', alignItems: 'center' }}>
            <X size={16} />
          </button>
        </div>
      )}
    </AppLayout>
  )
}
