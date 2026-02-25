import { auth, store } from '../store.js';
import { formatDate, formatCurrency, getInitials, toast } from '../utils.js';

// ── Helper: get consultant's display name ────────────────────
function getNome(consultant) {
  return consultant?.nome || consultant?.name || 'Consultora';
}

// ── Shared Layout (sidebar + header) ────────────────────────
export function renderLayout(router, pageTitle, pageContent, activeNav) {
  const consultant = auth.current;
  const app = document.getElementById('app');
  const firstName = getNome(consultant).split(' ')[0];

  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'clients', icon: '👥', label: 'Clientes' },
    { id: 'anamnesis', icon: '📋', label: 'Anamneses' },
    { id: 'links', icon: '🔗', label: 'Links de Captação' },
    { id: 'schedule', icon: '📅', label: 'Agenda' },
    { id: 'followup', icon: '💬', label: 'Follow-up' },
    { id: 'testimonials', icon: '⭐', label: 'Depoimentos' },
    { id: 'purchases', icon: '🛒', label: 'Compras' },
    { id: 'profile', icon: '👤', label: 'Meu Perfil' },
  ];
  if (auth.isAdmin) navItems.push({ id: 'admin', icon: '⚙️', label: 'Administração' });

  app.innerHTML = `
  <div class="app-layout">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo" id="sidebar-logo">
        <div class="sidebar-logo-mark">Saúde <span>Essencial</span></div>
        <div class="sidebar-logo-sub">Consultoras de Bem-estar</div>
      </div>
      <div class="sidebar-user" id="sidebar-user-btn" style="cursor:pointer" title="Meu Perfil">
        <div class="sidebar-avatar">
          ${consultant?.foto_url
      ? `<img src="${consultant.foto_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`
      : '🌿'}
        </div>
        <div>
          <div class="sidebar-user-name">${firstName}</div>
          <div class="sidebar-user-role">${auth.isAdmin
      ? (consultant?.genero === 'masculino' ? 'Administrador' : 'Administradora')
      : (consultant?.genero === 'masculino' ? 'Consultor' : 'Consultora')}</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="sidebar-section-label">Menu Principal</div>
        ${navItems.map(item => `
          <button class="sidebar-item ${activeNav === item.id ? 'active' : ''}" data-nav="${item.id}">
            <span class="sidebar-item-icon">${item.icon}</span>
            ${item.label}
          </button>
        `).join('')}
      </nav>
      <div class="sidebar-footer">
        <button class="sidebar-item" id="logout-btn">
          <span class="sidebar-item-icon">🚪</span> Sair
        </button>
      </div>
    </aside>

    <div class="main-content">
      <header class="main-header">
        <div>
          <div class="main-header-title">${pageTitle}</div>
          <div class="main-header-sub">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</div>
        </div>
        <div class="main-header-actions" id="header-actions"></div>
      </header>
      <div class="page-content" id="page-content">${pageContent}</div>
    </div>
  </div>`;

  app.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => router.navigate('/' + btn.dataset.nav));
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    auth.logout();
    toast('Até logo! 👋', 'info');
    router.navigate('/');
  });

  document.getElementById('sidebar-user-btn')?.addEventListener('click', () => {
    router.navigate('/profile');
  });

  return document.getElementById('page-content');
}

// ── Dashboard ────────────────────────────────────────────────
export async function renderDashboard(router) {
  const consultant = auth.current;
  const firstName = getNome(consultant).split(' ')[0];

  // Render layout immediately with loading state
  renderLayout(router, `Olá, ${firstName}! 👋`,
    `<div style="display:flex;align-items:center;justify-content:center;height:300px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando dashboard...</div>`,
    'dashboard'
  );

  try {
    const [clients, anamneses, agendamentos] = await Promise.all([
      store.getClients().catch(() => []),
      store.getAnamneses().catch(() => []),
      store.getAgendamentos().catch(() => []),
    ]);

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalClients = clients.length;
    const monthClients = clients.filter(c => new Date(c.created_at || c.createdAt || 0) >= thisMonth).length;
    const totalAnamneses = anamneses.length;

    const upcoming = agendamentos
      .map(e => ({ ...e, _dt: new Date(e.data_hora || e.date || 0) }))
      .filter(e => e._dt >= now)
      .sort((a, b) => a._dt - b._dt)
      .slice(0, 4);

    const contentHtml = `
  <div class="stats-grid">
    <div class="stat-card green">
      <div class="stat-icon">👥</div>
      <div class="stat-value">${totalClients}</div>
      <div class="stat-label">Total de Clientes</div>
      <div class="stat-trend trend-up">↑ ${monthClients} este mês</div>
    </div>
    <div class="stat-card gold">
      <div class="stat-icon">📋</div>
      <div class="stat-value">${totalAnamneses}</div>
      <div class="stat-label">Anamneses Realizadas</div>
    </div>
    <div class="stat-card blue">
      <div class="stat-icon">💰</div>
      <div class="stat-value" style="font-size:1.4rem">${formatCurrency(0)}</div>
      <div class="stat-label">Receita Total</div>
    </div>
    <div class="stat-card rose">
      <div class="stat-icon">💬</div>
      <div class="stat-value">0</div>
      <div class="stat-label">Follow-ups Pendentes</div>
    </div>
  </div>

  <div class="dashboard-grid">
    <!-- Clientes Recentes -->
    <div class="card col-span-2">
      <div class="card-header">
        <h3>👥 Clientes Recentes</h3>
        <button class="btn btn-secondary btn-sm" onclick="location.hash='#/clients'">Ver todos</button>
      </div>
      <div class="card-body" style="padding:0">
        ${clients.length === 0
        ? `<div class="empty-state"><div class="empty-state-icon">👥</div><p>Nenhum cliente ainda.</p>
               <button class="btn btn-primary" onclick="location.hash='#/clients'">+ Adicionar Cliente</button></div>`
        : `<table class="clients-table">
               <thead><tr><th>Cliente</th><th>E-mail</th><th>Status</th></tr></thead>
               <tbody>
               ${clients.slice(0, 5).map(c => `<tr>
                 <td><div class="client-name-cell">
                   <div class="client-avatar-sm">${getInitials(c.name || c.nome || 'C')}</div>
                   <div>${c.name || c.nome || '—'}</div>
                 </div></td>
                 <td style="font-size:0.8rem">${c.email || '—'}</td>
                 <td><span class="status-badge status-${c.status || 'active'}">${{ active: 'Ativo', lead: 'Lead', inactive: 'Inativo' }[c.status] || 'Ativo'}</span></td>
               </tr>`).join('')}
               </tbody></table>`}
      </div>
    </div>

    <!-- Próximas Reuniões -->
    <div class="card col-span-2">
      <div class="card-header">
        <h3>📅 Próximas Reuniões</h3>
        <button class="btn btn-secondary btn-sm" onclick="location.hash='#/schedule'">Agenda</button>
      </div>
      <div class="card-body">
        ${upcoming.length === 0
        ? `<div class="empty-state"><div class="empty-state-icon">📅</div><p>Nenhuma reunião agendada</p>
               <button class="btn btn-primary btn-sm" onclick="location.hash='#/schedule'">+ Nova Reunião</button></div>`
        : upcoming.map(e => `<div class="schedule-event" style="margin-bottom:8px">
               <div class="schedule-event-title">${e.titulo || e.title || 'Reunião'}</div>
               <div class="schedule-event-meta">📅 ${formatDate(e.data_hora || e.date)}</div>
             </div>`).join('')}
      </div>
    </div>

    <!-- Anamneses Recentes -->
    <div class="card col-span-2">
      <div class="card-header">
        <h3>📋 Anamneses Recentes</h3>
        <button class="btn btn-secondary btn-sm" onclick="location.hash='#/anamnesis'">Ver todas</button>
      </div>
      <div class="card-body">
        ${anamneses.length === 0
        ? `<div class="empty-state"><div class="empty-state-icon">📋</div><p>Nenhuma anamnese ainda.</p>
               <button class="btn btn-primary" onclick="location.hash='#/links'">🔗 Criar Link de Anamnese</button></div>`
        : `<div style="font-size:0.9rem;color:var(--text-muted)">
               ${anamneses.slice(0, 5).map(a => {
          const cl = clients.find(c => c.id === (a.cliente_id || a.clienteId || a.clientId));
          return `<div style="padding:8px 0;border-bottom:1px solid var(--border)">
                     👤 ${cl?.name || cl?.nome || 'Cliente'} — ${formatDate(a.created_at || a.createdAt)}</div>`;
        }).join('')}</div>`}
      </div>
    </div>
  </div>`;

    // Update page-content with real data (no full re-render to avoid losing sidebar)
    const pc = document.getElementById('page-content');
    if (pc) pc.innerHTML = contentHtml;

  } catch (err) {
    console.error('Dashboard error:', err);
    const pc = document.getElementById('page-content');
    if (pc) pc.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <p>Erro ao carregar dashboard: ${err.message}</p>
            <button class="btn btn-primary" onclick="location.reload()">Recarregar</button>
          </div>`;
  }
}
