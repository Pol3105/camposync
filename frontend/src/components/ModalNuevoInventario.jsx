import { useState, useEffect } from 'react'
import { granjero } from '../services/api'

const GREEN_DARK = '#1c3829'
const GREEN_MID  = '#2e5c38'
const GREEN_ACT  = '#4e9a5f'

export default function ModalNuevoInventario({ onClose, onCreado }) {
  const [productos, setProductos] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [enviando,  setEnviando]  = useState(false)
  const [error,     setError]     = useState(null)

  const [form, setForm] = useState({
    productoFitoId: '',
    aliasAgric:     '',
    stockAct:       '',
    unidadMedida:   'L',
  })

  useEffect(() => {
    granjero.productosOficiales()
      .then(data => setProductos(data ?? []))
      .catch(() => setError('No se pudo cargar el catálogo de productos.'))
      .finally(() => setLoading(false))
  }, [])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const selectedProducto = productos.find(p => String(p.id) === String(form.productoFitoId))

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      const body = {
        productoFitoId: Number(form.productoFitoId),
        stockAct:       parseFloat(form.stockAct),
        unidadMedida:   form.unidadMedida || null,
        aliasAgric:     form.aliasAgric.trim() || null,
      }
      const nuevo = await granjero.crearInventario(body)
      onCreado(nuevo)
    } catch (err) {
      setError(err?.message ?? 'Error al guardar en el inventario.')
    } finally {
      setEnviando(false)
    }
  }

  const camposOk = form.productoFitoId && form.stockAct && parseFloat(form.stockAct) > 0

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
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
          <p style={{ fontSize: 17, fontWeight: 700, color: GREEN_DARK, margin: 0 }}>Añadir al inventario</p>
          <button
            onClick={onClose}
            style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0' }}>Cargando catálogo…</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* 1. Producto oficial */}
            <Field label="Producto oficial (catálogo MAPA)">
              {productos.length === 0 ? (
                <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>
                  No hay productos activos en el catálogo.
                </p>
              ) : (
                <select
                  required
                  value={form.productoFitoId}
                  onChange={e => set('productoFitoId', e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Selecciona un producto…</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}{p.principioAct ? ` — ${p.principioAct}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            {/* Chip with registration number if selected */}
            {selectedProducto?.numReg && (
              <div style={{ marginTop: -6, padding: '6px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                Nº Reg. MAPA: {selectedProducto.numReg}
              </div>
            )}

            {/* 2. Alias propio (opcional) */}
            <Field label="Nombre propio (opcional)">
              <input
                type="text"
                placeholder="Ej. Veneno para la viña"
                value={form.aliasAgric}
                onChange={e => set('aliasAgric', e.target.value)}
                style={inputStyle}
              />
              <p style={{ fontSize: 11.5, color: '#c8ccd8', margin: '3px 0 0 2px' }}>
                Si lo dejas vacío, se usará el nombre oficial del catálogo.
              </p>
            </Field>

            {/* 3. Stock inicial + unidad */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Stock inicial
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder="Ej. 50"
                  value={form.stockAct}
                  onChange={e => set('stockAct', e.target.value)}
                  style={inputStyle}
                />
                <select
                  value={form.unidadMedida}
                  onChange={e => set('unidadMedida', e.target.value)}
                  style={{ ...selectStyle, width: 90 }}
                >
                  <option value="L">L — Litros</option>
                  <option value="Kg">Kg — Kilos</option>
                  <option value="ml">ml — Mililitros</option>
                  <option value="g">g — Gramos</option>
                  <option value="uds">uds.</option>
                </select>
              </div>
              <p style={{ fontSize: 11.5, color: '#c8ccd8', margin: '3px 0 0 2px' }}>
                Si el producto ya está en tu inventario, esta cantidad se sumará al stock actual.
              </p>
            </div>

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
              {enviando ? 'Guardando…' : 'Añadir al inventario'}
            </button>

            {/* Spacer so button clears the bottom nav */}
            <div style={{ height: 72 }} />
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
