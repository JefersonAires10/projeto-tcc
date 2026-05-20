import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import { SparkleIcon } from '@phosphor-icons/react';
import {
  getOrcamentoDespesa, getBalanceteDespesa,
  orcParams, fmtN, fmt,
} from '../api';
import { KpiCard, SectionHeader, ProgressBar, BtnOutline, Spinner, PageSkeleton } from './UI';

const MUNICIPIOS = [
  { codigo: '022', nome: 'Banabuiú', pop: 15940 },
  { codigo: '030', nome: 'Boa Viagem', pop: 47455 },
  { codigo: '182', nome: 'Choró', pop: 14982 },
  { codigo: '052', nome: 'Dep. Irapuan Pinheiro', pop: 10588 },
  { codigo: '069', nome: 'Ibaretama', pop: 12702 },
  { codigo: '071', nome: 'Ibicuitinga', pop: 11380 },
  { codigo: '107', nome: 'Milhã', pop: 12985 },
  { codigo: '111', nome: 'Mombaça', pop: 41703 },
  { codigo: '132', nome: 'Pedra Branca', pop: 37438 },
  { codigo: '137', nome: 'Piquet Carneiro', pop: 16095 },
  { codigo: '144', nome: 'Quixadá', pop: 88357 },
  { codigo: '146', nome: 'Quixeramobim', pop: 79048 },
  { codigo: '160', nome: 'Senador Pompeu', pop: 24781 },
  { codigo: '163', nome: 'Solonópole', pop: 16513 },
];

const AREAS = {
  saude: { label: 'Saúde', funcs: ['10'], cor: '#58a6ff' },
  educacao: { label: 'Educação', funcs: ['12'], cor: '#3fb950' },
  infra: { label: 'Infraestrutura', funcs: ['15', '17', '26'], cor: '#d29922' },
};

const PIE_COLORS = ['#3fb950', '#58a6ff', '#d29922', '#6e7681'];
const PIE_LABELS = ['Educação', 'Saúde', 'Infraestrutura', 'Outros'];

function somarPorFuncao(linhas, funcoes) {
  if (!linhas?.length) return 0;
  return linhas
    .filter(l => funcoes.includes(String(l.nr_funcao || l.codigo_funcao || '')))
    .reduce((acc, l) => acc + parseFloat(
      l.vl_liquidado || l.valor_liquidado || l.vl_despesa || l.valor_despesa || l.vl_fixado || l.valor_fixado || 0
    ), 0);
}

function perCapita(valor, pop) {
  return pop > 0 ? Math.round(valor / pop) : 0;
}

function RankRow({ pos, m, isFirst, isLast, maxS, maxE, maxI }) {
  const total = m.saude + m.educacao + m.infra;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 80px 80px 90px', gap: 8, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 15, color: pos === 1 ? 'var(--amber)' : 'var(--text3)' }}>
        {String(pos).padStart(2, '0')}
      </div>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>
          {m.nome}
          {isFirst && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'var(--amber-bg)', color: 'var(--amber)' }}>1º</span>}
          {isLast && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'var(--red-bg)', color: 'var(--red)' }}>↓</span>}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Pop. {fmtN(m.pop)}</div>
      </div>
      {[['saude', '#58a6ff', maxS], ['educacao', '#3fb950', maxE], ['infra', '#d29922', maxI]].map(([k, c, mx]) => (
        <div key={k}>
          <div style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'var(--mono)' }}>
            {m[k] > 0 ? fmt(m[k]) : '–'}
          </div>
          <div style={{ height: 3, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
            <div style={{ height: '100%', width: `${mx > 0 ? Math.min(100, m[k] / mx * 100) : 0}%`, background: c, borderRadius: 2 }} />
          </div>
        </div>
      ))}
      <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13, color: isFirst ? 'var(--green)' : isLast ? 'var(--red)' : 'var(--text)' }}>
        {fmt(total)}
      </div>
    </div>
  );
}

export default function F5Comparativo({ ano }) {
  const [loading, setLoad] = useState(true);
  const [ranking, setRank] = useState([]);
  const [medias, setMed] = useState({ saude: 0, educacao: 0, infra: 0 });
  const [apiOk, setApiOk] = useState(false);
  const [ordenar, setOrdenar] = useState('total');
  const [sim, setSim] = useState(false);
  const [showAnalise, setShowAnalise] = useState(false);
  const chartBarRef = useRef(null); const instBar = useRef(null);
  const chartPieRef = useRef(null); const instPie = useRef(null);

  useEffect(() => {
    async function load() {
      setLoad(true);

      const resultados = await Promise.all(
        MUNICIPIOS.map(async m => {
          const params = orcParams(m.codigo, ano);
          const [orcDesp, balDesp] = await Promise.all([
            getOrcamentoDespesa(params),
            getBalanceteDespesa({ ...params, data_referencia_doc: `${ano}12` }),
          ]);
          const fonte = balDesp?.length ? balDesp : orcDesp;
          const temDados = fonte?.length > 0;
          return {
            ...m,
            saude: perCapita(somarPorFuncao(fonte, AREAS.saude.funcs), m.pop),
            educacao: perCapita(somarPorFuncao(fonte, AREAS.educacao.funcs), m.pop),
            infra: perCapita(somarPorFuncao(fonte, AREAS.infra.funcs), m.pop),
            temDados,
          };
        })
      );

      const comDados = resultados.filter(r => r.temDados);
      const usaSimulacao = comDados.length === 0;
      setApiOk(!usaSimulacao);
      setSim(usaSimulacao);

      const final = resultados.map(r => r.temDados ? r : {
        ...r,
        saude: Math.round(800 + Math.random() * 800),
        educacao: Math.round(1200 + Math.random() * 1600),
        infra: Math.round(200 + Math.random() * 600),
        simulado: true,
      });

      const n = final.length;
      setMed({
        saude: Math.round(final.reduce((a, r) => a + r.saude, 0) / n),
        educacao: Math.round(final.reduce((a, r) => a + r.educacao, 0) / n),
        infra: Math.round(final.reduce((a, r) => a + r.infra, 0) / n),
      });
      setRank(final);
      setLoad(false);
    }
    load();
  }, [ano]);

  useEffect(() => {
    if (loading || !chartBarRef.current || ranking.length === 0) return;
    if (instBar.current) instBar.current.destroy();
    const sorted = [...ranking].sort((a, b) => (b.saude + b.educacao + b.infra) - (a.saude + a.educacao + a.infra)).slice(0, 8);
    instBar.current = new Chart(chartBarRef.current, {
      type: 'bar',
      data: {
        labels: sorted.map(r => r.nome.split(' ')[0]),
        datasets: [
          { label: 'Saúde', data: sorted.map(r => r.saude), backgroundColor: 'rgba(88,166,255,0.7)', borderColor: '#58a6ff', borderWidth: 1, borderRadius: 3 },
          { label: 'Educação', data: sorted.map(r => r.educacao), backgroundColor: 'rgba(63,185,80,0.7)', borderColor: '#3fb950', borderWidth: 1, borderRadius: 3 },
          { label: 'Infraestrutura', data: sorted.map(r => r.infra), backgroundColor: 'rgba(210,153,34,0.7)', borderColor: '#d29922', borderWidth: 1, borderRadius: 3 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#8b949e', font: { size: 11 } } }, tooltip: { callbacks: { label: i => i.dataset.label + ': R$ ' + fmtN(i.raw) + '/hab' } } },
        scales: {
          x: { stacked: false, grid: { color: 'rgba(48,54,61,.4)' }, ticks: { color: '#8b949e', font: { size: 10 } } },
          y: { grid: { color: 'rgba(48,54,61,.4)' }, ticks: { color: '#8b949e', font: { size: 10 }, callback: v => 'R$ ' + fmtN(v) } },
        },
      },
    });
    return () => instBar.current?.destroy();
  }, [loading, ranking]);

  useEffect(() => {
    if (loading || !chartPieRef.current) return;
    if (instPie.current) instPie.current.destroy();
    const outros = Math.max(0, 5000 - medias.saude - medias.educacao - medias.infra);
    instPie.current = new Chart(chartPieRef.current, {
      type: 'doughnut',
      data: {
        labels: PIE_LABELS,
        datasets: [{ data: [medias.educacao, medias.saude, medias.infra, outros], backgroundColor: PIE_COLORS, borderColor: '#161b22', borderWidth: 2 }],
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: i => i.label + ': R$ ' + fmtN(i.raw) + '/hab' } } } },
    });
    return () => instPie.current?.destroy();
  }, [loading, medias]);

  if (loading) return <PageSkeleton kpis={4} layout="2fr-1fr" />;

  const rankOrdenado = [...ranking].sort((a, b) => {
    if (ordenar === 'total') return (b.saude + b.educacao + b.infra) - (a.saude + a.educacao + a.infra);
    return b[ordenar] - a[ordenar];
  });
  const maior = rankOrdenado[0];
  const menor = rankOrdenado[rankOrdenado.length - 1];
  const totalMaior = maior.saude + maior.educacao + maior.infra;
  const totalMenor = menor.saude + menor.educacao + menor.infra;
  const dispPct = totalMaior > 0 ? Math.round((totalMaior - totalMenor) / totalMaior * 100) : 0;
  const maxS = Math.max(...ranking.map(r => r.saude));

  const n = ranking.length;
  const devSaude = Math.sqrt(ranking.map(m => Math.pow(m.saude - medias.saude, 2)).reduce((a, b) => a + b, 0) / n);
  const cvSaude = medias.saude > 0 ? (devSaude / medias.saude * 100).toFixed(0) : 0;
  const devEducacao = Math.sqrt(ranking.map(m => Math.pow(m.educacao - medias.educacao, 2)).reduce((a, b) => a + b, 0) / n);
  const cvEducacao = medias.educacao > 0 ? (devEducacao / medias.educacao * 100).toFixed(0) : 0;
  const devInfra = Math.sqrt(ranking.map(m => Math.pow(m.infra - medias.infra, 2)).reduce((a, b) => a + b, 0) / n);
  const cvInfra = medias.infra > 0 ? (devInfra / medias.infra * 100).toFixed(0) : 0;

  const destaques = {
    saude: {
      maior: [...ranking].sort((a, b) => b.saude - a.saude)[0],
      menor: [...ranking].sort((a, b) => a.saude - b.saude)[0],
    },
    educacao: {
      maior: [...ranking].sort((a, b) => b.educacao - a.educacao)[0],
      menor: [...ranking].sort((a, b) => a.educacao - b.educacao)[0],
    },
    infra: {
      maior: [...ranking].sort((a, b) => b.infra - a.infra)[0],
      menor: [...ranking].sort((a, b) => a.infra - b.infra)[0],
    },
  };

  const maxE = Math.max(...ranking.map(r => r.educacao));
  const maxI = Math.max(...ranking.map(r => r.infra));
  const totalPie = medias.saude + medias.educacao + medias.infra;
  const outros = Math.max(0, 5000 - totalPie);
  const pieVals = [medias.educacao, medias.saude, medias.infra, outros];
  const pieTot = pieVals.reduce((a, b) => a + b, 0);

  return (
    <div>
      <SectionHeader
        title="Desempenho Fiscal Regional"
        sub={`/sim/balancetes_despesas_orcamentarias · data_referencia_doc=${ano}12 · /sim/orcamento_despesa (fallback)`}
      />

      {sim && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--amber-bg)', border: '1px solid rgba(210,153,34,.3)', borderRadius: 8, fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 10 }}>
          <span style={{ color: 'var(--amber)' }}>⚠</span>
          <span>API sem dados para o período — valores <strong style={{ color: 'var(--text)' }}>simulados</strong> para demonstração. Verifique o proxy ou tente outro ano.</span>
        </div>
      )}
      {apiOk && (
        <div style={{ marginBottom: 16, padding: '8px 14px', background: 'var(--green-bg)', border: '1px solid rgba(63,185,80,.3)', borderRadius: 8, fontSize: 12, color: 'var(--green)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>✓</span>
          <span>Dados reais TCE-CE — {ranking.filter(r => r.temDados).length}/{MUNICIPIOS.length} municípios com dados para {ano}.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Média Saúde/hab." badge="Região" badgeClass="anual" value={fmt(medias.saude)} sub="média regional ponderada" />
        <KpiCard label="Média Educação/hab." badge="Região" badgeClass="efetuado" value={fmt(medias.educacao)} sub="inclui repasses FUNDEB" />
        <KpiCard label="Média Infra/hab." badge="Região" badgeClass="reservado" value={fmt(medias.infra)} sub="obras, saneamento, transporte" />
        <KpiCard label="Disparidade" badge="1º vs último" badgeClass="alerta" value={dispPct + '%'} delta={`${maior.nome} × ${menor.nome}`} deltaClass="neg" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Ranking per capita</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Gasto liquidado / hab. (pop. Censo 2022)</div>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {[['total', 'Total'], ['saude', 'Saúde'], ['educacao', 'Educ.'], ['infra', 'Infra']].map(([k, l]) => (
                <button key={k} onClick={() => setOrdenar(k)} style={{
                  padding: '4px 9px', fontSize: 11, borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font)',
                  background: ordenar === k ? 'var(--blue-bg)' : 'var(--bg3)',
                  border: `1px solid ${ordenar === k ? 'var(--blue)' : 'var(--border)'}`,
                  color: ordenar === k ? 'var(--blue)' : 'var(--text2)',
                }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 80px 80px 80px 90px', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            {['', 'Município', 'Saúde', 'Educ.', 'Infra.', 'Total/hab'].map((h, i) => (
              <div key={i} style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</div>
            ))}
          </div>
          {rankOrdenado.map((m, i) => (
            <RankRow key={m.codigo} pos={i + 1} m={m} isFirst={i === 0} isLast={i === rankOrdenado.length - 1} maxS={maxS} maxE={maxE} maxI={maxI} />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Composição regional</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>Média por habitante</div>
            <div style={{ position: 'relative', height: 160 }}>
              <canvas ref={chartPieRef} role="img" aria-label="Composição do gasto regional" />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text)' }}>{fmt(totalPie)}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>total/hab</div>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              {PIE_LABELS.map((l, i) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 9, height: 9, borderRadius: 2, background: PIE_COLORS[i] }} />
                    <span style={{ fontSize: 11, color: 'var(--text2)' }}>{l}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>{pieTot > 0 ? Math.round(pieVals[i] / pieTot * 100) : 0}%</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)' }}>{fmt(pieVals[i])}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Análise de disparidade</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Maior investimento</div>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 12 }}>{maior.nome}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--green)', fontWeight: 700 }}>{fmt(totalMaior)}<span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400 }}>/hab</span></div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Menor investimento</div>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 12 }}>{menor.nome}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--red)', fontWeight: 700 }}>{fmt(totalMenor)}<span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400 }}>/hab</span></div>
            </div>
            <ProgressBar value={dispPct} />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>Variação de <strong style={{ color: 'var(--text)' }}>{dispPct}%</strong> entre extremos.</div>
            <BtnOutline fullWidth onClick={() => setShowAnalise(s => !s)}>
              {showAnalise ? 'Ocultar Análise Detalhada ✕' : 'Análise Detalhada ↗'}
            </BtnOutline>
            {showAnalise && (
              <div style={{ marginTop: 12, background: 'var(--bg2)', borderRadius: 8, padding: '12px 16px', animation: 'slideIn .2s ease' }}>
                <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}`}</style>
                <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Análise Detalhada da Disparidade Regional</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px' }}>
                  {Object.entries(destaques).map(([key, val]) => (
                    <div key={key}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600, borderLeft: `3px solid ${AREAS[key].cor}`, paddingLeft: 8 }}>
                        Destaques em {AREAS[key].label}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                        Maior: <strong style={{ color: 'var(--text)' }}>{val.maior.nome}</strong> ({fmt(val.maior[key])}/hab)<br />
                        Menor: <strong style={{ color: 'var(--text)' }}>{val.menor.nome}</strong> ({fmt(val.menor[key])}/hab)
                      </div>
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>Nível de Disparidade (CV)</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                      Saúde: <strong style={{ color: cvSaude > 30 ? 'var(--amber)' : 'var(--text)' }}>{cvSaude}%</strong><br />
                      Educação: <strong style={{ color: cvEducacao > 30 ? 'var(--amber)' : 'var(--text)' }}>{cvEducacao}%</strong><br />
                      Infra: <strong style={{ color: cvInfra > 30 ? 'var(--amber)' : 'var(--text)' }}>{cvInfra}%</strong>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>CV > 30% indica alta desigualdade no gasto entre municípios.</div>
                  </div>
                </div>
                <BtnOutline style={{ marginTop: 16, width: '100%' }} onClick={() => window.sendPrompt?.(`Analisando os dados de investimento per capita no Sertão Central em ${ano}, o que justifica a disparidade de ${dispPct}% entre os municípios? Quais fatores socioeconômicos podem influenciar essa diferença?`)}><SparkleIcon size={14} /> Explicar com IA</BtnOutline>
              </div>
            )}
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 11, color: 'var(--text3)', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4, fontSize: 12 }}>Metodologia</div>
            Gasto per capita = liquidado / pop. Censo 2022. Funções: Saúde (10), Educação (12), Infra (15+17+26). Fonte primária: <code style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 10 }}>/sim/balancetes_despesas_orcamentarias</code> (dezembro = acumulado anual). Fallback: <code style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 10 }}>/sim/orcamento_despesa</code>.
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Comparativo por área — top 8 municípios</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>Gasto liquidado per capita (R$/hab)</div>
        <div style={{ position: 'relative', height: 220 }}>
          <canvas ref={chartBarRef} role="img" aria-label="Comparativo de gasto per capita por área" />
        </div>
      </div>
    </div>
  );
}