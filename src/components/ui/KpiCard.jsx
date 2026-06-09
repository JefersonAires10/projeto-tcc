import React from 'react';

const badgeStyles = {
  anual:     { background: 'var(--bg4)',       color: 'var(--text2)'  },
  reservado: { background: 'var(--amber-bg)',  color: 'var(--amber)'  },
  efetuado:  { background: 'var(--green-bg)',  color: 'var(--green)'  },
  alerta:    { background: 'var(--red-bg)',    color: 'var(--red)'    },
};

const deltaColors = { pos: 'var(--green)', neg: 'var(--red)', neu: 'var(--text2)' };

export default function KpiCard({ label, badge, badgeClass = 'anual', value, delta, deltaClass = 'neu', sub }) {
  return (
    <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,padding:16 }}>
      <div style={{ fontSize:11,color:'var(--text3)',textTransform:'uppercase',letterSpacing:1,fontWeight:600,marginBottom:8,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        {label}
        {badge && <span style={{ fontSize:10,padding:'2px 8px',borderRadius:10,fontWeight:600,...(badgeStyles[badgeClass]||badgeStyles.anual) }}>{badge}</span>}
      </div>
      <div style={{ fontSize:24,fontWeight:700,color:'var(--text)',fontFamily:'var(--mono)' }}>{value}</div>
      {delta && <div style={{ fontSize:12,marginTop:6,color:deltaColors[deltaClass]||deltaColors.neu }}>{delta}</div>}
      {sub && <div style={{ fontSize:11,color:'var(--text3)',marginTop:4 }}>{sub}</div>}
    </div>
  );
}
