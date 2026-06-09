import React from 'react';

export default function BtnOutline({ children, onClick, fullWidth, style = {} }) {
  return (
    <button onClick={onClick} style={{ background:'none',border:'1px solid var(--border2)',color:'var(--text2)',padding:'6px 14px',borderRadius:6,fontSize:12,cursor:'pointer',width:fullWidth?'100%':'auto',fontFamily:'var(--font)',...style }}
      onMouseEnter={e=>{e.target.style.borderColor='var(--blue)';e.target.style.color='var(--blue)';}}
      onMouseLeave={e=>{e.target.style.borderColor='var(--border2)';e.target.style.color='var(--text2)';}}>
      {children}
    </button>
  );
}
