import React, { useEffect, useRef, useState } from 'react';
import { JeepIcon, GraduationCapIcon, HospitalIcon, DropHalfIcon, BridgeIcon, TreeIcon, WarningCircleIcon, CalendarBlankIcon, FlagIcon, SparkleIcon } from '@phosphor-icons/react';
import { Chart } from 'chart.js/auto';
import {
  getObrasMunicipais, getMedicoesObras, getStatusObras,
  fmt, fmtBRL, fmtN, muniParams,
} from '../api';
import { KpiCard, Card, SectionHeader, StatusBadge, Spinner, BtnOutline, PageSkeleton } from './UI';

function obraStatus(s) {
  const st = String(s || '').toUpperCase();
  if (st.includes('CONCLU') || st.includes('ENTREGUE') || st === '3') return { variant: 'ok', label: 'CONCLUÍDA' };
  if (st.includes('PARALISA') || st.includes('SUSPENS') || st === '4') return { variant: 'cancelado', label: 'PARALISADA' };
  if (st.includes('ANDAMENTO') || st.includes('EXECU') || st === '2') return { variant: 'aberto', label: 'EM ANDAMENTO' };
  if (st.includes('LICITAC') || st.includes('CONTRAT') || st === '1') return { variant: 'alerta', label: 'CONTRATANDO' };
  return { variant: 'alerta', label: st || 'INDEFINIDO' };
}

function tipoIcon(tipo, descricao) {
  const t = (tipo || '').toUpperCase() + ' ' + (descricao || '').toUpperCase();
  if (t.includes('PAVIMENT') || t.includes('ASFALT')) return JeepIcon;
  if (t.includes('ESCOLA') || t.includes('EDUCA')) return GraduationCapIcon;
  if (t.includes('SAÚDE') || t.includes('UBS') || t.includes('HOSPITAL')) return HospitalIcon;
  if (t.includes('SANEAM') || t.includes('ÁGUA') || t.includes('ESGOT') || t.includes('DRENAGEM')) return DropHalfIcon;
  if (t.includes('PONTE')) return BridgeIcon;
  if (t.includes('PRAÇA') || t.includes('LAZER')) return TreeIcon;
  return CalendarBlankIcon;
}

function renderTipoIcon(tipo, descricao, size = 18) {
  const Icon = tipoIcon(tipo, descricao);
  return Icon ? <Icon size={size} /> : null;
}

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
const OBRAS_MOCK = [
  { id: 'OBR-001', descricao: 'Pavimentação e drenagem da Rua Coronel Alexandrino — trecho urbano', tipo: 'PAVIMENTAÇÃO', municipio: 'Quixadá', valor: 1850000, status: 'EM ANDAMENTO', pct_fisico: 68, pct_financeiro: 55, dt_inicio: '2023-03-15', dt_prev_fim: '2024-06-30' },
  { id: 'OBR-002', descricao: 'Construção de Unidade Básica de Saúde — Zona Rural', tipo: 'SAÚDE', municipio: 'Quixeramobim', valor: 920000, status: 'CONCLUÍDA', pct_fisico: 100, pct_financeiro: 98, dt_inicio: '2022-08-01', dt_prev_fim: '2023-09-30' },
  { id: 'OBR-003', descricao: 'Reforma e ampliação da Escola Estadual Municipal José Ferreira', tipo: 'EDUCAÇÃO', municipio: 'Pedra Branca', valor: 640000, status: 'PARALISADA', pct_fisico: 42, pct_financeiro: 38, dt_inicio: '2023-01-10', dt_prev_fim: '2023-12-31' },
  { id: 'OBR-004', descricao: 'Sistema de abastecimento de água — comunidade Serra dos Alves', tipo: 'SANEAMENTO', municipio: 'Senador Pompeu', valor: 2100000, status: 'EM ANDAMENTO', pct_fisico: 31, pct_financeiro: 25, dt_inicio: '2023-09-05', dt_prev_fim: '2025-03-31' },
  { id: 'OBR-005', descricao: 'Construção de ponte sobre o riacho do Boqueirão — Zona Rural', tipo: 'PONTE', municipio: 'Mombaça', valor: 480000, status: 'CONCLUÍDA', pct_fisico: 100, pct_financeiro: 100, dt_inicio: '2023-05-20', dt_prev_fim: '2023-11-30' },
  { id: 'OBR-006', descricao: 'Revitalização da praça central com paisagismo e iluminação LED', tipo: 'PRAÇA', municipio: 'Boa Viagem', valor: 320000, status: 'EM ANDAMENTO', pct_fisico: 85, pct_financeiro: 70, dt_inicio: '2024-01-15', dt_prev_fim: '2024-04-30' },
  { id: 'OBR-007', descricao: 'Construção de quadra poliesportiva coberta na Escola Municipal', tipo: 'EDUCAÇÃO', municipio: 'Ibaretama', valor: 410000, status: 'PARALISADA', pct_fisico: 15, pct_financeiro: 12, dt_inicio: '2023-11-01', dt_prev_fim: '2024-08-31' },
  { id: 'OBR-008', descricao: 'Pavimentação de vias de acesso ao polo industrial', tipo: 'PAVIMENTAÇÃO', municipio: 'Quixadá', valor: 3200000, status: 'EM ANDAMENTO', pct_fisico: 22, pct_financeiro: 18, dt_inicio: '2024-02-01', dt_prev_fim: '2025-12-31' },
];

function ObraCard({ obra, onClick }) {
  const [hov, setHov] = useState(false);
  const st = obraStatus(obra.status);
  const pctF = obra.pct_fisico ?? 0;
  const pctFin = obra.pct_financeiro ?? 0;
  const atrasada = pctFin > pctF + 10;

  const idObra = obra.numero_registro_obra || obra.numero_obra || obra.id || obra.nr_obra || '–';
  const descricaoObra = obra.descricao_obra_servico || obra.descricao || obra.ds_obra || '–';
  const val = parseFloat(obra.valor_total_obra || obra.valor || obra.vl_obra || 0);
  const dataInicio = obra.data_inicio_obra ? obra.data_inicio_obra.substring(0, 10) : (obra.dt_inicio || '–');
  const dataFim = obra.data_fim_obra ? obra.data_fim_obra.substring(0, 10) : (obra.dt_prev_fim || '–');
  const tipoObra = obra.tipo_obra === 'O' ? 'OBRA' : obra.tipo_obra === 'S' ? 'SERVIÇO' : obra.tipo || '–';

  return (
    <div
      onClick={() => onClick(obra)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'var(--bg3)' : 'var(--bg2)',
        border: `1px solid ${st.variant === 'cancelado' ? 'rgba(248,81,73,.3)' : hov ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 8, padding: '14px 16px', cursor: 'pointer',
        transition: 'all .12s', transform: hov ? 'translateX(2px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 38, height: 38, borderRadius: 6, background: st.variant === 'cancelado' ? 'var(--red-bg)' : st.variant === 'ok' ? 'var(--green-bg)' : 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {renderTipoIcon(tipoObra, descricaoObra, 18)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{idObra}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)' }}>· {obra.municipio || obra.nm_municipio || '–'}</span>
            {atrasada && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'var(--amber-bg)', color: 'var(--amber)' }}><><WarningCircleIcon size={14} /> FINANCEIRO ADIANTADO</></span>}
          </div>

          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.35, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {descricaoObra}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
            {[['Físico', pctF, '#58a6ff'], ['Financeiro', pctFin, '#3fb950']].map(([l, v, c]) => (
              <div key={l}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5 }}>{l}</span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text2)', fontWeight: 600 }}>{v}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, v)}%`, borderRadius: 2, background: c, transition: 'width .5s' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}><><CalendarBlankIcon size={14} /> Início: {dataInicio}</></span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}><><FlagIcon size={14} /> Prev: {dataFim}</></span>
            {val > 0 && <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12, color: 'var(--text)', marginLeft: 'auto' }}>{fmt(val)}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <StatusBadge variant={st.variant}>{st.label}</StatusBadge>
          <span style={{ fontSize: 10, color: hov ? 'var(--blue)' : 'var(--text3)', transition: 'color .15s' }}>
            {hov ? 'Detalhes →' : '→'}
          </span>
        </div>
      </div>
    </div>
  );
}

function ObraDetail({ obra, municipio, ano, onBack }) {
  const [medicoes, setMedicoes] = useState(null);
  const [status, setStatus] = useState(null);
  const chartRef = useRef(null);
  const chartInst = useRef(null);
  const st = obraStatus(obra.status);

  const valorExecutado = medicoes?.reduce((sum, m) => sum + parseFloat(m.valor_medicao || 0), 0) || 0;
  const pctFinanceiro = (obra.valor_total_obra > 0 ? (valorExecutado / obra.valor_total_obra) * 100 : 0).toFixed(0);

  const pctFisico = st.label === 'CONCLUÍDA' ? 100 : (obra.pct_fisico || 0);

  const idObra = obra.numero_registro_obra || obra.numero_obra || obra.id || obra.nr_obra || '–';
  const numeroObra = obra.numero_obra || obra.id || obra.nr_obra;
  const descricaoObra = obra.descricao_obra_servico || obra.descricao || obra.ds_obra || '–';
  const val = parseFloat(obra.valor_total_obra || obra.valor || obra.vl_obra || 0);
  const dataInicio = obra.data_inicio_obra ? obra.data_inicio_obra.substring(0, 10) : (obra.dt_inicio || '–');
  const dataFim = obra.data_fim_obra ? obra.data_fim_obra.substring(0, 10) : (obra.dt_prev_fim || '–');
  const tipoObra = obra.tipo_obra === 'O' ? 'OBRA' : obra.tipo_obra === 'S' ? 'SERVIÇO' : obra.tipo || '–';

  useEffect(() => {
    const codMuni = municipio || obra.codigo_municipio;
    const anoAtual = ano || new Date().getFullYear();
    const exercicio_orcamento = `${anoAtual}00`;
    const meses = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

    const medicoesPromises = meses.map(mes => getMedicoesObras({
      codigo_municipio: codMuni,
      exercicio_orcamento,
      data_referencia_doc: `${anoAtual}${mes}`,
    }));

    const paramsStatus = {
      codigo_municipio: codMuni,
      data_inicio: `${anoAtual}-01-01`,
      data_fim: `${anoAtual}-12-31`,
    };

    Promise.all([Promise.all(medicoesPromises), getStatusObras(paramsStatus)]).then(([medicoesResults, s]) => {
      const arrM = medicoesResults.flatMap(res => res?.elements || (Array.isArray(res) ? res : []));
      const arrS = s?.elements || (Array.isArray(s) ? s : []);

      setMedicoes(arrM.filter(x => (x.numero_obra_servico || x.numero_obra || x.nr_obra) == numeroObra));
      setStatus(arrS.filter(x => (x.numero_obra_servico || x.numero_obra || x.nr_obra) == numeroObra));
    });
  }, [obra, municipio, ano]);

  useEffect(() => {
    if (!chartRef.current) return;

    const sortedMed = [...(medicoes || [])].sort((a, b) => parseInt(a.numero_medicao || 0) - parseInt(b.numero_medicao || 0));
    const medicoesList = sortedMed.length ? sortedMed : Array.from({ length: 6 }, (_, i) => ({
      numero_medicao: i + 1,
      valor_medicao: val * (pctFinanceiro || 50) / 100 / 6 * (0.5 + Math.random()),
    }));

    if (chartInst.current) chartInst.current.destroy();
    chartInst.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: medicoesList.map((m, i) => `Med. ${m.numero_medicao || m.nr_medicao || i + 1}`),
        datasets: [
          {
            label: 'Valor Medido (R$)',
            data: medicoesList.map(m => parseFloat(m.valor_medicao || 0)),
            backgroundColor: 'rgba(88,166,255,0.5)', borderColor: '#58a6ff', borderWidth: 1, borderRadius: 4,
            yAxisID: 'y',
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#8b949e', font: { size: 11 } } }, tooltip: { callbacks: { label: i => i.datasetIndex === 0 ? fmtBRL(i.raw) : i.raw + '%' } } },
        scales: {
          x: { grid: { color: 'rgba(48,54,61,.4)' }, ticks: { color: '#8b949e', font: { size: 10 } } },
          y: { position: 'left', grid: { color: 'rgba(48,54,61,.4)' }, ticks: { color: '#8b949e', font: { size: 10 }, callback: v => fmt(v) } },
        },
      },
    });
    return () => chartInst.current?.destroy();
  }, [medicoes, pctFinanceiro, val]);

  return (
    <div style={{ animation: 'slideIn .2s ease' }}>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
          ← Voltar às obras
        </button>
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>/</span>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>Obra {numeroObra}</span>
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--blue)', borderRadius: 8, padding: 20, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 22 }}>{renderTipoIcon(tipoObra, descricaoObra, 22)}</span>
          <StatusBadge variant={st.variant}>{st.label}</StatusBadge>
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)', marginLeft: 'auto' }}>{idObra}</span>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, marginBottom: 14 }}>
          {descricaoObra}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 14 }}>
          {[
            ['Valor Contratado', val > 0 ? fmtBRL(val) : '–', true],
            ['Município', obra.municipio || '–'],
            ['Tipo', tipoObra],
            ['Início', dataInicio],
            ['Prev. Conclusão', dataFim],
            ['Contratado', obra.contratado || '–'],
          ].map(([l, v, mono], i) => (
            <div key={i}>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontFamily: mono ? 'var(--mono)' : undefined, fontWeight: mono ? 600 : 400 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12 }}>
        {[
          ['Execução Física', pctFisico + '%', '#58a6ff'],
          ['Execução Financeira', pctFinanceiro + '%', '#3fb950'],
          ['Valor Executado', fmt(valorExecutado), '#d29922'],
          ['Saldo a Pagar', fmt(Math.max(0, val - valorExecutado)), '#8b949e'],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: 'var(--bg3)', borderRadius: 6, padding: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>{l}</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--mono)', color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Cronograma de Medições</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>
          Fonte: <code style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 10 }}>/sim/medicoes_obras_municipio</code>
          {medicoes === null && ' — carregando...'}
          {medicoes && !medicoes.length && ' — sem medições no período'}
        </div>
        <div style={{ position: 'relative', height: 220 }}>
          <canvas ref={chartRef} role="img" aria-label="Cronograma físico-financeiro da obra" />
        </div>
      </div>

      {medicoes && medicoes.length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Histórico de Medições</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ color: 'var(--text3)', fontWeight: 600, textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase' }}>Medição</th>
                  <th style={{ color: 'var(--text3)', fontWeight: 600, textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase' }}>Data</th>
                  <th style={{ color: 'var(--text3)', fontWeight: 600, textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase' }}>Empenho</th>
                  <th style={{ color: 'var(--text3)', fontWeight: 600, textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase' }}>Empresa / Responsável</th>
                  <th style={{ color: 'var(--text3)', fontWeight: 600, textAlign: 'right', padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {[...medicoes].sort((a, b) => parseInt(b.numero_medicao || 0) - parseInt(a.numero_medicao || 0)).map((m, i) => (
                  <tr key={i} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', color: 'var(--text2)' }}>Nº {m.numero_medicao || m.nr_medicao || '–'}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>{m.data_medicao ? m.data_medicao.substring(0, 10) : '–'}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', color: 'var(--text)' }}>{m.numero_empenho || '–'}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>{m.nome_responsavel_empresa || '–'}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--text)' }}>{fmtBRL(parseFloat(m.valor_medicao || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {st.variant === 'cancelado' && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,81,73,.4)', borderRadius: 8, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 6 }}><><WarningCircleIcon size={14} /> Obra Paralisada</></div>
          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
            Esta obra consta como paralisada na base do TCE-CE. Obras paralisadas com execução financeira acima de 30% sem conclusão física correspondente
            são indicadores de possível irregularidade. Recomenda-se investigar o contrato associado e os responsáveis.
          </div>
          <BtnOutline style={{ marginTop: 10 }} onClick={() => window.sendPrompt?.(`Quais são as implicações legais de uma obra pública paralisada no Ceará? Como um cidadão pode denunciar?`)}>
            Como denunciar ↗
          </BtnOutline>
        </div>
      )}

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Histórico de Status</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>
          <code style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 10 }}>/sim/status_obras_servico_engenharia</code>
        </div>
        {status === null ? (
          <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Consultando API...</div>
        ) : status?.length ? (
          [...status].sort((a, b) => new Date(b.data_envio_informacao || 0) - new Date(a.data_envio_informacao || 0)).map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', marginTop: 4, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text2)', fontFamily: 'var(--mono)' }}>{s.data_envio_informacao ? s.data_envio_informacao.substring(0, 10) : s.dt_status || s.data || '–'}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{obraStatus(s.status_obra || s.status).label}</span>
                </div>
                <div style={{ color: 'var(--text2)', marginBottom: s.nome_responsavel ? 6 : 0 }}>{s.observacao_status || s.observacao || s.ds_status || '–'}</div>
                {s.nome_responsavel && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>👤 {s.nome_responsavel}</span>
                    {s.email_responsavel && !s.email_responsavel.includes('****') && <span>✉️ {s.email_responsavel}</span>}
                    {s.numero_telefone_responsavel && !s.numero_telefone_responsavel.includes('****') && <span>📞 {s.numero_telefone_responsavel}</span>}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Nenhum histórico disponível via API.</div>
        )}
      </div>
    </div>
  );
}

export default function F7({ municipio, ano, onAlertCountChange }) {
  const [obras, setObras] = useState([]);
  const [loading, setLoad] = useState(true);
  const [selected, setSel] = useState(null);
  const [filtro, setFiltro] = useState({ status: '', tipo: '', busca: '' });
  const chartRef = useRef(null);
  const chartInst = useRef(null);
  const [pagina, setPag] = useState(1);
  const porPagina = 5;

  useEffect(() => {
    async function load() {
      setLoad(true);
      setPag(1);
      setSel(null);

      const anoAtual = ano || new Date().getFullYear();
      const data_inicio = `${anoAtual}-01-01`;
      const data_fim = `${anoAtual}-12-31`;
      const exercicio_orcamento = `${anoAtual}00`;

      const paramsObras = {
        codigo_municipio: municipio,
        exercicio_orcamento,
        data_inicio,
        data_fim
      };

      const paramsStatus = {
        codigo_municipio: municipio,
        data_inicio,
        data_fim
      };

      const [obrasData, statusData] = await Promise.all([
        getObrasMunicipais(paramsObras),
        getStatusObras(paramsStatus),
      ]);

      const obrasArr = obrasData?.elements || (Array.isArray(obrasData) ? obrasData : []);
      const statusArr = statusData?.elements || (Array.isArray(statusData) ? statusData : []);

      let lista = obrasArr.length ? obrasArr : OBRAS_MOCK;

      if (statusArr.length) {
        const sortedStatus = [...statusArr].sort((a, b) => new Date(a.data_envio_informacao || 0) - new Date(b.data_envio_informacao || 0));
        const statusMap = {};
        sortedStatus.forEach(s => {
          const idObra = s.numero_obra || s.nr_obra;
          if (idObra) statusMap[idObra] = s.status_obra || s.ds_status || s.observacao_status;
        });
        lista = lista.map(o => statusMap[o.numero_obra || o.nr_obra || o.id] ? { ...o, status: statusMap[o.numero_obra || o.nr_obra || o.id] } : o);
      }

      const nParalisadasTotal = lista.filter(o => obraStatus(o.status).variant === 'cancelado').length;
      if (onAlertCountChange) {
        onAlertCountChange(nParalisadasTotal);
      }

      setObras(lista);
      setLoad(false);
    }
    load();
  }, [municipio, ano]);

  useEffect(() => {
    if (loading || !chartRef.current || selected) return;
    if (chartInst.current) chartInst.current.destroy();

    const counts = { 'EM ANDAMENTO': 0, 'CONCLUÍDA': 0, 'PARALISADA': 0, 'OUTROS': 0 };
    obras.forEach(o => {
      const s = obraStatus(o.status).label;
      if (counts[s] !== undefined) counts[s]++;
      else counts['OUTROS']++;
    });

    chartInst.current = new Chart(chartRef.current, {
      type: 'doughnut',
      data: {
        labels: Object.keys(counts),
        datasets: [{ data: Object.values(counts), backgroundColor: ['#58a6ff', '#3fb950', '#f85149', '#6e7681'], borderColor: '#161b22', borderWidth: 2 }],
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false } } },
    });
    return () => chartInst.current?.destroy();
  }, [loading, obras, selected]);

  if (loading) return <PageSkeleton kpis={4} layout="2fr-1fr" />;

  if (selected) {
    return <ObraDetail obra={selected} municipio={municipio} ano={ano} onBack={() => setSel(null)} />;
  }

  const filtradas = obras.filter(o => {
    const st = filtro.status ? obraStatus(o.status).label === filtro.status : true;
    const tipoObra = o.tipo_obra === 'O' ? 'OBRA' : o.tipo_obra === 'S' ? 'SERVIÇO' : o.tipo || '';
    const tip = filtro.tipo ? tipoObra.toUpperCase().includes(filtro.tipo.toUpperCase()) : true;
    const desc = o.descricao_obra_servico || o.descricao || o.ds_obra || '';
    const bsc = filtro.busca ? desc.toLowerCase().includes(filtro.busca.toLowerCase()) : true;
    return st && tip && bsc;
  });

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const pagAtual = pagina > totalPaginas ? totalPaginas : pagina;
  const exibidas = filtradas.slice((pagAtual - 1) * porPagina, pagAtual * porPagina);

  const totalValor = filtradas.reduce((a, o) => a + parseFloat(o.valor_total_obra || o.valor || o.vl_obra || 0), 0);
  const nParalisadas = filtradas.filter(o => obraStatus(o.status).variant === 'cancelado').length;
  const nConcluidas = filtradas.filter(o => obraStatus(o.status).variant === 'ok').length;
  const nAndamento = filtradas.filter(o => obraStatus(o.status).variant === 'aberto').length;

  return (
    <div>
      <SectionHeader
        title="Monitor de Obras Municipais"
        sub={`Módulo OSE — API: /sim/obras_municipais_servicos_engenharia · /medicoes_obras_municipio · /status_obras_servico_engenharia`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Total em Obras" badge={ano} badgeClass="anual" value={fmt(totalValor)} delta={`${filtradas.length} obras`} />
        <KpiCard label="Em Andamento" badge="Ativas" badgeClass="reservado" value={fmtN(nAndamento)} delta="obras em execução" />
        <KpiCard label="Concluídas" badge="Entregues" badgeClass="efetuado" value={fmtN(nConcluidas)} delta="no período" deltaClass="pos" />
        <KpiCard label="Paralisadas" badge="Alerta" badgeClass="alerta" value={fmtN(nParalisadas)} delta={nParalisadas > 0 ? 'requer atenção' : 'nenhuma'} deltaClass={nParalisadas > 0 ? 'neg' : 'pos'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Obras Municipais</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>Clique para ver medições, cronograma e status — fonte: TCE-CE</div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={filtro.status} onChange={e => { setFiltro(f => ({ ...f, status: e.target.value })); setPag(1); }}
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font)', cursor: 'pointer' }}>
                <option value="">Todos os status</option>
                <option value="EM ANDAMENTO">Em andamento</option>
                <option value="CONCLUÍDA">Concluída</option>
                <option value="PARALISADA">Paralisada</option>
              </select>
              <select value={filtro.tipo} onChange={e => { setFiltro(f => ({ ...f, tipo: e.target.value })); setPag(1); }}
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font)', cursor: 'pointer' }}>
                <option value="">Todos os tipos</option>
                <option value="PAVIMENTAÇÃO">Pavimentação</option>
                <option value="SAÚDE">Saúde</option>
                <option value="EDUCAÇÃO">Educação</option>
                <option value="SANEAMENTO">Saneamento</option>
              </select>
              <input type="search" placeholder="Buscar obra..."
                value={filtro.busca} onChange={e => { setFiltro(f => ({ ...f, busca: e.target.value })); setPag(1); }}
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font)', width: 180 }} />
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>{filtradas.length} obras · pág {pagAtual}/{totalPaginas}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {exibidas.map((o, i) => <ObraCard key={o.id || i} obra={o} onClick={setSel} />)}
              {filtradas.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: 20 }}>Nenhuma obra encontrada com os filtros aplicados.</div>}
            </div>
            <Paginacao pagina={pagAtual} totalPag={totalPaginas} onChange={p => setPag(p)} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card title="Distribuição por Status" sub="Visão geral das obras">
            <div style={{ position: 'relative', height: 160 }}>
              <canvas ref={chartRef} role="img" aria-label="Distribuição de obras por status" />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text)' }}>{filtradas.length}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>obras</div>
              </div>
            </div>
            {[['EM ANDAMENTO', '#58a6ff', nAndamento], ['CONCLUÍDA', '#3fb950', nConcluidas], ['PARALISADA', '#f85149', nParalisadas]].map(([l, c, n]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>{l}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{n}</span>
              </div>
            ))}
          </Card>

          {nParalisadas > 0 && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,81,73,.35)', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', marginBottom: 10 }}><><WarningCircleIcon size={14} /> Obras Paralisadas</></div>
              {obras.filter(o => obraStatus(o.status).variant === 'cancelado').slice(0, 3).map((o, i) => (
                <div key={i} onClick={() => setSel(o)} style={{ cursor: 'pointer', padding: '8px 0', borderBottom: '1px solid rgba(248,81,73,.2)' }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', marginBottom: 2, lineHeight: 1.3 }}>
                    {(o.descricao || '').substring(0, 60)}...
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>{o.municipio} · {fmt(parseFloat(o.valor || 0))}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
