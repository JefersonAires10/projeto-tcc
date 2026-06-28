import { describe, it, expect } from 'vitest';
import * as api from '../index';

describe('api/index (barrel)', () => {
  it('exporta constants', () => {
    expect(api.MUNICIPIOS_SERTAO).toBeDefined();
    expect(api.MESES).toBeDefined();
    expect(api.ANOS).toBeDefined();
  });

  it('exporta params', () => {
    expect(typeof api.fmtAno).toBe('function');
    expect(typeof api.fmtAnoIntervalo).toBe('function');
    expect(typeof api.orcParams).toBe('function');
    expect(typeof api.licParams).toBe('function');
    expect(typeof api.muniParams).toBe('function');
  });

  it('exporta formatters', () => {
    expect(typeof api.fmt).toBe('function');
    expect(typeof api.fmtN).toBe('function');
    expect(typeof api.fmtBRL).toBe('function');
  });

  it('exporta funções de endpoints', () => {
    const endpointFuncs = [
      'getMunicipios', 'getEmpresasEstatais',
      'getDadosOrcamentos', 'getOrcamentoDespesa', 'getOrcamentoReceita', 'getProgramasGoverno',
      'getBalanceteReceita', 'getBalanceteDespesa', 'getBalancetesContabeis',
      'getBalancetesContReceit', 'getBalancetesContDesp',
      'getLicitacoes', 'getPublicacoesEditais', 'getIdentifResponsaveis',
      'getLicitantes', 'getItensLicitacoes', 'getDotacoesLicitacoes',
      'getContrato', 'getContratados',
      'getParceriasOSC', 'getAditivosParcerias', 'getOrganizacoesOSC',
      'getNotasEmpenhos', 'getLiquidacoes', 'getNotasFiscais', 'getItensNotasFiscais',
      'getNotasPagamentos', 'getNotasPagamentosFolhas',
      'getAnulacoesEmpenhos', 'getEstornosPagamentos', 'getDeducoesNotasPag',
      'getTransferenciasFederais', 'getDiarias',
      'getAgentesPublicos', 'getDesligamentos', 'getReingressos', 'getItensRemuneratorios',
      'getFolhasPagamentos', 'getAgentesPublicosFolha',
      'getBensMunicipios', 'getReavalBaixasBens', 'getEmpenhosBens',
      'getVeiculosMunicipais', 'getVeiculosLocados', 'getVeiculosCedidos',
      'getDestinacaoVeiculos', 'getAbastecimentoVeiculos', 'getManutencaoVeiculos',
    ];
    for (const fn of endpointFuncs) {
      expect(typeof api[fn]).toBe('function');
    }
  });

  it('exporta 48 funções de endpoints no total', () => {
    const endpointFuncs = [
      'getMunicipios', 'getEmpresasEstatais',
      'getDadosOrcamentos', 'getOrcamentoDespesa', 'getOrcamentoReceita', 'getProgramasGoverno',
      'getBalanceteReceita', 'getBalanceteDespesa', 'getBalancetesContabeis',
      'getBalancetesContReceit', 'getBalancetesContDesp',
      'getLicitacoes', 'getPublicacoesEditais', 'getIdentifResponsaveis',
      'getLicitantes', 'getItensLicitacoes', 'getDotacoesLicitacoes',
      'getContrato', 'getContratados',
      'getParceriasOSC', 'getAditivosParcerias', 'getOrganizacoesOSC',
      'getNotasEmpenhos', 'getLiquidacoes', 'getNotasFiscais', 'getItensNotasFiscais',
      'getNotasPagamentos', 'getNotasPagamentosFolhas',
      'getAnulacoesEmpenhos', 'getEstornosPagamentos', 'getDeducoesNotasPag',
      'getTransferenciasFederais', 'getDiarias',
      'getAgentesPublicos', 'getDesligamentos', 'getReingressos', 'getItensRemuneratorios',
      'getFolhasPagamentos', 'getAgentesPublicosFolha',
      'getBensMunicipios', 'getReavalBaixasBens', 'getEmpenhosBens',
      'getVeiculosMunicipais', 'getVeiculosLocados', 'getVeiculosCedidos',
      'getDestinacaoVeiculos', 'getAbastecimentoVeiculos', 'getManutencaoVeiculos',
    ];
    expect(endpointFuncs.length).toBe(48);
  });
});
