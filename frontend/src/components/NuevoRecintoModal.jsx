import { useState } from 'react'
import { X } from 'lucide-react'
import { asesor } from '../services/api'

const USO_SIGPAC_OPTS = [
  { value: 'TA', label: 'TA — Tierra Arable' },
  { value: 'PR', label: 'PR — Prado o Praderas' },
  { value: 'PA', label: 'PA — Pastos' },
  { value: 'VI', label: 'VI — Viñedo' },
  { value: 'OL', label: 'OL — Olivar' },
  { value: 'FY', label: 'FY — Frutales' },
  { value: 'CF', label: 'CF — Cítricos y Frutales' },
  { value: 'IM', label: 'IM — Improductivo' },
  { value: 'AG', label: 'AG — Aguas' },
  { value: 'ZU', label: 'ZU — Zona Urbana' },
  { value: 'OT', label: 'OT — Otros' },
]

const SISTEMA_CULTIVO_OPTS = [
  { value: 'SE', label: 'SE — Secano' },
  { value: 'RG', label: 'RG — Regadío' },
  { value: 'RF', label: 'RF — Regadío por Fuente Propia' },
]

/**
 * Crear: pasa `parcela` (objeto con .id), no pases `initialData`.
 * Editar: pasa `initialData` (objeto recinto), no es necesario `parcela`.
 * Callback `onSaved(recinto)` se llama con el resultado.
 */
export default function NuevoRecintoModal({ parcela, initialData, onClose, onSaved, onCreated }) {
  const isEdit = !!initialData
  // onSaved preferred; onCreated kept for backward-compat with callers that only pass onCreated
  const handleSaved = onSaved ?? onCreated

  const [form, setForm] = useState({
    numeroRecinto: initialData?.numeroRecinto?.toString() ?? '',
    superficie:    initialData?.superficie?.toString()    ?? '',
    usoSigpac:     initialData?.usoSigpac                 ?? 'TA',
    sistemaCultivo: initialData?.sistemaCultivo           ?? 'SE',
    cultivo:       initialData?.cultivo                   ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit() {
    if (!form.numeroRecinto) {
      return setError('El número de recinto es obligatorio.')
    }
    setSaving(true)
    setError('')
    const body = {
      numeroRecinto:  parseInt(form.numeroRecinto),
      superficie:     form.superficie ? parseFloat(form.superficie) : null,
      usoSigpac:      form.usoSigpac      || null,
      sistemaCultivo: form.sistemaCultivo || null,
      cultivo:        form.cultivo        || null,
    }
    try {
      const result = isEdit
        ? await asesor.editarRecinto(initialData.id, body)
        : await asesor.crearRecinto(parcela.id, body)
      setSaved(true)
      setTimeout(() => { handleSaved(result); onClose() }, 700)
    } catch (err) {
      setError(err.message ?? 'Error al guardar el recinto.')
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '9px 13px', borderRadius: 10,
    border: '1.5px solid #d1d5db', fontSize: 13.5, color: '#111827',
    fontFamily: 'inherit', background: '#fafafa', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }

  const contextLabel = isEdit
    ? `Recinto ${initialData.numeroRecinto}`
    : (parcela?.refCatastral ?? `#${parcela?.id}`)

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(15,25,18,0.45)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        style={{ width: 480, maxHeight: '90vh', background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.20)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid #eceef5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.2px' }}>
              {isEdit ? 'Editar Recinto' : 'Añadir Recinto'}
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>
              {isEdit ? 'Modificando ' : 'en parcela '}
              <span style={{ fontWeight: 600, color: '#374151', fontFamily: "'SFMono-Regular','Consolas',monospace" }}>
                {contextLabel}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={14} color="#6b7280" />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>
                Nº Recinto <span style={{ color: '#e07030' }}>*</span>
              </label>
              <input
                name="numeroRecinto"
                type="number"
                min="1"
                value={form.numeroRecinto}
                onChange={handleChange}
                placeholder="Ej. 1"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Superficie (ha)</label>
              <input
                name="superficie"
                type="number"
                step="0.0001"
                min="0"
                value={form.superficie}
                onChange={handleChange}
                placeholder="Ej. 2.5000"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Uso SIGPAC</label>
              <select name="usoSigpac" value={form.usoSigpac} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                {USO_SIGPAC_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Sistema de Cultivo</label>
              <select name="sistemaCultivo" value={form.sistemaCultivo} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                {SISTEMA_CULTIVO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Cultivo</label>
            <input
              name="cultivo"
              value={form.cultivo}
              onChange={handleChange}
              placeholder="Ej. TR (Trigo), GR (Girasol)…"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fff3e6', border: '1px solid #fdd8b4', color: '#c25c10', fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 26px', borderTop: '1px solid #eceef5', background: '#fafbfc', flexShrink: 0 }}>
          <button
            onClick={handleSubmit}
            disabled={saving || saved}
            style={{
              width: '100%', padding: 13,
              background: saved ? '#4e9a5f' : 'linear-gradient(135deg,#2e5c38,#4e9a5f)',
              border: 'none', borderRadius: 12, color: '#fff', fontSize: 14.5, fontWeight: 700,
              cursor: saving || saved ? 'default' : 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(46,92,56,0.28)',
              opacity: saving && !saved ? 0.85 : 1,
            }}
          >
            {saved
              ? (isEdit ? '¡Cambios guardados!' : '¡Recinto añadido!')
              : saving ? 'Guardando…'
              : isEdit ? 'Guardar Cambios' : 'Añadir Recinto'}
          </button>
        </div>
      </div>
    </div>
  )
}
