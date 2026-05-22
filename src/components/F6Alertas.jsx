import React, { useEffect, useState } from 'react';
import { getNotasEmpenhos, getNotasFiscais, getNotasPagamentos, orcParams, fmt, fmtBRL, fmtN, MUNICIPIOS_SERTAO } from '../api';
import { TrendUpIcon, CircleIcon, SquareIcon, InfoIcon } from '@phosphor-icons/react';
import { SectionHeader, BtnOutline, Spinner, PageSkeleton } from './UI';

const SEV = {
  alto: { bg: 'var(--red-bg)', color: 'var(--red)', icon: '!' },
  medio: { bg: 'var(--amber-bg)', color: 'var(--amber)', icon: '!' },
  baixo: { bg: 'var(--blue-bg)', color: 'var(--blue)', icon: <InfoIcon size={14} /> },
};

function muniNome(codigo) {
  const m = MUNICIPIOS_SERTAO.find(m => m.codigo === codigo);
  return m ? m.nome.charAt(0).toUpperCase() + m.nome.slice(1).toLowerCase() : codigo;
}

const METODOLOGIA_ALERTAS = [
  { sev: 'alto', titulo: 'Pagamento sem NF vinculada', desc: 'Um pagamento foi liquidado, mas não há nenhuma nota fiscal eletrônica (NF-e) associada ao mesmo empenho. É um forte indício de irregularidade.' },
  { sev: 'medio', titulo: 'Superfaturamento Suspeito', desc: 'O valor pago é mais que o dobro do valor total das notas fiscais vinculadas ao empenho.' },
  { sev: 'medio', titulo: 'Discrepância de Valores', desc: 'O valor pago é superior ao valor da nota fiscal. Requer análise para justificar a diferença.' },
  { sev: 'baixo', titulo: 'NF emitida sem pagamento', desc: 'Existe uma nota fiscal registrada para um empenho, mas nenhum pagamento foi efetuado no período.' },
  { sev: 'baixo', titulo: 'Subpagamento', desc: 'O valor pago é inferior a 50% do valor da nota fiscal. Pode indicar retenção indevida ou parcelamento longo.' },
  { sev: 'baixo', titulo: 'Fracionamento de Despesa', desc: 'Um único empenho possui 8 ou mais notas fiscais associadas. Pode indicar tentativa de burlar licitação.' },
  { sev: 'baixo', titulo: 'Rateio Excessivo', desc: 'Um único empenho possui 8 ou mais pagamentos fragmentados realizados no período.' },
];

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

export default function F6({ municipio, ano, onAlertCountChange }) {
  const [loading, setLoad] = useState(true);
  const [counts, setCounts] = useState({ alto: 0, medio: 0, baixo: 0, arquivo: 0 });
  const [alertas, setAlertas] = useState([]);
  const [bloqueado, setBloq] = useState(0);
  const [pagina, setPag] = useState(1);
  const porPagina = 5;

  useEffect(() => {
    async function load() {
      setLoad(true);
      setPag(1);
      const params = orcParams(municipio, ano);

      const [empenhos, nfs, pags] = await Promise.all([
        getNotasEmpenhos(params),
        getNotasFiscais(params),
        getNotasPagamentos(params),
      ]);

      if (empenhos?.length) {
        const listaNfs = nfs || [];
        const listaPags = pags || [];

        const empenhosComNf = new Set(listaNfs.map(n => n.numero_empenho));

        const valorNfPorEmpenho = {};
        const nfCountPorEmpenho = {};
        const nfListaPorEmpenho = {};
        listaNfs.forEach(n => {
          if (n.numero_empenho) {
            valorNfPorEmpenho[n.numero_empenho] = (valorNfPorEmpenho[n.numero_empenho] || 0) + parseFloat(n.valor_liquido || 0);
            nfCountPorEmpenho[n.numero_empenho] = (nfCountPorEmpenho[n.numero_empenho] || 0) + 1;
            if (!nfListaPorEmpenho[n.numero_empenho]) nfListaPorEmpenho[n.numero_empenho] = [];
            nfListaPorEmpenho[n.numero_empenho].push(n);
          }
        });

        const valorPagPorEmpenho = {};
        const pagCountPorEmpenho = {};
        listaPags.forEach(p => {
          if (p.numero_empenho) {
            valorPagPorEmpenho[p.numero_empenho] = (valorPagPorEmpenho[p.numero_empenho] || 0) + parseFloat(p.valor_nota_pagamento || 0);
            pagCountPorEmpenho[p.numero_empenho] = (pagCountPorEmpenho[p.numero_empenho] || 0) + 1;
          }
        });

        let alto = 0, medio = 0, baixo = 0, arquivo = 0, totalBloq = 0;
        const gerados = [];
        empenhos.forEach(e => {
          const numEmpenho = e.numero_empenho || e.nr_empenho;
          const valPag = valorPagPorEmpenho[numEmpenho] || 0;
          const valNf = valorNfPorEmpenho[numEmpenho] || 0;
          const nfCount = nfCountPorEmpenho[numEmpenho] || 0;
          const pagCount = pagCountPorEmpenho[numEmpenho] || 0;

          if (valPag > 0 && !empenhosComNf.has(numEmpenho)) {
            alto++; totalBloq += valPag;
            gerados.push({ sev: 'alto', id: 'AL-' + String(gerados.length + 1).padStart(4, '0'), titulo: 'Pagamento sem NF vinculada', origem: `Órgão ${e.codigo_orgao || '–'} · ${muniNome(municipio)}`, val: valPag, status: 'Irregularidade', detalhe: `Empenho nº ${numEmpenho} — pagamento liquidado (${fmtBRL(valPag)}), mas nenhuma NF encontrada no exercício ${ano}.` });
          } else if (valPag > 0 && valNf > 0 && valPag > valNf * 2) {
            medio++; totalBloq += valPag - valNf;
            gerados.push({ sev: 'medio', id: 'AL-' + String(gerados.length + 1).padStart(4, '0'), titulo: 'Superfaturamento — pagamento dobra NF', origem: `Órgão ${e.codigo_orgao || '–'} · ${muniNome(municipio)}`, val: valPag - valNf, status: 'Superfaturamento Suspeito', detalhe: `Empenho nº ${numEmpenho} — pago ${fmtBRL(valPag)} vs NF ${fmtBRL(valNf)} (${Math.round(valPag / valNf * 100)}% do valor da NF).` });
          } else if (valPag > 0 && valNf > 0 && valPag > valNf + 100) {
            medio++;
            gerados.push({ sev: 'medio', id: 'AL-' + String(gerados.length + 1).padStart(4, '0'), titulo: 'Discrepância de valor em pagamento', origem: `Órgão ${e.codigo_orgao || '–'} · ${muniNome(municipio)}`, val: valPag - valNf, status: 'Em Análise', detalhe: `Empenho nº ${numEmpenho} — pago ${fmtBRL(valPag)} vs NF ${fmtBRL(valNf)} (diferença de ${fmtBRL(valPag - valNf)}).` });
          } else if (empenhosComNf.has(numEmpenho) && valPag === 0) {
            baixo++;
            gerados.push({ sev: 'baixo', id: 'AL-' + String(gerados.length + 1).padStart(4, '0'), titulo: 'NF emitida sem pagamento', origem: `Órgão ${e.codigo_orgao || '–'} · ${muniNome(municipio)}`, val: valNf, status: 'Aguardando Pagamento', detalhe: `Empenho nº ${numEmpenho} — NF emitida (${fmtBRL(valNf)}), mas nenhum pagamento registrado até o momento.` });
          } else if (valPag > 0 && valNf > 0 && valPag < valNf * 0.5) {
            baixo++;
            gerados.push({ sev: 'baixo', id: 'AL-' + String(gerados.length + 1).padStart(4, '0'), titulo: 'Pagamento muito abaixo da NF', origem: `Órgão ${e.codigo_orgao || '–'} · ${muniNome(municipio)}`, val: valNf - valPag, status: 'Subpagamento', detalhe: `Empenho nº ${numEmpenho} — NF de ${fmtBRL(valNf)}, mas apenas ${fmtBRL(valPag)} foi pago.` });
          } else if (nfCount >= 8) {
            baixo++;
            gerados.push({ sev: 'baixo', id: 'AL-' + String(gerados.length + 1).padStart(4, '0'), titulo: 'Múltiplas NFs para mesmo empenho', origem: `Órgão ${e.codigo_orgao || '–'} · ${muniNome(municipio)}`, val: valNf || valPag, status: 'Fracionamento', detalhe: `Empenho nº ${numEmpenho} — ${nfCount} notas fiscais emitidas. Pode indicar fracionamento de despesa.` });
          } else if (pagCount >= 8) {
            baixo++;
            gerados.push({ sev: 'baixo', id: 'AL-' + String(gerados.length + 1).padStart(4, '0'), titulo: 'Múltiplos pagamentos para mesmo empenho', origem: `Órgão ${e.codigo_orgao || '–'} · ${muniNome(municipio)}`, val: valPag, status: 'Rateio', detalhe: `Empenho nº ${numEmpenho} — ${pagCount} pagamentos realizados. Pode indicar rateio excessivo.` });
          } else {
            arquivo++;
          }
        });

        setCounts({ alto, medio, baixo, arquivo });
        setBloq(totalBloq || 0);
        if (onAlertCountChange) onAlertCountChange(alto + medio);

        setAlertas(gerados.sort((a, b) => {
          const peso = { alto: 3, medio: 2, baixo: 1 };
          return (peso[b.sev] || 0) - (peso[a.sev] || 0) || b.val - a.val;
        }));
      }
      setLoad(false);
    }
    load();
  }, [municipio, ano]);

  if (loading) return <PageSkeleton kpis={4} layout="1fr" />;

  const totalPaginas = Math.max(1, Math.ceil(alertas.length / porPagina));
  const pagAtual = pagina > totalPaginas ? totalPaginas : pagina;
  const exibidos = alertas.slice((pagAtual - 1) * porPagina, pagAtual * porPagina);

  const statBoxes = [
    { label: 'Alto Risco', icon: <TrendUpIcon size={20} />, val: counts.alto, bg: 'var(--red-bg)', color: 'var(--red)' },
    { label: 'Risco Médio', icon: '!', val: counts.medio, bg: 'var(--amber-bg)', color: 'var(--amber)' },
    { label: 'Baixo Risco', icon: <InfoIcon size={20} />, val: counts.baixo, bg: 'var(--blue-bg)', color: 'var(--blue)' },
    { label: 'Arquivados', icon: <SquareIcon size={20} weight="fill" />, val: counts.arquivo, bg: 'var(--bg3)', color: 'var(--text2)' },
  ];

  return (
    <div>
      <SectionHeader title="Central de Alertas — Compliance" sub="/sim/notas_empenhos · /sim/notas_fiscais · /sim/notas_pagamentos" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {statBoxes.map(s => (
          <div key={s.label} style={{ background: s.bg, border: '1px solid var(--border)', borderRadius: 6, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 12, marginBottom: 4, color: s.color }}>{s.icon}</div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text)' }}>{fmtN(s.val)}</div>
          </div>
        ))}
      </div>

      {alertas.length === 0 && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--green-bg)', border: '1px solid rgba(63,185,80,.3)', borderRadius: 8, fontSize: 12, color: 'var(--green)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>✓</span>
          <span>Nenhuma irregularidade detectada para {muniNome(municipio)} em {ano}.</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          Alertas Gerados ({alertas.length})
        </h4>
        {alertas.length > 0 && <span style={{ fontSize: 11, color: 'var(--text3)' }}>Pág. {pagAtual}/{totalPaginas}</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {exibidos.map((a, i) => {
          const st = SEV[a.sev] || SEV.baixo;
          return (
            <div key={i} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, background: st.bg, color: st.color }}>{st.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: st.bg, color: st.color }}>{a.sev.toUpperCase()}</span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>ID: {a.id}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{a.titulo}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: a.detalhe ? 8 : 0 }}>{a.origem}</div>
                {a.detalhe && <div style={{ fontSize: 11, color: 'var(--text2)', background: 'var(--bg4)', padding: 8, borderRadius: 4, lineHeight: 1.6 }}>{a.detalhe}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 2 }}>Valor Auditado</div>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{a.val > 0 ? fmt(a.val) : 'N/A'}</div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: st.bg, color: st.color }}>{a.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {alertas.length > porPagina && <Paginacao pagina={pagAtual} totalPag={totalPaginas} onChange={p => setPag(p)} />}

      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginTop: 12 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Estatísticas de Irregularidades</h4>
        <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
          Cruzamento automático entre empenhos, notas fiscais e pagamentos do exercício {ano} para {muniNome(municipio)}.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 12 }}>
          {[{ val: fmt(bloqueado), label: 'Valores bloqueados', color: 'var(--text)' }, { val: alertas.length + '/' + (counts.alto + counts.medio + counts.baixo + counts.arquivo), label: 'Alertas exibidos', color: 'var(--green)' }, { val: counts.alto + counts.medio + counts.baixo + counts.arquivo, label: 'Total de empenhos', color: 'var(--blue)' }].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginTop: 12 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Metodologia de Detecção</h4>
        <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 12 }}>
          O sistema cruza dados de três fontes da API do TCE: Empenhos, Notas Fiscais e Pagamentos. As seguintes regras são aplicadas para gerar alertas automaticamente:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {METODOLOGIA_ALERTAS.map(m => {
            const st = SEV[m.sev];
            return (
              <div key={m.titulo} style={{ display: 'flex', gap: 12, background: 'var(--bg3)', padding: 12, borderRadius: 6 }}>
                <div style={{ fontSize: 14, color: st.color, paddingTop: 2 }}>{st.icon}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{m.titulo}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5, marginTop: 2 }}>{m.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
