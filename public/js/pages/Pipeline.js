import { store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { toast, modal, openClientOffcanvas } from '../utils.js';

// ── Pipeline stages config ────────────────────────────────────
const STAGES = [
  {
    id: 'lead_captado',
    label: 'Lead Captado',
    icon: '💧',
    color: '#3b82f6',
    bg: '#eff6ff',
    tip: 'Preencheu a anamnese ou entrou no radar',
  },
  {
    id: 'primeiro_contato',
    label: 'Primeiro Contato',
    icon: '📞',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    tip: 'Você entrou em contato via WhatsApp',
  },
  {
    id: 'interesse_confirmado',
    label: 'Interesse Confirmado',
    icon: '💬',
    color: '#0891b2',
    bg: '#ecfeff',
    tip: 'Demonstrou interesse em saber mais',
  },
  {
    id: 'protocolo_apresentado',
    label: 'Protocolo Apresentado',
    icon: '🌿',
    color: '#16a34a',
    bg: '#f0fdf4',
    tip: 'Kit ou protocolo foi apresentado ao lead',
  },
  {
    id: 'proposta_enviada',
    label: 'Proposta Enviada',
    icon: '📦',
    color: '#d97706',
    bg: '#fffbeb',
    tip: 'Preço, link e condições foram enviados',
  },
  {
    id: 'negociando',
    label: 'Negociando',
    icon: '🤝',
    color: '#ea580c',
    bg: '#fff7ed',
    tip: 'Aguardando decisão / tratando objeções',
  },
  {
    id: 'primeira_compra',
    label: 'Primeira Compra! 🎉',
    icon: '🎉',
    color: '#15803d',
    bg: '#dcfce7',
    tip: 'Fechou! Virou cliente efetivo!',
    celebrate: true,
  },
];

const RECRUTAMENTO_STAGES = [
  { id: 'prospecto_negocio', label: 'Prospecto de Negócio', icon: '🎯', color: '#3b82f6', bg: '#eff6ff', tip: 'Mostrou interesse na oportunidade' },
  { id: 'convite_apresentacao', label: 'Convite Feito', icon: '✉️', color: '#8b5cf6', bg: '#f5f3ff', tip: 'Convidado para classe/apresentação' },
  { id: 'apresentacao_assistida', label: 'Assistiu Apresentação', icon: '📺', color: '#0891b2', bg: '#ecfeff', tip: 'Viu o plano de negócio' },
  { id: 'acompanhamento_cadastro', label: 'Em Acompanhamento', icon: '⏱️', color: '#d97706', bg: '#fffbeb', tip: 'Tirando dúvidas / Follow-up' },
  { id: 'cadastrada', label: 'Cadastrada! 🎉', icon: '🏅', color: '#15803d', bg: '#dcfce7', tip: 'Nova consultora na equipe', celebrate: true },
];

const LOST_STAGE_RECRUTAMENTO = {
  id: 'nao_tem_interesse_agora', label: 'Sem Interesse', icon: '❌', color: '#9ca3af', bg: '#f9fafb', tip: 'Não quer fazer o negócio no momento'
};

const LOST_STAGE = {
  id: 'perdido',
  label: 'Perdidos',
  icon: '❌',
  color: '#9ca3af',
  bg: '#f9fafb',
  tip: 'Lead desistiu ou não respondeu',
};

// ── Main render ────────────────────────────────────────────────
export async function renderPipeline(router) {
  renderLayout(router, 'Fluxo de Trabalho: Funis',
    `<div style="display:flex;align-items:center;justify-content:center;height:300px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando pipeline...</div>`,
    'pipeline');

  let clients = [];
  let activeFunnel = 'vendas'; // 'vendas' | 'recrutamento'

  async function load() {
    clients = await store.getClients().catch(() => []);
    render();
  }

  function getActiveStages() {
    return activeFunnel === 'vendas' ? STAGES : RECRUTAMENTO_STAGES;
  }
  function getActiveLostStage() {
    return activeFunnel === 'vendas' ? LOST_STAGE : LOST_STAGE_RECRUTAMENTO;
  }
  function getClientStage(c) {
    if (activeFunnel === 'vendas') {
      if (c.pipeline_stage === 'none') return 'none'; // ocultado intencionalmente
      if (c.pipeline_stage) return c.pipeline_stage;

      // Se o cliente nasceu do formulário de recrutamento, ele tem recrutamento_stage mas não pipeline_stage.
      if (c.recrutamento_stage) return 'none';

      return 'lead_captado'; // Fallback padrão (Links de saúde/públicos)
    }
    // Funil de Recrutamento
    if (c.recrutamento_stage === 'none') return 'none';
    return c.recrutamento_stage; // pode ser null/undefined se nunca entrou
  }

  function getStageClients(stageId) {
    return clients.filter(c => getClientStage(c) === stageId);
  }

  function cardHtml(client, stageConfig) {
    const initials = (client.name || client.nome || 'C').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const fullName = client.name || client.nome || '';
    const firstName = fullName.split(' ')[0] || '';
    const phone = client.phone || client.telefone || '';
    const notes = client.pipeline_notas || '';

    const icebreakers = {
      lead_captado: `Oi ${firstName}, tudo bem com voce? Vi que voce demonstrou interesse em cuidar mais da sua saude. Posso te contar algo que pode fazer toda a diferenca no seu dia a dia?`,
      primeiro_contato: `Oi ${firstName}! Tudo bem? Lembrei de voce e queria saber como esta se sentindo. Tenho uma novidade que acho que combina muito com voce! Posso te contar?`,
      interesse_confirmado: `Oi ${firstName}! Que bom falar com voce de novo! Preparei algo especial pensando no que conversamos. Tem um minutinho? Acho que voce vai adorar!`,
      protocolo_apresentado: `Oi ${firstName}, tudo bem? Queria saber o que voce achou do que te apresentei! Ficou com alguma duvida? Estou aqui para te ajudar!`,
      proposta_enviada: `Oi ${firstName}! So passando para saber se voce conseguiu dar uma olhada na proposta que te enviei. Fico a disposicao para tirar qualquer duvida!`,
      negociando: `Oi ${firstName}! Pensei em voce hoje! Como esta em relacao ao que conversamos? Quero muito te ajudar a dar esse passo!`,
      primeira_compra: `Oi ${firstName}! Que alegria ter voce com a gente! Quero te dar todo o suporte para voce ter a melhor experiencia. Como posso te ajudar hoje?`,
      perdido: `Oi ${firstName}, tudo bem com voce? Faz um tempo que nao conversamos e queria saber como voce esta! Sem compromisso, so queria mesmo saber de voce.`,
    };

    const message = icebreakers[stageConfig.id] || `Oi ${firstName}, tudo bem com voce?`;
    const cleanPhone = phone.replace(/\D/g, '');
    const waPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const waUrl = phone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}` : null;

    // Get prev/next stage for mobile move buttons
    const activeStages = getActiveStages();
    const currentStageIdx = activeStages.findIndex(s => s.id === stageConfig.id);
    const prevStage = currentStageIdx > 0 ? activeStages[currentStageIdx - 1] : null;
    const nextStage = currentStageIdx !== -1 && currentStageIdx < activeStages.length - 1 ? activeStages[currentStageIdx + 1] : null;

    return `
    <div class="pipeline-card"
         draggable="true"
         data-id="${client.id}"
         data-stage="${stageConfig.id}"
         data-name="${fullName.replace(/"/g, '&quot;')}"
         data-phone="${phone}">
      <div class="pipeline-card-header">
        <div class="pipeline-card-avatar" style="background:linear-gradient(135deg,${stageConfig.color}88,${stageConfig.color}cc)">${initials}</div>
        <div class="pipeline-card-info">
          <div class="pipeline-card-name">${fullName || '—'} ${client.tipo_cadastro === 'preferencial' ? ' 🛒' : client.tipo_cadastro === 'consultora' ? ' 💼' : ''}</div>
          ${phone ? `<div class="pipeline-card-phone">📱 ${phone}</div>` : ''}
        </div>
        <div class="pipeline-card-actions">
          ${waUrl ? `<a href="${waUrl}" target="_blank" class="pipeline-card-btn" title="WhatsApp">💬</a>` : ''}
          <button class="pipeline-card-btn" data-note-id="${client.id}" data-note-name="${fullName.replace(/"/g, '&quot;')}" data-note-current="${notes.replace(/"/g, '&quot;')}" title="Adicionar nota">📝</button>
        </div>
      </div>
      ${client.motivo_perda ? `<div class="pipeline-card-note" style="color:#ef4444;font-style:normal;font-weight:600;margin-bottom:2px">🛑 Motivo: ${client.motivo_perda}</div>` : ''}
      ${notes ? `<div class="pipeline-card-note">${notes}</div>` : ''}
      <div class="pipeline-card-move-btns">
        ${prevStage ? `<button class="pipeline-move-btn" data-move-id="${client.id}" data-move-to="${prevStage.id}" title="Mover para ${prevStage.label}">← ${prevStage.label.split(' ')[0]}</button>` : '<span></span>'}
        ${nextStage ? `<button class="pipeline-move-btn pipeline-move-btn-next" data-move-id="${client.id}" data-move-to="${nextStage.id}" title="Avançar para ${nextStage.label}">${nextStage.label.split(' ')[0]} →</button>` : '<span></span>'}
      </div>
    </div>`;
  }

  function stageColumnHtml(stage) {
    const stageClients = getStageClients(stage.id);
    const count = stageClients.length;
    const celebrate = stage.celebrate && count > 0;

    return `
    <div class="pipeline-column" data-stage="${stage.id}">
      <div class="pipeline-column-header" style="border-top: 3px solid ${stage.color}; background: ${stage.bg}">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:1.1rem">${stage.icon}</span>
          <span class="pipeline-column-title">${stage.label}</span>
          <span class="pipeline-count" style="background:${stage.color}22;color:${stage.color}">${count}</span>
        </div>
        <div class="pipeline-column-tip">${stage.tip}</div>
      </div>
      <div class="pipeline-drop-zone" data-target-stage="${stage.id}">
        ${stageClients.length === 0
        ? `<div class="pipeline-empty-col">Arraste um card aqui</div>`
        : stageClients.map(c => cardHtml(c, stage)).join('')
      }
        ${celebrate ? `<div class="pipeline-celebrate">🎊 ${count} cliente${count > 1 ? 's' : ''}!</div>` : ''}
      </div>
    </div>`;
  }

  function render() {
    const pc = document.getElementById('page-content');
    if (!pc) return;

    const lostClients = getStageClients(getActiveLostStage().id);
    // Para funil de vendas, exclui não-leads. Para recrutamento, contabiliza só quem está com stage != nulo
    const totalInFunnel = clients.filter(c => {
      const s = getClientStage(c);
      if (activeFunnel === 'vendas') return s && s !== 'perdido';
      return s && s !== 'nao_tem_interesse_agora';
    }).length;

    // Contagem de convertidos
    const converted = getStageClients(activeFunnel === 'vendas' ? 'primeira_compra' : 'cadastrada').length;
    const convRate = totalInFunnel > 0 ? Math.round((converted / totalInFunnel) * 100) : 0;

    pc.innerHTML = `
    <style>
      .pipeline-summary { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
      .pipeline-stat { background:white; border:1px solid var(--border); border-radius:var(--radius-md); padding:14px 20px; display:flex; flex-direction:column; gap:2px; }
      .pipeline-stat-val { font-size:1.6rem; font-weight:800; color:var(--text-dark); line-height:1; }
      .pipeline-stat-label { font-size:0.75rem; color:var(--text-muted); }
      .pipeline-board { display:flex; gap:12px; overflow-x:auto; padding-bottom:16px; min-height:500px; }
      .pipeline-column { min-width:220px; max-width:240px; flex-shrink:0; display:flex; flex-direction:column; }
      .pipeline-column-header { border-radius:var(--radius-md) var(--radius-md) 0 0; padding:12px 14px; }
      .pipeline-column-title { font-weight:700; font-size:0.88rem; color:var(--text-dark); }
      .pipeline-count { border-radius:var(--radius-full); padding:1px 8px; font-size:0.72rem; font-weight:700; }
      .pipeline-column-tip { font-size:0.7rem; color:var(--text-muted); margin-top:4px; }
      .pipeline-drop-zone { flex:1; background:#f8fafc; border:1px solid var(--border); border-top:none; border-radius:0 0 var(--radius-md) var(--radius-md); padding:8px; min-height:120px; transition:background 0.2s; }
      .pipeline-drop-zone.drag-over { background:#e0f2fe; border-color:#3b82f6; }
      .pipeline-empty-col { text-align:center; color:var(--text-light); font-size:0.75rem; padding:20px 8px; border:2px dashed var(--border); border-radius:var(--radius-sm); margin:4px 0; }
      .pipeline-card { background:white; border:1px solid var(--border); border-radius:var(--radius-md); padding:10px 12px; margin-bottom:8px; cursor:grab; transition:all 0.2s; box-shadow:var(--shadow-sm); }
      .pipeline-card:hover { box-shadow:var(--shadow-md); transform:translateY(-1px); }
      .pipeline-card.dragging { opacity:0.4; cursor:grabbing; }
      .pipeline-card-header { display:flex; align-items:center; gap:8px; }
      .pipeline-card-avatar { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; color:white; flex-shrink:0; }
      .pipeline-card-info { flex:1; min-width:0; }
      .pipeline-card-name { font-weight:600; font-size:0.85rem; color:var(--text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .pipeline-card-phone { font-size:0.72rem; color:var(--text-muted); }
      .pipeline-card-actions { display:flex; gap:4px; }
      .pipeline-card-btn { background:none; border:none; cursor:pointer; font-size:0.9rem; padding:2px 4px; border-radius:4px; text-decoration:none; opacity:0.6; transition:opacity 0.15s; }
      .pipeline-card-btn:hover { opacity:1; background:var(--green-50); }
      .pipeline-card-note { font-size:0.73rem; color:var(--text-muted); margin-top:6px; padding-top:6px; border-top:1px solid var(--border); font-style:italic; white-space:pre-wrap; }
      .pipeline-celebrate { text-align:center; font-size:0.82rem; color:#15803d; font-weight:600; margin-top:8px; animation:bounce 1s ease infinite; }
      .pipeline-lost-toggle { margin-top:16px; background:white; border:1px solid var(--border); border-radius:var(--radius-md); overflow:hidden; }
      .pipeline-lost-header { padding:12px 16px; cursor:pointer; display:flex; align-items:center; justify-content:space-between; font-size:0.88rem; font-weight:600; color:var(--text-muted); }
      .pipeline-lost-body { display:none; padding:8px; border-top:1px solid var(--border); display:flex; gap:10px; flex-wrap:wrap; }
      @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      /* Mobile move buttons — visible on touch screens only */
      .pipeline-card-move-btns { display:none; justify-content:space-between; gap:6px; margin-top:8px; padding-top:7px; border-top:1px solid var(--border); }
      .pipeline-move-btn { flex:1; font-size:0.7rem; padding:4px 6px; border:1px solid var(--border); border-radius:6px; background:#f8fafc; color:var(--text-dark); cursor:pointer; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .pipeline-move-btn-next { background:var(--green-600); color:white; border-color:var(--green-600); }
      @media (pointer: coarse), (max-width: 768px) {
        .pipeline-card-move-btns { display:flex; }
      }
    </style>

    <div style="display:flex; gap:8px; margin-bottom:20px; border-bottom:1px solid var(--border-light); padding-bottom:16px;">
      <button class="btn ${activeFunnel === 'vendas' ? 'btn-primary' : 'btn-secondary'}" id="tab-vendas" style="flex:1; border-radius:30px; padding:10px; font-weight:600">🛍️ Funil de Vendas</button>
      <button class="btn ${activeFunnel === 'recrutamento' ? 'btn-primary' : 'btn-secondary'}" id="tab-recrutamento" style="flex:1; border-radius:30px; padding:10px; font-weight:600">💼 Funil de Recrutamento (Downlines)</button>
    </div>

    <div class="pipeline-summary">
      <div class="pipeline-stat">
        <div class="pipeline-stat-val">${totalInFunnel}</div>
        <div class="pipeline-stat-label">No funil</div>
      </div>
      <div class="pipeline-stat">
        <div class="pipeline-stat-val" style="color:#15803d">${converted}</div>
        <div class="pipeline-stat-label">${activeFunnel === 'vendas' ? 'Compraram' : 'Cadastradas'}</div>
      </div>
      <div class="pipeline-stat">
        <div class="pipeline-stat-val" style="color:#d97706">${convRate}%</div>
        <div class="pipeline-stat-label">Taxa de conversão</div>
      </div>
      <div class="pipeline-stat">
        <div class="pipeline-stat-val" style="color:#9ca3af">${lostClients.length}</div>
        <div class="pipeline-stat-label">Perdidos</div>
      </div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <div style="font-size:0.82rem;color:var(--text-muted)">💡 Arraste os cards entre colunas para atualizar o estágio</div>
      <button class="btn btn-secondary btn-sm" id="btn-add-all-clients">+ Adicionar Clientes ao Pipeline</button>
    </div>

    <div class="pipeline-board">
      ${getActiveStages().map(s => stageColumnHtml(s)).join('')}
    </div>

    <div class="pipeline-lost-toggle">
      <div class="pipeline-lost-header" id="lost-toggle" style="background:#f9fafb;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:8px">
          ❌ <span style="color:#ef4444">Leads Perdidos (${activeFunnel === 'vendas' ? 'Venda' : 'Recrutamento'})</span> <span style="font-weight:normal;color:var(--text-muted)">(${lostClients.length})</span>
        </div>
        <span id="lost-arrow">▼</span>
      </div>
      <div class="pipeline-lost-body pipeline-drop-zone" id="lost-body" data-target-stage="${getActiveLostStage().id}" style="display:${lostClients.length > 0 ? 'flex' : 'none'};flex-wrap:wrap;gap:10px;padding:16px;background:#fef2f2;border:2px dashed #fecaca;margin:8px;border-radius:8px">
        ${lostClients.length === 0
        ? '<div style="width:100%;text-align:center;color:#ef4444;font-size:0.9rem;padding:20px;opacity:0.6">Solte os cards de clientes ou leads que desistiram aqui</div>'
        : lostClients.map(c => cardHtml(c, getActiveLostStage())).join('')}
      </div>
    </div>`;

    bindEvents(pc);
    initSortable(pc);
  }

  // ── Sortable.js: touch-friendly drag for all columns ──────────
  function initSortable(pc) {
    function loadSortable(cb) {
      if (window.Sortable) { cb(); return; }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js';
      s.onload = cb;
      document.head.appendChild(s);
    }

    loadSortable(() => {
      pc.querySelectorAll('.pipeline-drop-zone').forEach(zone => {
        new window.Sortable(zone, {
          group: 'pipeline',
          animation: 150,
          ghostClass: 'pipeline-card-ghost',
          chosenClass: 'pipeline-card-chosen',
          dragClass: 'pipeline-card-dragging',
          delay: 150,           // Required for better touch support
          delayOnTouchOnly: true,
          touchStartThreshold: 5,
          onEnd: async (evt) => {
            const targetStage = evt.to.dataset.targetStage;
            const sourceStage = evt.from.dataset.targetStage;
            const cardId = evt.item.dataset.id;
            if (!targetStage || targetStage === sourceStage) return;
            await moveCard(cardId, sourceStage, targetStage, pc);
          },
        });
      });
    });
  }

  // ── Shared move logic (used by DnD + mobile buttons) ──────────
  async function moveCard(clientId, fromStage, targetStage, pc) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const isLost = targetStage === getActiveLostStage().id;

    if (isLost) {
      modal(`Perda de ${activeFunnel === 'vendas' ? 'Venda' : 'Oportunidade'} 😢`, `
          <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:12px">
            Qual foi o principal motivo de ${client.nome || client.name} não ter fechado ${activeFunnel === 'vendas' ? 'negócio' : 'como consultora'}?
          </p>
          <div class="form-group" style="margin-bottom:12px">
            <label class="field-label">Motivo de Perda</label>
            <select class="field-input" id="input-motivo-perda">
              <option value="Sem Resposta / Sumiu">Sem Resposta / Sumiu</option>
              <option value="Achou Caro / Sem Dinheiro">Achou Caro / Sem Dinheiro</option>
              <option value="Comprou com Outro (Concorrente)">Comprou com Outro (Concorrente)</option>
              <option value="Desistiu / Adiou a Compra">Desistiu / Adiou a Compra</option>
              <option value="Não era o momento certo">Não era o momento certo</option>
              <option value="Outro">Outro (especificar nas notas)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="field-label">Detalhes adicionais (Nota)</label>
            <textarea class="field-textarea" id="note-text" rows="3" placeholder="Ex: A pessoa não tem limite no cartão agora...">${activeFunnel === 'vendas' ? (client.pipeline_notas || '') : (client.recrutamento_notas || '')}</textarea>
          </div>`, {
        confirmLabel: 'Confirmar Perda',
        cancelLabel: 'Cancelar',
        onConfirm: async () => {
          const motivo = document.getElementById('input-motivo-perda')?.value || 'Sem Resposta';
          const note = document.getElementById('note-text')?.value || '';
          try {
            if (activeFunnel === 'vendas') {
              await store.updateStage(clientId, targetStage, note, motivo);
              client.pipeline_stage = targetStage;
              client.motivo_perda = motivo;
              client.pipeline_notas = note;
            } else {
              await store.updateRecrutamentoStage(clientId, targetStage, note, motivo);
              client.recrutamento_stage = targetStage;
              client.motivo_perda_recrutamento = motivo;
              client.recrutamento_notas = note;
            }
            toast('Lead marcado como PERDIDO. Motivo registrado.', 'success');
            render();
          } catch (err) {
            toast('Erro ao mover card: ' + err.message, 'error');
            await load();
          }
        },
        onCancel: () => render()
      });
      return;
    }

    // Optimistic update
    if (activeFunnel === 'vendas') client.pipeline_stage = targetStage;
    else client.recrutamento_stage = targetStage;
    render();

    try {
      if (activeFunnel === 'vendas') await store.updateStage(clientId, targetStage);
      else await store.updateRecrutamentoStage(clientId, targetStage);
      const stageConf = [...getActiveStages(), getActiveLostStage()].find(s => s.id === targetStage);
      toast(`Movido para ${stageConf?.icon || ''} ${stageConf?.label || targetStage}`, 'success');
      if (targetStage === 'primeira_compra') {
        setTimeout(() => toast('🎊 Parabéns pela venda! 💰', 'success'), 500);
      }
    } catch (err) {
      toast('Erro ao mover card: ' + err.message, 'error');
      await load();
    }
  }

  function bindEvents(pc) {
    // Tabs
    pc.querySelector('#tab-vendas')?.addEventListener('click', () => { activeFunnel = 'vendas'; render(); });
    pc.querySelector('#tab-recrutamento')?.addEventListener('click', () => { activeFunnel = 'recrutamento'; render(); });

    // Click on card opens offcanvas
    pc.querySelectorAll('.pipeline-card').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('.pipeline-card-btn, .pipeline-move-btn')) return;
        const c = clients.find(cl => cl.id === card.dataset.id);
        if (c) openClientOffcanvas(c);
      });
    });

    // Mobile move buttons (← Reverter / Avançar →)
    pc.querySelectorAll('[data-move-id]').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        const clientId = btn.dataset.moveId;
        const targetStage = btn.dataset.moveTo;
        const card = btn.closest('.pipeline-card');
        const fromStage = card?.dataset.stage;
        await moveCard(clientId, fromStage, targetStage, pc);
      });
    });

    // Lost toggle
    document.getElementById('lost-toggle')?.addEventListener('click', () => {
      const body = document.getElementById('lost-body');
      const arrow = document.getElementById('lost-arrow');
      const isOpen = body.style.display !== 'none';
      body.style.display = isOpen ? 'none' : 'flex';
      arrow.textContent = isOpen ? '▼' : '▲';
    });

    // Note button
    pc.querySelectorAll('[data-note-id]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const { noteId, noteName, noteCurrent } = btn.dataset;
        modal(`📝 Nota – ${noteName}`, `
            <div class="form-group">
              <label class="field-label">Nota sobre esse lead</label>
              <textarea class="field-textarea" id="note-text" rows="4" placeholder="Ex: Interessada em kit Iniciante, aguarda resposta marido...">${noteCurrent || ''}</textarea>
            </div>`, {
          confirmLabel: 'Salvar',
          onConfirm: async () => {
            const note = document.getElementById('note-text')?.value || '';
            try {
              await store.updateStage(noteId, clients.find(c => c.id === noteId)?.pipeline_stage || 'lead_captado', note);
              const client = clients.find(c => c.id === noteId);
              if (client) client.pipeline_notas = note;
              toast('Nota salva! 📝');
              render();
            } catch (err) {
              toast('Erro ao salvar nota: ' + err.message, 'error');
            }
          }
        });
      });
    });

    // Add all clients button
    document.getElementById('btn-add-all-clients')?.addEventListener('click', () => {
      modal('Adicionar Clientes ao Pipeline', `
          <p style="margin-bottom:12px;color:var(--text-muted);font-size:0.9rem">
            Clientes sem estágio definido serão adicionados como <strong>Lead Captado</strong>.
          </p>
          <p style="color:var(--text-muted);font-size:0.85rem">
            Total de clientes: <strong>${clients.length}</strong><br>
            Já no pipeline: <strong>${clients.filter(c => c.pipeline_stage).length}</strong>
          </p>`, {
        confirmLabel: 'Confirmar',
        onConfirm: async () => {
          const toAdd = clients.filter(c => !c.pipeline_stage || c.pipeline_stage === 'lead_captado');
          if (toAdd.length === 0) { toast('Todos os clientes já estão no pipeline!'); return; }
          toast(`${toAdd.length} cliente(s) adicionado(s) ao pipeline! 💧`);
          render();
        }
      });
    });
  }

  await load();
}
