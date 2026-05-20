const BASE = '/api/sim';

export const MUNICIPIOS_SERTAO = [
  { codigo: '022', nome: 'BANABUIÚ', geoibge: '2301851' },
  { codigo: '030', nome: 'BOA VIAGEM', geoibge: '2302404' },
  { codigo: '182', nome: 'CHORÓ', geoibge: '2303931' },
  { codigo: '052', nome: 'DEPUTADO IRAPUAN PINHEIRO', geoibge: '2304269' },
  { codigo: '069', nome: 'IBARETAMA', geoibge: '2305266' },
  { codigo: '071', nome: 'IBICUITINGA', geoibge: '2305332' },
  { codigo: '107', nome: 'MILHÃ', geoibge: '2308351' },
  { codigo: '111', nome: 'MOMBAÇA', geoibge: '2308500' },
  { codigo: '132', nome: 'PEDRA BRANCA', geoibge: '2310506' },
  { codigo: '137', nome: 'PIQUET CARNEIRO', geoibge: '2310902' },
  { codigo: '144', nome: 'QUIXADÁ', geoibge: '2311306' },
  { codigo: '146', nome: 'QUIXERAMOBIM', geoibge: '2311405' },
  { codigo: '160', nome: 'SENADOR POMPEU', geoibge: '2312700' },
  { codigo: '163', nome: 'SOLONÓPOLE', geoibge: '2313005' },
];

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

async function get(endpoint, params = {}) {
  try {
    const url = new URL(BASE + endpoint, window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json?.data ?? json;
  } catch (err) {
    console.warn(`[TCE /sim] ${endpoint}:`, err.message);
    return null;
  }
}

export const getMunicipios        = (p) => get('/municipios', p);
export const getEmpresasEstatais  = (p) => get('/empresas_estatais', p);       

export const getDadosOrcamentos   = (p) => get('/dados_orcamentos', p);
export const getOrcamentoDespesa  = (p) => get('/orcamento_despesa', p);
export const getOrcamentoReceita  = (p) => get('/orcamento_receita', p);
export const getProgramasGoverno  = (p) => get('/programas_governo', p);

export const getBalanceteReceita        = (p) => get('/balancetes_receitas_orcamentarias', p);
export const getBalanceteDespesa        = (p) => get('/balancetes_despesas_orcamentarias', p);
export const getBalancetesContabeis     = (p) => get('/balancetes_contabeis', p);             
export const getBalancetesContReceit    = (p) => get('/balancetes_contabeis_receitas', p);    
export const getBalancetesContDesp      = (p) => get('/balancetes_contabeis_despesas', p);    

export const getLicitacoes              = (p) => get('/processos_administrativos_contratacoes', p);
export const getPublicacoesEditais      = (p) => get('/publicacoes_editais_processos_administrativos_parcerias', p);
export const getIdentifResponsaveis     = (p) => get('/identificacao_responsaveis_contratacao', p);  
export const getLicitantes              = (p) => get('/licitantes_fornecedores_bens_servicos', p);
export const getItensLicitacoes         = (p) => get('/itens_compoem_bens_servicos', p);
export const getDotacoesLicitacoes      = (p) => get('/dotacoes_utilizadas_contratacoes', p);
export const getContrato                = (p) => get('/contratos', p);
export const getContratados             = (p) => get('/contratados', p);

export const getParceriasOSC      = (p) => get('/parcerias_osc', p);           
export const getAditivosParcerias = (p) => get('/aditivos_parcerias', p);      
export const getOrganizacoesOSC   = (p) => get('/organizacoes_sociedade_civil_osc', p); 

export const getNotasEmpenhos           = (p) => get('/notas_empenhos', p);
export const getLiquidacoes             = (p) => get('/liquidacoes', p);
export const getNotasFiscais            = (p) => get('/notas_fiscais', p);
export const getItensNotasFiscais       = (p) => get('/itens_notas_fiscais', p);
export const getNotasPagamentos         = (p) => get('/notas_pagamentos', p);
export const getNotasPagamentosFolhas   = (p) => get('/notas_pagamentos_folhas', p);  
export const getAnulacoesEmpenhos       = (p) => get('/notas_anulacoes_empenhos', p);
export const getEstornosPagamentos      = (p) => get('/estornos_pagamentos', p);
export const getDeducoesNotasPag        = (p) => get('/deducoes_notas_pagamentos', p); 

export const getTransferenciasFederais  = (p) => get('/transferencias_federais_estaduais', p); 
export const getDiarias                 = (p) => get('/diarias', p);                           

export const getObrasMunicipais   = (p) => get('/obras_municipais_servicos_engenharia', p);    
export const getMedicoesObras     = (p) => get('/medicoes_obras_municipio', p);                 
export const getStatusObras       = (p) => get('/status_obras_servico_engenharia', p);          

export const getAgentesPublicos       = (p) => get('/agentes_publicos_municipais', p);
export const getDesligamentos         = (p) => get('/desligamentos_agentes_publicos', p);
export const getReingressos           = (p) => get('/reingressos_agentes_publicos', p);         
export const getItensRemuneratorios   = (p) => get('/itens_remuneratorios', p);
export const getFolhasPagamentos      = (p) => get('/folhas_pagamentos', p);                    
export const getAgentesPublicosFolha  = (p) => get('/agentes_publicos_folha', p);               

export const getBensMunicipios    = (p) => get('/bens_incorporados_patrimonio_municipio', p);
export const getReavalBaixasBens  = (p) => get('/ajuste_reavaliacao_patrimonial_desincorporacao_bem_municipio', p);
export const getEmpenhosBens      = (p) => get('/controle_bens_notas_empenhos', p);

export const getVeiculosMunicipais    = (p) => get('/veiculos_municipais', p);               
export const getVeiculosLocados       = (p) => get('/veiculos_locados', p);                  
export const getVeiculosCedidos       = (p) => get('/veiculos_cedidos_terceiros', p);        
export const getDestinacaoVeiculos    = (p) => get('/destinacao_veiculos', p);               
export const getAbastecimentoVeiculos = (p) => get('/controle_abastecimento_veiculos', p);  
export const getManutencaoVeiculos    = (p) => get('/controle_manutencao_veiculos', p);     

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
