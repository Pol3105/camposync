import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { auth } from '../services/api'
import logoImg from '../assets/logo.jpg'

const LEAF_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 10 C20 10 35 8 38 25 C41 42 25 45 18 38 C11 31 14 18 20 10z' fill='%234e9a5f' fill-opacity='0.07'/%3E%3C/svg%3E")`

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return setError('Introduce tu correo electrónico.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return setError('El formato del correo no es válido.')

    setLoading(true)
    setError('')
    try {
      await auth.forgotPassword(trimmed)
      setSent(true)
    } catch {
      // Always show success to avoid user enumeration
      setSent(true)
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

          {!sent ? (
            <>
              <div className="text-center mb-7">
                <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, borderRadius: 16, background: '#fff8ed', border: '1.5px solid #fdd8a0' }}>
                  <span style={{ fontSize: 26 }}>🔑</span>
                </div>
                <h1 className="font-bold mb-2" style={{ fontSize: 22, color: '#111827', letterSpacing: '-0.4px' }}>¿Olvidaste tu contraseña?</h1>
                <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.6 }}>
                  Introduce tu correo y te enviaremos un enlace para restablecerla.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <div>
                  <label className="block mb-1.5" style={{ fontSize: 12.5, fontWeight: 500, color: '#374151' }}>
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Mail size={15} color="#9ca3af" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); if (error) setError('') }}
                      placeholder="tu@correo.com"
                      autoFocus
                      className="w-full transition focus:outline-none focus:border-[#4e9a5f]"
                      style={{ height: 44, border: `1.5px solid ${error ? '#f8c8c8' : '#e5e7eb'}`, borderRadius: 12, paddingLeft: 44, paddingRight: 14, fontSize: 13.5, background: '#f9fafb', color: '#111827', fontFamily: 'inherit' }}
                    />
                  </div>
                  {error && <p className="mt-1.5" style={{ fontSize: 12, color: '#c03030' }}>{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ height: 48, background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 12, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(46,92,56,0.35)' }}
                >
                  {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: 20, background: '#edf7e8', border: '1.5px solid #c0e8b0' }}>
                <CheckCircle2 size={30} color="#4e9a5f" />
              </div>
              <h2 className="font-bold" style={{ fontSize: 20, color: '#111827', letterSpacing: '-0.3px' }}>Correo enviado</h2>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65, maxWidth: 340 }}>
                Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña. Revisa también tu carpeta de spam.
              </p>
              <p style={{ fontSize: 12.5, color: '#9ca3af' }}>El enlace caduca en 1 hora.</p>
            </div>
          )}

          <div className="text-center mt-6">
            <Link to="/login" className="inline-flex items-center gap-1.5 transition hover:opacity-70" style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none' }}>
              <ArrowLeft size={13} />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
