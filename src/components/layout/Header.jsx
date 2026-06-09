import React from 'react';
import { ArrowsClockwiseIcon } from '@phosphor-icons/react';
import { MUNICIPIOS_SERTAO, ANOS } from '../../api';

export default function Header({ activeLabel, municipio, ano, onMuniChange, onAnoChange, onRefresh }) {
  return (
    <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>{activeLabel}</div>
      <div style={{ flex: 1 }} />

      <select value={municipio} onChange={e => onMuniChange(e.target.value)}
        style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font)', cursor: 'pointer', maxWidth: 220 }}>
        {MUNICIPIOS_SERTAO.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
      </select>

      <select value={ano} onChange={e => onAnoChange(e.target.value)}
        style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font)', cursor: 'pointer' }}>
        {ANOS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>

      <button onClick={onRefresh}
        style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
        <ArrowsClockwiseIcon size={16} /> Atualizar
      </button>
    </div>
  );
}
