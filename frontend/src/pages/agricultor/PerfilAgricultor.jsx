import { useState } from 'react'
import { Lock, AlertTriangle, CheckCircle2, X, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AgricultorLayout from './AgricultorLayout'
import { MOCK_USUARIO } from './mock'

function initials(nombre) {
  const p = (nombre ?? '').trim().split(' ')
  return p.length >= 2
    ? (p[0][0] + p[1][0]).toUpperCase()
    : (p[0]?.[0] ?? '?').toUpperCase()
}

function AlertCard({ icon: Icon, color, bg, border, title, description }) {
  return (
    <div
      style={{
        background: bg,
        border: `1.5px solid ${border}`,
        borderRadius: 16,
        padding: '14px 16px',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${color}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
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
  const navigate    = useNavigate()
  const [toast, setToast] = useState(false)

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

  const createdDate = MOCK_USUARIO.createdAt
    ? new Date(MOCK_USUARIO.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  const alertas = [
    !MOCK_USUARIO.nif && {
      icon: AlertTriangle,
      color: '#e07030',
      bg: '#fff8f2',
      border: '#fdd8b4',
      title: 'NIF / CIF sin completar',
      description: 'Necesario para el Cuaderno de Campo CUE. Contacta con tu asesor para añadirlo.',
    },
    !MOCK_USUARIO.nombreLegal && {
      icon: AlertTriangle,
      color: '#d97706',
      bg: '#fefce8',
      border: '#fde68a',
      title: 'Nombre legal pendiente',
      description: 'El nombre legal es obligatorio para los informes SIEX. Tu asesor puede completarlo.',
    },
  ].filter(Boolean)

  return (
    <AgricultorLayout>
      {/* ── Header ── */}
      <div
        style={{
          background: 'linear-gradient(145deg, #1c3829 0%, #2e5c38 100%)',
          padding: '28px 20px 48px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Logout button */}
        <button
          onClick={handleLogout}
          style={{
            position: 'absolute',
            top: 20,
            right: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: 'rgba(255,255,255,0.10)',
            border: 'none',
            borderRadius: 10,
            padding: '6px 12px',
            color: 'rgba(255,255,255,0.65)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <LogOut size={14} />
          Salir
        </button>

        {/* Avatar */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '3px solid rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}
        >
          <span style={{ fontSize: 24, fontWeight: 800, color: '#a8e890' }}>
            {initials(MOCK_USUARIO.nombre)}
          </span>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', marginBottom: 4 }}>
          {MOCK_USUARIO.nombre}
        </h1>
        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>
          Agricultor · Alta {createdDate}
        </p>
      </div>

      {/* ── Content (overlaps header) ── */}
      <div style={{ padding: '0 16px', marginTop: -22 }}>

        {/* Datos de acceso */}
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: '18px 18px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Datos de acceso
          </h2>

          {/* Email */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>
              Correo electrónico
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 13px',
                background: '#f9fafb',
                border: '1.5px solid #e5e7eb',
                borderRadius: 12,
              }}
            >
              <span style={{ flex: 1, fontSize: 14, color: '#374151', fontWeight: 500 }}>
                {MOCK_USUARIO.email}
              </span>
              <Lock size={14} color="#c8ccd8" />
            </div>
            <p style={{ fontSize: 11.5, color: '#c8ccd8', marginTop: 5 }}>
              El correo no se puede cambiar. Contacta con tu asesor si es necesario.
            </p>
          </div>

          {/* Cambiar contraseña */}
          <button
            onClick={handleCambiarPass}
            style={{
              width: '100%',
              padding: '12px',
              background: '#f3f4f6',
              border: '1.5px solid #e5e7eb',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              color: '#374151',
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Lock size={15} color="#6b7280" />
            Cambiar contraseña
          </button>
        </div>

        {/* Alertas de datos incompletos */}
        {alertas.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, paddingLeft: 2 }}>
              Datos pendientes
            </h2>
            <div className="flex flex-col gap-3">
              {alertas.map((a, i) => (
                <AlertCard key={i} {...a} />
              ))}
            </div>
          </div>
        )}

        {/* Si todo está completo */}
        {alertas.length === 0 && (
          <div
            style={{
              background: '#edf7e8',
              border: '1.5px solid #c0e8b0',
              borderRadius: 16,
              padding: '14px 16px',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <CheckCircle2 size={20} color="#4e9a5f" />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#267a40' }}>
              Perfil completo. Cuaderno listo para SIEX.
            </span>
          </div>
        )}

        {/* Datos fiscales card */}
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: '18px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Datos fiscales
          </h2>

          {[
            { label: 'NIF / CIF',     value: MOCK_USUARIO.nif         ?? null, placeholder: 'Sin datos' },
            { label: 'Nombre Legal',  value: MOCK_USUARIO.nombreLegal ?? null, placeholder: 'Sin datos' },
          ].map(({ label, value, placeholder }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5 }}>
                {label}
              </label>
              <div
                style={{
                  padding: '10px 13px',
                  background: value ? '#f9fafb' : '#fafafa',
                  border: `1.5px solid ${value ? '#e5e7eb' : '#fdd8b4'}`,
                  borderRadius: 12,
                  fontSize: 14,
                  color: value ? '#111827' : '#d1a070',
                  fontWeight: value ? 500 : 400,
                  fontStyle: value ? 'normal' : 'italic',
                }}
              >
                {value ?? placeholder}
              </div>
            </div>
          ))}

          <p style={{ fontSize: 12, color: '#c8ccd8', marginTop: 4 }}>
            Estos campos son gestionados por tu asesor.
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 88,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 340,
            width: 'calc(100% - 32px)',
            background: '#1c3829',
            borderRadius: 14,
            padding: '13px 18px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.20)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            zIndex: 95,
          }}
        >
          <CheckCircle2 size={18} color="#a8e890" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: '#fff' }}>
            Te hemos enviado un correo con el enlace para cambiar tu contraseña.
          </span>
          <button
            onClick={() => setToast(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.50)', padding: 0, display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </AgricultorLayout>
  )
}
