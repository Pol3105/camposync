import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { granjero } from '../services/api'
import ModalNuevoTratamiento from '../components/ModalNuevoTratamiento'

/* ── Design tokens ──────────────────────────────────────────────────────── */
const GREEN_DARK  = '#1c3829'
const GREEN_MID   = '#2e5c38'
const GREEN_ACT   = '#4e9a5f'
const GREEN_LIGHT = '#7cc94a'
const PAGE_BG     = '#f2f4f0'

/* ── Icons ──────────────────────────────────────────────────────────────── */
const BellIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const TractorIcon = () => (
  <svg width="56" height="56" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="46" r="10" stroke={GREEN_ACT} strokeWidth="3" fill="#edf7e8" />
    <circle cx="18" cy="46" r="4"  fill={GREEN_ACT} />
    <circle cx="48" cy="50" r="6"  stroke={GREEN_ACT} strokeWidth="3" fill="#edf7e8" />
    <circle cx="48" cy="50" r="2.5" fill={GREEN_ACT} />
    <rect x="10" y="28" width="30" height="16" rx="4" fill="#c8e8b0" stroke={GREEN_MID} strokeWidth="2" />
    <rect x="28" y="22" width="18" height="14" rx="3" fill="#edf7e8" stroke={GREEN_MID} strokeWidth="2" />
    <rect x="40" y="28" width="10" height="8"  rx="2" fill="#b8e898" stroke={GREEN_MID} strokeWidth="1.5" />
    <line x1="10" y1="36" x2="4"  y2="36" stroke={GREEN_MID} strokeWidth="2" strokeLinecap="round" />
    <line x1="4"  y1="36" x2="4"  y2="44" stroke={GREEN_MID} strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const PlusIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5"  y1="12" x2="19" y2="12" />
  </svg>
)

/* ── Bottom tab icons ───────────────────────────────────────────────────── */
const HomeIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? GREEN_ACT : 'none'} stroke={active ? GREEN_ACT : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <polyline points="9 21 9 12 15 12 15 21" />
  </svg>
)
const BookIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? GREEN_ACT : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)
const MapIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? GREEN_ACT : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
)
const UserIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? GREEN_ACT : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const TABS = [
  { key: 'inicio',   label: 'Inicio',   Icon: HomeIcon },
  { key: 'cuaderno', label: 'Cuaderno', Icon: BookIcon },
  { key: 'parcelas', label: 'Parcelas', Icon: MapIcon  },
  { key: 'perfil',   label: 'Perfil',   Icon: UserIcon },
]

/* ── Helpers ────────────────────────────────────────────────────────────── */
function todayLabel() {
  return new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

function firstName(raw = '') {
  const part = raw.split('@')[0]
  return part.charAt(0).toUpperCase() + part.slice(1)
}

function formatFecha(isoDate) {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

/* ── TratamientoCard ────────────────────────────────────────────────────── */
function TratamientoCard({ t }) {
  const estadoColor = t.validado ? GREEN_ACT : '#f59e0b'
  const estadoLabel = t.validado ? 'Validado' : 'Pendiente'

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      padding: '14px 16px',
      boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: GREEN_DARK, margin: 0 }}>
          {t.productoNombre ?? `Producto #${t.productoFitosanitarioId}`}
        </p>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 8px',
          borderRadius: 20, background: t.validado ? '#edf7e8' : '#fef3c7',
          color: estadoColor,
        }}>
          {estadoLabel}
        </span>
      </div>
      <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
        {t.parcelaRefCatastral ?? '—'}
        {t.recintoNumero != null && <span style={{ color: '#9ca3af' }}> · Recinto {t.recintoNumero}</span>}
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
          {t.dosis} {t.unidades}
        </p>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
          {formatFecha(t.fecha)}
        </p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════ */
export default function DashboardGranjero() {
  const navigate  = useNavigate()
  const username  = localStorage.getItem('username') ?? 'usuario'

  const [activeTab,        setActiveTab]        = useState('inicio')
  const [numExplotaciones, setNumExplotaciones] = useState(null)
  const [listaTratamientos,setListaTratamientos]= useState([])
  const [modalAbierto,     setModalAbierto]     = useState(false)

  function cargarTratamientos() {
    granjero.tratamientos()
      .then(data => setListaTratamientos(data))
      .catch(() => setListaTratamientos([]))
  }

  useEffect(() => {
    granjero.explotaciones()
      .then(data => setNumExplotaciones(data.length))
      .catch(() => setNumExplotaciones(0))
    cargarTratamientos()
  }, [])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('rol')
    navigate('/login')
  }

  function handleTratamientoCreado(nuevo) {
    setListaTratamientos(prev => [nuevo, ...prev])
    setModalAbierto(false)
  }

  const ultimos3 = listaTratamientos.slice(0, 3)

  return (
    <div style={{
      minHeight: '100dvh', background: PAGE_BG,
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter',system-ui,sans-serif",
      alignItems: 'center', justifyContent: 'flex-start',
    }}>
      <div style={{
        width: '100%', maxWidth: 430, minHeight: '100dvh',
        background: PAGE_BG, position: 'relative',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{ background: GREEN_DARK, paddingInline: 22, paddingBottom: 24, paddingTop: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>
                Hola, {firstName(username)} 👋
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', margin: '3px 0 0', textTransform: 'capitalize' }}>
                {todayLabel()}
              </p>
            </div>
            <button
              onClick={() => {}}
              style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 12, width: 42, height: 42, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <BellIcon />
            </button>
          </div>
        </div>

        {/* ── Wave divider ────────────────────────────────────────────── */}
        <div style={{ height: 22, background: GREEN_DARK, flexShrink: 0 }}>
          <div style={{ height: '100%', background: PAGE_BG, borderRadius: '20px 20px 0 0' }} />
        </div>

        {/* ── Scrollable content ───────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: GREEN_MID, borderRadius: 18, padding: '18px 16px', color: '#fff' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: '0 0 8px', fontWeight: 500 }}>Explotaciones</p>
              <p style={{ fontSize: 38, fontWeight: 800, margin: 0, lineHeight: 1, color: '#fff' }}>{numExplotaciones ?? '—'}</p>
              <p style={{ fontSize: 11, color: GREEN_LIGHT, margin: '6px 0 0', fontWeight: 500 }}>registradas</p>
            </div>
            <div style={{ background: '#fff', borderRadius: 18, padding: '18px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 8px', fontWeight: 500 }}>Tratamientos</p>
              <p style={{ fontSize: 38, fontWeight: 800, margin: 0, lineHeight: 1, color: GREEN_DARK }}>{listaTratamientos.length || '—'}</p>
              <p style={{ fontSize: 11, color: GREEN_ACT, margin: '6px 0 0', fontWeight: 500 }}>registrados</p>
            </div>
          </div>

          {/* Empty state card — solo si no hay tratamientos */}
          {listaTratamientos.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 18, padding: '32px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, background: '#edf7e8', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TractorIcon />
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: GREEN_DARK, margin: '0 0 6px' }}>Tu cuaderno está al día</p>
                <p style={{ fontSize: 13.5, color: '#9ca3af', margin: 0, lineHeight: 1.6 }}>
                  Toca el botón verde para añadir tu primer tratamiento.
                </p>
              </div>
            </div>
          )}

          {/* Últimos registros */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: GREEN_DARK, margin: 0 }}>Últimos registros</p>
              <button style={{ background: 'none', border: 'none', fontSize: 13, color: GREEN_ACT, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                Ver todos
              </button>
            </div>

            {ultimos3.length === 0 ? (
              <div style={{ border: `1.5px dashed #c8e8b0`, borderRadius: 14, padding: '20px 16px', textAlign: 'center', background: '#fafff8' }}>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                  Aún no hay tratamientos registrados.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ultimos3.map(t => <TratamientoCard key={t.id} t={t} />)}
              </div>
            )}
          </div>

          {/* Logout link */}
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 12, cursor: 'pointer', marginTop: 8, padding: 0 }}
          >
            Cerrar sesión
          </button>
        </div>

        {/* ── FAB ─────────────────────────────────────────────────────── */}
        <button
          onClick={() => setModalAbierto(true)}
          style={{
            position: 'absolute', bottom: 86 + 16, right: 20,
            width: 64, height: 64, borderRadius: 20,
            background: `linear-gradient(135deg, ${GREEN_MID}, ${GREEN_ACT})`,
            border: 'none', boxShadow: `0 6px 20px rgba(46,92,56,0.45)`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
          }}
          title="Registrar Tratamiento"
        >
          <PlusIcon />
        </button>

        {/* ── Bottom tab bar ───────────────────────────────────────────── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 86,
          background: '#fff', borderTop: '1px solid #f0f0f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          paddingBottom: 10, zIndex: 10,
        }}>
          {TABS.map(({ key, label, Icon }) => {
            const active = activeTab === key
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 4, padding: '6px 14px', borderRadius: 12,
                  ...(active && { background: '#edf7e8' }),
                }}
              >
                <Icon active={active} />
                <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 400, color: active ? GREEN_ACT : '#9ca3af' }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      {modalAbierto && (
        <ModalNuevoTratamiento
          onClose={() => setModalAbierto(false)}
          onCreado={handleTratamientoCreado}
        />
      )}
    </div>
  )
}
