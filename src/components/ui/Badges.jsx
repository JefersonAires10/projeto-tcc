import React from 'react';

const statusMap = {
  ok:        { bg:'var(--green-bg)', color:'var(--green)'  },
  aberto:    { bg:'var(--blue-bg)',  color:'var(--blue)'   },
  cancelado: { bg:'var(--red-bg)',   color:'var(--red)'    },
  alerta:    { bg:'var(--amber-bg)', color:'var(--amber)'  },
  alto:      { bg:'var(--red-bg)',   color:'var(--red)'    },
};

const vinculoMap = {
  EFETIVO:      { bg:'var(--green-bg)', color:'var(--green)' },
  COMISSIONADO: { bg:'var(--blue-bg)',  color:'var(--blue)'  },
  TEMPORARIO:   { bg:'var(--amber-bg)', color:'var(--amber)' },
};

export function StatusBadge({ variant = 'ok', children }) {
  const s = statusMap[variant] || statusMap.ok;
  return <span style={{ display:'inline-flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:10,background:s.bg,color:s.color }}>{children}</span>;
}

export function VinculoBadge({ vinculo }) {
  const key = (vinculo||'EFETIVO').toUpperCase();
  const s = vinculoMap[key] || vinculoMap.EFETIVO;
  return <span style={{ fontSize:10,fontWeight:600,padding:'2px 6px',borderRadius:4,background:s.bg,color:s.color }}>{key}</span>;
}
