import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, Plus, ChevronRight } from 'lucide-react'
import AgricultorLayout from './AgricultorLayout'
import { MOCK_USUARIO, MOCK_EXPLOTACIONES, MOCK_TRATAMIENTOS } from './mock'

function greeting() {
  const h = new Date().getHours()
  if (h < 13) return 'Buenos días'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

function todayLabel() {
  return new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

function firstName(nombre) {
  return nombre?.split(' ')[0] ?? 'Agricultor'
}

function initials(nombre) {
  const p = (nombre ?? '').trim().split(' ')
  return p.length >= 2 ? p[0][0] + p[1][0] : (p[0]?.[0] ?? '?')
}

export default function DashboardAgricultor() {
  const navigate = useNavigate()
  const [fabToast, setFabToast] = useState(false)

  const pendientes = MOCK_TRATAMIENTOS.filter(t => !t.validado)
  const validados  = MOCK_TRATAMIENTOS.filter(t => t.validado)
  const recientes  = MOCK_TRATAMIENTOS.slice(0, 3)

  function handleFab() {
    setFabToast(true)
    setTimeout(() => setFabToast(false), 3500)
  }

  return (
    <AgricultorLayout>
      {/* ── Header card ── */}
      <div
        style={{
          background: 'linear-gradient(145deg, #1c3829 0%, #2e5c38 60%, #3d7a4a 100%)',
          padding: '28px 22px 36px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* decorative circle */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', top: 20, right: 20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div className="flex items-start justify-between">
          <div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 2, textTransform: 'capitalize' }}>
              {todayLabel()}
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              {greeting()},{' '}
              <span style={{ color: '#a8e890' }}>{firstName(MOCK_USUARIO.nombre)}</span> 👋
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', marginTop: 4 }}>
              Bienvenido a tu cuaderno de campo
            </p>
          </div>

          {/* Avatar */}
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: '#a8e890' }}>
              {initials(MOCK_USUARIO.nombre).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats strip (overlaps header slightly) ── */}
      <div style={{ padding: '0 16px', marginTop: -22 }}>
        <div className="grid grid-cols-2 gap-3">
          {/* Explotaciones */}
          <div
            style={{
              background: '#fff',
              borderRadius: 18,
              padding: '16px 18px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Fincas
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, color: '#111827', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {MOCK_EXPLOTACIONES.length}
            </div>
            <div style={{ fontSize: 12, color: '#4e9a5f', fontWeight: 500, marginTop: 4 }}>
              {MOCK_EXPLOTACIONES.reduce((a, e) => a + e.numParcelas, 0)} parcelas totales
            </div>
          </div>

          {/* Pendientes */}
          <div
            style={{
              background: pendientes.length > 0 ? '#fff8f2' : '#fff',
              borderRadius: 18,
              padding: '16px 18px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
              border: pendientes.length > 0 ? '1.5px solid #fdd8b4' : '1.5px solid transparent',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              Pendientes
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                color: pendientes.length > 0 ? '#e07830' : '#111827',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {pendientes.length}
            </div>
            <div style={{ fontSize: 12, color: pendientes.length > 0 ? '#c25c10' : '#9ca3af', fontWeight: 500, marginTop: 4 }}>
              {pendientes.length > 0 ? 'Sin validar por asesor' : 'Al día 🎉'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Cuaderno al día ── */}
      <div style={{ padding: '22px 16px 0' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>
            Cuaderno al día
          </h2>
          <button
            onClick={() => navigate('/cuaderno/tratamientos')}
            style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 600, color: '#4e9a5f', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Ver todo
            <ChevronRight size={14} color="#4e9a5f" />
          </button>
        </div>

        {recientes.length === 0 ? (
          <div
            style={{
              background: '#fff',
              borderRadius: 18,
              padding: '32px 20px',
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>Sin tratamientos registrados</p>
            <p style={{ fontSize: 12.5, color: '#c8ccd8', marginTop: 4 }}>Pulsa + para añadir el primero</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recientes.map(t => {
              const fecha = new Date(t.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
              return (
                <div
                  key={t.id}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: '14px 16px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 13,
                  }}
                >
                  {/* Estado icon */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 11,
                      background: t.validado ? '#edf7e8' : '#fef9ed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {t.validado
                      ? <CheckCircle size={18} color="#4e9a5f" />
                      : <Clock size={18} color="#d4a017" />
                    }
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.producto}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      {t.explotacion} · Recinto {t.recintoNum}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: 20,
                        background: t.validado ? '#edf7e8' : '#fef9ed',
                        color: t.validado ? '#267a40' : '#8a6010',
                        border: `1px solid ${t.validado ? '#c0e8b0' : '#f5d878'}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.validado ? 'Validado' : 'Pendiente'}
                    </span>
                    <span style={{ fontSize: 11, color: '#c8ccd8', fontVariantNumeric: 'tabular-nums' }}>{fecha}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Fincas resumen ── */}
      <div style={{ padding: '22px 16px 12px' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>
            Mis Fincas
          </h2>
          <button
            onClick={() => navigate('/cuaderno/fincas')}
            style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 600, color: '#4e9a5f', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Ver todo
            <ChevronRight size={14} color="#4e9a5f" />
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {MOCK_EXPLOTACIONES.map(e => (
            <button
              key={e.id}
              onClick={() => navigate(`/cuaderno/fincas/${e.id}`)}
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: '14px 16px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  background: 'linear-gradient(145deg,#e4f5e0,#c8e8b8)',
                  border: '1px solid #b0d890',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 20,
                }}
              >
                {e.orientacion === 'OL' ? '🫒' : e.orientacion === 'CE' ? '🌾' : e.orientacion === 'VI' ? '🍇' : '🌿'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.nombre}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                  {e.superficie} ha · {e.numParcelas} parcelas · {e.municipio}
                </div>
              </div>
              <ChevronRight size={16} color="#d1d5db" />
            </button>
          ))}
        </div>
      </div>

      {/* ── FAB ── */}
      <button
        onClick={handleFab}
        style={{
          position: 'fixed',
          bottom: 88,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)',
          border: 'none',
          boxShadow: '0 6px 20px rgba(46,92,56,0.45)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 90,
          transition: 'transform 0.15s',
        }}
        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)' }}
        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        <Plus size={24} color="#fff" strokeWidth={2.5} />
      </button>

      {/* FAB toast */}
      {fabToast && (
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
            padding: '12px 18px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.20)',
            color: '#a8e890',
            fontSize: 13.5,
            fontWeight: 600,
            textAlign: 'center',
            zIndex: 95,
          }}
        >
          📋 Registro de Tratamiento — <span style={{ color: '#fff' }}>Próximamente</span>
        </div>
      )}
    </AgricultorLayout>
  )
}
