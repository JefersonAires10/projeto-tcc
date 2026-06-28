import { describe, it, expect, vi } from 'vitest';

const mockGet = vi.fn(() => Promise.resolve({ elements: [] }));
vi.mock('../client', () => ({ get: mockGet }));

const endpoints = await import('../endpoints');

const ENDPOINT_LIST = [
  ['getMunicipios', '/municipios'],
  ['getEmpresasEstatais', '/empresas_estatais'],
  ['getDadosOrcamentos', '/dados_orcamentos'],
  ['getOrcamentoDespesa', '/orcamento_despesa'],
  ['getOrcamentoReceita', '/orcamento_receita'],
  ['getProgramasGoverno', '/programas_governo'],
  ['getBalanceteReceita', '/balancetes_receitas_orcamentarias'],
  ['getBalanceteDespesa', '/balancetes_despesas_orcamentarias'],
  ['getBalancetesContabeis', '/balancetes_contabeis'],
  ['getBalancetesContReceit', '/balancetes_contabeis_receitas'],
  ['getBalancetesContDesp', '/balancetes_contabeis_despesas'],
  ['getLicitacoes', '/processos_administrativos_contratacoes'],
  ['getPublicacoesEditais', '/publicacoes_editais_processos_administrativos_parcerias'],
  ['getIdentifResponsaveis', '/identificacao_responsaveis_contratacao'],
  ['getLicitantes', '/licitantes_fornecedores_bens_servicos'],
  ['getItensLicitacoes', '/itens_compoem_bens_servicos'],
  ['getDotacoesLicitacoes', '/dotacoes_utilizadas_contratacoes'],
  ['getContrato', '/contratos'],
  ['getContratados', '/contratados'],
  ['getParceriasOSC', '/parcerias_osc'],
  ['getAditivosParcerias', '/aditivos_parcerias'],
  ['getOrganizacoesOSC', '/organizacoes_sociedade_civil_osc'],
  ['getNotasEmpenhos', '/notas_empenhos'],
  ['getLiquidacoes', '/liquidacoes'],
  ['getNotasFiscais', '/notas_fiscais'],
  ['getItensNotasFiscais', '/itens_notas_fiscais'],
  ['getNotasPagamentos', '/notas_pagamentos'],
  ['getNotasPagamentosFolhas', '/notas_pagamentos_folhas'],
  ['getAnulacoesEmpenhos', '/notas_anulacoes_empenhos'],
  ['getEstornosPagamentos', '/estornos_pagamentos'],
  ['getDeducoesNotasPag', '/deducoes_notas_pagamentos'],
  ['getTransferenciasFederais', '/transferencias_federais_estaduais'],
  ['getDiarias', '/diarias'],
  ['getAgentesPublicos', '/agentes_publicos_municipais'],
  ['getDesligamentos', '/desligamentos_agentes_publicos'],
  ['getReingressos', '/reingressos_agentes_publicos'],
  ['getItensRemuneratorios', '/itens_remuneratorios'],
  ['getFolhasPagamentos', '/folhas_pagamentos'],
  ['getAgentesPublicosFolha', '/agentes_publicos_folha'],
  ['getBensMunicipios', '/bens_incorporados_patrimonio_municipio'],
  ['getReavalBaixasBens', '/ajuste_reavaliacao_patrimonial_desincorporacao_bem_municipio'],
  ['getEmpenhosBens', '/controle_bens_notas_empenhos'],
  ['getVeiculosMunicipais', '/veiculos_municipais'],
  ['getVeiculosLocados', '/veiculos_locados'],
  ['getVeiculosCedidos', '/veiculos_cedidos_terceiros'],
  ['getDestinacaoVeiculos', '/destinacao_veiculos'],
  ['getAbastecimentoVeiculos', '/controle_abastecimento_veiculos'],
  ['getManutencaoVeiculos', '/controle_manutencao_veiculos'],
];

describe('endpoints', () => {
  beforeEach(() => {
    mockGet.mockClear();
  });

  it.each(ENDPOINT_LIST)('%s chama client.get com %s', async (name, expectedEndpoint) => {
    const fn = endpoints[name];
    const params = { codigo_municipio: '144' };
    const result = await fn(params);
    expect(mockGet).toHaveBeenCalledWith(expectedEndpoint, params);
    expect(result).toEqual({ elements: [] });
  });

  it('cada função tem um endpoint único', () => {
    const endpointsList = ENDPOINT_LIST.map(([, ep]) => ep);
    expect(new Set(endpointsList).size).toBe(endpointsList.length);
  });
});
