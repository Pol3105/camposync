import { useState, useEffect } from 'react'
import { Lock, AlertTriangle, CheckCircle2, X, LogOut, UserCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AgricultorLayout from './AgricultorLayout'
import { granjero } from '../../services/api'
import { nifError } from '../../utils/validations'
import ModalSoyAplicador from '../../components/ModalSoyAplicador'

function initials(nombre) {
  const p = (nombre ?? '').trim().split(' ')
  return p.length >= 2
    ? (p[0][0] + p[1][0]).toUpperCase()
    : (p[0]?.[0] ?? '?').toUpperCase()
}

function AlertCard({ icon: Icon, color, bg, border, title, description }) {
  return (
    <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.5 }}>{description}</div>
      </div>
    </div>
  )
}

export default function PerfilAgricultor() {
  const navigate            = useNavigate()
  const [toast, setToast]                 = useState(false)
  const [perfil, setPerfil]               = useState(null)
  const [loading, setLoading]             = useState(true)
  const [modalSoyAplicador, setModalSoyAplicador] = useState(false)
  const [yaRegistrado, setYaRegistrado]   = useState(false)

  // Campos editables
  const [form, setForm]     = useState({ nif: '', nombreLegal: '' })
  const [original, setOrig] = useState({ nif: '', nombreLegal: '' })
  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState(false)
  const [saveErr, setSaveErr] = useState(null)
  const [nifErrMsg, setNifErrMsg] = useState('')

  // Fallback from localStorage while API loads
  const nombreLocal = localStorage.getItem('nombre') || localStorage.getItem('username') || 'Agricultor'
  const emailLocal  = localStorage.getItem('username') || ''

  useEffect(() => {
    granjero.getPerfil()
      .then(data => {
        setPerfil(data)
        const snap = { nif: data.nif ?? '', nombreLegal: data.nombreLegal ?? '' }
        setForm(snap)
        setOrig(snap)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const nombre    = perfil?.nombre   ?? nombreLocal
  const email     = perfil?.username ?? emailLocal
  const createdAt = perfil?.createdAt ?? null

  const createdDate = createdAt
    ? new Date(createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  const dirty    = form.nif !== original.nif || form.nombreLegal !== original.nombreLegal
  const nifValid = nifErrMsg === ''

  async function handleGuardar() {
    setSaving(true)
    setSaveErr(null)
    setSaveOk(false)
    try {
      const data = await granjero.actualizarPerfil({ nif: form.nif, nombreLegal: form.nombreLegal })
      const snap = { nif: data.nif ?? '', nombreLegal: data.nombreLegal ?? '' }
      setForm(snap)
      setOrig(snap)
      setPerfil(data)
      setSaveOk(true)
    } catch {
      setSaveErr('Error al guardar. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  function handleCambiarPass() {
    setToast(true)
    setTimeout(() => setToast(false), 4000)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('nombre')
    localStorage.removeItem('rol')
    navigate('/login')
  }

  const nifCompleto         = form.nif.trim().length > 0
  const nombreLegalCompleto = form.nombreLegal.trim().length > 0

  const alertas = [
    !nifCompleto && {
      icon: AlertTriangle,
      color: '#e07030',
      bg: '#fff8f2',
      border: '#fdd8b4',
      title: 'NIF / CIF sin completar',
      description: 'Necesario para el Cuaderno de Campo CUE. Puedes añadirlo tú mismo abajo.',
    },
    !nombreLegalCompleto && {
      icon: AlertTriangle,
      color: '#d97706',
      bg: '#fefce8',
      border: '#fde68a',
      title: 'Nombre legal pendiente',
      description: 'Obligatorio para los informes SIEX. Puedes completarlo abajo.',
    },
  ].filter(Boolean)

  return (
    <AgricultorLayout>
      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(145deg, #1c3829 0%, #2e5c38 100%)', padding: '28px 20px 24px', textAlign: 'center', position: 'relative' }}>
        <button
          onClick={handleLogout}
          style={{ position: 'absolute', top: 20, right: 16, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.10)', border: 'none', borderRadius: 10, padding: '6px 12px', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <LogOut size={14} />
          Salir
        </button>

        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#a8e890' }}>
            {initials(nombre)}
          </span>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', marginBottom: 4 }}>
          {nombre}
        </h1>
        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>
          Agricultor · {loading ? '…' : `Alta ${createdDate}`}
        </p>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '0 16px', marginTop: 16 }}>

        {/* Datos de acceso */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '18px', boxShadow: '0 4px 20px rgba(0,0,0,0.10)', marginBottom: 16 }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Datos de acceso
          </h2>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>
              Usuario / Email
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 12 }}>
              <span style={{ flex: 1, fontSize: 14, color: '#374151', fontWeight: 500 }}>{email}</span>
              <Lock size={14} color="#c8ccd8" />
            </div>
            <p style={{ fontSize: 11.5, color: '#c8ccd8', marginTop: 5 }}>
              El usuario no se puede cambiar. Contacta con tu asesor si es necesario.
            </p>
          </div>

          <button
            onClick={handleCambiarPass}
            style={{ width: '100%', padding: '12px', background: '#f3f4f6', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#374151', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Lock size={15} color="#6b7280" />
            Cambiar contraseña
          </button>
        </div>

        {/* Alertas */}
        {!loading && alertas.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, paddingLeft: 2 }}>
              Datos pendientes
            </h2>
            <div className="flex flex-col gap-3">
              {alertas.map((a, i) => <AlertCard key={i} {...a} />)}
            </div>
          </div>
        )}

        {!loading && alertas.length === 0 && (
          <div style={{ background: '#edf7e8', border: '1.5px solid #c0e8b0', borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <CheckCircle2 size={20} color="#4e9a5f" />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#267a40' }}>
              Perfil completo. Cuaderno listo para SIEX.
            </span>
          </div>
        )}

        {/* Datos fiscales — editables */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '18px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Datos fiscales
          </h2>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>
              NIF / CIF
            </label>
            <input
              value={form.nif}
              onChange={e => {
                const v = e.target.value
                setForm(f => ({ ...f, nif: v }))
                setNifErrMsg(nifError(v))
                setSaveOk(false)
              }}
              placeholder="12345678A"
              style={{ width: '100%', padding: '10px 13px', borderRadius: 12, border: `1.5px solid ${nifErrMsg ? '#ef4444' : '#e5e7eb'}`, fontSize: 14, fontFamily: 'inherit', color: '#111827', background: '#fff', boxSizing: 'border-box', outline: 'none' }}
            />
            {nifErrMsg && (
              <p style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>{nifErrMsg}</p>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>
              Nombre Legal
            </label>
            <input
              value={form.nombreLegal}
              onChange={e => { setForm(f => ({ ...f, nombreLegal: e.target.value })); setSaveOk(false) }}
              placeholder="Razón social o nombre completo"
              style={{ width: '100%', padding: '10px 13px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 14, fontFamily: 'inherit', color: '#111827', background: '#fff', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {saveErr && (
            <p style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '9px 13px', borderRadius: 10, marginBottom: 12 }}>
              {saveErr}
            </p>
          )}
          {saveOk && (
            <p style={{ fontSize: 13, color: '#16a34a', background: '#f0fdf4', padding: '9px 13px', borderRadius: 10, marginBottom: 12 }}>
              Datos guardados correctamente.
            </p>
          )}

          <button
            onClick={handleGuardar}
            disabled={saving || !dirty || !nifValid}
            style={{
              width: '100%', padding: '12px', borderRadius: 12, border: 'none',
              background: dirty && nifValid ? 'linear-gradient(135deg,#2e5c38,#4e9a5f)' : '#e5e7eb',
              color: dirty && nifValid ? '#fff' : '#9ca3af',
              fontSize: 14, fontWeight: 700, cursor: dirty && nifValid ? 'pointer' : 'default',
              fontFamily: 'inherit', transition: 'all 0.2s',
              boxShadow: dirty ? '0 4px 14px rgba(46,92,56,0.30)' : 'none',
            }}
          >
            {saving ? 'Guardando…' : 'Guardar Cambios'}
          </button>
        </div>

        {/* Banner: ¿Aplicas tú mismo? */}
        {!loading && !yaRegistrado && (
          <div style={{ background: '#edf7e8', border: '1.5px solid #bbf7d0', borderRadius: 20, padding: '16px 18px', marginBottom: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserCheck size={20} color="#16a34a" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: '#1c3829', marginBottom: 3 }}>
                ¿Aplicas tú mismo los tratamientos?
              </p>
              <p style={{ fontSize: 12, color: '#4b7a56', lineHeight: 1.45 }}>
                Regístrate como aplicador con un solo clic para asignarte en el cuaderno.
              </p>
            </div>
            <button
              onClick={() => setModalSoyAplicador(true)}
              style={{
                flexShrink: 0,
                padding: '9px 14px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)',
                color: '#fff',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                lineHeight: 1.3,
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              Añadir mis<br />datos
            </button>
          </div>
        )}

        {yaRegistrado && (
          <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 16, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
              ¡Listo! Ya apareces como aplicador en tus tratamientos.
            </span>
          </div>
        )}

      </div>

      {/* Modal soy aplicador */}
      {modalSoyAplicador && (
        <ModalSoyAplicador
          perfil={perfil}
          onClose={() => setModalSoyAplicador(false)}
          onCreado={() => {
            setModalSoyAplicador(false)
            setYaRegistrado(true)
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)', maxWidth: 340, width: 'calc(100% - 32px)', background: '#1c3829', borderRadius: 14, padding: '13px 18px', boxShadow: '0 8px 30px rgba(0,0,0,0.20)', display: 'flex', alignItems: 'center', gap: 10, zIndex: 95 }}>
          <CheckCircle2 size={18} color="#a8e890" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: '#fff' }}>
            Te hemos enviado un correo con el enlace para cambiar tu contraseña.
          </span>
          <button onClick={() => setToast(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.50)', padding: 0, display: 'flex' }}>
            <X size={16} />
          </button>
        </div>
      )}
    </AgricultorLayout>
  )
}
