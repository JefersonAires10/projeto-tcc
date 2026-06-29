import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import {
  getBensMunicipios, getReavalBaixasBens,
  getVeiculosMunicipais, getVeiculosLocados, getVeiculosCedidos,
  getAbastecimentoVeiculos, getManutencaoVeiculos, getDestinacaoVeiculos,
  fmt, fmtBRL, fmtN, muniParams,
} from '../../api';
import { CarIcon, BuildingIcon, GearIcon, PackageIcon, SparkleIcon, WarningCircleIcon, LightbulbIcon } from '@phosphor-icons/react';
import Paginacao from '../../components/ui/Paginacao';
import { KpiCard, Card, SectionHeader, StatusBadge, Spinner, BtnOutline, PageSkeleton } from '../../components/ui';

const BENS_MOCK = [
  { id: 'PM-2023-8892', desc: 'Veículo Utilitário L200 Triton', org: 'Sec. Infraestrutura', dt: '15/03/2023', val: 215400, status: 'ATIVO' },
  { id: 'PM-2015-8104', desc: 'Terreno Urbano — Área Institucional', org: 'Centro Admin.', dt: '10/01/2015', val: 1250000, status: 'ATIVO' },
  { id: 'PM-2010-0442', desc: 'Microcomputador Dell Optiplex', org: 'Sec. Finanças', dt: '22/05/2010', val: 0, status: 'BAIXADO' },
  { id: 'PM-2022-1102', desc: 'Escavadeira Hidráulica CAT', org: 'Obras Públicas', dt: '08/11/2022', val: 840000, status: 'ATIVO' },
  { id: 'PM-2018-0223', desc: 'Sistema de Ar Condicionado Central', org: 'Hospital Municipal', dt: '12/02/2018', val: 312000, status: 'ATIVO' },
  { id: 'PM-2021-0567', desc: 'Ambulância UTI Móvel', org: 'Sec. Saúde', dt: '03/07/2021', val: 480000, status: 'ATIVO' },
];

const VEICULOS_MOCK = [
  { placa: 'QXD-1234', descricao: 'Caminhonete S10', tipo: 'Caminhonete', ano: 2022, secretaria: 'Infraestrutura', km: 42000, status: 'ATIVO', combustivel: 'Diesel', manutencao: 'Em dia' },
  { placa: 'QXD-5678', descricao: 'Ambulância Sprinter', tipo: 'Ambulância', ano: 2021, secretaria: 'Saúde', km: 87000, status: 'ATIVO', combustivel: 'Diesel', manutencao: 'Em dia' },
  { placa: 'QXD-9012', descricao: 'Ônibus Escolar', tipo: 'Ônibus', ano: 2019, secretaria: 'Educação', km: 156000, status: 'MANUTENÇÃO', combustivel: 'Diesel', manutencao: 'Revisão geral' },
  { placa: 'QXD-3456', descricao: 'Escavadeira Hidráulica', tipo: 'Maquinário', ano: 2020, secretaria: 'Obras', km: 3200, status: 'ATIVO', combustivel: 'Diesel', manutencao: 'Em dia' },
  { placa: 'QXD-7890', descricao: 'Pickup Hilux', tipo: 'Pickup', ano: 2023, secretaria: 'Gabinete', km: 18000, status: 'ATIVO', combustivel: 'Flex', manutencao: 'Em dia' },
  { placa: 'QXD-2345', descricao: 'Van Escolar', tipo: 'Van', ano: 2018, secretaria: 'Educação', km: 201000, status: 'IRREGULAR', combustivel: 'Flex', manutencao: 'Atrasada' },
];

const LOCADOS_MOCK = [
  { empresa: 'Locaforte LTDA', placa: 'OCE-4521', descricao: 'Caminhão Basculante', valor_mensal: 8500, secretaria: 'Obras', contrato: 'CTR-089/2024' },
  { empresa: 'RentCar Ceará', placa: 'OCE-7734', descricao: 'Micro-ônibus', valor_mensal: 4200, secretaria: 'Saúde', contrato: 'CTR-102/2024' },
  { empresa: 'Locaforte LTDA', placa: 'OCE-8823', descricao: 'Trator Agrícola', valor_mensal: 6800, secretaria: 'Obras', contrato: 'CTR-089/2024' },
];

const ABASTEC_MOCK = [
  { placa: 'QXD-1234', data: '2024-03-10', litros: 120, valor: 684, posto: 'Auto Posto Sertão', motorista: 'J. Silva' },
  { placa: 'QXD-5678', data: '2024-03-09', litros: 95, valor: 541, posto: 'Posto Central', motorista: 'M. Santos' },
  { placa: 'QXD-3456', data: '2024-03-08', litros: 200, valor: 1140, posto: 'Auto Posto Sertão', motorista: 'A. Ferreira' },
  { placa: 'QXD-7890', data: '2024-03-07', litros: 60, valor: 342, posto: 'Posto Central', motorista: 'C. Lima' },
  { placa: 'QXD-2345', data: '2024-03-06', litros: 80, valor: 456, posto: 'Posto Estrela', motorista: 'R. Costa' },
];

function stVariant(s) {
  const st = (s || '').toUpperCase();
  if (st === 'ATIVO' || st.includes('EM DIA')) return 'ok';
  if (st === 'MANUTENÇÃO') return 'alerta';
  if (st === 'IRREGULAR' || st.includes('ATRAS')) return 'cancelado';
  if (st === 'BAIXADO') return 'cancelado';
  return 'alerta';
}

function statusBaixa(s) {
  return s === false || s === 'false' || s === 'ATIVO' ? 'ATIVO' : 'BAIXADO';
}

const CATS = [
  { icon: CarIcon, nome: 'Veículos', pct: 40 },
  { icon: BuildingIcon, nome: 'Imóveis', pct: 30 },
  { icon: GearIcon, nome: 'Equipamentos', pct: 20 },
  { icon: PackageIcon, nome: 'Outros', pct: 10 },
];
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function F4({ municipio, ano }) {
  const [loading, setLoad] = useState(true);
  const [totalVal, setTotalVal] = useState(42800000);
  const [totalQtd, setTotalQtd] = useState(4250);
  const [baixas, setBaixas] = useState(14);
  const [bens, setBens] = useState(BENS_MOCK);
  const [veiculos, setVeiculos] = useState(VEICULOS_MOCK);
  const [locados, setLocados] = useState(LOCADOS_MOCK);
  const [abastec, setAbastec] = useState(ABASTEC_MOCK);
  const [aba, setAba] = useState('patrimonio');
  const [showAnalise, setShowAnalise] = useState(false);
  const [pagina, setPag] = useState(1);
  const porPagina = 10;
  const chartRef = useRef(null);
  const chartInst = useRef(null);

  useEffect(() => {
    async function load() {
      setLoad(true);
      const params = muniParams(municipio);

      const anoAtual = ano || new Date().getFullYear();
      const meses = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

      const bensReq = getBensMunicipios({
        ...params,
        codigo_municipio: municipio,
        data_inicio: `${anoAtual}-01-01`,
        data_fim: `${anoAtual}-12-31`
      });

      const abastPromises = meses.map(mes =>
        getAbastecimentoVeiculos({ ...params, exercicio_orcamento: `${anoAtual}00`, data_referencia_doc: `${anoAtual}${mes}` })
      );

      const [bensResults, baixasData, veicRes, locRes, abastResults] = await Promise.all([
        bensReq,
        getReavalBaixasBens(params),
        getVeiculosMunicipais(params),
        getVeiculosLocados(params),
        Promise.all(abastPromises),
      ]);

      const bensDataRaw = bensResults?.elements || (Array.isArray(bensResults) ? bensResults : []);
      const bensMap = new Map();
      bensDataRaw.forEach(b => {
        const key = b.numero_registro || JSON.stringify(b);
        if (!bensMap.has(key)) bensMap.set(key, b);
      });
      const bensData = Array.from(bensMap.values());

      const veicData = veicRes?.elements || (Array.isArray(veicRes) ? veicRes : []);
      const locData = locRes?.elements || (Array.isArray(locRes) ? locRes : []);
      const abastData = abastResults.flatMap(res => res?.elements || (Array.isArray(res) ? res : []));

      if (bensData?.length) {
        let tv = 0;
        bensData.forEach(b => tv += parseFloat(b.valor_depreciavel || 0));
        setTotalVal(tv || 0); setTotalQtd(bensData.length);
        setBens(bensData);
      }
      const arrBaixas = baixasData?.elements || (Array.isArray(baixasData) ? baixasData : []);
      setBaixas(arrBaixas.length);

      if (veicRes !== null) setVeiculos(veicData);
      if (locRes !== null) setLocados(locData);
      if (abastResults.some(r => r !== null)) setAbastec(abastData);
      setLoad(false);
    }
    load();
  }, [municipio, ano]);

  useEffect(() => {
    if (!chartRef.current || aba !== 'abastecimento') return;
    if (chartInst.current) chartInst.current.destroy();
    const meses = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const abastPorMes = meses.map(m => abastec.filter(a => {
      if (a.data_abastecimento) {
        return String(a.data_abastecimento).substring(5, 7) === m;
      } else if (a.data_referencia_doc) {
        return String(a.data_referencia_doc).slice(-2) === m;
      }
      return false;
    }).length);
    chartInst.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: MESES,
        datasets: [{ data: abastPorMes, backgroundColor: '#58a6ff', borderColor: 'transparent', borderRadius: 4 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(48,54,61,.4)' }, ticks: { color: '#8b949e', font: { size: 11 } } },
          y: { grid: { color: 'rgba(48,54,61,.4)' }, ticks: { color: '#8b949e', font: { size: 10 }, callback: v => fmtN(v) } },
        },
      },
    });
    return () => chartInst.current?.destroy();
  }, [abastec, aba]);

  if (loading) return <PageSkeleton kpis={4} layout="1fr" />;

  const totalPaginasBens = Math.max(1, Math.ceil(bens.length / porPagina));
  const pagAtualBens = pagina > totalPaginasBens ? totalPaginasBens : pagina;
  const exibidosBens = bens.slice((pagAtualBens - 1) * porPagina, pagAtualBens * porPagina);

  const totalPaginasVeiculos = Math.max(1, Math.ceil(veiculos.length / porPagina));
  const pagAtualVeiculos = pagina > totalPaginasVeiculos ? totalPaginasVeiculos : pagina;
  const exibidosVeiculos = veiculos.slice((pagAtualVeiculos - 1) * porPagina, pagAtualVeiculos * porPagina);

  const totalPaginasLocados = Math.max(1, Math.ceil(locados.length / porPagina));
  const pagAtualLocados = pagina > totalPaginasLocados ? totalPaginasLocados : pagina;
  const exibidosLocados = locados.slice((pagAtualLocados - 1) * porPagina, pagAtualLocados * porPagina);

  const totalPaginasAbastec = Math.max(1, Math.ceil(abastec.length / porPagina));
  const pagAtualAbastec = pagina > totalPaginasAbastec ? totalPaginasAbastec : pagina;
  const exibidosAbastec = abastec.slice((pagAtualAbastec - 1) * porPagina, pagAtualAbastec * porPagina);

  const nIrregulares = 0;
  const custoLocados = locados.reduce((a, l) => a + parseFloat(l.valor_mensal || l.vl_mensal || 0), 0);

  const abas = [
    { id: 'patrimonio', label: 'Bens Patrimônio' },
    { id: 'frota', label: 'Frota Própria' },
    { id: 'locados', label: 'Veíc. Locados' },
    { id: 'abastecimento', label: 'Abastecimento' },
  ];

  // Novas Análises e Insights
  const anoAtualParaCalculo = parseInt(ano || new Date().getFullYear(), 10);
  let deprecAcumulada = 0;

  const categoriasCalculadas = {
    veiculos: { val: 0, count: 0 },
    imoveis: { val: 0, count: 0 },
    equipamentos: { val: 0, count: 0 },
    outros: { val: 0, count: 0 },
  };

  bens.forEach(b => {
    const val = parseFloat(b.valor_depreciavel || b.valor_aquisicao || b.valor || 0);
    const desc = (b.descricao_bem || b.desc || '').toLowerCase();
    const classif = (b.tipo_classificacao || b.classificacao || '').toLowerCase();

    // Dicionários super abrangentes
    const kwVeiculos = ['veiculo', 'veículo', 'carro', 'moto', 'caminhão', 'caminhao', 'onibus', 'ônibus', 'ambulância', 'ambulancia', 'frota', 'trator', 'retroescavadeira', 'motoniveladora', 'van', 'fiorino', 'pickup', 'pick-up', 'reboque', 'transporte', 'micro-onibus', 'microonibus', 'pá carregadeira', 'viatura'];
    const kwImoveis = ['terreno', 'predio', 'prédio', 'imovel', 'imóvel', 'casa', 'edifício', 'edificio', 'construção', 'obra', 'galpão', 'escola', 'hospital', 'creche', 'ubs', 'terras', 'gleba', 'loteamento', 'praça', 'quadra', 'estádio', 'cemitério', 'mercado público', 'centro'];
    const kwEquipamentos = ['computador', 'notebook', 'impressora', 'ar condicionado', 'equipamento', 'escavadeira', 'máquina', 'maquina', 'móvel', 'movel', 'mobiliário', 'mobiliario', 'mesa', 'cadeira', 'armário', 'armario', 'estante', 'aparelho', 'refrigerador', 'geladeira', 'freezer', 'tv', 'televisão', 'televisao', 'monitor', 'projetor', 'nobreak', 'servidor', 'processamento', 'utensílio', 'utensilio', 'maca', 'odonto', 'hospitalar', 'clínico', 'clinico', 'carteira', 'lousa', 'ventilador', 'bebedouro', 'roçadeira', 'motor', 'microfone', 'áudio', 'audio', 'vídeo', 'video', 'som', 'câmera', 'camera', 'telefone', 'celular', 'switch', 'roteador', 'hub', 'rack', 'eletrônico', 'eletrodoméstico', 'ferramenta', 'sofá', 'sofa', 'poltrona', 'gaveteiro', 'balança', 'fogão', 'microondas', 'micro-ondas', 'liquidificador', 'batedeira', 'arquivo', 'instrumento', 'acessório'];

    const isMatch = (kws) => kws.some(w => desc.includes(w) || classif.includes(w));

    if (isMatch(kwVeiculos)) {
      categoriasCalculadas.veiculos.val += val;
      categoriasCalculadas.veiculos.count++;
    } else if (isMatch(kwImoveis)) {
      categoriasCalculadas.imoveis.val += val;
      categoriasCalculadas.imoveis.count++;
    } else if (isMatch(kwEquipamentos)) {
      categoriasCalculadas.equipamentos.val += val;
      categoriasCalculadas.equipamentos.count++;
    } else {
      categoriasCalculadas.outros.val += val;
      categoriasCalculadas.outros.count++;
    }

    if (val > 0 && (b.data_aquisicao || b.dt)) {
      const dtString = String(b.data_aquisicao || b.dt);
      let anoAquisicao = 0;
      if (dtString.includes('/')) {
        const parts = dtString.split('/');
        anoAquisicao = parseInt(parts[2], 10);
      } else {
        anoAquisicao = parseInt(dtString.substring(0, 4), 10);
      }

      if (anoAquisicao > 1900 && anoAquisicao <= anoAtualParaCalculo) {
        const anosUso = anoAtualParaCalculo - anoAquisicao;
        const taxaDeprec = Math.min(1, anosUso * 0.10);
        deprecAcumulada += val * taxaDeprec;
      }
    }
  });

  const catData = [
    { icon: CarIcon, nome: 'Veículos', pct: totalVal > 0 ? (categoriasCalculadas.veiculos.val / totalVal) * 100 : (bens.length === BENS_MOCK.length ? 40 : 0), val: categoriasCalculadas.veiculos.val },
    { icon: BuildingIcon, nome: 'Imóveis', pct: totalVal > 0 ? (categoriasCalculadas.imoveis.val / totalVal) * 100 : (bens.length === BENS_MOCK.length ? 30 : 0), val: categoriasCalculadas.imoveis.val },
    { icon: GearIcon, nome: 'Equips. & Móveis', pct: totalVal > 0 ? (categoriasCalculadas.equipamentos.val / totalVal) * 100 : (bens.length === BENS_MOCK.length ? 20 : 0), val: categoriasCalculadas.equipamentos.val },
    { icon: PackageIcon, nome: 'Outros', pct: totalVal > 0 ? (categoriasCalculadas.outros.val / totalVal) * 100 : (bens.length === BENS_MOCK.length ? 10 : 0), val: categoriasCalculadas.outros.val },
  ];

  if (bens.length === BENS_MOCK.length && totalVal > 0 && catData[0].val === 0) {
    catData[0].val = totalVal * 0.40;
    catData[1].val = totalVal * 0.30;
    catData[2].val = totalVal * 0.20;
    catData[3].val = totalVal * 0.10;
  }

  const pctDeprec = totalVal > 0 ? (deprecAcumulada / totalVal) * 100 : 0;
  const totalCombustivel = abastec.reduce((a, b) => a + parseFloat(b.valor_total_abastecimento || b.valor_abastecimento || b.valor_total || b.valor || 0), 0);
  const custoLocacaoAnual = custoLocados * 12;
  const alertaLocacao = custoLocacaoAnual > (catData[0].val * 0.3) && custoLocacaoAnual > 0;
  const alertaDeprec = pctDeprec > 60;

  return (
    <div>
      <SectionHeader
        title="Controle Patrimonial e Frotas"
        sub={<>API: /sim/bens_incorporados_patrimonio_municipio · <SparkleIcon size={16} /> Módulo VCL: /veiculos_municipais · /controle_abastecimento_veiculos</>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Valor Total Patrimônio" badge={ano} badgeClass="anual" value={fmt(totalVal)} delta="patrimônio consolidado" />
        <KpiCard label="Total de Bens" badge="Incorporados" badgeClass="efetuado" value={fmtN(totalQtd)} delta="+38 no mês" deltaClass="pos" />
        <KpiCard label="Veículos Irregulares"  badgeClass="alerta" value={fmtN(nIrregulares)} delta="frota própria" deltaClass={nIrregulares > 0 ? 'neg' : 'pos'} />
        <KpiCard label="Custo Locação/Mês" badgeClass="reservado" value={fmt(custoLocados)} delta="veículos terceirizados" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
        {catData.map(c => (
          <div key={c.nome} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{(() => { const Icon = c.icon; return <Icon size={24} weight="fill" />; })()}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>{c.nome}</div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text)' }}>{fmt(c.val)}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{c.pct.toFixed(1)}%</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Análise de Ativos e Frotas</h4>
        <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
          Diagnóstico baseado na idade dos bens, volume de locação e histórico de abastecimentos do município em <strong style={{ color: 'var(--text)' }}>{ano}</strong>.
          Patrimônio total avaliado em {fmtBRL(totalVal)}.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <BtnOutline onClick={() => setShowAnalise(!showAnalise)}>
            {showAnalise ? 'Ocultar diagnóstico ✕' : 'Diagnóstico completo ↗'}
          </BtnOutline>
          {!showAnalise && window.sendPrompt && (
            <BtnOutline onClick={() => window.sendPrompt(`Como a prefeitura pode reduzir o custo de ${fmtBRL(custoLocados)} mensais em locação de veículos através do uso inteligente da frota própria?`)}>
              <LightbulbIcon size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
              Explicar com IA
            </BtnOutline>
          )}
        </div>

        {showAnalise && (
          <div style={{ marginTop: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, animation: 'slideIn .2s ease' }}>
            <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}`}</style>
            <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Relatório Analítico de Patrimônio</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div style={{ borderLeft: alertaDeprec ? '3px solid var(--amber)' : '3px solid var(--green)', paddingLeft: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Depreciação Acumulada</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                  <strong style={{ color: alertaDeprec ? 'var(--amber)' : 'var(--text)' }}>{pctDeprec.toFixed(1)}%</strong> do patrimônio estimado já foi depreciado ({fmtBRL(deprecAcumulada)}). {alertaDeprec ? 'Alta obsolescência da frota/equipamentos pode gerar custos excessivos de manutenção.' : 'Nível de depreciação dentro do esperado.'}
                </div>
              </div>
              <div style={{ borderLeft: alertaLocacao ? '3px solid var(--amber)' : '3px solid var(--green)', paddingLeft: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Dependência de Locação</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                  Custo anual projetado com locações: <strong style={{ color: alertaLocacao ? 'var(--amber)' : 'var(--text)' }}>{fmtBRL(custoLocacaoAnual)}</strong>. {alertaLocacao ? 'Valor elevado frente ao tamanho da frota própria, sugerindo ineficiência ou necessidade de renovação da frota.' : 'Gastos com locação estão controlados.'}
                </div>
              </div>
              <div style={{ borderLeft: totalCombustivel > 0 ? '3px solid var(--blue)' : '3px solid var(--text3)', paddingLeft: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Gasto com Combustível</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                  Total gasto no período: <strong style={{ color: 'var(--text)' }}>{fmtBRL(totalCombustivel)}</strong> em {abastec.length} abastecimentos registrados. {totalCombustivel === 0 && 'Nenhum registro de abastecimento encontrado na base.'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
          {abas.map(a => (
            <button key={a.id} onClick={() => { setAba(a.id); setPag(1); }} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, fontFamily: 'var(--font)', fontWeight: 500,
              color: aba === a.id ? 'var(--blue)' : 'var(--text2)',
              borderBottom: `2px solid ${aba === a.id ? 'var(--blue)' : 'transparent'}`,
              marginBottom: -1, transition: 'color .15s',
            }}>
              {a.label}
              {a.badge && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'var(--green-bg)', color: 'var(--green)', textTransform: 'uppercase' }}>
                  {a.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: 16 }}>

          {aba === 'patrimonio' && (
            <>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>
                Endpoint: <code style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 10 }}>/sim/bens_incorporados_patrimonio_municipio</code>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['ID Patrimônio', 'Descrição', 'Incorporação', 'Valor Atual', 'Status'].map((h, i) => (
                        <th key={h} style={{ color: 'var(--text3)', fontWeight: 600, textAlign: i === 3 ? 'right' : 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exibidosBens.map((b, i) => {
                      const val = parseFloat(b.valor_depreciavel || 0);
                      const st = statusBaixa(b.status_baixa);
                      return (
                        <tr key={i} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>{b.numero_registro || '–'}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 500, color: 'var(--text)' }}>{b.descricao_bem || '–'}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Classif: {b.tipo_classificacao || '–'}</div>
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)' }}>{b.data_aquisicao ? b.data_aquisicao.substring(0, 10) : '–'}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--text)' }}>{val > 0 ? fmtBRL(val) : 'R$ 0,00'}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}><StatusBadge variant={stVariant(st)}>{st}</StatusBadge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Paginacao pagina={pagAtualBens} totalPag={totalPaginasBens} onChange={p => setPag(p)} />
            </>
          )}

          {aba === 'frota' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: 'var(--green-bg)', color: 'var(--green)' }}>NOVO MÓDULO VCL</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                  <code style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 10 }}>/sim/veiculos_municipais</code>
                </span>
              </div>
              {nIrregulares > 0 && (
                <div style={{ marginBottom: 12, padding: 10, background: 'var(--red-bg)', border: '1px solid rgba(248,81,73,.3)', borderRadius: 6, fontSize: 11, color: 'var(--text2)' }}>
                  <WarningCircleIcon size={14} /> <strong style={{ color: 'var(--red)' }}>{nIrregulares} veículo(s) com situação irregular</strong> — documentação ou manutenção em atraso.
                </div>
              )}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['Placa', 'Renavam', 'Chassi', 'Proprietário'].map((h, i) => (
                        <th key={h} style={{ color: 'var(--text3)', fontWeight: 600, textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exibidosVeiculos.map((v, i) => (
                      <tr key={i} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--blue)', fontSize: 11 }}>{v.codigo_placa || '–'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>{v.codigo_renavam || '–'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>{v.numero_chassi || '–'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>{v.dados_documento_proprietario || '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Paginacao pagina={pagAtualVeiculos} totalPag={totalPaginasVeiculos} onChange={p => setPag(p)} />
            </>
          )}

          {aba === 'locados' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: 'var(--green-bg)', color: 'var(--green)' }}>NOVO MÓDULO VCL</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                  <code style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 10 }}>/sim/veiculos_locados</code>
                </span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--amber)', fontSize: 13 }}>
                  Total mensal: {fmtBRL(custoLocados)}
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['Locador (CNPJ)', 'Contrato', 'Data', 'Gestor'].map((h, i) => (
                        <th key={h} style={{ color: 'var(--text3)', fontWeight: 600, textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exibidosLocados.map((l, i) => (
                      <tr key={i} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)' }}>{l.dados_documento_locador || '–'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 11 }}>{l.numero_contrato || '–'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)' }}>{l.data_contrato ? l.data_contrato.substring(0, 10) : '–'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text2)', fontSize: 11 }}>{l.cpf_gestor_responsavel || '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Paginacao pagina={pagAtualLocados} totalPag={totalPaginasLocados} onChange={p => setPag(p)} />
            </>
          )}

          {aba === 'abastecimento' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: 'var(--green-bg)', color: 'var(--green)' }}>NOVO MÓDULO VCL</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                  <code style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 10 }}>/sim/controle_abastecimento_veiculos</code>
                </span>
              </div>
              <div style={{ marginBottom: 14, position: 'relative', height: 160 }}>
                <canvas ref={chartRef} role="img" aria-label="Abastecimentos por mês" />
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['Renavam / Fornecedor', 'Data', 'Odômetro', 'Responsável', 'Valor / Qtd'].map((h, i) => (
                        <th key={h} style={{ color: 'var(--text3)', fontWeight: 600, textAlign: i === 4 ? 'right' : 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exibidosAbastec.map((a, i) => {
                      const val = parseFloat(a.valor_total_abastecimento || a.valor_abastecimento || a.valor_total || a.valor || 0);
                      const qtd = parseFloat(a.quantidade_combustivel || a.litros || 0);
                      return (
                        <tr key={i} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 11, fontWeight: 700 }}>{a.codigo_renavam || '–'}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{a.nome_fornecedor || a.posto || '–'}</div>
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>{a.data_abastecimento ? String(a.data_abastecimento).substring(0, 10) : a.data || '–'}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', color: 'var(--text)' }}>{a.numero_odometro ? fmtN(a.numero_odometro) : '–'} km</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ color: 'var(--text2)', fontSize: 11 }}>{a.nome_servidor_responsavel || a.motorista || '–'}</div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>Órgão {a.codigo_orgao || '–'}</div>
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--text)' }}>{val > 0 ? fmtBRL(val) : '–'}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{qtd > 0 ? fmtN(qtd) + 'L' : '–'}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Paginacao pagina={pagAtualAbastec} totalPag={totalPaginasAbastec} onChange={p => setPag(p)} />
            </>
          )}

        </div>
      </div>
    </div>
  );
}
