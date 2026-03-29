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
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth(); // 0-based
  let selectedDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const TYPES = { meeting: '🤝 Reunião', call: '📞 Ligação', followup: '💬 Follow-up', delivery: '📦 Entrega', other: '📌 Outro' };

  async function refresh() {
    [clients, events] = await Promise.all([
      store.getClients().catch(() => []),
      store.getAgendamentos().catch(() => []),
    ]);
    renderCalendar();
    renderDayPanel(selectedDate);
  }

  function getDateStr(e) {
    const dt = e.data_hora || (e.date ? e.date + 'T' + (e.time || '00:00') : null);
    return dt ? dt.slice(0, 10) : null;
  }

  function getEventsForDate(dateStr) {
    return events.filter(e => getDateStr(e) === dateStr)
      .sort((a, b) => (a.data_hora || '').localeCompare(b.data_hora || ''));
  }

  function getDotColor(tipo) {
    const map = { meeting: '#6366f1', call: '#0891b2', followup: '#16a34a', delivery: '#d97706', other: '#9ca3af' };
    return map[tipo] || '#9ca3af';
  }

  // ── Calendar Grid ─────────────────────────────────────────────
  function renderCalendar() {
    const grid = document.getElementById('cal-grid');
    const title = document.getElementById('cal-title');
    if (!grid || !title) return;

    title.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
    const today = new Date().toISOString().slice(0, 10);

    // Build a map: dateStr -> events[]
    const eventMap = {};
    events.forEach(e => {
      const d = getDateStr(e);
      if (d) { if (!eventMap[d]) eventMap[d] = []; eventMap[d].push(e); }
    });

    let cells = '';

    // Empty cells before first day
    for (let i = 0; i < startDow; i++) {
      cells += `<div class="cal-cell cal-cell-empty"></div>`;
    }

    // Day cells
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = eventMap[dateStr] || [];
      const isToday = dateStr === today;
      const isSelected = dateStr === selectedDate;
      const hasFuture = dayEvents.some(e => getDateStr(e) >= today);

      const dots = dayEvents.slice(0, 3).map(e =>
        `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${getDotColor(e.tipo || 'other')};margin:0 1px"></span>`
      ).join('');

      cells += `
        <div class="cal-cell${isToday ? ' cal-today' : ''}${isSelected ? ' cal-selected' : ''}"
             data-date="${dateStr}" onclick="window.calSelectDay('${dateStr}')">
          <span class="cal-day-num">${d}</span>
          ${dayEvents.length > 0 ? `<div class="cal-dots">${dots}${dayEvents.length > 3 ? `<span style="font-size:0.6rem;color:var(--text-muted)">+${dayEvents.length - 3}</span>` : ''}</div>` : ''}
        </div>`;
    }

    grid.innerHTML = cells;
  }

  // ── Day Panel ─────────────────────────────────────────────────
  function renderDayPanel(dateStr) {
    const panel = document.getElementById('cal-day-panel');
    const panelTitle = document.getElementById('cal-day-title');
    if (!panel || !panelTitle) return;

    const dayEvents = getEventsForDate(dateStr);
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    panelTitle.textContent = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    if (dayEvents.length === 0) {
      panel.innerHTML = `
        <div style="text-align:center;padding:32px 16px;color:var(--text-muted)">
          <div style="font-size:2.2rem;margin-bottom:8px">📅</div>
          <div style="font-size:0.9rem">Nenhum evento neste dia</div>
          <button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="window.calAddEvent('${dateStr}')">+ Agendar</button>
        </div>`;
      return;
    }

    panel.innerHTML = dayEvents.map(e => {
      const clienteId = e.cliente_id || e.clienteId;
      const c = clients.find(cl => cl.id === clienteId);
      const tipo = e.tipo || 'other';
      const titulo = e.titulo || e.title || 'Evento';
      const obs = e.observacoes || e.notes || '';
      const dt = e.data_hora;
      const timeStr = dt ? new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
      const isPast = (e.data_hora || '').slice(0, 10) < new Date().toISOString().slice(0, 10);
      const dotColor = getDotColor(tipo);

      return `
        <div style="padding:12px 14px;border-radius:10px;margin-bottom:8px;
                    background:${isPast ? '#f9fafb' : 'white'};border:1px solid var(--border);
                    border-left:4px solid ${dotColor};opacity:${isPast ? 0.7 : 1}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-weight:600;font-size:0.92rem;color:var(--text-dark)">${titulo}</div>
              <div style="font-size:0.78rem;color:var(--text-muted);margin-top:3px">
                ${TYPES[tipo] || '📌'} ${timeStr ? '· ' + timeStr : ''}${c ? ' · 👤 ' + (c.nome || c.name) : ''}
              </div>
              ${obs ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;font-style:italic">${obs}</div>` : ''}
            </div>
            ${!isPast ? `<button class="btn btn-danger btn-sm" data-del-event="${e.id}" style="flex-shrink:0;margin-left:8px">🗑️</button>` : ''}
          </div>
        </div>`;
    }).join('') + `
      <button class="btn btn-primary btn-sm" style="width:100%;margin-top:8px" onclick="window.calAddEvent('${dateStr}')">+ Adicionar Evento</button>`;

    panel.querySelectorAll('[data-del-event]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await store.deleteAgendamento(btn.dataset.delEvent).catch(() => { });
        toast('Evento removido.', 'warning');
        await refresh();
      });
    });
  }

  // ── Show add modal ─────────────────────────────────────────────
  function showAddModal(prefillDate = '') {
    const clientOpts = clients.map(c =>
      `<option value="${c.id}">${c.nome || c.name}</option>`).join('');
    const defaultDate = prefillDate || new Date().toISOString().slice(0, 10);

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
          <input class="field-input" id="ev-date" type="date" value="${defaultDate}" />
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
        const data_hora = time ? `${date}T${time}:00` : `${date}T09:00:00`;
        try {
          await store.addAgendamento({
            titulo,
            tipo: document.getElementById('ev-type').value,
            cliente_id: document.getElementById('ev-client').value || null,
            data_hora,
            observacoes: document.getElementById('ev-notes').value,
          });
          toast('Compromisso agendado! 📅');
          // Navigate calendar to the month of the new event
          const [y, m] = date.split('-').map(Number);
          currentYear = y; currentMonth = m - 1;
          selectedDate = date;
          await refresh();
        } catch (err) {
          toast('Erro: ' + err.message, 'error');
        }
      }
    });
  }

  // ── Global handlers ────────────────────────────────────────────
  window.calSelectDay = (dateStr) => {
    selectedDate = dateStr;
    renderCalendar();
    renderDayPanel(dateStr);
    // On mobile, scroll to the panel
    document.getElementById('cal-day-panel-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.calAddEvent = (dateStr) => showAddModal(dateStr);

  // ── Build page HTML ────────────────────────────────────────────
  const pc = document.getElementById('page-content');
  if (!pc) return;

  pc.innerHTML = `
    <style>
      .cal-wrap { display:grid; grid-template-columns:1fr 280px; gap:20px; }
      @media (max-width: 768px) { .cal-wrap { grid-template-columns:1fr; } }

      .cal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
      .cal-nav { display:flex; gap:8px; align-items:center; }
      .cal-nav-btn { background:white; border:1px solid var(--border); border-radius:8px; padding:6px 12px; cursor:pointer; font-size:0.85rem; font-weight:600; transition:all 0.15s; }
      .cal-nav-btn:hover { background:var(--green-50); border-color:var(--green-400); }
      .cal-title-text { font-size:1.1rem; font-weight:700; color:var(--text-dark); min-width:160px; text-align:center; }

      .cal-weekdays { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; margin-bottom:4px; }
      .cal-weekday { text-align:center; font-size:0.7rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; padding:6px 0; }

      .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; }
      .cal-cell { min-height:68px; background:white; border:1px solid var(--border); border-radius:8px; padding:6px 7px; cursor:pointer; transition:all 0.15s; position:relative; }
      .cal-cell:hover { border-color:var(--green-400); background:var(--green-50); }
      .cal-cell-empty { background:transparent; border:1px solid transparent; cursor:default; }
      .cal-today { border-color:var(--green-500) !important; background:var(--green-50) !important; }
      .cal-today .cal-day-num { background:var(--green-600); color:white; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; font-weight:700; }
      .cal-selected { border-color:#6366f1 !important; background:#eef2ff !important; box-shadow: 0 0 0 2px #6366f133; }
      .cal-day-num { font-size:0.8rem; font-weight:600; color:var(--text-dark); display:block; margin-bottom:3px; }
      .cal-dots { display:flex; align-items:center; gap:1px; flex-wrap:wrap; }

      .cal-panel { position:sticky; top:20px; }
      .cal-panel-card { background:white; border:1px solid var(--border); border-radius:12px; overflow:hidden; }
      .cal-panel-header { padding:14px 16px; border-bottom:1px solid var(--border); background:var(--green-50); }
      .cal-panel-title { font-size:0.9rem; font-weight:700; color:var(--text-dark); }
      .cal-panel-body { padding:12px; min-height:200px; }
    </style>

    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <button class="btn btn-primary" id="btn-add-event">+ Agendar Compromisso</button>
    </div>

    <div class="cal-wrap">
      <!-- Left: Calendar -->
      <div>
        <div class="cal-header">
          <div class="cal-nav">
            <button class="cal-nav-btn" id="cal-prev">‹</button>
            <span class="cal-title-text" id="cal-title">...</span>
            <button class="cal-nav-btn" id="cal-next">›</button>
          </div>
          <button class="cal-nav-btn" id="cal-today-btn" title="Ir para hoje">Hoje</button>
        </div>

        <div class="cal-weekdays">
          ${['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => `<div class="cal-weekday">${d}</div>`).join('')}
        </div>
        <div class="cal-grid" id="cal-grid"></div>
      </div>

      <!-- Right: Day detail panel -->
      <div class="cal-panel" id="cal-day-panel-wrap">
        <div class="cal-panel-card">
          <div class="cal-panel-header">
            <div class="cal-panel-title" id="cal-day-title">Selecione um dia</div>
          </div>
          <div class="cal-panel-body" id="cal-day-panel">
            <div style="text-align:center;padding:24px;color:var(--text-muted);font-size:0.85rem">
              Clique em um dia no calendário para ver os eventos
            </div>
          </div>
        </div>
      </div>
    </div>`;

  // Bind header buttons
  pc.querySelector('#btn-add-event').addEventListener('click', () => showAddModal(selectedDate));
  pc.querySelector('#cal-prev').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
  });
  pc.querySelector('#cal-next').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
  });
  pc.querySelector('#cal-today-btn').addEventListener('click', () => {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    selectedDate = now.toISOString().slice(0, 10);
    renderCalendar();
    renderDayPanel(selectedDate);
  });

  await refresh();
}


export async function renderFollowup(router) {
  renderLayout(router, 'Follow-up Pós-venda',
    `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando...</div>`,
    'followup');

  let clients = [];
  let followups = [];

  // ── Browser Notification helper ────────────────────────────────
  async function requestNotifPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return await Notification.requestPermission();
  }

  function scheduleNotification(followup, clientName) {
    const dueRaw = followup.due_date_time || followup.dueDateTime;
    if (!dueRaw) return;
    const fireAt = new Date(dueRaw).getTime();
    const now = Date.now();
    const MAX_DELAY = 7 * 24 * 60 * 60 * 1000;

    const reminders = [
      { offset: 24 * 60 * 60 * 1000, label: '1 dia antes ⏰', body: `Oi ${clientName}, amanhã entraremos em contato! Fique de olho no WhatsApp. 💚` },
      { offset: 60 * 60 * 1000, label: '1 hora antes ⏰', body: `Oi ${clientName}, em 1 hora vou entrar em contato com você! 💚` },
      { offset: 10 * 60 * 1000, label: '10 min antes ⏰', body: `Oi ${clientName}, em 10 minutos falarei com você! Prepare-se. 💚` },
    ];

    reminders.forEach(({ offset, label, body }) => {
      const delay = fireAt - offset - now;
      if (delay <= 0 || delay > MAX_DELAY) return;
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          const n = new Notification(`${label} — ${clientName}`, {
            body,
            icon: '/favicon.ico',
            tag: `fu-${followup.id}-${offset}`,
          });
          n.onclick = function() {
            window.focus();
            window.location.hash = '/followup';
            n.close();
          };
        }
      }, delay);
    });
  }

  function makeGoogleCalendarUrl(followup, clientName, clientPhone) {
    const dueRaw = followup.due_date_time || followup.dueDateTime;
    if (!dueRaw) return null;
    const start = new Date(dueRaw);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const fmt = d => d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const phone = (clientPhone || '').replace(/\D/g, '');
    const details = [
      followup.nota || followup.note,
      phone ? `\nWhatsApp: https://wa.me/55${phone}` : ''
    ].filter(Boolean).join('');
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `💬 Follow-up: ${clientName}`,
      details,
      dates: `${fmt(start)}/${fmt(end)}`,
    });
    return `https://calendar.google.com/calendar/render?${params}&rem=1440&rem=0`;
  }

  function makeWhatsAppUrl(followup, client) {
    const phone = (client?.telefone || client?.phone || '').replace(/\D/g, '');
    const clientName = client?.nome || client?.name || 'você';
    const msg = encodeURIComponent(
      `Oi ${clientName}, combinamos que eu entraria em contato hoje com você. Lembra? Podemos conversar agora? 💚`
    );
    return phone ? `https://wa.me/55${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
  }

  // ── Render list ────────────────────────────────────────────────
  function renderList() {
    const container = document.getElementById('followup-list');
    if (!container) return;

    const pending = followups.filter(f => f.status !== 'done');
    const done = followups.filter(f => f.status === 'done');

    // Update counter in header
    const counter = document.getElementById('fu-counter');
    if (counter) counter.textContent = `${pending.length} pendente(s)`;

    if (followups.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💬</div><h4>Nenhum follow-up</h4>
        <p>Registre ações de acompanhamento pós-venda para fidelizar seus clientes</p></div>`;
      return;
    }

    function renderCard(f) {
      // Normalize campos — API retorna snake_case, localStorage usava camelCase
      const clienteId = f.cliente_id || f.clientId;
      const nota = f.nota || f.note || '';
      const dueRaw = f.due_date_time || f.dueDateTime;
      const clientName = f.cliente_nome || clients.find(c => c.id === clienteId)?.nome || clients.find(c => c.id === clienteId)?.name || 'Cliente';
      const clientPhone = f.cliente_telefone || clients.find(c => c.id === clienteId)?.telefone || clients.find(c => c.id === clienteId)?.phone || '';
      const clientEmail = f.cliente_email || clients.find(c => c.id === clienteId)?.email || '';

      let statusLabel = '', statusColor = '', statusBg = '';

      if (f.status === 'done') {
        statusLabel = '✅ Concluído'; statusColor = '#166534'; statusBg = '#dcfce7';
      } else {
        const now = new Date();
        const due = dueRaw ? new Date(dueRaw) : null;
        if (!due) {
          statusLabel = '⏳ Pendente'; statusColor = '#854d0e'; statusBg = '#fef9c3';
        } else if (due < now && due.toDateString() !== now.toDateString()) {
          statusLabel = '⚠️ Atrasado'; statusColor = '#991b1b'; statusBg = '#fee2e2';
        } else if (due.toDateString() === now.toDateString()) {
          statusLabel = '🔥 HOJE'; statusColor = '#b45309'; statusBg = '#ffedd5';
        } else {
          statusLabel = '⏳ Pendente'; statusColor = '#1e40af'; statusBg = '#dbeafe';
        }
      }

      const fakeClient = { nome: clientName, telefone: clientPhone };
      const gcalUrl = makeGoogleCalendarUrl(f, clientName, clientPhone);
      const waUrl = makeWhatsAppUrl(f, fakeClient);
      const initials = clientName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
      const borderColor = { '✅ Concluído': '#22c55e', '⏳ Pendente': '#3b82f6', '⚠️ Atrasado': '#ef4444', '🔥 HOJE': '#f59e0b' }[statusLabel] || '#f59e0b';

      return `
        <div class="card" style="margin-bottom:12px;border-left:4px solid ${borderColor}">
          <div style="padding:16px 18px">
            <div style="display:flex;align-items:flex-start;gap:12px">
              <div class="client-avatar-sm" style="flex-shrink:0">${initials}</div>
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
                  <span style="font-weight:700;font-size:0.95rem">${clientName}</span>
                  <span style="background:${statusBg};color:${statusColor};font-size:0.72rem;padding:2px 8px;border-radius:10px">${statusLabel}</span>
                </div>
                <div style="color:var(--text-body);font-size:0.88rem;margin-bottom:8px">${nota}</div>
                <div style="font-size:0.78rem;color:var(--text-muted);display:flex;gap:12px;flex-wrap:wrap">
                  ${dueRaw ? `<span>📅 ${new Date(dueRaw).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} às ${new Date(dueRaw).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>` : ''}
                  ${clientEmail ? `<span>✉️ ${clientEmail}</span>` : ''}
                  ${clientPhone ? `<span>📱 ${clientPhone}</span>` : ''}
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;align-items:flex-end">
                ${f.status !== 'done' ? `<button class="btn btn-primary btn-sm" data-done="${f.id}">✅ Concluir</button>` : ''}
                <a class="btn btn-sm" style="background:#25D366;color:white;text-decoration:none;display:flex;align-items:center;gap:4px"
                  href="${waUrl}" target="_blank">📱 WhatsApp</a>
                ${gcalUrl ? `<a class="btn btn-secondary btn-sm" href="${gcalUrl}" target="_blank" style="text-decoration:none;display:flex;align-items:center;gap:4px">📆 Agenda</a>` : ''}
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

    // Bind events
    container.querySelectorAll('[data-done]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await store.updateFollowupStatus(btn.dataset.done, 'done');
          const fu = followups.find(f => f.id === btn.dataset.done);
          if (fu) fu.status = 'done';
          renderList();
          toast('Follow-up concluído! ✅');
        } catch (e) {
          toast('Erro ao atualizar: ' + e.message, 'error');
        }
      });
    });

    container.querySelectorAll('[data-del-fu]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await store.deleteFollowup(btn.dataset.delFu);
          followups = followups.filter(f => f.id !== btn.dataset.delFu);
          renderList();
          toast('Follow-up removido.', 'warning');
        } catch (e) {
          toast('Erro ao remover: ' + e.message, 'error');
        }
      });
    });
  }

  // ── Show add modal ─────────────────────────────────────────────
  async function showAddModal() {
    await requestNotifPermission();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().slice(0, 10);

    modal('Novo Follow-up', `
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Cliente *</label>
          <div style="position:relative">
            <input class="field-input" id="fu-client-search" placeholder="🔍 Buscar cliente pelo nome..." autocomplete="off" />
            <input type="hidden" id="fu-client" />
            <div id="fu-client-dropdown"
              style="display:none;position:absolute;top:100%;left:0;right:0;z-index:999;
                     background:#fff;border:1px solid var(--border);border-radius:10px;
                     box-shadow:0 8px 24px rgba(0,0,0,0.12);max-height:220px;overflow-y:auto;margin-top:4px">
            </div>
          </div>
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Anotação / Tarefa *</label>
          <textarea class="field-textarea" id="fu-note" rows="3" placeholder="Ex: Verificar resultado após 30 dias, enviar protocolo atualizado..."></textarea>
        </div>
        <div class="form-group">
          <label class="field-label">📅 Data do lembrete</label>
          <input class="field-input" id="fu-date" type="date" value="${defaultDate}" />
        </div>
        <div class="form-group">
          <label class="field-label">🕐 Horário</label>
          <input class="field-input" id="fu-time" type="time" value="09:00" />
        </div>
        <div style="background:#f0fdf4;border-radius:8px;padding:12px;font-size:0.82rem;color:#1a4731" class="form-group form-field-full">
          📅 Após salvar, clique em <strong>📆 Adicionar ao Google Agenda</strong> no card do follow-up.
        </div>
      </div>`, {
      confirmLabel: '💾 Salvar Follow-up',
      onOpen: () => {
        const searchInput = document.getElementById('fu-client-search');
        const hiddenInput = document.getElementById('fu-client');
        const dropdown = document.getElementById('fu-client-dropdown');

        function renderDropdown(query) {
          const q = query.toLowerCase().trim();
          const matches = q ? clients.filter(c => (c.nome || c.name || '').toLowerCase().includes(q)) : clients;
          if (!matches.length) {
            dropdown.innerHTML = `<div style="padding:12px 16px;color:var(--text-muted);font-size:0.9rem">Nenhum cliente encontrado</div>`;
          } else {
            dropdown.innerHTML = matches.map(c => {
              const name = c.nome || c.name || '';
              const phone = c.telefone || c.phone || '';
              const hl = name.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                '<strong style="color:var(--green-700)">$1</strong>');
              return `<div data-id="${c.id}" data-name="${name}"
                style="padding:10px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;
                       border-bottom:1px solid var(--border);transition:background 0.15s"
                onmouseover="this.style.background='var(--green-50)'"
                onmouseout="this.style.background=''">
                <div style="width:32px;height:32px;border-radius:50%;background:var(--green-100);
                            color:var(--green-700);font-weight:700;display:flex;align-items:center;
                            justify-content:center;flex-shrink:0;font-size:0.85rem">
                  ${name[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style="font-size:0.92rem">${hl}</div>
                  ${phone ? `<div style="font-size:0.75rem;color:var(--text-muted)">${phone}</div>` : ''}
                </div>
              </div>`;
            }).join('');
          }
          dropdown.style.display = 'block';
        }

        searchInput.addEventListener('input', () => { hiddenInput.value = ''; renderDropdown(searchInput.value); });
        searchInput.addEventListener('focus', () => renderDropdown(searchInput.value));
        dropdown.addEventListener('mousedown', e => {
          const item = e.target.closest('[data-id]');
          if (!item) return;
          hiddenInput.value = item.dataset.id;
          searchInput.value = item.dataset.name;
          dropdown.style.display = 'none';
        });
        document.addEventListener('click', e => {
          if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) dropdown.style.display = 'none';
        }, { capture: true });
      },
      onConfirm: async () => {
        const clientId = document.getElementById('fu-client').value;
        const nota = document.getElementById('fu-note').value.trim();
        if (!clientId) { toast('Selecione um cliente na lista de sugestões', 'error'); return; }
        if (!nota) { toast('Preencha a anotação / tarefa', 'error'); return; }
        const date = document.getElementById('fu-date').value;
        const time = document.getElementById('fu-time').value || '09:00';
        const due_date_time = date ? `${date}T${time}:00` : null;
        try {
          const novo = await store.addFollowup({ cliente_id: clientId, nota, due_date_time });
          followups.unshift(novo);
          toast('Follow-up salvo! 💬 Clique em "📆 Agenda" para adicionar ao Google Calendar.', 'success');
          renderList();
          return true;
        } catch (e) {
          toast('Erro ao salvar: ' + e.message, 'error');
        }
      }
    });
  }

  // ── Load ───────────────────────────────────────────────────────
  [clients, followups] = await Promise.all([
    store.getClients().catch(() => []),
    store.getFollowups().catch(() => []),
  ]);

  // ── Agendar notificações dos pendentes ──
  const perm = await requestNotifPermission();
  if (perm === 'granted') {
    followups.filter(f => f.status === 'pending' && (f.due_date_time || f.dueDateTime)).forEach(f => {
      const name = f.cliente_nome || clients.find(c => c.id === (f.cliente_id || f.clientId))?.nome || 'Cliente';
      scheduleNotification(f, name);
    });
  }

  // ── Build page ─────────────────────────────────────────────────
  const pc = document.getElementById('page-content');
  if (pc) pc.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div id="fu-counter" style="font-size:0.9rem;color:var(--text-muted)">
        ${followups.filter(f => f.status === 'pending').length} pendente(s)
      </div>
      <button class="btn btn-primary" id="btn-add-fu">+ Novo Follow-up</button>
    </div>
    <div id="followup-list"></div>`;

  document.getElementById('btn-add-fu')?.addEventListener('click', showAddModal);
  renderList();
}
