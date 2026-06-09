import React from 'react';

export default function ProgressBar({ value, color = 'var(--blue)', height = 6 }) {
  return (
    <div style={{ height,background:'var(--bg4)',borderRadius:height/2,overflow:'hidden',margin:'8px 0' }}>
      <div style={{ height:'100%',width:`${Math.min(100,value)}%`,borderRadius:height/2,background:color,transition:'width .5s' }} />
    </div>
  );
}
