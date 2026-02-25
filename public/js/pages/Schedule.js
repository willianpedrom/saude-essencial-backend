import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { formatDate, toast, modal } from '../utils.js';

export function renderSchedule(router) {
    const cid = auth.current.id;
    const clients = store.getClients(cid);

    function renderEvents() {
        const events = store.getSchedule(cid).sort((a, b) => new Date(a.date + a.time) - new Date(b.date + b.time));
        const container = document.getElementById('events-list');
        if (!container) return;
        const today = new Date().toISOString().slice(0, 10);
        const upcoming = events.filter(e => e.date >= today);
        const past = events.filter(e => e.date < today);
        container.innerHTML = upcoming.length === 0 && past.length === 0
            ? `<div class="empty-state"><div class="empty-state-icon">📅</div><h4>Nenhuma reunião agendada</h4><p>Agende reuniões com seus clientes e nunca perca um compromisso</p></div>`
            : `
        ${upcoming.length > 0 ? `<div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">PRÓXIMAS</div>
        ${upcoming.map(e => eventCard(e, clients)).join('')}` : ''}
        ${past.length > 0 ? `<div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:20px 0 10px">REALIZADAS</div>
        ${past.map(e => eventCard(e, clients, true)).join('')}` : ''}`;

        container.querySelectorAll('[data-del-event]').forEach(btn => {
            btn.addEventListener('click', () => {
                store.deleteSchedule(cid, btn.dataset.delEvent);
                renderEvents();
                toast('Evento removido.', 'warning');
            });
        });
    }

    function eventCard(e, clients, isPast = false) {
        const c = clients.find(cl => cl.id === e.clientId);
        const types = { meeting: '🤝 Reunião', call: '📞 Ligação', followup: '💬 Follow-up', delivery: '📦 Entrega', other: '📌 Outro' };
        return `
      <div class="schedule-event ${isPast ? '' : 'gold'}" style="margin-bottom:10px;opacity:${isPast ? '0.6' : '1'}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div class="schedule-event-title">${e.title}</div>
            <div class="schedule-event-meta">
              ${types[e.type] || '📌'} · 📅 ${formatDate(e.date)}${e.time ? ' ⏰ ' + e.time : ''}${c ? ' · 👤 ' + c.name : ''}
            </div>
            ${e.notes ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px">${e.notes}</div>` : ''}
          </div>
          ${!isPast ? `<button class="btn btn-danger btn-sm" data-del-event="${e.id}">🗑️</button>` : ''}
        </div>
      </div>`;
    }

    function showAddModal() {
        modal('Nova Reunião / Compromisso', `
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Título *</label>
          <input class="field-input" id="ev-title" placeholder="Ex: Apresentação de Produtos, Follow-up..." />
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
            ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
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
          <textarea class="field-textarea" id="ev-notes" placeholder="Detalhes, tópicos a abordar..."></textarea>
        </div>
      </div>`, {
            confirmLabel: 'Agendar',
            onConfirm: () => {
                const title = document.getElementById('ev-title').value.trim();
                if (!title) { toast('Título obrigatório', 'error'); return; }
                store.addSchedule(cid, {
                    title, type: document.getElementById('ev-type').value,
                    clientId: document.getElementById('ev-client').value || null,
                    date: document.getElementById('ev-date').value,
                    time: document.getElementById('ev-time').value,
                    notes: document.getElementById('ev-notes').value,
                });
                renderEvents();
                toast('Compromisso agendado! 📅');
            }
        });
    }

    const html = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
      <button class="btn btn-primary" id="btn-add-event">+ Agendar Compromisso</button>
    </div>
    <div id="events-list"></div>`;

    renderLayout(router, 'Agenda de Reuniões', html, 'schedule');
    renderEvents();
    document.getElementById('btn-add-event').addEventListener('click', showAddModal);
}

// ================ FOLLOW-UP ================
export function renderFollowup(router) {
    const cid = auth.current.id;
    const clients = store.getClients(cid);

    function renderList() {
        const followups = store.getFollowups(cid).sort((a, b) => {
            const priority = { overdue: 0, pending: 1, done: 2 };
            const statusA = a.status === 'pending' && a.dueDate && new Date(a.dueDate) < new Date() ? 'overdue' : a.status;
            const statusB = b.status === 'pending' && b.dueDate && new Date(b.dueDate) < new Date() ? 'overdue' : b.status;
            return (priority[statusA] || 1) - (priority[statusB] || 1);
        });
        const container = document.getElementById('followup-list');
        if (!container) return;
        container.innerHTML = followups.length === 0
            ? `<div class="empty-state"><div class="empty-state-icon">💬</div><h4>Nenhum follow-up cadastrado</h4>
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
                  <div style="font-weight:600;font-size:0.93rem">${c?.name || 'Cliente'}</div>
                  <div style="color:var(--text-body);margin:4px 0">${f.note}</div>
                  <div style="font-size:0.78rem;color:var(--text-muted)">
                    ${f.dueDate ? '📅 ' + formatDate(f.dueDate) : ''} · ${statusLabel}
                  </div>
                </div>
                <div style="display:flex;gap:6px;flex-shrink:0">
                  ${f.status !== 'done' ? `<button class="btn btn-secondary btn-sm" data-done="${f.id}">✅ Concluir</button>` : ''}
                  ${c?.phone ? `<a class="btn btn-sm" style="background:#25D366;color:white" href="https://wa.me/${c.phone}" target="_blank">📱 WhatsApp</a>` : ''}
                </div>
              </div>
            </div>`;
            }).join('');

        container.querySelectorAll('[data-done]').forEach(btn => {
            btn.addEventListener('click', () => {
                store.updateFollowup(cid, btn.dataset.done, { status: 'done' });
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
            ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Anotação / Tarefa *</label>
          <textarea class="field-textarea" id="fu-note" placeholder="Ex: Verificar resultado após 30 dias de uso do protocolo..."></textarea>
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
                if (!clientId || !note) { toast('Cliente e anotação são obrigatórios', 'error'); return; }
                store.addFollowup(cid, { clientId, note, dueDate: document.getElementById('fu-due').value });
                renderList();
                toast('Follow-up registrado! 💬');
            }
        });
    }

    const html = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
      <button class="btn btn-primary" id="btn-add-fu">+ Novo Follow-up</button>
    </div>
    <div id="followup-list"></div>`;

    renderLayout(router, 'Follow-up Pós-venda', html, 'followup');
    renderList();
    document.getElementById('btn-add-fu').addEventListener('click', showAddModal);
}
