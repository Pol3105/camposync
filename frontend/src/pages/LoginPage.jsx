import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import BrandPanel from '../components/BrandPanel'
import AuthField from '../components/AuthField'
import { auth } from '../services/api'

const CHECK_ICON = (
  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="#7ce050" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,7 5.5,11 12,3" />
  </svg>
)

const FEATURES = [
  'Validación de tratamientos en un clic',
  'Cuadernos CUE siempre actualizados',
  'Conectado con tus granjeros',
]

const LEAF_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 10 C20 10 35 8 38 25 C41 42 25 45 18 38 C11 31 14 18 20 10z' fill='%234e9a5f' fill-opacity='0.07'/%3E%3C/svg%3E")`

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    // 1. Protección contra el refresco
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    console.log("Intentando login..."); // Para ver si llegamos aquí

    setError('')
    if (!form.username.trim() || !form.password) return setError('Completa todos los campos.')
    setLoading(true)
    try {
      const data = await auth.login(form.username.trim(), form.password)
      localStorage.setItem('token', data.token)
      localStorage.setItem('username', form.username.trim())
      localStorage.setItem('rol', data.rol ?? '')
      // Role-based redirect: GRANJERO → /cuaderno, ASESOR (and others) → /dashboard
      navigate(data.rol === 'GRANJERO' ? '/cuaderno' : '/dashboard')
    } catch (err) {
      console.error("DEBUG - Objeto de error completo:", err);

      // 3. Extracción ultra-segura (usando lo que configuró Claude)
      const status = err?.status || err?.response?.status;
      
      const msg = err?.message || "Error inesperado de conexión.";
      setError(err.status === 401 ? 'Usuario o contraseña incorrectos.' : (err.message ?? 'Error de conexión.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Inter',system-ui,sans-serif", background: '#f0f2f7' }}>
      <BrandPanel
        headline={"Gestión de Cuadernos\nde Campo Digital"}
        sub="La plataforma para Asesorías Agrícolas que quieren trabajar de forma más eficiente y conectada con sus granjeros."
      >
        <div className="flex flex-col gap-2.5 mt-8">
          {FEATURES.map(f => (
            <div key={f} className="flex items-center gap-2.5">
              <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: 20, height: 20, background: 'rgba(110,200,80,0.25)' }}>
                {CHECK_ICON}
              </div>
              <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.70)' }}>{f}</span>
            </div>
          ))}
        </div>
      </BrandPanel>

      {/* Right panel */}
      <div
        className="flex-1 flex items-center justify-center p-6"
        style={{ backgroundImage: LEAF_PATTERN, backgroundSize: '60px 60px' }}
      >
        <div style={{ width: 420, background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.10)', padding: '44px 44px 40px' }}>
          <div className="mb-8">
            <h1 className="font-bold mb-1.5" style={{ fontSize: 22, color: '#111827', letterSpacing: '-0.4px' }}>Bienvenido de nuevo</h1>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>Accede a tu panel de Camposync</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <AuthField
              label="Correo electrónico"
              name="username"
              placeholder="Correo electrónico"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              icon={<User size={16} color="#9ca3af" />}
            />

            <AuthField
              label="Contraseña"
              name="password"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              icon={<Lock size={16} color="#9ca3af" />}
              rightIcon={
                <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1} className="text-gray-400 hover:text-gray-600 transition">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#fff3e6', border: '1px solid #fdd8b4', color: '#c25c10', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ height: 48, background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 12, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(46,92,56,0.35)', marginTop: 4 }}
            >
              {loading ? 'Iniciando sesión…' : 'Entrar'}
            </button>
          </form>

          {/* Forgot password */}
          <div className="text-right mt-1 mb-1">
            <Link to="/forgot-password" style={{ fontSize: 12.5, color: '#9ca3af', textDecoration: 'none' }}
              className="hover:underline hover:text-gray-600 transition">
              ¿Has olvidado tu contraseña?
            </Link>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: '#f0f0f0' }} />
            <span style={{ fontSize: 12, color: '#c8ccd8' }}>o</span>
            <div className="flex-1 h-px" style={{ background: '#f0f0f0' }} />
          </div>

          <p className="text-center" style={{ fontSize: 13.5, color: '#6b7280' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: '#4e9a5f' }}>
              Crea tu Asesoría gratis
            </Link>
          </p>

          <div className="text-center mt-3 px-3.5 py-2.5 rounded-xl" style={{ background: '#f8f9fb', border: '1px solid #e8eaf0' }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>¿Eres agricultor? </span>
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Solicita acceso a tu asesoría para empezar.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
