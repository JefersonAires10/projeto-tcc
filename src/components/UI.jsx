import React from 'react';

export function KpiCard({ label, badge, badgeClass = 'anual', value, delta, deltaClass = 'neu', sub }) {
  const badgeStyles = {
    anual:     { background: 'var(--bg4)',       color: 'var(--text2)'  },
    reservado: { background: 'var(--amber-bg)',  color: 'var(--amber)'  },
    efetuado:  { background: 'var(--green-bg)',  color: 'var(--green)'  },
    alerta:    { background: 'var(--red-bg)',    color: 'var(--red)'    },
  };
  const deltaColors = { pos: 'var(--green)', neg: 'var(--red)', neu: 'var(--text2)' };
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

export function Card({ title, sub, children, style = {} }) {
  return (
    <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,padding:16,...style }}>
      {title && <div style={{ fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:4 }}>{title}</div>}
      {sub && <div style={{ fontSize:11,color:'var(--text3)',marginBottom:14 }}>{sub}</div>}
      {children}
    </div>
  );
}

const statusMap = {
  ok:        { bg:'var(--green-bg)', color:'var(--green)'  },
  aberto:    { bg:'var(--blue-bg)',  color:'var(--blue)'   },
  cancelado: { bg:'var(--red-bg)',   color:'var(--red)'    },
  alerta:    { bg:'var(--amber-bg)', color:'var(--amber)'  },
  alto:      { bg:'var(--red-bg)',   color:'var(--red)'    },
};

export function StatusBadge({ variant = 'ok', children }) {
  const s = statusMap[variant] || statusMap.ok;
  return <span style={{ display:'inline-flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:10,background:s.bg,color:s.color }}>{children}</span>;
}

const vinculoMap = {
  EFETIVO:      { bg:'var(--green-bg)', color:'var(--green)' },
  COMISSIONADO: { bg:'var(--blue-bg)',  color:'var(--blue)'  },
  TEMPORARIO:   { bg:'var(--amber-bg)', color:'var(--amber)' },
};

export function VinculoBadge({ vinculo }) {
  const key = (vinculo||'EFETIVO').toUpperCase();
  const s = vinculoMap[key] || vinculoMap.EFETIVO;
  return <span style={{ fontSize:10,fontWeight:600,padding:'2px 6px',borderRadius:4,background:s.bg,color:s.color }}>{key}</span>;
}

export function Avatar({ name, size = 32 }) {
  const initials = (name||'??').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
  return (
    <div style={{ width:size,height:size,borderRadius:'50%',background:'var(--blue-bg)',color:'var(--blue)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0 }}>
      {initials}
    </div>
  );
}

export function ProgressBar({ value, color = 'var(--blue)', height = 6 }) {
  return (
    <div style={{ height,background:'var(--bg4)',borderRadius:height/2,overflow:'hidden',margin:'8px 0' }}>
      <div style={{ height:'100%',width:`${Math.min(100,value)}%`,borderRadius:height/2,background:color,transition:'width .5s' }} />
    </div>
  );
}

export function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:22,fontWeight:700,color:'var(--text)' }}>{title}</div>
      {sub && <div style={{ fontSize:12,color:'var(--text3)',marginTop:4,fontFamily:'var(--mono)' }}>{sub}</div>}
    </div>
  );
}

export function BtnOutline({ children, onClick, fullWidth, style = {} }) {
  return (
    <button onClick={onClick} style={{ background:'none',border:'1px solid var(--border2)',color:'var(--text2)',padding:'6px 14px',borderRadius:6,fontSize:12,cursor:'pointer',width:fullWidth?'100%':'auto',fontFamily:'var(--font)',...style }}
      onMouseEnter={e=>{e.target.style.borderColor='var(--blue)';e.target.style.color='var(--blue)';}}
      onMouseLeave={e=>{e.target.style.borderColor='var(--border2)';e.target.style.color='var(--text2)';}}>
      {children}
    </button>
  );
}

export function Spinner({ message = 'Carregando...' }) {
  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:200,gap:12 }}>
      <div style={{ width:32,height:32,border:'2px solid var(--border)',borderTopColor:'var(--blue)',borderRadius:'50%',animation:'spin .8s linear infinite' }} />
      <div style={{ fontSize:13,color:'var(--text2)' }}>{message}</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
  
export function Skeleton({ width = '100%', height = 20, borderRadius = 6, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius, background: 'var(--bg3)',
      animation: 'skeleton-pulse 1.5s ease-in-out infinite', ...style
    }}>
      <style>{`@keyframes skeleton-pulse { 0% { opacity: 0.6; } 50% { opacity: 0.2; } 100% { opacity: 0.6; } }`}</style>
    </div>
  );
}

export function PageSkeleton({ kpis = 4, layout = '2fr-1fr' }) {
  return (
    <div style={{ padding: 0 }}>
      <div style={{ marginBottom: 20 }}>
        <Skeleton width={250} height={28} style={{ marginBottom: 8 }} />
        <Skeleton width={450} height={14} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kpis},1fr)`, gap: 12, marginBottom: 20 }}>
        {Array.from({length: kpis}).map((_, i) => (
          <div key={i} style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,padding:16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <Skeleton width="40%" height={12} />
              <Skeleton width={40} height={14} borderRadius={10} />
            </div>
            <Skeleton width="60%" height={28} style={{ marginBottom: 12 }} />
            <Skeleton width="80%" height={12} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: layout === '2fr-1fr' ? '2fr 1fr' : layout === '1fr-1fr' ? '1fr 1fr' : '1fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:16 }}>
            <Skeleton width={150} height={16} style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height={40} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={60} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={60} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={60} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={60} />
          </div>
        </div>
        {(layout === '2fr-1fr' || layout === '1fr-1fr') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:16 }}>
               <Skeleton width={120} height={16} style={{ marginBottom: 16 }} />
               <Skeleton width="100%" height={180} style={{ marginBottom: 12 }} />
               <Skeleton width="80%" height={14} style={{ marginBottom: 8 }} />
               <Skeleton width="60%" height={14} />
            </div>
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:16 }}>
               <Skeleton width={140} height={16} style={{ marginBottom: 16 }} />
               <Skeleton width="100%" height={60} style={{ marginBottom: 8 }} />
               <Skeleton width="100%" height={60} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
