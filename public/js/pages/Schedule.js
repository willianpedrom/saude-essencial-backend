import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { formatDate, toast, modal } from '../utils.js';

// ───────────── AGENDA ─────────────
export async function renderSchedule(router) {
  renderLayout(router, 'Agenda de Reuniões',
    `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando...</div>`,
    'schedule');

  let clients = [];
  let events = [];

  async function refresh() {
    [clients, events] = await Promise.all([
      store.getClients().catch(() => []),
      store.getAgendamentos().catch(() => []),
    ]);
    renderEvents();
  }

  function getDateHora(e) {
    return e.data_hora || (e.date ? e.date + 'T' + (e.time || '00:00') : null);
  }

  function eventCard(e, isPast = false) {
    const clienteId = e.cliente_id || e.clienteId || e.clientId;
    const c = clients.find(cl => cl.id === clienteId);
    const types = { meeting: '🤝 Reunião', call: '📞 Ligação', followup: '💬 Follow-up', delivery: '📦 Entrega', other: '📌 Outro' };
    const tipo = e.tipo || e.type || 'other';
    const titulo = e.titulo || e.title || 'Evento';
    const obs = e.observacoes || e.notes || '';
    const dt = getDateHora(e);
    return `
      <div class="schedule-event ${isPast ? '' : 'gold'}" style="margin-bottom:10px;opacity:${isPast ? 0.6 : 1}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div class="schedule-event-title">${titulo}</div>
            <div class="schedule-event-meta">
              ${types[tipo] || '📌'} · 📅 ${formatDate(dt)}${c ? ' · 👤 ' + (c.name || c.nome) : ''}
            </div>
            ${obs ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px">${obs}</div>` : ''}
          </div>
          ${!isPast ? `<button class="btn btn-danger btn-sm" data-del-event="${e.id}">🗑️</button>` : ''}
        </div>
      </div>`;
  }

  function renderEvents() {
    const pc = document.getElementById('page-content');
    if (!pc) return;

    // Ensure page structure is built
    if (!pc.querySelector('#events-list')) { buildPage(); }

    const today = new Date().toISOString().slice(0, 10);
    const upcoming = events.filter(e => { const dt = getDateHora(e); return dt && dt.slice(0, 10) >= today; });
    const past = events.filter(e => { const dt = getDateHora(e); return dt && dt.slice(0, 10) < today; });
    const container = pc.querySelector('#events-list');
    if (!container) return;

    container.innerHTML = upcoming.length === 0 && past.length === 0
      ? `<div class="empty-state"><div class="empty-state-icon">📅</div><h4>Nenhuma reunião agendada</h4><p>Agende reuniões com seus clientes</p></div>`
      : `
          ${upcoming.length > 0 ? `<div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">PRÓXIMAS</div>
          ${upcoming.map(e => eventCard(e)).join('')}` : ''}
          ${past.length > 0 ? `<div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:20px 0 10px">REALIZADAS</div>
          ${past.map(e => eventCard(e, true)).join('')}` : ''}`;

    container.querySelectorAll('[data-del-event]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await store.deleteAgendamento(btn.dataset.delEvent).catch(() => { });
        toast('Evento removido.', 'warning');
        await refresh();
      });
    });
  }

  function buildPage() {
    const pc = document.getElementById('page-content');
    if (!pc) return;
    pc.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
          <button class="btn btn-primary" id="btn-add-event">+ Agendar Compromisso</button>
        </div>
        <div id="events-list"></div>`;
    pc.querySelector('#btn-add-event').addEventListener('click', showAddModal);
  }

  function showAddModal() {
    const clientOpts = clients.map(c =>
      `<option value="${c.id}">${c.name || c.nome}</option>`).join('');
    modal('Nova Reunião / Compromisso', `
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Título *</label>
          <input class="field-input" id="ev-title" placeholder="Ex: Apresentação de Produtos..." />
        </div>
        <div class="form-group">
          <label class="field-label">Tipo</label>
          <select class="field-select" id="ev-type">
            <option value="meeting">🤝 Reunião</option>
            <option value="call">📞 Ligação</option>
            <option value="followup">💬 Follow-up</option>
            <option value="delivery">📦 Entrega</option>
            <option value="other">📌 Outro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="field-label">Cliente (opcional)</label>
          <select class="field-select" id="ev-client">
            <option value="">— Selecione —</option>
            ${clientOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="field-label">Data *</label>
          <input class="field-input" id="ev-date" type="date" value="${new Date().toISOString().slice(0, 10)}" />
        </div>
        <div class="form-group">
          <label class="field-label">Horário</label>
          <input class="field-input" id="ev-time" type="time" />
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Observações</label>
          <textarea class="field-textarea" id="ev-notes" placeholder="Detalhes..."></textarea>
        </div>
      </div>`, {
      confirmLabel: 'Agendar',
      onConfirm: async () => {
        const titulo = document.getElementById('ev-title').value.trim();
        if (!titulo) { toast('Título obrigatório', 'error'); return; }
        const date = document.getElementById('ev-date').value;
        const time = document.getElementById('ev-time').value;
        const data_hora = time ? `${date}T${time}:00` : `${date}T00:00:00`;
        try {
          await store.addAgendamento({
            titulo,
            tipo: document.getElementById('ev-type').value,
            cliente_id: document.getElementById('ev-client').value || null,
            data_hora,
            observacoes: document.getElementById('ev-notes').value,
          });
          toast('Compromisso agendado! 📅');
          await refresh();
        } catch (err) {
          toast('Erro: ' + err.message, 'error');
        }
      }
    });
  }

  await refresh();
  buildPage();
}

// ───────────── FOLLOW-UP ─────────────
export async function renderFollowup(router) {
  renderLayout(router, 'Follow-up Pós-venda',
    `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando...</div>`,
    'followup');

  const clients = await store.getClients().catch(() => []);

  // LocalStorage fallback for followups (backend endpoint not yet implemented)
  const storageKey = `se_followups_${auth.current?.id}`;

  function getFollowups() {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
  }
  function saveFollowups(list) {
    localStorage.setItem(storageKey, JSON.stringify(list));
  }

  function renderList() {
    const followups = getFollowups().sort((a, b) => {
      const priority = { overdue: 0, pending: 1, done: 2 };
      const s = f => f.status === 'pending' && f.dueDate && new Date(f.dueDate) < new Date() ? 'overdue' : f.status;
      return (priority[s(a)] || 1) - (priority[s(b)] || 1);
    });
    const container = document.getElementById('followup-list');
    if (!container) return;

    container.innerHTML = followups.length === 0
      ? `<div class="empty-state"><div class="empty-state-icon">💬</div><h4>Nenhum follow-up</h4>
               <p>Registre ações de acompanhamento pós-venda para fidelizar seus clientes</p></div>`
      : followups.map(f => {
        const c = clients.find(cl => cl.id === f.clientId);
        const isOverdue = f.status === 'pending' && f.dueDate && new Date(f.dueDate) < new Date();
        const status = isOverdue ? 'overdue' : f.status;
        const statusLabel = { done: '✅ Concluído', pending: '⏳ Pendente', overdue: '⚠️ Atrasado' }[status];
        return `
              <div class="card" style="margin-bottom:10px">
                <div class="card-body" style="display:flex;align-items:flex-start;gap:14px">
                  <div class="followup-status-dot ${status}" style="margin-top:6px;width:12px;height:12px;flex-shrink:0"></div>
                  <div style="flex:1">
                    <div style="font-weight:600;font-size:0.93rem">${c?.name || c?.nome || 'Cliente'}</div>
                    <div style="color:var(--text-body);margin:4px 0">${f.note}</div>
                    <div style="font-size:0.78rem;color:var(--text-muted)">
                      ${f.dueDate ? '📅 ' + formatDate(f.dueDate) : ''} · ${statusLabel}
                    </div>
                  </div>
                  <div style="display:flex;gap:6px;flex-shrink:0">
                    ${f.status !== 'done' ? `<button class="btn btn-secondary btn-sm" data-done="${f.id}">✅ Concluir</button>` : ''}
                    ${(c?.phone || c?.telefone) ? `<a class="btn btn-sm" style="background:#25D366;color:white" href="https://wa.me/${c.phone || c.telefone}" target="_blank">📱</a>` : ''}
                  </div>
                </div>
              </div>`;
      }).join('');

    container.querySelectorAll('[data-done]').forEach(btn => {
      btn.addEventListener('click', () => {
        const list = getFollowups();
        const idx = list.findIndex(f => f.id === btn.dataset.done);
        if (idx >= 0) { list[idx].status = 'done'; saveFollowups(list); }
        renderList();
        toast('Follow-up concluído! ✅');
      });
    });
  }

  function showAddModal() {
    modal('Novo Follow-up', `
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Cliente *</label>
          <select class="field-select" id="fu-client">
            <option value="">— Selecione —</option>
            ${clients.map(c => `<option value="${c.id}">${c.name || c.nome}</option>`).join('')}
          </select>
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Anotação / Tarefa *</label>
          <textarea class="field-textarea" id="fu-note" placeholder="Ex: Verificar resultado após 30 dias..."></textarea>
        </div>
        <div class="form-group">
          <label class="field-label">Data de lembrete</label>
          <input class="field-input" id="fu-due" type="date" />
        </div>
      </div>`, {
      confirmLabel: 'Salvar',
      onConfirm: () => {
        const clientId = document.getElementById('fu-client').value;
        const note = document.getElementById('fu-note').value.trim();
        if (!clientId || !note) { toast('Cliente e anotação obrigatórios', 'error'); return; }
        const list = getFollowups();
        list.push({ id: Date.now().toString(), clientId, note, dueDate: document.getElementById('fu-due').value, status: 'pending', createdAt: new Date().toISOString() });
        saveFollowups(list);
        renderList();
        toast('Follow-up registrado! 💬');
      }
    });
  }

  const pc = document.getElementById('page-content');
  if (pc) pc.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
      <button class="btn btn-primary" id="btn-add-fu">+ Novo Follow-up</button>
    </div>
    <div id="followup-list"></div>`;

  document.getElementById('btn-add-fu')?.addEventListener('click', showAddModal);
  renderList();
}
