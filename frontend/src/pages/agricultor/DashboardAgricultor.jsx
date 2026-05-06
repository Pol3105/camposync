import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, Plus, ChevronRight, X } from 'lucide-react'
import AgricultorLayout from './AgricultorLayout'
import { granjero } from '../../services/api'

function greeting() {
  const h = new Date().getHours()
  if (h < 13) return 'Buenos días'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

function todayLabel() {
  return new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

function firstName(nombre) {
  return nombre?.split(' ')[0] ?? 'Agricultor'
}

function initials(nombre) {
  const p = (nombre ?? '').trim().split(' ')
  return p.length >= 2 ? p[0][0] + p[1][0] : (p[0]?.[0] ?? '?')
}

const ORIENT_EMOJI = { OL: '🫒', CE: '🌾', VI: '🍇', FS: '🌰', HO: '🥬', PA: '🌿' }

export default function DashboardAgricultor() {
  const navigate = useNavigate()
  const [fabOpen, setFabOpen]         = useState(false)
  const [explotaciones, setExp]       = useState([])
  const [tratamientos, setTrat]       = useState([])
  const [loading, setLoading]         = useState(true)

  const nombre = localStorage.getItem('nombre') || localStorage.getItem('username') || 'Agricultor'

  useEffect(() => {
    Promise.all([granjero.explotaciones(), granjero.tratamientos()])
      .then(([exps, trts]) => {
        setExp(exps ?? [])
        setTrat(trts ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const pendientes = tratamientos.filter(t => !t.validado)
  const recientes  = [...tratamientos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 3)

  return (
    <AgricultorLayout>
      {/* ── Header card ── */}
      <div
        style={{
          background: 'linear-gradient(145deg, #1c3829 0%, #2e5c38 60%, #3d7a4a 100%)',
          padding: '22px 20px 28px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', top: 20, right: 20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div className="flex items-start justify-between">
          <div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 2, textTransform: 'capitalize' }}>
              {todayLabel()}
            </p>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              {greeting()},{' '}
              <span style={{ color: '#a8e890' }}>{firstName(nombre)}</span> 👋
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', marginTop: 4 }}>
              Bienvenido a tu cuaderno de campo
            </p>
          </div>

          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: '#a8e890' }}>
              {initials(nombre).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats strip ──
          position:relative + zIndex:1 garantiza que las tarjetas pinten
          por encima del header aunque éste tenga position:relative + overflow:hidden
      */}
      <div style={{ padding: '0 16px', marginTop: -22, position: 'relative', zIndex: 1 }}>
        <div className="grid grid-cols-2 gap-3">
          <div style={{ background: '#fff', borderRadius: 18, padding: '12px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Explotaciones
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {loading ? '–' : explotaciones.length}
            </div>
            <div style={{ fontSize: 12, color: '#4e9a5f', fontWeight: 500, marginTop: 4 }}>
              {loading ? '' : `${explotaciones.reduce((a, e) => a + (e.numParcelas ?? 0), 0)} parcelas totales`}
            </div>
          </div>

          <div
            style={{
              background: pendientes.length > 0 ? '#fff8f2' : '#fff',
              borderRadius: 18,
              padding: '12px 14px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
              border: pendientes.length > 0 ? '1.5px solid #fdd8b4' : '1.5px solid transparent',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Pendientes
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: pendientes.length > 0 ? '#e07830' : '#111827', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {loading ? '–' : pendientes.length}
            </div>
            <div style={{ fontSize: 12, color: pendientes.length > 0 ? '#c25c10' : '#9ca3af', fontWeight: 500, marginTop: 4 }}>
              {loading ? '' : pendientes.length > 0 ? 'Sin validar por asesor' : 'Al día 🎉'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Cuaderno al día ── */}
      <div style={{ padding: '22px 16px 0' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>
            Cuaderno al día
          </h2>
          <button
            onClick={() => navigate('/cuaderno/tratamientos')}
            style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 600, color: '#4e9a5f', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Ver todo
            <ChevronRight size={14} color="#4e9a5f" />
          </button>
        </div>

        {loading ? (
          <div style={{ background: '#fff', borderRadius: 18, padding: '32px 20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>Cargando...</p>
          </div>
        ) : recientes.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 18, padding: '32px 20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>Sin tratamientos registrados</p>
            <p style={{ fontSize: 12.5, color: '#c8ccd8', marginTop: 4 }}>Pulsa + para añadir el primero</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recientes.map(t => {
              const fecha = new Date(t.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
              return (
                <div
                  key={t.id}
                  style={{ background: '#fff', borderRadius: 16, padding: '11px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 13 }}
                >
                  <div
                    style={{ width: 38, height: 38, borderRadius: 11, background: t.validado ? '#edf7e8' : '#fef9ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    {t.validado ? <CheckCircle size={18} color="#4e9a5f" /> : <Clock size={18} color="#d4a017" />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.productoNombre ?? t.aliasAgric ?? t.textoOriginal ?? '—'}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      {t.explotacionNombre} · Recinto {t.recintoNumero}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: t.validado ? '#edf7e8' : '#fef9ed', color: t.validado ? '#267a40' : '#8a6010', border: `1px solid ${t.validado ? '#c0e8b0' : '#f5d878'}`, whiteSpace: 'nowrap' }}>
                      {t.validado ? 'Validado' : 'Pendiente'}
                    </span>
                    <span style={{ fontSize: 11, color: '#c8ccd8', fontVariantNumeric: 'tabular-nums' }}>{fecha}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Explotaciones resumen ── */}
      <div style={{ padding: '22px 16px 12px' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>
            Mis Explotaciones
          </h2>
          <button
            onClick={() => navigate('/cuaderno/fincas')}
            style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 600, color: '#4e9a5f', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Ver todo
            <ChevronRight size={14} color="#4e9a5f" />
          </button>
        </div>
        {loading ? null : (
          <div className="flex flex-col gap-2.5">
            {explotaciones.map(e => (
              <button
                key={e.id}
                onClick={() => navigate(`/cuaderno/fincas/${e.id}`)}
                style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(145deg,#e4f5e0,#c8e8b8)', border: '1px solid #b0d890', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                  {ORIENT_EMOJI[e.orientacionProductiva] ?? '🌿'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                    {e.superficieTotal ? Number(e.superficieTotal).toFixed(2) : '—'} ha · {e.numParcelas} parcelas · {e.municipioExplotacion}
                  </div>
                </div>
                <ChevronRight size={16} color="#d1d5db" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── FAB ──
          position:fixed + right calculado con max() para respetar el
          contenedor centrado de 480px en escritorio:
          max(24px, (100vw - 480px)/2 + 24px)
          → en móvil (≤480px): 24px del borde del viewport
          → en escritorio: 24px del borde derecho del contenedor de 480px
      */}
      <button
        onClick={() => setFabOpen(true)}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 'max(24px, calc((100vw - 480px) / 2 + 24px))',
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)',
          border: 'none', boxShadow: '0 6px 20px rgba(46,92,56,0.45)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, transition: 'transform 0.15s',
        }}
        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)' }}
        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        <Plus size={24} color="#fff" strokeWidth={2.5} />
      </button>

      {fabOpen && (
        <NuevoTratamientoModal explotaciones={explotaciones} onClose={() => setFabOpen(false)} onCreado={() => { setFabOpen(false); granjero.tratamientos().then(t => setTrat(t ?? [])) }} />
      )}
    </AgricultorLayout>
  )
}

// ─── NuevoTratamientoModal ───────────────────────────────────────────────────
function NuevoTratamientoModal({ explotaciones, onClose, onCreado }) {
  const [expId, setExpId]     = useState('')
  const [parcelas, setParcelas] = useState([])
  const [parcelaId, setParcelaId] = useState('')
  const [recintos, setRecintos] = useState([])
  const [recintoId, setRecintoId] = useState('')
  const [inventario, setInv]  = useState([])
  const [form, setForm]       = useState({ productoFitosanitarioId: '', fecha: new Date().toISOString().slice(0, 10), dosis: '', unidades: 'l/ha', superficieTratada: '' })
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    granjero.inventario().then(i => setInv(i ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!expId) { setParcelas([]); setParcelaId(''); setRecintos([]); setRecintoId(''); return }
    granjero.parcelasPorExplotacion(expId).then(p => { setParcelas(p ?? []); setParcelaId(''); setRecintos([]); setRecintoId('') }).catch(() => {})
  }, [expId])

  useEffect(() => {
    if (!parcelaId) { setRecintos([]); setRecintoId(''); return }
    granjero.recintosPorParcela(parcelaId).then(r => { setRecintos(r ?? []); setRecintoId('') }).catch(() => {})
  }, [parcelaId])

  async function handleSubmit() {
    if (!recintoId || !form.productoFitosanitarioId || !form.fecha || !form.dosis) {
      setError('Completa todos los campos obligatorios')
      return
    }
    setSaving(true)
    setError('')
    try {
      await granjero.crearTratamiento({
        recintoId: Number(recintoId),
        productoFitosanitarioId: Number(form.productoFitosanitarioId),
        fecha: form.fecha,
        dosis: Number(form.dosis),
        unidades: form.unidades,
        superficieTratada: form.superficieTratada ? Number(form.superficieTratada) : null,
      })
      onCreado()
    } catch (e) {
      setError(e.message ?? 'Error al guardar')
      setSaving(false)
    }
  }

  const sel = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit', background: '#fafafa', color: '#111827', outline: 'none' }
  const inp = { ...sel }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: '20px 18px 32px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Nuevo Tratamiento</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} color="#9ca3af" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {/* Explotación */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>Explotación *</label>
            <select style={sel} value={expId} onChange={e => setExpId(e.target.value)}>
              <option value="">Seleccionar...</option>
              {explotaciones.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>

          {/* Parcela */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>Parcela *</label>
            <select style={sel} value={parcelaId} onChange={e => setParcelaId(e.target.value)} disabled={!expId}>
              <option value="">Seleccionar...</option>
              {parcelas.map(p => <option key={p.id} value={p.id}>{p.refCatastral} — {p.municipio}</option>)}
            </select>
          </div>

          {/* Recinto */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>Recinto *</label>
            <select style={sel} value={recintoId} onChange={e => setRecintoId(e.target.value)} disabled={!parcelaId}>
              <option value="">Seleccionar...</option>
              {recintos.map(r => <option key={r.id} value={r.id}>Recinto {r.numeroRecinto} — {r.superficie} ha {r.cultivo ? `(${r.cultivo})` : ''}</option>)}
            </select>
          </div>

          {/* Producto */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>Producto fitosanitario *</label>
            <select style={sel} value={form.productoFitosanitarioId} onChange={e => setForm(f => ({ ...f, productoFitosanitarioId: e.target.value }))}>
              <option value="">Seleccionar...</option>
              {inventario.map(i => <option key={i.productoFitosanitarioId} value={i.productoFitosanitarioId}>{i.aliasAgric ?? i.productoNombre}</option>)}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>Fecha *</label>
            <input style={inp} type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
          </div>

          {/* Dosis + Unidades */}
          <div className="flex gap-2">
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>Dosis *</label>
              <input style={inp} type="number" step="0.01" placeholder="Ej. 1.5" value={form.dosis} onChange={e => setForm(f => ({ ...f, dosis: e.target.value }))} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>Unidades</label>
              <select style={sel} value={form.unidades} onChange={e => setForm(f => ({ ...f, unidades: e.target.value }))}>
                <option>l/ha</option>
                <option>kg/ha</option>
                <option>cc/hl</option>
                <option>g/hl</option>
              </select>
            </div>
          </div>

          {/* Superficie */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>Superficie tratada (ha)</label>
            <input style={inp} type="number" step="0.01" placeholder="Opcional" value={form.superficieTratada} onChange={e => setForm(f => ({ ...f, superficieTratada: e.target.value }))} />
          </div>
        </div>

        {error && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 12, textAlign: 'center' }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{ marginTop: 20, width: '100%', padding: '13px', borderRadius: 14, background: saving ? '#9ca3af' : 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit' }}
        >
          {saving ? 'Guardando...' : 'Registrar Tratamiento'}
        </button>
      </div>
    </div>
  )
}
