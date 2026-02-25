import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { formatDate, getInitials, toast, modal } from '../utils.js';

let cachedAnamneses = null; // lazy-load once per session

export async function renderClients(router) {
  const nome = (auth.current?.nome || auth.current?.name || 'Consultora');

  // Render layout immediately with loading
  renderLayout(router, 'Clientes', `
      <div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando clientes...</div>
    `, 'clients');

  let clients = [];
  let filter = 'all';
  let search = '';

  async function refresh() {
    clients = await store.getClients().catch(() => []);
    renderTable();
  }

  function filtered() {
    return clients.filter(c => {
      const matchStatus = filter === 'all' || c.status === filter;
      const q = search.toLowerCase();
      const matchSearch = !q
        || (c.name || '').toLowerCase().includes(q)
        || (c.email || '').toLowerCase().includes(q)
        || (c.phone || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }

  function renderTable() {
    const pc = document.getElementById('page-content');
    if (!pc) return;
    const list = filtered();
    const tbody = pc.querySelector('#clients-tbody');
    if (!tbody) { buildPage(); return; }
    tbody.innerHTML = list.length === 0
      ? `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">👥</div><h4>Nenhum cliente encontrado</h4>
               <p>Cadastre clientes ou compartilhe seu link de anamnese</p>
               <button class="btn btn-primary" id="btn-add-client-empty">+ Adicionar Cliente</button></div></td></tr>`
      : list.map(c => `
        <tr>
          <td><div class="client-name-cell">
            <div class="client-avatar-sm">${getInitials(c.name || '?')}</div>
            <div><div style="font-weight:600">${c.name || '—'}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${c.email || ''}</div></div>
          </div></td>
          <td>${c.phone || '—'}</td>
          <td>${c.genero === 'masculino' ? '♂ Masc.' : '♀ Fem.'}</td>
          <td>${formatDate(c.birthdate) || '—'}</td>
          <td>${c.city || '—'}</td>
          <td><span class="status-badge status-${c.status || 'active'}">${{ active: 'Ativo', lead: 'Lead', inactive: 'Inativo' }[c.status] || 'Ativo'}</span></td>
          <td>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="btn btn-secondary btn-sm" data-action="anamnese" data-id="${c.id}" title="Ver anamnese">📋</button>
              <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${c.id}">✏️</button>
              <button class="btn btn-danger btn-sm" data-action="delete" data-id="${c.id}">🗑️</button>
            </div>
          </td>
        </tr>`).join('');

    bindTableActions();
    const emptyBtn = pc.querySelector('#btn-add-client-empty');
    if (emptyBtn) emptyBtn.addEventListener('click', () => showClientModal());
  }

  function bindTableActions() {
    const pc = document.getElementById('page-content');
    if (!pc) return;
    pc.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const client = clients.find(c => c.id === btn.dataset.id);
        if (btn.dataset.action === 'edit') showClientModal(client);
        if (btn.dataset.action === 'delete') {
          modal('Remover Cliente', `<p>Deseja remover <strong>${client?.name}</strong>?</p>`, {
            confirmLabel: 'Remover', confirmClass: 'btn-danger',
            onConfirm: async () => {
              await store.deleteClient(client.id).catch(() => { });
              toast('Cliente removido.', 'warning');
              await refresh();
            }
          });
        }
        if (btn.dataset.action === 'anamnese') {
          showAnamneseModal(client, router);
        }
      });
    });
  }

  async function showAnamneseModal(client, router) {
    // Fetch anamneses directly by client ID (includes filled generic copies)
    const anamneses = await store.getClientAnamneses(client.id).catch(() => []);
    if (anamneses.length === 0) {
      modal('Anamneses de ' + client.name, `
        <div class="empty-state" style="padding:20px 0">
          <div class="empty-state-icon">📋</div>
          <h4>Nenhuma anamnese encontrada</h4>
          <p>Este cliente ainda não preencheu a ficha de anamnese.</p>
        </div>`);
      return;
    }
    const a = anamneses[0]; // most recent filled
    const dados = a.dados || {};
    const symptoms = [
      ...(dados.general_symptoms || []),
      ...(dados.emotional_symptoms || []),
      ...(dados.digestive_symptoms || []),
      ...(dados.sleep_symptoms || []),
    ];
    const { el } = modal('📋 Anamnese — ' + client.name, `
      <div style="max-height:400px;overflow-y:auto">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
          <div style="font-size:0.85rem"><strong>E-mail:</strong> ${client.email || '—'}</div>
          <div style="font-size:0.85rem"><strong>WhatsApp:</strong> ${client.phone || '—'}</div>
          <div style="font-size:0.85rem"><strong>Nascimento:</strong> ${formatDate(client.birthdate)}</div>
          <div style="font-size:0.85rem"><strong>Cidade:</strong> ${client.city || '—'}</div>
        </div>
        <div style="margin-bottom:12px">
          <strong style="font-size:0.85rem">Queixa principal:</strong>
          <p style="font-size:0.85rem;color:var(--text-body);margin-top:4px">${dados.main_complaint || '—'}</p>
        </div>
        <div style="margin-bottom:12px">
          <strong style="font-size:0.85rem">Sintomas relatados:</strong>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">
            ${symptoms.slice(0, 12).map(s => `<span class="report-tag" style="font-size:0.72rem">${s}</span>`).join('') || '—'}
          </div>
        </div>
        <div style="margin-bottom:12px">
          <strong style="font-size:0.85rem">Objetivos:</strong>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">
            ${(dados.goals || []).map(g => `<span class="report-tag" style="font-size:0.72rem;background:#dcfce7;color:#166534">${g}</span>`).join('') || '—'}
          </div>
        </div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:8px">
          Preenchida em: ${formatDate(a.criado_em)}
        </div>
      </div>`, {
      confirmLabel: '🌿 Ver Protocolo',
      onConfirm: () => {
        const consultant = auth.current;
        const encoded = encodeURIComponent(JSON.stringify({
          answers: dados,
          consultant: { name: consultant?.nome || consultant?.name },
          clientName: client.name
        }));
        router.navigate('/protocolo', { data: encoded });
      }
    });
  }


  function buildPage() {
    const pc = document.getElementById('page-content');
    if (!pc) return;
    pc.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <div class="tab-bar" style="margin:0">
              ${['all', 'active', 'lead', 'inactive'].map(s => `
                <button class="tab-btn ${filter === s ? 'active' : ''}" data-filter="${s}">
                  ${s === 'all' ? 'Todos 👥' : s === 'active' ? 'Ativos 🟢' : s === 'lead' ? 'Leads 🟡' : 'Inativos 🔴'}
                </button>`).join('')}
            </div>
            <input class="field-input" id="search-input" placeholder="🔍 Buscar cliente..." style="width:220px;padding:8px 12px" />
          </div>
          <button class="btn btn-primary" id="btn-add-client">+ Novo Cliente</button>
        </div>
        <div class="card">
          <div style="overflow-x:auto">
            <table class="clients-table">
              <thead><tr>
                <th>Cliente</th><th>WhatsApp</th><th>Gênero</th><th>Nascimento</th><th>Cidade</th><th>Status</th><th>Ações</th>
              </tr></thead>
              <tbody id="clients-tbody"></tbody>
            </table>
          </div>
        </div>`;

    renderTable();
    pc.querySelector('#btn-add-client').addEventListener('click', () => showClientModal());
    pc.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        filter = btn.dataset.filter;
        pc.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
        renderTable();
      });
    });
    pc.querySelector('#search-input').addEventListener('input', e => { search = e.target.value; renderTable(); });
  }

  function showClientModal(client = null) {
    const id = client?.id;

    // Banner shown only for existing clients — allows opening their anamnese
    const anamneseBanner = client ? `
      <div id="anamnese-banner" style="display:flex;align-items:center;justify-content:space-between;
        background:linear-gradient(135deg,#e8f5e9,#f1f8e9);border:1px solid #a5d6a7;
        border-radius:10px;padding:12px 16px;margin-bottom:18px;cursor:pointer">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:1.3rem">📋</span>
          <div>
            <div style="font-weight:600;color:#2d4a28;font-size:0.9rem">Ficha de Anamnese</div>
            <div style="font-size:0.78rem;color:#4a7c40">Clique para ver todas as respostas do questionário</div>
          </div>
        </div>
        <span style="color:#4a7c40;font-size:1.1rem">›</span>
      </div>` : '';

    const { el } = modal(client ? 'Editar Cliente' : 'Novo Cliente', `
      ${anamneseBanner}
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Nome completo *</label>
          <input class="field-input" id="m-name" value="${client?.name || ''}" placeholder="Nome do cliente" />
        </div>
        <div class="form-group">
          <label class="field-label">E-mail</label>
          <input class="field-input" id="m-email" type="email" value="${client?.email || ''}" placeholder="email@exemplo.com" />
        </div>
        <div class="form-group">
          <label class="field-label">WhatsApp</label>
          <input class="field-input" id="m-phone" value="${client?.phone || ''}" placeholder="55119..." />
        </div>
        <div class="form-group">
          <label class="field-label">Data de Nascimento</label>
          <input class="field-input" id="m-birthdate" type="date" value="${client?.birthdate || ''}" />
        </div>
        <div class="form-group">
          <label class="field-label">Cidade</label>
          <input class="field-input" id="m-city" value="${client?.city || ''}" />
        </div>
        <div class="form-group">
          <label class="field-label">Gênero</label>
          <select class="field-select" id="m-genero">
            <option value="feminino" ${(!client?.genero || client?.genero === 'feminino') ? 'selected' : ''}>♀ Feminino</option>
            <option value="masculino" ${client?.genero === 'masculino' ? 'selected' : ''}>♂ Masculino</option>
          </select>
        </div>
        <div class="form-group">
          <label class="field-label">Status</label>
          <select class="field-select" id="m-status">
            <option value="lead" ${client?.status === 'lead' ? 'selected' : ''}>Lead 🟡</option>
            <option value="active" ${(client?.status === 'active' || !client?.status) ? 'selected' : ''}>Ativo 🟢</option>
            <option value="inactive" ${client?.status === 'inactive' ? 'selected' : ''}>Inativo 🔴</option>
          </select>
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Observações</label>
          <textarea class="field-textarea" id="m-notes">${client?.notes || ''}</textarea>
        </div>
      </div>`, {
      confirmLabel: client ? 'Salvar' : 'Adicionar',
      onConfirm: async () => {
        const data = {
          name: document.getElementById('m-name').value.trim(),
          email: document.getElementById('m-email').value.trim(),
          phone: document.getElementById('m-phone').value.trim(),
          birthdate: document.getElementById('m-birthdate').value,
          city: document.getElementById('m-city').value.trim(),
          genero: document.getElementById('m-genero').value,
          status: document.getElementById('m-status').value,
          notes: document.getElementById('m-notes').value.trim(),
        };
        if (!data.name) { toast('Nome é obrigatório', 'error'); return; }
        try {
          if (id) { await store.updateClient(id, data); toast('Cliente atualizado! ✅'); }
          else { await store.addClient(data); toast('Cliente adicionado! 🌿'); }
          await refresh();
        } catch (err) {
          toast('Erro: ' + err.message, 'error');
        }
      }
    });

    // Anamnese banner click handler
    el?.querySelector('#anamnese-banner')?.addEventListener('click', () => {
      // Close this modal, then open anamnese view
      el.querySelector('[data-close]')?.click();
      setTimeout(() => showAnamneseModal(client, router), 200);
    });
  }

  await refresh();
  buildPage();
}
