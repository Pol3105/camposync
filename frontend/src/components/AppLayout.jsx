import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutGrid, Users, Map, FlaskConical, Mail, Settings, LogOut } from 'lucide-react'
import logoImg from '../assets/logo.jpg'

const S = {
  sidebar: { bg: '#1c3829', activeBg: 'rgba(110,180,80,0.18)', activeBar: '#7cc94a', textActive: '#d4f1b0', textMuted: '#7aac66' },
  topbar:  { bg: '#ffffff', border: '#e8eaf0', shadow: '0 1px 3px rgba(0,0,0,0.06)' },
}

const NAV = [
  { label: 'Dashboard',        Icon: LayoutGrid,  path: '/dashboard'     },
  { label: 'Mis Agricultores', Icon: Users,       path: '/agricultores'  },
  { label: 'Explotaciones',    Icon: Map,         path: '/explotaciones' },
  { label: 'Tratamientos',     Icon: FlaskConical,path: '/tratamientos'  },
  { label: 'Invitaciones',     Icon: Mail,        path: '/invitaciones'  },
  { label: 'Configuración',    Icon: Settings,    path: '/configuracion' },
]

/**
 * @param {{ title?: string, greeting?: boolean, children: React.ReactNode }} props
 */
export default function AppLayout({ title, greeting = false, children }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const username  = localStorage.getItem('username') ?? 'Asesoría'

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    navigate('/login')
  }

  function handleNav(path) {
    if (path) navigate(path)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter',system-ui,sans-serif", background: '#f0f2f7' }}>

      {/* ── Sidebar ── */}
      <aside className="flex flex-col flex-shrink-0" style={{ width: 224, background: S.sidebar.bg }}>
        <div className="flex items-center gap-2.5" style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <img src={logoImg} alt="Camposync" className="object-contain bg-white" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <span className="font-bold" style={{ fontSize: 17, color: '#e4f5d4', letterSpacing: '-0.3px' }}>Camposync</span>
        </div>

        <nav className="flex-1" style={{ padding: '12px 10px' }}>
          {NAV.map(({ label, Icon, path }) => {
            const active = path ? location.pathname === path : false
            return (
              <button
                key={label}
                onClick={() => handleNav(path)}
                className="flex items-center gap-2.5 w-full transition-colors"
                style={{
                  padding: '9px 10px',
                  borderRadius: 10,
                  marginBottom: 2,
                  cursor: path ? 'pointer' : 'default',
                  background: active ? S.sidebar.activeBg : 'transparent',
                  border: 'none',
                  borderLeft: `3px solid ${active ? S.sidebar.activeBar : 'transparent'}`,
                  fontWeight: 500,
                  fontSize: 13.5,
                  fontFamily: 'inherit',
                  opacity: path ? 1 : 0.45,
                }}
              >
                <Icon size={17} color={active ? S.sidebar.textActive : S.sidebar.textMuted} />
                <span style={{ color: active ? S.sidebar.textActive : S.sidebar.textMuted }}>{label}</span>
              </button>
            )
          })}
        </nav>

        <div className="flex items-center gap-2.5" style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: 34, height: 34, background: '#3a6b2e', border: '2px solid rgba(255,255,255,0.18)' }}>
            <span className="font-bold" style={{ fontSize: 14, color: '#b8e898' }}>{username[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate" style={{ fontSize: 13, color: '#c8e8a8' }}>{username}</p>
            <p className="truncate" style={{ fontSize: 11, color: S.sidebar.textMuted }}>Asesor</p>
          </div>
          <button onClick={logout} className="transition hover:opacity-70 flex-shrink-0" title="Cerrar sesión">
            <LogOut size={15} color={S.sidebar.textMuted} />
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="flex items-center flex-shrink-0 gap-4" style={{ height: 58, background: S.topbar.bg, borderBottom: `1px solid ${S.topbar.border}`, boxShadow: S.topbar.shadow, padding: '0 28px' }}>
          <div className="flex-1">
            {greeting ? (
              <>
                <span className="font-bold" style={{ fontSize: 18, color: '#1a1e1a', letterSpacing: '-0.3px' }}>Hola, {username}</span>
                <span style={{ fontSize: 18, marginLeft: 6 }}>👋</span>
              </>
            ) : (
              <span className="font-bold" style={{ fontSize: 18, color: '#1a1e1a', letterSpacing: '-0.3px' }}>{title}</span>
            )}
          </div>

        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ padding: '26px 28px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
