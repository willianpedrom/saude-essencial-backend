import { auth, store, api } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { formatDate, toast, modal } from '../utils.js';

// Admin-only API helper
const adminApi = {
  getUsers: () => api('GET', '/api/admin/users'),
  updateUser: (id, data) => api('PUT', `/api/admin/users/${id}`, data),
  updatePlan: (id, data) => api('PUT', `/api/admin/users/${id}/plan`, data),
  updatePassword: (id, data) => api('PUT', `/api/admin/users/${id}/password`, data),
  getTracking: (id) => api('GET', `/api/admin/users/${id}/tracking`),
  updateTracking: (id, data) => api('PUT', `/api/admin/users/${id}/tracking`, data),
  deleteUser: (id) => api('DELETE', `/api/admin/users/${id}`),
  // Planos
  getPlanos: () => api('GET', '/api/admin/planos'),
  createPlano: (data) => api('POST', '/api/admin/planos', data),
  updatePlano: (id, data) => api('PUT', `/api/admin/planos/${id}`, data),
  deletePlano: (id) => api('DELETE', `/api/admin/planos/${id}`),
  // Uso & Cortesia
  getUso: (id) => api('GET', `/api/admin/users/${id}/uso`),
  darCortesia: (id, data) => api('POST', `/api/admin/users/${id}/cortesia`, data),
  getPagamentos: (id) => api('GET', `/api/admin/users/${id}/pagamentos`),
  reenviarAcesso: (id) => api('POST', `/api/admin/users/${id}/reenviar-acesso`, {}),
};

const PLAN_LABELS = {
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
  trial: 'Trial',
  admin: 'Admin',
  none: 'Nenhum',
};
const PLAN_STATUS_LABELS = {
  trial: '⏳ Trial',
  active: '✅ Ativo',
  canceled: '❌ Cancelado',
  cancelled: '❌ Cancelado',
  expired: '🔴 Expirado',
  overdue: '⚠️ Inadimplente',
  refunded: '💸 Reembolsado',
  none: '—',
};

const STATUS_COLORS = {
  trial: '#f59e0b',
  active: '#16a34a',
  canceled: '#dc2626',
  cancelled: '#dc2626',
  expired: '#dc2626',
  overdue: '#ea580c',
  refunded: '#7c3aed',
};

export async function renderAdmin(router) {
  if (!auth.current || auth.current.role !== 'admin') {
    renderLayout(router, 'Acesso Negado', `
      <div class="empty-state">
        <div class="empty-state-icon">🔒</div>
        <h4>Área Restrita</h4>
        <p>Você não tem permissão para acessar esta área.</p>
        <button class="btn btn-primary" onclick="location.hash='#/dashboard'">Voltar ao Dashboard</button>
      </div>`, 'admin');
    return;
  }

  renderLayout(router, 'Painel Administrativo',
    `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando usuários...</div>`,
    'admin');

  let users = [];

  async function load() {
    try {
      [users, planos] = await Promise.all([
        adminApi.getUsers().catch(() => []),
        adminApi.getPlanos().catch(() => []),
      ]);
    } catch (err) {
      toast('Erro ao carregar dados: ' + err.message, 'error');
      users = []; planos = [];
    }
    render();
  }

  let activeTab = 'membros';
  let filterStatus = '';
  let filterPlano = '';
  let planos = [];

  async function loadPlanos() {
    try { planos = await adminApi.getPlanos(); } catch { planos = []; }
  }

  function render() {
    const pc = document.getElementById('page-content');
    if (!pc) return;

    const totalUsers = users.length;
    const totalActive = users.filter(u => u.plano_status === 'active').length;
    const totalTrial = users.filter(u => u.plano_status === 'trial').length;
    const totalAdmins = users.filter(u => u.role === 'admin').length;
    const totalInadimplente = users.filter(u => u.plano_status === 'overdue').length;
    // MRR: sum of plan prices for active users
    const mrrMap = {};
    planos.forEach(p => { mrrMap[p.slug] = parseFloat(p.preco_mensal || 0); });
    const mrr = users
      .filter(u => u.plano_status === 'active')
      .reduce((sum, u) => sum + (mrrMap[u.plano] || 0), 0);

    // Trials expiring in 7 days
    const now = new Date();
    const in7 = new Date(); in7.setDate(in7.getDate() + 7);
    const trialExpiring = users.filter(u => {
      if (u.plano_status !== 'trial' || !u.trial_fim) return false;
      const f = new Date(u.trial_fim);
      return f > now && f <= in7;
    }).length;

    pc.innerHTML = `
      <!-- Stats strip -->
      <div class="stats-grid" style="margin-bottom:16px;grid-template-columns:repeat(5,1fr)">
        <div class="stat-card green">
          <div class="stat-icon">👥</div>
          <div class="stat-value">${totalUsers}</div>
          <div class="stat-label">Total Membros</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon">✅</div>
          <div class="stat-value">${totalActive}</div>
          <div class="stat-label">Ativos (pagos)</div>
        </div>
        <div class="stat-card gold">
          <div class="stat-icon">⏳</div>
          <div class="stat-value">${totalTrial}</div>
          <div class="stat-label">Em Trial</div>
        </div>
        <div class="stat-card rose">
          <div class="stat-icon">⚠️</div>
          <div class="stat-value">${totalInadimplente}</div>
          <div class="stat-label">Inadimplentes</div>
        </div>
        <div class="stat-card" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #86efac">
          <div class="stat-icon">💰</div>
          <div class="stat-value" style="font-size:1.1rem">R$ ${mrr.toFixed(2).replace('.', ',')}</div>
          <div class="stat-label">MRR Estimado</div>
        </div>
      </div>

      ${trialExpiring > 0 ? `<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:10px 16px;margin-bottom:14px;font-size:0.85rem;color:#92400e">⚡ <strong>${trialExpiring} membro(s)</strong> com trial expirando nos próximos 7 dias</div>` : ''}

      <!-- Abas -->
      <div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:2px solid var(--border-light)">
        ${['membros', 'planos', 'gateway'].map(tab => `
          <button id="tab-${tab}" class="btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}" style="border-radius:8px 8px 0 0;border-bottom:none;padding:8px 18px;font-size:0.85rem" data-tab="${tab}">
            ${{ membros: '👥 Membros', planos: '📦 Planos', gateway: '💳 Gateway' }[tab]}
          </button>`).join('')}
      </div>

      <div id="tab-content"></div>`;

    // Tab switching
    pc.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        render();
      });
    });

    const tabContent = pc.querySelector('#tab-content');
    if (activeTab === 'membros') renderMembros(tabContent);
    else if (activeTab === 'planos') renderPlanosSection(tabContent);
    else if (activeTab === 'gateway') renderGatewaySection(tabContent);
  }

  // ── Aba Membros ────────────────────────────────────────────────
  function renderMembros(container) {
    const planOptions = planos.map(p => `<option value="${p.slug}">${p.nome}</option>`).join('');
    container.innerHTML = `
      <div class="card">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <h3 style="margin:0;font-size:0.95rem;flex:1">👥 Membros do Sistema</h3>
          <select class="field-select" id="filter-status" style="width:160px;padding:6px 10px;font-size:0.82rem">
            <option value="">Todos os status</option>
            <option value="trial">⏳ Trial</option>
            <option value="active">✅ Ativo</option>
            <option value="overdue">⚠️ Inadimplente</option>
            <option value="cancelled">❌ Cancelado</option>
            <option value="expired">🔴 Expirado</option>
          </select>
          <select class="field-select" id="filter-plano" style="width:150px;padding:6px 10px;font-size:0.82rem">
            <option value="">Todos os planos</option>
            ${planOptions}
          </select>
          <input class="field-input" id="admin-search" placeholder="🔍 Buscar nome/email..." style="width:200px;padding:6px 12px;font-size:0.82rem" />
        </div>
        <div style="overflow-x:auto">
          <table class="clients-table">
            <thead><tr>
              <th>Membro</th>
              <th>Plano / Status</th>
              <th>Clientes</th>
              <th>Anamneses</th>
              <th>Vence em</th>
              <th>Cargo</th>
              <th>Ações</th>
            </tr></thead>
            <tbody id="admin-tbody">${renderRows(applyFilters(users))}</tbody>
          </table>
        </div>
      </div>`;

    // Restore filter values
    const fs = container.querySelector('#filter-status');
    const fp = container.querySelector('#filter-plano');
    const se = container.querySelector('#admin-search');
    if (fs) fs.value = filterStatus;
    if (fp) fp.value = filterPlano;

    function applyAndRender() {
      filterStatus = fs?.value || '';
      filterPlano = fp?.value || '';
      const q = (se?.value || '').toLowerCase();
      const filtered = applyFilters(users).filter(u =>
        !q || (u.nome || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
      );
      document.getElementById('admin-tbody').innerHTML = renderRows(filtered);
      bindRowEvents();
    }

    fs?.addEventListener('change', applyAndRender);
    fp?.addEventListener('change', applyAndRender);
    se?.addEventListener('input', applyAndRender);
    bindRowEvents();
  }

  function applyFilters(list) {
    return list.filter(u => {
      if (filterStatus && u.plano_status !== filterStatus) return false;
      if (filterPlano && u.plano !== filterPlano) return false;
      return true;
    });
  }

  function renderRows(list) {
    if (list.length === 0) return `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">Nenhum membro encontrado</td></tr>`;
    const now = new Date();
    const in7 = new Date(); in7.setDate(in7.getDate() + 7);
    return list.map(u => {
      const initials = (u.nome || '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
      const isMe = u.id === auth.current?.id;
      const isAdmin = u.role === 'admin';
      const statusColor = STATUS_COLORS[u.plano_status] || '#64748b';

      // Vencimento
      const venceFim = u.plano_status === 'trial' ? u.trial_fim : u.periodo_fim;
      let venceHtml = '—';
      if (venceFim) {
        const vd = new Date(venceFim);
        const diff = Math.ceil((vd - now) / 86400000);
        const color = diff < 0 ? '#dc2626' : diff <= 7 ? '#d97706' : '#16a34a';
        venceHtml = `<span style="color:${color};font-size:0.78rem;font-weight:600">${diff < 0 ? 'Expirado' : diff === 0 ? 'Hoje' : `${diff}d`}</span><br><span style="font-size:0.7rem;color:var(--text-muted)">${vd.toLocaleDateString('pt-BR')}</span>`;
      }

      const rowBg = u.plano_status === 'overdue' ? 'background:#fff7ed' :
        u.plano_status === 'expired' || u.plano_status === 'cancelled' ? 'background:#fef2f2' : '';

      return `
        <tr style="${rowBg}">
          <td>
            <div class="client-name-cell">
              <div class="client-avatar-sm" style="${isAdmin ? 'background:linear-gradient(135deg,#7c3aed,#a855f7)' : ''}">
                ${u.foto_url ? `<img src="${u.foto_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />` : initials}
              </div>
              <div>
                <div style="font-weight:600;font-size:0.88rem">${u.nome || '—'} ${isMe ? '<span style="font-size:0.7rem;color:var(--text-muted)">(você)</span>' : ''}</div>
                <div style="font-size:0.72rem;color:var(--text-muted)">${u.email || '—'}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-size:0.82rem">
              <div style="font-weight:600">${PLAN_LABELS[u.plano] || u.plano || '—'}</div>
              <div style="font-size:0.72rem;color:${statusColor}">${PLAN_STATUS_LABELS[u.plano_status] || u.plano_status || '—'}</div>
            </div>
          </td>
          <td style="text-align:center;font-weight:600">${u.total_clientes || 0}</td>
          <td style="text-align:center;font-weight:600">${u.total_anamneses || 0}</td>
          <td style="font-size:0.8rem;white-space:nowrap">${venceHtml}</td>
          <td>
            ${isAdmin
          ? `<span style="background:#f3e8ff;color:#6b21a8;font-size:0.72rem;padding:2px 8px;border-radius:10px">👑 Admin</span>`
          : `<span style="background:#f0fdf4;color:#166534;font-size:0.72rem;padding:2px 8px;border-radius:10px">👤 Membro</span>`}
          </td>
          <td>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              <button class="btn btn-secondary btn-sm" data-edit-id="${u.id}" title="Editar">✏️</button>
              <button class="btn btn-${isAdmin ? 'secondary' : 'primary'} btn-sm" data-role-id="${u.id}" data-role-current="${u.role}" title="${isAdmin ? 'Remover admin' : 'Tornar admin'}" ${isMe ? 'disabled' : ''}>
                ${isAdmin ? '👤' : '👑'}
              </button>
              <button class="btn btn-secondary btn-sm" data-pwd-id="${u.id}" title="Alterar Senha">🔑</button>
              <button class="btn btn-secondary btn-sm" data-tracking-id="${u.id}" title="Rastreamento">📊</button>
              <button class="btn btn-secondary btn-sm" data-plan-id="${u.id}" data-plan-current="${u.plano || 'starter'}" data-status-current="${u.plano_status || 'trial'}" title="Alterar Plano">💳</button>
              <button class="btn btn-secondary btn-sm" data-cortesia-id="${u.id}" data-cortesia-nome="${u.nome}" title="Conceder Cortesia">🎁</button>
              <button class="btn btn-secondary btn-sm" data-reenvio-id="${u.id}" data-reenvio-nome="${u.nome}" title="Reenviar Email de Acesso">📧</button>
              <button class="btn btn-danger btn-sm" data-del-id="${u.id}" data-del-nome="${u.nome}" title="Excluir" ${isMe ? 'disabled' : ''}>🗑️</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  function bindRowEvents() {
    const tbody = document.getElementById('admin-tbody');
    if (!tbody) return;

    // Edit user
    tbody.querySelectorAll('[data-edit-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = users.find(x => x.id === btn.dataset.editId);
        if (!u) return;
        showEditModal(u);
      });
    });

    // Toggle role
    tbody.querySelectorAll('[data-role-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = users.find(x => x.id === btn.dataset.roleId);
        if (!u) return;
        const newRole = u.role === 'admin' ? 'user' : 'admin';
        const action = newRole === 'admin' ? 'tornar administrador' : 'remover acesso de admin de';
        modal(`${newRole === 'admin' ? '👑' : '👤'} Alterar Cargo`,
          `<p>Deseja <strong>${action}</strong> <strong>${u.nome}</strong>?</p>`, {
          confirmLabel: 'Confirmar',
          onConfirm: async () => {
            try {
              const f = users.find(x => x.id === u.id);
              await adminApi.updateUser(u.id, {
                nome: f.nome, email: f.email, telefone: f.telefone, role: newRole
              });
              toast(`Cargo atualizado para ${newRole === 'admin' ? 'Administrador 👑' : 'Membro 👤'}`);
              await load();
            } catch (err) { toast('Erro: ' + err.message, 'error'); }
          }
        });
      });
    });

    // Change plan
    tbody.querySelectorAll('[data-plan-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = users.find(x => x.id === btn.dataset.planId);
        if (!u) return;
        showPlanModal(u);
      });
    });

    // Change password
    tbody.querySelectorAll('[data-pwd-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = users.find(x => x.id === btn.dataset.pwdId);
        if (!u) return;
        showPasswordModal(u);
      });
    });

    // Tracking config
    tbody.querySelectorAll('[data-tracking-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const u = users.find(x => x.id === btn.dataset.trackingId);
        if (!u) return;
        await showTrackingModal(u);
      });
    });

    // Cortesia
    tbody.querySelectorAll('[data-cortesia-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = users.find(x => x.id === btn.dataset.cortesiaId);
        if (!u) return;
        showCortesiaModal(u);
      });
    });

    // Reenviar Email de Acesso
    tbody.querySelectorAll('[data-reenvio-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const nome = btn.dataset.reenvioNome;
        modal('📧 Reenviar Email de Acesso', `
          <div style="text-align:center">
            <div style="font-size:2.5rem;margin-bottom:12px">📧</div>
            <p>Isso irá <strong>gerar uma nova senha temporária</strong> para <strong>${nome}</strong> e enviar um email com as instruções de acesso.</p>
            <p style="font-size:0.83rem;color:var(--text-muted)">A senha atual do usuário será redefinida.</p>
          </div>`, {
          confirmLabel: '📧 Reenviar Agora',
          onConfirm: async () => {
            try {
              const r = await adminApi.reenviarAcesso(btn.dataset.reenvioId);
              toast(`✅ Email de acesso reenviado para ${r.email || nome}!`);
            } catch (err) { toast('Erro: ' + err.message + ' — Verifique as variáveis SMTP no servidor.', 'error'); return false; }
          }
        });
      });
    });

    // Delete user
    tbody.querySelectorAll('[data-del-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const nome = btn.dataset.delNome;
        modal('🗑️ Excluir Membro', `
          <div style="text-align:center">
            <div style="font-size:2rem;margin-bottom:8px">⚠️</div>
            <p>Tem certeza que deseja excluir <strong>${nome}</strong>?</p>
            <p style="font-size:0.85rem;color:var(--text-muted)">Esta ação irá excluir todos os dados do membro permanentemente.</p>
          </div>`, {
          confirmLabel: 'Excluir Permanentemente', confirmClass: 'btn-danger',
          onConfirm: async () => {
            try {
              await adminApi.deleteUser(btn.dataset.delId);
              toast(`${nome} excluído.`, 'warning');
              await load();
            } catch (err) { toast('Erro: ' + err.message, 'error'); }
          }
        });
      });
    });
  }

  async function showTrackingModal(u) {
    let tracking = {};
    try {
      const res = await adminApi.getTracking(u.id);
      tracking = res.rastreamento || {};
    } catch { /* Empty config, show blank form */ }

    modal('📊 Integrações — ' + u.nome, `
      <div class="form-grid">
        <div class="form-group">
          <label class="field-label">Meta Pixel ID</label>
          <input class="field-input" id="at-pixel-id" placeholder="Ex: 1234567890" value="${tracking.meta_pixel_id || ''}" />
        </div>
        <div class="form-group">
          <label class="field-label">Meta CAPI Token</label>
          <input class="field-input" id="at-pixel-token" type="password" placeholder="EAAGxxx..." value="${tracking.meta_pixel_token || ''}" />
        </div>
        <div class="form-group">
          <label class="field-label">Clarity ID</label>
          <input class="field-input" id="at-clarity" placeholder="Ex: abc123" value="${tracking.clarity_id || ''}" />
        </div>
        <div class="form-group">
          <label class="field-label">Google Analytics (GA4)</label>
          <input class="field-input" id="at-ga" placeholder="Ex: G-XXXXXXXXXX" value="${tracking.ga_id || ''}" />
        </div>
        <div class="form-group">
          <label class="field-label">Google Tag Manager</label>
          <input class="field-input" id="at-gtm" placeholder="Ex: GTM-XXXXXXX" value="${tracking.gtm_id || ''}" />
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Script Personalizado</label>
          <textarea class="field-textarea" id="at-custom" rows="3" placeholder="<script>...</script>" style="font-family:monospace;font-size:0.8rem">${tracking.custom_script || ''}</textarea>
        </div>
      </div>`, {
      confirmLabel: '💾 Salvar Integrações',
      onConfirm: async () => {
        const payload = {
          meta_pixel_id: document.getElementById('at-pixel-id')?.value?.trim() || null,
          meta_pixel_token: document.getElementById('at-pixel-token')?.value?.trim() || null,
          clarity_id: document.getElementById('at-clarity')?.value?.trim() || null,
          ga_id: document.getElementById('at-ga')?.value?.trim() || null,
          gtm_id: document.getElementById('at-gtm')?.value?.trim() || null,
          custom_script: document.getElementById('at-custom')?.value?.trim() || null,
        };
        try {
          await adminApi.updateTracking(u.id, payload);
          toast('Integrações salvas! ✅');
        } catch (err) { toast('Erro: ' + err.message, 'error'); }
      }
    });
    setTimeout(() => document.getElementById('at-pixel-id')?.focus(), 100);
  }

  function showEditModal(u) {
    const { el } = modal('✏️ Editar Membro', `
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Nome *</label>
          <input class="field-input" id="ae-nome" value="${u.nome || ''}" />
        </div>
        <div class="form-group">
          <label class="field-label">E-mail *</label>
          <input class="field-input" id="ae-email" type="email" value="${u.email || ''}" />
        </div>
        <div class="form-group">
          <label class="field-label">Telefone</label>
          <input class="field-input" id="ae-telefone" value="${u.telefone || ''}" />
        </div>
        <div class="form-group">
          <label class="field-label">Cargo</label>
          <select class="field-select" id="ae-role" ${u.id === auth.current?.id ? 'disabled' : ''}>
            <option value="user" ${u.role !== 'admin' ? 'selected' : ''}>👤 Membro</option>
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>👑 Administrador</option>
          </select>
          ${u.id === auth.current?.id ? '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">Não é possível alterar seu próprio cargo</div>' : ''}
        </div>
      </div>`, {
      confirmLabel: '💾 Salvar',
      onConfirm: async () => {
        const data = {
          nome: document.getElementById('ae-nome')?.value?.trim(),
          email: document.getElementById('ae-email')?.value?.trim(),
          telefone: document.getElementById('ae-telefone')?.value?.trim(),
          role: document.getElementById('ae-role')?.value || u.role,
        };
        if (!data.nome || !data.email) { toast('Nome e e-mail obrigatórios', 'error'); return; }
        try {
          await adminApi.updateUser(u.id, data);
          toast('Membro atualizado! ✅');
          await load();
        } catch (err) { toast('Erro: ' + err.message, 'error'); }
      }
    });
    setTimeout(() => document.getElementById('ae-nome')?.focus(), 100);
  }

  function showCortesiaModal(u) {
    modal('🎁 Conceder Cortesia — ' + u.nome, `
      <div class="form-grid">
        <div class="form-group">
          <label class="field-label">Dias de Cortesia *</label>
          <input class="field-input" id="ac-dias" type="number" min="1" max="365" value="7" placeholder="Ex: 7, 30, 90" />
        </div>
        <div class="form-group">
          <label class="field-label">Observação</label>
          <input class="field-input" id="ac-obs" placeholder="Ex: Parceiro, influencer, teste..." />
        </div>
      </div>
      <div style="margin-top:10px;padding:12px;background:#f0fdf4;border-radius:8px;font-size:0.83rem;color:#166534">
        💡 Isso ativará ou estenderá o período de trial do membro pelos dias especificados.
      </div>`, {
      confirmLabel: '🎁 Conceder Cortesia',
      onConfirm: async () => {
        const dias = parseInt(document.getElementById('ac-dias')?.value);
        const obs = document.getElementById('ac-obs')?.value?.trim();
        if (!dias || dias < 1) { toast('Informe um número de dias válido.', 'error'); return false; }
        try {
          const r = await adminApi.darCortesia(u.id, { dias, observacao: obs });
          toast(`✅ Cortesia de ${r.dias_concedidos} dia(s) concedida a ${u.nome}!`);
          await load();
        } catch (err) { toast('Erro: ' + err.message, 'error'); return false; }
      }
    });
    setTimeout(() => document.getElementById('ac-dias')?.focus(), 100);
  }

  // ── Aba Planos ─────────────────────────────────────────────────
  async function renderPlanosSection(container) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted)">⏳ Carregando planos...</div>`;
    await loadPlanos();

    function renderPlanosTable() {
      const lim = (v) => v === null || v === undefined ? '∞ Ilimitado' : v;
      const feat = (v) => v ? '✅' : '❌';
      return `
        <div class="card">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between">
            <h3 style="margin:0;font-size:0.95rem">📦 Planos Configuráveis</h3>
            <button class="btn btn-primary btn-sm" id="btn-novo-plano">+ Novo Plano</button>
          </div>
          <div style="overflow-x:auto">
            <table class="clients-table">
              <thead><tr>
                <th>Slug</th><th>Nome</th><th>Preço/mês</th><th>Clientes</th><th>Anamneses/mês</th>
                <th>Integrações</th><th>Pipeline</th><th>Multi-usuário</th><th>Hotmart Offer ID</th><th>Ativo</th><th>Ações</th>
              </tr></thead>
              <tbody>
                ${planos.length === 0 ? '<tr><td colspan="11" style="text-align:center;padding:30px">Nenhum plano cadastrado</td></tr>' : planos.map(p => `
                  <tr>
                    <td><code style="font-size:0.78rem;background:#f1f5f9;padding:2px 6px;border-radius:4px">${p.slug}</code></td>
                    <td><strong>${p.nome}</strong></td>
                    <td>R$ ${parseFloat(p.preco_mensal || 0).toFixed(2).replace('.', ',')}</td>
                    <td>${lim(p.clientes_max)}</td>
                    <td>${lim(p.anamneses_mes_max)}</td>
                    <td style="text-align:center">${feat(p.tem_integracoes)}</td>
                    <td style="text-align:center">${feat(p.tem_pipeline)}</td>
                    <td style="text-align:center">${feat(p.tem_multiusuario)}</td>
                    <td style="font-size:0.75rem;color:var(--text-muted)">${p.hotmart_offer_id || '—'}</td>
                    <td style="text-align:center">${p.ativo ? '✅' : '⛔'}</td>
                    <td>
                      <div style="display:flex;gap:4px">
                        <button class="btn btn-secondary btn-sm" data-edit-plano='${JSON.stringify(p)}' title="Editar">✏️</button>
                        <button class="btn btn-danger btn-sm" data-del-plano-id="${p.id}" data-del-plano-nome="${p.nome}" title="Excluir">🗑️</button>
                      </div>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div style="padding:14px 18px;font-size:0.8rem;color:var(--text-muted)">
            💡 As colunas <strong>Clientes</strong> e <strong>Anamneses/mês</strong> em branco = ilimitado.
            O campo <strong>Hotmart Offer ID</strong> é usado para mapear compras automaticamente ao plano correto.
          </div>
        </div>`;
    }

    function showPlanoModal(plano = null) {
      const p = plano || {};
      modal(`${plano ? '✏️ Editar' : '➕ Novo'} Plano`, `
        <div class="form-grid">
          <div class="form-group">
            <label class="field-label">Slug (identificador único) *</label>
            <input class="field-input" id="pp-slug" value="${p.slug || ''}" placeholder="ex: starter" ${plano ? 'readonly style="opacity:.6"' : ''} />
          </div>
          <div class="form-group">
            <label class="field-label">Nome do Plano *</label>
            <input class="field-input" id="pp-nome" value="${p.nome || ''}" placeholder="ex: Starter" />
          </div>
          <div class="form-group">
            <label class="field-label">Preço Mensal (R$)</label>
            <input class="field-input" id="pp-preco" type="number" step="0.01" min="0" value="${p.preco_mensal || 0}" />
          </div>
          <div class="form-group">
            <label class="field-label">Máx. Clientes (vazio = ilimitado)</label>
            <input class="field-input" id="pp-clientes" type="number" min="1" value="${p.clientes_max || ''}" placeholder="Ilimitado" />
          </div>
          <div class="form-group">
            <label class="field-label">Máx. Anamneses/mês (vazio = ilimitado)</label>
            <input class="field-input" id="pp-anamneses" type="number" min="1" value="${p.anamneses_mes_max || ''}" placeholder="Ilimitado" />
          </div>
          <div class="form-group">
            <label class="field-label">Hotmart Offer ID (opcional)</label>
            <input class="field-input" id="pp-hotmart" value="${p.hotmart_offer_id || ''}" placeholder="Ex: OFR-XXXXXX" />
          </div>
          <div class="form-group form-field-full" style="display:flex;gap:16px;flex-wrap:wrap">
            ${[['tem_integracoes', 'Integrações (Pixel/GA)'], ['tem_pipeline', 'Pipeline/Fluxo'], ['tem_multiusuario', 'Multi-usuário'], ['tem_relatorios', 'Relatórios']].map(([k, l]) =>
        `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.85rem">
                <input type="checkbox" id="pp-${k}" ${p[k] ? 'checked' : ''} style="width:16px;height:16px"> ${l}
              </label>`).join('')}
          </div>
        </div>`, {
        confirmLabel: plano ? '💾 Salvar Plano' : '➕ Criar Plano',
        onConfirm: async () => {
          const data = {
            slug: document.getElementById('pp-slug')?.value?.trim(),
            nome: document.getElementById('pp-nome')?.value?.trim(),
            preco_mensal: parseFloat(document.getElementById('pp-preco')?.value) || 0,
            clientes_max: parseInt(document.getElementById('pp-clientes')?.value) || null,
            anamneses_mes_max: parseInt(document.getElementById('pp-anamneses')?.value) || null,
            hotmart_offer_id: document.getElementById('pp-hotmart')?.value?.trim() || null,
            tem_integracoes: document.getElementById('pp-tem_integracoes')?.checked,
            tem_pipeline: document.getElementById('pp-tem_pipeline')?.checked,
            tem_multiusuario: document.getElementById('pp-tem_multiusuario')?.checked,
            tem_relatorios: document.getElementById('pp-tem_relatorios')?.checked,
            ativo: true,
          };
          if (!data.slug || !data.nome) { toast('Slug e Nome são obrigatórios.', 'error'); return false; }
          try {
            if (plano) await adminApi.updatePlano(plano.id, data);
            else await adminApi.createPlano(data);
            toast(`Plano ${plano ? 'atualizado' : 'criado'}! ✅`);
            await loadPlanos();
            container.innerHTML = renderPlanosTable();
            bindPlanoEvents();
          } catch (err) { toast('Erro: ' + err.message, 'error'); return false; }
        }
      });
    }

    function bindPlanoEvents() {
      container.querySelector('#btn-novo-plano')?.addEventListener('click', () => showPlanoModal());
      container.querySelectorAll('[data-edit-plano]').forEach(btn => {
        btn.addEventListener('click', () => showPlanoModal(JSON.parse(btn.dataset.editPlano)));
      });
      container.querySelectorAll('[data-del-plano-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          modal('🗑️ Excluir Plano', `<p>Excluir o plano <strong>${btn.dataset.delPlanoNome}</strong>?<br><small style="color:var(--text-muted)">Planos com assinaturas ativas não podem ser excluídos.</small></p>`, {
            confirmLabel: 'Excluir', confirmClass: 'btn-danger',
            onConfirm: async () => {
              try {
                await adminApi.deletePlano(btn.dataset.delPlanoId);
                toast('Plano excluído.');
                await loadPlanos();
                container.innerHTML = renderPlanosTable();
                bindPlanoEvents();
              } catch (err) { toast('Erro: ' + err.message, 'error'); return false; }
            }
          });
        });
      });
    }

    container.innerHTML = renderPlanosTable();
    bindPlanoEvents();
  }

  // ── Aba Gateway ────────────────────────────────────────────────
  function renderGatewaySection(container) {
    container.innerHTML = `
      <div class="card">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;background:linear-gradient(135deg,#f97316,#ef4444);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.3rem">💳</div>
          <div>
            <div style="font-weight:700">Gateway de Pagamento</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">Configure a integração com a Hotmart</div>
          </div>
          <div id="gateway-status-badge" style="margin-left:auto"></div>
        </div>
        <div style="padding:20px" id="gateway-section">
          <div style="text-align:center;color:var(--text-muted)">⏳ Carregando...</div>
        </div>
      </div>`;
    loadGatewaySettings();
  }

  function showPlanModal(u) {
    modal('💳 Alterar Plano — ' + u.nome, `
      <div class="form-grid">
        <div class="form-group">
          <label class="field-label">Plano</label>
          <select class="field-select" id="ap-plano">
            <option value="starter" ${(u.plano === 'starter' || !u.plano) ? 'selected' : ''}>Starter</option>
            <option value="pro" ${u.plano === 'pro' ? 'selected' : ''}>Pro</option>
            <option value="enterprise" ${u.plano === 'enterprise' ? 'selected' : ''}>Enterprise</option>
          </select>
        </div>
        <div class="form-group">
          <label class="field-label">Status</label>
          <select class="field-select" id="ap-status">
            <option value="trial" ${(u.plano_status === 'trial' || !u.plano_status) ? 'selected' : ''}>⏳ Trial</option>
            <option value="active" ${u.plano_status === 'active' ? 'selected' : ''}>✅ Ativo</option>
            <option value="canceled" ${u.plano_status === 'canceled' ? 'selected' : ''}>❌ Cancelado</option>
            <option value="expired" ${u.plano_status === 'expired' ? 'selected' : ''}>🔴 Expirado</option>
          </select>
        </div>
      </div>
      <div style="margin-top:12px;padding:12px;background:#f0fdf4;border-radius:8px;font-size:0.85rem">
        💡 Definindo como <strong>Ativo</strong> libera acesso completo ao sistema imediatamente.
      </div>`, {
      confirmLabel: '💳 Atualizar Plano',
      onConfirm: async () => {
        const plano = document.getElementById('ap-plano')?.value;
        const status = document.getElementById('ap-status')?.value;
        try {
          await adminApi.updatePlan(u.id, { plano, status });
          toast('Plano atualizado! ✅');
          await load();
        } catch (err) { toast('Erro: ' + err.message, 'error'); }
      }
    });
  }

  function showPasswordModal(u) {
    modal('🔑 Redefinir Senha — ' + u.nome, `
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Nova Senha</label>
          <input class="field-input" type="password" id="apwd-senha" placeholder="Mínimo de 6 caracteres" />
        </div>
      </div>
      <div style="margin-top:12px;padding:12px;background:#fffbeb;color:#b45309;border-radius:8px;font-size:0.85rem">
        ⚠️ Atenção: Ao alterar a senha, o acesso atual do usuário pode ser interrompido imediatamente.
      </div>`, {
      confirmLabel: '🔑 Salvar Nova Senha',
      onConfirm: async () => {
        const password = document.getElementById('apwd-senha')?.value;
        if (!password || password.length < 6) {
          toast('A senha deve ter no mínimo 6 caracteres.', 'error');
          return false; // prevent modal close
        }
        try {
          await adminApi.updatePassword(u.id, { password });
          toast('Senha atualizada com sucesso! ✅');
          // No need to reload list data, password isn't displayed
        } catch (err) {
          toast('Erro: ' + err.message, 'error');
          return false;
        }
      }
    });
    setTimeout(() => document.getElementById('apwd-senha')?.focus(), 100);
  }

  // ══════════ Gateway Settings Loader ══════════
  async function loadGatewaySettings() {
    const section = document.getElementById('gateway-section');
    const badge = document.getElementById('gateway-status-badge');
    if (!section) return;

    let settings = {};
    try {
      settings = await api('GET', '/api/admin/settings');
    } catch { /* empty */ }

    const isConfigured = !!(settings.hotmart_hottok);
    const webhookUrl = `${window.location.origin}/api/hotmart/webhook`;

    if (badge) {
      badge.innerHTML = isConfigured
        ? `<span style="background:#dcfce7;color:#166534;font-size:0.72rem;padding:3px 10px;border-radius:10px">✅ Configurado</span>`
        : `<span style="background:#fef9c3;color:#854d0e;font-size:0.72rem;padding:3px 10px;border-radius:10px">⚠️ Não configurado</span>`;
    }

    section.innerHTML = `
      <!-- Webhook URL display -->
      <div style="margin-bottom:20px;padding:16px;background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border-radius:12px;border:1px solid #bae6fd">
        <div style="font-weight:600;margin-bottom:6px;color:#0369a1;font-size:0.88rem">📡 URL do Webhook (cole na Hotmart)</div>
        <div style="display:flex;gap:8px;align-items:center">
          <code style="flex:1;background:#fff;padding:10px 14px;border-radius:8px;font-size:0.82rem;border:1px solid #e2e8f0;word-break:break-all">${webhookUrl}</code>
          <button class="btn btn-primary btn-sm" id="btn-copy-webhook">📋</button>
        </div>
        <div style="font-size:0.75rem;color:#64748b;margin-top:8px">
          Na Hotmart: <strong>Ferramentas → Webhook → Nova configuração</strong> → Cole esta URL → Selecione os eventos → Versão 2.0.0
        </div>
      </div>

      <!-- Hotmart Config Form -->
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">🔑 Hottok (Token de Autenticação)</label>
          <input class="field-input" id="gw-hottok" type="password" placeholder="Cole o Hottok da Hotmart aqui" value="${settings.hotmart_hottok || ''}" />
          ${settings.hotmart_hottok_masked ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">Atual: ${settings.hotmart_hottok_masked}</div>` : ''}
        </div>
        <div class="form-group">
          <label class="field-label">📦 ID do Produto (opcional)</label>
          <input class="field-input" id="gw-product-id" placeholder="Ex: 1234567" value="${settings.hotmart_product_id || ''}" />
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">Se quiser filtrar apenas um produto</div>
        </div>
        <div class="form-group">
          <label class="field-label">🛒 URL do Checkout (Hotmart)</label>
          <input class="field-input" id="gw-checkout-url" placeholder="https://pay.hotmart.com/..." value="${settings.checkout_url || ''}" />
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">Link de pagamento para novos assinantes</div>
        </div>
      </div>

      <!-- Info box -->
      <div style="margin-top:16px;padding:14px;background:#eff6ff;border-radius:10px;font-size:0.82rem;color:#1e40af;line-height:1.6">
        💡 <strong>Eventos tratados automaticamente:</strong><br>
        PURCHASE_COMPLETE • PURCHASE_APPROVED • SUBSCRIPTION_CANCELLATION • PURCHASE_CANCELED • PURCHASE_REFUNDED • PURCHASE_DELAYED • PURCHASE_EXPIRED<br><br>
        O sistema localiza o consultor pelo <strong>email do comprador</strong> e ativa/cancela a assinatura automaticamente.
      </div>

      <!-- Action buttons -->
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;flex-wrap:wrap">
        <button class="btn btn-secondary" id="btn-test-smtp" style="padding:12px 20px">
          🔌 Testar Conexão
        </button>
        <button class="btn btn-secondary" id="btn-send-test-email" style="padding:12px 20px;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;border:none">
          📨 Enviar Email de Teste
        </button>
        <button class="btn btn-primary" id="btn-save-gateway" style="padding:12px 28px">
          💾 Salvar Configurações
        </button>
      </div>
      <div id="smtp-test-result" style="margin-top:14px"></div>`;

    // Copy webhook URL
    section.querySelector('#btn-copy-webhook')?.addEventListener('click', () => {
      navigator.clipboard.writeText(webhookUrl)
        .then(() => toast('URL do Webhook copiada! ✅'))
        .catch(() => toast('Erro ao copiar', 'error'));
    });

    // Test SMTP
    section.querySelector('#btn-test-smtp')?.addEventListener('click', async () => {
      const btn = section.querySelector('#btn-test-smtp');
      const result = section.querySelector('#smtp-test-result');
      btn.disabled = true; btn.textContent = '⏳ Testando...';
      try {
        const r = await api('GET', '/api/admin/test-smtp');
        result.innerHTML = `
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px 16px;font-size:0.85rem">
            ✅ <strong>Conexão SMTP OK!</strong><br>
            <span style="color:#16a34a">Emails serão enviados com sucesso.</span>
            <details style="margin-top:8px"><summary style="cursor:pointer;color:var(--text-muted);font-size:0.8rem">Ver configuração</summary>
            <pre style="font-size:0.75rem;margin-top:6px;color:#374151">${JSON.stringify(r.config, null, 2)}</pre></details>
          </div>`;
        toast('✅ SMTP funcionando!');
      } catch (err) {
        let errorData;
        try { errorData = JSON.parse(err.message.match(/\{.*\}/s)?.[0] || '{}'); } catch { errorData = {}; }
        result.innerHTML = `
          <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:14px 16px;font-size:0.85rem">
            ❌ <strong>Falha no SMTP</strong><br>
            <code style="font-size:0.78rem;color:#dc2626">${err.message}</code>
            ${errorData.dicas ? `<ul style="margin:10px 0 0;padding-left:18px;font-size:0.8rem;color:#7f1d1d">${errorData.dicas.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
            ${errorData.config ? `<details style="margin-top:8px"><summary style="cursor:pointer;color:var(--text-muted);font-size:0.8rem">Ver configuração atual</summary><pre style="font-size:0.75rem;margin-top:6px">${JSON.stringify(errorData.config, null, 2)}</pre></details>` : ''}
          </div>`;
      } finally {
        btn.disabled = false; btn.textContent = '🔌 Testar Conexão';
      }
    });

    // Send real test email to the logged-in admin
    section.querySelector('#btn-send-test-email')?.addEventListener('click', async () => {
      const btn = section.querySelector('#btn-send-test-email');
      const result = section.querySelector('#smtp-test-result');
      btn.disabled = true; btn.textContent = '⏳ Enviando...';
      try {
        const r = await api('POST', '/api/admin/send-test-email', {});
        result.innerHTML = `
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px 16px;font-size:0.85rem">
            ✅ <strong>Email de teste enviado!</strong><br>
            <span style="color:#16a34a">Enviado para: <strong>${r.sentTo}</strong></span><br>
            <small style="color:var(--text-muted)">Verifique a caixa de entrada (e spam) desse email.</small>
          </div>`;
        toast('✅ Email de teste enviado! Verifique sua caixa de entrada.');
      } catch (err) {
        let msg = err.message;
        try {
          const parsed = JSON.parse(err.message.match(/\{.*\}/s)?.[0] || '{}');
          if (parsed.error) msg = parsed.error;
        } catch { }
        result.innerHTML = `
          <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:14px 16px;font-size:0.85rem">
            ❌ <strong>Falha no envio real</strong><br>
            <code style="font-size:0.78rem;color:#dc2626">${msg}</code><br><br>
            <strong>Possível causa:</strong> O remetente <code>atendimento@gotaessencial.com.br</code> precisa ser verificado no Brevo.<br>
            <a href="https://app.brevo.com/senders" target="_blank" style="color:#0ea5e9">Abrir Brevo → Senders &amp; IP → Senders</a>
          </div>`;
        toast('Erro: ' + msg, 'error');
      } finally {
        btn.disabled = false; btn.textContent = '📨 Enviar Email de Teste';
      }
    });
    // Save gateway settings
    section.querySelector('#btn-save-gateway')?.addEventListener('click', async () => {
      const btn = section.querySelector('#btn-save-gateway');
      btn.disabled = true; btn.textContent = '⏳ Salvando...';
      const payload = {
        hotmart_hottok: section.querySelector('#gw-hottok')?.value?.trim() || null,
        hotmart_product_id: section.querySelector('#gw-product-id')?.value?.trim() || null,
        checkout_url: section.querySelector('#gw-checkout-url')?.value?.trim() || null,
      };
      try {
        await api('PUT', '/api/admin/settings', payload);
        toast('Gateway configurado com sucesso! ✅');
        loadGatewaySettings(); // Refresh to show masked token
      } catch (err) {
        toast('Erro: ' + err.message, 'error');
      } finally {
        btn.disabled = false; btn.textContent = '💾 Salvar Configurações';
      }
    });
  }

  await load();
}
