import React from 'react';

export default function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:22,fontWeight:700,color:'var(--text)' }}>{title}</div>
      {sub && <div style={{ fontSize:12,color:'var(--text3)',marginTop:4,fontFamily:'var(--mono)' }}>{sub}</div>}
    </div>
  );
}
