import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, FlaskConical, Search, ChevronDown } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import { asesor } from '../services/api'

// ── Helpers ───────────────────────────────────────────────────────────────────
function estadoBadge(validado) {
  return validado
    ? { bg: '#edf7e8', color: '#267a40', border: '#c0e8b0', label: 'Validado',  Icon: CheckCircle }
    : { bg: '#fef9ed', color: '#8a6010', border: '#f5d878', label: 'Pendiente', Icon: Clock }
}

// ── Validar modal ─────────────────────────────────────────────────────────────
function ValidarModal({ tratamiento, onClose, onValidado }) {
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  async function handleValidar() {
    setSaving(true)
    try {
      await asesor.validarTratamiento(tratamiento.id, { validado: true, observacionesValidador: obs })
      setDone(true)
      setTimeout(() => { onValidado(tratamiento.id, obs); onClose() }, 600)
    } catch { setSaving(false) }
  }

  const nombre = tratamiento.aliasAgric || tratamiento.productoNombre

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,25,18,0.45)', backdropFilter: 'blur(2px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ width: 440, background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.20)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid #eceef5' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', letterSpacing: '-0.2px' }}>Validar Tratamiento</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 3 }}>
            <span style={{ fontWeight: 600, color: '#374151' }}>{nombre}</span>
            {' · '}{tratamiento.granjeroNombre || tratamiento.granjeroUsername}
          </div>
        </div>
        <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>
              Observaciones del validador <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span>
            </label>
            <textarea
              value={obs}
              onChange={e => setObs(e.target.value)}
              rows={3}
              placeholder="Ej. Producto aplicado correctamente. Dosis dentro de los límites."
              style={{ width: '100%', padding: '9px 13px', borderRadius: 10, border: '1.5px solid #d1d5db', fontSize: 13.5, color: '#111827', fontFamily: 'inherit', background: '#fafafa', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div style={{ padding: '16px 26px', borderTop: '1px solid #eceef5', background: '#fafbfc', display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '11px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 12, color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleValidar}
            disabled={saving || done}
            style={{ flex: 2, padding: '11px', background: done ? '#4e9a5f' : 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(46,92,56,0.25)' }}
          >
            {done ? '¡Validado!' : saving ? 'Validando…' : 'Confirmar validación'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TratamientosPage() {
  const [tratamientos, setTratamientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [validarTarget, setValidarTarget] = useState(null)
  const navigate = useNavigate()

  // Filters
  const [filtroGranjero, setFiltroGranjero] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [busqueda, setBusqueda] = useState('')

  const fetchTratamientos = useCallback(async () => {
    setLoading(true)
    try {
      const data = await asesor.tratamientos()
      setTratamientos(data ?? [])
    } catch { /* handled globally */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTratamientos() }, [fetchTratamientos])

  // Unique granjeros for filter dropdown
  const granjeros = useMemo(() => {
    const seen = new Set()
    return tratamientos.filter(t => {
      if (seen.has(t.granjeroUsername)) return false
      seen.add(t.granjeroUsername)
      return true
    }).map(t => ({ username: t.granjeroUsername, nombre: t.granjeroNombre || t.granjeroUsername }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [tratamientos])

  // Apply filters
  const filtered = useMemo(() => {
    const q = busqueda.toLowerCase()
    return tratamientos.filter(t => {
      if (filtroGranjero && t.granjeroUsername !== filtroGranjero) return false
      if (filtroEstado === 'VALIDADO'  && !t.validado) return false
      if (filtroEstado === 'PENDIENTE' && t.validado)  return false
      if (q) {
        const name = (t.aliasAgric || t.productoNombre || '').toLowerCase()
        if (!name.includes(q)) return false
      }
      return true
    })
  }, [tratamientos, filtroGranjero, filtroEstado, busqueda])

  // KPIs (from all, not filtered)
  const total     = tratamientos.length
  const validados = tratamientos.filter(t => t.validado).length
  const pendientes = total - validados

  function handleValidado(id, obs) {
    setTratamientos(prev => prev.map(t =>
      t.id === id ? { ...t, validado: true, observacionesValidador: obs } : t
    ))
  }

  const rp = '11px 18px'
  const hasFilters = filtroGranjero || filtroEstado !== 'TODOS' || busqueda

  return (
    <>
      <AppLayout title="Tratamientos" searchPlaceholder="Buscar tratamiento…">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Page header */}
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px' }}>Torre de Control · Tratamientos</div>
            <div style={{ fontSize: 13.5, color: '#9ca3af', marginTop: 3 }}>Supervisa y valida todos los tratamientos de tu asesoría</div>
          </div>

          {/* KPI strip */}
          {!loading && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {[
                { label: 'Total registrados', value: total,     iconBg: '#f0f4ff', icon: <FlaskConical size={20} color="#3a5aaa" /> },
                { label: 'Validados',          value: validados,  iconBg: '#edf7e8', icon: <CheckCircle size={20} color="#267a40" /> },
                { label: 'Pendientes de validar', value: pendientes, iconBg: pendientes > 0 ? '#fef9ed' : '#f3f4f6', icon: <Clock size={20} color={pendientes > 0 ? '#8a6010' : '#9ca3af'} /> },
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

          {/* Filter bar */}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ flex: '1 1 200px', position: 'relative', minWidth: 180 }}>
              <Search size={14} color="#9ca3af" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por producto…"
                style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13.5, color: '#111827', fontFamily: 'inherit', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Agricultor dropdown */}
            <div style={{ position: 'relative', minWidth: 180 }}>
              <select
                value={filtroGranjero}
                onChange={e => setFiltroGranjero(e.target.value)}
                style={{ appearance: 'none', width: '100%', padding: '8px 32px 8px 12px', borderRadius: 9, border: '1.5px solid #e5e7eb', fontSize: 13.5, color: filtroGranjero ? '#111827' : '#9ca3af', fontFamily: 'inherit', background: '#fafafa', outline: 'none', cursor: 'pointer' }}
              >
                <option value="">Todos los agricultores</option>
                {granjeros.map(g => (
                  <option key={g.username} value={g.username}>{g.nombre}</option>
                ))}
              </select>
              <ChevronDown size={13} color="#9ca3af" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>

            {/* Estado buttons */}
            <div style={{ display: 'flex', gap: 6, background: '#f3f4f6', borderRadius: 9, padding: 4 }}>
              {[
                { key: 'TODOS',    label: 'Todos' },
                { key: 'PENDIENTE',label: 'Pendientes' },
                { key: 'VALIDADO', label: 'Validados' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFiltroEstado(key)}
                  style={{ padding: '6px 14px', borderRadius: 7, border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: filtroEstado === key ? '#fff' : 'transparent', color: filtroEstado === key ? '#111827' : '#9ca3af', boxShadow: filtroEstado === key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none', transition: 'all 0.15s' }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Clear filters */}
            {hasFilters && (
              <button
                onClick={() => { setFiltroGranjero(''); setFiltroEstado('TODOS'); setBusqueda('') }}
                style={{ padding: '7px 13px', borderRadius: 9, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 12.5, fontWeight: 600, color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Table card */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 22px', borderBottom: '1px solid #eceef5', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Historial Global</span>
              {!loading && (
                <span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>
                  {filtered.length} {filtered.length !== total ? `de ${total} ` : ''}tratamiento{filtered.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: '#9ca3af', fontSize: 14 }}>
                Cargando tratamientos…
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 220, gap: 12 }}>
                <FlaskConical size={40} color="#d1d5db" />
                <div style={{ fontSize: 15, fontWeight: 600, color: '#9ca3af' }}>
                  {hasFilters ? 'Sin resultados para los filtros aplicados' : 'No hay tratamientos registrados'}
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f7f8fc' }}>
                      {['Fecha', 'Agricultor', 'Explotación', 'Parcela / Recinto', 'Producto', 'Dosis', 'Estado', ''].map((h, i) => (
                        <th key={i} style={{ padding: '10px 18px', textAlign: 'left', borderBottom: '1px solid #eceef5', fontSize: 11.5, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t, i) => {
                      const badge = estadoBadge(t.validado)
                      const BadgeIcon = badge.Icon
                      const displayName = t.aliasAgric || t.productoNombre

                      return (
                        <tr key={t.id} style={{ background: i % 2 === 1 ? '#fafbfe' : 'transparent' }}>

                          {/* Fecha */}
                          <td style={{ padding: rp, borderBottom: '1px solid #eceef5', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                              {t.fecha
                                ? new Date(t.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '—'}
                            </span>
                          </td>

                          {/* Agricultor */}
                          <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{t.granjeroNombre || '—'}</div>
                            <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 1 }}>{t.granjeroUsername}</div>
                          </td>

                          {/* Explotación */}
                          <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{t.explotacionNombre ?? '—'}</span>
                          </td>

                          {/* Parcela / Recinto */}
                          <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                            {t.parcelaRefCatastral ? (
                              <>
                                <code style={{ fontSize: 11.5, color: '#4a5568', background: '#f7f8fa', padding: '2px 7px', borderRadius: 5, border: '1px solid #e8eaee', fontFamily: "'SFMono-Regular','Consolas',monospace", whiteSpace: 'nowrap', display: 'block', marginBottom: 3 }}>
                                  {t.parcelaRefCatastral}
                                </code>
                                {t.recintoNumero != null && (
                                  <span style={{ fontSize: 11.5, color: '#6b7280', fontWeight: 500 }}>
                                    Recinto {t.recintoNumero}{t.recintoCultivo ? ` · ${t.recintoCultivo}` : ''}
                                  </span>
                                )}
                              </>
                            ) : <span style={{ color: '#c8ccd8' }}>—</span>}
                          </td>

                          {/* Producto */}
                          <td style={{ padding: rp, borderBottom: '1px solid #eceef5', maxWidth: 200 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{displayName}</div>
                            {t.aliasAgric && (
                              <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 1 }}>{t.productoNombre}</div>
                            )}
                          </td>

                          {/* Dosis */}
                          <td style={{ padding: rp, borderBottom: '1px solid #eceef5', whiteSpace: 'nowrap' }}>
                            {t.dosis ? (
                              <>
                                <span style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{t.dosis}</span>
                                <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 4 }}>{t.unidades ?? ''}</span>
                              </>
                            ) : <span style={{ color: '#c8ccd8', fontSize: 13 }}>—</span>}
                          </td>

                          {/* Estado */}
                          <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 12, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                              <BadgeIcon size={11} />
                              {badge.label}
                            </span>
                          </td>

                          {/* Acción rápida */}
                          <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                            {!t.validado && (
                              <button
                                onClick={() => navigate(`/tratamientos/${t.id}/revision`, { state: { tratamiento: t } })}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px', background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 9, color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(46,92,56,0.25)' }}
                              >
                                <CheckCircle size={13} color="#fff" />
                                Validar
                              </button>
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

      {validarTarget && (
        <ValidarModal
          tratamiento={validarTarget}
          onClose={() => setValidarTarget(null)}
          onValidado={handleValidado}
        />
      )}
    </>
  )
}
