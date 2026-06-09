import React from 'react';

export default function Paginacao({ pagina, totalPag, onChange }) {
  if (totalPag <= 1) return null;
  const nums = [];
  const maxVis = 5;
  let ini = Math.max(1, pagina - Math.floor(maxVis / 2));
  let fim = Math.min(totalPag, ini + maxVis - 1);
  if (fim - ini + 1 < maxVis) ini = Math.max(1, fim - maxVis + 1);
  for (let i = ini; i <= fim; i++) nums.push(i);

  const btnBase = { background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '5px 11px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--mono)', transition: 'all .1s' };
  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center', marginTop: 14 }}>
      <button disabled={pagina <= 1} onClick={() => onChange(1)} style={{ ...btnBase, opacity: pagina <= 1 ? .4 : 1 }}>⇤</button>
      <button disabled={pagina <= 1} onClick={() => onChange(pagina - 1)} style={{ ...btnBase, opacity: pagina <= 1 ? .4 : 1 }}>←</button>
      {ini > 1 && <span style={{ color: 'var(--text3)', fontSize: 12 }}>...</span>}
      {nums.map(n => (
        <button key={n} onClick={() => onChange(n)}
          style={{ ...btnBase, background: n === pagina ? 'var(--blue-bg)' : 'var(--bg3)', borderColor: n === pagina ? 'var(--blue)' : 'var(--border)', color: n === pagina ? 'var(--blue)' : 'var(--text2)', fontWeight: n === pagina ? 700 : 400 }}>
          {n}
        </button>
      ))}
      {fim < totalPag && <span style={{ color: 'var(--text3)', fontSize: 12 }}>...</span>}
      <button disabled={pagina >= totalPag} onClick={() => onChange(pagina + 1)} style={{ ...btnBase, opacity: pagina >= totalPag ? .4 : 1 }}>→</button>
      <button disabled={pagina >= totalPag} onClick={() => onChange(totalPag)} style={{ ...btnBase, opacity: pagina >= totalPag ? .4 : 1 }}>⇥</button>
    </div>
  );
}
