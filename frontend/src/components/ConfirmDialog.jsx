import { AlertTriangle } from 'lucide-react'

/**
 * Diálogo de confirmación genérico y reutilizable.
 *
 * Props:
 *   title      — Título del diálogo (string)
 *   message    — Mensaje descriptivo (string)
 *   onConfirm  — Callback al confirmar
 *   onCancel   — Callback al cancelar / cerrar
 *   confirmLabel — Texto botón de confirmación (default: "Sí, eliminar")
 *   danger     — Si true, botón confirmación es rojo (default true)
 */
export default function ConfirmDialog({
  title        = '¿Estás seguro?',
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Sí, eliminar',
  danger       = true,
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 360,
          background: '#fff',
          borderRadius: 20,
          padding: '28px 24px 20px',
          fontFamily: "'Inter',system-ui,sans-serif",
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          textAlign: 'center',
        }}
      >
        {/* Warning icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: danger ? '#fef2f2' : '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={26} color={danger ? '#dc2626' : '#d97706'} />
          </div>
        </div>

        {/* Title */}
        <p style={{ fontSize: 17, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>
          {title}
        </p>

        {/* Message */}
        {message && (
          <p style={{ fontSize: 13.5, color: '#6b7280', margin: '0 0 24px', lineHeight: 1.5 }}>
            {message}
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: danger ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'linear-gradient(135deg,#2e5c38,#4e9a5f)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: danger ? '0 4px 12px rgba(220,38,38,0.30)' : '0 4px 12px rgba(46,92,56,0.30)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
