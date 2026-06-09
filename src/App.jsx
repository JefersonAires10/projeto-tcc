import React, { useState } from 'react';
import { Sidebar, Header } from './components/layout';
import F1Orcamento from './panels/orcamento';
import F2Licitacoes from './panels/licitacoes';
import F3Pessoal from './panels/pessoal';
import F4Patrimonio from './panels/patrimonio';
import F5Comparativo from './panels/comparativo';
import F6Alertas from './panels/alertas';

const PANELS = {
  f1: F1Orcamento, f2: F2Licitacoes, f3: F3Pessoal,
  f4: F4Patrimonio, f5: F5Comparativo, f6: F6Alertas,
};

const PANEL_LABELS = {
  f1: 'Painel Orçamentário', f2: 'Monitor de Licitações', f3: 'Radar de Pessoal',
  f4: 'Controle Patrimonial', f5: 'Comparativo Regional', f6: 'Alertas e Compliance',
};

export default function App() {
  const [active, setActive] = useState('f1');
  const [municipio, setMuni] = useState('144');
  const [ano, setAno] = useState('2026');
  const [refresh, setRefresh] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

  const ActivePanel = PANELS[active] || F1Orcamento;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        active={active}
        alertCount={alertCount}
        onNavigate={setActive}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header
          activeLabel={PANEL_LABELS[active] || ''}
          municipio={municipio}
          ano={ano}
          onMuniChange={setMuni}
          onAnoChange={setAno}
          onRefresh={() => setRefresh(r => r + 1)}
        />

        <main style={{ flex: 1, overflowY: 'auto', padding: 20, background: 'var(--bg)' }}>
          <ActivePanel
            key={`${active}-${municipio}-${ano}-${refresh}`}
            municipio={municipio}
            ano={ano}
            onAlertCountChange={setAlertCount}
          />
        </main>
      </div>
    </div>
  );
}
