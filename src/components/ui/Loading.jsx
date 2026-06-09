import React from 'react';

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
