/* ============================================================
   ROUTER – Gerencia a navegação SPA com hash routing
   Sistema Saúde Essencial CRM
   ============================================================ */

export class Router {
    constructor(routes) {
        this._routes = routes;
        window.addEventListener('hashchange', () => this.resolve());
    }

    navigate(path, params = {}) {
        const query = new URLSearchParams(params).toString();
        window.location.hash = query ? `#${path}?${query}` : `#${path}`;
    }

    resolve() {
        const hash = window.location.hash.slice(1) || '/';
        const [pathPart, queryPart] = hash.split('?');
        const params = Object.fromEntries(new URLSearchParams(queryPart || ''));

        // Find matching route
        for (const [pattern, handler] of Object.entries(this._routes)) {
            const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/?]+)') + '$');
            const match = pathPart.match(regex);
            if (match) {
                // Extract named params
                const paramNames = [...pattern.matchAll(/:([^/]+)/g)].map(m => m[1]);
                const routeParams = {};
                paramNames.forEach((name, i) => { routeParams[name] = match[i + 1]; });
                handler({ ...routeParams, ...params });
                return;
            }
        }

        // Default route
        const defaultHandler = this._routes['/'] || this._routes['*'];
        if (defaultHandler) defaultHandler({ ...params });
    }

    start() {
        this.resolve();
    }
}

/* ---- UI Utilities ---- */
export function render(el, html) {
    el.innerHTML = html;
}

export function toast(msg, type = 'success', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${icons[type] || '✅'}</span><span>${msg}</span>`;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(40px)'; t.style.transition = 'all 0.3s'; setTimeout(() => t.remove(), 300); }, duration);
}

export function modal(title, bodyHtml, { onConfirm, confirmLabel = 'Confirmar', confirmClass = 'btn-primary', cancelLabel = 'Cancelar' } = {}) {
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const m = document.createElement('div');
    m.className = 'modal-overlay';
    m.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" data-close>✕</button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${onConfirm ? `<div class="modal-footer">
        <button class="btn btn-secondary" data-close>${cancelLabel}</button>
        <button class="btn ${confirmClass}" data-confirm>${confirmLabel}</button>
      </div>` : ''}
    </div>
  `;
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('open'));

    function close() { m.classList.remove('open'); setTimeout(() => m.remove(), 250); }
    m.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', close));
    m.addEventListener('click', e => { if (e.target === m) close(); });
    if (onConfirm) {
        m.querySelector('[data-confirm]').addEventListener('click', () => { onConfirm(m); close(); });
    }
    return { close, el: m };
}

export function formatDate(iso, opts = {}) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', ...opts });
}

export function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

export function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export function daysUntilBirthday(birthdateStr) {
    if (!birthdateStr) return null;
    const today = new Date();
    const bd = new Date(birthdateStr);
    const next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    return Math.ceil((next - today) / (1000 * 60 * 60 * 24));
}

export function generateSlug(name) {
    return name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim('-')
        + '-' + Math.random().toString(36).slice(2, 7);
}

export function getConsultantTitle(gender) {
    // If the gender is explicitly 'masculino', return 'Consultor', otherwise 'Consultora'
    if (typeof gender === 'string' && gender.trim().toLowerCase() === 'masculino') {
        return 'Consultor';
    }
    return 'Consultora';
}
