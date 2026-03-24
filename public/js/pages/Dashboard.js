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
    { id: 'insights', icon: '⚡', label: 'Raio-X de Vendas' },
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
    { id: 'prospecting', icon: '🛰️', label: 'Radar de Leads' },
    { id: 'support', icon: '🎧', label: 'Suporte (Ajuda)' },
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
      if (btn.dataset.nav === 'support') {
        const msg = encodeURIComponent(`Olá equipe do Gota App! Meu email de acesso é: ${consultant?.email || 'inserir email'}. Preciso de uma ajuda com: `);
        window.open(`https://wa.me/5521988964012?text=${msg}`, '_blank');
        return;
      }
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

// ── Helper: Modern step-by-step Funnel (Circles) ──────────────
// ── Helper: Professional Pipeline Funnel (Senior & Robust) ──────────────
function buildFunnel(steps) {
  const baseVolume = Math.max(...steps.map(s => s.count)) || 0;
  
  if (baseVolume === 0) return `
    <div style="display:flex;flex-direction:column;align-items:center;padding:40px 0;gap:12px;color:var(--text-light)">
      <div style="font-size:3rem;opacity:0.2">📊</div>
      <div style="font-size:0.9rem;font-weight:500">Aguardando dados para gerar o funil...</div>
    </div>`;

  let html = '<div class="funnel-senior-pipeline" style="display:flex; flex-direction:column; gap:12px;">';

  steps.forEach((s, i) => {
    const pctOfTotal = baseVolume > 0 ? Math.round((s.count / baseVolume) * 100) : 0;
    const baseColor = s.color || '#3b82f6';
    const isZero = s.count === 0;

    // Cálculo de Conversão da Etapa Anterior
    let conversionHtml = '';
    const prev = steps[i - 1];
    if (prev && prev.count > 0) {
      const conv = Math.round((s.count / prev.count) * 100);
      const convColor = conv >= 70 ? '#10b981' : conv >= 40 ? '#f59e0b' : '#ef4444';
      conversionHtml = `
        <div style="display:flex; align-items:center; justify-content:center; margin:-6px 0; position:relative; z-index:5;">
          <div style="background:${convColor}15; color:${convColor}; border:1px solid ${convColor}30; padding:2px 10px; border-radius:30px; font-size:0.7rem; font-weight:800; display:flex; align-items:center; gap:4px; box-shadow:0 2px 4px rgba(0,0,0,0.05)">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="transform:rotate(90deg)"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            ${conv}% conversão
          </div>
        </div>`;
    }

    if (i > 0) html += conversionHtml;

    html += `
      <div class="pipeline-card" style="display:flex; align-items:center; background:#fff; border:1px solid #eef2f6; border-radius:16px; padding:16px; position:relative; transition:transform 0.2s, box-shadow 0.2s; box-shadow:0 2px 6px rgba(0,0,0,0.02);">
        <div style="position:absolute; left:0; top:15%; bottom:15%; width:4px; background:${baseColor}; border-radius:0 4px 4px 0; opacity:${isZero ? 0.3 : 1}"></div>
        
        <div style="width:48px; height:48px; border-radius:14px; background:${baseColor}10; color:${baseColor}; display:flex; align-items:center; justify-content:center; font-size:1.4rem; flex-shrink:0;">
          ${s.icon || '🔸'}
        </div>

        <div style="margin-left:16px; flex:1;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-weight:700; font-size:0.95rem; color:#1e293b;">${s.label}</span>
            <span style="font-size:1.3rem; font-weight:900; color:${isZero ? '#cbd5e1' : '#1e293b'}">${s.count}</span>
          </div>
          
          <div style="height:8px; background:#f1f5f9; border-radius:10px; position:relative; overflow:hidden;">
            <div style="position:absolute; left:0; top:0; height:100%; width:${pctOfTotal}%; background:${baseColor}; border-radius:10px; transition:width 1s ease-out;"></div>
          </div>
          
          <div style="margin-top:6px; font-size:0.75rem; color:#64748b; font-weight:500;">
            ${pctOfTotal}% do volume total de leads
          </div>
        </div>
      </div>
    `;
  });

  // Resumo de Eficiência Global
  const last = steps[steps.length - 1];
  const finalRate = baseVolume > 0 ? Math.round((last.count / baseVolume) * 100) : 0;
  const rateColor = finalRate >= 15 ? '#10b981' : finalRate >= 5 ? '#f59e0b' : '#ef4444';

  html += `
    <div style="margin-top:20px; padding:16px; background:linear-gradient(135deg, #1e293b, #334155); border-radius:20px; color:#fff; display:flex; justify-content:space-between; align-items:center; box-shadow:0 10px 20px rgba(0,0,0,0.1);">
      <div>
        <div style="font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; opacity:0.7; margin-bottom:4px;">Conversão Geral do Funil</div>
        <div style="font-size:0.85rem; font-weight:400; opacity:0.9;">Taxa de sucesso de ${steps[0].label} até ${last.label}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:1.8rem; font-weight:900; color:${rateColor}; line-height:1;">${finalRate}%</div>
        <div style="font-size:0.6rem; text-transform:uppercase; font-weight:700; margin-top:4px;">Eficiência</div>
      </div>
    </div>
  </div>`;

  return html;
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

  // Render layout immediately with skeleton loading state
  const skeletonHtml = `
    <style>
      @keyframes skeletonPulse {
        0%,100%{opacity:1} 50%{opacity:0.4}
      }
      .sk { background:#e5e7eb; border-radius:6px; animation:skeletonPulse 1.6s ease-in-out infinite; }
      .sk-dark { background:#d1d5db; }
    </style>
    <!-- Skeleton KPI cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:24px">
      ${[1, 2, 3, 4].map(() => `
        <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,0.07)">
          <div class="sk" style="width:32px;height:32px;border-radius:8px;margin-bottom:12px"></div>
          <div class="sk" style="width:60%;height:28px;margin-bottom:8px"></div>
          <div class="sk" style="width:40%;height:14px"></div>
        </div>`).join('')}
    </div>
    <!-- Skeleton main content -->
    <div style="display:grid;grid-template-columns:1fr 340px;gap:20px">
      <div style="display:flex;flex-direction:column;gap:16px">
        <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,0.07)">
          <div class="sk" style="width:180px;height:20px;margin-bottom:16px"></div>
          ${[1, 2, 3, 4, 5, 6, 7].map(() => `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
              <div class="sk" style="width:90px;height:14px;flex-shrink:0"></div>
              <div class="sk" style="flex:1;height:28px;border-radius:6px"></div>
              <div class="sk" style="width:30px;height:14px;flex-shrink:0"></div>
            </div>`).join('')}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,0.07)">
          <div class="sk" style="width:140px;height:20px;margin-bottom:16px"></div>
          ${[1, 2, 3].map(() => `
            <div style="margin-bottom:16px">
              <div class="sk" style="width:100%;height:14px;margin-bottom:8px"></div>
              <div class="sk" style="width:100%;height:8px;border-radius:4px"></div>
            </div>`).join('')}
        </div>
        <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,0.07)">
          <div class="sk" style="width:160px;height:20px;margin-bottom:16px"></div>
          ${[1, 2].map(() => `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
              <div class="sk" style="width:42px;height:42px;border-radius:50%;flex-shrink:0"></div>
              <div style="flex:1">
                <div class="sk" style="width:70%;height:14px;margin-bottom:6px"></div>
                <div class="sk" style="width:50%;height:12px"></div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;

  renderLayout(router, `Olá, ${firstName}! 👋`,
    `<p style="color:var(--text-muted);margin:-10px 0 20px;font-size:0.95rem">${assistantMsg}</p>
     ${skeletonHtml}`,
    'dashboard'
  );

  try {
    // Single API call replaces 7 parallel fetches — much faster on mobile/3G
    const boot = await store.getDashboardBoot();

    const { summary = {}, anamneses = [], agendamentos = [], aniversariantes = [], avisosBanner: avisosBanners = [], avisosModais = [], followups: followupsArr = [] } = boot;

    // Destructure pre-computed summary fields (no full client list needed)
    const {
      totalClients = 0,
      activeClients = 0,
      leadClients = 0,
      monthClients = 0,
      hasClient = false,
      stageCounts = {},
      recStageCounts = {},
      metas: summaryMetas = {}
    } = summary || {};


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



    // ── Onboarding Checklist ──
    const onboardingDismissed = localStorage.getItem('onboarding_dismissed_' + consultant.id) === '1';
    const hasProfile = !!(consultant?.nome && consultant?.telefone);
    const hasClientBool = hasClient || anamneses.length > 0; // from summary
    const hasAnamnese = anamneses.length > 0;
    const hasFollowup = followupsArr.length > 0;

    const onboardingSteps = [
      { done: hasProfile, label: 'Complete seu perfil', sub: 'Adicione sua foto e telefone', action: "location.hash='#/profile'", btn: 'Completar →' },
      { done: hasClientBool, label: 'Adicione seu primeiro cliente', sub: 'Cadastre alguém que você já atende', action: "window.dashboardAddClient()", btn: 'Adicionar →' },
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

    const totalAnamneses = anamneses.length;
    // stageCounts, recStageCounts, totalClients, activeClients, monthClients
    // all come from summary — no client-side iteration needed

    // ── Anamneses pendentes: links pessoais não preenchidos pelo cliente ──
    const anamnesesPendentes = anamneses.filter(a =>
      a.preenchido === false && (a.subtipo === 'pessoal' || a.subtipo == null)
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

    // Metas calculadas no backend via summary endpoint
    const leadsMes = summaryMetas.leadsMes || 0;
    const vendasMes = summaryMetas.vendasMes || 0;
    const clientesMes = monthClients;
    const cadastrosMes = summaryMetas.cadastrosMes || 0;
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
          ${goalBar('Leads Captados', '💧', leadsMes, metas.leads, 'leads', '#a78bfa,#7c3aed')}
          ${goalBar('Vendas Fechadas', '💰', vendasMes, metas.vendas, 'vendas', '#34d399,#059669')}
          ${goalBar('Cadastros (Recrutamento)', '💼', cadastrosMes, metas.cadastros, 'cadastros', '#f97316,#ea580c')}
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

  <div class="dashboard-grid">

    <!-- 1. ANIVERSÁRIOS -->
    <div class="dash-item birthdays">
        <div class="card" style="height:100%">
          <div class="card-header" style="padding: 16px 20px; border-bottom: 1px solid var(--border-light)">
            <h3 style="font-size: 1.1rem; display:flex; align-items:center; gap:8px">🎂 Aniversários Próximos</h3>
          </div>
          <div class="card-body" style="padding:20px">
            ${(() => {
          const todayKey = new Date().toISOString().slice(0, 10);
          const doneRaw = localStorage.getItem('bday_done_' + todayKey) || '[]';
          let doneSet;
          try { doneSet = new Set(JSON.parse(doneRaw)); } catch { doneSet = new Set(); }
          const pending = aniversariantes.filter(c => !doneSet.has(String(c.id)));
          if (pending.length === 0) return `
                <div class="empty-state" style="padding:20px 0">
                  <div class="empty-state-icon" style="font-size:2.5rem;margin-bottom:12px">🎉</div>
                  <p style="font-size:0.95rem; color:var(--text-muted)">Nenhum aniversário hoje.<br>Tudo em dia!</p>
                </div>`;
          return pending.map(c => `
                <div class="birthday-item" data-bid="${c.id}" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
                  <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:40px; height:40px; border-radius:10px; background:var(--rose-50); color:var(--rose-600); display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0;">
                      ${c.is_today ? '🎂' : '🎈'}
                    </div>
                    <div>
                      <div class="birthday-name" style="font-weight:600; font-size:0.95rem; color:var(--text-dark)">${c.nome}</div>
                      <div class="birthday-date" style="font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
                        ${formatDate(c.data_nascimento)}
                        ${c.is_today ? '<span style="color:var(--rose-600); font-weight:700;">· HOJE! 🎉</span>' : ''}
                      </div>
                    </div>
                  </div>
                  <div style="display:flex;gap:8px;align-items:center;">
                    ${c.whatsapp_link
              ? `<a href="${c.whatsapp_link}" target="_blank" class="btn btn-sm btn-secondary" style="background:#25D366; color:white; border:none; padding:8px" title="Enviar WhatsApp">
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                         </a>`
              : ''}
                    <button class="btn-bday-done btn btn-sm btn-secondary" data-bday-id="${c.id}" style="padding: 8px 12px; font-size: 0.75rem" title="Marcar como enviado">
                      ✅ Feito
                    </button>
                  </div>
                </div>`).join('');
        })()}
          </div>
        </div>
      </div>

    <!-- 2. REUNIÕES -->
    <div class="dash-item meetings">
        <div class="card" style="height:100%">
          <div class="card-header" style="padding: 16px 20px; border-bottom: 1px solid var(--border-light)">
            <h3 style="font-size: 1.1rem; display:flex; align-items:center; gap:8px">📅 Próximos Compromissos</h3>
            <button class="btn btn-secondary btn-sm" onclick="location.hash='#/schedule'">Agenda</button>
          </div>
          <div class="card-body" style="padding:20px">
            ${upcoming.length === 0
          ? '<div class="empty-state" style="padding:20px 0"><div class="empty-state-icon" style="font-size:2.5rem; margin-bottom:12px">📅</div><p style="font-size:0.95rem; color:var(--text-muted)">Nenhum compromisso agendado para hoje.</p><button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="location.hash=\'#/schedule\'">+ Agendar Agora</button></div>'
          : upcoming.map(e => `
                <div class="schedule-event" style="padding: 12px; background: var(--gray-50); border-radius: 12px; margin-bottom: 12px; border-left: 4px solid var(--blue-500)">
                  <div class="schedule-event-title" style="font-size:0.95rem;font-weight:600;color:var(--text-dark)">${e.titulo || e.title || 'Reunião'}</div>
                  <div class="schedule-event-meta" style="font-size:0.8rem;color:var(--text-muted);margin-top:4px">⏰ ${formatDate(e.data_hora || e.date)}</div>
                </div>`).join('')}
          </div>
        </div>
      </div>

    <!-- 4. METAS (Largura Total no Decktop) -->
    <div class="dash-item metas full-width">
        ${metasHtml}
      </div>

    <!-- 4. KPIs -->
    <div class="dash-item kpis full-width">
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
          <div class="stat-card" style="cursor:pointer; border-radius: 16px; padding: 20px" onclick="location.hash='#/clients'">
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
              <div>
                <div class="stat-label" style="font-weight:600; font-size:0.85rem; color:var(--text-muted)">MEUS CLIENTES</div>
                <div class="stat-value" style="font-size:1.8rem; font-weight:800; margin-top:4px">${totalClients}</div>
              </div>
              <div style="font-size:1.5rem">👥</div>
            </div>
            <div class="stat-trend" style="margin-top:12px; font-size:0.8rem; color:var(--text-muted)">
              <span style="color:var(--green-600); font-weight:600">${activeClients} ativos</span> · ${leadClients} leads
            </div>
          </div>
          
          <div class="stat-card" style="cursor:pointer; border-radius: 16px; padding: 20px" onclick="location.hash='#/anamnesis'">
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
              <div>
                <div class="stat-label" style="font-weight:600; font-size:0.85rem; color:var(--text-muted)">ANAMNESES</div>
                <div class="stat-value" style="font-size:1.8rem; font-weight:800; margin-top:4px">${totalAnamneses}</div>
              </div>
              <div style="font-size:1.5rem">📋</div>
            </div>
            <div class="stat-trend" style="margin-top:12px; font-size:0.8rem; color:${anamnesesPendentes.length > 0 ? 'var(--gold-600)' : 'var(--green-600)'}">
              ${anamnesesPendentes.length > 0 ? '⚠️ ' + anamnesesPendentes.length + ' pendentes' : '✅ Tudo verificado'}
            </div>
          </div>

          <div class="stat-card" style="cursor:pointer; border-radius: 16px; padding: 20px" onclick="location.hash='#/pipeline'">
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
              <div>
                <div class="stat-label" style="font-weight:600; font-size:0.85rem; color:var(--text-muted)">VENDAS MÊS</div>
                <div class="stat-value" style="font-size:1.8rem; font-weight:800; margin-top:4px">${stageCounts.primeira_compra || 0}</div>
              </div>
              <div style="font-size:1.5rem">💰</div>
            </div>
            <div class="stat-trend" style="margin-top:12px; font-size:0.8rem; color:var(--blue-600)">
              + ${monthClients} novos clientes
            </div>
          </div>

          <div class="stat-card" style="cursor:pointer; border-radius: 16px; padding: 20px" onclick="location.hash='#/followup'">
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
              <div>
                <div class="stat-label" style="font-weight:600; font-size:0.85rem; color:var(--text-muted)">FOLLOW-UPS</div>
                <div class="stat-value" style="font-size:1.8rem; font-weight:800; margin-top:4px">${totalFollowups}</div>
              </div>
              <div style="font-size:1.5rem">💬</div>
            </div>
            <div class="stat-trend" style="margin-top:12px; font-size:0.8rem">
              ${fuTrendHtml || '<span style="color:var(--green-600)">✅ Sem pendências</span>'}
            </div>
          </div>
        </div>
      </div>

    <!-- 5. FUNIL VENDAS -->
    <div class="dash-item funnel-vendas">
        <div class="card" style="height:100%">
          <div class="card-header" style="padding: 16px 20px; border-bottom: 1px solid var(--border-light)">
            <h3 style="font-size: 1.1rem">📈 Funil de Vendas</h3>
            <button class="btn btn-secondary btn-sm" onclick="location.hash='#/pipeline'">Ver Kanban</button>
          </div>
          <div class="card-body" style="padding:20px">
            ${buildFunnel([
        { label: 'Prospecção', icon: '💧', count: stageCounts.lead_captado || 0, color: '#6366f1' },
        { label: 'Qualificação', icon: '📞', count: stageCounts.primeiro_contato || 0, color: '#3b82f6' },
        { label: 'Proposta', icon: '📦', count: stageCounts.proposta_enviada || 0, color: '#f59e0b' },
        { label: 'Fechamento', icon: '💰', count: stageCounts.primeira_compra || 0, color: '#22c55e' },
      ])}
          </div>
        </div>
      </div>

      <div class="dash-item funnel-recrutamento">
        <div class="card" style="height:100%">
          <div class="card-header" style="padding: 16px 20px; border-bottom: 1px solid var(--border-light)">
            <h3 style="font-size: 1.1rem">💼 Funil de Recrutamento</h3>
            <button class="btn btn-secondary btn-sm" onclick="location.hash='#/pipeline'">Ver Kanban</button>
          </div>
          <div class="card-body" style="padding:20px">
            ${buildFunnel([
        { label: 'Prospectos', icon: '🎯', count: recStageCounts.prospecto_negocio || 0, color: '#8b5cf6' },
        { label: 'Convite', icon: '✉️', count: recStageCounts.convite_apresentacao || 0, color: '#d946ef' },
        { label: 'Fechamento', icon: '💼', count: recStageCounts.cadastrada || 0, color: '#22c55e' },
      ])}
          </div>
        </div>
      </div>

    <!-- 7. FOLLOW-UPS URGENTES (Opcional, só se existirem) -->
    ${urgentFollowups.length > 0 ? `
    <div class="dash-item followups full-width">
        <div class="card" style="border-left:4px solid var(--orange-500)">
          <div class="card-header" style="background:var(--orange-50); padding: 16px 20px">
            <h3 style="color:var(--orange-700)">🔥 Follow-ups Urgentes</h3>
            <button class="btn btn-secondary btn-sm" onclick="location.hash='#/followup'">Resolver Todos</button>
          </div>
          <div class="card-body" style="padding:20px">
            ${urgentFollowups.map(f => fuRow(f, clients)).join('')}
          </div>
        </div>
      </div>` : ''}

  </div>`;
    // Update page-content with real data (no full re-render to avoid losing sidebar)
    const pc = document.getElementById('page-content');
    if (pc) pc.innerHTML = contentHtml;

    // ── Botão "Parabéns Enviado" nos aniversariantes ──────────
    pc?.querySelectorAll('.btn-bday-done').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = String(btn.dataset.bdayId);
        const todayKey = new Date().toISOString().slice(0, 10);
        const key = 'bday_done_' + todayKey;
        let done = [];
        try { done = JSON.parse(localStorage.getItem(key) || '[]'); } catch { }
        if (!done.includes(id)) done.push(id);
        localStorage.setItem(key, JSON.stringify(done));

        // Feedback visual: mudar o botão, depois remover o card
        btn.textContent = '🎉 Enviado!';
        btn.style.background = '#dcfce7';
        btn.style.color = '#15803d';
        btn.style.border = '1px solid #86efac';
        const item = btn.closest('.birthday-item');
        if (item) {
          item.style.transition = 'opacity 0.4s, max-height 0.4s';
          item.style.overflow = 'hidden';
          setTimeout(() => { item.style.opacity = '0'; item.style.maxHeight = '0'; item.style.paddingBottom = '0'; item.style.marginBottom = '0'; }, 100);
          setTimeout(() => { item.remove(); }, 600);
        }
      });
    });



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

