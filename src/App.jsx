import React, { useState } from 'react';
import { ChartBarIcon, ClipboardIcon, UsersIcon, BuildingIcon, MapPinIcon, WarningIcon, BankIcon, ArrowsClockwiseIcon } from '@phosphor-icons/react';
import { MUNICIPIOS_SERTAO } from './api';
import F1Orcamento from './components/F1Orcamento';
import F2Licitacoes from './components/F2Licitacoes';
import F3Pessoal from './components/F3Pessoal';
import F4Patrimonio from './components/F4Patrimonio';
import F5Comparativo from './components/F5Comparativo';
import F6Alertas from './components/F6Alertas';
import F7Obras from './components/F7Obras';

const PANELS = {
  f1: F1Orcamento, f2: F2Licitacoes, f3: F3Pessoal,
  f4: F4Patrimonio, f5: F5Comparativo, f6: F6Alertas, f7: F7Obras,
};

const ANOS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010', '2009'];

export default function App() {
  const [active, setActive] = useState('f1');
  const [municipio, setMuni] = useState('144');
  const [ano, setAno] = useState('2024');
  const [refresh, setRefresh] = useState(0);
  const [alertCount, setAlertCount] = useState({ f6: 0, f7: 0 });

  const handleAlertCountChange = (panel, count) => {
    setAlertCount(prev => ({ ...prev, [panel]: count }));
  };

  const NAV = [
    { id: 'f1', icon: <ChartBarIcon size={20} />, label: 'Painel Orçamentário' },
    { id: 'f2', icon: <ClipboardIcon size={20} />, label: 'Monitor de Licitações' },
    { id: 'f3', icon: <UsersIcon size={20} />, label: 'Radar de Pessoal' },
    { id: 'f4', icon: <BuildingIcon size={20} />, label: 'Controle Patrimonial' },
    { id: 'f5', icon: <MapPinIcon size={20} />, label: 'Comparativo Regional' },
    { id: 'f6', icon: <WarningIcon size={20} />, label: 'Alertas e Compliance', badge: alertCount.f6 > 0 ? alertCount.f6 : null },
    { id: 'f7', icon: <BankIcon size={20} />, label: 'Monitor de Obras', badge: alertCount.f7 > 0 ? alertCount.f7 : null },
  ];

  const ActivePanel = PANELS[active] || F1Orcamento;
  const activeLabel = NAV.find(n => n.id === active)?.label || '';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
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
          {NAV.map(item => (
            <button key={item.id} onClick={() => setActive(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
              color: active === item.id ? 'var(--blue)' : 'var(--text2)',
              background: active === item.id ? 'var(--blue-bg)' : 'none',
              border: 'none', width: '100%', textAlign: 'left',
              fontSize: 13, fontWeight: 500, marginBottom: 2,
            }}>
              <span style={{ width: 18, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
              {item.badge && (
                <span style={{
                  marginLeft: 'auto',
                  background: item.badgeColor === 'green' ? 'var(--green-bg)' : 'var(--red)',
                  color: item.badgeColor === 'green' ? 'var(--green)' : '#fff',
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                }}>{item.badge}</span>
              )}
            </button>
          ))}
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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>{activeLabel}</div>
          <div style={{ flex: 1 }} />

          <select value={municipio} onChange={e => setMuni(e.target.value)}
            style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font)', cursor: 'pointer', maxWidth: 220 }}>
            {MUNICIPIOS_SERTAO.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
          </select>

          <select value={ano} onChange={e => setAno(e.target.value)}
            style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font)', cursor: 'pointer' }}>
            {ANOS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <button onClick={() => setRefresh(r => r + 1)}
            style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
            <><ArrowsClockwiseIcon size={16} /> Atualizar</>
          </button>
        </div>

        <main style={{ flex: 1, overflowY: 'auto', padding: 20, background: 'var(--bg)' }}>
          <ActivePanel
            key={`${active}-${municipio}-${ano}-${refresh}`}
            municipio={municipio}
            ano={ano}
            onAlertCountChange={(count) => handleAlertCountChange(active, count)}
          />
        </main>
      </div>
    </div>
  );
}
