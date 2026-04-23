import { auth, store, api } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { formatDate, toast, modal } from '../utils.js';

// Admin-only API helper
const adminApi = {
  getUsers: () => api('GET', '/api/admin/users'),
  createUser: (data) => api('POST', '/api/admin/users', data),
  updateUser: (id, data) => api('PUT', `/api/admin/users/${id}`, data),
  updatePlan: (id, data) => api('PUT', `/api/admin/users/${id}/plan`, data),
  updatePassword: (id, data) => api('PUT', `/api/admin/users/${id}/password`, data),
  getTracking: (id) => api('GET', `/api/admin/users/${id}/tracking`),
  updateTracking: (id, data) => api('PUT', `/api/admin/users/${id}/tracking`, data),
  deleteUser: (id) => api('DELETE', `/api/admin/users/${id}`),
  impersonate: (id) => api('POST', `/api/admin/users/${id}/impersonate`),
  // Planos
  getPlanos: () => api('GET', '/api/admin/planos'),
  createPlano: (data) => api('POST', '/api/admin/planos', data),
  updatePlano: (id, data) => api('PUT', `/api/admin/planos/${id}`, data),
  deletePlano: (id) => api('DELETE', `/api/admin/planos/${id}`),
  // Uso & Cortesia
  getUso: (id) => api('GET', `/api/admin/users/${id}/uso`),
  darCortesia: (id, data) => api('POST', `/api/admin/users/${id}/cortesia`, data),
  getHistorico: (id) => api('GET', `/api/admin/users/${id}/historico`),
  getPagamentos: (id) => api('GET', `/api/admin/users/${id}/pagamentos`),
  reenviarAcesso: (id) => api('POST', `/api/admin/users/${id}/reenviar-acesso`, {}),
  // Avisos
  getAvisos: () => api('GET', '/api/admin/avisos'),
  createAviso: (data) => api('POST', '/api/admin/avisos', data),
  updateAviso: (id, data) => api('PUT', `/api/admin/avisos/${id}`, data),
  deleteAviso: (id) => api('DELETE', `/api/admin/avisos/${id}`),
  // Notificações Broadcast
  getNotifHistory: () => api('GET', '/api/admin-notifications/history'),
  broadcastNotif: (data) => api('POST', '/api/admin-notifications/broadcast', data),
  getNotifPool: () => api('GET', '/api/admin-notifications/pool'),
  addToNotifPool: (data) => api('POST', '/api/admin-notifications/pool', data),
  deleteFromNotifPool: (id) => api('DELETE', `/api/admin-notifications/pool/${id}`),
  triggerNotifAutomation: () => api('POST', '/api/admin-notifications/trigger-automation', {}),
};

const salesApi = {
  getTemplate: () => api('GET', '/api/sales/admin/template'),
  updateTemplate: (dados) => api('PUT', '/api/sales/admin/template', { dados }),
  getLeads: () => api('GET', '/api/sales/admin/leads'),
  updateLead: (id, data) => api('PATCH', `/api/sales/admin/leads/${id}`, data),
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
  let avisos = [];

  async function loadAvisos() {
    try { avisos = await adminApi.getAvisos(); } catch { avisos = []; }
  }

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

      <div style="background:linear-gradient(135deg,var(--green-900),var(--green-700));border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;color:white;box-shadow:0 4px 12px rgba(0,0,0,0.1)">
         <div>
            <h3 style="margin:0;font-size:1.1rem;color:white;display:flex;align-items:center;gap:8px">🚀 Sua Página de Vendas</h3>
            <p style="margin:4px 0 0;font-size:0.85rem;color:rgba(255,255,255,0.8)">Divulgue seu CRM com uma Landing Page exclusiva de alta conversão para captar novas assinantes.</p>
         </div>
         <div style="display:flex;gap:8px">
            <button class="btn btn-secondary btn-sm" onclick="window.open('/#/vendas', '_blank')" style="background:rgba(255,255,255,0.2);color:white;border:none">👁️ Ver Página</button>
            <button class="btn btn-primary btn-sm" id="btn-copy-sales" style="background:white;color:var(--green-800);border:none" data-link="${window.location.origin}/#/vendas">📋 Copiar Link Oficial</button>
         </div>
      </div>

      <!-- Abas -->
      <div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:2px solid var(--border-light);overflow-x:auto">
        ${['membros', 'funil', 'leads', 'planos', 'avisos', 'notificacoes', 'gateway'].map(tab => `
          <button id="tab-${tab}" class="btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}" style="border-radius:8px 8px 0 0;border-bottom:none;padding:8px 18px;font-size:0.85rem;white-space:nowrap" data-tab="${tab}">
            ${{ membros: '👥 Membros', funil: '🚀 Funil Trial', leads: '📈 Funil de Vendas', planos: '📦 Planos', avisos: '🔔 Avisos', notificacoes: '📲 Notificações', gateway: '💳 Gateway' }[tab]}
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

    // Clipboard Copy
    const btnCopy = pc.querySelector('#btn-copy-sales');
    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(btnCopy.dataset.link);
          toast('Link da Landing Page copiado com sucesso!', 'success');
        } catch (e) {
          toast('Não foi possível copiar o link.', 'error');
        }
      });
    }

    const tabContent = pc.querySelector('#tab-content');
    if (activeTab === 'membros') renderMembros(tabContent);
    else if (activeTab === 'funil') renderFunil(tabContent);
    else if (activeTab === 'leads') renderLeadsSection(tabContent);
    else if (activeTab === 'planos') renderPlanosSection(tabContent);
    else if (activeTab === 'avisos') renderAvisosSection(tabContent);
    else if (activeTab === 'notificacoes') renderNotificacoesSection(tabContent);
    else if (activeTab === 'gateway') renderGatewaySection(tabContent);
  }

  // ── Aba Funil de Vendas (Leads da Plataforma) ───────────────────
  async function renderLeadsSection(container) {
    container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted)">⏳ Carregando funil de vendas...</div>`;
    
    try {
      const [leads, template] = await Promise.all([
        salesApi.getLeads(),
        salesApi.getTemplate()
      ]);

      const publicLink = `${window.location.origin}/#/vendas/capture/${template.token_publico}`;

      container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
          <h4 style="margin:0">📈 Gestão de Leads (Prospectos)</h4>
          <div style="display:flex;gap:10px">
             <button class="btn btn-secondary btn-sm" id="btn-config-sales">⚙️ Perguntas do Form</button>
             <button class="btn btn-primary btn-sm" id="btn-copy-sales-funnel" data-link="${publicLink}">📋 Copiar Link de Captura</button>
          </div>
        </div>

        <div class="card" style="padding:0;overflow:hidden;border:1px solid var(--border-light)">
          <div style="overflow-x:auto">
            <table class="table" style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0">
                  <th style="padding:12px;text-align:left;font-size:0.7rem;text-transform:uppercase;color:#64748b;font-weight:700">Prospecto</th>
                  <th style="padding:12px;text-align:left;font-size:0.7rem;text-transform:uppercase;color:#64748b;font-weight:700">Cidade</th>
                  <th style="padding:12px;text-align:center;font-size:0.7rem;text-transform:uppercase;color:#64748b;font-weight:700">Data</th>
                  <th style="padding:12px;text-align:center;font-size:0.7rem;text-transform:uppercase;color:#64748b;font-weight:700">Status</th>
                  <th style="padding:12px;text-align:right;font-size:0.7rem;text-transform:uppercase;color:#64748b;font-weight:700">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${leads.length === 0 ? '<tr><td colspan="5" style="padding:60px;text-align:center;color:var(--text-muted)">Nenhum prospecto captado ainda. Divulgue seu link!</td></tr>' : 
                  leads.map(l => `
                  <tr style="border-bottom:1px solid #f1f5f9">
                    <td style="padding:12px">
                      <div style="font-weight:600;color:var(--text-main);font-size:0.9rem">${l.nome}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted)">${l.email} | ${l.telefone || '-'}</div>
                    </td>
                    <td style="padding:12px;font-size:0.85rem">${l.cidade || '-'}</td>
                    <td style="padding:12px;text-align:center;font-size:0.8rem;color:var(--text-muted)">${formatDate(l.criado_em)}</td>
                    <td style="padding:12px;text-align:center">
                      <span class="badge" style="background:${getLeadStatusColor(l.status)};color:white;font-size:0.7rem;padding:3px 8px;border-radius:12px">${l.status.toUpperCase()}</span>
                    </td>
                    <td style="padding:12px;text-align:right">
                      <button class="btn btn-secondary btn-sm btn-view-lead" data-id="${l.id}" style="padding:5px 10px;font-size:0.75rem">👁️ Ver Detalhes</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Event listeners
      container.querySelector('#btn-copy-sales-funnel').addEventListener('click', (e) => {
        const link = e.currentTarget.dataset.link;
        navigator.clipboard.writeText(link).then(() => toast('Link de captura copiado!', 'success'));
      });

      container.querySelector('#btn-config-sales').addEventListener('click', () => showConfigSalesModal(template));

      container.querySelectorAll('.btn-view-lead').forEach(btn => {
        btn.addEventListener('click', () => {
          const lead = leads.find(x => x.id === btn.dataset.id);
          showLeadDetailsModal(lead, template, () => renderLeadsSection(container));
        });
      });

    } catch (err) {
      container.innerHTML = `<div class="empty-state">❌ Erro ao carregar: ${err.message}</div>`;
    }
  }

  function getLeadStatusColor(s) {
    switch(s) {
      case 'novo': return '#3b82f6';
      case 'em_contato': return '#f59e0b';
      case 'convertido': return '#10b981';
      case 'descartado': return '#ef4444';
      default: return '#64748b';
    }
  }

  function showLeadDetailsModal(lead, template, onUpdate) {
    const questions = template.dados.perguntas || [];
    const answers = lead.respostas || {};

    const { close } = modal('Detalhes do Prospecto', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
        <div>
          <label style="display:block;font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;font-weight:700">Dados Pessoais</label>
          <div style="font-size:1rem;font-weight:600;margin-top:4px">${lead.nome}</div>
          <div style="color:var(--text-muted);font-size:0.9rem;margin-top:2px">${lead.email}</div>
          <div style="color:var(--text-muted);font-size:0.9rem">${lead.telefone || 'Sem telefone'}</div>
          <div style="color:var(--text-muted);font-size:0.9rem">${lead.cidade || 'Cidade não informada'}</div>
        </div>
        <div>
          <label style="display:block;font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;font-weight:700">Ações</label>
          <div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">
            <a href="https://wa.me/55${lead.telefone?.replace(/\D/g, '')}" target="_blank" class="btn btn-secondary btn-sm" style="text-align:center;background:#25d366;color:white;border:none">💬 Chamar no WhatsApp</a>
            <a href="mailto:${lead.email}" class="btn btn-secondary btn-sm" style="text-align:center">✉️ Enviar E-mail</a>
          </div>
        </div>
      </div>

      <div style="margin-bottom:24px">
        <label style="display:block;font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;font-weight:700;margin-bottom:12px">Respostas da Anamnese</label>
        <div style="background:#f8fafc;border-radius:12px;padding:16px;border:1px solid #e2e8f0">
          ${questions.map(q => `
            <div style="margin-bottom:12px">
              <div style="font-size:0.85rem;font-weight:700;color:var(--green-800)">${q.texto}</div>
              <div style="font-size:0.9rem;color:var(--text-main);margin-top:2px">${answers[q.id] || '<span style="color:#cbd5e1">Não respondido</span>'}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="margin-bottom:20px">
        <label class="form-label">Status do Atendimento</label>
        <select id="lead-status" class="form-input">
          <option value="novo" ${lead.status === 'novo' ? 'selected' : ''}>🔵 Novo Lead</option>
          <option value="em_contato" ${lead.status === 'em_contato' ? 'selected' : ''}>🟠 Em Contato</option>
          <option value="convertido" ${lead.status === 'convertido' ? 'selected' : ''}>🟢 Convertido (Assinou)</option>
          <option value="descartado" ${lead.status === 'descartado' ? 'selected' : ''}>🔴 Descartado</option>
        </select>
      </div>

      <div style="margin-bottom:24px">
        <label class="form-label">Notas Administrativas (Privado)</label>
        <textarea id="lead-notes" class="form-input" style="height:80px" placeholder="Anotações sobre a negociação...">${lead.notas_admin || ''}</textarea>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:12px">
        <button class="btn btn-secondary" id="btn-close-lead-modal">Fechar</button>
        <button class="btn btn-primary" id="btn-save-lead">Salvar Alterações</button>
      </div>
    `);

    document.getElementById('btn-close-lead-modal').addEventListener('click', close);

    document.getElementById('btn-save-lead').addEventListener('click', async () => {
      const status = document.getElementById('lead-status').value;
      const notas_admin = document.getElementById('lead-notes').value;
      try {
        await salesApi.updateLead(lead.id, { status, notas_admin });
        toast('Prospecto atualizado!', 'success');
        close();
        onUpdate();
      } catch (err) {
        toast('Erro ao salvar: ' + err.message, 'error');
      }
    });
  }

  function showConfigSalesModal(template) {
    let questions = JSON.parse(JSON.stringify(template.dados.perguntas || []));

    function renderList() {
      const list = document.getElementById('questions-list');
      list.innerHTML = questions.map((q, idx) => `
        <div style="background:#f1f5f9;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:0.85rem">
            <strong>Q${idx+1}:</strong> ${q.texto} <span style="color:#64748b;font-size:0.75rem">(${q.tipo})</span>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="this.parentElement.remove(); questions.splice(${idx},1); renderList();" style="padding:4px 8px;color:#ef4444">❌</button>
        </div>
      `).join('');
      window.questions = questions; // Leak to global for simple onclick handlers in modal
    }

    const { close } = modal('Configurar Anamnese de Vendas', `
      <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:20px">Defina quais perguntas o interessado deve responder ao acessar seu link de captura.</p>
      
      <div id="questions-list" style="margin-bottom:20px"></div>

      <div style="background:#fffbeb;border:1px solid #fcd34d;padding:12px;border-radius:8px;margin-bottom:20px">
        <h5 style="margin:0 0 8px;font-size:0.85rem">➕ Adicionar Pergunta</h5>
        <div style="display:flex;gap:8px">
          <input type="text" id="new-q-text" class="form-input" placeholder="Texto da pergunta..." style="flex:1">
          <select id="new-q-type" class="form-input" style="width:120px">
            <option value="text">Texto</option>
            <option value="textarea">Área de Texto</option>
            <option value="select">Seleção (Sim/Não)</option>
          </select>
          <button class="btn btn-primary btn-sm" id="btn-add-q">Add</button>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px">
        <button class="btn btn-secondary" id="btn-close-sales-modal">Cancelar</button>
        <button class="btn btn-primary" id="btn-save-tpl">Salvar Questionário</button>
      </div>
    `);

    document.getElementById('btn-close-sales-modal').addEventListener('click', close);

    renderList();

    document.getElementById('btn-add-q').addEventListener('click', () => {
      const text = document.getElementById('new-q-text').value;
      const type = document.getElementById('new-q-type').value;
      if (!text) return toast('Digite o texto da pergunta', 'warning');
      
      questions.push({
        id: 'q_' + Math.random().toString(36).substr(2, 5),
        texto: text,
        tipo: type,
        opcoes: type === 'select' ? ['Sim', 'Não'] : undefined
      });
      document.getElementById('new-q-text').value = '';
      renderList();
    });

    document.getElementById('btn-save-tpl').addEventListener('click', async () => {
      try {
        await salesApi.updateTemplate({ perguntas: questions });
        toast('Questionário atualizado!', 'success');
        close();
      } catch (err) {
        toast('Erro ao salvar template: ' + err.message, 'error');
      }
    });
  }

  // ── Aba Funil (Kanban) ─────────────────────────────────────────
  function renderFunil(container) {
    const groups = {
      lead: [], trial: [], engajado: [],
      expirado: [], assinante: [], perdido: []
    };

    const now = new Date();
    users.forEach(u => {
      if (u.plano_status === 'active') { groups.assinante.push(u); return; }
      if (u.plano_status === 'cancelled' || u.plano_status === 'overdue') { groups.perdido.push(u); return; }

      const isExpired = u.trial_fim ? new Date(u.trial_fim) < now : true;
      const createdAt = new Date(u.criado_em);
      const daysSinceCreation = (now - createdAt) / 86400000;
      const hasActivity = (u.total_clientes > 0 || u.total_anamneses_mes > 0);

      // Status 'expired' mapped directly or caught by trial_fim
      if (u.plano_status === 'expired' || isExpired) {
        if (isExpired && u.trial_fim && (now - new Date(u.trial_fim))/86400000 > 15) {
          groups.perdido.push(u);
        } else {
          groups.expirado.push(u);
        }
        return;
      }

      // Default Trial processing
      if (hasActivity) groups.engajado.push(u);
      else if (daysSinceCreation <= 2) groups.lead.push(u);
      else groups.trial.push(u);
    });

    const renderCard = (u) => {
      const phone = u.telefone ? u.telefone.replace(/\D/g, '') : '';
      const waLink = phone.length >= 10 ? `https://wa.me/55${phone}?text=Ol%C3%A1%2C%20%2A${encodeURIComponent((u.nome || '').split(' ')[0])}%2A%21` : '';
      
      const initials = (u.nome || '').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || '?';
      return `
        <div class="card" style="padding:12px; margin-bottom:10px; cursor:default">
          <div style="display:flex; gap:10px; align-items:center; margin-bottom:8px">
            <div class="client-avatar-sm">${u.foto_url ? `<img src="${u.foto_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : initials}</div>
            <div style="flex:1; min-width:0">
              <div style="font-weight:700; font-size:0.88rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${u.nome || '—'}</div>
              <div style="font-size:0.75rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${u.email || '—'}</div>
            </div>
          </div>
          <div style="display:flex; gap:6px; margin-bottom:12px">
             ${u.total_clientes > 0 ? `<span style="background:#eff6ff; color:#1d4ed8; font-size:0.7rem; padding:2px 6px; border-radius:4px">${u.total_clientes} clientes</span>` : ''}
             ${u.total_anamneses_mes > 0 ? `<span style="background:#f3e8ff; color:#7e22ce; font-size:0.7rem; padding:2px 6px; border-radius:4px">${u.total_anamneses_mes} anamneses</span>` : ''}
          </div>
          <div style="display:grid; grid-template-columns:1fr ${waLink ? '1fr' : ''}; gap:6px">
             <button class="btn btn-secondary btn-sm" data-cortesia-id="${u.id}" style="width:100%; padding:6px; font-size:0.75rem">🎁 Dar Trial</button>
             ${waLink ? `<button class="btn btn-primary btn-sm" onclick="window.open('${waLink}', '_blank')" style="background:#25D366; border:none; width:100%; padding:6px; font-size:0.75rem">💬 Chamar</button>` : ''}
          </div>
        </div>`;
    };

    container.innerHTML = `
      <div style="display:flex; gap:16px; overflow-x:auto; padding-bottom:20px; align-items:flex-start">
        <!-- Coluna Lead Novo -->
        <div style="min-width:280px; width:280px; background:#f8fafc; border-radius:12px; padding:12px; border:1px solid #e2e8f0; flex-shrink:0; max-height:calc(100vh - 250px); overflow-y:auto; display:flex; flex-direction:column">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px">
             <h4 style="margin:0; font-size:0.9rem; color:#0f172a; display:flex; align-items:center; gap:6px"><span style="color:#10b981">🟢</span> Novos Leads</h4>
             <span style="background:#e2e8f0; color:#475569; font-size:0.75rem; padding:2px 8px; border-radius:10px; font-weight:700">${groups.lead.length}</span>
          </div>
          ${groups.lead.map(renderCard).join('') || '<div style="text-align:center;color:var(--text-muted);font-size:0.8rem;padding:20px 0">Sem leads hoje</div>'}
        </div>

        <!-- Coluna Trial Ativo -->
        <div style="min-width:280px; width:280px; background:#f8fafc; border-radius:12px; padding:12px; border:1px solid #e2e8f0; flex-shrink:0; max-height:calc(100vh - 250px); overflow-y:auto; display:flex; flex-direction:column">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px">
             <h4 style="margin:0; font-size:0.9rem; color:#0f172a; display:flex; align-items:center; gap:6px"><span style="color:#3b82f6">⏳</span> Trial Ativo</h4>
             <span style="background:#e2e8f0; color:#475569; font-size:0.75rem; padding:2px 8px; border-radius:10px; font-weight:700">${groups.trial.length}</span>
          </div>
          ${groups.trial.map(renderCard).join('') || '<div style="text-align:center;color:var(--text-muted);font-size:0.8rem;padding:20px 0">Zero</div>'}
        </div>

        <!-- Coluna Engajados -->
        <div style="min-width:280px; width:280px; background:#fffbeb; border-radius:12px; padding:12px; border:1px solid #fcd34d; flex-shrink:0; max-height:calc(100vh - 250px); overflow-y:auto; display:flex; flex-direction:column">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px">
             <h4 style="margin:0; font-size:0.9rem; color:#92400e; display:flex; align-items:center; gap:6px"><span style="color:#f59e0b">🔥</span> Engajados (Hot)</h4>
             <span style="background:#fde68a; color:#b45309; font-size:0.75rem; padding:2px 8px; border-radius:10px; font-weight:700">${groups.engajado.length}</span>
          </div>
          <p style="font-size:0.75rem; color:#92400e; margin-top:-6px; margin-bottom:12px">Usaram clientes/anamneses. Chame no WhatsApp!</p>
          ${groups.engajado.map(renderCard).join('') || '<div style="text-align:center;color:#b45309;font-size:0.8rem;padding:20px 0">Nenhum no momento</div>'}
        </div>

        <!-- Coluna Trial Expirado -->
        <div style="min-width:280px; width:280px; background:#fef2f2; border-radius:12px; padding:12px; border:1px solid #fca5a5; flex-shrink:0; max-height:calc(100vh - 250px); overflow-y:auto; display:flex; flex-direction:column">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px">
             <h4 style="margin:0; font-size:0.9rem; color:#991b1b; display:flex; align-items:center; gap:6px"><span style="color:#ef4444">⏰</span> Trial Expirado</h4>
             <span style="background:#fecaca; color:#b91c1c; font-size:0.75rem; padding:2px 8px; border-radius:10px; font-weight:700">${groups.expirado.length}</span>
          </div>
          <p style="font-size:0.75rem; color:#991b1b; margin-top:-6px; margin-bottom:12px">Estenda o trial p/ recapturar.</p>
          ${groups.expirado.map(renderCard).join('') || '<div style="text-align:center;color:#b91c1c;font-size:0.8rem;padding:20px 0">Limpo!</div>'}
        </div>

        <!-- Coluna Assinantes -->
        <div style="min-width:280px; width:280px; background:#f0fdf4; border-radius:12px; padding:12px; border:1px solid #86efac; flex-shrink:0; max-height:calc(100vh - 250px); overflow-y:auto; display:flex; flex-direction:column">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px">
             <h4 style="margin:0; font-size:0.9rem; color:#166534; display:flex; align-items:center; gap:6px"><span style="color:#10b981">💎</span> Assinantes</h4>
             <span style="background:#bbf7d0; color:#15803d; font-size:0.75rem; padding:2px 8px; border-radius:10px; font-weight:700">${groups.assinante.length}</span>
          </div>
          ${groups.assinante.map(renderCard).join('') || '<div style="text-align:center;color:#15803d;font-size:0.8rem;padding:20px 0">Ainda não</div>'}
        </div>

        <!-- Coluna Inativo/Perdido -->
        <div style="min-width:280px; width:280px; background:#f1f5f9; border-radius:12px; padding:12px; border:1px solid #cbd5e1; flex-shrink:0; opacity:0.8">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px">
             <h4 style="margin:0; font-size:0.9rem; color:#334155; display:flex; align-items:center; gap:6px"><span style="color:#64748b">❌</span> Perdidos (15d+)</h4>
             <span style="background:#e2e8f0; color:#475569; font-size:0.75rem; padding:2px 8px; border-radius:10px; font-weight:700">${groups.perdido.length}</span>
          </div>
          ${groups.perdido.map(renderCard).join('') || '<div style="text-align:center;color:#475569;font-size:0.8rem;padding:20px 0">Zero</div>'}
        </div>
      </div>
    `;

    // Bind events for "Dar Cortesia" bubbles
    container.querySelectorAll('[data-cortesia-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = users.find(x => x.id === btn.dataset.cortesiaId);
        if (!u) return;
        showCortesiaModal(u);
      });
    });
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
          <button class="btn btn-primary btn-sm" id="btn-add-member" style="padding:6px 12px;font-size:0.82rem">+ Novo Membro</button>
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
    container.querySelector('#btn-add-member')?.addEventListener('click', showCreateUserModal);
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
          <td style="text-align:center;">
            <div style="font-size:0.75rem;margin-bottom:2px;font-weight:600">${u.total_clientes || 0} / ${u.clientes_max || '∞'}</div>
            <div style="width:100%;height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden">
              <div style="width:${u.clientes_max ? Math.min(100, ((u.total_clientes || 0) / u.clientes_max) * 100).toFixed(0) : 50}%;height:100%;background:${(u.clientes_max && ((u.total_clientes || 0) / u.clientes_max) > 0.9) ? '#dc2626' : '#3b82f6'};border-radius:2px"></div>
            </div>
          </td>
          <td style="text-align:center;">
            <div style="font-size:0.75rem;margin-bottom:2px;font-weight:600">${u.total_anamneses_mes || 0} / ${u.anamneses_mes_max || '∞'}</div>
            <div style="width:100%;height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden">
              <div style="width:${u.anamneses_mes_max ? Math.min(100, ((u.total_anamneses_mes || 0) / u.anamneses_mes_max) * 100).toFixed(0) : 50}%;height:100%;background:${(u.anamneses_mes_max && ((u.total_anamneses_mes || 0) / u.anamneses_mes_max) > 0.9) ? '#dc2626' : '#8b5cf6'};border-radius:2px"></div>
            </div>
          </td>
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
              <button class="btn btn-primary btn-sm" data-impersonate-id="${u.id}" data-impersonate-nome="${u.nome}" title="Acessar conta como ${u.nome ? u.nome.split(' ')[0] : 'usuário'}" ${isMe ? 'disabled style="opacity:0.5"' : 'style="background:#3b82f6;border:none"'}>🚪</button>
              <button class="btn btn-secondary btn-sm" data-tracking-id="${u.id}" title="Rastreamento">📊</button>
              <button class="btn btn-secondary btn-sm" data-plan-id="${u.id}" data-plan-current="${u.plano || 'starter'}" data-status-current="${u.plano_status || 'trial'}" title="Alterar Plano">💳</button>
              <button class="btn btn-secondary btn-sm" data-cortesia-id="${u.id}" data-cortesia-nome="${u.nome}" title="Conceder Cortesia">🎁</button>
              <button class="btn btn-secondary btn-sm" data-historico-id="${u.id}" data-historico-nome="${u.nome}" title="Histórico de Assinaturas (Hotmart/Pagamentos)">📜</button>
              <button class="btn btn-secondary btn-sm" data-reenvio-id="${u.id}" data-reenvio-nome="${u.nome}" title="Reenviar Email de Acesso">📧</button>
              ${u.telefone && u.telefone.replace(/\\D/g, '').length >= 10 ? `<button class="btn btn-sm" style="background:#25D366;color:white;border:none" onclick="window.open('https://wa.me/55${u.telefone.replace(/\\D/g, '')}?text=Ol%C3%A1%2C%20%2A${encodeURIComponent((u.nome || '').split(' ')[0])}%2A%21', '_blank')" title="Chamar no WhatsApp">💬</button>` : `<button class="btn btn-secondary btn-sm" title="Telefone ausente ou inválido" disabled style="opacity: 0.5;">💬</button>`}
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

    // Impersonate
    tbody.querySelectorAll('[data-impersonate-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = users.find(x => x.id === btn.dataset.impersonateId);
        if (!u) return;
        modal('🚪 Acessar Sistema', `
          <div style="text-align:center">
            <div style="font-size:2.5rem;margin-bottom:12px">🕵️‍♂️</div>
            <p>Deseja acessar a conta de <strong>${u.nome || 'este usuário'}</strong>?</p>
            <p style="font-size:0.85rem;color:var(--text-muted)">
              Você será logado na conta deste membro imediatamente, sem a necessidade de senha.<br>
              <span style="color:#ca8a04;font-weight:600">Para retornar ao seu perfil Admin, você precisará sair da conta (Logout) no menu lateral e fazer login novamente com sua senha.</span>
            </p>
          </div>`, {
          confirmLabel: '🚪 Entrar na Conta',
          onConfirm: async () => {
            try {
              const res = await adminApi.impersonate(u.id);
              toast(`Bem-vindo, acessando como ${u.nome.split(' ')[0]}...`);
              
              sessionStorage.setItem('se_token', res.token);
              if (res.csrfToken) sessionStorage.setItem('se_csrf', res.csrfToken);
              sessionStorage.setItem('se_user', JSON.stringify(res.consultora));

              auth._current = res.consultora;

              setTimeout(() => {
                window.location.hash = '#/dashboard';
                window.location.reload();
              }, 600);
            } catch (err) { toast('Erro: ' + err.message, 'error'); return false; }
          }
        });
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

    // Histórico de Assinaturas
    tbody.querySelectorAll('[data-historico-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = users.find(x => x.id === btn.dataset.historicoId);
        if (!u) return;
        showHistoricoModal(u);
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

  async function showHistoricoModal(u) {
    let hist = [];
    try {
      hist = await adminApi.getHistorico(u.id);
    } catch (e) { toast('Erro ao buscar histórico', 'error'); return; }

    const tbody = hist.length === 0 ? '<tr><td colspan="5" class="text-center">Nenhum registro encontrado.</td></tr>' : hist.map(h => `
      <tr>
        <td>${new Date(h.criado_em).toLocaleDateString('pt-BR')}</td>
        <td><strong>${PLAN_LABELS[h.plano] || h.plano}</strong></td>
        <td>${PLAN_STATUS_LABELS[h.status] || h.status}</td>
        <td>${h.gateway === 'hotmart' ? 'Hotmart' : 'Manual'}</td>
        <td style="font-size:0.75rem">${h.hotmart_transaction_id || h.hotmart_subscription_id || '—'}</td>
      </tr>
    `).join('');

    modal('📜 Histórico de Assinaturas — ' + u.nome, `
      <div style="overflow-x:auto;max-height:400px;overflow-y:auto">
        <table class="clients-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Origem</th>
              <th>Transação/ID</th>
            </tr>
          </thead>
          <tbody>${tbody}</tbody>
        </table>
      </div>
    `, { confirmLabel: 'Fechar', onConfirm: () => true });
  }

  function showCortesiaModal(u) {
    modal('🎁 Conceder Cortesia — ' + u.nome, `
      <p>Estenda o tempo de acesso gratuito (Trial) deste usuário. Os dias serão somados a partir de hoje ou do prazo atual.</p>
      <div class="form-group">
        <label class="field-label">Dias de cortesia adicionar</label>
        <select class="field-select" id="cortesia-dias">
          <option value="7">7 dias</option>
          <option value="15">15 dias</option>
          <option value="30" selected>30 dias (1 mês)</option>
          <option value="90">90 dias (3 meses)</option>
          <option value="365">365 dias (1 ano)</option>
        </select>
      </div>
    `, {
      confirmLabel: '✔️ Conceder',
      onConfirm: async () => {
        const dias = document.getElementById('cortesia-dias').value;
        try {
          await adminApi.darCortesia(u.id, { dias });
          toast(`Sucesso! ${dias} dias adicionados.`);
          await load();
          return true;
        } catch (err) { toast('Erro: ' + err.message, 'error'); return false; }
      }
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

  function showCreateUserModal() {
    const planOptions = planos.map(p => `<option value="${p.slug}">${p.nome}</option>`).join('');
    modal('➕ Novo Membro do Sistema', `
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Nome Completo *</label>
          <input class="field-input" id="an-nome" placeholder="Ex: Maria Oliveira" />
        </div>
        <div class="form-group">
          <label class="field-label">E-mail de Acesso *</label>
          <input class="field-input" id="an-email" type="email" placeholder="email@exemplo.com" />
        </div>
        <div class="form-group">
          <label class="field-label">Telefone / WhatsApp</label>
          <input class="field-input" id="an-telefone" placeholder="(00) 00000-0000" />
        </div>
        <div class="form-group">
          <label class="field-label">Plano Inicial</label>
          <select class="field-select" id="an-plano">
            ${planOptions}
          </select>
        </div>
        <div class="form-group">
          <label class="field-label">Dias de Trial Gratuito</label>
          <input class="field-input" id="an-trial" type="number" value="7" min="0" />
        </div>
      </div>
      <div style="margin-top:16px;padding:12px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;font-size:0.82rem;color:#0369a1">
        💡 O sistema gerará uma <strong>senha aleatória</strong> e enviará para o e-mail informado (se o SMTP estiver configurado).
      </div>`, {
      confirmLabel: '🚀 Criar Membro',
      onConfirm: async () => {
        const data = {
          nome: document.getElementById('an-nome')?.value?.trim(),
          email: document.getElementById('an-email')?.value?.trim(),
          telefone: document.getElementById('an-telefone')?.value?.trim(),
          plano: document.getElementById('an-plano')?.value,
          trial_dias: document.getElementById('an-trial')?.value || 7,
          role: 'user'
        };

        if (!data.nome || !data.email) {
          toast('Nome e e-mail são obrigatórios.', 'error');
          return false;
        }

        try {
          const res = await adminApi.createUser(data);
          toast(`✅ Membro ${res.consultora.nome} criado com sucesso!`);
          
          // Show password in another modal for convenience
          modal('🔑 Senha de Acesso Gerada', `
            <div style="text-align:center;padding:10px">
              <p>O membro foi criado com sucesso. Como medida de segurança, informe a senha abaixo para o usuário:</p>
              <div style="background:#f1f5f9;padding:15px;border-radius:8px;font-family:monospace;font-size:1.4rem;font-weight:700;margin:20px 0;border:1px dashed #cbd5e1;letter-spacing:1px">
                ${res.tempPassword}
              </div>
              <p style="font-size:0.85rem;color:var(--text-muted)">Uma cópia desta senha foi enviada para o e-mail: <strong>${res.consultora.email}</strong></p>
              <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText('${res.tempPassword}').then(() => this.textContent='📋 Copiado!')" style="margin-top:10px">📋 Copiar Senha</button>
            </div>
          `, { confirmLabel: 'Entendido' });

          await load();
          return true;
        } catch (err) {
          toast('Erro ao criar: ' + err.message, 'error');
          return false;
        }
      }
    });
    setTimeout(() => document.getElementById('an-nome')?.focus(), 100);
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

  // ── Aba Avisos ─────────────────────────────────────────────────
  async function renderAvisosSection(container) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted)">⏳ Carregando avisos...</div>`;
    await loadAvisos();

    const renderTable = () => `
      <div class="card">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between">
          <h3 style="margin:0;font-size:0.95rem">🔔 Histórico de Avisos</h3>
          <button class="btn btn-primary btn-sm" id="btn-novo-aviso">+ Criar Aviso</button>
        </div>
        <div style="overflow-x:auto">
          <table class="clients-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Local</th>
                <th>Status</th>
                <th>Leituras (Modais)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${avisos.length === 0 ? '<tr><td colspan="7" style="text-align:center;padding:30px">Nenhum aviso disparado.</td></tr>' : avisos.map(a => `
                <tr>
                  <td style="font-size:0.8rem">${formatDate(a.criado_em)}</td>
                  <td><strong>${a.titulo}</strong></td>
                  <td><span style="font-size:0.75rem;padding:2px 8px;border-radius:10px;background:${a.tipo === 'danger' ? '#fee2e2;color:#991b1b' : a.tipo === 'success' ? '#dcfce7;color:#166534' : a.tipo === 'warning' ? '#fef3c7;color:#92400e' : '#e0e7ff;color:#3730a3'}">${a.tipo}</span></td>
                  <td style="font-size:0.8rem">${a.exibicao === 'ambos' ? 'Modal + Banner' : a.exibicao}</td>
                  <td>${a.ativo ? '✅ Ativo' : '⛔ Inativo'}</td>
                  <td style="text-align:center">${a.exibicao === 'banner' ? '—' : a.leituras || 0}</td>
                  <td>
                    <div style="display:flex;gap:4px">
                      <button class="btn btn-secondary btn-sm" data-edit-aviso='${JSON.stringify(a)}' title="Editar">✏️</button>
                      <button class="btn btn-danger btn-sm" data-del-aviso-id="${a.id}" data-del-aviso-nome="${a.titulo}" title="Excluir">🗑️</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    function showAvisoModal(aviso = null) {
      const a = aviso || { ativo: true, tipo: 'info', exibicao: 'ambos' };
      modal(`${aviso ? '✏️ Editar' : '➕ Disparar'} Aviso`, `
        <div class="form-grid">
          <div class="form-group form-field-full">
            <label class="field-label">Título do Aviso *</label>
            <input class="field-input" id="av_titulo" value="${a.titulo || ''}" placeholder="Ex: Manutenção Programada ou Nova Atualização!" />
          </div>
          <div class="form-group form-field-full">
            <label class="field-label">Mensagem Completa *</label>
            <textarea class="field-textarea" id="av_mensagem" rows="3" placeholder="Escreva o texto do aviso... Pode usar emojis!">${a.mensagem || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="field-label">Tipo Visual</label>
            <select class="field-select" id="av_tipo">
              <option value="info" ${a.tipo === 'info' ? 'selected' : ''}>🔵 Informativo</option>
              <option value="success" ${a.tipo === 'success' ? 'selected' : ''}>🟢 Sucesso / Novidade</option>
              <option value="warning" ${a.tipo === 'warning' ? 'selected' : ''}>🟡 Alerta / Importante</option>
              <option value="danger" ${a.tipo === 'danger' ? 'selected' : ''}>🔴 Urgente / Erro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="field-label">Local de Exibição</label>
            <select class="field-select" id="av_exibicao">
              <option value="ambos" ${a.exibicao === 'ambos' ? 'selected' : ''}>Modal Obrigatório + Banner no Topo</option>
              <option value="modal" ${a.exibicao === 'modal' ? 'selected' : ''}>Apenas Modal (Pop-up)</option>
              <option value="banner" ${a.exibicao === 'banner' ? 'selected' : ''}>Apenas Banner Fixo (Silencioso)</option>
            </select>
          </div>
          <div class="form-group form-field-full" style="display:flex;gap:16px;margin-top:8px">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.9rem">
              <input type="checkbox" id="av_ativo" ${a.ativo ? 'checked' : ''} style="width:16px;height:16px"> 
              Deixar ativo (Visível imediatamente para as consultoras)
            </label>
          </div>
        </div>
        ${!aviso ? '<div style="margin-top:10px;font-size:0.8rem;color:#b45309;padding:10px;background:#fffbeb;border-radius:8px">⚠️ <strong>Atenção:</strong> Ao salvar, este aviso será disparado imediatamente para todas as usuárias ativas!</div>' : ''}
      `, {
        confirmLabel: aviso ? '💾 Salvar Alterações' : '🚀 Disparar Aviso',
        onConfirm: async () => {
          const payload = {
            titulo: document.getElementById('av_titulo')?.value?.trim(),
            mensagem: document.getElementById('av_mensagem')?.value?.trim(),
            tipo: document.getElementById('av_tipo')?.value,
            exibicao: document.getElementById('av_exibicao')?.value,
            ativo: document.getElementById('av_ativo')?.checked,
          };
          if (!payload.titulo || !payload.mensagem) {
            toast('Título e mensagem são obrigatórios.', 'error');
            return false;
          }
          try {
            if (aviso) await adminApi.updateAviso(aviso.id, payload);
            else await adminApi.createAviso(payload);
            toast(`Aviso ${aviso ? 'atualizado' : 'disparado'} com sucesso! ✅`);
            await loadAvisos();
            container.innerHTML = renderTable();
            bindAvisoEvents();
            return true;
          } catch (err) {
            toast('Erro: ' + err.message, 'error');
            return false;
          }
        }
      });
    }

    function bindAvisoEvents() {
      container.querySelector('#btn-novo-aviso')?.addEventListener('click', () => showAvisoModal());
      container.querySelectorAll('[data-edit-aviso]').forEach(btn => {
        btn.addEventListener('click', () => showAvisoModal(JSON.parse(btn.dataset.editAviso)));
      });
      container.querySelectorAll('[data-del-aviso-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          modal('🗑️ Excluir Aviso', `<p>Apagar permanentemente o aviso <strong>${btn.dataset.delAvisoNome}</strong>?</p><p style="font-size:0.8rem;color:var(--text-muted)">Isso vai retirá-lo dos banners e limpar do banco de dados.</p>`, {
            confirmLabel: 'Excluir', confirmClass: 'btn-danger',
            onConfirm: async () => {
              try {
                await adminApi.deleteAviso(btn.dataset.delAvisoId);
                toast('Aviso deletado.');
                await loadAvisos();
                container.innerHTML = renderTable();
                bindAvisoEvents();
              } catch (err) { toast('Erro: ' + err.message, 'error'); }
            }
          });
        });
      });
    }

    container.innerHTML = renderTable();
    bindAvisoEvents();
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
          <div class="form-group" style="display:flex;gap:12px">
            <div style="flex:1">
              <label class="field-label">Preço Mensal (R$)</label>
              <input class="field-input" id="pp-preco" type="number" step="0.01" min="0" value="${p.preco_mensal || 0}" />
            </div>
            <div style="flex:1">
              <label class="field-label">Preço Semestral (R$)</label>
              <input class="field-input" id="pp-preco-sem" type="number" step="0.01" min="0" value="${p.preco_semestral || ''}" placeholder="Opcional" />
            </div>
            <div style="flex:1">
              <label class="field-label">Preço Anual (R$)</label>
              <input class="field-input" id="pp-preco-ano" type="number" step="0.01" min="0" value="${p.preco_anual || ''}" placeholder="Opcional" />
            </div>
          </div>
          <div class="form-group">
            <label class="field-label">Dias de Trial Gratuito (0 = sem trial)</label>
            <input class="field-input" id="pp-trial" type="number" min="0" value="${p.dias_trial || 0}" />
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
            ${[['tem_integracoes', 'Integrações (Pixel/GA)'], ['tem_pipeline', 'Pipeline/Fluxo'], ['tem_multiusuario', 'Multi-usuário'], ['tem_relatorios', 'Relatórios'],
                ['tem_pagina_pessoal', 'Página Pessoal (Vitrine)'], ['tem_raiox', 'Raio-X (Anamnese B2B)'], ['tem_minhas_vendas', 'Minhas Vendas'], ['tem_radar', 'Radar de Leads'],
                ['tem_agenda', 'Agenda/Follow-up'], ['tem_links', 'Links de Captação'], ['tem_anamneses', 'Laudos/Anamneses'], ['tem_clientes', 'Gestão de Clientes'],
                ['tem_estoque', 'Meu Estoque'], ['tem_depoimentos', 'Depoimentos']
              ].map(([k, l]) =>
        `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.85rem;padding:4px;width:calc(50% - 8px)">
                <input type="checkbox" id="pp-${k}" ${p[k] !== false ? 'checked' : ''} style="width:16px;height:16px"> ${l}
              </label>`).join('')}
          </div>
        </div>`, {
        confirmLabel: plano ? '💾 Salvar Plano' : '➕ Criar Plano',
        onConfirm: async () => {
          const data = {
            slug: document.getElementById('pp-slug')?.value?.trim(),
            nome: document.getElementById('pp-nome')?.value?.trim(),
            preco_mensal: parseFloat(document.getElementById('pp-preco')?.value) || 0,
            preco_semestral: parseFloat(document.getElementById('pp-preco-sem')?.value) || null,
            preco_anual: parseFloat(document.getElementById('pp-preco-ano')?.value) || null,
            dias_trial: parseInt(document.getElementById('pp-trial')?.value) || 0,
            clientes_max: parseInt(document.getElementById('pp-clientes')?.value) || null,
            anamneses_mes_max: parseInt(document.getElementById('pp-anamneses')?.value) || null,
            hotmart_offer_id: document.getElementById('pp-hotmart')?.value?.trim() || null,
            tem_integracoes: document.getElementById('pp-tem_integracoes')?.checked,
            tem_pipeline: document.getElementById('pp-tem_pipeline')?.checked,
            tem_multiusuario: document.getElementById('pp-tem_multiusuario')?.checked,
            tem_relatorios: document.getElementById('pp-tem_relatorios')?.checked,
            tem_pagina_pessoal: document.getElementById('pp-tem_pagina_pessoal')?.checked,
            tem_raiox: document.getElementById('pp-tem_raiox')?.checked,
            tem_minhas_vendas: document.getElementById('pp-tem_minhas_vendas')?.checked,
            tem_radar: document.getElementById('pp-tem_radar')?.checked,
            tem_agenda: document.getElementById('pp-tem_agenda')?.checked,
            tem_links: document.getElementById('pp-tem_links')?.checked,
            tem_anamneses: document.getElementById('pp-tem_anamneses')?.checked,
            tem_clientes: document.getElementById('pp-tem_clientes')?.checked,
            tem_estoque: document.getElementById('pp-tem_estoque')?.checked,
            tem_depoimentos: document.getElementById('pp-tem_depoimentos')?.checked,
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
    // Usa a lista de planos já carregada do banco (variável `planos`)
    // Se ainda não carregou, carrega agora
    const buildModal = (planosDisponiveis) => {
      const optionsHtml = planosDisponiveis.length > 0
        ? planosDisponiveis.map(p =>
            `<option value="${p.slug}" ${(u.plano === p.slug || (!u.plano && p.slug === 'starter')) ? 'selected' : ''}>${p.nome} — R$ ${parseFloat(p.preco_mensal || 0).toFixed(2).replace('.', ',')}/mês</option>`
          ).join('')
        : `<option value="starter" ${(!u.plano || u.plano === 'starter') ? 'selected' : ''}>Starter</option>
           <option value="pro" ${u.plano === 'pro' ? 'selected' : ''}>Pro</option>
           <option value="enterprise" ${u.plano === 'enterprise' ? 'selected' : ''}>Enterprise</option>`;

      modal('💳 Alterar Plano — ' + u.nome, `
        <div class="form-grid">
          <div class="form-group">
            <label class="field-label">Plano</label>
            <select class="field-select" id="ap-plano">
              ${optionsHtml}
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
          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="field-label">Vencimento Manual (Opcional)</label>
            <input type="date" class="field-input" id="ap-vencimento" value="${u.periodo_fim ? u.periodo_fim.split('T')[0] : ''}">
            <small style="color:var(--text-muted)">Se deixado em branco, não alterará a data atual.</small>
          </div>
        </div>
        <div style="margin-top:12px;padding:12px;background:#f0fdf4;border-radius:8px;font-size:0.85rem">
          💡 Definindo como <strong>Ativo</strong> libera acesso completo ao sistema imediatamente.
        </div>`, {
        confirmLabel: '💳 Atualizar Plano',
        onConfirm: async () => {
          const plano = document.getElementById('ap-plano')?.value;
          const status = document.getElementById('ap-status')?.value;
          const periodo_fim = document.getElementById('ap-vencimento')?.value || null;
          try {
            await adminApi.updatePlan(u.id, { plano, status, periodo_fim });
            toast('Plano atualizado! ✅');
            await load();
          } catch (err) { toast('Erro: ' + err.message, 'error'); }
        }
      });
    };

    if (planos && planos.length > 0) {
      buildModal(planos);
    } else {
      // Carrega os planos do servidor caso ainda não estejam na memória
      adminApi.getPlanos().then(lista => {
        planos = lista || [];
        buildModal(planos);
      }).catch(() => buildModal([]));
    }
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

  // ── Aba Notificações ───────────────────────────────────────────
  async function renderNotificacoesSection(container) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted)">⏳ Carregando notificações...</div>`;
    
    let history = [];
    let pool = [];
    
    async function loadData() {
        try {
            [history, pool] = await Promise.all([
                adminApi.getNotifHistory().catch(() => []),
                adminApi.getNotifPool().catch(() => [])
            ]);
        } catch (e) { toast('Erro ao carregar dados', 'error'); }
    }

    await loadData();

    const render = () => {
        container.innerHTML = `
            <div class="form-grid">
                <!-- Envio Imediato -->
                <div class="card" style="grid-column: 1 / -1">
                    <div style="padding:14px 18px;border-bottom:1px solid var(--border-light)">
                        <h3 style="margin:0;font-size:0.95rem">📲 Enviar Notificação Imediata (Broadcast)</h3>
                    </div>
                    <div style="padding:20px">
                        <div class="form-grid">
                            <div class="form-group form-field-full">
                                <label class="field-label">Título da Notificação</label>
                                <input class="field-input" id="bn-titulo" placeholder="Ex: 👋 Olá {nome}, temos novidades!" />
                                <small style="color:var(--text-muted)">Use {nome} para personalizar com o primeiro nome do consultor.</small>
                            </div>
                            <div class="form-group form-field-full">
                                <label class="field-label">Mensagem (Corpo)</label>
                                <textarea class="field-textarea" id="bn-mensagem" rows="2" placeholder="Descreva o incentivo ou comunicado..."></textarea>
                            </div>
                        </div>
                        <div style="margin-top:16px; display:flex; justify-content:flex-end">
                            <button class="btn btn-primary" id="btn-send-broadcast">🚀 Disparar para Todos</button>
                        </div>
                    </div>
                </div>

                <!-- Pool de Incentivos -->
                <div class="card">
                    <div style="padding:14px 18px;border-bottom:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center">
                        <h3 style="margin:0;font-size:0.95rem">🔄 Pool de Automação Diária</h3>
                        <button class="btn btn-secondary btn-sm" id="btn-add-pool">+ Adicionar</button>
                    </div>
                    <div style="padding:10px; max-height:400px; overflow-y:auto">
                        ${pool.length === 0 ? '<div style="text-align:center;padding:20px;color:var(--text-muted)">Nenhuma frase cadastrada no pool.</div>' : pool.map(m => `
                            <div style="padding:10px; border:1px solid var(--border-light); border-radius:8px; margin-bottom:8px; display:flex; gap:10px; align-items:flex-start; background:white">
                                <div style="flex:1">
                                    <div style="font-weight:700; font-size:0.85rem">${m.titulo}</div>
                                    <div style="font-size:0.8rem; color:var(--text-muted)">${m.mensagem}</div>
                                </div>
                                <button class="btn btn-danger btn-sm" data-del-pool-id="${m.id}" style="padding:4px 8px">🗑️</button>
                            </div>
                        `).join('')}
                    </div>
                    <div style="padding:14px; border-top:1px solid var(--border-light); background:#f8fafc; border-radius:0 0 12px 12px">
                        <button class="btn btn-secondary btn-sm" style="width:100%" id="btn-test-automation">⚡ Testar Sorteio Agora</button>
                        <p style="font-size:0.7rem; color:var(--text-muted); text-align:center; margin-top:8px">Isso disparará uma frase aleatória do pool para todos os consultores.</p>
                    </div>
                </div>

                <!-- Histórico de Envios -->
                <div class="card">
                    <div style="padding:14px 18px;border-bottom:1px solid var(--border-light)">
                        <h3 style="margin:0;font-size:0.95rem">📜 Histórico e Métricas</h3>
                    </div>
                    <div style="overflow-x:auto">
                        <table class="clients-table" style="font-size:0.8rem">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Título</th>
                                    <th>Enviadas</th>
                                    <th>Cliques (Leitura)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${history.length === 0 ? '<tr><td colspan="4" style="text-align:center;padding:20px">Nenhum envio registrado.</td></tr>' : history.map(h => {
                                    const rate = h.destinatarios_qtd > 0 ? Math.round((h.cliques_qtd / h.destinatarios_qtd) * 100) : 0;
                                    return `
                                    <tr>
                                        <td>${new Date(h.criado_em).toLocaleDateString('pt-BR')}</td>
                                        <td>
                                            <div style="font-weight:600">${h.titulo}</div>
                                            <div style="font-size:0.7rem; color:var(--text-muted); max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${h.mensagem}</div>
                                        </td>
                                        <td style="text-align:center">${h.destinatarios_qtd}</td>
                                        <td style="text-align:center">
                                            <div style="font-weight:700; color:var(--primary)">${h.cliques_qtd}</div>
                                            <div style="font-size:0.65rem; color:var(--text-muted)">${rate}% de abertura</div>
                                        </td>
                                    </tr>
                                `}).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Eventos
        container.querySelector('#btn-send-broadcast')?.addEventListener('click', async () => {
            const titulo = document.getElementById('bn-titulo')?.value?.trim();
            const mensagem = document.getElementById('bn-mensagem')?.value?.trim();
            if (!titulo || !mensagem) return toast('Preencha título e mensagem', 'error');

            if (!confirm(`Confirmar envio em massa para TODOS os consultores?`)) return;

            try {
                const res = await adminApi.broadcastNotif({ titulo, mensagem });
                toast(`Sucesso! Notificação enviada para ${res.sentCount} dispositivos.`);
                await loadData();
                render();
            } catch (e) { toast('Erro: ' + e.message, 'error'); }
        });

        container.querySelector('#btn-add-pool')?.addEventListener('click', () => {
            modal('➕ Adicionar ao Pool de Incentivos', `
                <div class="form-group" style="margin-bottom:12px">
                    <label class="field-label">Título</label>
                    <input class="field-input" id="pool-titulo" placeholder="Ex: Dica do Dia" />
                </div>
                <div class="form-group">
                    <label class="field-label">Mensagem</label>
                    <textarea class="field-textarea" id="pool-mensagem" rows="3" placeholder="Olá {nome}, ..."></textarea>
                </div>
            `, {
                confirmLabel: 'Salvar',
                onConfirm: async () => {
                    const titulo = document.getElementById('pool-titulo')?.value;
                    const mensagem = document.getElementById('pool-mensagem')?.value;
                    if(!mensagem) return false;
                    try {
                        await adminApi.addToNotifPool({ titulo, mensagem });
                        toast('Mensagem adicionada ao pool!');
                        await loadData();
                        render();
                    } catch(e) { toast('Erro ao salvar', 'error'); }
                }
            });
        });

        container.querySelectorAll('[data-del-pool-id]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.delPoolId;
                if(!confirm('Remover esta frase do pool?')) return;
                try {
                    await adminApi.deleteFromNotifPool(id);
                    toast('Removido');
                    await loadData();
                    render();
                } catch(e) { toast('Erro ao remover', 'error'); }
            });
        });

        container.querySelector('#btn-test-automation')?.addEventListener('click', async () => {
            if(!confirm('Deseja sortear e disparar uma notificação do pool agora?')) return;
            try {
                const res = await adminApi.triggerNotifAutomation();
                toast(`Automação disparada! Mensagem: ${res.message.substring(0, 30)}...`);
                await loadData();
                render();
            } catch(e) { toast('Erro na automação', 'error'); }
        });
    };

    render();
  }
