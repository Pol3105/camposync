import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, AlertTriangle, ArrowLeft, Map, Pipette, Tractor, Sprout } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import { asesor } from '../services/api'

export default function RevisionTratamientoPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const tratamiento = location.state?.tratamiento

  const [aplicadores, setAplicadores] = useState([])
  const [equipamientos, setEquipamientos] = useState([])

  // Form state
  const [plagaObjetivo, setPlagaObjetivo] = useState(tratamiento?.plagaObjetivo || '')
  const [aplicadorId, setAplicadorId] = useState(tratamiento?.aplicadorId || '')
  const [equipamientoId, setEquipamientoId] = useState(tratamiento?.equipamientoId || '')
  const [observaciones, setObservaciones] = useState(tratamiento?.observacionesValidador || '')

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!tratamiento) {
      navigate('/tratamientos', { replace: true })
      return
    }

    // Fetch aplicadores y equipamientos del granjero
    async function fetchData() {
      try {
        const [apls, eqs] = await Promise.all([
          asesor.aplicadoresDeGranjero(tratamiento.granjeroUsername),
          asesor.equipamientoDeGranjero(tratamiento.granjeroUsername)
        ])
        setAplicadores(apls || [])
        setEquipamientos(eqs || [])
      } catch (err) {
        console.error("Error fetching farmer resources", err)
      }
    }
    fetchData()
  }, [tratamiento, navigate])

  if (!tratamiento) return null

  const nombreProducto = tratamiento.aliasAgric || tratamiento.productoNombre || 'Producto Desconocido'

  async function handleValidar() {
    setSaving(true)
    try {
      await asesor.validarTratamiento(tratamiento.id, {
        validado: true,
        observacionesValidador: observaciones || null,
        plagaObjetivo: plagaObjetivo || null,
        aplicadorId: aplicadorId ? Number(aplicadorId) : null,
        equipamientoId: equipamientoId ? Number(equipamientoId) : null
      })
      navigate('/tratamientos')
    } catch (err) {
      alert("Error al validar el tratamiento")
      setSaving(false)
    }
  }

  return (
    <AppLayout title="Revisión de Tratamiento">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div>
          <button
            onClick={() => navigate('/tratamientos')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 12 }}
          >
            <ArrowLeft size={16} />
            Volver a tratamientos
          </button>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', letterSpacing: '-0.5px' }}>Revisión y Validación</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
            Revisa los datos reportados y aplica las correcciones necesarias antes de validar.
          </div>
        </div>

        {/* Layout de 2 columnas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>

          {/* Columna Izquierda: Datos del Tratamiento */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eceef5', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #eceef5' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Datos Registrados</div>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Fecha</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                      {tratamiento.fecha ? new Date(tratamiento.fecha).toLocaleDateString('es-ES') : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Agricultor</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{tratamiento.granjeroNombre || tratamiento.granjeroUsername}</div>
                  </div>
                </div>

                <div style={{ height: 1, background: '#f3f4f6' }} />

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Producto</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#2e5c38' }}>{nombreProducto}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{tratamiento.productoPrincipioActivo || 'Principio activo no disponible'}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Dosis</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{tratamiento.dosis} {tratamiento.unidades}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Superficie</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{tratamiento.superficieTratada} ha</div>
                  </div>
                </div>

                <div style={{ height: 1, background: '#f3f4f6' }} />

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Ubicación</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    {tratamiento.explotacionNombre} · {tratamiento.parcelaMunicipio}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                    Parcela {tratamiento.parcelaRefCatastral} · Recinto {tratamiento.recintoNumero} ({tratamiento.recintoCultivo})
                  </div>
                </div>

              </div>
            </div>

            {/* Mapa Placeholder */}
            <div style={{ background: '#f9fafb', borderRadius: 16, border: '1px solid #eceef5', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#9ca3af' }}>
              <Map size={32} />
              <div style={{ fontSize: 13, fontWeight: 500 }}>Mapa del Recinto (Próximamente)</div>
            </div>
          </div>

          {/* Columna Derecha: Formulario de Corrección */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eceef5', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #eceef5', background: '#fafbfe' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Correcciones del Asesor</div>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Plaga */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  <Sprout size={16} color="#4e9a5f" />
                  Plaga Objetivo
                </label>
                <input
                  type="text"
                  value={plagaObjetivo}
                  onChange={e => setPlagaObjetivo(e.target.value)}
                  placeholder="Ej. Araña roja, Oídio..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', transition: 'border 0.2s', fontFamily: 'inherit' }}
                />
              </div>

              {/* Aplicador */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  <Pipette size={16} color="#4e9a5f" />
                  Aplicador
                </label>
                <select
                  value={aplicadorId}
                  onChange={e => setAplicadorId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', backgroundColor: '#fff', fontFamily: 'inherit' }}
                >
                  <option value="">-- Seleccionar Aplicador --</option>
                  {aplicadores.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre} {a.nif ? `(${a.nif})` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Maquinaria */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  <Tractor size={16} color="#4e9a5f" />
                  Maquinaria
                </label>
                <select
                  value={equipamientoId}
                  onChange={e => setEquipamientoId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', backgroundColor: '#fff', fontFamily: 'inherit' }}
                >
                  <option value="">-- Seleccionar Maquinaria --</option>
                  {equipamientos.map(e => (
                    <option key={e.id} value={e.id}>{e.alias} - {e.marcaModelo}</option>
                  ))}
                </select>
              </div>

              <div style={{ height: 1, background: '#f3f4f6', margin: '4px 0' }} />

              {/* Observaciones */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  <AlertTriangle size={16} color="#8a6010" />
                  Observaciones Internas
                </label>
                <textarea
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Notas adicionales sobre el tratamiento o la validación..."
                  rows={3}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  onClick={() => navigate('/tratamientos')}
                  style={{ flex: 1, padding: '12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 10, color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleValidar}
                  disabled={saving}
                  style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(46,92,56,0.25)' }}
                >
                  <CheckCircle size={18} />
                  {saving ? 'Validando...' : 'Guardar y Validar'}
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
