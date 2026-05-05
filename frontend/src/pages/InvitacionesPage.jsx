import { useState, useEffect, useCallback } from 'react'
import { Mail, CheckCircle2, X } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import InvitacionModal from '../components/InvitacionModal'
import { invitaciones as invAPI } from '../services/api'

/* ── design tokens ── */
const TABLE_BORDER  = '#eceef5'
const TABLE_HEADER  = '#f7f8fc'
const TABLE_ROW_ALT = '#fafbfe'

const CHIPS = {
  PENDIENTE: { bg: '#fff3e6', color: '#c25c10', border: '#fdd8b4', label: 'Pendiente' },
  ACEPTADA:  { bg: '#edf7e8', color: '#267a40', border: '#c0e8b0', label: 'Aceptada'  },
  EXPIRADA:  { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb', label: 'Expirada'  },
  CANCELADA: { bg: '#fff4f4', color: '#c03030', border: '#f8c8c8', label: 'Cancelada' },
}

/* ── Toast component ── */
function Toast({ onClose, titulo, subtitulo }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className="fixed flex items-center gap-3"
      style={{
        bottom: 32, right: 32, zIndex: 200,
        padding: '14px 20px',
        background: '#1c3829',
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        border: '1px solid rgba(124,201,74,0.3)',
        minWidth: 320,
        fontFamily: "'Inter',system-ui,sans-serif",
        animation: 'slideUp 0.25s ease',
      }}
    >
      <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 34, height: 34, background: 'rgba(124,201,74,0.18)' }}>
        <CheckCircle2 size={16} color="#7cc94a" />
      </div>
      <div className="flex-1">
        <p className="font-bold" style={{ fontSize: 13.5, color: '#d4f1b0', letterSpacing: '-0.1px' }}>{titulo}</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{subtitulo}</p>
      </div>
      <button
        onClick={onClose}
        className="flex items-center justify-center flex-shrink-0 transition hover:opacity-80"
        style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}
      >
        <X size={13} color="rgba(255,255,255,0.45)" />
      </button>
    </div>
  )
}

/* ── helpers ── */
function formatFecha(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── Main page ── */
export default function InvitacionesPage() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [sending,    setSending]    = useState(false)
  const [showToast,       setShowToast]       = useState(false)
  const [showReenviarToast, setShowReenviarToast] = useState(false)
  const [actioningToken, setActioningToken] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await invAPI.listar()
      setRows(data ?? [])
    } catch { /* errors handled globally */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleCancelar(token) {
    setActioningToken(token)
    try {
      const updated = await invAPI.cancelar(token)
      setRows(prev => prev.map(r => r.token === token ? updated : r))
    } catch { /* noop */ }
    finally { setActioningToken(null) }
  }

  async function handleReenviar(token) {
    setActioningToken(token)
    try {
      const updated = await invAPI.reenviar(token)
      setRows(prev => prev.map(r => r.token === token ? updated : r))
      setShowReenviarToast(true)
    } catch { /* noop */ }
    finally { setActioningToken(null) }
  }

  async function handleEnviar(emailInvitado) {
    setSending(true)
    try {
      const nueva = await invAPI.crear(emailInvitado)
      setRows(prev => [nueva, ...prev])   // optimistic prepend
      setShowModal(false)
      setShowToast(true)
    } catch (err) {
      // bubble up: modal shows its own error if needed; here we just close gracefully
    } finally {
      setSending(false)
    }
  }

  /* derived stats */
  const total     = rows.length
  const pendientes = rows.filter(r => r.estado === 'PENDIENTE').length
  const aceptadas  = rows.filter(r => r.estado === 'ACEPTADA').length

  const kpis = [
    { label: 'Total enviadas', value: total,      icon: '📨', color: '#4e9a5f', bg: '#edf7e8', border: '#c0e8b0' },
    { label: 'Pendientes',     value: pendientes,  icon: '⏳', color: '#c07010', bg: '#fff8ed', border: '#fdd8a0' },
    { label: 'Aceptadas',      value: aceptadas,   icon: '✅', color: '#2e6ea6', bg: '#edf4ff', border: '#b8d4f8' },
  ]

  const cardBase = { background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid transparent', overflow: 'hidden' }

  return (
    <>
      <AppLayout
        title="Invitaciones"
        searchPlaceholder="Buscar por email…"
        notificationDot={pendientes > 0}
      >
        <div className="flex flex-col gap-5 h-full">

          {/* page header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-bold" style={{ fontSize: 22, color: '#111827', letterSpacing: '-0.4px' }}>Gestión de Invitaciones</h1>
              <p style={{ fontSize: 13.5, color: '#9ca3af', marginTop: 3 }}>Invita a tus granjeros para que activen su cuenta en Camposync</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 font-semibold text-white transition active:scale-[0.98]"
              style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)', border: 'none', borderRadius: 12, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(46,92,56,0.32)', letterSpacing: '-0.1px', whiteSpace: 'nowrap' }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, marginTop: -1 }}>+</span>
              Enviar nueva invitación
            </button>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-4">
            {kpis.map(({ label, value, icon, color, bg, border }) => (
              <div key={label} className="flex items-center gap-4" style={{ ...cardBase, padding: '20px 24px' }}>
                <div className="flex items-center justify-center flex-shrink-0" style={{ width: 52, height: 52, borderRadius: 14, background: bg, border: `1px solid ${border}`, fontSize: 22 }}>
                  {icon}
                </div>
                <div>
                  <p className="uppercase" style={{ fontSize: 11.5, fontWeight: 500, color: '#9ca3af', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</p>
                  <p className="font-extrabold" style={{ fontSize: 34, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {loading ? '—' : value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* table card */}
          <div style={{ ...cardBase, flex: 1, minHeight: 0 }}>
            <div className="flex justify-between items-center" style={{ padding: '16px 22px', borderBottom: `1px solid ${TABLE_BORDER}` }}>
              <div className="flex items-baseline gap-2.5">
                <span className="font-bold" style={{ fontSize: 15, color: '#111827' }}>Historial de Invitaciones</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>{total} enviadas en total</span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center" style={{ height: 200, color: '#9ca3af', fontSize: 14 }}>Cargando invitaciones…</div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2" style={{ height: 200, color: '#9ca3af' }}>
                <Mail size={32} color="#d1d5db" />
                <p style={{ fontSize: 14 }}>Aún no has enviado ninguna invitación</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: TABLE_HEADER }}>
                      {['Email del Invitado', 'Fecha de Envío', 'Caduca', 'Estado', 'Acciones'].map(h => (
                        <th key={h} className="text-left uppercase whitespace-nowrap" style={{ padding: '10px 18px', borderBottom: `1px solid ${TABLE_BORDER}`, fontSize: 11.5, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const chip   = CHIPS[row.estado] ?? CHIPS.EXPIRADA
                      const isPend = row.estado === 'PENDIENTE'
                      return (
                        <tr key={row.token} style={{ background: i % 2 === 1 ? TABLE_ROW_ALT : 'transparent' }}>

                          {/* email */}
                          <td style={{ padding: '11px 18px', borderBottom: `1px solid ${TABLE_BORDER}` }}>
                            <div className="flex items-center gap-2.5">
                              <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 32, height: 32, background: '#f0f2f7', border: '1px solid #e5e7eb' }}>
                                <Mail size={14} color="#9ca3af" />
                              </div>
                              <span className="font-medium" style={{ fontSize: 13.5, color: '#111827' }}>{row.emailInvitado}</span>
                            </div>
                          </td>

                          {/* fecha envío */}
                          <td style={{ padding: '11px 18px', borderBottom: `1px solid ${TABLE_BORDER}` }}>
                            <span style={{ fontSize: 13, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>{formatFecha(row.createdAt)}</span>
                          </td>

                          {/* fecha caducidad */}
                          <td style={{ padding: '11px 18px', borderBottom: `1px solid ${TABLE_BORDER}` }}>
                            <span style={{ fontSize: 13, color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>{formatFecha(row.expiraEn)}</span>
                          </td>

                          {/* estado chip */}
                          <td style={{ padding: '11px 18px', borderBottom: `1px solid ${TABLE_BORDER}` }}>
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap" style={{ padding: '3px 10px', borderRadius: 20, background: chip.bg, color: chip.color, border: `1px solid ${chip.border}`, fontSize: 12, fontWeight: 600 }}>
                              {!isPend && <CheckCircle2 size={11} />}
                              {chip.label}
                            </span>
                          </td>

                          {/* acciones */}
                          <td style={{ padding: '11px 18px', borderBottom: `1px solid ${TABLE_BORDER}` }}>
                            {isPend ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleReenviar(row.token)}
                                  disabled={actioningToken === row.token}
                                  className="font-semibold transition hover:opacity-80"
                                  style={{ padding: '5px 12px', background: '#f0f8ff', border: '1px solid #b8d4f8', borderRadius: 8, color: '#2e6ea6', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', opacity: actioningToken === row.token ? 0.6 : 1 }}
                                >
                                  Reenviar
                                </button>
                                <button
                                  onClick={() => handleCancelar(row.token)}
                                  disabled={actioningToken === row.token}
                                  className="font-semibold transition hover:opacity-80"
                                  style={{ padding: '5px 12px', background: '#fff4f4', border: '1px solid #f8c8c8', borderRadius: 8, color: '#c03030', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', opacity: actioningToken === row.token ? 0.6 : 1 }}
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: 13, color: '#c8ccd8' }}>—</span>
                            )}
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

      {/* Modal */}
      {showModal && (
        <InvitacionModal
          onClose={() => setShowModal(false)}
          onEnviar={handleEnviar}
          sending={sending}
        />
      )}

      {/* Toasts */}
      {showToast && (
        <Toast
          onClose={() => setShowToast(false)}
          titulo="¡Invitación enviada con éxito!"
          subtitulo="El agricultor recibirá el enlace en su correo"
        />
      )}
      {showReenviarToast && (
        <Toast
          onClose={() => setShowReenviarToast(false)}
          titulo="¡Invitación reenviada con éxito!"
          subtitulo="Se ha generado un nuevo enlace para el agricultor"
        />
      )}
    </>
  )
}
