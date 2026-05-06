import { useNavigate, useLocation } from 'react-router-dom'
import { Home, BookOpen, Map, User } from 'lucide-react'

const TABS = [
  { path: '/cuaderno',             label: 'Inicio',      Icon: Home,     exact: true  },
  { path: '/cuaderno/tratamientos',label: 'Cuaderno',    Icon: BookOpen, exact: false },
  { path: '/cuaderno/fincas',      label: 'Explotaciones', Icon: Map,      exact: false },
  { path: '/cuaderno/perfil',      label: 'Perfil',      Icon: User,     exact: false },
]

export default function AgricultorLayout({ children }) {
  const navigate       = useNavigate()
  const { pathname }   = useLocation()

  function isActive(tab) {
    return tab.exact ? pathname === tab.path : pathname.startsWith(tab.path)
  }

  return (
    <div
      className="min-h-screen flex justify-center"
      style={{ background: '#d8dde6', fontFamily: "'Inter',system-ui,sans-serif" }}
    >
      <div
        className="flex flex-col relative"
        style={{ width: '100%', maxWidth: 480, minHeight: '100vh', background: '#f0f2f7' }}
      >
        {/* Scrollable content — padded so it doesn't hide under nav */}
        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 72 }}>
          {children}
        </main>

        {/* Bottom navigation */}
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: 480,
            height: 68,
            background: '#ffffff',
            borderTop: '1px solid #e8eaf0',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.09)',
            zIndex: 100,
          }}
        >
          <div className="flex h-full">
            {TABS.map(({ path, label, Icon, exact }) => {
              const active = isActive({ path, exact })
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', paddingBottom: 4 }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 10,
                      background: active ? 'rgba(78,154,95,0.13)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <Icon size={18} color={active ? '#4e9a5f' : '#9ca3af'} strokeWidth={active ? 2.5 : 2} />
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: active ? 700 : 500,
                      color: active ? '#4e9a5f' : '#9ca3af',
                      letterSpacing: '-0.1px',
                    }}
                  >
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
