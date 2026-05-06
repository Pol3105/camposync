import { useState, useEffect } from 'react'
import { FlaskConical, Users, Lock, Check, Pencil, Plus, Building2, CreditCard, CheckCircle2, X } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import { asesor, auth } from '../services/api'

/* ── Design tokens ── */
const S = {
  card:  { bg: '#ffffff', radius: 16, shadow: '0 2px 12px rgba(0,0,0,0.07)', border: '#eceef5' },
  table: { border: '#eceef5' },
  field: {
    empty: {
      height: 46,
      border: '1.5px solid #e8a48a',
      background: '#fff8f3',
      borderRadius: 12,
      padding: '0 110px 0 14px',
      display: 'flex',
      alignItems: 'center',
      fontSize: 13.5,
      color: '#c8ccd8',
      width: '100%',
      position: 'relative',
    },
    emptyOptional: {
      height: 46,
      border: '1.5px solid #e5e7eb',
      background: '#f9fafb',
      borderRadius: 12,
      padding: '0 14px',
      display: 'flex',
      alignItems: 'center',
      fontSize: 13.5,
      color: '#c8ccd8',
      width: '100%',
    },
    filled: {
      height: 46,
      border: '1.5px solid #e5e7eb',
      background: '#f5f6fa',
      borderRadius: 12,
      padding: '0 50px 0 14px',
      display: 'flex',
      alignItems: 'center',
      fontSize: 13.5,
      color: '#6b7280',
      width: '100%',
      position: 'relative',
    },
    editable: {
      height: 46,
      border: '1.5px solid #4e9a5f',
      background: '#ffffff',
      borderRadius: 12,
      padding: '0 14px',
      fontSize: 13.5,
      color: '#111827',
      width: '100%',
      outline: 'none',
      fontFamily: 'inherit',
    },
    editableError: {
      height: 46,
      border: '1.5px solid #e05030',
      background: '#fff8f3',
      borderRadius: 12,
      padding: '0 14px',
      fontSize: 13.5,
      color: '#111827',
      width: '100%',
      outline: 'none',
      fontFamily: 'inherit',
    },
    locked: {
      height: 46,
      border: '1.5px solid #e5e7eb',
      background: '#f0f2f7',
      borderRadius: 12,
      padding: '0 14px 0 42px',
      display: 'flex',
      alignItems: 'center',
      fontSize: 13.5,
      color: '#9ca3af',
      width: '100%',
      position: 'relative',
    },
  },
  btn: {
    green: {
      height: 46,
      padding: '0 14px',
      background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)',
      border: 'none',
      borderRadius: 12,
      color: '#fff',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit',
      boxShadow: '0 2px 8px rgba(46,92,56,0.28)',
      whiteSpace: 'nowrap',
      letterSpacing: '-0.1px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
    },
    gray: {
      height: 46,
      padding: '0 14px',
      background: '#f5f6fa',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      color: '#6b7280',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit',
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
    },
    addSecondary: {
      height: 46,
      padding: '0 14px',
      background: '#f0f7f1',
      border: '1px solid #c0e8b0',
      borderRadius: 12,
      color: '#3a7a40',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit',
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
    },
    outlineGreen: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      height: 42,
      padding: '0 18px',
      background: '#fff',
      border: '1.5px solid #4e9a5f',
      borderRadius: 12,
      color: '#3a7a40',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit',
      letterSpacing: '-0.1px',
    },
    save: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      height: 42,
      padding: '0 22px',
      background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)',
      border: 'none',
      borderRadius: 12,
      color: '#fff',
      fontSize: 13.5,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit',
      boxShadow: '0 3px 12px rgba(46,92,56,0.30)',
      letterSpacing: '-0.1px',
    },
    cancel: {
      height: 42,
      padding: '0 18px',
      background: '#fff',
      border: '1px solid #dde0ea',
      borderRadius: 12,
      color: '#6b7280',
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
  },
}

/* NIF: exactly 8 digits + 1 uppercase letter */
function validateNif(value) {
  return /^\d{8}[A-Z]$/.test(value)
}

/* ── FiscalField: required fields (nif, nombreLegal) ── */
function FiscalField({ label, helper, value, onChange, validate }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)
  const [error,   setError]   = useState('')
  const isEmpty = !value

  function startEdit() {
    setDraft(value)
    setError('')
    setEditing(true)
  }

  function check(val) {
    if (validate) {
      setError(validate(val))
    }
  }

  function save() {
    const trimmed = draft.trim()
    if (validate) {
      const err = validate(trimmed)
      if (err) { setError(err); return }
    }
    onChange(trimmed)
    setEditing(false)
  }

  function cancel() {
    setEditing(false)
    setDraft(value)
    setError('')
  }

  const labelNode = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</span>
        <span style={{ fontSize: 13, color: '#d04040', fontWeight: 700 }}>*</span>
      </div>
      <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>{helper}</div>
    </div>
  )

  if (editing) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: 16, alignItems: 'flex-start' }}>
        {labelNode}
        <div>
          <input
            autoFocus
            value={draft}
            onChange={e => { setDraft(e.target.value); if (error) check(e.target.value) }}
            onBlur={() => check(draft)}
            style={error ? S.field.editableError : S.field.editable}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
          />
          {error && (
            <p style={{ fontSize: 11.5, color: '#c84020', marginTop: 4, fontWeight: 500 }}>{error}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, paddingTop: error ? 0 : 0 }}>
          <button onClick={save} style={S.btn.green}>
            <Check size={13} color="#fff" /> Guardar
          </button>
          <button onClick={cancel} style={{ ...S.btn.gray, padding: '0 12px' }}>✕</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 150px', gap: 16, alignItems: 'center' }}>
      {labelNode}

      {isEmpty ? (
        <div style={{ position: 'relative' }}>
          <div style={S.field.empty}><span>—</span></div>
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#c84020', pointerEvents: 'none' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e05030' }} />
            Requerido
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={S.field.filled}><span>{value}</span></div>
          <div
            title="Editar"
            onClick={startEdit}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 26, height: 26, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Pencil size={12} color="#6b7280" />
          </div>
        </div>
      )}

      {isEmpty ? (
        <button onClick={startEdit} style={S.btn.green}>Completar dato</button>
      ) : (
        <button onClick={startEdit} style={S.btn.gray}>
          <Pencil size={13} color="#6b7280" /> Editar
        </button>
      )}
    </div>
  )
}

/* ── OptionalField: Nº Colegiado ── */
function OptionalField({ label, helper, value, onChange }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)
  const isEmpty = !value

  function startEdit() { setDraft(value); setEditing(true) }
  function save()   { onChange(draft.trim()); setEditing(false) }
  function cancel() { setEditing(false); setDraft(value) }

  const labelNode = (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</div>
      <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>{helper}</div>
    </div>
  )

  if (editing) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: 16, alignItems: 'center' }}>
        {labelNode}
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          style={S.field.editable}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} style={S.btn.green}>
            <Check size={13} color="#fff" /> Guardar
          </button>
          <button onClick={cancel} style={{ ...S.btn.gray, padding: '0 12px' }}>✕</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 150px', gap: 16, alignItems: 'center' }}>
      {labelNode}

      {isEmpty ? (
        <div style={S.field.emptyOptional}><span>—</span></div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={S.field.filled}><span>{value}</span></div>
          <div
            title="Editar"
            onClick={startEdit}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 26, height: 26, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Pencil size={12} color="#6b7280" />
          </div>
        </div>
      )}

      {isEmpty ? (
        <button onClick={startEdit} style={S.btn.addSecondary}>
          <Plus size={13} color="#3a7a40" /> Añadir nº colegiado
        </button>
      ) : (
        <button onClick={startEdit} style={S.btn.gray}>
          <Pencil size={13} color="#6b7280" /> Editar
        </button>
      )}
    </div>
  )
}

/* ── Page ── */
export default function ConfiguracionPage() {
  const [nif,          setNif]          = useState('')
  const [nombreLegal,  setNombreLegal]  = useState('')
  const [numColegiado, setNumColegiado] = useState('')
  const [username,     setUsername]     = useState(localStorage.getItem('username') ?? '')
  const [email,        setEmail]        = useState('')
  const [esJefe,       setEsJefe]       = useState(false)
  const [asesoriaTel,  setAsesoriaTel]  = useState('')
  const [asesoriaProv, setAsesoriaProv] = useState('')
  const [saving,       setSaving]       = useState(false)
  const [saveMsg,      setSaveMsg]      = useState('')
  const [passToast,    setPassToast]    = useState(false)
  const [passLoading,  setPassLoading]  = useState(false)

  useEffect(() => {
    asesor.getPerfil().then(data => {
      setNif(data.nif ?? '')
      setNombreLegal(data.nombreLegal ?? '')
      setNumColegiado(data.numColegiado ?? '')
      setUsername(data.nombre ?? data.username ?? '')
      setEmail(data.username ?? '')
      setEsJefe(data.esJefe ?? false)
      setAsesoriaTel(data.asesoriaTelefono ?? '')
      setAsesoriaProv(data.asesoriaProvinciaAsesoria ?? '')
    }).catch(() => {})
  }, [])

  async function handleCambiarPassword() {
    if (!email || passLoading) return
    setPassLoading(true)
    try {
      await auth.forgotPassword(email)
    } catch { /* silenciar — siempre mostramos éxito */ }
    finally {
      setPassLoading(false)
      setPassToast(true)
      setTimeout(() => setPassToast(false), 5000)
    }
  }

  const showSiexAlert = !nif || !nombreLegal
  const incomplete    = [nif, nombreLegal].filter(v => !v).length

  async function handleSave() {
    setSaving(true)
    setSaveMsg('')
    try {
      const data = await asesor.actualizarPerfil({
        nombre:                  username,
        nif:                     nif        || null,
        nombreLegal:             nombreLegal || null,
        numColegiado:            numColegiado || null,
        asesoriaTelefono:        asesoriaTel  || null,
        asesoriaProvinciaAsesoria: asesoriaProv || null,
      })
      setNif(data.nif ?? '')
      setNombreLegal(data.nombreLegal ?? '')
      setNumColegiado(data.numColegiado ?? '')
      setUsername(data.nombre ?? data.username ?? '')
      setAsesoriaTel(data.asesoriaTelefono ?? '')
      setAsesoriaProv(data.asesoriaProvinciaAsesoria ?? '')
      setSaveMsg('¡Cambios guardados!')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch {
      setSaveMsg('Error al guardar. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const baseCard = {
    background: S.card.bg,
    borderRadius: S.card.radius,
    boxShadow: S.card.shadow,
    border: `1px solid ${S.card.border}`,
    overflow: 'hidden',
  }

  return (
    <AppLayout title="Configuración">
      {/* Toast cambio de contraseña */}
      {passToast && (
        <div
          className="fixed flex items-center gap-3"
          style={{ bottom: 32, right: 32, zIndex: 200, padding: '14px 20px', background: '#1c3829', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.22)', border: '1px solid rgba(124,201,74,0.3)', minWidth: 340, fontFamily: "'Inter',system-ui,sans-serif" }}
        >
          <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 34, height: 34, background: 'rgba(124,201,74,0.18)' }}>
            <CheckCircle2 size={16} color="#7cc94a" />
          </div>
          <div className="flex-1">
            <p className="font-bold" style={{ fontSize: 13.5, color: '#d4f1b0', letterSpacing: '-0.1px' }}>Correo enviado</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              Te hemos enviado un correo seguro con el enlace para cambiar tu contraseña.
            </p>
          </div>
          <button
            onClick={() => setPassToast(false)}
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer' }}
          >
            <X size={13} color="rgba(255,255,255,0.45)" />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>

        {/* Page header */}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px', margin: 0 }}>
            Configuración de la cuenta
          </h1>
          <p style={{ fontSize: 13.5, color: '#9ca3af', marginTop: 3 }}>
            Gestiona los datos fiscales de tu asesoría y tu perfil de acceso a la plataforma.
          </p>
        </div>

        {/* SIEX Alert */}
        {showSiexAlert && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', background: '#fff7e8', border: '1.5px solid #f0c070', borderLeft: '4px solid #d48420', borderRadius: 14, boxShadow: '0 1px 4px rgba(212,132,32,0.08)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fde6b8', border: '1px solid #f0c070', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
              ⚠️
            </div>
            <div style={{ flex: 1, paddingTop: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#8a4e0a', letterSpacing: '-0.1px', marginBottom: 3 }}>
                Faltan datos fiscales obligatorios
              </div>
              <div style={{ fontSize: 13, color: '#a06820', lineHeight: 1.55 }}>
                Para poder generar y exportar el <strong style={{ color: '#8a4e0a' }}>Cuaderno Digital (SIEX)</strong>, debes completar tu{' '}
                <strong style={{ color: '#8a4e0a' }}>NIF</strong> y tu <strong style={{ color: '#8a4e0a' }}>Nombre Legal</strong>.
              </div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: '#fff', border: '1px solid #f0c070', borderRadius: 20, fontSize: 11.5, fontWeight: 600, color: '#a06820', whiteSpace: 'nowrap', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d48420' }} />
              SIEX bloqueado
            </div>
          </div>
        )}

        {/* Card 1 — Datos Fiscales */}
        <div style={baseCard}>
          <div style={{ padding: '18px 24px 16px', borderBottom: `1px solid ${S.table.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#edf7e8', border: '1px solid #c0e8b0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FlaskConical size={18} color="#3a7a40" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: '#111827', letterSpacing: '-0.2px' }}>
                Datos Fiscales (SIEX) y Profesionales
              </div>
              <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 1 }}>
                Estos datos aparecerán en los cuadernos digitales que exportes.
              </div>
            </div>
            {incomplete > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#fff3e6', border: '1px solid #fdd8b4', borderRadius: 20, fontSize: 11.5, fontWeight: 600, color: '#c25c10' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e07030' }} />
                {incomplete} / 2 incompletos
              </div>
            )}
          </div>

          <div style={{ padding: '22px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FiscalField
              label="NIF / CIF"
              helper="Imprescindible para SIEX"
              value={nif}
              onChange={setNif}
              validate={v => v && !validateNif(v) ? 'Formato inválido. Debe ser 8 números y 1 letra mayúscula (ej. 12345678A)' : ''}
            />
            <FiscalField
              label="Nombre Legal"
              helper="Razón social que aparece en Hacienda"
              value={nombreLegal}
              onChange={setNombreLegal}
            />
            <OptionalField
              label="Nº Colegiado"
              helper="Solo si aplica a tu colegio profesional"
              value={numColegiado}
              onChange={setNumColegiado}
            />
          </div>
        </div>

        {/* Card 2 — Perfil y Acceso */}
        <div style={baseCard}>
          <div style={{ padding: '18px 24px 16px', borderBottom: `1px solid ${S.table.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#edf4ff', border: '1px solid #b8d4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={18} color="#2e6ea6" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: '#111827', letterSpacing: '-0.2px' }}>Perfil y Acceso</div>
              <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 1 }}>Tu identidad y credenciales en Camposync.</div>
            </div>
          </div>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Nombre de usuario */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Nombre de usuario</div>
                <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>Cómo te verán tus granjeros</div>
              </div>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{ ...S.field.editable, display: 'block' }}
              />
            </div>

            {/* Email — locked */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ paddingTop: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Email</div>
                <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>Identificador de tu cuenta</div>
              </div>
              <div>
                <div style={{ ...S.field.locked, display: 'flex' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                    <Lock size={14} color="#9ca3af" />
                  </div>
                  <span style={{ flex: 1 }}>{email || '—'}</span>
                  <span style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    Bloqueado
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 7, lineHeight: 1.5 }}>
                  El correo electrónico es tu identificador único.{' '}
                  <span style={{ color: '#6b7280' }}>Contacta con soporte para modificarlo.</span>
                </div>
              </div>
            </div>

            {/* Contraseña */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, alignItems: 'center', paddingTop: 6, borderTop: `1px solid ${S.table.border}`, marginTop: 2 }}>
              <div style={{ paddingTop: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Contraseña</div>
                <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>Última actualización hace 3 meses</div>
              </div>
              <div style={{ paddingTop: 18 }}>
                <button
                  onClick={handleCambiarPassword}
                  disabled={passLoading}
                  style={{ ...S.btn.outlineGreen, opacity: passLoading ? 0.7 : 1, cursor: passLoading ? 'not-allowed' : 'pointer' }}
                >
                  <Lock size={14} color="#3a7a40" />
                  {passLoading ? 'Enviando…' : 'Cambiar contraseña'}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Card 3 — Datos de la Asesoría (solo jefe) */}
        {esJefe && (
          <div style={baseCard}>
            <div style={{ padding: '18px 24px 16px', borderBottom: `1px solid ${S.table.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f3f0ff', border: '1px solid #d4c8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={18} color="#5b3ea6" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: '#111827', letterSpacing: '-0.2px' }}>Datos de la Asesoría</div>
                <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 1 }}>Información de tu asesoría visible para los granjeros.</div>
              </div>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Teléfono */}
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Teléfono</div>
                  <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>Contacto de la asesoría</div>
                </div>
                <input
                  value={asesoriaTel}
                  onChange={e => setAsesoriaTel(e.target.value)}
                  placeholder="Ej. +34 957 000 000"
                  style={{ ...S.field.editable, display: 'block' }}
                />
              </div>

              {/* Provincia */}
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Provincia</div>
                  <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>Provincia donde opera la asesoría</div>
                </div>
                <input
                  value={asesoriaProv}
                  onChange={e => setAsesoriaProv(e.target.value)}
                  placeholder="Ej. Córdoba"
                  style={{ ...S.field.editable, display: 'block' }}
                />
              </div>

              {/* Stripe */}
              <div style={{ paddingTop: 6, borderTop: `1px solid ${S.table.border}`, marginTop: 2 }}>
                <div style={{ paddingTop: 18 }}>
                  <button
                    onClick={() => alert('Próximamente')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 18px', background: '#f9fafb', border: '1.5px solid #d1d5db', borderRadius: 12, color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <CreditCard size={15} color="#6b7280" />
                    Gestionar Suscripción (Stripe)
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Footer actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, paddingTop: 4 }}>
          {saveMsg && (
            <span style={{ fontSize: 13, color: saveMsg.startsWith('Error') ? '#c84020' : '#267a40', fontWeight: 500 }}>
              {saveMsg}
            </span>
          )}
          <button style={S.btn.cancel} onClick={() => window.history.back()} disabled={saving}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ ...S.btn.save, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? (
              'Guardando…'
            ) : (
              <><Check size={14} color="#fff" /> Guardar cambios</>
            )}
          </button>
        </div>

      </div>
    </AppLayout>
  )
}
