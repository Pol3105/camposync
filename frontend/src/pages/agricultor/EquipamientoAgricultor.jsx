import { useState, useEffect } from 'react'
import { Tractor, Trash2, Pencil } from 'lucide-react'
import ModalNuevoEquipamiento from '../../components/ModalNuevoEquipamiento'
import ConfirmDialog          from '../../components/ConfirmDialog'
import { granjero } from '../../services/api'

const TIPO_LABEL = {
  PULV_TRAC:  'Pulverizador tractor',
  ATOMIZADOR: 'Atomizador',
  MOCHILA:    'Mochila',
  DRONE:      'Drone',
  OTRO:       'Otro',
}

export default function EquipamientoAgricultor() {
  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modal,       setModal]       = useState(false)       // false | null(new) | item(edit)
  const [confirmItem, setConfirmItem] = useState(null)        // item pending delete

  useEffect(() => {
    granjero.getEquipamiento()
      .then(data => setItems((data ?? []).sort((a, b) => a.alias.localeCompare(b.alias))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleCreado(nuevo) {
    setItems(prev => [...prev, nuevo].sort((a, b) => a.alias.localeCompare(b.alias)))
    setModal(false)
  }

  function handleActualizado(updated) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i).sort((a, b) => a.alias.localeCompare(b.alias)))
    setModal(false)
  }

  async function handleEliminarConfirmado() {
    if (!confirmItem) return
    try {
      await granjero.eliminarEquipamiento(confirmItem.id)
      setItems(prev => prev.filter(i => i.id !== confirmItem.id))
    } catch {}
    finally { setConfirmItem(null) }
  }

  return (
    <>
      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(145deg, #1c3829 0%, #2e5c38 100%)', padding: '20px 18px 24px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', marginBottom: 2 }}>
          Maquinaria
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)' }}>
          {loading ? '…' : `${items.length} equipo${items.length !== 1 ? 's' : ''} registrado${items.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* ── List ── */}
      <div style={{ padding: '16px 16px 12px' }}>
        {loading ? (
          <div style={{ background: '#fff', borderRadius: 18, padding: '40px 24px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 14, color: '#9ca3af' }}>Cargando…</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 18, padding: '40px 24px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <Tractor size={40} color="#d1d5db" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>Sin equipamiento registrado</p>
            <p style={{ fontSize: 12.5, color: '#9ca3af' }}>Añade tu maquinaria de tratamiento para tenerla disponible al registrar aplicaciones.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map(item => (
              <div
                key={item.id}
                style={{ background: '#fff', borderRadius: 18, padding: '14px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #bfdbfe' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', lineHeight: 1.3, marginBottom: 4 }}>
                      {item.alias}
                    </div>
                    {item.tipoMaquina && (
                      <span style={{ display: 'inline-block', marginBottom: 4, padding: '3px 8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 11.5, color: '#2563eb', fontWeight: 600 }}>
                        {TIPO_LABEL[item.tipoMaquina] ?? item.tipoMaquina}
                      </span>
                    )}
                    {item.marcaModelo && (
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>
                        <span style={{ fontWeight: 600 }}>Marca/Modelo:</span> {item.marcaModelo}
                      </div>
                    )}
                    {item.numRegistroIteaf && (
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        <span style={{ fontWeight: 600 }}>ITEAF:</span> {item.numRegistroIteaf}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => setModal(item)}
                      style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Pencil size={15} color="#2563eb" />
                    </button>
                    <button
                      onClick={() => setConfirmItem(item)}
                      style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Trash2 size={15} color="#dc2626" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <button
        onClick={() => setModal(null)}
        style={{
          position: 'fixed', bottom: 80,
          right: 'max(24px, calc((100vw - 480px) / 2 + 24px))',
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg,#2e5c38,#4e9a5f)',
          border: 'none', color: '#fff', fontSize: 26, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(46,92,56,0.40)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30,
        }}
      >+</button>

      {/* ── Modal crear/editar ── */}
      {modal !== false && (
        <ModalNuevoEquipamiento
          itemAEditar={modal ?? undefined}
          onClose={() => setModal(false)}
          onCreado={handleCreado}
          onActualizado={handleActualizado}
        />
      )}

      {/* ── Confirm delete ── */}
      {confirmItem && (
        <ConfirmDialog
          title="¿Eliminar equipamiento?"
          message={`Se eliminará "${confirmItem.alias}" de tu maquinaria. Esta acción no se puede deshacer.`}
          onConfirm={handleEliminarConfirmado}
          onCancel={() => setConfirmItem(null)}
        />
      )}
    </>
  )
}
