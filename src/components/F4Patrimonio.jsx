import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import {
  getBensMunicipios, getReavalBaixasBens,
  getVeiculosMunicipais, getVeiculosLocados, getVeiculosCedidos,
  getAbastecimentoVeiculos, getManutencaoVeiculos, getDestinacaoVeiculos,
  fmt, fmtBRL, fmtN, muniParams,
} from '../api';
import { CarIcon, BuildingIcon, GearIcon, PackageIcon, SparkleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { KpiCard, Card, SectionHeader, StatusBadge, Spinner, BtnOutline, PageSkeleton } from './UI';

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

function Paginacao({ pagina, totalPag, onChange }) {
  if (totalPag <= 1) return null;
  const nums = [];
  const maxVis = 5;
  let ini = Math.max(1, pagina - Math.floor(maxVis / 2));
  let fim = Math.min(totalPag, ini + maxVis - 1);
  if (fim - ini + 1 < maxVis) ini = Math.max(1, fim - maxVis + 1);
  for (let i = ini; i <= fim; i++) nums.push(i);

  const btnBase = { background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '5px 11px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--mono)', transition: 'all .1s' };
  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center', marginTop: 14 }}>
      <button disabled={pagina <= 1} onClick={() => onChange(1)} style={{ ...btnBase, opacity: pagina <= 1 ? .4 : 1 }}>⇤</button>
      <button disabled={pagina <= 1} onClick={() => onChange(pagina - 1)} style={{ ...btnBase, opacity: pagina <= 1 ? .4 : 1 }}>←</button>
      {ini > 1 && <span style={{ color: 'var(--text3)', fontSize: 12 }}>...</span>}
      {nums.map(n => (
        <button key={n} onClick={() => onChange(n)}
          style={{ ...btnBase, background: n === pagina ? 'var(--blue-bg)' : 'var(--bg3)', borderColor: n === pagina ? 'var(--blue)' : 'var(--border)', color: n === pagina ? 'var(--blue)' : 'var(--text2)', fontWeight: n === pagina ? 700 : 400 }}>
          {n}
        </button>
      ))}
      {fim < totalPag && <span style={{ color: 'var(--text3)', fontSize: 12 }}>...</span>}
      <button disabled={pagina >= totalPag} onClick={() => onChange(pagina + 1)} style={{ ...btnBase, opacity: pagina >= totalPag ? .4 : 1 }}>→</button>
      <button disabled={pagina >= totalPag} onClick={() => onChange(totalPag)} style={{ ...btnBase, opacity: pagina >= totalPag ? .4 : 1 }}>⇥</button>
    </div>
  );
}

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

  return (
    <div>
      <SectionHeader
        title="Controle Patrimonial e Frotas"
        sub={<>API: /sim/bens_incorporados_patrimonio_municipio · <SparkleIcon size={16} /> Módulo VCL: /veiculos_municipais · /controle_abastecimento_veiculos</>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Valor Total Patrimônio" badge={ano} badgeClass="anual" value={fmt(totalVal)} delta="patrimônio consolidado" />
        <KpiCard label="Total de Bens" badge="Incorporados" badgeClass="efetuado" value={fmtN(totalQtd)} delta="+38 no mês" deltaClass="pos" />
        <KpiCard label="Veículos Irregulares" badge="Alerta" badgeClass="alerta" value={fmtN(nIrregulares)} delta="frota própria" deltaClass={nIrregulares > 0 ? 'neg' : 'pos'} />
        <KpiCard label="Custo Locação/Mês" badge="Novo" badgeClass="reservado" value={fmt(custoLocados)} delta="veículos terceirizados" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
        {CATS.map(c => (
          <div key={c.nome} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{(() => { const Icon = c.icon; return <Icon size={24} weight="fill" />; })()}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>{c.nome}</div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text)' }}>{fmt(totalVal * c.pct / 100)}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{c.pct}%</div>
          </div>
        ))}
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
                      {['Renavam', 'Data', 'Odômetro', 'Resp. CPF', 'Orgão'].map((h, i) => (
                        <th key={h} style={{ color: 'var(--text3)', fontWeight: 600, textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exibidosAbastec.map((a, i) => {
                      return (
                        <tr key={i} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', color: 'var(--text3)', fontSize: 11 }}>{a.codigo_renavam || '–'}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>{a.data_abastecimento ? a.data_abastecimento.substring(0, 10) : '–'}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', color: 'var(--text)' }}>{a.numero_odometro ? fmtN(a.numero_odometro) : '–'} km</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)' }}>{a.cpf_responsavel || '–'}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>Órgão {a.codigo_orgao || '–'}</td>
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
