import { useState, useEffect, useCallback } from 'react'
import { Map, X, PlusCircle, Eye } from 'lucide-react'
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
const CULTIVO_OPTS = ['Cereal', 'Olivar', 'Viñedo', 'Hortícola', 'Pastizal', 'Frutales']
const DEFAULT_CHIP = { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' }

// ── Nueva explotación modal ───────────────────────────────────────────────────
function NuevaExplotacionModal({ granjeros, onClose, onCreated }) {
  const [form, setForm] = useState({ nombre: '', cultivo: 'Cereal', superficieHa: '', refSig: '', granjeroId: granjeros[0]?.id ?? '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit() {
    if (!form.nombre || !form.superficieHa || !form.granjeroId) {
      return setError('Nombre, superficie y granjero son obligatorios.')
    }
    setSaving(true)
    setError('')
    try {
      const created = await asesor.crearExplotacion({
        nombre: form.nombre,
        cultivo: form.cultivo,
        superficieHa: parseFloat(form.superficieHa),
        refSig: form.refSig || null,
        granjeroId: Number(form.granjeroId),
      })
      setSaved(true)
      setTimeout(() => { onCreated(created); onClose() }, 700)
    } catch (err) {
      setError(err.message ?? 'Error al crear la explotación.')
      setSaving(false)
    }
  }

  const inputStyle = { width: '100%', padding: '9px 13px', borderRadius: 10, border: '1.5px solid #d1d5db', fontSize: 13.5, color: '#111827', fontFamily: 'inherit', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(15,25,18,0.45)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        style={{ width: 480, background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.20)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid #eceef5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.2px' }}>Nueva Explotación</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>Crea una nueva finca en tu asesoría</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={14} color="#6b7280" />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nombre de la explotación <span style={{ color: '#e07030' }}>*</span></label>
            <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej. La Vega Norte" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Cultivo principal</label>
              <select name="cultivo" value={form.cultivo} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                {CULTIVO_OPTS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Superficie (ha) <span style={{ color: '#e07030' }}>*</span></label>
              <input name="superficieHa" type="number" step="0.1" min="0" value={form.superficieHa} onChange={handleChange} placeholder="Ej. 12.4" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Ref. SIGPAC</label>
            <input name="refSig" value={form.refSig} onChange={handleChange} placeholder="Ej. 14-077-0-0-1-80-PAR" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Granjero asignado <span style={{ color: '#e07030' }}>*</span></label>
            <select name="granjeroId" value={form.granjeroId} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
              {granjeros.length === 0 && <option value="">Sin granjeros disponibles</option>}
              {granjeros.map(g => (
                <option key={g.id} value={g.id}>{g.nombre || g.username}</option>
              ))}
            </select>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fff3e6', border: '1px solid #fdd8b4', color: '#c25c10', fontSize: 13 }}>{error}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 26px', borderTop: '1px solid #eceef5', background: '#fafbfc' }}>
          <button
            onClick={handleSubmit}
            disabled={saving || saved}
            style={{ width: '100%', padding: 13, background: saved ? '#4e9a5f' : 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(46,92,56,0.28)' }}
          >
            {saved ? '¡Explotación creada!' : saving ? 'Creando…' : 'Crear Explotación'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Nueva parcela modal ───────────────────────────────────────────────────────
function NuevaParcelaModal({ explotacion, onClose, onCreated }) {
  const [form, setForm] = useState({ refCatastral: '', municipio: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit() {
    setSaving(true)
    setError('')
    try {
      const created = await asesor.crearParcela(explotacion.id, {
        refCatastral: form.refCatastral || null,
        municipio: form.municipio || null,
      })
      setSaved(true)
      setTimeout(() => { onCreated(created); onClose() }, 700)
    } catch (err) {
      setError(err.message ?? 'Error al crear la parcela.')
      setSaving(false)
    }
  }

  const inputStyle = { width: '100%', padding: '9px 13px', borderRadius: 10, border: '1.5px solid #d1d5db', fontSize: 13.5, color: '#111827', fontFamily: 'inherit', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(15,25,18,0.45)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        style={{ width: 460, background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.20)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid #eceef5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.2px' }}>Añadir Parcela</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>en <span style={{ fontWeight: 600, color: '#374151' }}>{explotacion.nombre}</span></div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={14} color="#6b7280" />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Referencia Catastral</label>
            <input name="refCatastral" value={form.refCatastral} onChange={handleChange} placeholder="Ej. 14077A0010002580000JK" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Municipio</label>
            <input name="municipio" value={form.municipio} onChange={handleChange} placeholder="Ej. Córdoba" style={inputStyle} />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fff3e6', border: '1px solid #fdd8b4', color: '#c25c10', fontSize: 13 }}>{error}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 26px', borderTop: '1px solid #eceef5', background: '#fafbfc' }}>
          <button
            onClick={handleSubmit}
            disabled={saving || saved}
            style={{ width: '100%', padding: 13, background: saved ? '#4e9a5f' : 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(46,92,56,0.28)' }}
          >
            {saved ? '¡Parcela añadida!' : saving ? 'Guardando…' : 'Añadir Parcela'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Parcelas drawer ───────────────────────────────────────────────────────────
function ParcelasDrawer({ explotacion, onClose }) {
  const [parcelas, setParcelas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    asesor.parcelasDeExplotacion(explotacion.id)
      .then(p => setParcelas(p ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [explotacion.id])

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,25,18,0.30)', zIndex: 40, backdropFilter: 'blur(1px)' }}
      />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, background: '#fff', boxShadow: '-8px 0 40px rgba(0,0,0,0.14)', zIndex: 50, display: 'flex', flexDirection: 'column' }}>

        {/* Drawer header — dark green gradient */}
        <div style={{ padding: '20px 24px 16px', background: 'linear-gradient(135deg,#1c3829,#2e5c38)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Explotación</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.2 }}>{explotacion.nombre}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.90)', fontSize: 12, fontWeight: 600 }}>
                  {explotacion.cultivo ?? '—'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.80)', fontSize: 12, fontWeight: 600 }}>
                  {explotacion.superficieHa?.toFixed(1) ?? '?'} ha totales
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.20)', background: 'rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <X size={14} color="rgba(255,255,255,0.80)" />
            </button>
          </div>
          {explotacion.refSig && (
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Ref. SIGPAC</div>
              <code style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.85)', fontFamily: "'SFMono-Regular','Consolas',monospace", letterSpacing: '0.02em' }}>{explotacion.refSig}</code>
            </div>
          )}
        </div>

        {/* Sub-header */}
        <div style={{ padding: '14px 24px 10px', borderBottom: '1px solid #f0f2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Parcelas vinculadas</span>
            {!loading && <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>{parcelas.length} {parcelas.length === 1 ? 'parcela' : 'parcelas'}</span>}
          </div>
        </div>

        {/* Parcelas list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>Cargando parcelas…</div>
          ) : parcelas.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: '#f0f7ec', border: '1px solid #d0e8c0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="30" height="30" viewBox="0 0 20 20" fill="none" stroke="#a0c890" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="2,5 10,2 18,5 18,16 10,19 2,16"/>
                  <line x1="10" y1="2" x2="10" y2="19"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Sin parcelas registradas</div>
                <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>Aún no hay parcelas vinculadas a esta explotación.</div>
              </div>
            </div>
          ) : parcelas.map(p => (
            <div key={p.id} style={{ padding: '14px 16px', borderRadius: 12, border: '1.5px solid #e8eaee', background: '#fafbfc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4, fontFamily: "'SFMono-Regular','Consolas',monospace", fontSize: 12, color: '#4a5568', background: '#f7f8fa', padding: '2px 8px', borderRadius: 6, border: '1px solid #e8eaee', display: 'inline-block' }}>{p.refCatastral ?? '—'}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{p.municipio ?? '—'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{p.numRecintos ?? 0}</div>
                  <div style={{ fontSize: 11.5, color: '#9ca3af', fontWeight: 500 }}>recintos</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
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
      <button
        onClick={onCrear}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 28px', background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(46,92,56,0.32)', marginTop: 4 }}
      >
        <PlusCircle size={17} color="#fff" />
        Crear primera explotación
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ExplotacionesPage() {
  const [explotaciones, setExplotaciones] = useState([])
  const [granjeros, setGranjeros] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [parcelaModal, setParcelaModal] = useState(null)
  const [drawer, setDrawer] = useState(null)

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

  function handleCreated(newExp) {
    setExplotaciones(prev => [...prev, newExp])
  }

  function handleParcelaCreated(explotacionId) {
    setExplotaciones(prev => prev.map(e =>
      e.id === explotacionId ? { ...e, numParcelas: (e.numParcelas ?? 0) + 1 } : e
    ))
  }

  const totalHa = explotaciones.reduce((a, e) => a + (e.superficieHa ?? 0), 0).toFixed(1)
  const cultivosDistintos = new Set(explotaciones.map(e => e.cultivo).filter(Boolean)).size
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
              onClick={() => setShowModal(true)}
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
                { label: 'Explotaciones registradas', value: explotaciones.length, iconBg: '#edf7e8', icon: <Map size={20} color="#4e9a5f" /> },
                { label: 'Superficie total gestionada', value: `${totalHa} ha`, iconBg: '#e8f5ef', icon: <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#3a7a60" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="2,5 10,2 18,5 18,16 10,19 2,16"/><line x1="10" y1="2" x2="10" y2="19"/></svg> },
                { label: 'Cultivos distintos', value: cultivosDistintos, iconBg: '#fdf6e0', icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#7a6a1e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2a7 7 0 100 14"/><path d="M10 2c0 0-4 4-4 7s4 7 4 7"/><path d="M10 2c0 0 4 4 4 7s-4 7-4 7"/><line x1="3" y1="9" x2="17" y2="9"/></svg> },
              ].map((kpi, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid transparent', display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: kpi.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {kpi.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{kpi.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table card */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid transparent', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #eceef5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Listado de Explotaciones</span>
                {!loading && explotaciones.length > 0 && (
                  <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>{explotaciones.length} registradas</span>
                )}
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#9ca3af', fontSize: 14 }}>Cargando explotaciones…</div>
            ) : explotaciones.length === 0 ? (
              <EmptyState onCrear={() => setShowModal(true)} />
            ) : (
              <div style={{ overflowX: 'auto' }}>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button
                                onClick={() => setDrawer(exp)}
                                title="Ver Parcelas"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', background: '#f0f4ff', border: '1px solid #b8c8f0', borderRadius: 10, color: '#2a4a8a', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                              >
                                <Eye size={14} color="#3a5aaa" />
                                Ver Parcelas
                              </button>
                              <button
                                onClick={() => setParcelaModal(exp)}
                                title="Añadir Parcela"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', background: '#f0faf3', border: '1px solid #a8d8b0', borderRadius: 10, color: '#267a40', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                              >
                                <PlusCircle size={14} color="#267a40" />
                                Añadir Parcela
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

      {showModal && (
        <NuevaExplotacionModal
          granjeros={granjeros}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {parcelaModal && (
        <NuevaParcelaModal
          explotacion={parcelaModal}
          onClose={() => setParcelaModal(null)}
          onCreated={() => handleParcelaCreated(parcelaModal.id)}
        />
      )}

      {drawer && (
        <ParcelasDrawer
          explotacion={drawer}
          onClose={() => setDrawer(null)}
        />
      )}
    </>
  )
}
