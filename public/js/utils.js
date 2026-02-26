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

/**
 * Dynamically inject tracking scripts into <head> for a consultant's public pages.
 * Scripts are injected using document.createElement('script') to ensure execution.
 * (innerHTML-injected <script> tags are NOT executed by browsers per HTML5 spec.)
 * @param {object|null} rastreamento — tracking config from the backend
 */
export function injectTrackingScripts(rastreamento) {
    if (!rastreamento) return;
    const { meta_pixel_id, clarity_id, ga_id, gtm_id, custom_script } = rastreamento;

    /** Create and append an inline <script> that will actually execute */
    function addInlineScript(id, code) {
        if (document.getElementById(id)) return;
        const s = document.createElement('script');
        s.id = id;
        s.textContent = code;
        document.head.appendChild(s);
    }

    /** Create and append an external <script src="…"> */
    function addExternalScript(id, src, async = true) {
        if (document.getElementById(id)) return;
        const s = document.createElement('script');
        s.id = id;
        s.src = src;
        s.async = async;
        document.head.appendChild(s);
    }

    // Meta Pixel (browser-side fbq)
    if (meta_pixel_id) {
        addInlineScript('tracking-meta-pixel',
            `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${meta_pixel_id}');fbq('track','PageView');`
        );
    }

    // Microsoft Clarity
    if (clarity_id) {
        addInlineScript('tracking-clarity',
            `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${clarity_id}");`
        );
    }

    // Google Analytics 4
    if (ga_id) {
        addExternalScript('tracking-ga4-loader', `https://www.googletagmanager.com/gtag/js?id=${ga_id}`);
        addInlineScript('tracking-ga4-init',
            `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga_id}');`
        );
    }

    // Google Tag Manager
    if (gtm_id) {
        addInlineScript('tracking-gtm',
            `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm_id}');`
        );
    }

    // Custom script (raw HTML — parsed and re-created to ensure execution)
    if (custom_script && custom_script.trim()) {
        if (document.getElementById('tracking-custom')) return;
        const temp = document.createElement('div');
        temp.innerHTML = custom_script;
        Array.from(temp.querySelectorAll('script')).forEach((orig, i) => {
            const s = document.createElement('script');
            s.id = 'tracking-custom-' + i;
            if (orig.src) { s.src = orig.src; s.async = true; }
            else { s.textContent = orig.textContent; }
            document.head.appendChild(s);
        });
    }
}
