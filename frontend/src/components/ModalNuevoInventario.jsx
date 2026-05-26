import { useState, useEffect } from 'react'
import { granjero } from '../services/api'
import { Search } from 'lucide-react'

const GREEN_DARK = '#1c3829'
const GREEN_MID  = '#2e5c38'
const GREEN_ACT  = '#4e9a5f'

/** Mirror of backend InventarioService.deriveUnidad */
function deriveUnidad(unidadDosisOficial) {
  if (!unidadDosisOficial) return null
  const lower = unidadDosisOficial.toLowerCase()
  if (lower.includes('kg') || lower.match(/\bg\//)) return 'Kg'
  if (lower.includes('ml'))  return 'ml'
  if (lower.includes('l/') || lower.includes('l ') || lower.endsWith('l')) return 'L'
  return null
}

export default function ModalNuevoInventario({ onClose, onCreado, productoPreseleccionado }) {
  const [productos, setProductos] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [enviando,  setEnviando]  = useState(false)
  const [error,     setError]     = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState(null)
  
  const [selectedProducto, setSelectedProducto] = useState(productoPreseleccionado ? {
    id: productoPreseleccionado.productoFitosanitarioId,
    nombre: productoPreseleccionado.productoNombre,
    principioAct: productoPreseleccionado.principioAct,
    numReg: productoPreseleccionado.numReg,
    unidadDosisOficial: productoPreseleccionado.unidadDosisOficial
  } : null)

  const [form, setForm] = useState({
    productoFitoId: productoPreseleccionado ? String(productoPreseleccionado.productoFitosanitarioId) : '',
    aliasAgric:     productoPreseleccionado ? (productoPreseleccionado.aliasAgric ?? '') : '',
    stockAct:       '',
  })

  useEffect(() => {
    setLoading(false)
  }, [])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSearchChange(val) {
    setSearchQuery(val)
    if (searchTimeout) clearTimeout(searchTimeout)

    if (val.trim().length < 2) {
      setProductos([])
      return
    }

    setSearching(true)
    const timeout = setTimeout(() => {
      granjero.buscarProductosOficiales(val.trim())
        .then(data => setProductos(data ?? []))
        .catch(() => {})
        .finally(() => setSearching(false))
    }, 250)

    setSearchTimeout(timeout)
  }

  function handleSelectProduct(p) {
    setSelectedProducto(p)
    set('productoFitoId', String(p.id))
    // Auto-prefill the agricultural alias with the official product name
    set('aliasAgric', p.nombre)
    // Clear search query and results so list closes
    setProductos([])
    setSearchQuery('')
  }

  function handleClearSelection() {
    setSelectedProducto(null)
    set('productoFitoId', '')
    set('aliasAgric', '')
  }

  const unidadHint = productoPreseleccionado
    ? deriveUnidad(productoPreseleccionado.unidadDosisOficial)
    : selectedProducto ? deriveUnidad(selectedProducto.unidadDosisOficial) : null

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      const body = {
        productoFitoId: Number(form.productoFitoId),
        stockAct:       parseFloat(form.stockAct),
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

  const camposOk = productoPreseleccionado
    ? form.stockAct && parseFloat(form.stockAct) > 0
    : form.productoFitoId && form.stockAct && parseFloat(form.stockAct) > 0

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
          <p style={{ fontSize: 17, fontWeight: 700, color: GREEN_DARK, margin: 0 }}>{productoPreseleccionado ? 'Sumar stock' : 'Añadir al inventario'}</p>
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
            {productoPreseleccionado ? (
              <Field label="Producto oficial (catálogo MAPA)">
                <div style={{ ...inputStyle, background: '#f3f4f6', color: '#374151' }}>
                  <div style={{ fontWeight: 700 }}>{productoPreseleccionado.productoNombre}</div>
                  {productoPreseleccionado.principioAct && (
                    <div style={{ fontSize: 12, fontStyle: 'italic', marginTop: 2 }}>{productoPreseleccionado.principioAct}</div>
                  )}
                </div>
              </Field>
            ) : (
              <>
                {!selectedProducto ? (
                  <Field label="Buscar Producto Oficial (MAPA)">
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Ej. Cúprico, Glifosato, Manzano pulgón..."
                        value={searchQuery}
                        onChange={e => handleSearchChange(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: 38 }}
                      />
                      <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                    {searching && (
                      <p style={{ fontSize: 12, color: GREEN_ACT, fontWeight: 600, margin: '2px 0 0 2px' }}>Buscando coincidencias…</p>
                    )}
                  </Field>
                ) : (
                  <Field label="Producto Oficial Seleccionado">
                    <div style={{
                      padding: '12px 14px',
                      background: '#edf7e8',
                      border: '1.5px solid #c0e8b0',
                      borderRadius: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#155724', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selectedProducto.nombre}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#2b5a30', marginTop: 2 }}>
                          {selectedProducto.principioAct ? `${selectedProducto.principioAct} · ` : ''}Nº Reg: {selectedProducto.numReg}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        style={{
                          background: '#fff',
                          border: '1px solid #c0e8b0',
                          borderRadius: 10,
                          width: 28,
                          height: 28,
                          color: '#721c24',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </Field>
                )}

                {/* Search Results list */}
                {productos.length > 0 && !selectedProducto && (
                  <div style={{
                    border: '1.5px solid #e5e7eb',
                    borderRadius: 12,
                    background: '#f9fafb',
                    maxHeight: 180,
                    overflowY: 'auto',
                    marginTop: -6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    {productos.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid #f3f4f6',
                          cursor: 'pointer',
                          fontSize: 13,
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => e.target.style.background = '#edf7e8'}
                        onMouseLeave={e => e.target.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: 700, color: '#111827' }}>{p.nombre}</div>
                        {p.principioAct && (
                          <div style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic', marginTop: 1 }}>{p.principioAct}</div>
                        )}
                        {p.numReg && (
                          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>Nº Reg: {p.numReg}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Product meta chips */}
                {selectedProducto && (
                  <div style={{ marginTop: -6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedProducto.numReg && (
                      <span style={{ padding: '5px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                        Nº Reg. {selectedProducto.numReg}
                      </span>
                    )}
                    {selectedProducto.unidadDosisOficial && (
                      <span style={{ padding: '5px 10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 12, color: '#2563eb', fontWeight: 600 }}>
                        Dosis oficial: {selectedProducto.unidadDosisOficial}
                      </span>
                    )}
                  </div>
                )}

                {/* 2. Alias propio (opcional) */}
                <Field label="Nombre propio / Alias (opcional)">
                  <input
                    type="text"
                    placeholder="Ej. Fungicida para la viña"
                    value={form.aliasAgric}
                    onChange={e => set('aliasAgric', e.target.value)}
                    style={inputStyle}
                  />
                  <p style={{ fontSize: 11.5, color: '#c8ccd8', margin: '3px 0 0 2px' }}>
                    Si lo dejas vacío, se usará el nombre oficial del catálogo.
                  </p>
                </Field>
              </>
            )}

            {/* 3. Stock inicial / Cantidad a añadir */}
            <Field label={productoPreseleccionado
              ? (unidadHint ? `Cantidad a añadir (${unidadHint})` : 'Cantidad a añadir')
              : (unidadHint ? `Stock inicial (${unidadHint})` : 'Stock inicial')}>
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
              <p style={{ fontSize: 11.5, color: '#c8ccd8', margin: '3px 0 0 2px' }}>
                {unidadHint
                  ? `Stock a añadir en: ${unidadHint}. Si el producto ya existe, se sumará al stock actual.`
                  : 'Si el producto ya está en tu inventario, esta cantidad se sumará al stock actual.'}
              </p>
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
              {enviando ? 'Guardando…' : productoPreseleccionado ? 'Sumar unidades' : 'Añadir al inventario'}
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
