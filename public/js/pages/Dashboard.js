import { auth, store } from '../store.js';
import { formatDate, formatCurrency, daysUntilBirthday, getInitials, toast, modal, generateSlug } from '../utils.js';

export function renderLayout(router, pageTitle, pageContent, activeNav) {
    const consultant = auth.current;
    const app = document.getElementById('app');

    const navItems = [
        { id: 'dashboard', icon: '📊', label: 'Dashboard' },
        { id: 'clients', icon: '👥', label: 'Clientes' },
        { id: 'anamnesis', icon: '📋', label: 'Anamneses' },
        { id: 'links', icon: '🔗', label: 'Links de Captação' },
        { id: 'schedule', icon: '📅', label: 'Agenda' },
        { id: 'followup', icon: '💬', label: 'Follow-up' },
        { id: 'testimonials', icon: '⭐', label: 'Depoimentos' },
        { id: 'purchases', icon: '🛒', label: 'Compras' },
    ];
    if (auth.isAdmin) navItems.push({ id: 'admin', icon: '⚙️', label: 'Administração' });

    app.innerHTML = `
  <div class="app-layout">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo" id="sidebar-logo">
        <div class="sidebar-logo-mark">Saúde <span>Essencial</span></div>
        <div class="sidebar-logo-sub">Consultoras de Bem-estar</div>
      </div>
      <div class="sidebar-user">
        <div class="sidebar-avatar">${consultant?.photo || '🌿'}</div>
        <div>
          <div class="sidebar-user-name">${consultant?.name?.split(' ')[0] || 'Consultora'}</div>
          <div class="sidebar-user-role">${auth.isAdmin ? 'Administradora' : 'Consultora'}</div>
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

    return document.getElementById('page-content');
}

// ===================== DASHBOARD =====================
export function renderDashboard(router) {
    const cid = auth.current.id;
    const stats = store.getStats(cid);
    const clients = store.getClients(cid);
    const followups = store.getFollowups(cid);
    const testimonials = store.getTestimonials(cid).filter(t => t.approved);
    const purchases = store.getPurchases(cid);
    const schedules = store.getSchedule(cid);

    const recentPurchases = [...purchases].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const upcomingSchedule = schedules
        .filter(e => new Date(e.date + 'T' + (e.time || '00:00')) >= new Date())
        .sort((a, b) => new Date(a.date + a.time) - new Date(b.date + b.time)).slice(0, 4);

    const contentHtml = `
  <div class="stats-grid">
    <div class="stat-card green">
      <div class="stat-icon">👥</div>
      <div class="stat-value">${stats.totalClients}</div>
      <div class="stat-label">Total de Clientes</div>
      <div class="stat-trend trend-up">↑ ${stats.monthClients} este mês</div>
    </div>
    <div class="stat-card gold">
      <div class="stat-icon">📋</div>
      <div class="stat-value">${stats.totalAnamneses}</div>
      <div class="stat-label">Anamneses Realizadas</div>
    </div>
    <div class="stat-card blue">
      <div class="stat-icon">💰</div>
      <div class="stat-value" style="font-size:1.4rem">${formatCurrency(stats.totalRevenue)}</div>
      <div class="stat-label">Receita Total</div>
    </div>
    <div class="stat-card rose">
      <div class="stat-icon">💬</div>
      <div class="stat-value">${stats.pendingFollowups}</div>
      <div class="stat-label">Follow-ups Pendentes</div>
    </div>
  </div>

  <div class="dashboard-grid">
    <!-- Top Problems -->
    <div class="card col-span-1">
      <div class="card-header"><h3>🔥 Principais Queixas</h3></div>
      <div class="card-body">
        ${stats.topProblems.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📋</div><p>Realize anamneses para ver as queixas mais frequentes</p></div>' :
            stats.topProblems.map(([prob, count]) => `
          <div style="margin-bottom:12px">
            <div class="flex justify-between mb-8" style="font-size:0.83rem">
              <span>${prob}</span><strong>${count}x</strong>
            </div>
            <div class="score-bar-outer">
              <div class="score-bar-inner" style="width:${Math.min(100, count * 20)}%"></div>
            </div>
          </div>`).join('')}
      </div>
    </div>

    <!-- Birthdays -->
    <div class="card col-span-1">
      <div class="card-header"><h3>🎂 Aniversariantes</h3></div>
      <div class="card-body">
        ${stats.birthdayClients.length === 0 ?
            '<div class="empty-state"><div class="empty-state-icon">🎂</div><p>Nenhum aniversário próximo esta semana</p></div>' :
            stats.birthdayClients.map(c => {
                const days = daysUntilBirthday(c.birthdate);
                return `<div class="birthday-item">
              <span class="birthday-icon">🎉</span>
              <div>
                <div class="birthday-name">${c.name}</div>
                <div class="birthday-date">${formatDate(c.birthdate)}</div>
              </div>
              ${days === 0 ? '<span class="birthday-today">HOJE! 🎊</span>' : `<span class="birthday-today" style="background:#d1fae5;color:#065f46">em ${days}d</span>`}
            </div>`;
            }).join('')}
      </div>
    </div>

    <!-- Recent Purchases -->
    <div class="card col-span-1">
      <div class="card-header">
        <h3>🛒 Últimas Compras</h3>
        <button class="btn btn-secondary btn-sm" onclick="location.hash='#/purchases'">Ver todas</button>
      </div>
      <div class="card-body" style="padding:0">
        ${recentPurchases.length === 0 ?
            '<div class="empty-state"><div class="empty-state-icon">🛒</div><p>Nenhuma compra registrada</p></div>' :
            `<table class="clients-table">
            <thead><tr><th>Cliente</th><th>Produto</th><th>Valor</th></tr></thead>
            <tbody>
              ${recentPurchases.map(p => {
                const c = clients.find(cl => cl.id === p.clientId);
                return `<tr>
                  <td>${c?.name || 'Cliente'}</td>
                  <td style="font-size:0.8rem">${p.product}</td>
                  <td>${formatCurrency(p.value)}</td>
                </tr>`;
            }).join('')}
            </tbody>
          </table>`}
      </div>
    </div>

    <!-- Upcoming Schedule -->
    <div class="card col-span-1">
      <div class="card-header">
        <h3>📅 Próximas Reuniões</h3>
        <button class="btn btn-secondary btn-sm" onclick="location.hash='#/schedule'">Agenda</button>
      </div>
      <div class="card-body">
        ${upcomingSchedule.length === 0 ?
            '<div class="empty-state"><div class="empty-state-icon">📅</div><p>Nenhuma reunião agendada</p></div>' :
            upcomingSchedule.map(e => {
                const c = clients.find(cl => cl.id === e.clientId);
                return `<div class="schedule-event" style="margin-bottom:8px">
              <div class="schedule-event-title">${e.title}</div>
              <div class="schedule-event-meta">📅 ${formatDate(e.date)} ${e.time ? '⏰ ' + e.time : ''}${c ? ' · ' + c.name : ''}</div>
            </div>`;
            }).join('')}
      </div>
    </div>

    <!-- Testimonials -->
    <div class="card col-span-2">
      <div class="card-header">
        <h3>⭐ Depoimentos Aprovados</h3>
        <button class="btn btn-secondary btn-sm" onclick="location.hash='#/testimonials'">Ver todos</button>
      </div>
      <div class="card-body" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px">
        ${testimonials.length === 0 ?
            '<div class="empty-state col-span-2"><div class="empty-state-icon">⭐</div><p>Nenhum depoimento aprovado ainda</p></div>' :
            testimonials.slice(0, 3).map(t => {
                const c = clients.find(cl => cl.id === t.clientId);
                return `<div class="testimonial-card">
              <div class="testimonial-text">${t.text}</div>
              <div class="testimonial-author">
                <div class="testimonial-author-avatar">${getInitials(c?.name || 'C')}</div>
                <div>
                  <div class="testimonial-stars">${'★'.repeat(t.rating)}</div>
                  <div class="testimonial-author-name">${c?.name || 'Cliente'}</div>
                  <div class="testimonial-author-sub">${formatDate(t.createdAt)}</div>
                </div>
              </div>
            </div>`;
            }).join('')}
      </div>
    </div>

    <!-- Follow-ups -->
    <div class="card col-span-2">
      <div class="card-header">
        <h3>💬 Follow-up Pós-venda</h3>
        <button class="btn btn-primary btn-sm" onclick="location.hash='#/followup'">Gerenciar</button>
      </div>
      <div class="card-body">
        ${followups.length === 0 ?
            '<div class="empty-state"><div class="empty-state-icon">💬</div><p>Nenhum follow-up cadastrado</p></div>' :
            followups.slice(0, 5).map(f => {
                const c = clients.find(cl => cl.id === f.clientId);
                const isOverdue = f.status === 'pending' && f.dueDate && new Date(f.dueDate) < new Date();
                const status = isOverdue ? 'overdue' : f.status;
                return `<div class="followup-item">
              <div class="followup-status-dot ${status}"></div>
              <div>
                <div class="followup-text"><strong>${c?.name || 'Cliente'}</strong> – ${f.note}</div>
                <div class="followup-meta">📅 ${f.dueDate ? formatDate(f.dueDate) : 'Sem prazo'} · ${status === 'done' ? '✅ Concluído' : status === 'overdue' ? '⚠️ Atrasado' : '⏳ Pendente'}</div>
              </div>
            </div>`;
            }).join('')}
      </div>
    </div>
  </div>`;

    renderLayout(router, `Olá, ${auth.current?.name?.split(' ')[0] || 'Consultora'}! 👋`, contentHtml, 'dashboard');
}
