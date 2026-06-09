import React from 'react';

export default function Card({ title, sub, children, style = {} }) {
  return (
    <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,padding:16,...style }}>
      {title && <div style={{ fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:4 }}>{title}</div>}
      {sub && <div style={{ fontSize:11,color:'var(--text3)',marginBottom:14 }}>{sub}</div>}
      {children}
    </div>
  );
}
