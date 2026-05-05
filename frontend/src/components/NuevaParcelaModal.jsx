import { useState } from 'react'
import { X } from 'lucide-react'
import { asesor } from '../services/api'

/**
 * Crear: pasa `explotacion` (objeto con .id y .nombre), no pases `initialData`.
 * Editar: pasa `initialData` (objeto parcela), no es necesario `explotacion`.
 * Callback `onSaved(parcela)` se llama con el resultado (creada o actualizada).
 */
export default function NuevaParcelaModal({ explotacion, initialData, onClose, onSaved }) {
  const isEdit = !!initialData

  const [form, setForm] = useState({
    refCatastral:  initialData?.refCatastral              ?? '',
    municipio:     initialData?.municipio                 ?? '',
    provincia:     initialData?.provincia                 ?? '',
    poligono:      initialData?.poligono?.toString()      ?? '',
    parcelaSigpac: initialData?.parcelaSigpac?.toString() ?? '',
    agregado:      initialData?.agregado?.toString()      ?? '',
    zona:          initialData?.zona?.toString()          ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit() {
    setSaving(true)
    setError('')
    const body = {
      refCatastral:  form.refCatastral  || null,
      municipio:     form.municipio     || null,
      provincia:     form.provincia     || null,
      poligono:      form.poligono      ? parseInt(form.poligono)      : null,
      parcelaSigpac: form.parcelaSigpac ? parseInt(form.parcelaSigpac) : null,
      agregado:      form.agregado      ? parseInt(form.agregado)      : 0,
      zona:          form.zona          ? parseInt(form.zona)          : 0,
    }
    try {
      const result = isEdit
        ? await asesor.editarParcela(initialData.id, body)
        : await asesor.crearParcela(explotacion.id, body)
      setSaved(true)
      setTimeout(() => { onSaved(result); onClose() }, 700)
    } catch (err) {
      setError(err.message ?? 'Error al guardar la parcela.')
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '9px 13px', borderRadius: 10,
    border: '1.5px solid #d1d5db', fontSize: 13.5, color: '#111827',
    fontFamily: 'inherit', background: '#fafafa', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5, display: 'block' }
  const sectionLabel = { fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, marginTop: 4 }

  const contextName = isEdit
    ? (initialData.refCatastral ?? `Parcela #${initialData.id}`)
    : explotacion?.nombre

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(15,25,18,0.45)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        style={{ width: 520, maxHeight: '90vh', background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.20)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid #eceef5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.2px' }}>
              {isEdit ? 'Editar Parcela' : 'Añadir Parcela'}
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>
              {isEdit ? 'Modificando ' : 'en '}
              <span style={{ fontWeight: 600, color: '#374151' }}>{contextName}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={14} color="#6b7280" />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
          <div>
            <label style={labelStyle}>Referencia Catastral</label>
            <input name="refCatastral" value={form.refCatastral} onChange={handleChange} placeholder="Ej. 14077A0010002580000JK" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Municipio</label>
              <input name="municipio" value={form.municipio} onChange={handleChange} placeholder="Ej. Córdoba" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Provincia</label>
              <input name="provincia" value={form.provincia} onChange={handleChange} placeholder="Ej. Córdoba" style={inputStyle} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #eceef5', paddingTop: 14 }}>
            <p style={sectionLabel}>Códigos SIGPAC</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Polígono</label>
                <input name="poligono" type="number" min="0" value={form.poligono} onChange={handleChange} placeholder="Ej. 1" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Parcela SIGPAC</label>
                <input name="parcelaSigpac" type="number" min="0" value={form.parcelaSigpac} onChange={handleChange} placeholder="Ej. 80" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
              <div>
                <label style={labelStyle}>Agregado</label>
                <input name="agregado" type="number" min="0" value={form.agregado} onChange={handleChange} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Zona</label>
                <input name="zona" type="number" min="0" value={form.zona} onChange={handleChange} placeholder="0" style={inputStyle} />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fff3e6', border: '1px solid #fdd8b4', color: '#c25c10', fontSize: 13 }}>{error}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 26px', borderTop: '1px solid #eceef5', background: '#fafbfc', flexShrink: 0 }}>
          <button
            onClick={handleSubmit}
            disabled={saving || saved}
            style={{ width: '100%', padding: 13, background: saved ? '#4e9a5f' : 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: saving || saved ? 'default' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(46,92,56,0.28)' }}
          >
            {saved
              ? (isEdit ? '¡Cambios guardados!' : '¡Parcela añadida!')
              : saving ? 'Guardando…'
              : isEdit ? 'Guardar Cambios' : 'Añadir Parcela'}
          </button>
        </div>
      </div>
    </div>
  )
}
