import React from 'react';

export default function Avatar({ name, size = 32 }) {
  const initials = (name||'??').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
  return (
    <div style={{ width:size,height:size,borderRadius:'50%',background:'var(--blue-bg)',color:'var(--blue)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0 }}>
      {initials}
    </div>
  );
}
