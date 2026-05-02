import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Users } from 'lucide-react'
import BrandPanel from '../components/BrandPanel'
import AuthField from '../components/AuthField'
import { auth } from '../services/api'

const CHECK_ICON = (
  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="#7ce050" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,7 5.5,11 12,3" />
  </svg>
)

const LEAF_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 10 C20 10 35 8 38 25 C41 42 25 45 18 38 C11 31 14 18 20 10z' fill='%234e9a5f' fill-opacity='0.07'/%3E%3C/svg%3E")`

export default function SignUpPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombreAsesor: '', nombreAsesoria: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [accepted, setAccepted] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.nombreAsesor || !form.nombreAsesoria || !form.email || !form.password) {
      return setError('Completa todos los campos.')
    }
    if (!accepted) return setError('Debes aceptar los Términos de servicio.')
    setLoading(true)
    try {
      await auth.registerAsesor(form)
      navigate('/login')
    } catch (err) {
      setError(err.message ?? 'Error al crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  const brandExtra = (
    <div className="mt-9">
      {['Invita a tus granjeros con un enlace', 'Valida tratamientos en un clic', 'Exporta informes CUE en PDF'].map(f => (
        <div key={f} className="flex items-center gap-2.5 mb-2.5">
          <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: 20, height: 20, background: 'rgba(110,200,80,0.25)' }}>
            {CHECK_ICON}
          </div>
          <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.70)' }}>{f}</span>
        </div>
      ))}
      <div className="mt-6 rounded-2xl" style={{ padding: '18px 22px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Ya confían en nosotros</p>
        <p className="font-bold text-white" style={{ fontSize: 26, letterSpacing: '-0.5px' }}>+340</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Asesorías activas en España</p>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Inter',system-ui,sans-serif", background: '#f0f2f7' }}>
      <BrandPanel headline={"Tu asesoría,\ndigitalizada en minutos"} sub="Crea tu cuenta de Asesoría y empieza a gestionar los Cuadernos de Campo de todos tus clientes desde un único panel.">
        {brandExtra}
      </BrandPanel>

      <div className="flex-1 flex items-center justify-center p-6" style={{ backgroundImage: LEAF_PATTERN, backgroundSize: '60px 60px' }}>
        <div style={{ width: 440, background: '#fff', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.10)', padding: '40px 44px 38px' }}>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 mb-3.5 rounded-full" style={{ padding: '4px 10px', background: '#f0f8f0', border: '1px solid #c8e8b0' }}>
            <Users size={13} color="#4e9a5f" />
            <span className="font-semibold" style={{ fontSize: 12, color: '#3a7a40' }}>Registro exclusivo para Asesorías</span>
          </div>

          <h1 className="font-bold mb-1" style={{ fontSize: 22, color: '#111827', letterSpacing: '-0.4px' }}>Crea tu Asesoría</h1>
          <p className="mb-6" style={{ fontSize: 14, color: '#9ca3af' }}>Gratis · Sin tarjeta · Listo en 2 minutos</p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
            <AuthField label="Nombre del Asesor" name="nombreAsesor" placeholder="Ej. Juan García López" value={form.nombreAsesor} onChange={handleChange} />
            <AuthField label="Nombre de la Asesoría" name="nombreAsesoria" placeholder="Ej. Asesoría Agrícola del Sur S.L." value={form.nombreAsesoria} onChange={handleChange} />
            <AuthField label="Email de la Asesoría" name="email" type="email" placeholder="info@asesoriadelsur.es" value={form.email} onChange={handleChange} autoComplete="email" icon={<Mail size={15} color="#9ca3af" />} />

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

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => setAccepted(v => !v)}
                className="flex-shrink-0 flex items-center justify-center rounded-md mt-0.5"
                style={{ width: 18, height: 18, border: `1.5px solid ${accepted ? '#4e9a5f' : '#d1d5db'}`, background: accepted ? '#4e9a5f' : '#fff', cursor: 'pointer' }}
              >
                {accepted && (
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2,7 5.5,11 12,3" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.55 }}>
                Acepto los{' '}
                <span className="cursor-pointer hover:underline" style={{ color: '#4e9a5f', fontWeight: 500 }}>Términos de servicio</span>
                {' '}y la{' '}
                <span className="cursor-pointer hover:underline" style={{ color: '#4e9a5f', fontWeight: 500 }}>Política de privacidad</span>
              </span>
            </label>

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
              {loading ? 'Creando cuenta…' : 'Crear mi Asesoría'}
            </button>
          </form>

          <p className="text-center mt-5" style={{ fontSize: 13.5, color: '#6b7280' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#4e9a5f' }}>Inicia sesión</Link>
          </p>
          <div className="text-center mt-2.5 px-3.5 py-2.5 rounded-xl" style={{ background: '#f8f9fb', border: '1px solid #e8eaf0' }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>¿Eres agricultor? </span>
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Solicita acceso a tu asesoría para empezar.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
