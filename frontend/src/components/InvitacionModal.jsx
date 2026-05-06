import { useState } from 'react'
import { X, Mail, Users } from 'lucide-react'

const TIPOS = [
  { value: 'AGRICULTOR', label: 'Agricultor', desc: 'Agricultor que registrará sus tratamientos' },
  { value: 'ASESOR',     label: 'Asesor',     desc: 'Asesor que gestionará explotaciones' },
]

export default function InvitacionModal({ onClose, onEnviar, sending, esJefe = false }) {
  const [email, setEmail]       = useState('')
  const [rolDestino, setRol]    = useState('AGRICULTOR')
  const [err, setErr]           = useState('')

  const tipoLabel = rolDestino === 'ASESOR' ? 'Asesor' : 'Agricultor'

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return setErr(`Introduce el email del ${tipoLabel.toLowerCase()}.`)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return setErr('El formato del email no es válido.')
    onEnviar(trimmed, rolDestino)
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(10,20,10,0.50)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        style={{ width: 480, background: '#fff', borderRadius: 20, boxShadow: '0 24px 70px rgba(0,0,0,0.20)', overflow: 'hidden', position: 'relative', fontFamily: "'Inter',system-ui,sans-serif" }}
        onClick={e => e.stopPropagation()}
      >
        {/* gradient header strip */}
        <div style={{ height: 4, background: 'linear-gradient(90deg,#2e5c38,#4e9a5f,#7cc94a)' }} />

        <div style={{ padding: '32px 36px 28px' }}>
          {/* close */}
          <button
            onClick={onClose}
            className="absolute flex items-center justify-center transition hover:bg-gray-100"
            style={{ top: 18, right: 18, width: 30, height: 30, borderRadius: '50%', border: '1px solid #e8eaf0', background: '#f5f6fa', cursor: 'pointer', fontSize: 14, color: '#9ca3af', lineHeight: 1 }}
          >
            <X size={14} color="#9ca3af" />
          </button>

          {/* icon + title */}
          <div className="flex items-center gap-3.5 mb-5">
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#edf7e8,#d4f0c8)', border: '1px solid #b8e098' }}>
              <Mail size={22} color="#3a7a40" />
            </div>
            <div>
              <p className="font-bold" style={{ fontSize: 19, color: '#111827', letterSpacing: '-0.4px' }}>Nueva Invitación</p>
              <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>
                Invita a un {esJefe ? 'agricultor o asesor' : 'agricultor'} a unirse a Camposync
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* Tipo selector — solo visible si es_jefe */}
            {esJefe && (
              <div className="mb-5">
                <label className="block font-semibold mb-2" style={{ fontSize: 12.5, color: '#374151' }}>
                  Tipo de Invitación
                </label>
                <div className="flex gap-3">
                  {TIPOS.map(({ value, label, desc }) => {
                    const active = rolDestino === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRol(value)}
                        className="flex-1 flex items-start gap-2.5 transition"
                        style={{
                          padding: '11px 14px',
                          borderRadius: 12,
                          border: `1.5px solid ${active ? '#4e9a5f' : '#e5e7eb'}`,
                          background: active ? '#f0faf3' : '#fafafa',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${active ? '#4e9a5f' : '#d1d5db'}`, background: active ? '#4e9a5f' : '#fff', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ fontSize: 13, color: active ? '#2e5c38' : '#374151' }}>{label}</p>
                          <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 1 }}>{desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* email field */}
            <label className="block font-semibold mb-1.5" style={{ fontSize: 12.5, color: '#374151' }}>
              Email del {tipoLabel} <span style={{ color: '#e07030' }}>*</span>
            </label>
            <div className="relative mb-1.5">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Mail size={15} color="#9ca3af" />
              </div>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (err) setErr('') }}
                placeholder="ejemplo@correo.com"
                autoFocus
                className="w-full focus:outline-none focus:border-[#4e9a5f] transition"
                style={{ height: 48, border: `1.5px solid ${err ? '#f8c8c8' : '#d1d5db'}`, borderRadius: 12, paddingLeft: 44, paddingRight: 14, fontSize: 14, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', color: '#111827', fontFamily: 'inherit' }}
              />
            </div>
            {err ? (
              <p className="mb-5" style={{ fontSize: 12, color: '#c03030' }}>{err}</p>
            ) : (
              <p className="mb-5" style={{ fontSize: 12, color: '#b0b8c4' }}>
                Introduce el correo electrónico del {tipoLabel.toLowerCase()} a invitar
              </p>
            )}

            {/* info note */}
            <div className="flex gap-2.5 mb-6" style={{ padding: '13px 15px', background: '#f5fbf5', borderRadius: 11, border: '1px solid #c8e8b0' }}>
              <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: 20, height: 20, background: '#d4f0c8', marginTop: 1 }}>
                <span style={{ fontSize: 11, color: '#3a7a40', fontWeight: 700 }}>i</span>
              </div>
              <p style={{ fontSize: 12.5, color: '#4a7050', lineHeight: 1.65, margin: 0 }}>
                El {tipoLabel.toLowerCase()} recibirá un <strong style={{ color: '#2e5c38' }}>enlace único</strong> para activar su cuenta y vincularse a tu asesoría. El enlace expira en <strong style={{ color: '#2e5c38' }}>7 días</strong>.
              </p>
            </div>

            {/* actions */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 font-semibold transition hover:bg-gray-50"
                style={{ height: 46, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, color: '#6b7280', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sending}
                className="flex items-center justify-center gap-2 font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
                style={{ flex: 2, height: 46, background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 12, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(46,92,56,0.28)', letterSpacing: '-0.1px' }}
              >
                <Mail size={16} color="#fff" />
                {sending ? 'Enviando…' : 'Enviar Invitación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
