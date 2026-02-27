import { auth, store } from '../store.js';
import { formatDate, formatCurrency, getInitials, toast, getConsultantTitle } from '../utils.js';

// ── Helper: get consultant's display name ────────────────────
function getNome(consultant) {
  return consultant?.nome || consultant?.name || getConsultantTitle(consultant?.genero);
}

// ── Shared Layout (sidebar + header) ────────────────────────
export function renderLayout(router, pageTitle, pageContent, activeNav) {
  const consultant = auth.current;
  const app = document.getElementById('app');
  const firstName = getNome(consultant).split(' ')[0];
  const cTitle = getConsultantTitle(consultant?.genero);

  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'clients', icon: '👥', label: 'Clientes' },
    { id: 'pipeline', icon: '📈', label: 'Fluxo de Vendas' },
    { id: 'anamnesis', icon: '📋', label: 'Anamneses' },
    { id: 'links', icon: '🔗', label: 'Links de Captação' },
    { id: 'schedule', icon: '📅', label: 'Agenda' },
    { id: 'followup', icon: '💬', label: 'Follow-up' },
    { id: 'testimonials', icon: '⭐', label: 'Depoimentos' },
    { id: 'purchases', icon: '🛒', label: 'Compras' },
    { id: 'integrations', icon: '📊', label: 'Integrações' },
    { id: 'profile', icon: '👤', label: 'Meu Perfil' },
  ];
  if (auth.isAdmin) navItems.push({ id: 'admin', icon: '⚙️', label: 'Administração' });

  app.innerHTML = `
  <div class="app-layout">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo" id="sidebar-logo">
        <div class="sidebar-logo-mark">Gota <span>Essencial</span></div>
        <div class="sidebar-logo-sub">Plataforma Gota Essencial</div>
      </div>
      <div class="sidebar-user" id="sidebar-user-btn" style="cursor:pointer" title="Meu Perfil">
        <div class="sidebar-avatar">
          ${consultant?.foto_url
      ? `<img src="${consultant.foto_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`
      : '💧'}
        </div>
        <div>
          <div class="sidebar-user-name">${firstName}</div>
          <div class="sidebar-user-role">${auth.isAdmin
      ? (consultant?.genero === 'masculino' ? 'Administrador' : 'Administradora')
      : cTitle}</div>
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

    <!-- Mobile overlay -->
    <div id="sidebar-overlay"></div>

    <div class="main-content">
      <header class="main-header">
        <div style="display:flex;align-items:center;gap:10px">
          <button id="sidebar-toggle" aria-label="Menu" title="Menu">☰</button>
          <div>
            <div class="main-header-title">${pageTitle}</div>
            <div class="main-header-sub">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</div>
          </div>
        </div>
        <div class="main-header-actions" id="header-actions"></div>
      </header>
      <div class="page-content" id="page-content">${pageContent}</div>
    </div>

    <!-- Bottom navigation (mobile only) -->
    <nav class="bottom-nav" id="bottom-nav">
      <button class="bottom-nav-item ${activeNav === 'dashboard' ? 'active' : ''}" data-nav="dashboard">
        <span class="nav-icon">📊</span>Dashboard
      </button>
      <button class="bottom-nav-item ${activeNav === 'clients' ? 'active' : ''}" data-nav="clients">
        <span class="nav-icon">👥</span>Clientes
      </button>
      <button class="bottom-nav-item ${activeNav === 'anamnesis' ? 'active' : ''}" data-nav="anamnesis">
        <span class="nav-icon">📋</span>Anamneses
      </button>
      <button class="bottom-nav-item ${activeNav === 'schedule' ? 'active' : ''}" data-nav="schedule">
        <span class="nav-icon">📅</span>Agenda
      </button>
      <button class="bottom-nav-item bottom-nav-more" id="bottom-nav-more">
        <span class="nav-icon">☰</span>Mais
      </button>
    </nav>
  </div>`;

  // Sidebar nav items
  app.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeSidebar();
      router.navigate('/' + btn.dataset.nav);
    });
  });

  // Hamburger toggle
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  function openSidebar() { sidebar?.classList.add('open'); overlay?.classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeSidebar() { sidebar?.classList.remove('open'); overlay?.classList.remove('active'); document.body.style.overflow = ''; }
  document.getElementById('sidebar-toggle')?.addEventListener('click', openSidebar);
  overlay?.addEventListener('click', closeSidebar);

  // Bottom nav "Mais" opens sidebar
  document.getElementById('bottom-nav-more')?.addEventListener('click', openSidebar);

  document.getElementById('logout-btn').addEventListener('click', () => {
    closeSidebar();
    auth.logout();
    toast('Até logo! 👋', 'info');
    router.navigate('/');
  });

  document.getElementById('sidebar-user-btn')?.addEventListener('click', () => {
    closeSidebar();
    router.navigate('/profile');
  });

  return document.getElementById('page-content');
}

// ── Helper: build a horizontal bar for funnel ────────────────
function funnelBar(label, count, total, color, emoji) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return '<div style="margin-bottom:10px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
    '<span style="font-size:0.85rem;font-weight:500">' + emoji + ' ' + label + '</span>' +
    '<span style="font-size:0.85rem;font-weight:600;color:' + color + '">' + count + '</span>' +
    '</div>' +
    '<div style="height:8px;background:#f3f4f6;border-radius:6px;overflow:hidden">' +
    '<div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:6px;transition:width 0.6s ease"></div>' +
    '</div>' +
    '</div>';
}

// ── Helper: build a single follow-up row ─────────────────────
function fuRow(f, clients) {
  const c = clients.find(cl => cl.id === f.clientId);
  const name = c?.name || c?.nome || 'Cliente';
  const isOverdue = new Date(f.dueDateTime) < new Date() && new Date(f.dueDateTime).toDateString() !== new Date().toDateString();
  const phone = (c?.phone || c?.telefone || '').replace(/\D/g, '');
  const msg = encodeURIComponent('Oi ' + name + ', combinamos que eu entraria em contato hoje com você. Lembra? Podemos conversar agora? 💚');
  const wa = phone ? 'https://wa.me/55' + phone + '?text=' + msg : 'https://wa.me/?text=' + msg;

  const badgeColor = isOverdue ? '#991b1b' : '#b45309';
  const badgeBg = isOverdue ? '#fee2e2' : '#ffedd5';
  const badgeText = isOverdue ? '⚠️ Atrasado' : '🔥 Hoje';

  const dueDateStr = f.dueDateTime ? new Date(f.dueDateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

  return '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding:10px 0">' +
    '<div style="flex:1;min-width:0">' +
    '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
    '<span style="font-weight:600;font-size:0.92rem">' + name + '</span>' +
    '<span style="font-size:0.7rem;padding:2px 8px;border-radius:10px;background:' + badgeBg + ';color:' + badgeColor + ';font-weight:600">' + badgeText + '</span>' +
    '</div>' +
    '<div style="font-size:0.82rem;color:var(--text-muted);margin-top:2px">' + (f.note || '') + '</div>' +
    (dueDateStr ? '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">📅 ' + dueDateStr + '</div>' : '') +
    '</div>' +
    '<div style="display:flex;gap:6px;flex-shrink:0;margin-left:8px">' +
    '<button class="btn btn-sm" style="background:#f3f4f6;color:#374151;min-width:36px" onclick="window.dashboardDoneFu(&quot;' + f.id + '&quot;)">✅</button>' +
    '<a href="' + wa + '" target="_blank" class="btn btn-sm" style="background:#25D366;color:white;text-decoration:none;min-width:36px">📱</a>' +
    '</div>' +
    '</div>';
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
    const [clients, anamneses, agendamentos, aniversariantes] = await Promise.all([
      store.getClients().catch(() => []),
      store.getAnamneses().catch(() => []),
      store.getAgendamentos().catch(() => []),
      store.getAniversariantes().catch(() => []),
    ]);

    // ── Follow-ups do localStorage ──
    const followupsArr = [];
    try {
      const stored = localStorage.getItem('gota_followups_' + consultant.id);
      if (stored) followupsArr.push(...JSON.parse(stored));
    } catch (e) { }

    const pendentes = followupsArr.filter(f => f.status === 'pending');
    const totalFollowups = pendentes.length;

    const now = new Date();
    const hojeStr = now.toDateString();

    const hojeFollowups = pendentes.filter(f => f.dueDateTime && new Date(f.dueDateTime).toDateString() === hojeStr);
    const atrasadosFollowups = pendentes.filter(f => f.dueDateTime && new Date(f.dueDateTime) < now && new Date(f.dueDateTime).toDateString() !== hojeStr);

    // Top 5 urgentes
    const urgentFollowups = [...atrasadosFollowups, ...hojeFollowups]
      .sort((a, b) => new Date(a.dueDateTime) - new Date(b.dueDateTime)).slice(0, 5);

    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalClients = clients.length;
    const monthClients = clients.filter(c => new Date(c.created_at || c.createdAt || 0) >= thisMonth).length;
    const totalAnamneses = anamneses.length;

    // ── Dados do funil de vendas ──
    const activeClients = clients.filter(c => c.status === 'active').length;
    const leadClients = clients.filter(c => c.status === 'lead').length;
    const inactiveClients = clients.filter(c => c.status === 'inactive').length;

    // Etapas do Kanban/Pipeline
    const stageLabels = { lead: 'Lead', contact: 'Contato', negotiation: 'Negociação', closed: 'Fechado' };
    const stageCounts = {};
    Object.keys(stageLabels).forEach(s => { stageCounts[s] = 0; });
    clients.forEach(c => {
      const stage = c.stage || (c.status === 'lead' ? 'lead' : 'contact');
      if (stageCounts[stage] !== undefined) stageCounts[stage]++;
      else stageCounts['contact']++;
    });

    // ── Anamneses pendentes (enviadas mas não respondidas) ──
    const anamnesesPendentes = anamneses.filter(a =>
      a.status === 'pendente' || a.status === 'pending' || a.status === 'enviada'
    ).slice(0, 5);

    // ── Próximas reuniões ──
    const upcoming = agendamentos
      .map(e => ({ ...e, _dt: new Date(e.data_hora || e.date || 0) }))
      .filter(e => e._dt >= now)
      .sort((a, b) => a._dt - b._dt)
      .slice(0, 4);

    // ── Follow-up trend text ──
    let fuTrendHtml = '';
    if (hojeFollowups.length > 0) {
      fuTrendHtml = '<div class="stat-trend trend-down" style="color:#b45309">🔥 ' + hojeFollowups.length + ' hoje</div>';
    } else if (atrasadosFollowups.length > 0) {
      fuTrendHtml = '<div class="stat-trend trend-down">⚠️ ' + atrasadosFollowups.length + ' atrasados</div>';
    }

    // ════════════════════════════════════════════════════
    // BUILD HTML
    // ════════════════════════════════════════════════════
    const contentHtml = `
  <div class="stats-grid">
    <div class="stat-card green" style="cursor:pointer" onclick="location.hash='#/clients'">
      <div class="stat-icon">👥</div>
      <div class="stat-value">${totalClients}</div>
      <div class="stat-label">Total de Clientes</div>
      <div class="stat-trend trend-up">
        ${activeClients} ativos · ${leadClients} leads
      </div>
    </div>
    <div class="stat-card gold" style="cursor:pointer" onclick="location.hash='#/anamnesis'">
      <div class="stat-icon">📋</div>
      <div class="stat-value">${totalAnamneses}</div>
      <div class="stat-label">Anamneses</div>
      <div class="stat-trend">${anamnesesPendentes.length > 0 ? '⏳ ' + anamnesesPendentes.length + ' pendentes' : '✅ Todas respondidas'}</div>
    </div>
    <div class="stat-card blue" style="cursor:pointer" onclick="location.hash='#/pipeline'">
      <div class="stat-icon">📈</div>
      <div class="stat-value">${stageCounts.closed || 0}</div>
      <div class="stat-label">Vendas Fechadas</div>
      <div class="stat-trend trend-up">↑ ${monthClients} novos este mês</div>
    </div>
    <div class="stat-card rose" style="cursor:pointer" onclick="location.hash='#/followup'">
      <div class="stat-icon">💬</div>
      <div class="stat-value">${totalFollowups}</div>
      <div class="stat-label">Follow-ups Pendentes</div>
      ${fuTrendHtml}
    </div>
  </div>

  <div class="dashboard-grid">
    ${urgentFollowups.length > 0 ? `
    <div class="card col-span-2" style="border-left:4px solid #f59e0b">
      <div class="card-header">
        <h3>🔥 Follow-ups Urgentes</h3>
        <button class="btn btn-secondary btn-sm" onclick="location.hash='#/followup'">Ver todos</button>
      </div>
      <div class="card-body">
        ${urgentFollowups.map(f => fuRow(f, clients)).join('')}
      </div>
    </div>` : ''}

    <!-- Funil de Vendas -->
    <div class="card">
      <div class="card-header">
        <h3>📈 Funil de Vendas</h3>
        <button class="btn btn-secondary btn-sm" onclick="location.hash='#/pipeline'">Kanban</button>
      </div>
      <div class="card-body">
        ${totalClients === 0
        ? '<div class="empty-state"><div class="empty-state-icon">📈</div><p>Cadastre clientes para ver o funil</p></div>'
        : funnelBar('Lead', stageCounts.lead, totalClients, '#6366f1', '🟣') +
        funnelBar('Contato', stageCounts.contact, totalClients, '#3b82f6', '🔵') +
        funnelBar('Negociação', stageCounts.negotiation, totalClients, '#f59e0b', '🟡') +
        funnelBar('Fechado', stageCounts.closed, totalClients, '#22c55e', '🟢')}
      </div>
    </div>

    <!-- Anamneses Pendentes -->
    <div class="card">
      <div class="card-header">
        <h3>📋 Anamneses Pendentes</h3>
        <button class="btn btn-secondary btn-sm" onclick="location.hash='#/anamnesis'">Ver todas</button>
      </div>
      <div class="card-body">
        ${anamnesesPendentes.length === 0
        ? '<div class="empty-state"><div class="empty-state-icon">✅</div><p>Todas as anamneses foram respondidas</p></div>'
        : anamnesesPendentes.map(a => {
          const cl = clients.find(c => c.id === (a.cliente_id || a.clienteId));
          const nomeC = cl?.name || cl?.nome || 'Cliente';
          const dt = a.created_at || a.createdAt || '';
          return '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding:8px 0">' +
            '<div>' +
            '<div style="font-weight:600;font-size:0.9rem">' + nomeC + '</div>' +
            (dt ? '<div style="font-size:0.75rem;color:var(--text-muted)">Enviada em ' + formatDate(dt) + '</div>' : '') +
            '</div>' +
            '<span style="font-size:0.75rem;padding:3px 8px;border-radius:10px;background:#fef3c7;color:#92400e;font-weight:600">⏳ Aguardando</span>' +
            '</div>';
        }).join('')}
      </div>
    </div>

    <!-- Aniversariantes -->
    <div class="card col-span-2">
      <div class="card-header">
        <h3>🎂 Aniversariantes</h3>
      </div>
      <div class="card-body">
        ${aniversariantes.length === 0
        ? '<div class="empty-state"><div class="empty-state-icon">🎂</div><p>Nenhum aniversário próximo esta semana</p></div>'
        : aniversariantes.map(c => `
          <div class="birthday-item" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:12px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <span class="birthday-icon" style="font-size:1.8rem">🎉</span>
              <div>
                <div class="birthday-name" style="font-weight:600; color:var(--text-body)">${c.nome}</div>
                <div class="birthday-date" style="font-size:0.85rem; color:var(--text-muted)">${formatDate(c.data_nascimento)}</div>
              </div>
            </div>
            <div style="text-align:right">
              ${c.is_today
            ? '<span class="birthday-today" style="display:block; font-size:0.8rem; color:#d97706; font-weight:bold; margin-bottom:6px;">HOJE! 🎊</span>'
            : '<span class="birthday-today" style="display:inline-block; font-size:0.75rem; background:#d1fae5; color:#065f46; padding:3px 8px; border-radius:12px; margin-bottom:6px;">em 7d</span>'}
              ${c.whatsapp_link
            ? `<a href="${c.whatsapp_link}" target="_blank" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:6px; font-size:0.8rem; padding:6px 12px; background:#25D366; color:white; border:none; border-radius:6px; text-decoration:none;">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                     Mandar Parabéns
                   </a>`
            : ''}
            </div>
          </div>`).join('')}
      </div>
    </div>

    <!-- Clientes Recentes -->
    <div class="card col-span-2">
      <div class="card-header">
        <h3>👥 Clientes Recentes</h3>
        <button class="btn btn-secondary btn-sm" onclick="location.hash='#/clients'">Ver todos</button>
      </div>
      <div class="card-body" style="padding:0">
        ${clients.length === 0
        ? '<div class="empty-state"><div class="empty-state-icon">👥</div><p>Nenhum cliente ainda.</p><button class="btn btn-primary" onclick="location.hash=\'#/clients\'">+ Adicionar Cliente</button></div>'
        : '<table class="clients-table"><thead><tr><th>Cliente</th><th>E-mail</th><th>Status</th></tr></thead><tbody>' +
        clients.slice(0, 5).map(c => '<tr>' +
          '<td><div class="client-name-cell"><div class="client-avatar-sm">' + getInitials(c.name || c.nome || 'C') + '</div><div>' + (c.name || c.nome || '—') + '</div></div></td>' +
          '<td style="font-size:0.8rem">' + (c.email || '—') + '</td>' +
          '<td><span class="status-badge status-' + (c.status || 'active') + '">' + ({ active: 'Ativo', lead: 'Lead', inactive: 'Inativo' }[c.status] || 'Ativo') + '</span></td>' +
          '</tr>').join('') +
        '</tbody></table>'}
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
        ? '<div class="empty-state"><div class="empty-state-icon">📅</div><p>Nenhuma reunião agendada</p><button class="btn btn-primary btn-sm" onclick="location.hash=\'#/schedule\'">+ Nova Reunião</button></div>'
        : upcoming.map(e => '<div class="schedule-event" style="margin-bottom:8px">' +
          '<div class="schedule-event-title">' + (e.titulo || e.title || 'Reunião') + '</div>' +
          '<div class="schedule-event-meta">📅 ' + formatDate(e.data_hora || e.date) + '</div>' +
          '</div>').join('')}
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

// Handler global para marcar follow-up como feito direto do dashboard
window.dashboardDoneFu = function (id) {
  try {
    const raw = sessionStorage.getItem('se_user');
    if (!raw) return;
    const consultantId = JSON.parse(raw).id;
    const key = 'gota_followups_' + consultantId;
    let list = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = list.findIndex(f => f.id === id);
    if (idx >= 0) {
      list[idx].status = 'done';
      localStorage.setItem(key, JSON.stringify(list));
      import('../utils.js').then(m => m.toast('Follow-up concluído! ✅'));
      // re-render
      const app = document.getElementById('app');
      app.querySelector('[data-nav="dashboard"]')?.click();
    }
  } catch (e) { }
};
