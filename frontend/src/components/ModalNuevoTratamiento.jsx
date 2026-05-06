import { useState, useEffect } from 'react'
import { granjero } from '../services/api'

const GREEN_DARK = '#1c3829'
const GREEN_MID  = '#2e5c38'
const GREEN_ACT  = '#4e9a5f'

const UNIDADES = ['L/ha', 'kg/ha', 'mL/ha', 'g/ha', 'L', 'kg']

export default function ModalNuevoTratamiento({ onClose, onCreado, preselect }) {
  const [explotaciones, setExplotaciones] = useState([])
  const [parcelas,      setParcelas]      = useState([])
  const [recintos,      setRecintos]      = useState([])
  const [inventario,    setInventario]    = useState([])

  const [cargandoParcelas, setCargandoParcelas] = useState(false)
  const [cargandoRecintos, setCargandoRecintos] = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [enviando,  setEnviando]  = useState(false)
  const [error,     setError]     = useState(null)

  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    explotacionId: preselect?.explotacionId ?? '',
    parcelaId:     preselect?.parcelaId     ?? '',
    recintoId:     preselect?.recintoId     ?? '',
    inventarioId:  '',
    dosis:         '',
    unidades:      'L/ha',
    fecha:         today,
    superficieTratada: '',
    plagaObjetivo:     '',
  })

  useEffect(() => {
    if (preselect) {
      Promise.all([
        granjero.explotaciones(),
        granjero.inventario(),
        granjero.parcelasPorExplotacion(preselect.explotacionId),
        granjero.recintosPorParcela(preselect.parcelaId),
      ])
        .then(([exp, inv, parcs, recs]) => {
          setExplotaciones(exp)
          setInventario(inv)
          setParcelas(parcs)
          setRecintos(recs)
        })
        .catch(() => setError('No se pudieron cargar los datos del formulario.'))
        .finally(() => setLoading(false))
    } else {
      Promise.all([granjero.explotaciones(), granjero.inventario()])
        .then(([exp, inv]) => { setExplotaciones(exp); setInventario(inv) })
        .catch(() => setError('No se pudieron cargar los datos del formulario.'))
        .finally(() => setLoading(false))
    }
  }, [])

  function handleExplotacionChange(explotacionId) {
    set('explotacionId', explotacionId)
    set('parcelaId', '')
    set('recintoId', '')
    setParcelas([])
    setRecintos([])
    if (!explotacionId) return

    setCargandoParcelas(true)
    granjero.parcelasPorExplotacion(explotacionId)
      .then(data => setParcelas(data))
      .catch(() => setError('No se pudieron cargar las parcelas.'))
      .finally(() => setCargandoParcelas(false))
  }

  function handleParcelaChange(parcelaId) {
    set('parcelaId', parcelaId)
    set('recintoId', '')
    setRecintos([])
    if (!parcelaId) return

    setCargandoRecintos(true)
    granjero.recintosPorParcela(parcelaId)
      .then(data => {
        setRecintos(data)
        if (data.length === 1) set('recintoId', String(data[0].id))
      })
      .catch(() => setError('No se pudieron cargar los recintos.'))
      .finally(() => setCargandoRecintos(false))
  }

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      const itemInv = inventario.find(i => String(i.id) === String(form.inventarioId))
      const body = {
        recintoId:               Number(form.recintoId),
        productoFitosanitarioId: itemInv.productoFitosanitarioId,
        dosis:                   parseFloat(form.dosis),
        unidades:                form.unidades,
        fecha:                   form.fecha,
        superficieTratada:       parseFloat(form.superficieTratada),
        plagaObjetivo:           form.plagaObjetivo || null,
      }
      const nuevo = await granjero.crearTratamiento(body)
      onCreado(nuevo)
    } catch (err) {
      setError(err?.message ?? 'Error al guardar el tratamiento.')
    } finally {
      setEnviando(false)
    }
  }

  const camposOk =
    form.recintoId && form.inventarioId &&
    form.dosis && form.superficieTratada && form.fecha

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 430,
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          padding: '0 0 32px',
          fontFamily: "'Inter',system-ui,sans-serif",
          maxHeight: '92dvh',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e5e7eb' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px' }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: GREEN_DARK, margin: 0 }}>Nuevo tratamiento</p>
          <button
            onClick={onClose}
            style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0' }}>Cargando…</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* 1. Explotación */}
            {preselect ? (
              <Field label="🔒 Explotación">
                <div style={lockedStyle}>
                  {explotaciones.find(e => String(e.id) === preselect.explotacionId)?.nombre ?? '…'}
                </div>
              </Field>
            ) : (
              <Field label="Explotación">
                <select
                  required
                  value={form.explotacionId}
                  onChange={e => handleExplotacionChange(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Selecciona una explotación…</option>
                  {explotaciones.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </Field>
            )}

            {/* 2. Parcela */}
            {preselect ? (
              <Field label="🔒 Parcela SIGPAC">
                <div style={lockedStyle}>
                  {parcelas.find(p => String(p.id) === preselect.parcelaId)?.refCatastral ?? '…'}
                </div>
              </Field>
            ) : (
              <Field label="Parcela SIGPAC">
                <select
                  required
                  disabled={!form.explotacionId || cargandoParcelas}
                  value={form.parcelaId}
                  onChange={e => handleParcelaChange(e.target.value)}
                  style={{ ...selectStyle, opacity: !form.explotacionId ? 0.5 : 1 }}
                >
                  <option value="">
                    {cargandoParcelas
                      ? 'Cargando parcelas…'
                      : !form.explotacionId
                        ? 'Primero selecciona una explotación'
                        : parcelas.length === 0
                          ? 'Sin parcelas en esta explotación'
                          : 'Selecciona una parcela…'}
                  </option>
                  {parcelas.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.refCatastral ?? `Parcela ${p.id}`}{p.municipio ? ` — ${p.municipio}` : ''}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {/* 3. Recinto */}
            {preselect ? (
              <Field label="🔒 Recinto">
                <div style={lockedStyle}>
                  {(() => {
                    const r = recintos.find(r => String(r.id) === preselect.recintoId)
                    if (!r) return '…'
                    return `Recinto ${r.numeroRecinto}${r.cultivo ? ' · ' + r.cultivo : ''}${r.superficie ? ' · ' + Number(r.superficie).toFixed(2) + ' ha' : ''}`
                  })()}
                </div>
              </Field>
            ) : (
              <Field label="Recinto">
                <select
                  required
                  disabled={!form.parcelaId || cargandoRecintos}
                  value={form.recintoId}
                  onChange={e => set('recintoId', e.target.value)}
                  style={{ ...selectStyle, opacity: !form.parcelaId ? 0.5 : 1 }}
                >
                  <option value="">
                    {cargandoRecintos
                      ? 'Cargando recintos…'
                      : !form.parcelaId
                        ? 'Primero selecciona una parcela'
                        : recintos.length === 0
                          ? 'Sin recintos en esta parcela'
                          : 'Selecciona un recinto…'}
                  </option>
                  {recintos.map(r => (
                    <option key={r.id} value={r.id}>
                      Recinto {r.numeroRecinto}
                      {r.cultivo ? ` · ${r.cultivo}` : ''}
                      {r.superficie ? ` · ${Number(r.superficie).toFixed(2)} ha` : ''}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {/* 4. Producto desde inventario */}
            <Field label="Producto (tu inventario)">
              {inventario.length === 0 ? (
                <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>
                  No tienes productos en tu inventario. Añade uno antes de registrar un tratamiento.
                </p>
              ) : (
                <select
                  required
                  value={form.inventarioId}
                  onChange={e => set('inventarioId', e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Selecciona un producto de tu stock…</option>
                  {inventario.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.productoNombre}
                      {item.aliasAgric ? ` (${item.aliasAgric})` : ''}
                      {' — '}{item.stockAct} uds. en stock
                    </option>
                  ))}
                </select>
              )}
            </Field>

            {/* 5. Dosis + Unidades */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Dosis">
                <input
                  required type="number" min="0.01" step="any"
                  placeholder="Ej. 2.5"
                  value={form.dosis}
                  onChange={e => set('dosis', e.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Unidades">
                <select
                  value={form.unidades}
                  onChange={e => set('unidades', e.target.value)}
                  style={selectStyle}
                >
                  {UNIDADES.map(u => <option key={u}>{u}</option>)}
                </select>
              </Field>
            </div>

            {/* 6. Superficie */}
            <Field label="Superficie tratada (ha)">
              <input
                required type="number" min="0.01" step="any"
                placeholder="Ej. 1.2"
                value={form.superficieTratada}
                onChange={e => set('superficieTratada', e.target.value)}
                style={inputStyle}
              />
            </Field>

            {/* 7. Fecha */}
            <Field label="Fecha de aplicación">
              <input
                required type="date"
                value={form.fecha}
                onChange={e => set('fecha', e.target.value)}
                style={inputStyle}
              />
            </Field>

            {/* 8. Plaga (opcional) */}
            <Field label="Plaga objetivo (opcional)">
              <input
                type="text"
                placeholder="Ej. Mildiu, Pulgón…"
                value={form.plagaObjetivo}
                onChange={e => set('plagaObjetivo', e.target.value)}
                style={inputStyle}
              />
            </Field>

            {error && (
              <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={!camposOk || enviando}
              style={{
                marginTop: 4,
                padding: '14px 0',
                borderRadius: 14,
                border: 'none',
                background: camposOk && !enviando
                  ? `linear-gradient(135deg, ${GREEN_MID}, ${GREEN_ACT})`
                  : '#e5e7eb',
                color: camposOk && !enviando ? '#fff' : '#9ca3af',
                fontSize: 15,
                fontWeight: 700,
                cursor: camposOk && !enviando ? 'pointer' : 'default',
                transition: 'background 0.2s',
              }}
            >
              {enviando ? 'Guardando…' : 'Registrar tratamiento'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  padding: '11px 13px',
  borderRadius: 12,
  border: '1.5px solid #e5e7eb',
  fontSize: 14,
  color: '#111827',
  background: '#f9fafb',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
}

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 32,
}

const lockedStyle = {
  padding: '11px 13px',
  borderRadius: 12,
  border: '1.5px solid #e5e7eb',
  fontSize: 14,
  color: '#111827',
  background: '#f3f4f6',
  width: '100%',
  boxSizing: 'border-box',
  cursor: 'default',
}
