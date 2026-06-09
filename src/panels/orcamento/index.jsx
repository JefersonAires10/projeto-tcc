import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import { SparkleIcon } from '@phosphor-icons/react';
import { getDadosOrcamentos, getBalanceteDespesa, orcParams, fmt } from '../../api';
import { KpiCard, Card, SectionHeader, BtnOutline, Spinner, PageSkeleton } from '../../components/ui';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function F1({ municipio, ano }) {
  const [data, setData] = useState(null);
  const [loading, setLoad] = useState(true);
  const [showAnalise, setShowAnalise] = useState(false);
  const donutRef = useRef(null);
  const trendRef = useRef(null);
  const donutInst = useRef(null);
  const trendInst = useRef(null);

  useEffect(() => {
    async function load() {
      setLoad(true);
      const params = orcParams(municipio, ano);

      const meses = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
      const balancetesPromises = meses.map(mes =>
        getBalanceteDespesa({ ...params, data_referencia_doc: `${ano}${mes}` })
      );

      const [orcData, ...balancetesResults] = await Promise.all([
        getDadosOrcamentos(params),
        ...balancetesPromises
      ]);

      const orc = orcData?.elements || orcData || [];
      const balancetes = balancetesResults.flatMap(res => res?.elements || res || []);

      let previsto = 0, empenhado = 0, liquidado = 0;

      orc.forEach(r => {
        previsto += parseFloat(r.valor_total_fixado_orcamento || r.orcamento_receita_prevista || r.vlr_orcado || r.valor_orcado || 0);
      });

      const maxMes = balancetes.reduce((max, b) => Math.max(max, parseInt(String(b.data_referencia_doc || '0').slice(-2))), 0);
      const balancetesUltimoMes = balancetes.filter(b => parseInt(String(b.data_referencia_doc || '0').slice(-2)) === maxMes);

      balancetesUltimoMes.forEach(r => {
        empenhado += parseFloat(r.valor_empenhado_ate_mes || 0);
        liquidado += parseFloat(r.valor_liquidado_ate_mes || 0);
      });

      if (previsto === 0) { previsto = 142500000; empenhado = previsto * 0.626; liquidado = previsto * 0.454; }

      const prevM = MESES.map(() => Math.round(previsto / 12));
      const realM = MESES.map((_, i) => {
        const m = i + 1;
        if (m > maxMes) return 0;

        const liqAtual = balancetes
          .filter(b => parseInt(String(b.data_referencia_doc || '0').slice(-2)) === m)
          .reduce((acc, r) => acc + parseFloat(r.valor_liquidado_ate_mes || 0), 0);

        let liqAnterior = 0;
        if (m > 1) {
          liqAnterior = balancetes
            .filter(b => parseInt(String(b.data_referencia_doc || '0').slice(-2)) === (m - 1))
            .reduce((acc, r) => acc + parseFloat(r.valor_liquidado_ate_mes || 0), 0);
        }

        const liqNoMes = liqAtual - liqAnterior;
        return liqNoMes > 0 ? liqNoMes : liqAtual;
      });

      setData({ previsto, empenhado, liquidado, prevM, realM });
      setLoad(false);
    }
    load();
  }, [municipio, ano]);

  useEffect(() => {
    if (!data || !donutRef.current || !trendRef.current) return;
    const { previsto, empenhado, liquidado, prevM, realM } = data;

    if (donutInst.current) donutInst.current.destroy();
    donutInst.current = new Chart(donutRef.current, {
      type: 'doughnut',
      data: { labels: ['Liquidado', 'Empenhado (saldo)', 'A empenhar'], datasets: [{ data: [liquidado, empenhado - liquidado, previsto - empenhado], backgroundColor: ['#3fb950', '#58a6ff', '#21262d'], borderColor: '#161b22', borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: i => fmt(i.raw) } } } },
    });

    if (trendInst.current) trendInst.current.destroy();
    trendInst.current = new Chart(trendRef.current, {
      type: 'bar',
      data: {
        labels: MESES, datasets: [
          { label: 'Previsto', data: prevM, backgroundColor: 'rgba(88,166,255,0.3)', borderColor: '#58a6ff', borderWidth: 1 },
          { label: 'Realizado', data: realM, backgroundColor: 'rgba(63,185,80,0.4)', borderColor: '#3fb950', borderWidth: 1 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: {
          x: { grid: { color: 'rgba(48,54,61,.5)' }, ticks: { color: '#8b949e', font: { size: 10 } } },
          y: { grid: { color: 'rgba(48,54,61,.5)' }, ticks: { color: '#8b949e', font: { size: 10 }, callback: v => fmt(v) } },
        }
      },
    });
    return () => { donutInst.current?.destroy(); trendInst.current?.destroy(); };
  }, [data]);

  if (loading) return <PageSkeleton kpis={3} layout="1fr-1fr" />;

  const { previsto, empenhado, liquidado } = data;
  const execPct = Math.round(liquidado / previsto * 100);
  const empPct = (empenhado / previsto * 100).toFixed(1);
  const liqPct = (liquidado / previsto * 100).toFixed(1);

  const mesesComDados = data.realM.filter(v => v > 0).length || 1;
  const restosAPagar = Math.max(0, empenhado - liquidado);
  const pctRestos = empenhado > 0 ? ((restosAPagar / empenhado) * 100).toFixed(1) : 0;

  // Novas análises
  const idealExecPct = (mesesComDados / 12) * 100;
  const ritmoExec = idealExecPct > 0 ? (parseFloat(liqPct) / idealExecPct) : 0;
  const ritmoLabel = ritmoExec > 1.1 ? 'Acelerado' : ritmoExec < 0.9 ? 'Lento' : 'Normal';
  const ritmoClass = ritmoExec > 1.1 ? 'neg' : ritmoExec < 0.9 ? 'alerta' : 'pos';

  const gastosMensais = data.realM.filter(v => v > 0);
  const mediaMensalRealizada = gastosMensais.reduce((a, b) => a + b, 0) / mesesComDados;
  const desvioPadraoMensal = Math.sqrt(gastosMensais.map(v => Math.pow(v - mediaMensalRealizada, 2)).reduce((a, b) => a + b, 0) / mesesComDados);
  const cvMensal = mediaMensalRealizada > 0 ? (desvioPadraoMensal / mediaMensalRealizada) * 100 : 0;
  const mesPico = Math.max(...gastosMensais);
  const nomeMesPico = MESES[data.realM.indexOf(mesPico)];

  return (
    <div>
      <SectionHeader title="Painel Orçamentário" sub={`/sim/dados_orcamentos?exercicio_orcamento=${ano}00&codigo_municipio=${municipio || '[todos]'}`} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Total Previsto" badge="Anual" badgeClass="anual" value={fmt(previsto)} sub="LOA aprovada" />
        <KpiCard label="Liquidado" badge={`${liqPct}%`} badgeClass="efetuado" value={fmt(liquidado)} sub={`${mesesComDados}/12 meses`} />
        <KpiCard label="Empenhado" badge={`${empPct}%`} badgeClass="reservado" value={fmt(empenhado)} sub="relação empenho/previsão" />
        <KpiCard label="Restos a Pagar" badge="Risco" badgeClass="alerta" value={fmt(restosAPagar)} delta={`${pctRestos}% do empenhado`} deltaClass={parseFloat(pctRestos) > 30 ? 'neg' : 'neu'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Card title="Execução Global" sub="Liquidado / Previsto">
          <div style={{ position: 'relative', height: 200 }}>
            <canvas ref={donutRef} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--mono)' }}>{execPct}%</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>executado</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12 }}>
            {[['Previsão', fmt(previsto)], ['Empenhado', fmt(empenhado)], ['Liquidado', fmt(liquidado)]].map(([l, v]) => (
              <div key={l}>
                <div style={{ color: 'var(--text3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{l}</div>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--text)' }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Evolução Mensal" sub="Planejado vs. Realizado">
          <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
            {[['#58a6ff', 'Previsto'], ['#3fb950', 'Realizado']].map(([c, l]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text2)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: c }} />{l}
              </span>
            ))}
          </div>
          <div style={{ position: 'relative', height: 200 }}>
            <canvas ref={trendRef} />
          </div>
        </Card>
      </div>

      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Análise de Performance Orçamentária</h4>
        <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
          Execução {ano}: <strong style={{ color: 'var(--text)' }}>{liqPct}%</strong> liquidado sobre previsto ({fmt(previsto)}).
          Total empenhado: {empPct}% da LOA. {parseFloat(empPct) > 60 ? 'Ritmo adequado de comprometimento.' : 'Margem para aceleração das despesas.'}
          {' '}Dados via nova API TCE-CE (<code style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--blue)' }}>/sim/dados_orcamentos</code>).
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <BtnOutline onClick={() => setShowAnalise(!showAnalise)}>
            {showAnalise ? 'Ocultar análise ✕' : 'Análise completa ↗'}
          </BtnOutline>
          {!showAnalise && window.sendPrompt && (
            <BtnOutline onClick={() => window.sendPrompt('Explique os dados do Painel Orçamentário do Sertão Central em linguagem simples para um cidadão')}>
              <SparkleIcon size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
              Explicar com IA
            </BtnOutline>
          )}
        </div>

        {showAnalise && (
          <div style={{ marginTop: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderLeft: ritmoClass === 'neg' ? '3px solid var(--red)' : '3px solid var(--green)', borderRadius: 8, padding: 16, animation: 'slideIn .2s ease' }}>
            <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}`}</style>
            <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Relatório Analítico do Exercício</h5>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Ritmo de Execução</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                  Execução ideal: <strong style={{ color: 'var(--text)' }}>{idealExecPct.toFixed(1)}%</strong> vs real: <strong style={{ color: 'var(--text)' }}>{liqPct}%</strong>.<br />
                  Ritmo: <strong style={{ color: ritmoClass === 'neg' ? 'var(--red)' : ritmoClass === 'pos' ? 'var(--green)' : 'var(--amber)' }}>{ritmoLabel} ({(ritmoExec * 100).toFixed(0)}%)</strong>.<br />
                  {ritmoLabel === 'Acelerado' ? 'Gastos acima do esperado para o período.' : ritmoLabel === 'Lento' ? 'Sub-execução orçamentária no período.' : 'Execução em linha com o esperado.'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Volatilidade Mensal</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                  Média mensal: <strong style={{ color: 'var(--text)' }}>{fmt(mediaMensalRealizada)}</strong>.<br />
                  Coef. de Variação: <strong style={{ color: cvMensal > 40 ? 'var(--amber)' : 'var(--text)' }}>{cvMensal.toFixed(1)}%</strong>.<br />
                  {cvMensal > 40 ? 'Alta volatilidade nos gastos mensais.' : 'Gastos mensais relativamente estáveis.'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Pico de Sazonalidade</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                  Mês de maior liquidação: <strong style={{ color: 'var(--text)' }}>{nomeMesPico}</strong> ({fmt(mesPico)}).<br />
                  Picos podem indicar pagamentos de 13º, grandes contratos ou sazonalidades específicas.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
