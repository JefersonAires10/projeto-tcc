import React from 'react';
import { ChartBarIcon, ClipboardIcon, UsersIcon, BuildingIcon, MapPinIcon, WarningIcon } from '@phosphor-icons/react';
import { MUNICIPIOS_SERTAO } from '../../api';

const NAV_ITEMS = [
  { id: 'f1', icon: <ChartBarIcon size={20} />, label: 'Painel Orçamentário' },
  { id: 'f2', icon: <ClipboardIcon size={20} />, label: 'Monitor de Licitações' },
  { id: 'f3', icon: <UsersIcon size={20} />, label: 'Radar de Pessoal' },
  { id: 'f4', icon: <BuildingIcon size={20} />, label: 'Controle Patrimonial' },
  { id: 'f5', icon: <MapPinIcon size={20} />, label: 'Comparativo Regional' },
  { id: 'f6', icon: <WarningIcon size={20} />, label: 'Alertas e Compliance' },
];

export default function Sidebar({ active, alertCount, onNavigate }) {
  return (
    <aside style={{ width: 220, minWidth: 220, background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, color: 'var(--text3)', textTransform: 'uppercase' }}>Portal da Transparência</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>Sertão Transparente</div>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>Sertão Central — Ceará</div>
        <div style={{ marginTop: 8, fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--blue)', background: 'var(--blue-bg)', padding: '2px 6px', borderRadius: 3, display: 'inline-block' }}>
          API /sim/ v3
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const badge = item.id === 'f6' && alertCount > 0 ? alertCount : null;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
              color: active === item.id ? 'var(--blue)' : 'var(--text2)',
              background: active === item.id ? 'var(--blue-bg)' : 'none',
              border: 'none', width: '100%', textAlign: 'left',
              fontSize: 13, fontWeight: 500, marginBottom: 2,
            }}>
              <span style={{ width: 18, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
              {badge && (
                <span style={{
                  marginLeft: 'auto',
                  background: 'var(--red)',
                  color: '#fff',
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                }}>{badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s ease-in-out infinite' }} />
          <span>API TCE-CE /sim/</span>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9 }}>api-dados-abertos.tce.ce.gov.br</div>
        <div style={{ marginTop: 6, fontSize: 9, color: 'var(--text3)' }}>{MUNICIPIOS_SERTAO.length} municípios monitorados</div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </aside>
  );
}
