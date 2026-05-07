import { useState } from 'react'
import { UserCheck } from 'lucide-react'
import { granjero } from '../services/api'

const GREEN_DARK = '#1c3829'
const GREEN_MID  = '#2e5c38'
const GREEN_ACT  = '#4e9a5f'

const NIVELES = [
  { value: '',            label: 'Sin especificar' },
  { value: 'basico',      label: 'Básico' },
  { value: 'cualificado', label: 'Cualificado' },
  { value: 'fumigador',   label: 'Fumigador' },
]

export default function ModalSoyAplicador({ perfil, onClose, onCreado }) {
  const [form, setForm]       = useState({ numeroRopo: '', nivelCapacitacion: '' })
  const [enviando, setEnviando] = useState(false)
  const [error, setError]      = useState(null)

  const nombreMostrado = perfil?.nombreLegal || perfil?.nombre || '—'
  const nifMostrado    = perfil?.nif || '—'
  const perfilIncompleto = !perfil?.nombreLegal && !perfil?.nombre

  async function handleSubmit(e) {
    e.preventDefault()
    if (perfilIncompleto) return
    setEnviando(true)
    setError(null)
    try {
      const nuevo = await granjero.registrarmeComoAplicador({
        numeroRopo:        form.numeroRopo        || null,
        nivelCapacitacion: form.nivelCapacitacion || null,
      })
      onCreado(nuevo)
    } catch (err) {
      setError(err?.message ?? 'Error al registrarte como aplicador.')
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
          maxHeight: '85dvh',
          overflowY: 'auto',
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
              <UserCheck size={18} color={GREEN_ACT} />
            </div>
            <p style={{ fontSize: 17, fontWeight: 700, color: GREEN_DARK, margin: 0 }}>
              Registrarme como aplicador
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Datos del perfil (solo lectura) */}
          <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 14, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Datos del perfil (se usarán automáticamente)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Nombre</p>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{nombreMostrado}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>NIF</p>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{nifMostrado}</p>
              </div>
            </div>
          </div>

          {perfilIncompleto && (
            <p style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '10px 13px', borderRadius: 10, fontWeight: 500 }}>
              Completa tu nombre o nombre legal en el perfil antes de registrarte como aplicador.
            </p>
          )}

          {/* Número ROPO */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Número ROPO <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ej. ES-00000-C"
              value={form.numeroRopo}
              onChange={e => setForm(f => ({ ...f, numeroRopo: e.target.value }))}
              style={inputStyle}
            />
            <p style={{ fontSize: 11.5, color: '#c8ccd8', margin: '0 0 0 2px' }}>
              Puedes añadirlo o editarlo después desde Recursos → Personal.
            </p>
          </div>

          {/* Nivel de capacitación */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nivel de capacitación <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
            </label>
            <select
              value={form.nivelCapacitacion}
              onChange={e => setForm(f => ({ ...f, nivelCapacitacion: e.target.value }))}
              style={selectStyle}
            >
              {NIVELES.map(n => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '9px 13px', borderRadius: 10 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando || perfilIncompleto}
            style={{
              marginTop: 4,
              padding: '14px 0',
              borderRadius: 14,
              border: 'none',
              background: !perfilIncompleto && !enviando
                ? `linear-gradient(135deg, ${GREEN_MID}, ${GREEN_ACT})`
                : '#e5e7eb',
              color: !perfilIncompleto && !enviando ? '#fff' : '#9ca3af',
              fontSize: 15,
              fontWeight: 700,
              cursor: !perfilIncompleto && !enviando ? 'pointer' : 'default',
              transition: 'background 0.2s',
            }}
          >
            {enviando ? 'Guardando…' : 'Añadirme como aplicador'}
          </button>

          <div style={{ height: 8 }} />
        </form>
      </div>
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
  fontFamily: 'inherit',
}

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 32,
}
