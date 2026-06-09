import { get } from './client';

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
