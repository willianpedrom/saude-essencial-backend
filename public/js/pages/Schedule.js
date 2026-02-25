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

  const storageKey = `se_followups_${auth.current?.id}`;

  function getFollowups() {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
  }
  function saveFollowups(list) {
    localStorage.setItem(storageKey, JSON.stringify(list));
  }

  // ── Browser Notification helper ────────────────────────────────
  async function requestNotifPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return await Notification.requestPermission();
  }

  function scheduleNotification(followup, clientName) {
    if (!followup.dueDateTime) return;
    const fireAt = new Date(followup.dueDateTime).getTime();
    const now = Date.now();
    const delay = fireAt - now;
    if (delay <= 0 || delay > 7 * 24 * 60 * 60 * 1000) return; // only within 7 days
    setTimeout(() => {
      if (Notification.permission === 'granted' && document.visibilityState === 'visible') {
        new Notification('⏰ Follow-up: ' + clientName, {
          body: followup.note,
          icon: '/favicon.ico',
        });
      }
    }, delay);
  }

  function makeGoogleCalendarUrl(followup, clientName) {
    if (!followup.dueDateTime) return null;
    const start = new Date(followup.dueDateTime);
    const end = new Date(start.getTime() + 30 * 60 * 1000); // 30min
    const fmt = d => d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Follow-up: ${clientName}`,
      details: followup.note,
      dates: `${fmt(start)}/${fmt(end)}`,
    });
    return `https://calendar.google.com/calendar/render?${params}`;
  }

  function makeWhatsAppUrl(followup, client) {
    const phone = (client?.phone || client?.telefone || '').replace(/\D/g, '');
    const consultant = auth.current;
    const nome = consultant?.nome || 'Consultora';
    const clientName = client?.name || client?.nome || 'você';
    const dateStr = followup.dueDateTime
      ? new Date(followup.dueDateTime).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
      : '';

    const msg = encodeURIComponent(
      `Olá ${clientName}! 💚\n\nSou ${nome}, sua consultora de Saúde Essencial.\n\nEstou entrando em contato para acompanhar como você está se sentindo após nossa última conversa. 🌿\n\n${followup.note ? `📝 Assunto: ${followup.note}\n\n` : ''}${dateStr ? `📅 Retorno programado: ${dateStr}\n\n` : ''}Qualquer dúvida, estou à disposição!`
    );
    return phone
      ? `https://wa.me/55${phone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
  }

  function renderList() {
    const followups = getFollowups().sort((a, b) => {
      const priority = { overdue: 0, pending: 1, done: 2 };
      const s = f => f.status === 'pending' && f.dueDateTime && new Date(f.dueDateTime) < new Date() ? 'overdue' : f.status;
      return (priority[s(a)] || 1) - (priority[s(b)] || 1);
    });
    const container = document.getElementById('followup-list');
    if (!container) return;

    const pending = followups.filter(f => f.status !== 'done');
    const done = followups.filter(f => f.status === 'done');

    if (followups.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💬</div><h4>Nenhum follow-up</h4>
        <p>Registre ações de acompanhamento pós-venda para fidelizar seus clientes</p></div>`;
      return;
    }

    function renderCard(f) {
      const c = clients.find(cl => cl.id === f.clientId);
      const clientName = c?.name || c?.nome || 'Cliente';
      const isOverdue = f.status === 'pending' && f.dueDateTime && new Date(f.dueDateTime) < new Date();
      const status = isOverdue ? 'overdue' : f.status;
      const statusLabel = { done: '✅ Concluído', pending: '⏳ Pendente', overdue: '⚠️ Atrasado' }[status];
      const statusColor = { done: '#166534', pending: '#854d0e', overdue: '#7c2d12' }[status];
      const statusBg = { done: '#dcfce7', pending: '#fef9c3', overdue: '#fee2e2' }[status];

      const gcalUrl = makeGoogleCalendarUrl(f, clientName);
      const waUrl = makeWhatsAppUrl(f, c);

      const initials = clientName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

      return `
        <div class="card" style="margin-bottom:12px;border-left:4px solid ${{ done: '#22c55e', pending: '#f59e0b', overdue: '#ef4444' }[status]}">
          <div style="padding:16px 18px">
            <div style="display:flex;align-items:flex-start;gap:12px">
              <div class="client-avatar-sm" style="flex-shrink:0">${initials}</div>
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
                  <span style="font-weight:700;font-size:0.95rem">${clientName}</span>
                  <span style="background:${statusBg};color:${statusColor};font-size:0.72rem;padding:2px 8px;border-radius:10px">${statusLabel}</span>
                </div>
                <div style="color:var(--text-body);font-size:0.88rem;margin-bottom:8px">${f.note}</div>
                <div style="font-size:0.78rem;color:var(--text-muted);display:flex;gap:12px;flex-wrap:wrap">
                  ${f.dueDateTime ? `<span>📅 ${new Date(f.dueDateTime).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} às ${new Date(f.dueDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>` : ''}
                  ${c?.email ? `<span>✉️ ${c.email}</span>` : ''}
                  ${(c?.phone || c?.telefone) ? `<span>📱 ${c?.phone || c?.telefone}</span>` : ''}
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;align-items:flex-end">
                ${f.status !== 'done' ? `<button class="btn btn-primary btn-sm" data-done="${f.id}">✅ Concluir</button>` : ''}
                <a class="btn btn-sm" style="background:#25D366;color:white;text-decoration:none;display:flex;align-items:center;gap:4px"
                  href="${waUrl}" target="_blank" title="Enviar WhatsApp com mensagem personalizada">
                  📱 WhatsApp
                </a>
                ${gcalUrl ? `<a class="btn btn-secondary btn-sm" href="${gcalUrl}" target="_blank" style="text-decoration:none;display:flex;align-items:center;gap:4px" title="Adicionar ao Google Agenda">
                  📆 Agenda
                </a>` : ''}
                <button class="btn btn-sm" style="background:#f3f4f6;color:#374151;font-size:0.72rem" data-del-fu="${f.id}" title="Excluir">🗑️</button>
              </div>
            </div>
          </div>
        </div>`;
    }

    container.innerHTML = `
      ${pending.length > 0 ? `
        <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">
          PENDENTES (${pending.length})
        </div>
        ${pending.map(renderCard).join('')}` : ''}
      ${done.length > 0 ? `
        <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:20px 0 10px">
          CONCLUÍDOS (${done.length})
        </div>
        ${done.map(renderCard).join('')}` : ''}`;

    container.querySelectorAll('[data-done]').forEach(btn => {
      btn.addEventListener('click', () => {
        const list = getFollowups();
        const idx = list.findIndex(f => f.id === btn.dataset.done);
        if (idx >= 0) { list[idx].status = 'done'; saveFollowups(list); }
        renderList();
        toast('Follow-up concluído! ✅');
      });
    });

    container.querySelectorAll('[data-del-fu]').forEach(btn => {
      btn.addEventListener('click', () => {
        const list = getFollowups().filter(f => f.id !== btn.dataset.delFu);
        saveFollowups(list);
        renderList();
        toast('Follow-up removido.', 'warning');
      });
    });
  }

  async function showAddModal() {
    // Request notification permission
    const notifStatus = await requestNotifPermission();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().slice(0, 10);

    modal('Novo Follow-up', `
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Cliente *</label>
          <select class="field-select" id="fu-client">
            <option value="">— Selecione —</option>
            ${clients.map(c => `<option value="${c.id}">${c.name || c.nome}${(c.phone || c.telefone) ? ' · ' + ((c.phone || c.telefone).slice(-4).padStart(8, '•')) : ''}</option>`).join('')}
          </select>
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Anotação / Tarefa *</label>
          <textarea class="field-textarea" id="fu-note" rows="3" placeholder="Ex: Verificar resultado após 30 dias, enviar protocolo atualizado..."></textarea>
        </div>
        <div class="form-group">
          <label class="field-label">📅 Data do lembrete *</label>
          <input class="field-input" id="fu-date" type="date" value="${defaultDate}" />
        </div>
        <div class="form-group">
          <label class="field-label">🕐 Horário</label>
          <input class="field-input" id="fu-time" type="time" value="09:00" />
        </div>
        ${notifStatus === 'granted' ? `
        <div class="form-group form-field-full">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.88rem">
            <input type="checkbox" id="fu-notif" checked />
            <span>🔔 Ativar notificação de lembrete (dentro de 7 dias)</span>
          </label>
        </div>` : notifStatus === 'denied' ? `
        <div style="background:#fef3c7;border-radius:8px;padding:10px 12px;font-size:0.8rem;color:#92400e">
          ⚠️ Notificações bloqueadas. Permita notificações no navegador para receber lembretes.
        </div>` : ''}
        <div style="background:#f0fdf4;border-radius:8px;padding:12px;font-size:0.82rem;color:#1a4731" class="form-group form-field-full">
          💡 Um link do <strong>WhatsApp com mensagem personalizada</strong> e atalho para o 
          <strong>Google Agenda</strong> serão gerados automaticamente.
        </div>
      </div>`, {
      confirmLabel: '💾 Salvar Follow-up',
      onConfirm: async () => {
        const clientId = document.getElementById('fu-client').value;
        const note = document.getElementById('fu-note').value.trim();
        if (!clientId || !note) { toast('Cliente e anotação obrigatórios', 'error'); return; }

        const date = document.getElementById('fu-date').value;
        const time = document.getElementById('fu-time').value || '09:00';
        const dueDateTime = date ? `${date}T${time}:00` : null;
        const wantsNotif = document.getElementById('fu-notif')?.checked !== false;

        const followup = {
          id: Date.now().toString(),
          clientId,
          note,
          dueDateTime,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        const list = getFollowups();
        list.push(followup);
        saveFollowups(list);

        // Schedule browser notification if within range
        if (wantsNotif && dueDateTime) {
          const c = clients.find(cl => cl.id === clientId);
          const clientName = c?.name || c?.nome || 'Cliente';
          if (notifStatus === 'granted') {
            scheduleNotification(followup, clientName);
            toast('Follow-up salvo! 🔔 Lembrete agendado.', 'success');
          } else {
            toast('Follow-up salvo! 💬');
          }
        } else {
          toast('Follow-up salvo! 💬');
        }

        renderList();
      }
    });
  }

  // Schedule notifications for existing pending followups
  (async () => {
    const perm = await requestNotifPermission();
    if (perm === 'granted') {
      getFollowups()
        .filter(f => f.status === 'pending' && f.dueDateTime)
        .forEach(f => {
          const c = clients.find(cl => cl.id === f.clientId);
          scheduleNotification(f, c?.name || c?.nome || 'Cliente');
        });
    }
  })();

  const pc = document.getElementById('page-content');
  if (pc) pc.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div style="font-size:0.9rem;color:var(--text-muted)">
        ${getFollowups().filter(f => f.status === 'pending').length} pendente(s)
      </div>
      <button class="btn btn-primary" id="btn-add-fu">+ Novo Follow-up</button>
    </div>
    <div id="followup-list"></div>`;

  document.getElementById('btn-add-fu')?.addEventListener('click', showAddModal);
  renderList();
}
