import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { granjero } from '../services/api'

const GREEN_DARK = '#1c3829'
const GREEN_MID  = '#2e5c38'
const GREEN_ACT  = '#4e9a5f'

export default function ModalAjusteStock({ item, onClose, onAjustado }) {
  const [valor,    setValor]    = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error,    setError]    = useState(null)

  const alias = item.aliasAgric || item.productoNombre
  const stock  = typeof item.stockAct === 'number' ? item.stockAct : 0
  const unidad = item.unidad ?? 'uds.'

  async function handleSubmit(e) {
    e.preventDefault()
    const nuevoStock = parseFloat(valor)
    if (isNaN(nuevoStock) || nuevoStock < 0) {
      setError('Introduce un valor válido (≥ 0).')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const actualizado = await granjero.ajustarStock(item.id, nuevoStock)
      onAjustado(actualizado)
    } catch (err) {
      setError(err?.message ?? 'Error al ajustar el stock.')
    } finally {
      setEnviando(false)
    }
  }

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
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e5e7eb' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#edf7e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SlidersHorizontal size={18} color={GREEN_ACT} />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: GREEN_DARK, margin: 0 }}>Ajustar stock</p>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{alias}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stock actual (lectura) */}
          <div style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Stock actual</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
              {Number.isInteger(stock) ? stock : stock.toFixed(2)} {unidad}
            </span>
          </div>

          {/* Input nuevo stock */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Stock correcto ({unidad})
            </label>
            <input
              required
              autoFocus
              type="number"
              min="0"
              step="any"
              placeholder={`Ej. ${stock.toFixed(1)}`}
              value={valor}
              onChange={e => { setValor(e.target.value); setError(null) }}
              style={{
                padding: '13px 14px', borderRadius: 12,
                border: `1.5px solid ${error ? '#fca5a5' : '#e5e7eb'}`,
                fontSize: 16, fontWeight: 700, color: '#111827',
                background: error ? '#fef2f2' : '#f9fafb',
                width: '100%', boxSizing: 'border-box', outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 0 2px' }}>
              Escribe la cantidad exacta que tienes ahora mismo.
            </p>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '9px 13px', borderRadius: 10, margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando || valor === ''}
            style={{
              padding: '14px 0', borderRadius: 14, border: 'none',
              background: valor !== '' && !enviando
                ? `linear-gradient(135deg, ${GREEN_MID}, ${GREEN_ACT})`
                : '#e5e7eb',
              color: valor !== '' && !enviando ? '#fff' : '#9ca3af',
              fontSize: 15, fontWeight: 700,
              cursor: valor !== '' && !enviando ? 'pointer' : 'default',
              transition: 'background 0.2s',
            }}
          >
            {enviando ? 'Guardando…' : 'Guardar stock correcto'}
          </button>
        </form>
      </div>
    </div>
  )
}
