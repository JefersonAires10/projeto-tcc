import React, { useEffect, useRef, useState } from 'react';
import { Chart } from 'chart.js/auto';
import { HammerIcon, LightningIcon, PushPinIcon, BuildingIcon, ClipboardIcon, CalendarBlankIcon, UserIcon, FileTextIcon, MagnifyingGlassIcon, WarningCircleIcon, PackageIcon, CoinIcon, TrophyIcon, SparkleIcon } from '@phosphor-icons/react';
import {
  getLicitacoes, getContrato, getLicitantes,
  getItensLicitacoes, getDotacoesLicitacoes, getContratados,
  getNotasEmpenhos,
  licParams, fmt, fmtBRL, fmtN, muniParams, fmtAno,
} from '../api';
import { KpiCard, Card, SectionHeader, StatusBadge, Avatar, Spinner, BtnOutline, PageSkeleton } from './UI';

const MODALIDADE_MAP = {
  '1': { nome: 'PREGÃO ELETRÔNICO', grupo: 'PREGÃO' },
  '2': { nome: 'CONCORRÊNCIA', grupo: 'OUTROS' },
  '3': { nome: 'TOMADA DE PREÇOS', grupo: 'OUTROS' },
  '4': { nome: 'CONVITE', grupo: 'OUTROS' },
  '5': { nome: 'CONCURSO', grupo: 'OUTROS' },
  '6': { nome: 'LEILÃO', grupo: 'OUTROS' },
  '7': { nome: 'DISPENSA', grupo: 'DISPENSA' },
  '8': { nome: 'INEXIGIBILIDADE', grupo: 'INEXIGIBILIDADE' },
  '9': { nome: 'PREGÃO PRESENCIAL', grupo: 'PREGÃO' },
  '10': { nome: 'REGIME DE EMPREITADA', grupo: 'OUTROS' },
  '11': { nome: 'SUPRIMENTO DE FUNDOS', grupo: 'OUTROS' },
};

const TIPO_DISPUTA_MAP = { 'A': 'ABERTA', 'F': 'FECHADA', 'E': 'ELETRÔNICA', 'P': 'PRESENCIAL' };
const TIPO_FORMA_MAP = {
  'A': 'ATA DE REGISTRO DE PREÇOS', 'E': 'EXECUÇÃO DIRETA',
  'I': 'INDIRETA', 'M': 'MISTA',
};
const TIPO_SRP_MAP = { 'S': 'SISTEMA DE REGISTRO DE PREÇOS', 'N': 'NÃO SE APLICA' };

const MODALIDADE_CONTRATO_MAP = {
  'PA': { nome: 'PRORROGAÇÃO AUTOMÁTICA', cor: 'var(--blue)' },
  'PE': { nome: 'PREGÃO ELETRÔNICO', cor: 'var(--purple)' },
  'DI': { nome: 'DISPENSA', cor: 'var(--amber)' },
  'IN': { nome: 'INEXIGIBILIDADE', cor: 'var(--red)' },
  'CC': { nome: 'CONCORRÊNCIA', cor: 'var(--cyan)' },
  'TP': { nome: 'TOMADA DE PREÇOS', cor: 'var(--text2)' },
};

const TIPO_CONTRATO_MAP = {
  'O': { nome: 'ORIGINAL', cor: 'var(--green)' },
  'A': { nome: 'ADITIVO', cor: 'var(--amber)' },
  'R': { nome: 'RERRATIFICAÇÃO', cor: 'var(--purple)' },
  'P': { nome: 'PRORROGAÇÃO', cor: 'var(--blue)' },
};

function statusFromLic(l) {
  const hoje = new Date();
  const fim = l.data_fim || l.data_homologacao || l.data_realizacao_autuacao_licitacao;
  if (l.status) {
    const s = String(l.status).toUpperCase();
    if (s.includes('CANCEL') || s.includes('ANUL')) return 'CANCELADA';
    if (s.includes('CONCLU') || s.includes('HOMOLOG') || s.includes('FINAL')) return 'CONCLUÍDA';
    if (s.includes('ABERT') || s.includes('ANDAMENT') || s.includes('PUBLIC')) return 'EM ABERTO';
  }
  if (fim && new Date(fim) < hoje) return 'CONCLUÍDA';
  if (l.data_inicio && new Date(l.data_inicio) <= hoje) return 'EM ABERTO';
  return 'EM ABERTO';
}

function normalizeLic(l) {
  if (!l) return l;
  const modCod = String(l.modalidade_licitacao ?? l.modalidade ?? '');
  const modInfo = MODALIDADE_MAP[modCod] || { nome: modCod || '–', grupo: 'OUTROS' };
  return {
    ...l,
    modalidade: modInfo.nome,
    modalidade_grupo: modInfo.grupo,
    nr_licitacao: l.numero_licitacao || l.nr_licitacao || '–',
    ds_objeto: l.descricao_objeto_licitacao || l.ds_objeto || l.objeto || l.descricao || '–',
    valor: parseFloat(l.valor_orcado_estimado ?? l.valor_estimado ?? l.valor ?? l.vl_licitacao ?? 0),
    status: statusFromLic(l),
    nm_orgao: l.nome_orgao_ata || l.nm_orgao || l.orgao || '–',
    nm_municipio: l.nm_municipio || '',
    data: l.data_homologacao || l.data_realizacao_autuacao_licitacao || l.data_criacao_comissao || l.data || l.dt_licitacao || '',
    data_inicio: l.data_inicio || l.data_criacao_comissao || '',
    data_fim: l.data_fim || '',
    data_homologacao: l.data_homologacao || '',
    data_autuacao: l.data_realizacao_autuacao_licitacao || '',
    data_comissao: l.data_criacao_comissao || '',
    data_edital: l.data_emissao_edital || '',
    data_realizacao: l.data_realizacao_licitacao || '',
    responsaveis: [
      { papel: 'RESP. COTAÇÃO', nome: l.nome_resp_cotacao, cpf: l.cpf_resp_cotacao },
      { papel: 'RESP. TERMO REF.', nome: l.nome_resp_termo_referencia, cpf: l.cpf_resp_termo_referencia },
      { papel: 'RESP. HOMOLOGAÇÃO', nome: l.nome_responsavel_homologacao, cpf: l.cpf_responsavel_homologacao },
      { papel: 'RESP. JURÍDICO', nome: l.nome_responsavel_juridico, cpf: l.cpf_responsavel_juridico },
      { papel: 'GESTOR', nome: '', cpf: l.cpf_gestor },
    ].filter(r => r.nome || r.cpf),
    comissao: l.numero_comissao || '',
    fundamentacao_legal: l.descricao_fundamentacao_legal || '',
    justificativa_preco: l.descricao_justificativa_preco || '',
    motivo_fornecedor: l.descricao_motivo_fornecedor || '',
    plataforma: l.descricao_url_plataforma_contratacao || '',
    tipo_disputa: TIPO_DISPUTA_MAP[l.tipo_disputa] || l.tipo_disputa || '',
    tipo_forma: TIPO_FORMA_MAP[l.tipo_forma_contratacao] || l.tipo_forma_contratacao || '',
    tipo_srp: TIPO_SRP_MAP[l.tipo_sistema_registro_precos] || l.tipo_sistema_registro_precos || '',
    valor_limite_superior: parseFloat(l.valor_limite_superior ?? 0),
    ata_pncp: l.numero_id_ata_pncp?.trim() || '',
    contratacao_pncp: l.numero_id_contratacao_pncp?.trim() || '',
    modalidade_processo: l.modalidade_processo_administrativo || '',
  };
}

function stVariant(s) {
  const st = (s || '').toUpperCase();
  if (st.includes('CONCLU')) return 'ok';
  if (st.includes('ABERTO')) return 'aberto';
  if (st.includes('CANCEL')) return 'cancelado';
  return 'alerta';
}

function modStyle(lic) {
  const g = (lic.modalidade_grupo || lic.modalidade || '').toUpperCase();
  if (g.includes('PREG')) return { bg: 'var(--purple-bg)', color: 'var(--purple)', icon: HammerIcon };
  if (g.includes('DISP')) return { bg: 'var(--amber-bg)', color: 'var(--amber)', icon: LightningIcon };
  if (g.includes('INEXIG')) return { bg: 'var(--red-bg)', color: 'var(--red)', icon: PushPinIcon };
  if (g.includes('CONCOR')) return { bg: 'var(--cyan)', color: 'var(--cyan)', icon: BuildingIcon };
  return { bg: 'var(--blue-bg)', color: 'var(--blue)', icon: ClipboardIcon };
}

const ModIcon = ({ lic, size }) => {
  const Icon = modStyle(lic).icon;
  return <Icon size={size || 18} />;
};

function normalizeContrato(c) {
  const modKey = (c.modalide_contrato || '').toUpperCase();
  const modInfo = MODALIDADE_CONTRATO_MAP[modKey] || { nome: modKey || '–', cor: 'var(--text2)' };
  const tipKey = (c.tipo_contrato || '').toUpperCase();
  const tipInfo = TIPO_CONTRATO_MAP[tipKey] || { nome: tipKey || '–', cor: 'var(--text2)' };

  const hoje = new Date();
  const fimVig = c.data_fim_vigencia_contrato;
  const iniVig = c.data_inicio_vigencia_contrato;
  let statusCont = 'ATIVO';
  if (fimVig && new Date(fimVig) < hoje) statusCont = 'ENCERRADO';
  else if (iniVig && new Date(iniVig) > hoje) statusCont = 'PREVISTO';

  return {
    ...c,
    modalidade_contrato_nome: modInfo.nome,
    modalidade_contrato_cor: modInfo.cor,
    tipo_contrato_nome: tipInfo.nome,
    tipo_contrato_cor: tipInfo.cor,
    nr_contrato: c.numero_contrato || '–',
    ds_objeto: c.descricao_objeto_contrato || '–',
    valor: parseFloat(c.valor_total_contrato ?? 0),
    status: statusCont,
    data_assinatura: c.data_contrato || '',
    data_inicio_vigencia: c.data_inicio_vigencia_contrato || '',
    data_fim_vigencia: c.data_fim_vigencia_contrato || '',
    data_autuacao: c.data_autuacao_processo_adm || '',
    fiscal: { nome: c.nome_fiscal_contrato || '', cpf: c.cpf_fiscal_contrato || '' },
    gestor: { nome: '', cpf: c.cpf_gestor || '' },
    gestor_original: { nome: '', cpf: c.cpf_gestor_original || '' },
    processo_adm: c.numero_processo_adm || '',
    nr_original: c.numero_contrato_original || '',
    data_original: c.data_contrato_original || '',
    pncp: c.numero_id_contrato_pncp?.trim() || '',
  };
}

function contratoVariant(s) {
  if (s === 'ATIVO') return 'ok';
  if (s === 'ENCERRADO') return 'cancelado';
  return 'alerta';
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

function LicRow({ lic, onClick }) {
  const [hov, setHov] = useState(false);
  const mod = modStyle(lic);
  const val = lic.valor;
  return (
    <div onClick={() => onClick(lic)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? 'var(--bg3)' : 'var(--bg2)', border: `1px solid ${hov ? 'var(--border2)' : 'var(--border)'}`, borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', transition: 'all .12s', transform: hov ? 'translateX(2px)' : 'none' }}>
      <div style={{ width: 36, height: 36, borderRadius: 6, background: mod.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}><ModIcon lic={lic} size={16} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: .8, padding: '2px 6px', borderRadius: 4, background: mod.bg, color: mod.color }}>{lic.modalidade?.substring(0, 10) || '–'}</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>Nº {lic.nr_licitacao}</span>
          {lic.nm_municipio && <span style={{ fontSize: 10, color: 'var(--text3)' }}>· {lic.nm_municipio}</span>}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.35, marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {lic.ds_objeto}
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span><BuildingIcon size={14} /> {lic.nm_orgao}</span>
          <span><CalendarBlankIcon size={14} /> {lic.data || '–'}</span>
          {lic.fundamentacao_legal && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--blue)' }}>{lic.fundamentacao_legal}</span>}
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        {val > 0 && <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{fmt(val)}</div>}
        <StatusBadge variant={stVariant(lic.status)}>{lic.status}</StatusBadge>
        <span style={{ fontSize: 10, color: hov ? 'var(--blue)' : 'var(--text3)', transition: 'color .15s' }}>{hov ? 'Ver detalhes →' : '→'}</span>
      </div>
    </div>
  );
}

function ContratoRow({ contrato, onClick }) {
  const [hov, setHov] = useState(false);
  const val = contrato.valor;
  const modCor = contrato.modalidade_contrato_cor;
  const tipCor = contrato.tipo_contrato_cor;

  return (
    <div onClick={() => onClick(contrato)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? 'var(--bg3)' : 'var(--bg2)', border: `1px solid ${hov ? 'var(--border2)' : 'var(--border)'}`, borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', transition: 'all .12s', transform: hov ? 'translateX(2px)' : 'none' }}>
      <div style={{ width: 36, height: 36, borderRadius: 6, background: `${modCor}20`, color: modCor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}><FileTextIcon size={16} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: .8, padding: '2px 6px', borderRadius: 4, background: `${modCor}20`, color: modCor }}>{contrato.modalidade_contrato_nome}</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: .5, padding: '2px 6px', borderRadius: 4, background: `${tipCor}20`, color: tipCor }}>{contrato.tipo_contrato_nome}</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{contrato.nr_contrato}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.35, marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {contrato.ds_objeto}
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span><CalendarBlankIcon size={14} /> {contrato.data_assinatura ? new Date(contrato.data_assinatura).toLocaleDateString('pt-BR') : '–'}</span>
          {contrato.processo_adm && <span style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>Proc: {contrato.processo_adm}</span>}
          {contrato.fiscal.nome && <span><UserIcon size={14} /> {contrato.fiscal.nome}</span>}
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        {val > 0 && <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{fmt(val)}</div>}
        <StatusBadge variant={contratoVariant(contrato.status)}>{contrato.status}</StatusBadge>
        <span style={{ fontSize: 10, color: hov ? 'var(--blue)' : 'var(--text3)', transition: 'color .15s' }}>{hov ? 'Ver detalhes →' : '→'}</span>
      </div>
    </div>
  );
}

function ContratoDetail({ contrato, onBack }) {
  const val = contrato.valor;
  const modCor = contrato.modalidade_contrato_cor;

  const infoRows = [
    { label: 'Nº Contrato', value: contrato.nr_contrato, mono: true },
    { label: 'Modalidade', value: contrato.modalidade_contrato_nome },
    { label: 'Tipo', value: contrato.tipo_contrato_nome },
    { label: 'Valor Total', value: val > 0 ? fmtBRL(val) : '–', mono: true, destaque: true },
    { label: 'Processo Adm.', value: contrato.processo_adm || '–', mono: true },
    { label: 'Contrato Original', value: contrato.nr_original || '–', mono: true },
    { label: 'Data Original', value: contrato.data_original ? new Date(contrato.data_original).toLocaleDateString('pt-BR') : '–' },
    { label: 'Autuação', value: contrato.data_autuacao ? new Date(contrato.data_autuacao).toLocaleDateString('pt-BR') : '–' },
    { label: 'PNCP', value: contrato.pncp || '–', mono: true },
  ];

  return (
    <div style={{ animation: 'slideIn .2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>← Voltar</button>
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>/</span>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>Contrato {contrato.nr_contrato}</span>
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderLeft: `3px solid ${modCor}`, borderRadius: 8, padding: 20, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: .8, padding: '3px 8px', borderRadius: 4, background: `${modCor}20`, color: modCor }}>{contrato.modalidade_contrato_nome}</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: `${contrato.tipo_contrato_cor}20`, color: contrato.tipo_contrato_cor }}>{contrato.tipo_contrato_nome}</span>
          <StatusBadge variant={contratoVariant(contrato.status)}>{contrato.status}</StatusBadge>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{contrato.nr_contrato}</span>
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 14 }}>{contrato.ds_objeto}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14 }}>
          {[
            ['Valor Total', val > 0 ? fmtBRL(val) : '–', true],
            ['Assinatura', contrato.data_assinatura ? new Date(contrato.data_assinatura).toLocaleDateString('pt-BR') : '–'],
            ['Início Vigência', contrato.data_inicio_vigencia ? new Date(contrato.data_inicio_vigencia).toLocaleDateString('pt-BR') : '–'],
            ['Fim Vigência', contrato.data_fim_vigencia ? new Date(contrato.data_fim_vigencia).toLocaleDateString('pt-BR') : '–'],
          ].map(([l, v, mono], i) => (
            <div key={i}>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontFamily: mono ? 'var(--mono)' : undefined, fontWeight: mono ? 600 : 400 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}><ClipboardIcon size={18} /> Dados do Contrato</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
          {infoRows.map(r => (
            <div key={r.label} style={{ background: 'var(--bg3)', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>{r.label}</div>
              <div style={{ fontSize: 13, color: r.destaque ? 'var(--green)' : 'var(--text)', fontFamily: r.mono ? 'var(--mono)' : undefined, fontWeight: r.destaque ? 700 : 400 }}>{r.value}</div>
            </div>
          ))}
        </div>
      </div>

      {(contrato.fiscal.nome || contrato.gestor.cpf) && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}><UserIcon size={18} /> Responsáveis</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {contrato.fiscal.nome && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--bg3)', borderRadius: 6, padding: '10px 12px', flex: 1, minWidth: 200 }}>
                <Avatar name={contrato.fiscal.nome} size={36} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{contrato.fiscal.nome}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5 }}>FISCAL DO CONTRATO</div>
                  {contrato.fiscal.cpf && <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', opacity: .6 }}>CPF: {contrato.fiscal.cpf.substring(0, 4)}****</div>}
                </div>
              </div>
            )}
            {contrato.gestor.cpf && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--bg3)', borderRadius: 6, padding: '10px 12px', flex: 1, minWidth: 200 }}>
                <Avatar name={contrato.gestor.nome || 'G'} size={36} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{contrato.gestor.nome || 'Gestor'}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5 }}>GESTOR DO CONTRATO</div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', opacity: .6 }}>CPF: {contrato.gestor.cpf.substring(0, 4)}****</div>
                </div>
              </div>
            )}
            {contrato.gestor_original.cpf && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--bg3)', borderRadius: 6, padding: '10px 12px', flex: 1, minWidth: 200 }}>
                <Avatar name={contrato.gestor_original.nome || 'GO'} size={36} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{contrato.gestor_original.nome || 'Gestor Original'}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5 }}>GESTOR ORIGINAL</div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', opacity: .6 }}>CPF: {contrato.gestor_original.cpf.substring(0, 4)}****</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(contrato.data_inicio_vigencia || contrato.data_fim_vigencia) && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}><CalendarBlankIcon size={18} /> Vigência</div>
          <div style={{ position: 'relative', height: 40, margin: '0 10px' }}>
            <div style={{ position: 'absolute', top: 16, left: 0, right: 0, height: 6, background: 'var(--bg4)', borderRadius: 3 }}>
              <div style={{ height: '100%', borderRadius: 3, background: contrato.status === 'ATIVO' ? 'var(--green)' : 'var(--text3)', width: '100%', opacity: .5 }} />
            </div>
            {contrato.data_inicio_vigencia && (
              <div style={{ position: 'absolute', top: 0, left: 0, textAlign: 'center' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--green)', margin: '0 auto 4px' }} />
                <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{new Date(contrato.data_inicio_vigencia).toLocaleDateString('pt-BR')}</div>
                <div style={{ fontSize: 9, color: 'var(--text3)' }}>Início</div>
              </div>
            )}
            {contrato.data_fim_vigencia && (
              <div style={{ position: 'absolute', top: 0, right: 0, textAlign: 'center' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: contrato.status === 'ATIVO' ? 'var(--blue)' : 'var(--red)', margin: '0 auto 4px' }} />
                <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{new Date(contrato.data_fim_vigencia).toLocaleDateString('pt-BR')}</div>
                <div style={{ fontSize: 9, color: 'var(--text3)' }}>Término</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: '12px 16px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text3)' }}>
        <MagnifyingGlassIcon size={14} /> Dados via TCE-CE <code style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 10 }}>/sim/contratos</code> — {new Date().toLocaleDateString('pt-BR')}
      </div>
    </div>
  );
}

function LicitacaoDetail({ lic, municipio, onBack }) {
  const [itens, setItens] = useState(null);
  const [licitantes, setLicit] = useState(null);

  const [empenhos, setEmp] = useState(null);

  const [dotacoes, setDot] = useState(null);
  const [contratados, setContrat] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [abas, setAbas] = useState('dados');

  const val = lic.valor;
  const mod = modStyle(lic);

  useEffect(() => {
    const p = muniParams(municipio || lic.codigo_municipio);
    const anoLic = (lic.data || '').substring(0, 4) || new Date().getFullYear();

    const pDatas = {
      ...p,
      data_inicio: `${anoLic}-01-01`,
      data_fim: `${anoLic}-12-31`
    };

    const pContrato = { ...pDatas };
    const pDotacoesContratados = { ...pDatas };
    const pItensLicitantes = {
      ...pDatas,
      data_realizacao_licitacao: (lic.data_realizacao || lic.data_autuacao || lic.data || `${anoLic}-01-01`).substring(0, 10) + 'T00:00:00'
    };

    const pEmpenhos = {
      ...muniParams(municipio || lic.codigo_municipio),
      exercicio_orcamento: fmtAno(anoLic)
    };

    Promise.all([
      getItensLicitacoes(pItensLicitantes), getLicitantes(pItensLicitantes),
      getDotacoesLicitacoes(pDotacoesContratados), getContratados(pDotacoesContratados),
      getNotasEmpenhos(pEmpenhos),
    ]).then(([itData, ltData, dotData, contatData, empData]) => {
      const it = itData?.elements || itData || [];
      const lt = ltData?.elements || ltData || [];
      const dot = dotData?.elements || dotData || [];
      const contat = contatData?.elements || contatData || [];
      const emp = empData?.elements || empData || [];

      setItens(Array.isArray(it) ? it : []);
      setLicit(Array.isArray(lt) ? lt : []);
      setDot(Array.isArray(dot) ? dot : []);
      setContrat(Array.isArray(contat) ? contat : []);
      setEmp(Array.isArray(emp) ? emp : []);

      const flags = [];
      if (lt.length === 1) flags.push({ sev: 'alto', msg: 'Apenas 1 licitante — processo sem competição real.' });
      setAlerts(flags);
    });
  }, [lic, municipio]);

  const dates = [
    { label: 'Criação da Comissão', data: lic.data_comissao },
    { label: 'Publicação do Edital', data: lic.data_edital },
    { label: 'Autuação', data: lic.data_autuacao },
    { label: 'Realização', data: lic.data_realizacao },
    { label: 'Homologação', data: lic.data_homologacao },
    { label: 'Início Vigência', data: lic.data_inicio },
    { label: 'Fim Vigência', data: lic.data_fim },
  ].filter(d => d.data);

  const infoRows = [
    { label: 'Nº Licitação', value: lic.nr_licitacao, mono: true },
    { label: 'Modalidade', value: lic.modalidade },
    { label: 'Valor Estimado', value: val > 0 ? fmtBRL(val) : '–', mono: true, destaque: true },
    { label: 'Valor Limite Superior', value: lic.valor_limite_superior > 0 ? fmtBRL(lic.valor_limite_superior) : '–', mono: true },
    { label: 'Tipo de Disputa', value: lic.tipo_disputa || '–' },
    { label: 'Forma de Contratação', value: lic.tipo_forma || '–' },
    { label: 'Registro de Preços', value: lic.tipo_srp || '–' },
    { label: 'Comissão', value: lic.comissao || '–' },
    { label: 'Plataforma', value: lic.plataforma || '–' },
    { label: 'ATA PNCP', value: lic.ata_pncp || '–', mono: true },
    { label: 'Contratação PNCP', value: lic.contratacao_pncp || '–', mono: true },
    { label: 'Processo Adm.', value: lic.modalidade_processo || '–' },
  ];

  const sectionStyle = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 12 };

  return (
    <div style={{ animation: 'slideIn .2s ease' }}>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>← Voltar</button>
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>/</span>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>Licitação {lic.nr_licitacao}</span>
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--blue)', borderRadius: 8, padding: 20, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: .8, padding: '3px 8px', borderRadius: 4, background: mod.bg, color: mod.color }}>{lic.modalidade}</span>
          <StatusBadge variant={stVariant(lic.status)}>{lic.status}</StatusBadge>
          {alerts.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: 'var(--red-bg)', color: 'var(--red)' }}><WarningCircleIcon size={14} /> {alerts.length} ALERTA(S)</span>}
          <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>Nº {lic.nr_licitacao}</span>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, marginBottom: 14 }}>{lic.ds_objeto}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14 }}>
          {[['Valor Estimado', val > 0 ? fmtBRL(val) : '–', true], ['Homologação', lic.data_homologacao || '–'], ['Autuação', lic.data_autuacao || '–'], ['Órgão', lic.nm_orgao]].map(([l, v, mono], i) => (
            <div key={i}>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontFamily: mono ? 'var(--mono)' : undefined, fontWeight: mono ? 600 : 400 }}>{v || '–'}</div>
            </div>
          ))}
        </div>
      </div>

      {alerts.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, background: 'var(--red-bg)', border: '1px solid rgba(248,81,73,.3)', borderRadius: 6, padding: '10px 12px', marginBottom: 6 }}>
              <span style={{ color: 'var(--red)', fontSize: 14 }}><WarningCircleIcon size={14} /></span>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}><strong style={{ color: 'var(--red)' }}>{a.sev.toUpperCase()}: </strong>{a.msg}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {[
          { key: 'dados', label: 'Dados Gerais' },
          { key: 'cronograma', label: 'Cronograma' },
          { key: 'responsaveis', label: 'Responsáveis' },
          { key: 'justificativas', label: 'Justificativas' },
          { key: 'itens', label: 'Itens' },

          { key: 'dotacao', label: 'Dotação' },
          { key: 'empresas', label: 'Empresas' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setAbas(tab.key)}
            style={{ background: abas === tab.key ? 'var(--blue-bg)' : 'var(--bg3)', border: `1px solid ${abas === tab.key ? 'var(--blue)' : 'var(--border)'}`, color: abas === tab.key ? 'var(--blue)' : 'var(--text2)', padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .1s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {abas === 'dados' && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}><ClipboardIcon size={18} /> Informações da Licitação</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
            {infoRows.map(r => (
              <div key={r.label} style={{ background: 'var(--bg3)', borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: 13, color: r.destaque ? 'var(--green)' : 'var(--text)', fontFamily: r.mono ? 'var(--mono)' : undefined, fontWeight: r.destaque ? 700 : 400 }}>{r.value}</div>
              </div>
            ))}
          </div>
          {lic.fundamentacao_legal && (
            <div style={{ marginTop: 14, background: 'var(--bg3)', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>Fundamentação Legal</div>
              <div style={{ fontSize: 12, color: 'var(--blue)', fontFamily: 'var(--mono)' }}>{lic.fundamentacao_legal}</div>
            </div>
          )}
        </div>
      )}

      {abas === 'cronograma' && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}><CalendarBlankIcon size={18} /> Cronograma do Processo</div>
          {dates.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Nenhuma data registrada.</div>}
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            {dates.map((d, i) => (
              <div key={i} style={{ position: 'relative', paddingBottom: 16, paddingLeft: 20, borderLeft: i < dates.length - 1 ? '2px solid var(--border)' : 'none' }}>
                <div style={{ position: 'absolute', left: -7, top: 2, width: 12, height: 12, borderRadius: '50%', background: d.data ? 'var(--blue)' : 'var(--bg4)', border: '2px solid var(--bg2)' }} />
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>{d.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--text)' }}>{d.data ? new Date(d.data).toLocaleDateString('pt-BR') : '–'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {abas === 'responsaveis' && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}><UserIcon size={18} /> Responsáveis pelo Processo</div>
          {lic.responsaveis.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Nenhum responsável registrado.</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 10 }}>
            {lic.responsaveis.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--bg3)', borderRadius: 6, padding: '12px' }}>
                <Avatar name={r.nome || '?'} size={40} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.nome || 'Não informado'}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 2 }}>{r.papel}</div>
                  {r.cpf && <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', opacity: .6 }}>CPF: {r.cpf.substring(0, 4)}****</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {abas === 'justificativas' && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}><FileTextIcon size={18} /> Justificativas do Processo</div>
          {lic.justificativa_preco && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>Justificativa de Preço</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, background: 'var(--bg3)', borderRadius: 6, padding: 12 }}>{lic.justificativa_preco}</div>
            </div>
          )}
          {lic.motivo_fornecedor && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>Motivo da Escolha do Fornecedor</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, background: 'var(--bg3)', borderRadius: 6, padding: 12 }}>{lic.motivo_fornecedor}</div>
            </div>
          )}
          {!lic.justificativa_preco && !lic.motivo_fornecedor && (
            <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Nenhuma justificativa registrada.</div>
          )}
        </div>
      )}

      {abas === 'itens' && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}><PackageIcon size={18} /> Itens da Licitação</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}><code style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 10 }}>/sim/itens_compoem_bens_servicos</code></div>
          {itens === null ? <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Consultando API...</div>
            : itens.length ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr>{['Item', 'Descrição', 'Unidade', 'Qtd', 'Valor Unit.', 'Valor Total'].map((h, i) => (
                    <th key={h} style={{ color: 'var(--text3)', fontWeight: 600, textAlign: i < 2 ? 'left' : 'right', padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}</tr></thead>
                  <tbody>{itens.slice(0, 20).map((item, i) => {
                    const vUnit = parseFloat(item.valor_unitario_item_licitacao || 0);
                    const vTotal = parseFloat(item.valor_vencedor_item_licitacao || 0);
                    return (
                      <tr key={i} onMouseEnter={ev => ev.currentTarget.style.background = 'var(--bg3)'} onMouseLeave={ev => ev.currentTarget.style.background = ''}>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', color: 'var(--text2)', fontSize: 11 }}>{item.numero_sequencial_item_licitacao || i + 1}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>{item.descricao_item_licitacao || '–'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'right', color: 'var(--text3)', fontSize: 11 }}>{item.descricao_unidade_item_licitacao || '–'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--text)' }}>{item.numero_quantidade_item_licitacao || '–'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--text)' }}>{vUnit > 0 ? fmtBRL(vUnit) : '–'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text)' }}>{vTotal > 0 ? fmtBRL(vTotal) : '–'}</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            ) : <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Nenhum item cadastrado.</div>}
        </div>
      )}

      {abas === 'dotacao' && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}><CoinIcon size={18} /> Dotação Orçamentária</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}><code style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 10 }}>/sim/dotacoes_utilizadas_contratacoes</code></div>
          {dotacoes === null ? <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Consultando API...</div>
            : dotacoes.length ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr>{['Elemento', 'Fonte / Função / Subfunção', 'Valor'].map((h, i) => (
                    <th key={h} style={{ color: 'var(--text3)', fontWeight: 600, textAlign: i < 2 ? 'left' : 'right', padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}</tr></thead>
                  <tbody>{dotacoes.slice(0, 15).map((d, i) => {
                    const v = parseFloat(d.valor_dotacao_doc || 0);
                    return (
                      <tr key={i} onMouseEnter={ev => ev.currentTarget.style.background = 'var(--bg3)'} onMouseLeave={ev => ev.currentTarget.style.background = ''}>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 11 }}>{d.codigo_elemento_despesa || '–'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text)', fontSize: 11 }}>
                          Fonte: {d.codigo_fonte || '–'} | Função: {d.codigo_funcao || '–'} | Sub: {d.codigo_subfuncao || '–'}
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text)' }}>{v > 0 ? fmtBRL(v) : '–'}</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            ) : <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Nenhuma dotação registrada.</div>}
        </div>
      )}



      {abas === 'empresas' && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}><BuildingIcon size={18} /> Empresas Participantes</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}><code style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 10 }}>/sim/licitantes_fornecedores_bens_servicos</code></div>
          {licitantes === null ? <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Consultando API...</div>
            : licitantes.length ? licitantes.slice(0, 10).map((l, i) => {
              return (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 6 }}>
                  <BuildingIcon size={18} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {l.nome_negociante || '–'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{l.numero_documento_negociante || '–'}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{l.nome_municipio_negociante}{l.codigo_uf ? `/${l.codigo_uf}` : ''}</div>
                  </div>
                </div>
              );
            }) : <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Nenhum licitante registrado na API.</div>}
        </div>
      )}

      <div style={{ padding: '12px 16px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text3)' }}>
        <MagnifyingGlassIcon size={14} /> Dados via TCE-CE <code style={{ fontFamily: 'var(--mono)', color: 'var(--blue)', fontSize: 10 }}>/sim/</code> — {new Date().toLocaleDateString('pt-BR')}
      </div>
    </div>
  );
}

export default function F2({ municipio, ano }) {
  const [lics, setLics] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [total, setTotal] = useState(0);
  const [nContr, setNC] = useState(0);
  const [loading, setLoad] = useState(true);
  const [selected, setSel] = useState(null);
  const [selectedContrato, setSelContrato] = useState(null);
  const [abaVisao, setAbaVisao] = useState('licitacoes');
  const [filtros, setFiltros] = useState({ modalidade: '', status: '', busca: '' });
  const [pagina, setPag] = useState(1);
  const [showAnalise, setShowAnalise] = useState(false);
  const porPagina = 8;
  const porPaginaContrato = 15;
  const chartRef = useRef(null);
  const chartInst = useRef(null);

  useEffect(() => {
    async function load() {
      setLoad(true); setSel(null); setSelContrato(null); setPag(1);
      const params = licParams(municipio, ano);
      const [licDataRaw, contDataRaw] = await Promise.all([
        getLicitacoes(params),
        getContrato(params)
      ]);
      const licData = licDataRaw?.elements || licDataRaw || [];
      const contData = contDataRaw?.elements || contDataRaw || [];
      const lista = (Array.isArray(licData) ? licData : []).map(normalizeLic);
      const listaC = (Array.isArray(contData) ? contData : []).map(normalizeContrato);
      let tv = 0;
      lista.forEach(l => tv += l.valor);
      setLics(lista);
      setContratos(listaC);
      setTotal(tv);
      setNC(listaC.length);
      setLoad(false);
    }
    load();
  }, [municipio, ano]);

  useEffect(() => {
    if (loading || !chartRef.current || selected || selectedContrato || abaVisao === 'contratos') return;
    if (chartInst.current) chartInst.current.destroy();
    const top5 = [...lics].sort((a, b) => b.valor - a.valor).slice(0, 5);
    const totalVal = lics.reduce((s, l) => s + l.valor, 0) || 1;
    if (top5.length === 0) return;
    chartInst.current = new Chart(chartRef.current, {
      type: 'doughnut',
      data: { labels: top5.map(f => f.nr_licitacao), datasets: [{ data: top5.map(f => (f.valor / totalVal) * 100), backgroundColor: ['#58a6ff', '#3fb950', '#bc8cff', '#d29922', '#6e7681'], borderColor: '#161b22', borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: i => `${top5[i.dataIndex]?.nr_licitacao}: ${i.raw.toFixed(1)}%` } } } },
    });
    return () => chartInst.current?.destroy();
  }, [loading, selected, selectedContrato, abaVisao, lics]);

  if (loading) return <PageSkeleton kpis={3} layout="2fr-1fr" />;
  if (selected) return <LicitacaoDetail lic={selected} municipio={municipio} onBack={() => setSel(null)} />;
  if (selectedContrato) return <ContratoDetail contrato={selectedContrato} onBack={() => setSelContrato(null)} />;

  const filtradasLic = lics.filter(l => {
    const mod = filtros.modalidade ? (l.modalidade_grupo || '').toUpperCase().includes(filtros.modalidade.toUpperCase()) : true;
    const st = filtros.status ? l.status.toUpperCase().includes(filtros.status.toUpperCase()) : true;
    const bsc = filtros.busca ? l.ds_objeto.toLowerCase().includes(filtros.busca.toLowerCase()) : true;
    return mod && st && bsc;
  });

  const filtradasCont = contratos.filter(c => {
    const st = filtros.status ? c.status.toUpperCase().includes(filtros.status.toUpperCase()) : true;
    const bsc = filtros.busca ? c.ds_objeto.toLowerCase().includes(filtros.busca.toLowerCase())
      || c.nr_contrato.toLowerCase().includes(filtros.busca.toLowerCase())
      || c.processo_adm.toLowerCase().includes(filtros.busca.toLowerCase()) : true;
    return st && bsc;
  });

  const isLicView = abaVisao === 'licitacoes';
  const dadosFiltrados = isLicView ? filtradasLic : filtradasCont;
  const pp = isLicView ? porPagina : porPaginaContrato;
  const totalPaginas = Math.max(1, Math.ceil(dadosFiltrados.length / pp));
  const pagAtual = pagina > totalPaginas ? totalPaginas : pagina;
  const exibidas = dadosFiltrados.slice((pagAtual - 1) * pp, pagAtual * pp);

  const licsOrdenadas = [...lics].sort((a, b) => b.valor - a.valor);
  const concTop5 = lics.length > 0
    ? ((licsOrdenadas.slice(0, 5).reduce((s, l) => s + l.valor, 0) / (total || 1)) * 100).toFixed(0) : '0';

  const totalContratosValor = contratos.reduce((s, c) => s + c.valor, 0);
  const ativos = contratos.filter(c => c.status === 'ATIVO').length;
  const encerrados = contratos.filter(c => c.status === 'ENCERRADO').length;

  const valorOriginais = contratos.filter(c => c.tipo_contrato_nome === 'ORIGINAL').reduce((acc, c) => acc + c.valor, 0);
  const valorAditivos = contratos.filter(c => c.tipo_contrato_nome === 'ADITIVO').reduce((acc, c) => acc + c.valor, 0);
  const pctAditivos = valorOriginais > 0 ? ((valorAditivos / valorOriginais) * 100).toFixed(1) : 0;
  const alertaAditivos = parseFloat(pctAditivos) > 25;
  const valorDireta = lics.filter(l => l.modalidade_grupo === 'DISPENSA' || l.modalidade_grupo === 'INEXIGIBILIDADE').reduce((acc, l) => acc + l.valor, 0);
  const pctDireta = total > 0 ? ((valorDireta / total) * 100).toFixed(1) : 0;
  const alertaDireta = parseFloat(pctDireta) > 20;
  const licsCanceladas = lics.filter(l => l.status === 'CANCELADA').length;
  const pctCanceladas = lics.length > 0 ? ((licsCanceladas / lics.length) * 100).toFixed(1) : 0;
  const alertaCanceladas = parseFloat(pctCanceladas) > 15;

  return (
    <div>
      <SectionHeader title="Monitor de Licitações e Contratos"
        sub={isLicView
          ? `/sim/processos_administrativos_contratacoes?data_inicio=${ano}-01-01&data_fim=${ano}-12-31&codigo_municipio=${municipio}`
          : `/sim/contratos?data_inicio=${ano}-01-01&data_fim=${ano}-12-31&codigo_municipio=${municipio} — ${contratos.length} contratos no ano`} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Total em Licitações" badge={ano} badgeClass="anual" value={fmt(total)} sub={`${lics.length} processos`} />
        <KpiCard label="Contratos" badge={abaVisao === 'contratos' ? 'Ativos' : 'Vigentes'}
          badgeClass={abaVisao === 'contratos' ? 'efetuado' : 'anual'}
          value={fmtN(nContr)}
          delta={abaVisao === 'contratos' ? `${ativos} ativos · ${encerrados} encerrados` : `R$ ${totalContratosValor.toFixed(0)} em contratos`} />
        <KpiCard label={isLicView ? 'Concentração Top 5' : 'Contratos Ativos'}
          badge={isLicView ? 'Alerta' : 'Efetuado'}
          badgeClass={isLicView ? 'alerta' : 'efetuado'}
          value={isLicView ? `${concTop5}%` : fmtN(ativos)}
          sub={isLicView ? 'dos valores totais' : `${encerrados} encerrados`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            <button onClick={() => { setAbaVisao('licitacoes'); setPag(1); setFiltros({ modalidade: '', status: '', busca: '' }); }}
              style={{ flex: 1, padding: '8px 0', background: isLicView ? 'var(--blue-bg)' : 'var(--bg3)', border: `1px solid ${isLicView ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 6, color: isLicView ? 'var(--blue)' : 'var(--text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
              <ClipboardIcon size={14} /> Licitações ({lics.length})
            </button>
            <button onClick={() => { setAbaVisao('contratos'); setPag(1); setFiltros({ modalidade: '', status: '', busca: '' }); }}
              style={{ flex: 1, padding: '8px 0', background: !isLicView ? 'var(--blue-bg)' : 'var(--bg3)', border: `1px solid ${!isLicView ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 6, color: !isLicView ? 'var(--blue)' : 'var(--text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
              <FileTextIcon size={14} /> Contratos ({contratos.length})
            </button>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
            {isLicView ? 'Processos Administrativos' : 'Contratos'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>
            {isLicView ? 'Clique para explorar detalhes completos' : `Exibindo ${porPaginaContrato} por página — clique para detalhar`}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            {isLicView && (
              <select value={filtros.modalidade} onChange={e => { setFiltros(f => ({ ...f, modalidade: e.target.value })); setPag(1); }}
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font)', cursor: 'pointer' }}>
                <option value="">Todas modalidades</option>
                <option value="PREGÃO">Pregão</option><option value="DISPENSA">Dispensa</option>
                <option value="INEXIGIBILIDADE">Inexigibilidade</option>
                <option value="CONCORRÊNCIA">Concorrência</option><option value="OUTROS">Outras</option>
              </select>
            )}
            <select value={filtros.status} onChange={e => { setFiltros(f => ({ ...f, status: e.target.value })); setPag(1); }}
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font)', cursor: 'pointer' }}>
              <option value="">Qualquer status</option>
              {isLicView ? (
                <><option value="CONCLUÍDA">Concluída</option><option value="EM ABERTO">Em Aberto</option><option value="CANCELADA">Cancelada</option></>
              ) : (
                <><option value="ATIVO">Ativo</option><option value="ENCERRADO">Encerrado</option><option value="PREVISTO">Previsto</option></>
              )}
            </select>
            <input type="search" placeholder={isLicView ? 'Buscar objeto...' : 'Buscar nº/objeto/proc...'} value={filtros.busca}
              onChange={e => { setFiltros(f => ({ ...f, busca: e.target.value })); setPag(1); }}
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font)', width: 180 }} />
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>{dadosFiltrados.length} resultados · pág {pagAtual}/{totalPaginas}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {exibidas.length > 0 ? exibidas.map((item, i) =>
              isLicView
                ? <LicRow key={item.nr_licitacao + i} lic={item} onClick={setSel} />
                : <ContratoRow key={item.nr_contrato + i} contrato={item} onClick={setSelContrato} />
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: 20 }}>
                Nenhum {isLicView ? 'processo' : 'contrato'} encontrado.
              </div>
            )}
          </div>
          <Paginacao pagina={pagAtual} totalPag={totalPaginas} onChange={p => setPag(p)} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isLicView ? (
            <Card title="Concentração por Valor" sub="Top 5 processos">
              <div style={{ position: 'relative', height: 160 }}>
                <canvas ref={chartRef} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--text)' }}>{concTop5}%</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>top 5</div>
                </div>
              </div>
              {licsOrdenadas.slice(0, 5).map((l, i) => (
                <div key={l.nr_licitacao + i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nr_licitacao}</span>
                  <div style={{ width: 72, height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(l.valor / (total || 1)) * 100}%`, borderRadius: 2, background: ['#58a6ff', '#3fb950', '#bc8cff', '#d29922', '#6e7681'][i] }} />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)', minWidth: 48, textAlign: 'right' }}>{fmt(l.valor)}</span>
                </div>
              ))}
            </Card>
          ) : (
            <Card title="Contratos por Tipo" sub="Original vs Aditivo vs Prorrogação">
              {(() => {
                const tipos = {};
                contratos.forEach(c => {
                  const t = c.tipo_contrato_nome || 'OUTROS';
                  tipos[t] = (tipos[t] || 0) + 1;
                });
                const entries = Object.entries(tipos).sort((a, b) => b[1] - a[1]);
                const cores = { 'ORIGINAL': '#3fb950', 'ADITIVO': '#d29922', 'PRORROGAÇÃO': '#58a6ff', 'RERRATIFICAÇÃO': '#bc8cff' };
                const totalCont = contratos.length || 1;
                return entries.map(([k, v]) => (
                  <div key={k} style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>
                      <span>{k}</span>
                      <span style={{ fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{v} ({((v / totalCont) * 100).toFixed(0)}%)</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(v / totalCont) * 100}%`, borderRadius: 3, background: cores[k] || 'var(--text2)' }} />
                    </div>
                  </div>
                ));
              })()}
            </Card>
          )}

          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Análise de Eficiência e Riscos de Contratação</h4>
            <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
              Avaliação instantânea dos processos licitatórios e contratos de <strong style={{ color: 'var(--text)' }}>{ano}</strong>.
              Total estimado em processos: {fmtBRL(total)} ({lics.length} registros).
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <BtnOutline onClick={() => setShowAnalise(!showAnalise)}>
                {showAnalise ? 'Ocultar análise ✕' : 'Análise completa ↗'}
              </BtnOutline>
              {!showAnalise && window.sendPrompt && (
                <BtnOutline onClick={() => window.sendPrompt(`Explique se há riscos de corrupção ou ineficiência baseando-se nestes dados: ${pctAditivos}% de aditivos, ${pctDireta}% de contratação direta e ${pctCanceladas}% de licitações frustradas.`)}>
                  <SparkleIcon size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
                  Explicar com IA
                </BtnOutline>
              )}
            </div>

            {showAnalise && (
              <div style={{ marginTop: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, animation: 'slideIn .2s ease' }}>
                <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}`}</style>
                <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Diagnóstico do Exercício</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ borderLeft: alertaAditivos ? '3px solid var(--amber)' : '3px solid var(--green)', paddingLeft: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Taxa de Aditivação</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                      Contratos aditivados representam <strong style={{ color: alertaAditivos ? 'var(--amber)' : 'var(--text)' }}>{pctAditivos}%</strong> do valor original ({fmtBRL(valorAditivos)}). {alertaAditivos && 'Atenção: Aditivos acima de 25% para compras/serviços requerem escrutínio especial pela lei.'}
                    </div>
                  </div>
                  <div style={{ borderLeft: alertaDireta ? '3px solid var(--amber)' : '3px solid var(--green)', paddingLeft: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Contratação Direta</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                      Dispensas e inexigibilidades somam <strong style={{ color: alertaDireta ? 'var(--amber)' : 'var(--text)' }}>{pctDireta}%</strong> das contratações ({fmtBRL(valorDireta)}). {alertaDireta && 'Índices elevados indicam possível fragmentação para burlar processos licitatórios formais.'}
                    </div>
                  </div>
                  <div style={{ borderLeft: alertaCanceladas ? '3px solid var(--amber)' : '3px solid var(--green)', paddingLeft: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>Taxa de Frustração</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                      <strong style={{ color: alertaCanceladas ? 'var(--amber)' : 'var(--text)' }}>{pctCanceladas}%</strong> das licitações ({licsCanceladas}) foram canceladas ou anuladas. {alertaCanceladas && 'Muitos cancelamentos geram retrabalho e sugerem editais mal formulados ou impugnados.'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
