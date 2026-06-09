export function fmt(v) {
  if (v === null || v === undefined || isNaN(v)) return '–';
  const n = parseFloat(v);
  if (n >= 1e9) return 'R$ ' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return 'R$ ' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return 'R$ ' + (n / 1e3).toFixed(0) + 'K';
  return 'R$ ' + n.toFixed(0);
}

export function fmtN(v) {
  if (v === null || v === undefined) return '–';
  return Number(v).toLocaleString('pt-BR');
}

export function fmtBRL(v) {
  if (!v && v !== 0) return '–';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
