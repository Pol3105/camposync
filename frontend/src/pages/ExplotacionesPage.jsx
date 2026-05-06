import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Map, X, PlusCircle, Info, Pencil, Trash2, Search } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import NuevaParcelaModal from '../components/NuevaParcelaModal'
import { asesor } from '../services/api'

/* ── orientation maps ── */
const ORIENTACION_LABEL = {
  CE: 'Cereal', VI: 'Viñedo', OL: 'Olivar',
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
const TIPO_LABEL = { PF: 'Persona Física', SA: 'Soc. Anónima', SC: 'Soc. Cooperativa', SL: 'Soc. Limitada' }

const TIPO_EXPLOTACION_OPTS = [
  { value: 'PF', label: 'PF — Persona Física' },
  { value: 'SA', label: 'SA — Sociedad Anónima' },
  { value: 'SC', label: 'SC — Sociedad Cooperativa' },
  { value: 'SL', label: 'SL — Sociedad Limitada' },
]
const ORIENTACION_OPTS = [
  { value: 'CE', label: 'CE — Cereales' },
  { value: 'VI', label: 'VI — Viñedo' },
  { value: 'OL', label: 'OL — Olivar' },
  { value: 'FS', label: 'FS — Frutas y semillas' },
  { value: 'HO', label: 'HO — Horticultura' },
  { value: 'PA', label: 'PA — Pastos' },
  { value: 'OT', label: 'OT — Otros' },
]

// ── SIEX info modal ───────────────────────────────────────────────────────────
function SiexModal({ exp, onClose }) {
  const chip = ORIENTACION_CHIP[exp.orientacionProductiva] ?? DEFAULT_CHIP
  const rows = [
    ['Código REA',             exp.codigoRea           ?? '—'],
    ['Tipo Explotación',       TIPO_LABEL[exp.tipoExplotacion] ?? exp.tipoExplotacion ?? '—'],
    ['Orientación Productiva', `${ORIENTACION_LABEL[exp.orientacionProductiva] ?? exp.orientacionProductiva ?? '—'} (${exp.orientacionProductiva ?? '—'})`],
    ['Provincia (INE)',        exp.provinciaExplotacion ?? '—'],
    ['Municipio (INE)',        exp.municipioExplotacion ?? '—'],
    ['Año Declaración',        exp.anioDeclaracion      ?? '—'],
    ['Ref. SIGPAC',            exp.refSig               ?? '—'],
    ['Estado',                 exp.estado               ?? '—'],
  ]
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Ficha SIEX</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', letterSpacing: '-0.2px' }}>{exp.nombre}</div>
            <span style={{ display: 'inline-flex', alignItems: 'center', marginTop: 6, padding: '3px 10px', borderRadius: 20, background: chip.bg, color: chip.color, border: `1px solid ${chip.border}`, fontSize: 12, fontWeight: 600 }}>
              {ORIENTACION_LABEL[exp.orientacionProductiva] ?? exp.orientacionProductiva ?? '—'}
            </span>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <X size={16} color="#6b7280" />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 10, border: '1px solid #eceef5', overflow: 'hidden' }}>
          {rows.map(([label, value], i) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: i % 2 === 1 ? '#f9fafb' : '#fff', borderBottom: i < rows.length - 1 ? '1px solid #eceef5' : 'none' }}>
              <span style={{ fontSize: 12.5, color: '#6b7280', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13, color: '#111827', fontWeight: 600, textAlign: 'right', maxWidth: 240, fontFamily: label.includes('REA') || label.includes('SIGPAC') ? "'SFMono-Regular','Consolas',monospace" : 'inherit' }}>{value}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ padding: '9px 20px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 10, color: '#374151', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-end' }}>Cerrar</button>
      </div>
    </div>
  )
}

// ── Nueva / Editar explotación modal ──────────────────────────────────────────
function NuevaExplotacionModal({ granjeros, onClose, onSaved, initialData }) {
  const isEdit = !!initialData
  const [form, setForm] = useState({
    nombre:                initialData?.nombre                         ?? '',
    superficieTotal:       initialData?.superficieTotal?.toString()   ?? '',
    refSig:                initialData?.refSig                        ?? '',
    granjeroId:            initialData?.granjeroId?.toString()        ?? granjeros[0]?.id?.toString() ?? '',
    codigoRea:             initialData?.codigoRea                     ?? '',
    tipoExplotacion:       initialData?.tipoExplotacion               ?? 'PF',
    orientacionProductiva: initialData?.orientacionProductiva         ?? 'CE',
    provinciaExplotacion:  initialData?.provinciaExplotacion          ?? '',
    municipioExplotacion:  initialData?.municipioExplotacion          ?? '',
    anioDeclaracion:       initialData?.anioDeclaracion?.toString()   ?? new Date().getFullYear().toString(),
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit() {
    if (!form.nombre || !form.superficieTotal || (!isEdit && !form.granjeroId)) {
      return setError('Nombre y superficie son obligatorios.')
    }
    setSaving(true)
    setError('')
    const body = {
      nombre:                form.nombre,
      refSig:                form.refSig || null,
      superficieTotal:       parseFloat(form.superficieTotal),
      granjeroId:            form.granjeroId ? Number(form.granjeroId) : null,
      codigoRea:             form.codigoRea || null,
      tipoExplotacion:       form.tipoExplotacion || null,
      orientacionProductiva: form.orientacionProductiva || null,
      provinciaExplotacion:  form.provinciaExplotacion || null,
      municipioExplotacion:  form.municipioExplotacion || null,
      anioDeclaracion:       form.anioDeclaracion ? parseInt(form.anioDeclaracion) : null,
    }
    try {
      const result = isEdit
        ? await asesor.editarExplotacion(initialData.id, body)
        : await asesor.crearExplotacion(body)
      setSaved(true)
      setTimeout(() => { onSaved(result); onClose() }, 700)
    } catch (err) {
      setError(err.message ?? 'Error al guardar la explotación.')
      setSaving(false)
    }
  }

  const inputStyle = { width: '100%', padding: '9px 13px', borderRadius: 10, border: '1.5px solid #d1d5db', fontSize: 13.5, color: '#111827', fontFamily: 'inherit', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }
  const sectionLabel = { fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, marginTop: 4 }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(15,25,18,0.45)', backdropFilter: 'blur(2px)' }} onClick={onClose}>
      <div style={{ width: 560, maxHeight: '90vh', background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.20)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid #eceef5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.2px' }}>{isEdit ? 'Editar Explotación' : 'Nueva Explotación'}</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{isEdit ? `Modificando ${initialData.nombre}` : 'Crea una nueva finca en tu asesoría'}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={14} color="#6b7280" />
          </button>
        </div>

        <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
          <div>
            <label style={labelStyle}>Nombre <span style={{ color: '#e07030' }}>*</span></label>
            <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej. La Vega Norte" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Superficie total (ha) <span style={{ color: '#e07030' }}>*</span></label>
              <input name="superficieTotal" type="number" step="0.01" min="0" value={form.superficieTotal} onChange={handleChange} placeholder="Ej. 12.4" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Ref. SIGPAC</label>
              <input name="refSig" value={form.refSig} onChange={handleChange} placeholder="Ej. 14-077-0-0-1-80-PAR" style={inputStyle} />
            </div>
          </div>
          {!isEdit && (
            <div>
              <label style={labelStyle}>Granjero asignado <span style={{ color: '#e07030' }}>*</span></label>
              <select name="granjeroId" value={form.granjeroId} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                {granjeros.length === 0 && <option value="">Sin granjeros disponibles</option>}
                {granjeros.map(g => <option key={g.id} value={g.id}>{g.nombre || g.username}</option>)}
              </select>
            </div>
          )}

          <div style={{ borderTop: '1px solid #eceef5', paddingTop: 14 }}>
            <p style={sectionLabel}>Datos SIEX</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Código REA</label>
                  <input name="codigoRea" value={form.codigoRea} onChange={handleChange} placeholder="Ej. ES010012345" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Año de declaración</label>
                  <input name="anioDeclaracion" type="number" value={form.anioDeclaracion} onChange={handleChange} placeholder={new Date().getFullYear()} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Tipo de explotación</label>
                  <select name="tipoExplotacion" value={form.tipoExplotacion} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {TIPO_EXPLOTACION_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Orientación productiva</label>
                  <select name="orientacionProductiva" value={form.orientacionProductiva} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {ORIENTACION_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Provincia (INE, 2 dígitos)</label>
                  <input name="provinciaExplotacion" value={form.provinciaExplotacion} onChange={handleChange} placeholder="Ej. 14" maxLength={2} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Municipio (INE, 5 dígitos)</label>
                  <input name="municipioExplotacion" value={form.municipioExplotacion} onChange={handleChange} placeholder="Ej. 14077" maxLength={5} style={inputStyle} />
                </div>
              </div>
            </div>
          </div>

          {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fff3e6', border: '1px solid #fdd8b4', color: '#c25c10', fontSize: 13 }}>{error}</div>}
        </div>

        <div style={{ padding: '16px 26px', borderTop: '1px solid #eceef5', background: '#fafbfc', flexShrink: 0 }}>
          <button onClick={handleSubmit} disabled={saving || saved} style={{ width: '100%', padding: 13, background: saved ? '#4e9a5f' : 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: saving || saved ? 'default' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(46,92,56,0.28)' }}>
            {saved
              ? (isEdit ? '¡Cambios guardados!' : '¡Explotación creada!')
              : saving ? 'Guardando…'
              : isEdit ? 'Guardar Cambios' : 'Crear Explotación'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onCrear }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', gap: 22 }}>
      <div style={{ width: 112, height: 112, borderRadius: 28, background: 'linear-gradient(145deg,#f0f7ec,#e4f3db)', border: '1px solid #c8e8b0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Map size={58} color="#7ab85e" />
      </div>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#1f2937', marginBottom: 8, letterSpacing: '-0.2px' }}>No hay explotaciones registradas</div>
        <div style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7 }}>Añade tu primera explotación para empezar a gestionar las fincas y parcelas de tu asesoría.</div>
      </div>
      <button onClick={onCrear} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 28px', background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(46,92,56,0.32)', marginTop: 4 }}>
        <PlusCircle size={17} color="#fff" />
        Crear primera explotación
      </button>
    </div>
  )
}

// ── Icon button helpers ───────────────────────────────────────────────────────
const iconBtn = (extra = {}) => ({
  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', border: '1px solid #e5e7eb',
  background: '#fff', flexShrink: 0, ...extra,
})

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ExplotacionesPage() {
  const navigate = useNavigate()
  const [explotaciones, setExplotaciones] = useState([])
  const [granjeros,     setGranjeros]     = useState([])
  const [loading,       setLoading]       = useState(true)
  const [expModal,      setExpModal]      = useState(null)  // null=closed, true=create, obj=edit
  const [parcelaModal,  setParcelaModal]  = useState(null)  // explotacion object (create only)
  const [siexModal,     setSiexModal]     = useState(null)
  const [searchTerm,    setSearchTerm]    = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [e, g] = await Promise.all([asesor.explotaciones(), asesor.granjeros()])
      setExplotaciones(e ?? [])
      setGranjeros(g ?? [])
    } catch { /* handled globally */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function handleExpSaved(saved) {
    setExplotaciones(prev => {
      const exists = prev.find(e => e.id === saved.id)
      return exists ? prev.map(e => e.id === saved.id ? saved : e) : [...prev, saved]
    })
  }

  async function handleDeleteExp(exp) {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta explotación? Esta acción no se puede deshacer.')) return
    try {
      await asesor.eliminarExplotacion(exp.id)
      setExplotaciones(prev => prev.filter(e => e.id !== exp.id))
    } catch { /* noop */ }
  }

  const filteredExplotaciones = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return q ? explotaciones.filter(e => e.nombre?.toLowerCase().includes(q)) : explotaciones
  }, [explotaciones, searchTerm])

  const totalHa = explotaciones.reduce((a, e) => a + (e.superficieTotal ?? 0), 0).toFixed(1)
  const orientacionesDistintas = new Set(explotaciones.map(e => e.orientacionProductiva).filter(Boolean)).size
  const rp = '11px 20px'

  return (
    <>
      <AppLayout title="Explotaciones" searchPlaceholder="Buscar explotación…">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Page header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px' }}>Gestión de Explotaciones</div>
              <div style={{ fontSize: 13.5, color: '#9ca3af', marginTop: 3 }}>Administra las fincas y parcelas de tu asesoría</div>
            </div>
            <button
              onClick={() => setExpModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(46,92,56,0.32)', whiteSpace: 'nowrap' }}
            >
              <PlusCircle size={16} color="#fff" />
              Nueva Explotación
            </button>
          </div>

          {/* KPI strip */}
          {!loading && explotaciones.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[
                { label: 'Explotaciones registradas', value: explotaciones.length,    iconBg: '#edf7e8', icon: <Map size={20} color="#4e9a5f" /> },
                { label: 'Superficie total gestionada', value: `${totalHa} ha`,       iconBg: '#e8f5ef', icon: <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#3a7a60" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="2,5 10,2 18,5 18,16 10,19 2,16"/><line x1="10" y1="2" x2="10" y2="19"/></svg> },
                { label: 'Orientaciones distintas',    value: orientacionesDistintas, iconBg: '#fdf6e0', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#7a6a1e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2a7 7 0 100 14"/><path d="M10 2c0 0-4 4-4 7s4 7 4 7"/><path d="M10 2c0 0 4 4 4 7s-4 7-4 7"/><line x1="3" y1="9" x2="17" y2="9"/></svg> },
              ].map((kpi, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: kpi.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{kpi.icon}</div>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{kpi.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search bar */}
          {!loading && explotaciones.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', padding: '14px 20px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar explotación..."
                  style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13.5, color: '#111827', fontFamily: 'inherit', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {/* Table card */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #eceef5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Listado de Explotaciones</span>
                {!loading && explotaciones.length > 0 && (
                  <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>{filteredExplotaciones.length}{filteredExplotaciones.length !== explotaciones.length ? ` de ${explotaciones.length}` : ''} registradas</span>
                )}
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#9ca3af', fontSize: 14 }}>Cargando explotaciones…</div>
            ) : explotaciones.length === 0 ? (
              <EmptyState onCrear={() => setExpModal(true)} />
            ) : filteredExplotaciones.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: '#9ca3af', fontSize: 14 }}>Sin resultados para "{searchTerm}"</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f7f8fc' }}>
                      {['Explotación', 'Orientación Productiva', 'Superficie Total', 'Acciones'].map(h => (
                        <th key={h} style={{ padding: '10px 20px', textAlign: 'left', borderBottom: '1px solid #eceef5', fontSize: 11.5, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExplotaciones.map((exp, i) => {
                      const chip = ORIENTACION_CHIP[exp.orientacionProductiva] ?? DEFAULT_CHIP
                      return (
                        <tr key={exp.id} style={{ background: i % 2 === 1 ? '#fafbfe' : 'transparent' }}>

                          {/* Explotación */}
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
                            {exp.orientacionProductiva ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 20, background: chip.bg, color: chip.color, border: `1px solid ${chip.border}`, fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {ORIENTACION_LABEL[exp.orientacionProductiva] ?? exp.orientacionProductiva}
                              </span>
                            ) : <span style={{ color: '#c8ccd8', fontSize: 13 }}>—</span>}
                          </td>

                          {/* Superficie */}
                          <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
                              {exp.superficieTotal != null ? Number(exp.superficieTotal).toFixed(1) : '?'}
                            </span>
                            <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>ha</span>
                          </td>

                          {/* Acciones */}
                          <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <button onClick={() => setSiexModal(exp)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, color: '#6b7280', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                                <Info size={13} color="#6b7280" />Info SIEX
                              </button>
                              <button onClick={() => navigate(`/explotaciones/${exp.id}/parcelas`, { state: { nombre: exp.nombre } })} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#fff', border: '1px solid #b8c8f0', borderRadius: 10, color: '#2a4a8a', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                                Ver Parcelas
                              </button>
                              <button onClick={() => setParcelaModal(exp)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(46,92,56,0.25)' }}>
                                <PlusCircle size={13} color="#fff" />Añadir Parcela
                              </button>
                              <button onClick={() => setExpModal(exp)} title="Editar" style={iconBtn()}>
                                <Pencil size={14} color="#6b7280" />
                              </button>
                              <button onClick={() => handleDeleteExp(exp)} title="Eliminar" style={iconBtn({ border: '1px solid #fecaca', background: '#fff5f5' })}>
                                <Trash2 size={14} color="#ef4444" />
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

      {expModal && (
        <NuevaExplotacionModal
          granjeros={granjeros}
          onClose={() => setExpModal(null)}
          onSaved={(saved) => { handleExpSaved(saved); setExpModal(null) }}
          initialData={expModal === true ? null : expModal}
        />
      )}

      {parcelaModal && (
        <NuevaParcelaModal
          explotacion={parcelaModal}
          onClose={() => setParcelaModal(null)}
          onSaved={() => setParcelaModal(null)}
        />
      )}

      {siexModal && (
        <SiexModal exp={siexModal} onClose={() => setSiexModal(null)} />
      )}
    </>
  )
}
