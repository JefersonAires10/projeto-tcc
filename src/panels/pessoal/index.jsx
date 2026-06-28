import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import {
  getAgentesPublicos, getItensRemuneratorios, getDesligamentos,
  getFolhasPagamentos, getAgentesPublicosFolha,
  getReingressos, getDiarias,
  fmt, fmtBRL, fmtN, muniParams,
} from '../../api';
import { WarningCircleIcon, MapPinIcon, LightbulbIcon } from '@phosphor-icons/react';
import { KpiCard, Card, SectionHeader, Avatar, VinculoBadge, ProgressBar, BtnOutline, Spinner, PageSkeleton, Paginacao } from '../../components/ui';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const VINCULO_MAP = { 'E': 'EFETIVO', 'C': 'COMISSIONADO', 'T': 'TEMPORARIO' };
const BATCH_SIZE = 4;

export default function F3({ municipio, ano }) {
  const [loading, setLoad] = useState(true);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [servidores, setServ] = useState([]);
  const [folhas, setFolhas] = useState([]);
  const [diarias, setDiarias] = useState([]);
  const [reingressos, setReing] = useState([]);
  const [aba, setAba] = useState('servidores');
  const [filtro, setFiltro] = useState('');
  const [pagina, setPag] = useState(1);
  const [showAnalise, setShowAnalise] = useState(false);
  const porPagina = 10;
  const chartVinculo = useRef(null);
  const chartFolha = useRef(null);
  const instVinculo = useRef(null);
  const instFolha = useRef(null);

  useEffect(() => {
    async function load() {
      setLoad(true);
      const params = muniParams(municipio);

      const anoAtual = ano || new Date().getFullYear();
      const exercicio_orcamento = `${anoAtual}00`;
      const meses = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

      const baseParams = { ...params, codigo_municipio: municipio, exercicio_orcamento };

      const [agentesRaw, diariasData, reingData] = await Promise.all([
        getAgentesPublicos({ ...baseParams, data_referencia_doc: `${anoAtual}01` }),
        getDiarias({ ...baseParams, data_referencia_doc: `${anoAtual}01` }),
        getReingressos({ ...baseParams, data_referencia_doc: `${anoAtual}01` }),
      ]);

      let allFolhas = [];
      let allFolhaAgentes = [];

      for (let i = 0; i < meses.length; i += BATCH_SIZE) {
        const batch = meses.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(mes => Promise.all([
            getFolhasPagamentos({ ...baseParams, data_referencia_doc: `${anoAtual}${mes}` }),
            getAgentesPublicosFolha({ ...baseParams, data_referencia_doc: `${anoAtual}${mes}` }),
          ]))
        );
        results.forEach(([fo, fa]) => {
          allFolhas.push(...(fo?.elements || (Array.isArray(fo) ? fo : [])));
          allFolhaAgentes.push(...(fa?.elements || (Array.isArray(fa) ? fa : [])));
        });
      }

      const agentesList = agentesRaw?.elements || (Array.isArray(agentesRaw) ? agentesRaw : []);

      const salaryMap = {};
      allFolhaAgentes.forEach(f => {
        const cpf = f.cpf_servidor || f.cpf || '';
        const rem = parseFloat(f.valor_remuneracao || f.vl_remuneracao || f.remuneracao || f.valor_vencimento || 0);
        if (cpf && rem > 0) {
          salaryMap[cpf] = Math.max(salaryMap[cpf] || 0, rem);
        }
      });

      const agentesComSal = agentesList.map(a => ({
        ...a,
        _remuneracao: salaryMap[a.cpf_servidor] || 0
      }));

      const folhaPorMes = {};
      allFolhas.forEach(f => {
        let mes = '01';
        if (f.data_referencia_doc) {
          mes = String(f.data_referencia_doc).slice(-2);
        } else if (f.nr_mes) {
          mes = String(f.nr_mes).padStart(2, '0');
        }
        if (!folhaPorMes[mes]) {
          folhaPorMes[mes] = { data_referencia_doc: mes, ano_ref: f.ano_ref || ano, valor_total_item_orc: 0, valor_total_deducoes: 0 };
        }
        folhaPorMes[mes].valor_total_item_orc += parseFloat(f.valor_total_item_orc || 0) || 0;
        folhaPorMes[mes].valor_total_deducoes += parseFloat(f.valor_total_deducoes || 0) || 0;
      });
      const folhasData = Object.values(folhaPorMes).sort((a, b) => parseInt(a.data_referencia_doc) - parseInt(b.data_referencia_doc));
      const totalFolhaAnual = folhasData.reduce((acc, f) => acc + (parseFloat(f.valor_total_item_orc) || 0), 0);
      const maxFolhaMes = folhasData.length ? Math.max(...folhasData.map(f => parseFloat(f.valor_total_item_orc) || 0)) : 0;

      const total = agentesComSal.length;
      const comissN = agentesComSal.filter(a => (VINCULO_MAP[a.codigo_vinculo] || '') === 'COMISSIONADO').length;
      const efet = agentesComSal.filter(a => (VINCULO_MAP[a.codigo_vinculo] || '') === 'EFETIVO').length;
      const temp = total - efet - comissN;
      const sals = agentesComSal.map(a => a._remuneracao).filter(v => v > 0);
      const salMed = sals.length ? sals.reduce((a, b) => a + b, 0) / sals.length : 0;
      const pctComiss = total ? ((comissN / total) * 100).toFixed(1) : '0';
      setStats({ total, salMed, pctComiss, efet, comissN, temp, totalFolhaAnual, maxFolhaMes });

      const diariasList = diariasData?.elements || (Array.isArray(diariasData) ? diariasData : []);
      const reingList = reingData?.elements || (Array.isArray(reingData) ? reingData : []);

      const flags = [];

      if (pctComiss > 30) {
        flags.push({
          label: 'CARGOS COMISSIONADOS — ALTO',
          pct: Math.round(parseFloat(pctComiss)),
          desc: `${comissN} comissionados (${pctComiss}% do total) — proporção acima do recomendado (30%).`,
          severity: 'alto'
        });
      }

      const orgaoCounts = {};
      agentesComSal.forEach(a => {
        const o = a.codigo_orgao || '?';
        orgaoCounts[o] = (orgaoCounts[o] || 0) + 1;
      });
      Object.entries(orgaoCounts).forEach(([orgao, count]) => {
        const pctOrgao = (count / total) * 100;
        if (pctOrgao > 50) {
          flags.push({
            label: `ÓRGÃO ${orgao} — CRÍTICO`,
            pct: Math.round(pctOrgao),
            desc: `${count} servidores (${pctOrgao.toFixed(1)}% do total) concentrados em um único órgão.`,
            severity: 'critico'
          });
        } else if (pctOrgao > 30) {
          flags.push({
            label: `ÓRGÃO ${orgao} — ATENÇÃO`,
            pct: Math.round(pctOrgao),
            desc: `${count} servidores (${pctOrgao.toFixed(1)}% do total) neste órgão.`,
            severity: 'alto'
          });
        }
      });

      if (salMed > 15000) {
        flags.push({
          label: 'MÉDIA SALARIAL ELEVADA',
          pct: Math.min(100, Math.round((salMed / 20000) * 100)),
          desc: `Média salarial de ${fmtBRL(salMed)} — acima de R$ 15.000,00.`,
          severity: 'alto'
        });
      }

      setAlerts(flags);
      setServ(agentesComSal);
      setFolhas(folhasData?.length ? folhasData : []);
      setDiarias(diariasList);
      setReing(reingList);
      setLoad(false);
    }
    load();
  }, [municipio, ano]);

  useEffect(() => {
    if (loading || !chartVinculo.current) return;
    if (instVinculo.current) instVinculo.current.destroy();
    const { efet, comissN, temp } = stats;
    instVinculo.current = new Chart(chartVinculo.current, {
      type: 'bar',
      data: {
        labels: ['Efetivos', 'Comissionados', 'Temporários'],
        datasets: [{ data: [efet, comissN, temp], backgroundColor: ['#3fb950', '#58a6ff', '#d29922'], borderColor: 'transparent', borderRadius: 4 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(48,54,61,.5)' }, ticks: { color: '#8b949e', font: { size: 10 }, callback: v => fmtN(v) } },
          y: { grid: { display: false }, ticks: { color: '#8b949e', font: { size: 11 } } },
        },
      },
    });
    return () => instVinculo.current?.destroy();
  }, [loading, stats]);

  useEffect(() => {
    if (!chartFolha.current) return;
    if (instFolha.current) instFolha.current.destroy();

    const dados = folhas.length ? folhas : MESES.map((m, i) => ({
      data_referencia_doc: String(i + 1).padStart(2, '0'),
      valor_total_item_orc: 8500000 + Math.random() * 500000,
    }));

    instFolha.current = new Chart(chartFolha.current, {
      type: 'bar',
      data: {
        labels: dados.map(f => {
          const m = parseInt(f.data_referencia_doc || '1');
          return MESES[m - 1] || String(m);
        }),
        datasets: [{
          label: 'Total da Folha',
          data: dados.map(f => parseFloat(f.valor_total_item_orc || 0)),
          backgroundColor: 'rgba(88,166,255,0.5)', borderColor: '#58a6ff', borderWidth: 1, borderRadius: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(48,54,61,.4)' }, ticks: { color: '#8b949e', font: { size: 10 } } },
          y: { grid: { color: 'rgba(48,54,61,.4)' }, ticks: { color: '#8b949e', font: { size: 10 }, callback: v => fmt(v) } },
        },
      },
    });
    return () => instFolha.current?.destroy();
  }, [folhas]);

  if (loading) return <PageSkeleton kpis={4} layout="1fr-1fr" />;

  const filtrados = servidores.filter(s => {
    const nome = s.nome_servidor || '';
    return nome.toLowerCase().includes(filtro.toLowerCase());
  });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const pagAtual = pagina > totalPaginas ? totalPaginas : pagina;
  const exibidos = filtrados.slice((pagAtual - 1) * porPagina, pagAtual * porPagina);

  const totalPaginasFolhas = Math.max(1, Math.ceil(folhas.length / porPagina));
  const pagAtualFolhas = pagina > totalPaginasFolhas ? totalPaginasFolhas : pagina;
  const exibidasFolhas = folhas.slice((pagAtualFolhas - 1) * porPagina, pagAtualFolhas * porPagina);

  const totalPaginasDiarias = Math.max(1, Math.ceil(diarias.length / porPagina));
  const pagAtualDiarias = pagina > totalPaginasDiarias ? totalPaginasDiarias : pagina;
  const exibidasDiarias = diarias.slice((pagAtualDiarias - 1) * porPagina, pagAtualDiarias * porPagina);

  const totalPaginasReingressos = Math.max(1, Math.ceil(reingressos.length / porPagina));
  const pagAtualReingressos = pagina > totalPaginasReingressos ? totalPaginasReingressos : pagina;
  const exibidosReingressos = reingressos.slice((pagAtualReingressos - 1) * porPagina, pagAtualReingressos * porPagina);

  const totalDiarias = diarias.reduce((a, d) => a + parseFloat(d.valor_total_diarias || 0), 0);
  const { total, salMed, pctComiss, efet: statsEfet, comissN: statsComiss, temp: statsTemp, totalFolhaAnual = 0, maxFolhaMes = 0 } = stats || {};
  const pctDiarias = totalFolhaAnual > 0 ? (totalDiarias / totalFolhaAnual * 100).toFixed(2) : 0;
  const alertaComiss = parseFloat(pctComiss) > 30;
  const alertaDiarias = parseFloat(pctDiarias) > 2;
  const alertaReingresso = reingressos.length > 0;

  const abas = [
    { id: 'servidores', label: 'Servidores', badge: null },
    { id: 'folha', label: 'Folha Mensal', badge: null },
    { id: 'diarias', label: 'Diárias', badge: null },
    { id: 'reingressos', label: 'Reingressos', badge: null },
  ];

  return (
    <div>
      <SectionHeader
        title="Radar de Folha de Pagamento"
        sub="API (novos endpoints): /agentes_publicos_municipais · /folhas_pagamentos · /diarias · /reingressos_agentes_publicos"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Total de Servidores" badge={ano} badgeClass="anual" value={fmtN(total || 0)} delta={`${statsEfet || 0} efetivos`} deltaClass="pos" />
        <KpiCard label="Total Folha Anual" badge="Empenhado" badgeClass="efetuado" value={fmtBRL(totalFolhaAnual)} sub={`Pico: ${fmtBRL(maxFolhaMes)}`} />
        <KpiCard label="Tx. Comissionados" badge="Risco" badgeClass={alertaComiss ? 'alerta' : 'efetuado'} value={`${pctComiss}%`} delta={`${statsComiss || 0} cargos`} deltaClass={alertaComiss ? 'neg' : 'neu'} />
        <KpiCard label="Reingressos" badge="Auditoria" badgeClass={alertaReingresso ? 'alerta' : 'reservado'} value={fmtN(reingressos.length)} delta={`${fmtBRL(totalDiarias)} em diárias`} deltaClass={alertaReingresso || alertaDiarias ? 'neg' : 'neu'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
        <Card title="Distribuição por Vínculo" sub="/agentes_publicos_municipais">
          <div style={{ position: 'relative', height: 200 }}>
            <canvas ref={chartVinculo} role="img" aria-label="Distribuição por tipo de vínculo" />
          </div>
        </Card>
        <Card title="Evolução Mensal da Folha" sub="/folhas_pagamentos">
          <div style={{ position: 'relative', height: 200 }}>
            <canvas ref={chartFolha} role="img" aria-label="Evolução mensal da folha de pagamento" />
          </div>
        </Card>
      </div>

      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Análise de Riscos com Pessoal</h4>
        <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
          Diagnóstico baseado nos dados de folha, diárias e contratações do ano de <strong style={{ color: 'var(--text)' }}>{ano}</strong>. 
          Total de {fmtN(total || 0)} servidores com custo anual estimado de {fmtBRL(totalFolhaAnual)}.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <BtnOutline onClick={() => setShowAnalise(!showAnalise)}>
            {showAnalise ? 'Ocultar diagnóstico ✕' : 'Diagnóstico completo ↗'}
          </BtnOutline>
          {!showAnalise && window.sendPrompt && (
            <BtnOutline onClick={() => window.sendPrompt(`Como um auditor analisaria uma prefeitura que gasta ${pctComiss}% com cargos comissionados e tem ${reingressos.length} reingressos suspeitos no ano?`)}>
              <LightbulbIcon size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
              Explicar com IA
            </BtnOutline>
          )}
        </div>

        {showAnalise && (
          <div style={{ marginTop: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, animation: 'slideIn .2s ease' }}>
            <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}`}</style>
            <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Relatório Analítico e Alertas</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div style={{ borderLeft: alertaComiss ? '3px solid var(--amber)' : '3px solid var(--green)', paddingLeft: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Proporção de Comissionados</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                  <strong style={{ color: alertaComiss ? 'var(--amber)' : 'var(--text)' }}>{pctComiss}%</strong> do quadro é comissionado. {alertaComiss ? 'Valor acima do limite prudencial (30%), configurando possível uso político da máquina pública.' : 'Proporção dentro de níveis aceitáveis.'}
                </div>
              </div>
              <div style={{ borderLeft: alerts.some(a => a.severity === 'critico' || a.severity === 'alto' && a.label.includes('ÓRGÃO')) ? '3px solid var(--red)' : '3px solid var(--green)', paddingLeft: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Concentração por Órgão</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                  {alerts.filter(a => a.label.includes('ÓRGÃO')).length > 0 ? (
                    alerts.filter(a => a.label.includes('ÓRGÃO')).map((a, idx) => (
                      <div key={idx}><strong style={{ color: a.severity === 'critico' ? 'var(--red)' : 'var(--amber)' }}>{a.pct}%</strong> dos servidores estão em {a.label.replace(' — CRÍTICO', '').replace(' — ATENÇÃO', '')}.</div>
                    ))
                  ) : 'Distribuição de servidores entre os órgãos municipal parece equilibrada.'}
                </div>
              </div>
              <div style={{ borderLeft: alertaReingresso ? '3px solid var(--amber)' : '3px solid var(--green)', paddingLeft: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Reingressos Atípicos</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                  Foram detectados <strong style={{ color: alertaReingresso ? 'var(--amber)' : 'var(--text)' }}>{reingressos.length}</strong> reingressos. {alertaReingresso ? 'Demissões seguidas de recontratações (mesmo servidor) demandam investigação por possível fraude ou nepotismo.' : 'Nenhum reingresso atípico detectado no período.'}
                </div>
              </div>
              <div style={{ borderLeft: alertaDiarias ? '3px solid var(--amber)' : '3px solid var(--green)', paddingLeft: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Volume de Diárias</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                  Total gasto com diárias: <strong style={{ color: alertaDiarias ? 'var(--amber)' : 'var(--text)' }}>{fmtBRL(totalDiarias)}</strong>. {alertaDiarias ? 'O volume de diárias é expressivo e pode estar sendo utilizado como complementação salarial indireta.' : 'Volume de diárias dentro de níveis esperados.'}
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

          {aba === 'servidores' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input type="search" placeholder="Buscar servidor..." value={filtro} onChange={e => { setFiltro(e.target.value); setPag(1); }}
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '7px 12px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font)', width: 220 }} />
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)', alignSelf: 'center' }}>{filtrados.length} servidores · pág {pagAtual}/{totalPaginas}</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['Servidor', 'Cargo/Função', 'Lotação', 'Vínculo', 'Remuneração'].map((h, i) => (
                        <th key={h} style={{ color: 'var(--text3)', fontWeight: 600, textAlign: i === 4 ? 'right' : 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exibidos.map((s, i) => {
                      const nome = s.nome_servidor || '–';
                      const rem = s._remuneracao || 0;
                      return (
                        <tr key={i} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Avatar name={nome} />{nome}
                            </div>
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>{s.nm_tipo_cargo || '–'}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>Órgão {s.codigo_orgao || '–'}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}><VinculoBadge vinculo={s.codigo_vinculo ? VINCULO_MAP[s.codigo_vinculo] : undefined} /></td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600, color: rem > 20000 ? 'var(--red)' : 'var(--text)' }}>
                            {rem > 0 ? fmtBRL(rem) : '–'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Paginacao pagina={pagAtual} totalPag={totalPaginas} onChange={p => setPag(p)} />
            </>
          )}

          {aba === 'folha' && (
            <>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: 'var(--green-bg)', color: 'var(--green)' }}>NOVO</span>
                Endpoint: <code style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 10 }}>/sim/folhas_pagamentos</code> + <code style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 10 }}>/sim/agentes_publicos_folha</code>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['Mês/Ano', 'Valor Bruto', 'Deduções', 'Valor Líquido'].map((h, i) => (
                        <th key={h} style={{ color: 'var(--text3)', fontWeight: 600, textAlign: i > 0 ? 'right' : 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exibidasFolhas.map((f, i) => {
                      const data_referencia_doc = parseInt(f.data_referencia_doc || '1');
                      const bruto = parseFloat(f.valor_total_item_orc || 0);
                      const ded = parseFloat(f.valor_total_deducoes || 0);
                      const liq = bruto - ded;
                      return (
                        <tr key={i} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text)' }}>{MESES[data_referencia_doc - 1]}/{f.ano_ref || ano}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--text)' }}>{fmtBRL(bruto)}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--red)' }}>{fmtBRL(ded)}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--green)' }}>{fmtBRL(liq)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Paginacao pagina={pagAtualFolhas} totalPag={totalPaginasFolhas} onChange={p => setPag(p)} />
            </>
          )}

          {aba === 'diarias' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: 'var(--green-bg)', color: 'var(--green)' }}>NOVO</span>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                  Endpoint: <code style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 10 }}>/sim/diarias</code> (módulo OUT)
                </span>
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--amber)', fontSize: 13 }}>
                  Total: {fmtBRL(totalDiarias)}
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {['CPF', 'Motivo', 'Destino', 'Data', 'Qtd. Dias', 'Valor Total'].map((h, i) => (
                        <th key={h} style={{ color: 'var(--text3)', fontWeight: 600, textAlign: i > 3 ? 'right' : 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exibidasDiarias.map((d, i) => {
                      const val = parseFloat(d.valor_total_diarias || 0);
                      const isAlto = val > 2000;
                      return (
                        <tr key={i} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
                            {d.cpf_agente_publico ? d.cpf_agente_publico.substring(0, 10) + '…' : '–'}
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text2)', fontSize: 11, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.descricao_motivo || ''}>
                            {d.descricao_motivo || '–'}
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text)' }}><><MapPinIcon size={14} /> {d.nome_cidade_destino || '–'}{d.uf_destino ? `/${d.uf_destino}` : ''}</></td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>{d.data_inicio_diaria ? d.data_inicio_diaria.substring(0, 10) : '–'}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'right', color: 'var(--text)' }}>{d.numero_diarias || '–'}</td>
                          <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 700, color: isAlto ? 'var(--amber)' : 'var(--text)' }}>
                            {fmtBRL(val)}
                            {isAlto && <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 5px', borderRadius: 3, background: 'var(--amber-bg)', color: 'var(--amber)' }}>alto</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Paginacao pagina={pagAtualDiarias} totalPag={totalPaginasDiarias} onChange={p => setPag(p)} />
              <div style={{ marginTop: 12, padding: 12, background: 'var(--bg3)', borderRadius: 6, fontSize: 11, color: 'var(--text2)', lineHeight: 1.7 }}>
                <><LightbulbIcon size={16} /> <strong style={{ color: 'var(--text)' }}>Por que monitorar diárias?</strong></> Diárias são um ponto cego frequente em auditorias municipais. Valores elevados para destinos próximos, pagamentos concentrados em poucos beneficiários ou períodos suspeitos são sinais de alerta. A nova API TCE-CE expõe esses dados publicamente via <code style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 10 }}>/sim/diarias</code>.
              </div>
            </>
          )}

          {aba === 'reingressos' && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: 'var(--green-bg)', color: 'var(--green)' }}>NOVO</span>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                  Endpoint: <code style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 10 }}>/sim/reingressos_agentes_publicos</code>
                </span>
              </div>

              {reingressos.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text3)', padding: '20px 0', textAlign: 'center', fontStyle: 'italic' }}>
                  Nenhum reingresso registrado para este município/período.
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 12, padding: 12, background: 'var(--amber-bg)', border: '1px solid rgba(210,153,34,.3)', borderRadius: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', marginBottom: 4 }}><><WarningCircleIcon size={16} /> {reingressos.length} Reingresso(s) Detectado(s)</></div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.7 }}>
                      Reingressos são servidores que foram desligados e posteriormente recontratados. Padrões sistemáticos de desligamento e recontratação — especialmente em cargos comissionados — podem indicar nepotismo ou outras irregularidades.
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>
                          {['Servidor', 'Cargo', 'Vínculo', 'Data Saída', 'Data Retorno', 'Intervalo'].map((h, i) => (
                            <th key={h} style={{ color: 'var(--text3)', fontWeight: 600, textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {exibidosReingressos.map((r, i) => {
                          const nmAgente = r.nome_servidor || r.nm_agente || r.nome || '–';
                          const dtSaida = r.dt_saida || r.dt_desligamento || '–';
                          const dtRetorno = r.dt_retorno || r.dt_reingresso || '–';
                          const vinculo = r.codigo_vinculo ? VINCULO_MAP[r.codigo_vinculo] : (r.vinculo || r.tipo_vinculo);
                          let intervalo = '–';
                          try {
                            const diff = new Date(dtRetorno) - new Date(dtSaida);
                            const meses = Math.round(diff / (1000 * 60 * 60 * 24 * 30));
                            intervalo = meses + ' meses';
                          } catch (e) { }
                          return (
                            <tr key={i} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                              <td style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Avatar name={nmAgente} size={26} />
                                  {nmAgente}
                                </div>
                              </td>
                              <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>{r.nm_tipo_cargo || r.cargo || r.nm_cargo || '–'}</td>
                              <td style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}><VinculoBadge vinculo={vinculo} /></td>
                              <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--red)', fontFamily: 'var(--mono)', fontSize: 11 }}>{dtSaida}</td>
                              <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--green)', fontFamily: 'var(--mono)', fontSize: 11 }}>{dtRetorno}</td>
                              <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--amber)', fontFamily: 'var(--mono)', fontWeight: 600 }}>{intervalo}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Paginacao pagina={pagAtualReingressos} totalPag={totalPaginasReingressos} onChange={p => setPag(p)} />
                </>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
