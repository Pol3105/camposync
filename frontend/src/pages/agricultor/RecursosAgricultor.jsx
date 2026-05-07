import { useState } from 'react'
import AgricultorLayout from './AgricultorLayout'
import InventarioAgricultor  from './InventarioAgricultor'
import EquipamientoAgricultor from './EquipamientoAgricultor'
import AplicadoresAgricultor  from './AplicadoresAgricultor'

const TABS = [
  { key: 'inventario',  label: 'Inventario' },
  { key: 'maquinaria',  label: 'Maquinaria' },
  { key: 'personal',    label: 'Personal'   },
]

export default function RecursosAgricultor() {
  const [tab, setTab] = useState('inventario')

  return (
    <AgricultorLayout>
      {/* ── Tab pill selector ── */}
      <div style={{ padding: '14px 16px 0', background: '#f0f2f7', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 5, display: 'flex', gap: 4, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '7px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, transition: 'all 0.15s',
                background: tab === t.key ? '#4e9a5f' : 'transparent',
                color:      tab === t.key ? '#fff'    : '#9ca3af',
                boxShadow:  tab === t.key ? '0 2px 8px rgba(78,154,95,0.30)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      {tab === 'inventario' && <InventarioAgricultor />}
      {tab === 'maquinaria' && <EquipamientoAgricultor />}
      {tab === 'personal'   && <AplicadoresAgricultor />}
    </AgricultorLayout>
  )
}
