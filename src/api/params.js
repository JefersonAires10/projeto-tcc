export function fmtAno(ano, data_referencia_doc = null) {
  const y = parseInt(ano);
  if (y >= 2007) return `${y}00`;
  if (y >= 2003) return `${y}${data_referencia_doc ? String(data_referencia_doc).padStart(2,'0') : '12'}`;
  return String(y);
}

export function fmtAnoIntervalo(ano) {
  return `${ano}-01-01_${ano}-12-31`;
}

export function orcParams(codigoMunicipio, ano) {
  const p = { exercicio_orcamento: fmtAno(ano) };
  if (codigoMunicipio) p.codigo_municipio = codigoMunicipio;
  return p;
}

export function licParams(codigoMunicipio, ano) {
  const p = {
    data_inicio: `${ano}-01-01`,
    data_fim: `${ano}-12-31`
  };
  if (codigoMunicipio) p.codigo_municipio = codigoMunicipio;
  return p;
}

export function muniParams(codigoMunicipio) {
  return codigoMunicipio ? { codigo_municipio: codigoMunicipio } : {};
}
