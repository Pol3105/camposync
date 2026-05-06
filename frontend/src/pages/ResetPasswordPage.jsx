import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { auth } from '../services/api'
import logoImg from '../assets/logo.jpg'

const LEAF_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 10 C20 10 35 8 38 25 C41 42 25 45 18 38 C11 31 14 18 20 10z' fill='%234e9a5f' fill-opacity='0.07'/%3E%3C/svg%3E")`

const ERROR_MESSAGES = {
  404: 'El enlace de recuperación no es válido o ya fue usado.',
  410: 'El enlace de recuperación ha expirado. Solicita uno nuevo.',
}

export default function ResetPasswordPage() {
  const { token }   = useParams()
  const navigate    = useNavigate()

  const [form, setForm]         = useState({ password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState('')

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.password) return setError('Introduce la nueva contraseña.')
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden.')
    if (!token) return setError('Token no válido.')

    setLoading(true)
    try {
      await auth.resetPassword(token, form.password)
      setDone(true)
      setTimeout(() => navigate('/login', { state: { resetSuccess: true } }), 2500)
    } catch (err) {
      setError(ERROR_MESSAGES[err.status] ?? err.message ?? 'Error al restablecer la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ fontFamily: "'Inter',system-ui,sans-serif", background: '#f0f2f7', backgroundImage: LEAF_PATTERN, backgroundSize: '60px 60px' }}
    >
      <div className="flex flex-col items-center" style={{ maxWidth: 480, width: '100%' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-7">
          <img src={logoImg} alt="Camposync" className="object-contain bg-white" style={{ width: 44, height: 44, borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }} />
          <span className="font-bold" style={{ fontSize: 22, color: '#1a2e1a', letterSpacing: '-0.4px' }}>Camposync</span>
        </div>

        {/* Card */}
        <div style={{ width: '100%', background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.10)', padding: '40px 44px 38px' }}>

          {!done ? (
            <>
              <div className="text-center mb-7">
                <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, borderRadius: 16, background: '#fff8ed', border: '1.5px solid #fdd8a0' }}>
                  <span style={{ fontSize: 26 }}>🔑</span>
                </div>
                <h1 className="font-bold mb-2" style={{ fontSize: 22, color: '#111827', letterSpacing: '-0.4px' }}>Nueva contraseña</h1>
                <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.6 }}>Elige una contraseña segura para tu cuenta.</p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

                {/* Nueva contraseña */}
                <div>
                  <label className="block mb-1.5" style={{ fontSize: 12.5, fontWeight: 500, color: '#374151' }}>
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres"
                      value={form.password}
                      onChange={handleChange}
                      autoFocus
                      autoComplete="new-password"
                      className="w-full transition focus:outline-none focus:border-[#4e9a5f]"
                      style={{ height: 44, border: '1.5px solid #e5e7eb', borderRadius: 12, paddingLeft: 14, paddingRight: 44, fontSize: 13.5, background: '#f9fafb', color: '#111827', fontFamily: 'inherit' }}
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirmar contraseña */}
                <div>
                  <label className="block mb-1.5" style={{ fontSize: 12.5, fontWeight: 500, color: '#374151' }}>
                    Confirmar nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      name="confirm"
                      type={showConf ? 'text' : 'password'}
                      placeholder="Repite la contraseña"
                      value={form.confirm}
                      onChange={handleChange}
                      autoComplete="new-password"
                      className="w-full transition focus:outline-none focus:border-[#4e9a5f]"
                      style={{ height: 44, border: `1.5px solid ${error && form.confirm && form.password !== form.confirm ? '#f8c8c8' : '#e5e7eb'}`, borderRadius: 12, paddingLeft: 14, paddingRight: 44, fontSize: 13.5, background: '#f9fafb', color: '#111827', fontFamily: 'inherit' }}
                    />
                    <button type="button" onClick={() => setShowConf(v => !v)} tabIndex={-1} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                      {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl" style={{ background: '#fff3e6', border: '1px solid #fdd8b4', color: '#c25c10', fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60 mt-1"
                  style={{ height: 48, background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 12, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(46,92,56,0.35)' }}
                >
                  {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: 20, background: '#edf7e8', border: '1.5px solid #c0e8b0' }}>
                <CheckCircle2 size={30} color="#4e9a5f" />
              </div>
              <h2 className="font-bold" style={{ fontSize: 20, color: '#111827', letterSpacing: '-0.3px' }}>¡Contraseña actualizada!</h2>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65 }}>
                Tu contraseña se ha cambiado correctamente. Redirigiendo al login…
              </p>
            </div>
          )}

          {!done && (
            <div className="text-center mt-6">
              <Link to="/login" className="inline-flex items-center gap-1.5 transition hover:opacity-70" style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none' }}>
                <ArrowLeft size={13} />
                Volver al inicio de sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
