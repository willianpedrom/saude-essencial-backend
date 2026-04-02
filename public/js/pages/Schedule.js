import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { formatDate, toast, modal } from '../utils.js';

// ───────────── AGENDA INTELIGENTE (Agendamentos + Follow-ups) ─────────────
export async function renderSchedule(router) {
  renderLayout(router, 'Agenda & Follow-ups',
    `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando...</div>`,
    'schedule');

  let clients = [];
  let events = [];
  let followups = [];
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth(); // 0-based
  let selectedDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const TYPES = { meeting: '🤝 Reunião', call: '📞 Ligação', followup: '💬 Ligação/Reunião', delivery: '📦 Entrega', other: '📌 Outro' };

  async function refresh() {
    [clients, events, followups] = await Promise.all([
      store.getClients().catch(() => []),
      store.getAgendamentos().catch(() => []),
      store.getFollowups().catch(() => []),
    ]);
    renderCalendar();
    renderDayPanel(selectedDate);
    renderPendingTasks();
  }

  // ── Browser Notification helper ──
  async function requestNotifPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return await Notification.requestPermission();
  }

  function scheduleNotification(item, clientName, isFollowup) {
    const dueRaw = isFollowup ? (item.due_date_time || item.dueDateTime) : (item.data_hora);
    if (!dueRaw) return;
    const fireAt = new Date(dueRaw).getTime();
    const now = Date.now();
    const MAX_DELAY = 7 * 24 * 60 * 60 * 1000;
    
    // Agendamentos vs Followups têm labels diferentes
    const labelPrefix = isFollowup ? 'Follow-up' : 'Compromisso';

    const reminders = [
      { offset: 60 * 60 * 1000, label: `1 hora antes ⏰`, body: `Oi ${clientName}, em 1 hora temos nosso contato/compromisso! 💚` },
      { offset: 10 * 60 * 1000, label: `10 min antes ⏰`, body: `Oi ${clientName}, em 10 minutos iniciaremos! Prepare-se. 💚` },
    ];

    reminders.forEach(({ offset, label, body }) => {
      const delay = fireAt - offset - now;
      if (delay <= 0 || delay > MAX_DELAY) return;
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          const n = new Notification(`${labelPrefix}: ${label} — ${clientName}`, {
            body, icon: '/favicon.ico', tag: `notif-${item.id}-${offset}`,
          });
          n.onclick = function() { window.focus(); window.location.hash = '/schedule'; n.close(); };
        }
      }, delay);
    });
  }

  // ── Utils para Extração de Datas ──
  function getDateStr(e, isFollowup=false) {
    const dt = isFollowup ? (e.due_date_time || e.dueDateTime) : (e.data_hora || (e.date ? e.date + 'T' + (e.time || '00:00') : null));
    return dt ? dt.slice(0, 10) : null;
  }

  function getDotColor(item, isFollowup) {
    if (isFollowup) {
        if (item.status === 'done') return '#166534'; // Verde escuro
        return '#f59e0b'; // Laranja
    }
    const map = { meeting: '#6366f1', call: '#0891b2', followup: '#16a34a', delivery: '#d97706', other: '#9ca3af' };
    return map[item.tipo] || '#9ca3af';
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

    const eventMap = {};
    events.forEach(e => { const d = getDateStr(e, false); if(d) { eventMap[d] = eventMap[d] || []; eventMap[d].push({ ...e, _isFu: false }); } });
    followups.forEach(f => { 
        if (f.status === 'done') return; // Hide done followups from future calendar grid to avoid clutter
        const d = getDateStr(f, true); 
        if(d) { eventMap[d] = eventMap[d] || []; eventMap[d].push({ ...f, _isFu: true }); } 
    });

    let cells = '';
    for (let i = 0; i < startDow; i++) { cells += `<div class="cal-cell cal-cell-empty"></div>`; }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayItems = eventMap[dateStr] || [];
      const isToday = dateStr === today;
      const isSelected = dateStr === selectedDate;

      const dots = dayItems.slice(0, 3).map(item =>
        `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${getDotColor(item, item._isFu)};margin:0 1px"></span>`
      ).join('');

      cells += `
        <div class="cal-cell${isToday ? ' cal-today' : ''}${isSelected ? ' cal-selected' : ''}"
             data-date="${dateStr}" onclick="window.calSelectDay('${dateStr}')">
          <span class="cal-day-num">${d}</span>
          ${dayItems.length > 0 ? `<div class="cal-dots">${dots}${dayItems.length > 3 ? `<span style="font-size:0.6rem;color:var(--text-muted)">+${dayItems.length - 3}</span>` : ''}</div>` : ''}
        </div>`;
    }

    grid.innerHTML = cells;
  }

  // ── Links Builders ──
  function makeGoogleCalendarUrl(item, isFollowup, clientName, clientPhone) {
    const dueRaw = isFollowup ? (item.due_date_time || item.dueDateTime) : (item.data_hora);
    if (!dueRaw) return null;
    const start = new Date(dueRaw);
    const end = new Date(start.getTime() + (isFollowup ? 30 : 60) * 60 * 1000); // 30m para fup, 1h para reunião
    const fmt = d => d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const phone = (clientPhone || '').replace(/\D/g, '');
    const notes = isFollowup ? (item.nota || item.note) : (item.observacoes || item.notes);
    const titleText = isFollowup ? `💬 Follow-up: ${clientName}` : `${TYPES[item.tipo] || '📌'} ${item.titulo || 'Evento'} com ${clientName}`;
    const details = [
      notes,
      phone ? `\nWhatsApp: https://wa.me/55${phone}` : ''
    ].filter(Boolean).join('');
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: titleText,
      details,
      dates: `${fmt(start)}/${fmt(end)}`,
    });
    return `https://calendar.google.com/calendar/render?${params}&rem=1440&rem=0`;
  }
  
  function makeWhatsAppUrl(clientName, clientPhone, isFollowup=false) {
    const phone = clientPhone.replace(/\D/g, '');
    let msg = `Olá ${clientName}, tudo bem? Estou entrando em contato referente à nossa reunião hoje.`;
    if (isFollowup) {
      msg = `Oi ${clientName}, combinamos que eu entraria em contato hoje com você. Lembra? Podemos conversar agora? 💚`;
    }
    const safeMsg = encodeURIComponent(msg);
    return phone ? `https://wa.me/55${phone}?text=${safeMsg}` : `https://wa.me/?text=${safeMsg}`;
  }

  // ── Day Panel (Timeline) ─────────────────────────────────────────
  function renderDayPanel(dateStr) {
    const panel = document.getElementById('cal-day-panel');
    const panelTitle = document.getElementById('cal-day-title');
    if (!panel || !panelTitle) return;

    const currentEvts = events.filter(e => getDateStr(e, false) === dateStr).map(e => ({...e, _isFu: false, _time: e.data_hora}));
    const currentFups = followups.filter(f => getDateStr(f, true) === dateStr).map(f => ({...f, _isFu: true, _time: (f.due_date_time || f.dueDateTime)}));
    
    // Sort chronologically
    const allEvents = [...currentEvts, ...currentFups].sort((a,b) => (a._time||'').localeCompare(b._time||''));

    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    panelTitle.textContent = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    if (allEvents.length === 0) {
      panel.innerHTML = `
        <div style="text-align:center;padding:32px 16px;color:var(--text-muted)">
          <div style="font-size:2.2rem;margin-bottom:8px">📅</div>
          <div style="font-size:0.9rem">Nenhuma atividade agendada</div>
          <div style="display:flex;gap:10px;justify-content:center;margin-top:16px">
            <button class="btn btn-secondary btn-sm" onclick="window.calAddEvent('${dateStr}')">+ Evento</button>
            <button class="btn btn-primary btn-sm" onclick="window.calAddFollowup('${dateStr}')">+ Follow-up</button>
          </div>
        </div>`;
      return;
    }

    panel.innerHTML = allEvents.map(e => {
      const clienteId = e.cliente_id || e.clientId;
      const c = clients.find(cl => cl.id === clienteId);
      const cName = c?.nome || c?.name || e.cliente_nome || 'Cliente';
      const cPhone = c?.telefone || c?.phone || e.cliente_telefone || '';

      const dtStr = e._time;
      const timeStr = dtStr ? new Date(dtStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
      const isPast = typeof dtStr === 'string' ? dtStr.slice(0, 10) < new Date().toISOString().slice(0, 10) : false;
      const doneOpacity = (e._isFu && e.status === 'done') ? 0.5 : 1;

      // Variables vary depending on event type
      let icon = '', titulo = '', obs = '', color = '';
      if (e._isFu) {
        icon = '💬'; titulo = 'Follow-up / Acompanhamento'; obs = e.nota || e.note || ''; color = '#f59e0b';
      } else {
        const tDesc = TYPES[e.tipo] || '📌'; icon = tDesc.split(' ')[0]; titulo = e.titulo || e.title || 'Evento'; obs = e.observacoes || e.notes || ''; color = getDotColor(e, false);
      }
      
      const gcal = makeGoogleCalendarUrl(e, e._isFu, cName, cPhone);
      const wa = makeWhatsAppUrl(cName, cPhone, e._isFu);

      return `
        <div style="padding:14px 16px;border-radius:12px;margin-bottom:10px;
                    background:${isPast ? '#f8fafc' : 'white'};border:1px solid var(--border);
                    border-left:4px solid ${color};opacity:${doneOpacity};position:relative;
                    box-shadow:0 1px 3px rgba(0,0,0,0.02)">
                    
          ${e._isFu && e.status === 'done' ? '<div style="position:absolute;top:10px;right:10px;font-size:0.75rem;color:#16a34a;font-weight:700">✅ Concluído</div>' : ''}
          ${e._isFu && e.status !== 'done' && isPast ? '<div style="position:absolute;top:10px;right:10px;font-size:0.7rem;color:#dc2626;font-weight:700;background:#fee2e2;padding:2px 6px;border-radius:8px">ATRASADO</div>' : ''}

          <div style="display:flex;align-items:flex-start;gap:12px">
            <div style="font-size:1.4rem;padding-top:2px;user-select:none">${icon}</div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:0.95rem;color:var(--text-dark)">${titulo}</div>
              <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                <span style="font-weight:700;color:var(--green-700)">${timeStr||'Dia Inteiro'}</span> • <span>👤 ${cName}</span>
              </div>
              ${obs ? `<div style="font-size:0.82rem;color:var(--text-body);margin-top:6px;line-height:1.4">${obs}</div>` : ''}
              
              <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
                ${(e._isFu && e.status !== 'done') ? `<button class="btn btn-sm btn-action" style="background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;font-weight:700" onclick="window.calDoneFu('${e.id}')">✓ Feito</button>` : ''}
                <a class="btn btn-sm" href="${wa}" target="_blank" style="background:#25D366;color:white;text-decoration:none">📱</a>
                ${gcal ? `<a class="btn btn-sm" href="${gcal}" target="_blank" style="background:#f3f4f6;color:#374151;text-decoration:none">📆</a>` : ''}
                <button class="btn btn-sm" style="background:#f3f4f6;color:#374151;padding:4px 8px" onclick="window.calEditEvent('${e.id}', ${e._isFu})" title="Editar">✏️</button>
                <button class="btn btn-sm" style="background:transparent;color:#9ca3af;padding:4px 6px" onclick="window.calDelEvent('${e.id}', ${e._isFu})" title="Apagar">🗑️</button>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  // ── Pending Tasks (Right Column Alternative or Appended) ───────
  function renderPendingTasks() {
      // Collect overdue followups
      const nowStr = new Date().toISOString().slice(0, 10);
      const overdue = followups.filter(f => f.status !== 'done' && (getDateStr(f, true) < nowStr || !getDateStr(f, true))).sort((a,b)=> (a.due_date_time||'').localeCompare(b.due_date_time||''));
      
      const pendingContainer = document.getElementById('cal-pending-panel');
      if (!pendingContainer) return;
      
      if (overdue.length === 0) {
          pendingContainer.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.85rem">Nenhuma pendência atrasada. Excelente! 🎉 </div>';
          return;
      }
      
      pendingContainer.innerHTML = overdue.map(f => {
          const cId = f.cliente_id || f.clientId;
          const c = clients.find(cl => cl.id === cId);
          const cName = c?.nome || c?.name || f.cliente_nome || 'Cliente';
          const dtStr = f.due_date_time || f.dueDateTime;
          const label = dtStr ? new Date(dtStr).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}) : '';
          return `
          <div style="background:#fee2e2;border-left:3px solid #ef4444;border-radius:8px;padding:10px 12px;margin-bottom:8px;font-size:0.82rem;display:flex;align-items:center;justify-content:space-between">
            <div>
                <div style="font-weight:700;color:#991b1b;margin-bottom:2px">👤 ${cName} <span style="opacity:0.6;font-weight:500;margin-left:4px">${label}</span></div>
                <div style="color:#b91c1c">${f.nota || f.note || ''}</div>
            </div>
            <div style="display:flex;gap:4px">
              <button class="btn btn-sm" onclick="window.calEditEvent('${f.id}', true)" style="background:transparent;color:#991b1b;border:1px solid #fca5a5;flex-shrink:0" title="Editar">✏️</button>
              <button class="btn btn-sm" onclick="window.calDoneFu('${f.id}')" style="background:#fca5a5;color:#7f1d1d;border:none;flex-shrink:0;" title="Concluir">✓</button>
            </div>
          </div>
          `;
      }).join('');
  }


  // ── Show Add Modais (Agendamento & Followup) ──────────────────────
  // ── Show Add/Edit Modais (Agendamento & Followup) ────────────────
  function showAddAgendamento(prefillDate = '', editData = null) {
    const isEdit = !!editData;
    const clientOpts = clients.map(c => `<option value="${c.id}" ${isEdit && editData.cliente_id === c.id ? 'selected' : ''}>${c.nome || c.name}</option>`).join('');
    
    // Configura valores padrão para edição
    const titleVal = isEdit ? (editData.titulo || editData.title || '') : '';
    const typeVal = isEdit ? (editData.tipo || 'meeting') : 'meeting';
    const notesVal = isEdit ? (editData.observacoes || editData.notes || '') : '';
    let defaultDate = prefillDate || new Date().toISOString().slice(0, 10);
    let defaultTime = '';
    
    if (isEdit && editData.data_hora) {
        defaultDate = editData.data_hora.slice(0, 10);
        defaultTime = editData.data_hora.slice(11, 16);
    }

    modal(isEdit ? 'Editar Evento / Reunião' : 'Novo Evento / Reunião', `
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Título do Evento *</label>
          <input class="field-input" id="ev-title" placeholder="Ex: Apresentação de Óleos..." value="${titleVal}" />
        </div>
        <div class="form-group">
          <label class="field-label">Tipo</label>
          <select class="field-select" id="ev-type">
            <option value="meeting" ${typeVal === 'meeting' ? 'selected' : ''}>🤝 Reunião</option>
            <option value="call" ${typeVal === 'call' ? 'selected' : ''}>📞 Ligação</option>
            <option value="delivery" ${typeVal === 'delivery' ? 'selected' : ''}>📦 Entrega</option>
            <option value="other" ${typeVal === 'other' ? 'selected' : ''}>📌 Outro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="field-label">Cliente Associado</label>
          <select class="field-select" id="ev-client">
            <option value="">— Sem Vínculo —</option>
            ${clientOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="field-label">Dia *</label>
          <input class="field-input" id="ev-date" type="date" value="${defaultDate}" />
        </div>
        <div class="form-group">
          <label class="field-label">Horário (Opcional)</label>
          <input class="field-input" id="ev-time" type="time" value="${defaultTime}" />
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Detalhes</label>
          <textarea class="field-textarea" id="ev-notes" placeholder="Link do zoom, endereço da apresentação...">${notesVal}</textarea>
        </div>
      </div>`, {
      confirmLabel: isEdit ? 'Salvar Alterações' : 'Criar Evento',
      onConfirm: async () => {
        const titulo = document.getElementById('ev-title').value.trim();
        if (!titulo) { toast('Título obrigatório', 'error'); return; }
        const date = document.getElementById('ev-date').value;
        const time = document.getElementById('ev-time').value;
        const data_hora = time ? `${date}T${time}:00` : `${date}T09:00:00`;
        try {
          const payload = {
            titulo, tipo: document.getElementById('ev-type').value,
            cliente_id: document.getElementById('ev-client').value || null, data_hora,
            observacoes: document.getElementById('ev-notes').value,
          };
          
          if (isEdit) {
              await store.updateAgendamento(editData.id, payload);
              toast('Compromisso atualizado! 📅');
          } else {
              await store.addAgendamento(payload);
              toast('Compromisso adicionado à agenda! 📅');
          }
          
          const [y, m] = date.split('-').map(Number);
          currentYear = y; currentMonth = m - 1; selectedDate = date;
          await refresh();
        } catch (err) { toast('Erro: ' + err.message, 'error'); }
      }
    });
  }

  async function showAddFollowup(prefillDate = '', editData = null) {
    await requestNotifPermission();
    const isEdit = !!editData;
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    
    let defaultDate = prefillDate || tomorrow.toISOString().slice(0, 10);
    let defaultTime = '09:00';
    let defaultClientName = '';
    let defaultClientId = '';
    let defaultNote = '';

    if (isEdit) {
        defaultNote = editData.nota || editData.note || '';
        const dtStr = editData.due_date_time || editData.dueDateTime;
        if (dtStr) {
            defaultDate = dtStr.slice(0, 10);
            defaultTime = dtStr.slice(11, 16);
        }
        defaultClientId = editData.cliente_id || editData.clientId;
        const c = clients.find(cl => cl.id === defaultClientId);
        defaultClientName = c?.nome || c?.name || editData.cliente_nome || '';
    }

    modal(isEdit ? 'Editar Follow-up' : 'Novo Follow-up (Acompanhamento)', `
      <div style="margin-bottom:12px;font-size:0.85rem;color:var(--text-muted)">Use para criar um "ping" onde o objetivo é apenas lembrar de falar com o lead ou checar como o cliente está usando os óleos.</div>
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Para qual cliente? *</label>
          <div style="position:relative">
            <input class="field-input" id="fu-client-search" placeholder="🔍 Buscar pelo nome..." autocomplete="off" value="${defaultClientName}" />
            <input type="hidden" id="fu-client" value="${defaultClientId}" />
            <div id="fu-client-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;z-index:999;background:#fff;border:1px solid var(--border);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.12);max-height:220px;overflow-y:auto;margin-top:4px"></div>
          </div>
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">O que devo fazer? *</label>
          <input class="field-input" id="fu-note" placeholder="Ex: Perguntar se o lavanda chegou..." value="${defaultNote}" />
        </div>
        <div class="form-group">
          <label class="field-label">Quando? *</label>
          <input class="field-input" id="fu-date" type="date" value="${defaultDate}" />
        </div>
        <div class="form-group">
          <label class="field-label">Avisar às</label>
          <input class="field-input" id="fu-time" type="time" value="${defaultTime}" />
        </div>
      </div>`, {
      confirmLabel: isEdit ? 'Salvar Follow-up' : 'Criar Follow-up',
      confirmClass: 'btn-secondary',
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
              const name = c.nome || c.name || ''; const phone = c.telefone || c.phone || '';
              const hl = name.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<strong style="color:var(--green-700)">$1</strong>');
              return `<div data-id="${c.id}" data-name="${name}" style="padding:10px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border);transition:background 0.15s" onmouseover="this.style.background='var(--green-50)'" onmouseout="this.style.background=''">
                <div style="width:32px;height:32px;border-radius:50%;background:var(--green-100);color:var(--green-700);font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.85rem">${name[0]?.toUpperCase() || '?'}</div>
                <div><div style="font-size:0.92rem">${hl}</div>${phone ? `<div style="font-size:0.75rem;color:var(--text-muted)">${phone}</div>` : ''}</div>
              </div>`;
            }).join('');
          }
          dropdown.style.display = 'block';
        }

        searchInput.addEventListener('input', () => { hiddenInput.value = ''; renderDropdown(searchInput.value); });
        searchInput.addEventListener('focus', () => renderDropdown(searchInput.value));
        dropdown.addEventListener('mousedown', e => {
          const item = e.target.closest('[data-id]'); if (!item) return;
          hiddenInput.value = item.dataset.id; searchInput.value = item.dataset.name; dropdown.style.display = 'none';
        });
        document.addEventListener('click', e => {
          if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) dropdown.style.display = 'none';
        }, { capture: true });
      },
      onConfirm: async () => {
        const clientId = document.getElementById('fu-client').value;
        const nota = document.getElementById('fu-note').value.trim();
        if (!clientId) { toast('Selecione um cliente na sugestão', 'error'); return; }
        if (!nota) { toast('Preencha a anotação', 'error'); return; }
        const date = document.getElementById('fu-date').value;
        const time = document.getElementById('fu-time').value || '09:00';
        try {
          const payload = { cliente_id: clientId, nota, due_date_time: (date ? `${date}T${time}:00` : null) };
          if (isEdit) {
              await store.updateFollowup(editData.id, payload);
              toast('Follow-up atualizado com sucesso! 💬');
          } else {
              await store.addFollowup(payload);
              toast('Follow-up criado com sucesso! 💬');
          }
          const [y, m] = date.split('-').map(Number);
          currentYear = y; currentMonth = m - 1; selectedDate = date;
          await refresh();
          return true;
        } catch (e) { toast('Erro: ' + e.message, 'error'); }
      }
    });
  }

  // ── Handlers Globais da View ────────────────────────────────────
  window.calSelectDay = (dateStr) => {
    selectedDate = dateStr;
    renderCalendar();
    renderDayPanel(dateStr);
    renderPendingTasks();
    document.getElementById('cal-day-panel-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  window.calAddEvent = (dateStr) => showAddAgendamento(dateStr);
  window.calAddFollowup = (dateStr) => showAddFollowup(dateStr);
  
  window.calEditEvent = (id, isFollowup) => {
      if (isFollowup) {
          const f = followups.find(x => x.id === id);
          if (f) showAddFollowup('', f);
      } else {
          const e = events.find(x => x.id === id);
          if (e) showAddAgendamento('', e);
      }
  };
  window.calDoneFu = async (id) => {
      try {
          await store.updateFollowupStatus(id, 'done');
          toast('✔️ Concluído e contabilizado!');
          const fu = followups.find(f => f.id === id); if(fu) fu.status = 'done';
          renderCalendar(); renderDayPanel(selectedDate); renderPendingTasks();
      } catch (e) { toast('Erro: ' + e.message, 'error'); }
  };
  window.calDelEvent = async (id, isFollowup) => {
      modal('Atenção', 'Apagar esse registro?', {
          confirmLabel: 'Apagar', confirmClass: 'btn-danger',
          onConfirm: async () => {
              try {
                  if (isFollowup) { await store.deleteFollowup(id); followups = followups.filter(f => f.id !== id); }
                  else { await store.deleteAgendamento(id); events = events.filter(e => e.id !== id); }
                  toast('Registro removido da timeline.');
                  renderCalendar(); renderDayPanel(selectedDate); renderPendingTasks();
              } catch(e) { toast(e.message, 'error'); }
          }
      });
  };

  // ── Build page HTML Elements ──────────────────────────────────
  const pc = document.getElementById('page-content');
  if (!pc) return;

  pc.innerHTML = `
    <style>
      /* Layout principal */
      .sched-wrap { display:grid; grid-template-columns:1fr 340px; gap:20px; }
      @media (max-width: 768px) { .sched-wrap { grid-template-columns:1fr; } }

      /* Calendário Compacto Base */
      .cal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
      .cal-nav { display:flex; gap:8px; align-items:center; }
      .cal-nav-btn { background:white; border:1px solid var(--border); border-radius:8px; padding:6px 14px; cursor:pointer; font-size:0.85rem; font-weight:600; color:var(--text-dark); transition:all 0.15s; }
      .cal-nav-btn:hover { background:var(--green-50); border-color:var(--green-400); color:var(--green-700)}
      .cal-title-text { font-size:1.15rem; font-weight:700; color:var(--text-dark); min-width:160px; text-align:center; }

      .cal-weekdays { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; margin-bottom:4px; }
      .cal-weekday { text-align:center; font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; padding:6px 0; }

      .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; padding-bottom: 20px;}
      .cal-cell { min-height:74px; background:white; border:1px solid #eef2f6; border-radius:12px; padding:8px; cursor:pointer; transition:all 0.15s; position:relative; box-shadow:0 1px 2px rgba(0,0,0,0.01)}
      .cal-cell:hover { border-color:var(--green-400); background:var(--green-50); transform:translateY(-1px); box-shadow:0 4px 6px -1px rgba(0,0,0,0.05) }
      .cal-cell-empty { background:transparent; border:none; cursor:default; box-shadow:none;}
      .cal-cell-empty:hover { background:transparent; transform:none;}
      
      .cal-today { border-color:var(--green-500) !important; background:#f0fdf4 !important; }
      .cal-today .cal-day-num { background:var(--green-600); color:white; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-weight:700; }
      .cal-selected { border-color:#6366f1 !important; background:#eef2ff !important; box-shadow: 0 0 0 2px #6366f140; }
      .cal-day-num { font-size:0.85rem; font-weight:700; color:var(--text-dark); display:block; margin-bottom:4px; line-height:1}
      .cal-dots { display:flex; align-items:center; gap:2px; flex-wrap:wrap; margin-top:2px}

      .cal-panel { flex:1; }
      .cal-panel-card { background:transparent; display:flex; flex-direction:column; gap:8px;}
      .cal-panel-title { font-size:1.05rem; font-weight:800; color:var(--text-dark); display:flex; align-items:center; gap:8px; padding-bottom:12px;}
    </style>

    <div style="display:flex;justify-content:flex-end;margin-bottom:20px;gap:12px;flex-wrap:wrap">
      <button class="btn btn-secondary" onclick="window.calAddFollowup('')" style="background:#fff"><span style="font-size:1rem;margin-right:6px">💬</span> Novo Follow-up (Ping)</button>
      <button class="btn btn-primary" onclick="window.calAddEvent('')"><span style="font-size:1rem;margin-right:6px">📆</span> Nova Reunião/Evento</button>
    </div>

    <div class="sched-wrap">
      <!-- Left: Calendar Area & Pendencias -->
      <div>
        <div class="cal-header">
          <div class="cal-nav">
            <button class="cal-nav-btn" id="cal-prev">‹</button>
            <span class="cal-title-text" id="cal-title">...</span>
            <button class="cal-nav-btn" id="cal-next">›</button>
          </div>
          <button class="cal-nav-btn" id="cal-today-btn" title="Ir para o mês atual">Hoje</button>
        </div>

        <div class="cal-weekdays">
          ${['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => `<div class="cal-weekday">${d}</div>`).join('')}
        </div>
        <div class="cal-grid" id="cal-grid"></div>

        <!-- Box de Atrasos -->
        <div style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:16px;margin-top:10px;box-shadow:0 2px 4px rgba(0,0,0,0.02)">
            <h4 style="margin:0 0 12px;font-size:0.9rem;color:var(--text-dark);display:flex;align-items:center;gap:6px">⚠️ Pendências Atrasadas</h4>
            <div id="cal-pending-panel"></div>
        </div>
      </div>

      <!-- Right: Timeline of the Single Day -->
      <div class="cal-panel" id="cal-day-panel-wrap">
        <div class="cal-panel-card">
          <div class="cal-panel-title">
            <div style="width:10px;height:24px;background:var(--green-500);border-radius:4px"></div>
            <span id="cal-day-title">Timeline do Dia</span>
          </div>
          <div id="cal-day-panel" style="min-height:300px;background:#f8fafc;border-radius:16px;padding:16px;border:1px dashed #cbd5e1">
          </div>
        </div>
      </div>
    </div>`;

  // Bind navigation listeners
  pc.querySelector('#cal-prev').addEventListener('click', () => { currentMonth--; if (currentMonth < 0) { currentMonth = 11; currentYear--; } renderCalendar(); });
  pc.querySelector('#cal-next').addEventListener('click', () => { currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } renderCalendar(); });
  pc.querySelector('#cal-today-btn').addEventListener('click', () => { 
      const now = new Date(); currentYear = now.getFullYear(); currentMonth = now.getMonth(); selectedDate = now.toISOString().slice(0, 10);
      renderCalendar(); renderDayPanel(selectedDate);
  });

  await refresh();

  // Schedule background notifications for future items
  if (await requestNotifPermission() === 'granted') {
    const pEvts = events.filter(e => e.data_hora && e.data_hora > new Date().toISOString());
    const pFups = followups.filter(f => f.status !== 'done' && (f.due_date_time || f.dueDateTime));
    pEvts.forEach(e => scheduleNotification(e, e.cliente_nome||'Cliente', false));
    pFups.forEach(f => scheduleNotification(f, f.cliente_nome||'Cliente', true));
  }
}
