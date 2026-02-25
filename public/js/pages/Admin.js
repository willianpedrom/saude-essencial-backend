import { auth, store, api } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { formatDate, toast, modal } from '../utils.js';

// Admin-only API helper
const adminApi = {
    getUsers: () => api('GET', '/api/admin/users'),
    updateUser: (id, data) => api('PUT', `/api/admin/users/${id}`, data),
    updatePlan: (id, data) => api('PUT', `/api/admin/users/${id}/plan`, data),
    deleteUser: (id) => api('DELETE', `/api/admin/users/${id}`),
};

const PLAN_LABELS = {
    starter: 'Starter',
    pro: 'Pro',
    enterprise: 'Enterprise',
    none: 'Nenhum',
};
const PLAN_STATUS_LABELS = {
    trial: '⏳ Trial',
    active: '✅ Ativo',
    canceled: '❌ Cancelado',
    expired: '🔴 Expirado',
    none: '—',
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
            users = await adminApi.getUsers();
        } catch (err) {
            toast('Erro ao carregar usuários: ' + err.message, 'error');
            users = [];
        }
        render();
    }

    function render() {
        const pc = document.getElementById('page-content');
        if (!pc) return;

        const totalUsers = users.length;
        const totalActive = users.filter(u => u.plano_status === 'active').length;
        const totalTrial = users.filter(u => u.plano_status === 'trial').length;
        const totalAdmins = users.filter(u => u.role === 'admin').length;

        pc.innerHTML = `
      <!-- Stats strip -->
      <div class="stats-grid" style="margin-bottom:20px;grid-template-columns:repeat(4,1fr)">
        <div class="stat-card green">
          <div class="stat-icon">👥</div>
          <div class="stat-value">${totalUsers}</div>
          <div class="stat-label">Total de Membros</div>
        </div>
        <div class="stat-card gold">
          <div class="stat-icon">⏳</div>
          <div class="stat-value">${totalTrial}</div>
          <div class="stat-label">Em Trial</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon">✅</div>
          <div class="stat-value">${totalActive}</div>
          <div class="stat-label">Ativos (pagos)</div>
        </div>
        <div class="stat-card rose">
          <div class="stat-icon">👑</div>
          <div class="stat-value">${totalAdmins}</div>
          <div class="stat-label">Administradores</div>
        </div>
      </div>

      <!-- User table -->
      <div class="card">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between">
          <h3 style="margin:0;font-size:1rem">👥 Membros do Sistema</h3>
          <input class="field-input" id="admin-search" placeholder="🔍 Buscar..." style="width:200px;padding:6px 12px" />
        </div>
        <div style="overflow-x:auto">
          <table class="clients-table" id="admin-table">
            <thead><tr>
              <th>Membro</th>
              <th>Plano</th>
              <th>Clientes</th>
              <th>Anamneses</th>
              <th>Cadastro</th>
              <th>Cargo</th>
              <th>Ações</th>
            </tr></thead>
            <tbody id="admin-tbody">
              ${renderRows(users)}
            </tbody>
          </table>
        </div>
      </div>`;

        // Search filter
        pc.querySelector('#admin-search')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const filtered = users.filter(u =>
                (u.nome || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q)
            );
            document.getElementById('admin-tbody').innerHTML = renderRows(filtered);
            bindRowEvents();
        });

        bindRowEvents();
    }

    function renderRows(list) {
        if (list.length === 0) return `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">Nenhum membro encontrado</td></tr>`;
        return list.map(u => {
            const initials = (u.nome || '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
            const isMe = u.id === auth.current?.id;
            const isAdmin = u.role === 'admin';
            return `
        <tr>
          <td>
            <div class="client-name-cell">
              <div class="client-avatar-sm" style="${isAdmin ? 'background:linear-gradient(135deg,#7c3aed,#a855f7)' : ''}">
                ${u.foto_url ? `<img src="${u.foto_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />` : initials}
              </div>
              <div>
                <div style="font-weight:600;font-size:0.9rem">${u.nome || '—'} ${isMe ? '<span style="font-size:0.7rem;color:var(--text-muted)">(você)</span>' : ''}</div>
                <div style="font-size:0.72rem;color:var(--text-muted)">${u.email || '—'}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-size:0.82rem">
              <div style="font-weight:600">${PLAN_LABELS[u.plano] || u.plano || '—'}</div>
              <div style="font-size:0.72rem">${PLAN_STATUS_LABELS[u.plano_status] || u.plano_status || '—'}</div>
            </div>
          </td>
          <td style="text-align:center;font-weight:600">${u.total_clientes || 0}</td>
          <td style="text-align:center;font-weight:600">${u.total_anamneses || 0}</td>
          <td style="font-size:0.8rem;white-space:nowrap">${formatDate(u.criado_em)}</td>
          <td>
            ${isAdmin
                    ? `<span style="background:#f3e8ff;color:#6b21a8;font-size:0.72rem;padding:2px 8px;border-radius:10px">👑 Admin</span>`
                    : `<span style="background:#f0fdf4;color:#166534;font-size:0.72rem;padding:2px 8px;border-radius:10px">👤 Membro</span>`}
          </td>
          <td>
            <div style="display:flex;gap:5px;flex-wrap:wrap">
              <button class="btn btn-secondary btn-sm" data-edit-id="${u.id}" title="Editar">✏️</button>
              <button class="btn btn-${isAdmin ? 'secondary' : 'primary'} btn-sm" data-role-id="${u.id}" data-role-current="${u.role}" title="${isAdmin ? 'Remover admin' : 'Tornar admin'}" ${isMe ? 'disabled' : ''}>
                ${isAdmin ? '👤' : '👑'}
              </button>
              <button class="btn btn-secondary btn-sm" data-plan-id="${u.id}" data-plan-current="${u.plano || 'starter'}" data-status-current="${u.plano_status || 'trial'}" title="Plano">💳</button>
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

    await load();
}
