import { useState } from 'react'
import { granjero } from '../services/api'

const GREEN_DARK = '#1c3829'
const GREEN_MID  = '#2e5c38'
const GREEN_ACT  = '#4e9a5f'

const TIPOS = [
  { value: '',            label: 'Selecciona tipo…' },
  { value: 'PULV_TRAC',  label: 'Pulverizador de tractor' },
  { value: 'ATOMIZADOR', label: 'Atomizador' },
  { value: 'MOCHILA',    label: 'Mochila' },
  { value: 'DRONE',      label: 'Drone' },
  { value: 'OTRO',       label: 'Otro' },
]

export default function ModalNuevoEquipamiento({ onClose, onCreado, onActualizado, itemAEditar }) {
  const editando = !!itemAEditar

  const [enviando, setEnviando] = useState(false)
  const [error,    setError]    = useState(null)
  const [form, setForm] = useState({
    alias:            itemAEditar?.alias            ?? '',
    tipoMaquina:      itemAEditar?.tipoMaquina      ?? '',
    marcaModelo:      itemAEditar?.marcaModelo       ?? '',
    numRegistroIteaf: itemAEditar?.numRegistroIteaf ?? '',
  })

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      const body = {
        alias:            form.alias.trim(),
        tipoMaquina:      form.tipoMaquina      || null,
        marcaModelo:      form.marcaModelo.trim()      || null,
        numRegistroIteaf: form.numRegistroIteaf.trim() || null,
      }
      if (editando) {
        const updated = await granjero.editarEquipamiento(itemAEditar.id, body)
        onActualizado?.(updated)
      } else {
        const nuevo = await granjero.crearEquipamiento(body)
        onCreado?.(nuevo)
      }
    } catch (err) {
      setError(err?.message ?? 'Error al guardar el equipamiento.')
    } finally {
      setEnviando(false)
    }
  }

  const camposOk = form.alias.trim().length > 0

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 430, background: '#fff', borderRadius: '24px 24px 0 0', padding: '0 0 32px', fontFamily: "'Inter',system-ui,sans-serif", maxHeight: '92dvh', overflowY: 'auto' }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e5e7eb' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px' }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: GREEN_DARK, margin: 0 }}>
            {editando ? 'Editar equipamiento' : 'Nuevo equipamiento'}
          </p>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Alias / Nombre propio *">
            <input required type="text" placeholder="Ej. Cuba 2000L" value={form.alias} onChange={e => set('alias', e.target.value)} style={inputStyle} />
            <p style={{ fontSize: 11.5, color: '#c8ccd8', margin: '3px 0 0 2px' }}>Nombre que usarás para identificar esta máquina.</p>
          </Field>

          <Field label="Tipo de máquina">
            <select value={form.tipoMaquina} onChange={e => set('tipoMaquina', e.target.value)} style={selectStyle}>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>

          <Field label="Marca / Modelo">
            <input type="text" placeholder="Ej. Hardi Navigator 2000" value={form.marcaModelo} onChange={e => set('marcaModelo', e.target.value)} style={inputStyle} />
          </Field>

          <Field label="Nº Registro ITEAF">
            <input type="text" placeholder="Ej. ES-AND-000123" value={form.numRegistroIteaf} onChange={e => set('numRegistroIteaf', e.target.value)} style={inputStyle} />
            <p style={{ fontSize: 11.5, color: '#c8ccd8', margin: '3px 0 0 2px' }}>Inspección Técnica de Equipos de Aplicación de Fitosanitarios.</p>
          </Field>

          {error && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={!camposOk || enviando}
            style={{ marginTop: 4, padding: '14px 0', borderRadius: 14, border: 'none', background: camposOk && !enviando ? `linear-gradient(135deg, ${GREEN_MID}, ${GREEN_ACT})` : '#e5e7eb', color: camposOk && !enviando ? '#fff' : '#9ca3af', fontSize: 15, fontWeight: 700, cursor: camposOk && !enviando ? 'pointer' : 'default', transition: 'background 0.2s' }}
          >
            {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Añadir equipamiento'}
          </button>

          <div style={{ height: 72 }} />
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  padding: '11px 13px', borderRadius: 12, border: '1.5px solid #e5e7eb',
  fontSize: 14, color: '#111827', background: '#f9fafb',
  width: '100%', boxSizing: 'border-box', outline: 'none',
}

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32,
}
