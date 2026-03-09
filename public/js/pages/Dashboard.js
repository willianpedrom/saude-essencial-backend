import { auth, store } from '../store.js';
import { formatDate, formatCurrency, getInitials, toast, getConsultantTitle } from '../utils.js';

// ── Helper: get consultant's display name ────────────────────
function getNome(consultant) {
  return consultant?.nome || consultant?.name || getConsultantTitle(consultant?.genero);
}

window.dashboardAddClient = () => {
  window.location.hash = '#/clients';
  setTimeout(() => {
    const btn = document.getElementById('btn-add-client');
    if (btn) btn.click();
  }, 100);
};

window.dismissBanner = async (id) => {
  const el = document.getElementById('banner-' + id);
  if (el) {
    el.style.opacity = '0';
    setTimeout(() => el.style.display = 'none', 300);
  }
  const dismissed = JSON.parse(localStorage.getItem('dismissed_banners') || '[]');
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    localStorage.setItem('dismissed_banners', JSON.stringify(dismissed));
  }
};

// ── Helpers de Avisos por Modal ────────────────────────────────
function processNextAviso(avisos, index) {
  if (index >= avisos.length) return; // Fim da fila
  const a = avisos[index];

  import('../utils.js').then(({ modal }) => {
    modal(
      `${a.tipo === 'danger' ? '🔴' : a.tipo === 'success' ? '🟢' : a.tipo === 'warning' ? '🟡' : '🔵'} ${a.titulo}`,
      `<p style="font-size:0.95rem;white-space:pre-wrap;color:var(--text-dark)">${a.mensagem}</p>`,
      {
        confirmLabel: 'Entendi e Li as Informações',
        onConfirm: async () => {
          try {
            await store.marcarAvisoLido(a.id);
            processNextAviso(avisos, index + 1);
            return true;
          } catch (e) {
            console.error('Erro ao marcar lido', e);
            processNextAviso(avisos, index + 1);
            return true;
          }
        }
      }
    );
  });
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
      <div class="sidebar-logo" id="sidebar-logo" style="margin-bottom:12px">
        <img src="/logo.png?v=17" alt="Gota App" style="width:100%;max-width:180px;height:auto;object-fit:contain" />
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
        <div class="main-header-actions" id="header-actions">
          <button id="global-search-btn" title="Buscar (⌘K)" style="background:white;border:1px solid var(--border);border-radius:8px;padding:6px 12px;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-muted);transition:all 0.15s;" onmouseover="this.style.borderColor='var(--green-400)'" onmouseout="this.style.borderColor='var(--border)'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span class="search-hint" style="font-size:0.78rem">Buscar...</span>
            <kbd style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:4px;padding:1px 5px;font-size:0.68rem;color:#6b7280;font-family:monospace;">⌘K</kbd>
          </button>
        </div>
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

  // ── Global Search button + ⌘K shortcut ────────────────────────
  function openGlobalSearch() {
    // Avoid duplicate overlays
    if (document.getElementById('global-search-overlay')) return;

    // Cache data once per open (lazy fetch)
    let clients = [], anamneses = [], agendamentos = [];
    let currentFocus = -1;

    const overlay = document.createElement('div');
    overlay.id = 'global-search-overlay';
    overlay.innerHTML = `
      <style>
        #global-search-overlay {
          position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.45);
          display:flex;justify-content:center;padding-top:80px;
          animation:gsOverlayIn 0.15s ease;
        }
        @keyframes gsOverlayIn { from{opacity:0} to{opacity:1} }
        #global-search-box {
          background:white;border-radius:16px;width:100%;max-width:580px;
          max-height:70vh;overflow:hidden;display:flex;flex-direction:column;
          box-shadow:0 24px 60px rgba(0,0,0,0.25);
          animation:gsBoxIn 0.15s ease;
          margin:0 16px;
        }
        @keyframes gsBoxIn { from{transform:scale(0.96);opacity:0} to{transform:scale(1);opacity:1} }
        #global-search-input-wrap {
          display:flex;align-items:center;gap:10px;padding:14px 18px;
          border-bottom:1px solid var(--border);
        }
        #global-search-input {
          flex:1;border:none;outline:none;font-size:1rem;color:var(--text-dark);
          background:transparent;
        }
        #global-search-results {
          overflow-y:auto;padding:8px 0;
        }
        .gs-section-label {
          padding:6px 18px 4px;font-size:0.65rem;font-weight:700;
          text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);
        }
        .gs-item {
          display:flex;align-items:center;gap:12px;
          padding:9px 18px;cursor:pointer;transition:background 0.1s;
        }
        .gs-item:hover, .gs-item.focused {
          background:var(--green-50);
        }
        .gs-item-icon {
          width:32px;height:32px;border-radius:8px;background:var(--green-100);
          display:flex;align-items:center;justify-content:center;
          font-size:0.85rem;flex-shrink:0;
        }
        .gs-item-main { flex:1;min-width:0; }
        .gs-item-title { font-size:0.88rem;font-weight:600;color:var(--text-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .gs-item-sub { font-size:0.74rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .gs-item-badge { font-size:0.65rem;background:#f3f4f6;color:#6b7280;padding:2px 6px;border-radius:6px;white-space:nowrap; }
        .gs-empty { text-align:center;padding:28px;color:var(--text-muted);font-size:0.88rem; }
        .gs-footer { padding:8px 18px;border-top:1px solid var(--border);font-size:0.72rem;color:var(--text-muted);display:flex;gap:16px; }
      </style>
      <div id="global-search-box">
        <div id="global-search-input-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input id="global-search-input" placeholder="Buscar clientes, anamneses, eventos..." autocomplete="off" />
          <kbd style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:4px;padding:2px 6px;font-size:0.7rem;color:#9ca3af;cursor:pointer;" id="gs-esc">ESC</kbd>
        </div>
        <div id="global-search-results"><div class="gs-empty">⌨️ Digite para buscar...</div></div>
        <div class="gs-footer">
          <span>↑↓ navegar</span>
          <span>↵ abrir</span>
          <span>ESC fechar</span>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    const input = document.getElementById('global-search-input');
    const resultsEl = document.getElementById('global-search-results');
    input.focus();

    function close() {
      overlay.style.animation = 'none';
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 100);
    }

    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.getElementById('gs-esc')?.addEventListener('click', close);

    // Load data once overlay opens
    Promise.all([
      store.getClients().catch(() => []),
      store.getAnamneses().catch(() => []),
      store.getAgendamentos().catch(() => []),
    ]).then(([c, a, ag]) => { clients = c; anamneses = a; agendamentos = ag; if (input.value) doSearch(input.value); });

    function highlight(text, q) {
      if (!q) return text;
      const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return (text || '').replace(re, '<mark style="background:#fef9c3;border-radius:2px">$1</mark>');
    }

    function doSearch(q) {
      q = q.trim();
      currentFocus = -1;
      if (!q) { resultsEl.innerHTML = '<div class="gs-empty">⌨️ Digite para buscar...</div>'; return; }
      const ql = q.toLowerCase();

      const clientResults = clients.filter(c =>
        (c.nome || c.name || '').toLowerCase().includes(ql) ||
        (c.email || '').toLowerCase().includes(ql) ||
        (c.telefone || c.phone || '').includes(ql)
      ).slice(0, 5);

      const anamneseResults = anamneses.filter(a =>
        (a.cliente_nome || a.nome_link || '').toLowerCase().includes(ql)
      ).slice(0, 3);

      const eventResults = agendamentos.filter(e =>
        (e.titulo || e.title || '').toLowerCase().includes(ql) ||
        (e.cliente_nome || '').toLowerCase().includes(ql)
      ).slice(0, 3);

      const total = clientResults.length + anamneseResults.length + eventResults.length;
      if (total === 0) { resultsEl.innerHTML = `<div class="gs-empty">🔍 Nenhum resultado para "${q}"</div>`; return; }

      let html = '';

      if (clientResults.length > 0) {
        html += `<div class="gs-section-label">👥 Clientes</div>`;
        html += clientResults.map(c => {
          const name = c.nome || c.name || '—';
          const sub = [c.email, c.telefone || c.phone].filter(Boolean).join(' · ');
          const badge = c.status === 'active' ? 'Ativo' : 'Inativo';
          return `<div class="gs-item" data-type="client" data-id="${c.id}">
            <div class="gs-item-icon">👤</div>
            <div class="gs-item-main">
              <div class="gs-item-title">${highlight(name, q)}</div>
              ${sub ? `<div class="gs-item-sub">${highlight(sub, q)}</div>` : ''}
            </div>
            <span class="gs-item-badge">${badge}</span>
          </div>`;
        }).join('');
      }

      if (anamneseResults.length > 0) {
        html += `<div class="gs-section-label">📋 Anamneses</div>`;
        html += anamneseResults.map(a => {
          const name = a.cliente_nome || a.nome_link || '—';
          const status = a.status === 'filled' ? '✅ Preenchida' : '⏳ Aguardando';
          return `<div class="gs-item" data-type="anamnesis" data-id="${a.id}">
            <div class="gs-item-icon">📋</div>
            <div class="gs-item-main">
              <div class="gs-item-title">${highlight(name, q)}</div>
              <div class="gs-item-sub">${status}</div>
            </div>
          </div>`;
        }).join('');
      }

      if (eventResults.length > 0) {
        html += `<div class="gs-section-label">📅 Agenda</div>`;
        html += eventResults.map(e => {
          const title = e.titulo || e.title || 'Evento';
          const dt = e.data_hora ? new Date(e.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
          return `<div class="gs-item" data-type="schedule" data-id="${e.id}">
            <div class="gs-item-icon">📅</div>
            <div class="gs-item-main">
              <div class="gs-item-title">${highlight(title, q)}</div>
              ${dt ? `<div class="gs-item-sub">${dt}</div>` : ''}
            </div>
          </div>`;
        }).join('');
      }

      resultsEl.innerHTML = html;

      resultsEl.querySelectorAll('.gs-item').forEach(item => {
        item.addEventListener('click', () => {
          const type = item.dataset.type;
          const id = item.dataset.id;
          close();
          if (type === 'client') router.navigate('/clients');
          else if (type === 'anamnesis') router.navigate('/anamnesis');
          else if (type === 'schedule') router.navigate('/schedule');
        });
      });
    }

    let debounce;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => doSearch(input.value), 200);
    });

    // Keyboard navigation
    document.addEventListener('keydown', function gsKeydown(e) {
      if (!document.getElementById('global-search-overlay')) {
        document.removeEventListener('keydown', gsKeydown);
        return;
      }
      const items = [...resultsEl.querySelectorAll('.gs-item')];
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', gsKeydown); }
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentFocus = Math.min(currentFocus + 1, items.length - 1);
        items.forEach((el, i) => el.classList.toggle('focused', i === currentFocus));
        items[currentFocus]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentFocus = Math.max(currentFocus - 1, 0);
        items.forEach((el, i) => el.classList.toggle('focused', i === currentFocus));
        items[currentFocus]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && currentFocus >= 0) {
        items[currentFocus]?.click();
      }
    });
  }

  document.getElementById('global-search-btn')?.addEventListener('click', openGlobalSearch);

  // ⌘K / Ctrl+K global shortcut
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openGlobalSearch();
    }
  });

  return document.getElementById('page-content');
}

// ── Helper: Visual funnel with centered bars and conversion rates ──
function buildFunnel(steps) {
  // steps = [{ label, count, icon, color }]
  const top = steps[0]?.count || 0;
  if (top === 0) return '<div class="empty-state"><div class="empty-state-icon">📊</div><p>Sem dados no funil ainda</p></div>';

  // Min width: 18%, max 100% — centered bar like a triangle
  const bars = steps.map((s, i) => {
    const pctOfTop = Math.round((s.count / top) * 100);
    const barW = Math.max(18, pctOfTop); // minimum visual width
    const next = steps[i + 1];
    const dropPct = next && s.count > 0 ? Math.round((next.count / s.count) * 100) : null;
    const isLast = i === steps.length - 1;
    return `
      <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:2px">
        <!-- Label row -->
        <div style="display:flex;justify-content:space-between;width:100%;margin-bottom:3px">
          <span style="font-size:0.76rem;color:var(--text-muted);white-space:nowrap">${s.icon} ${s.label}</span>
          <span style="font-size:0.76rem;font-weight:700;color:${s.color}">${s.count}</span>
        </div>
        <!-- Centered trapezoid bar -->
        <div style="width:100%;display:flex;justify-content:center">
          <div style="width:${barW}%;height:24px;background:${s.color}${isLast ? '' : '22'};border:2px solid ${s.color};border-radius:5px;display:flex;align-items:center;justify-content:center;transition:width 0.6s ease;position:relative">
            <span style="font-size:0.72rem;font-weight:700;color:${s.color};white-space:nowrap">${pctOfTop}% do topo</span>
          </div>
        </div>
        <!-- Drop-off arrow between steps -->
        ${dropPct !== null ? `<div style="font-size:0.68rem;color:${dropPct < 40 ? '#ef4444' : dropPct < 70 ? '#f59e0b' : '#22c55e'};margin:4px 0;font-weight:600">↓ ${dropPct}% avançaram</div>` : ''}
      </div>`;
  });

  // Overall conversion rate
  const last = steps[steps.length - 1];
  const convRate = top > 0 ? Math.round((last.count / top) * 100) : 0;
  const convColor = convRate >= 10 ? '#16a34a' : convRate >= 5 ? '#f59e0b' : '#ef4444';

  return bars.join('') + `
    <div style="margin-top:12px;padding:10px;background:#f8fafc;border-radius:8px;border-top:2px solid var(--border);display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:0.78rem;color:var(--text-muted)">Taxa de Conversão Total</span>
      <span style="font-size:1.1rem;font-weight:800;color:${convColor}">${convRate}%</span>
    </div>`;
}

// compat shim (still used in some places)
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

  // ── Mensagem do Assistente ──
  const assistantMsg = "Você tem ótimas novidades para conferir hoje! 🔥";

  // Render layout immediately with loading state
  renderLayout(router, `Olá, ${firstName}! 👋`,
    `<p style="color:var(--text-muted);margin:-10px 0 20px;font-size:0.95rem">${assistantMsg}</p>
     <div style="display:flex;align-items:center;justify-content:center;height:300px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando dashboard...</div>`,
    'dashboard'
  );

  try {
    const [clients, anamneses, agendamentos, aniversariantes, avisosBanners, avisosModais] = await Promise.all([
      store.getClients().catch(() => []),
      store.getAnamneses().catch(() => []),
      store.getAgendamentos().catch(() => []),
      store.getAniversariantes().catch(() => []),
      store.getAvisosBanner().catch(() => []),
      store.getAvisosNaoLidos().catch(() => [])
    ]);

    // ── Prepara Banners de Avisos ──
    const dismissedBanners = JSON.parse(localStorage.getItem('dismissed_banners') || '[]');
    const bannersToShow = avisosBanners.filter(a => !dismissedBanners.includes(a.id));

    const bannersHtml = bannersToShow.length > 0 ? bannersToShow.map(a => `
      <div id="banner-${a.id}" style="background:${a.tipo === 'danger' ? '#fee2e2' : a.tipo === 'success' ? '#dcfce7' : a.tipo === 'warning' ? '#fef3c7' : '#e0e7ff'};
                  border-left: 4px solid ${a.tipo === 'danger' ? '#ef4444' : a.tipo === 'success' ? '#22c55e' : a.tipo === 'warning' ? '#f59e0b' : '#6366f1'};
                  padding:12px 16px; margin-bottom: 20px; border-radius: 4px; display:flex; gap:12px; align-items:flex-start; transition: opacity 0.3s ease;">
        <span style="font-size:1.4rem">${a.tipo === 'danger' ? '🔴' : a.tipo === 'success' ? '🟢' : a.tipo === 'warning' ? '🟡' : '🔵'}</span>
        <div style="flex:1">
          <b style="color:var(--text-dark);font-size:0.95rem">${a.titulo}</b>
          <p style="margin:4px 0 0;font-size:0.85rem;color:var(--text-muted);white-space:pre-wrap;">${a.mensagem}</p>
        </div>
        <button onclick="window.dismissBanner('${a.id}')" style="background:transparent;border:none;font-size:1.3rem;color:var(--text-muted);cursor:pointer;padding:0 4px;line-height:1;transition:color 0.2s" onmouseover="this.style.color='#000'" onmouseout="this.style.color='var(--text-muted)'" title="Fechar">×</button>
      </div>
    `).join('') : '';


    // ── Follow-ups via API ──
    let followupsArr = [];
    try {
      followupsArr = await store.getFollowups().catch(() => []);
    } catch (e) { }

    // ── Onboarding Checklist ──
    const onboardingDismissed = localStorage.getItem('onboarding_dismissed_' + consultant.id) === '1';
    const hasProfile = !!(consultant?.nome && consultant?.telefone);
    const hasClient = clients.length > 0;
    const hasAnamnese = anamneses.length > 0;
    const hasFollowup = followupsArr.length > 0;

    const onboardingSteps = [
      { done: hasProfile, label: 'Complete seu perfil', sub: 'Adicione sua foto e telefone', action: "location.hash='#/profile'", btn: 'Completar →' },
      { done: hasClient, label: 'Adicione seu primeiro cliente', sub: 'Cadastre alguém que você já atende', action: "window.dashboardAddClient()", btn: 'Adicionar →' },
      { done: hasAnamnese, label: 'Configure seu link de anamnese', sub: 'Crie um formulário de saúde personalizado', action: "location.hash='#/anamnesis'", btn: 'Criar →' },
      { done: hasFollowup, label: 'Crie seu primeiro follow-up', sub: 'Registre o acompanhamento de uma cliente', action: "location.hash='#/followup'", btn: 'Criar →' },
      { done: anamneses.some(a => a.subtipo === 'generico'), label: 'Link de captação genérico', sub: 'Para novos leads sem cliente específico', action: "location.hash='#/links'", btn: 'Criar →' },
    ];
    const doneCount = onboardingSteps.filter(s => s.done).length;
    const pct = Math.round((doneCount / onboardingSteps.length) * 100);
    const allDone = doneCount === onboardingSteps.length;

    const onboardingHtml = (!onboardingDismissed && !allDone) ? `
      <div id="onboarding-card" style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:1.5px solid #86efac;border-radius:16px;padding:20px 24px;margin-bottom:24px;position:relative;">
        <button onclick="localStorage.setItem('onboarding_dismissed_${consultant.id}','1');document.getElementById('onboarding-card').style.display='none'" style="position:absolute;top:12px;right:14px;background:transparent;border:none;font-size:1.2rem;color:#9ca3af;cursor:pointer;line-height:1;" title="Fechar">×</button>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div style="font-size:1.4rem">🌱</div>
          <div style="flex:1">
            <div style="font-weight:700;font-size:1rem;color:#166534">Bem-vinda ao Gota App!</div>
            <div style="font-size:0.78rem;color:#15803d">${doneCount} de ${onboardingSteps.length} passos concluídos</div>
          </div>
          <div style="font-size:1.1rem;font-weight:800;color:#166534">${pct}%</div>
        </div>
        <div style="height:6px;background:#bbf7d0;border-radius:3px;margin-bottom:14px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#22c55e,#16a34a);border-radius:3px;transition:width 0.6s ease"></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:7px">
          ${onboardingSteps.map(step => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:${step.done ? 'rgba(134,239,172,0.15)' : 'white'};border-radius:9px;border:1px solid ${step.done ? '#86efac' : '#e5e7eb'}">
              <div style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.78rem;font-weight:700;background:${step.done ? '#22c55e' : '#f3f4f6'};color:${step.done ? 'white' : '#9ca3af'}">${step.done ? '✓' : '○'}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:0.86rem;font-weight:${step.done ? '400' : '600'};color:${step.done ? '#9ca3af' : '#111827'};${step.done ? 'text-decoration:line-through' : ''}">${step.label}</div>
                ${!step.done ? `<div style="font-size:0.72rem;color:#9ca3af">${step.sub}</div>` : ''}
              </div>
              ${!step.done ? `<button onclick="${step.action}" style="background:#166534;color:white;border:none;border-radius:7px;padding:5px 11px;font-size:0.74rem;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0">${step.btn}</button>` : ''}
            </div>
          `).join('')}
        </div>
      </div>` : '';

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

    // Etapas do Kanban/Pipeline de Vendas
    const stageLabels = { lead_captado: 'Lead', primeiro_contato: 'Contato', interesse_confirmado: 'Interesse', protocolo_apresentado: 'Apresentação', proposta_enviada: 'Proposta', negociando: 'Negociação', primeira_compra: 'Fechado' };
    const stageCounts = {};
    Object.keys(stageLabels).forEach(s => { stageCounts[s] = 0; });

    // Etapas do Kanban/Pipeline de Recrutamento
    const recStageLabels = { prospecto_negocio: 'Prospecto de Negócio', convite_apresentacao: 'Convite Feito', apresentacao_assistida: 'Assistiu Apresentação', acompanhamento_cadastro: 'Em Acompanhamento', cadastrada: 'Cadastrada!' };
    const recStageCounts = {};
    Object.keys(recStageLabels).forEach(s => { recStageCounts[s] = 0; });

    clients.forEach(c => {
      // Funil de Vendas
      if (c.pipeline_stage !== 'none' && !(!c.pipeline_stage && c.recrutamento_stage)) {
        const stage = c.pipeline_stage || 'lead_captado';
        if (stageCounts[stage] !== undefined) stageCounts[stage]++;
      }

      // Funil de Recrutamento
      if (c.recrutamento_stage && c.recrutamento_stage !== 'none') {
        const recStage = c.recrutamento_stage;
        if (recStageCounts[recStage] !== undefined) recStageCounts[recStage]++;
      }
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

    // ── Metas Mensais ──────────────────────────────────────────────
    const consultantId = consultant?.id || 'default';
    const metasKey = `se_metas_${consultantId}`;
    const metasDefault = { leads: 20, vendas: 5, clientes: 10, cadastros: 3, followups: 20 };
    let metas;
    try { metas = { ...metasDefault, ...JSON.parse(localStorage.getItem(metasKey) || '{}') }; }
    catch { metas = { ...metasDefault }; }

    // Calcular progresso real do mês
    const leadsMes = clients.filter(c =>
      (c.pipeline_stage === 'lead_captado' || !c.pipeline_stage)
      && new Date(c.criado_em || c.created_at || 0) >= thisMonth).length;
    const vendasMes = clients.filter(c => c.pipeline_stage === 'primeira_compra'
      && new Date(c.updated_at || c.criado_em || 0) >= thisMonth).length;
    const clientesMes = monthClients;
    const cadastrosMes = clients.filter(c =>
      c.recrutamento_stage === 'cadastrada'
      && new Date(c.updated_at || c.criado_em || 0) >= thisMonth).length;
    const followupsMes = followupsArr.filter(f =>
      f.status === 'completed'
      && new Date(f.completed_at || f.updated_at || 0) >= thisMonth
    ).length;

    function goalBar(label, icon, atual, meta, id, barColorBase = '#60a5fa,#3b82f6') {
      const pctG = meta > 0 ? Math.min(100, Math.round((atual / meta) * 100)) : 0;
      const done = pctG >= 100;
      const barColor = done ? 'linear-gradient(90deg,#22c55e,#16a34a)' : `linear-gradient(90deg,${barColorBase})`;
      const bgColor = done ? '#bbf7d0' : '#dbeafe';
      return `
        <div style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:0.82rem;font-weight:600;color:var(--text-dark)">${icon} ${label}</span>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font-size:0.78rem;color:var(--text-muted)">${atual}/${meta}${done ? ' 🎉' : ''}</span>
              <button class="btn-meta-edit" data-meta-id="${id}" data-meta-val="${meta}"
                style="font-size:0.68rem;padding:2px 7px;border:1px solid var(--border);border-radius:5px;background:transparent;cursor:pointer;color:var(--text-muted)">
                ✏️
              </button>
            </div>
          </div>
          <div style="height:7px;background:${bgColor};border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${pctG}%;background:${barColor};border-radius:4px;transition:width 0.8s ease"></div>
          </div>
          ${done
          ? `<div style="font-size:0.72rem;color:#16a34a;font-weight:600;margin-top:3px">Meta batida! Parabéns! 🏆</div>`
          : `<div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px">${pctG}% — faltam ${meta - atual}</div>`}
        </div>`;
    }

    const metasHtml = `
      <div class="card" style="border-left:4px solid #3b82f6;margin-bottom:10px" id="metas-card">
        <div class="card-header" style="background:#eff6ff">
          <h3 style="color:#1d4ed8">🎯 Metas do Mês</h3>
          <span style="font-size:0.72rem;color:var(--text-muted)">${now.toLocaleString('pt-BR', { month: 'long' }).replace(/^./, s => s.toUpperCase())}</span>
        </div>
        <div class="card-body">
          ${goalBar('Leads Captados', '💧', leadsMes, metas.leads, 'leads', '#a78bfa,#7c3aed')}
          ${goalBar('Vendas Fechadas', '💰', vendasMes, metas.vendas, 'vendas', '#34d399,#059669')}
          ${goalBar('Novos Clientes', '👥', clientesMes, metas.clientes, 'clientes', '#60a5fa,#3b82f6')}
          ${goalBar('Cadastros (Recrutamento)', '💼', cadastrosMes, metas.cadastros, 'cadastros', '#f97316,#ea580c')}
          ${goalBar('Follow-ups Concluídos', '✅', followupsMes, metas.followups, 'followups', '#fb7185,#e11d48')}
        </div>
      </div>`;


    // ════════════════════════════════════════════════════
    // BUILD HTML
    // ════════════════════════════════════════════════════
    // Dicas dinâmicas para o título
    let metaText = "Tudo tranquilo por enquanto. Tire um tempo para prospecção!";
    if (urgentFollowups.length > 0) metaText = `Você tem <strong>${urgentFollowups.length} clientes</strong> precisando do seu contato urgente agora! 🔥`;
    else if (anamnesesPendentes.length > 0) metaText = `Você recebeu novas anamneses! Há <strong>${anamnesesPendentes.length} pendentes</strong> esperando sua revisão. 📋`;

    const contentHtml = `
  ${bannersHtml}
  ${onboardingHtml}
  <p style="color:var(--text-muted);margin:-10px 0 24px;font-size:0.95rem">${metaText}</p>

  <div class="dashboard-grid">
    
    <!-- TORRE ESQUERDA (GRÁFICOS E DADOS E STATS) -->
    <div class="dashboard-col left-col">
      <div class="stats-grid">
        <div class="stat-card green" style="cursor:pointer; border-top: 4px solid var(--green-500)" onclick="location.hash='#/clients'">
          <div class="stat-icon">👥</div>
          <div class="stat-value">${totalClients}</div>
          <div class="stat-label">Total de Clientes</div>
          <div class="stat-trend trend-up">
            📈 ${activeClients} ativos · ${leadClients} leads
          </div>
        </div>
        <div class="stat-card gold" style="cursor:pointer; border-top: 4px solid var(--gold-500)" onclick="location.hash='#/anamnesis'">
          <div class="stat-icon">📋</div>
          <div class="stat-value">${totalAnamneses}</div>
          <div class="stat-label">Anamneses</div>
          <div class="stat-trend">${anamnesesPendentes.length > 0 ? '⏳ ' + anamnesesPendentes.length + ' aguardando' : '✅ 100% lidas'}</div>
        </div>
        <div class="stat-card blue" style="cursor:pointer; border-top: 4px solid #3b82f6" onclick="location.hash='#/pipeline'">
          <div class="stat-icon">📈</div>
          <div class="stat-value">${stageCounts.primeira_compra || 0}</div>
          <div class="stat-label">Vendas Fechadas</div>
          <div class="stat-trend trend-up">↑ ${monthClients} leads novos este mês</div>
        </div>
        <div class="stat-card rose" style="cursor:pointer; border-top: 4px solid #e11d48" onclick="location.hash='#/followup'">
          <div class="stat-icon">💬</div>
          <div class="stat-value">${totalFollowups}</div>
          <div class="stat-label">Tarefas & Follow-ups</div>
          ${fuTrendHtml || '<div class="stat-trend trend-up">✅ Tudo em dia!</div>'}
        </div>
      </div>
      <!-- Funil de Vendas -->
      <div class="card">
        <div class="card-header">
          <h3>📈 Funil de Vendas (Produtos)</h3>
          <button class="btn btn-secondary btn-sm" onclick="location.hash='#/pipeline'">Kanban</button>
        </div>
        <div class="card-body">
          ${buildFunnel([
      { label: 'Lead Captado', icon: '💧', count: stageCounts.lead_captado || 0, color: '#6366f1' },
      { label: 'Primeiro Contato', icon: '📞', count: stageCounts.primeiro_contato || 0, color: '#3b82f6' },
      { label: 'Interesse', icon: '💬', count: stageCounts.interesse_confirmado || 0, color: '#06b6d4' },
      { label: 'Protocolo Apres.', icon: '🌿', count: stageCounts.protocolo_apresentado || 0, color: '#10b981' },
      { label: 'Proposta Envia.', icon: '📦', count: stageCounts.proposta_enviada || 0, color: '#f59e0b' },
      { label: 'Negociando', icon: '🤝', count: stageCounts.negociando || 0, color: '#f97316' },
      { label: 'Fechado! 🎉', icon: '💰', count: stageCounts.primeira_compra || 0, color: '#22c55e' },
    ])}
        </div>
      </div>

      <!-- Funil de Recrutamento (Cadastro) -->
      <div class="card">
        <div class="card-header">
          <h3>💼 Funil de Recrutamento (Downlines)</h3>
          <button class="btn btn-secondary btn-sm" onclick="location.hash='#/pipeline'">Kanban</button>
        </div>
        <div class="card-body">
          ${buildFunnel([
      { label: 'Prospecto de Negócio', icon: '🎯', count: recStageCounts.prospecto_negocio || 0, color: '#8b5cf6' },
      { label: 'Convite Feito', icon: '✉️', count: recStageCounts.convite_apresentacao || 0, color: '#d946ef' },
      { label: 'Assistiu Apres.', icon: '📺', count: recStageCounts.apresentacao_assistida || 0, color: '#3b82f6' },
      { label: 'Acompanhamento', icon: '⏱️', count: recStageCounts.acompanhamento_cadastro || 0, color: '#f59e0b' },
      { label: 'Cadastrada! 🏅', icon: '💼', count: recStageCounts.cadastrada || 0, color: '#22c55e' },
    ])}
        </div>
      </div>

      
    </div>
    
    <!-- TORRE DIREITA (AÇÕES E FEED) -->
    <div class="dashboard-col right-col">

      <!-- Metas Mensais -->
      ${metasHtml}

      <!-- Quick Actions -->
      <div class="quick-actions" style="display:flex;gap:10px;margin-bottom:8px">
        <button class="btn btn-primary" style="flex:1;justify-content:center" onclick="window.dashboardAddClient()">+ Cliente</button>
        <button class="btn btn-secondary" style="flex:1;justify-content:center" onclick="location.hash='#/links'">🔗 Links</button>
      </div>

      <!-- Follow-ups Urgentes -->
      ${urgentFollowups.length > 0 ? `
      <div class="card" style="border-left:4px solid #f59e0b">
        <div class="card-header" style="background:var(--orange-50)">
          <h3 style="color:#b45309">🔥 Follow-ups Urgentes</h3>
          <button class="btn btn-secondary btn-sm" onclick="location.hash='#/followup'">Ir</button>
        </div>
        <div class="card-body">
          ${urgentFollowups.map(f => fuRow(f, clients)).join('')}
        </div>
      </div>` : ''}

      <!-- Aniversariantes -->
      <div class="card">
        <div class="card-header">
          <h3>🎂 Aniversários Próximos</h3>
        </div>
        <div class="card-body" style="padding-bottom:10px">
          ${aniversariantes.length === 0
        ? '<div class="empty-state" style="padding:20px 0"><div class="empty-state-icon" style="font-size:2rem;margin-bottom:8px">🎈</div><p style="font-size:0.85rem">Nenhum próximo esta semana</p></div>'
        : aniversariantes.map(c => `
            <div class="birthday-item" style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:12px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:42px; height:42px; border-radius:50%; background:linear-gradient(135deg, #fce7f3, #fbcfe8); display:flex; align-items:center; justify-content:center; font-size:1.3rem; flex-shrink:0;">
                  🎈
                </div>
                <div>
                  <div class="birthday-name" style="font-weight:600; font-size:0.95rem; color:var(--text-dark)">${c.nome}</div>
                  <div class="birthday-date" style="font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
                    📅 ${formatDate(c.data_nascimento)}
                    ${c.is_today ? '<span style="color:#e11d48; font-weight:700; font-size:0.75rem;">· HOJE! 🎉</span>' : '<span style="color:#059669; font-size:0.75rem;">· em 7 dias</span>'}
                  </div>
                </div>
              </div>
              ${c.whatsapp_link
            ? `<a href="${c.whatsapp_link}" target="_blank" class="btn btn-sm" style="background:#25D366; color:white; border:none; border-radius:8px; padding:8px 10px; display:inline-flex; align-items:center; box-shadow:0 3px 10px rgba(37,211,102,0.25); transition:transform 0.2s;">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                   </a>`
            : ''}
            </div>`).join('')}
        </div>
      </div>
      
      <!-- Próximas Reuniões -->
      <div class="card">
        <div class="card-header">
          <h3>📅 Próximas Reuniões</h3>
          <button class="btn btn-secondary btn-sm" onclick="location.hash='#/schedule'">Agenda</button>
        </div>
        <div class="card-body">
          ${upcoming.length === 0
        ? '<div class="empty-state" style="padding:15px 0"><div class="empty-state-icon" style="font-size:1.8rem">📅</div><p style="font-size:0.85rem;margin-bottom:8px">Nenhuma reunião agendada</p><button class="btn btn-primary btn-sm" onclick="location.hash=\'#/schedule\'">+ Agendar Hoje</button></div>'
        : upcoming.map(e => '<div class="schedule-event" style="margin-bottom:8px;padding-bottom:10px;border-bottom:1px solid var(--border)">' +
          '<div class="schedule-event-title" style="font-size:0.9rem;font-weight:600;color:var(--text-dark)">' + (e.titulo || e.title || 'Reunião') + '</div>' +
          '<div class="schedule-event-meta" style="font-size:0.75rem;color:#b45309;margin-top:2px">📅 ' + formatDate(e.data_hora || e.date) + '</div>' +
          '</div>').join('')}
        </div>
      </div>
      
    </div> <!-- Fim Torre Direita -->

  </div>`;

    // Update page-content with real data (no full re-render to avoid losing sidebar)
    const pc = document.getElementById('page-content');
    if (pc) pc.innerHTML = contentHtml;

    // ── Inicia processamento de Modais de Aviso Não Lidos ──
    if (avisosModais && avisosModais.length > 0) {
      setTimeout(() => processNextAviso(avisosModais, 0), 600);
    }

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
    const key = 'se_followups_' + consultantId;
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

// Edição inline de metas mensais (event delegation no body)
document.body.addEventListener('click', e => {
  const btn = e.target.closest('.btn-meta-edit');
  if (!btn) return;
  const id = btn.dataset.metaId;
  const currentVal = parseInt(btn.dataset.metaVal) || 0;
  const labels = { leads: 'Leads Captados', vendas: 'Vendas Fechadas', clientes: 'Novos Clientes', cadastros: 'Cadastros (Recrutamento)', followups: 'Follow-ups Concluídos' };

  const newVal = parseInt(prompt(`🎯 Nova meta de ${labels[id] || id} para este mês:`, currentVal));
  if (isNaN(newVal) || newVal < 0) return;
  try {
    const raw = sessionStorage.getItem('se_user');
    const consultantId = raw ? JSON.parse(raw).id : 'default';
    const metasKey = `se_metas_${consultantId}`;
    const saved = JSON.parse(localStorage.getItem(metasKey) || '{}');
    saved[id] = newVal;
    localStorage.setItem(metasKey, JSON.stringify(saved));
    location.reload();
  } catch { }
});

