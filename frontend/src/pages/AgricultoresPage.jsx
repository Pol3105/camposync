import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Folder } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import { asesor } from '../services/api'

const AVATAR_COLORS = [
  { bg: '#2e5c38', text: '#b8e898' },
  { bg: '#3a4f7a', text: '#b8cef0' },
  { bg: '#5a3060', text: '#d8b8e8' },
  { bg: '#7a3a20', text: '#f0c8a8' },
  { bg: '#2a5a5a', text: '#a8dede' },
  { bg: '#4a4a20', text: '#d8d8a0' },
]

function initials(nombre) {
  if (!nombre) return '?'
  const parts = nombre.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0][0].toUpperCase()
}

function EmptyState({ onInvitar }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', gap: 20 }}>
      <div style={{ width: 108, height: 108, borderRadius: 28, background: 'linear-gradient(145deg,#f0f7ec,#e4f3db)', border: '1px solid #d0ebc0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="#7ab85e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="22" cy="20" r="8"/>
          <path d="M6 46c0-8.8 7.2-16 16-16s16 7.2 16 16"/>
          <circle cx="40" cy="18" r="6"/>
          <path d="M46 44c0-6.6-4.5-12-10-13.5"/>
        </svg>
      </div>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#1f2937', marginBottom: 8, letterSpacing: '-0.2px' }}>Aún no tienes agricultores vinculados</div>
        <div style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.65 }}>Envía una invitación para que activen su cuenta y puedas gestionar sus cuadernos de campo.</div>
      </div>
      <button
        onClick={onInvitar}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(46,92,56,0.30)', marginTop: 4 }}
      >
        <span style={{ fontSize: 20, lineHeight: 1, marginTop: -2 }}>+</span>
        Invitar Agricultor
        <ExternalLink size={15} color="rgba(255,255,255,0.8)" />
      </button>
    </div>
  )
}

export default function AgricultoresPage() {
  const navigate = useNavigate()
  const [granjeros, setGranjeros] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchGranjeros = useCallback(async () => {
    setLoading(true)
    try {
      const g = await asesor.granjeros()
      setGranjeros(g ?? [])
    } catch { /* handled globally */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchGranjeros() }, [fetchGranjeros])

  const rp = '11px 20px'

  return (
    <AppLayout title="Mis Agricultores" searchPlaceholder="Buscar agricultor…">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, height: '100%' }}>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.4px' }}>Agricultores Vinculados</div>
            <div style={{ fontSize: 13.5, color: '#9ca3af', marginTop: 3 }}>Consulta los agricultores activos en tu asesoría</div>
          </div>
          <button
            onClick={() => navigate('/invitaciones')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(46,92,56,0.32)', whiteSpace: 'nowrap' }}
          >
            <span style={{ fontSize: 18, lineHeight: 1, marginTop: -1 }}>+</span>
            Invitar Agricultor
            <ExternalLink size={14} color="rgba(255,255,255,0.8)" />
          </button>
        </div>

        {/* Table card */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #eceef5', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Agricultores Activos</span>
            {!loading && granjeros.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>{granjeros.length} agricultores</span>
            )}
          </div>

          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
              Cargando agricultores…
            </div>
          ) : granjeros.length === 0 ? (
            <EmptyState onInvitar={() => navigate('/invitaciones')} />
          ) : (
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f7f8fc' }}>
                    {['Agricultor', 'Explotaciones', 'Alta en sistema', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', borderBottom: '1px solid #eceef5', fontSize: 11.5, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {granjeros.map((g, i) => {
                    const av = AVATAR_COLORS[i % AVATAR_COLORS.length]
                    const numExp = g.numExplotaciones ?? 0
                    return (
                      <tr key={g.id} style={{ background: i % 2 === 1 ? '#fafbfe' : 'transparent' }}>

                        {/* Agricultor */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 38, height: 38, borderRadius: '50%', background: av.bg, border: '2px solid rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: av.text }}>{initials(g.nombre || g.username)}</span>
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: '-0.1px' }}>{g.nombre || '—'}</div>
                              <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 1 }}>{g.username}</div>
                            </div>
                          </div>
                        </td>

                        {/* Explotaciones badge */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: numExp > 0 ? '#edf7e8' : '#f3f4f6', color: numExp > 0 ? '#267a40' : '#9ca3af', border: `1px solid ${numExp > 0 ? '#c0e8b0' : '#e5e7eb'}`, fontSize: 13, fontWeight: 700 }}>
                            {numExp}
                            <span style={{ fontSize: 11.5, fontWeight: 500 }}>{numExp === 1 ? 'explotación' : 'explotaciones'}</span>
                          </span>
                        </td>

                        {/* Alta en sistema */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4e9a5f', flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: '#374151' }}>
                              {g.createdAt
                                ? new Date(g.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '—'}
                            </span>
                          </div>
                        </td>

                        {/* Acciones */}
                        <td style={{ padding: rp, borderBottom: '1px solid #eceef5' }}>
                          <button
                            onClick={() => navigate(`/agricultores/${g.id}/explotaciones`, { state: { nombre: g.nombre || g.username } })}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', background: '#f0f4ff', border: '1px solid #b8c8f0', borderRadius: 10, color: '#2a4a8a', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                          >
                            <Folder size={14} color="#3a5aaa" />
                            Ver Explotaciones
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
