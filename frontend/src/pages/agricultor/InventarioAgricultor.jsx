import { useState, useEffect } from 'react'
import { FlaskConical, AlertTriangle, CheckCircle2 } from 'lucide-react'
import AgricultorLayout from './AgricultorLayout'
import ModalNuevoInventario from '../../components/ModalNuevoInventario'
import { granjero } from '../../services/api'

const LOW_STOCK_THRESHOLD = 5

function stockColor(stock) {
  if (stock <= 0)                    return { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
  if (stock < LOW_STOCK_THRESHOLD)   return { color: '#d97706', bg: '#fffbeb', border: '#fde68a' }
  return                                    { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }
}

export default function InventarioAgricultor() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)

  useEffect(() => {
    granjero.inventario()
      .then(data => setItems((data ?? []).sort((a, b) =>
        (a.aliasAgric ?? a.productoNombre ?? '').localeCompare(b.aliasAgric ?? b.productoNombre ?? '')
      )))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleCreado(nuevoItem) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === nuevoItem.id)
      if (idx >= 0) {
        // upsert — update existing entry in list
        const updated = [...prev]
        updated[idx] = nuevoItem
        return updated.sort((a, b) => (a.aliasAgric ?? a.productoNombre ?? '').localeCompare(b.aliasAgric ?? b.productoNombre ?? ''))
      }
      return [...prev, nuevoItem].sort((a, b) => (a.aliasAgric ?? a.productoNombre ?? '').localeCompare(b.aliasAgric ?? b.productoNombre ?? ''))
    })
    setModal(false)
  }

  const sinStock = items.filter(i => i.stockAct <= 0).length
  const bajoStock = items.filter(i => i.stockAct > 0 && i.stockAct < LOW_STOCK_THRESHOLD).length

  return (
    <AgricultorLayout>
      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(145deg, #1c3829 0%, #2e5c38 100%)', padding: '20px 18px 24px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', marginBottom: 2 }}>
          Inventario
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', marginBottom: 16 }}>
          {loading ? '…' : `${items.length} producto${items.length !== 1 ? 's' : ''} registrados`}
        </p>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'Total',       value: items.length,         color: 'rgba(255,255,255,0.90)' },
            { label: 'Stock bajo',  value: bajoStock,            color: bajoStock  > 0 ? '#fbbf24' : 'rgba(255,255,255,0.90)' },
            { label: 'Sin stock',   value: sinStock,             color: sinStock   > 0 ? '#f87171' : 'rgba(255,255,255,0.90)' },
          ].map(k => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.10)', borderRadius: 12, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: k.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {loading ? '–' : k.value}
              </div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.50)', marginTop: 3 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div style={{ padding: '16px 16px 12px' }}>
        {loading ? (
          <div style={{ background: '#fff', borderRadius: 18, padding: '40px 24px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>Cargando…</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 18, padding: '40px 24px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <FlaskConical size={40} color="#d1d5db" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Sin productos en inventario</p>
            <p style={{ fontSize: 12.5, color: '#9ca3af' }}>Añade productos fitosanitarios para poder registrar tratamientos.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map(item => {
              const sc      = stockColor(item.stockAct)
              const alias   = item.aliasAgric || item.productoNombre
              const nombre  = item.aliasAgric ? item.productoNombre : null
              const bajo    = item.stockAct > 0 && item.stockAct < LOW_STOCK_THRESHOLD
              const agotado = item.stockAct <= 0

              return (
                <div
                  key={item.id}
                  style={{
                    background: '#fff',
                    borderRadius: 18,
                    padding: '14px 16px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                    borderLeft: `4px solid ${sc.border}`,
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', lineHeight: 1.3, marginBottom: 2 }}>
                        {alias}
                      </div>
                      {nombre && (
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {nombre}
                        </div>
                      )}
                      {item.principioAct && (
                        <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 3, fontStyle: 'italic' }}>
                          {item.principioAct}
                        </div>
                      )}
                    </div>

                    {/* Stock badge */}
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: sc.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                        {Number.isInteger(item.stockAct) ? item.stockAct : item.stockAct.toFixed(1)}
                      </div>
                      <div style={{ fontSize: 10, color: sc.color, fontWeight: 600, marginTop: 1 }}>uds.</div>
                    </div>
                  </div>

                  {/* Status bar */}
                  {agotado ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 8, fontSize: 12, color: sc.color, fontWeight: 600 }}>
                      <AlertTriangle size={12} />
                      Sin stock — no disponible para tratamientos
                    </div>
                  ) : bajo ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 8, fontSize: 12, color: sc.color, fontWeight: 600 }}>
                      <AlertTriangle size={12} />
                      Stock bajo — considera reposición
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 8, fontSize: 12, color: sc.color, fontWeight: 600 }}>
                      <CheckCircle2 size={12} />
                      Disponible
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <button
        onClick={() => setModal(true)}
        style={{
          position: 'fixed', bottom: 80,
          right: 'max(24px, calc((100vw - 480px) / 2 + 24px))',
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)',
          border: 'none', color: '#fff', fontSize: 26, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(46,92,56,0.40)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30,
        }}
      >+</button>

      {/* ── Modal ── */}
      {modal && (
        <ModalNuevoInventario
          onClose={() => setModal(false)}
          onCreado={handleCreado}
        />
      )}
    </AgricultorLayout>
  )
}
