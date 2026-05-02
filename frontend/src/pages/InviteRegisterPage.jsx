import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail } from 'lucide-react'
import logoImg from '../assets/logo.jpg'
import AuthField from '../components/AuthField'
import { auth } from '../services/api'

const ERROR_MESSAGES = {
  404: 'El enlace de invitación no es válido o no existe.',
  409: 'Este email ya tiene una cuenta registrada.',
  410: 'La invitación ha expirado. Pide a tu asesor que te envíe una nueva.',
  422: 'El email introducido no coincide con el de la invitación.',
}

const LEAF_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 10 C20 10 35 8 38 25 C41 42 25 45 18 38 C11 31 14 18 20 10z' fill='%234e9a5f' fill-opacity='0.07'/%3E%3C/svg%3E")`

const CHECK_SVG = (
  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,7 5.5,11 12,3" />
  </svg>
)

export default function InviteRegisterPage() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', password: '', nombre: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.username.trim() || !form.password || !form.nombre.trim()) return setError('Completa todos los campos.')
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (!token) return setError('Token de invitación no válido.')

    setLoading(true)
    try {
      // Un solo endpoint atómico: registra, vincula asesoría y devuelve JWT
      const data = await auth.registerInvite(token, {
        username: form.username.trim(),
        password: form.password,
        nombre: form.nombre.trim()
      })
      localStorage.setItem('token', data.token)
      localStorage.setItem('username', form.username.trim())
      localStorage.setItem('rol', data.rol ?? 'GRANJERO')
      navigate('/cuaderno')
    } catch (err) {
      setError(
        ERROR_MESSAGES[err.status] ??
        err.message ??
        'Error al activar la cuenta. Inténtalo de nuevo.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ fontFamily: "'Inter',system-ui,sans-serif", background: '#f0f2f7', backgroundImage: LEAF_PATTERN, backgroundSize: '60px 60px' }}
    >
      <div className="flex flex-col items-center" style={{ maxWidth: 500, width: '100%' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-7">
          <img src={logoImg} alt="Camposync" className="object-contain bg-white" style={{ width: 44, height: 44, borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }} />
          <span className="font-bold" style={{ fontSize: 22, color: '#1a2e1a', letterSpacing: '-0.4px' }}>Camposync</span>
        </div>

        {/* Invitation badge */}
        <div className="flex items-center gap-2 mb-6" style={{ padding: '8px 18px', background: '#fff8f0', border: '1.5px solid #f0c898', borderRadius: 24 }}>
          <Mail size={14} color="#e07030" />
          <span className="font-semibold" style={{ fontSize: 13, color: '#c05010' }}>
            Invitación de tu asesoría agrícola
          </span>
        </div>

        {/* Card */}
        <div style={{ width: 480, background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.10)', padding: '40px 44px 38px' }}>

          <div className="text-center mb-6">
            <h1 className="font-bold mb-2" style={{ fontSize: 22, color: '#111827', letterSpacing: '-0.4px' }}>Activa tu cuenta de Granjero</h1>
            <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.6 }}>
              Tu asesoría te ha invitado a Camposync. Completa tu registro para gestionar tu cuaderno de campo.
            </p>
          </div>

          {/* Asesoría info box */}
          <div className="flex items-center gap-3.5 mb-6 rounded-xl" style={{ padding: '14px 18px', background: '#f0f8f0', border: '1px solid #c8e8b0' }}>
            <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: 40, height: 40, background: '#2e5c38' }}>
              <span className="font-bold" style={{ fontSize: 16, color: '#b8e898' }}>A</span>
            </div>
            <div>
              <p className="font-semibold" style={{ fontSize: 13, color: '#1a3820' }}>Asesoría Agrícola</p>
              <p style={{ fontSize: 12, color: '#6b9c5a' }}>Tu asesor registrado · Invitación válida 7 días</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">

            <AuthField
              label="Tu nombre completo"
              name="nombre"
              placeholder="Ej. Juan Pérez"
              value={form.nombre}
              onChange={handleChange}
            />

            <AuthField
              label="Tu email"
              name="username"
              placeholder="Ej. antonio@gmail.com"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
            />

            {/* Password */}
            <div>
              <label className="block mb-1.5" style={{ fontSize: 12.5, fontWeight: 500, color: '#374151' }}>Contraseña</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full transition focus:outline-none focus:bg-white focus:border-[#4e9a5f]"
                  style={{ height: 44, border: '1.5px solid #e5e7eb', borderRadius: 12, paddingLeft: 14, paddingRight: 44, fontSize: 13.5, background: '#f9fafb', color: '#111827' }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
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
              className="w-full flex items-center justify-center gap-2 font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60 mt-1"
              style={{ height: 48, background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 12, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(46,92,56,0.35)' }}
            >
              {!loading && (
                <span className="flex items-center justify-center" style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }}>
                  {CHECK_SVG}
                </span>
              )}
              {loading ? 'Activando cuenta…' : 'Activar mi cuenta'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center" style={{ fontSize: 12, color: '#b0b8c0', lineHeight: 1.8 }}>
          Si no esperabas esta invitación, puedes ignorar este enlace.<br />
          Caduca automáticamente en 7 días.
        </p>
      </div>
    </div>
  )
}
