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

    // Smooth page transition — fade out then render then fade in
    const app = document.getElementById('app');
    const runHandler = (handler, routeParams) => {
      if (app && this._started) {
        app.style.transition = 'opacity 0.12s ease';
        app.style.opacity = '0';
        setTimeout(() => {
          handler({ ...routeParams, ...params });
          app.style.transition = 'opacity 0.18s ease';
          app.style.opacity = '1';
        }, 120);
      } else {
        handler({ ...routeParams, ...params });
      }
    };

    // Find matching route
    for (const [pattern, handler] of Object.entries(this._routes)) {
      const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/?]+)') + '$');
      const match = pathPart.match(regex);
      if (match) {
        // Extract named params
        const paramNames = [...pattern.matchAll(/:([^/]+)/g)].map(m => m[1]);
        const routeParams = {};
        paramNames.forEach((name, i) => { routeParams[name] = match[i + 1]; });
        runHandler(handler, routeParams);
        return;
      }
    }

    // Default route
    const defaultHandler = this._routes['/'] || this._routes['*'];
    if (defaultHandler) runHandler(defaultHandler, {});
  }

  start() {
    this.resolve();
    this._started = true;  // skip transition on first load
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

/**
 * Copy text to clipboard with mobile-friendly feedback:
 * vibration + toast + optional button animation.
 * @param {string} text — the text to copy
 * @param {HTMLElement} [btn] — optional button element to animate with "✅ Copiado!"
 */
export async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    // Haptic feedback on mobile
    if (navigator.vibrate) navigator.vibrate(50);
    toast('Link copiado! 🔗');
    // Animate the button
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '✅ Copiado!';
      btn.style.background = '#16a34a';
      btn.style.color = '#fff';
      setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; btn.style.color = ''; }, 1500);
    }
  } catch {
    // Fallback for devices where clipboard API is blocked
    prompt('Copie o link:', text);
  }
}

export function modal(title, bodyHtml, { onConfirm, onOpen, confirmLabel = 'Confirmar', confirmClass = 'btn-primary', cancelLabel = 'Cancelar' } = {}) {
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
  requestAnimationFrame(() => {
    m.classList.add('open');
    if (onOpen) onOpen(m);
  });

  function close() { m.classList.remove('open'); setTimeout(() => m.remove(), 250); }
  m.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', close));
  m.addEventListener('click', e => { if (e.target === m) close(); });

  // Escape key to close this specific instance
  const onEsc = (e) => {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', onEsc);
    }
  };
  document.addEventListener('keydown', onEsc);
  // Remove listener if modal is closed by buttons
  m.addEventListener('DOMNodeRemoved', () => document.removeEventListener('keydown', onEsc));

  if (onConfirm) {
    const confirmBtn = m.querySelector('[data-confirm]');
    confirmBtn.addEventListener('click', async () => {
      // Show loading state
      const origText = confirmBtn.innerHTML;
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px">
        <svg style="animation:spin 0.7s linear infinite;flex-shrink:0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        Salvando...</span>`;
      if (!document.getElementById('modal-spin-style')) {
        const s = document.createElement('style');
        s.id = 'modal-spin-style';
        s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
        document.head.appendChild(s);
      }
      try {
        const result = await onConfirm(m);
        if (result === false) {
          // Caller returned false — stay open, restore button
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = origText;
          return;
        }
        // Success flash
        confirmBtn.innerHTML = '✅ Salvo!';
        confirmBtn.style.background = '#16a34a';
        await new Promise(r => setTimeout(r, 600));
        close();
      } catch {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = origText;
      }
    });
  }
  return { close, el: m };
}

/**
 * Utility to set a button into a loading / success state outside of modals.
 * Usage:
 *   const restore = btnLoading(btn, 'Salvando...');
 *   await apiCall();
 *   restore(true); // shows ✅ and restores after 800ms
 */
export function btnLoading(btn, loadingText = 'Salvando...') {
  const origText = btn.innerHTML;
  const origDisabled = btn.disabled;
  btn.disabled = true;
  if (!document.getElementById('modal-spin-style')) {
    const s = document.createElement('style');
    s.id = 'modal-spin-style';
    s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }
  btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px">
    <svg style="animation:spin 0.7s linear infinite;flex-shrink:0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
    ${loadingText}</span>`;
  return function restore(success = true) {
    if (success) {
      btn.innerHTML = '✅ Salvo!';
      btn.style.background = '#16a34a';
      btn.style.color = 'white';
      setTimeout(() => {
        btn.innerHTML = origText;
        btn.style.background = '';
        btn.style.color = '';
        btn.disabled = origDisabled;
      }, 900);
    } else {
      btn.innerHTML = origText;
      btn.disabled = origDisabled;
    }
  };
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

  // Meta Pixel (browser-side fbq) — snippet oficial Meta injetado como inline script
  if (meta_pixel_id && String(meta_pixel_id).trim()) {
    const pixelId = String(meta_pixel_id).trim();
    if (!document.getElementById('tracking-meta-pixel')) {
      // Snippet oficial da Meta como script inline — reconhecido pelo Meta Pixel Helper
      addInlineScript('tracking-meta-pixel',
        `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?` +
        `n.callMethod.apply(n,arguments):n.queue.push(arguments)};` +
        `if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';` +
        `n.queue=[];t=b.createElement(e);t.async=!0;` +
        `t.src=v;s=b.getElementsByTagName(e)[0];` +
        `s.parentNode.insertBefore(t,s)}(window,document,'script',` +
        `'https://connect.facebook.net/en_US/fbevents.js');` +
        `fbq('init','${pixelId}');fbq('track','PageView');`
      );
      // noscript fallback
      const ns = document.createElement('noscript');
      ns.id = 'tracking-meta-pixel-ns';
      ns.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>`;
      document.head.appendChild(ns);
    }
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
    Array.from(temp.querySelectorAll('script')).forEach((orig, i) => {
      const s = document.createElement('script');
      s.id = 'tracking-custom-' + i;
      if (orig.src) { s.src = orig.src; s.async = true; }
      else { s.textContent = orig.textContent; }
      document.head.appendChild(s);
    });
  }
}

export function openClientOffcanvas(client) {
  if (!client) return;

  // Remove existing
  const existing = document.querySelector('.offcanvas-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'offcanvas-overlay';

  const cleanPhone = (client.telefone || '').replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const firstName = (client.nome || 'Cliente').split(' ')[0];
  const waMsg = encodeURIComponent(`Oi ${firstName}, tudo bem com voce?`);
  const waLink = client.telefone ? `https://wa.me/${waPhone}?text=${waMsg}` : '#';

  // Timeline placeholder (mockup for now, could be filled by actual API data)
  const pipelineDate = client.atualizado_em || client.criado_em;
  const isLost = client.pipeline_stage === 'perdido';
  const stageName = (client.pipeline_stage || 'lead_captado').replace('_', ' ').toUpperCase();

  overlay.innerHTML = `
      <div class="offcanvas" id="client-offcanvas">
        <div class="offcanvas-header">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:48px;height:48px;border-radius:50%;background:var(--green-600);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.2rem">
              ${getInitials(client.nome)}
            </div>
            <div>
              <h3 style="margin:0;font-size:1.1rem;color:var(--text-dark)">${client.nome}</h3>
              <div style="font-size:0.8rem;color:var(--text-muted);display:flex;gap:8px;margin-top:4px">
                 <span>${client.cidade || 'Sem cidade'}</span>
                 <span>•</span>
                 <span style="color:${isLost ? '#ef4444' : 'var(--green-600)'};font-weight:600">${stageName}</span>
                 ${client.indicador_nome ? `<span>•</span><span style="color:#d97706;font-weight:600;background:#fef3c7;padding:2px 6px;border-radius:4px" title="Este cliente chegou no Funil porque foi indicado.">🎁 Indicado(a) por: ${client.indicador_nome}</span>` : ''}
              </div>
            </div>
          </div>
          <button class="offcanvas-close" data-oc-close>&times;</button>
        </div>

        <div class="offcanvas-body">
          <div style="display:flex;gap:8px;margin-bottom:24px">
             ${client.telefone ? `<a href="${waLink}" target="_blank" class="btn btn-primary" style="flex:1;justify-content:center;gap:6px">💬 WhatsApp</a>` : ''}
             ${client.telefone ? `<a href="tel:${cleanPhone}" class="btn btn-secondary" style="padding:10px" title="Ligar">📞</a>` : ''}
             ${client.email ? `<a href="mailto:${client.email}" class="btn btn-secondary" style="padding:10px" title="Email">✉️</a>` : ''}
          </div>

          <div class="oc-tabs">
            <button class="oc-tab active" data-target="pane-geral">Visão Geral</button>
            <button class="oc-tab" data-target="pane-followup">Follow-up</button>
            <button class="oc-tab" data-target="pane-compras">Compras</button>
          </div>

          <!-- PANE: GERAL -->
          <div class="oc-pane active" id="pane-geral">

             <div id="anamnese-banner-oc" style="display:flex;align-items:center;justify-content:space-between;
               background:linear-gradient(135deg,#e8f5e9,#f1f8e9);border:1px solid #a5d6a7;
               border-radius:10px;padding:12px 16px;margin-bottom:18px;cursor:pointer">
               <div style="display:flex;align-items:center;gap:10px">
                 <span style="font-size:1.3rem">📋</span>
                 <div>
                   <div style="font-weight:600;color:#2d4a28;font-size:0.9rem">Ficha de Anamnese</div>
                   <div style="font-size:0.78rem;color:#4a7c40">Clique para ver todas as respostas do questionário</div>
                 </div>
               </div>
               <span style="color:#4a7c40;font-size:1.1rem">›</span>
             </div>

             <div class="form-group" style="background:#f8fafc;padding:12px;border-radius:8px;border:1px solid var(--border);margin-bottom:16px">
                <label class="field-label" style="font-size:0.75rem;margin-bottom:8px;display:block">Classificação de Atuação</label>
                <div style="display:flex;gap:12px;font-size:0.8rem">
                  <label style="display:flex;align-items:center;gap:4px;cursor:pointer">
                    <input type="radio" name="oc_tipo_cadastro" value="lead" ${!client.tipo_cadastro || client.tipo_cadastro === 'lead' ? 'checked' : ''}>
                    <span>Prospecto</span>
                  </label>
                  <label style="display:flex;align-items:center;gap:4px;cursor:pointer">
                    <input type="radio" name="oc_tipo_cadastro" value="preferencial" ${client.tipo_cadastro === 'preferencial' ? 'checked' : ''}>
                    <span>🛍️ Preferencial</span>
                  </label>
                  <label style="display:flex;align-items:center;gap:4px;cursor:pointer">
                    <input type="radio" name="oc_tipo_cadastro" value="consultora" ${client.tipo_cadastro === 'consultora' ? 'checked' : ''}>
                    <span>💼 Consultora</span>
                  </label>
                </div>
             </div>

             <div class="form-group">
               <label class="field-label" style="font-size:0.75rem;margin-bottom:4px">Telefone</label>
               <div style="color:var(--text-dark);font-weight:500;margin-bottom:12px">${client.telefone || '—'}</div>
               
               <label class="field-label" style="font-size:0.75rem;margin-bottom:4px">Email</label>
               <div style="color:var(--text-dark);font-weight:500;margin-bottom:12px">${client.email || '—'}</div>
               
               <label class="field-label" style="font-size:0.75rem;margin-bottom:4px">Nascimento / Idade</label>
               <div style="color:var(--text-dark);font-weight:500;margin-bottom:12px">${formatDate(client.data_nascimento)} ${client.data_nascimento ? `(${Math.floor((new Date() - new Date(client.data_nascimento)) / 31557600000)} anos)` : ''}</div>
               
               <label class="field-label" style="font-size:0.75rem;margin-bottom:4px">Anotações Fixadas</label>
               <div style="background:#fffbeb;padding:12px;border:1px solid #fcd34d;border-radius:6px;font-size:0.85rem;color:#b45309;white-space:pre-wrap;margin-bottom:12px">
                 ${client.notas || 'Nenhuma anotação geral sobre este cliente.'}
               </div>

               <div style="border-top:1px solid var(--border);padding-top:16px;margin-top:8px">
                 <label class="field-label" style="font-size:0.75rem;margin-bottom:4px">Status no Recrutamento (Downlines)</label>
                 ${client.recrutamento_stage
      ? `<div style="color:var(--text-dark);font-weight:600;display:inline-block;padding:4px 10px;background:#e0f2fe;color:#0369a1;border-radius:12px;font-size:0.8rem">
                        ${client.recrutamento_stage.replace(/_/g, ' ').toUpperCase()}
                      </div>`
      : `<button class="btn btn-secondary btn-sm" id="btn-add-recrutamento" style="width:100%">+ Adicionar a este cliente no Funil de Recrutamento</button>
                      <div style="font-size:0.7rem;color:var(--text-muted);margin-top:6px;text-align:center">Ativar para gerenciar ela como potencial Líder/Consultora.</div>`
    }
               </div>

               <div style="border-top:1px solid var(--border);padding-top:16px;margin-top:16px">
                 <label class="field-label" style="font-size:0.75rem;margin-bottom:8px">Dossiês e Testes Preenchidos</label>
                 <div id="oc-dossies-container" style="display:flex;flex-direction:column;gap:8px">
                    <span style="font-size:0.8rem;color:var(--text-muted)">⏳ Buscando dados...</span>
                 </div>
               </div>
             </div>
          </div>

          <!-- PANE: FOLLOW-UP -->
          <div class="oc-pane" id="pane-followup">
             ${client.motivo_perda ? `
               <div style="background:#fef2f2;border:1px solid #fecaca;padding:12px;border-radius:6px;margin-bottom:16px">
                 <div style="color:#ef4444;font-size:0.75rem;font-weight:700;margin-bottom:4px">MOTIVO DE PERDA</div>
                 <div style="color:#991b1b;font-size:0.85rem">${client.motivo_perda}</div>
               </div>
             ` : ''}

             ${client.pipeline_notas ? `
               <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:12px;border-radius:6px;margin-bottom:16px">
                 <div style="color:#16a34a;font-size:0.75rem;font-weight:700;margin-bottom:4px">ÚLTIMA NOTA DO PIPELINE</div>
                 <div style="color:#166534;font-size:0.85rem;white-space:pre-wrap">${client.pipeline_notas}</div>
               </div>
             ` : '<div style="color:var(--text-muted);font-size:0.85rem;font-style:italic">Nenhuma anotação de funil.</div>'}
             
             <div style="margin-top:24px;border-top:1px solid var(--border);padding-top:16px">
                <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px">TIMELINE (Últimos Movimentos)</div>
                <div style="display:flex;gap:12px;margin-bottom:12px">
                  <div style="width:2px;background:var(--border);margin-left:5px"></div>
                  <div>
                    <div style="width:12px;height:12px;border-radius:50%;background:var(--green-500);margin-left:-24px;margin-top:2px"></div>
                    <div style="font-size:0.8rem;color:var(--text-dark);margin-top:-14px">Movido para <b>${stageName}</b></div>
                    <div style="font-size:0.7rem;color:var(--text-muted)">${formatDate(pipelineDate, { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
                <!-- Mockup of creation date -->
                <div style="display:flex;gap:12px">
                  <div style="width:2px;background:transparent;margin-left:5px"></div>
                  <div>
                    <div style="width:12px;height:12px;border-radius:50%;background:#d1d5db;margin-left:-24px;margin-top:2px"></div>
                    <div style="font-size:0.8rem;color:var(--text-dark);margin-top:-14px">Cadastro Inicial (Lead)</div>
                    <div style="font-size:0.7rem;color:var(--text-muted)">${formatDate(client.criado_em, { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
             </div>
          </div>

          <!-- PANE: COMPRAS -->
          <div class="oc-pane" id="pane-compras">
             <div id="oc-compras-container" style="display:flex;flex-direction:column;gap:8px;">
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center;gap:12px;opacity:0.6">
                    <span style="font-size:2rem">🛒</span>
                    <div style="font-size:0.9rem;color:var(--text-dark);font-weight:600">Buscando histórico...</div>
                </div>
             </div>
          </div>

        </div>
      </div>
    `;

  document.body.appendChild(overlay);

  // Animate In
  requestAnimationFrame(() => {
    overlay.classList.add('show');
    document.getElementById('client-offcanvas').classList.add('show');
  });

  // Close logic
  function closeOC() {
    document.getElementById('client-offcanvas').classList.remove('show');
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 350);
  }

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeOC();
  });
  overlay.querySelector('[data-oc-close]').addEventListener('click', closeOC);

  // Tabs logic
  const tabs = overlay.querySelectorAll('.oc-tab');
  const panes = overlay.querySelectorAll('.oc-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      overlay.querySelector('#' + tab.dataset.target).classList.add('active');
    });
  });

  // Classificação Action (Radio buttons)
  const tipoRadios = overlay.querySelectorAll('input[name="oc_tipo_cadastro"]');
  tipoRadios.forEach(radio => {
    radio.addEventListener('change', async (e) => {
      try {
        const val = e.target.value === 'lead' ? null : e.target.value;
        const { store } = await import('./store.js');
        // Fetch current full client object to avoid overriding to null
        const atual = client;
        atual.tipo_cadastro = val;
        await store.updateClient(client.id, atual);
        toast('Classificação atualizada salvo!', 'success');

        // Disparar evento customizado pra não ter que dar reload a todo instante
        window.dispatchEvent(new Event('client-updated'));

      } catch (err) {
        toast('Erro ao mudar classificação: ' + err.message, 'error');
      }
    });
  });

  // Action: Adicionar ao Recrutamento
  const btnAddRecrutamento = overlay.querySelector('#btn-add-recrutamento');
  if (btnAddRecrutamento) {
    btnAddRecrutamento.addEventListener('click', async () => {
      try {
        btnAddRecrutamento.disabled = true;
        btnAddRecrutamento.textContent = "Adicionando...";
        // Importando o store.js dinamicamente pra evitar circular dependency se existir
        const { store } = await import('./store.js');
        await store.updateRecrutamentoStage(client.id, 'prospecto_negocio');
        toast('Cliente adicionado(a) ao Funil de Recrutamento! 🎉', 'success');
        closeOC();
        // Recarrega o app pra atualizar views por trás (Clients ou Pipeline)
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        toast('Erro ao adicionar ao recrutamento: ' + err.message, 'error');
        btnAddRecrutamento.disabled = false;
        btnAddRecrutamento.textContent = "+ Adicionar a este cliente no Funil de Recrutamento";
      }
    });
  }

  // Action: Carregar Dossiês Preenchidos
  const dossiesContainer = overlay.querySelector('#oc-dossies-container');
  if (dossiesContainer) {
    import('./store.js').then(async ({ store }) => {
      try {
        const anamneses = await store.getClientAnamneses(client.id);
        if (!anamneses || anamneses.length === 0) {
          dossiesContainer.innerHTML = '<div style="font-size:0.85rem;color:var(--text-muted);font-style:italic">Nenhum dossiê preenchido por este cliente.</div>';
          return;
        }

        dossiesContainer.innerHTML = '';
        anamneses.forEach(a => {
          const isBusiness = a.tipo === 'recrutamento' || a.subtipo === 'recrutamento';
          const title = isBusiness ? '💼 Análise de Perfil Empreendedor' : '🌿 Protocolo de Saúde (Anamnese)';
          const color = isBusiness ? '#2563eb' : '#059669';
          const bg = isBusiness ? '#eff6ff' : '#f0fdf4';
          const border = isBusiness ? '#bfdbfe' : '#bbf7d0';

          const divContainer = document.createElement('div');
          divContainer.style.cssText = `display:flex;flex-direction:column;background:${bg};border:1px solid ${border};border-radius:8px;margin-bottom:8px;overflow:hidden`;

          const headerDiv = document.createElement('div');
          headerDiv.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:10px 12px;cursor:pointer;color:${color}`;
          headerDiv.innerHTML = `<span style="font-weight:600;font-size:0.85rem">${title}</span> <span style="font-size:0.7rem;color:#64748b;font-weight:500;background:rgba(255,255,255,0.8);padding:2px 6px;border-radius:4px">${formatDate(a.criado_em)}</span>`;

          const actionsDiv = document.createElement('div');
          actionsDiv.style.cssText = `display:flex;border-top:1px solid ${border};`;

          const btnOpen = document.createElement('button');
          btnOpen.className = 'btn';
          btnOpen.style.cssText = `flex:1;background:transparent;color:${color};border:none;border-right:1px solid ${border};border-radius:0;font-size:0.75rem;padding:8px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px`;
          btnOpen.innerHTML = `<span>📑 Abrir PDF </span>`;
          btnOpen.onclick = async () => {
             // Lógica legada para abrir o PDF na tela da Consultora
             const freshAnamneses = await import('./store.js').then(m => m.store.getClientAnamneses(client.id)).catch(() => []);
             const freshA = freshAnamneses.find(x => x.id === a.id) || a;
             const { auth } = await import('./store.js');
             const consultantObj = auth.current;
             const rawPayload = JSON.stringify({
                 answers: freshA.dados || {},
                 protocolo_customizado: freshA.protocolo_customizado,
                 consultant: { 
                     name: consultantObj?.nome || consultantObj?.name, 
                     slug: consultantObj?.slug, 
                     phone: consultantObj?.telefone || consultantObj?.phone, 
                     genero: consultantObj?.genero 
                 },
                 clientName: client.nome || 'Cliente',
                 clientId: client.id
             });
             sessionStorage.setItem('tempAnamnesisPayload', rawPayload);
             const route = isBusiness ? '#/business-report' : '#/protocolo';
             window.open(window.location.origin + window.location.pathname + route, '_blank');
          };

          const btnLink = document.createElement('button');
          btnLink.className = 'btn';
          btnLink.style.cssText = `flex:1;background:transparent;color:#0ea5e9;border:none;border-radius:0;font-size:0.75rem;padding:8px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px`;
          btnLink.innerHTML = `<span>🔗 Mágico Cliente </span>`;
          btnLink.onclick = async () => {
             const origText = btnLink.innerHTML;
             btnLink.innerHTML = '<span>⏳ Gerando...</span>';
             try {
                const { api } = await import('./store.js');
                const res = await api('POST', '/api/anamneses/' + a.id + '/hash');

                const magicUrl = window.location.origin + window.location.pathname + '#/laudo/' + res.hash;
                await navigator.clipboard.writeText(magicUrl);
                
                toast('Link Mágico copiado! Envie para o paciente.', 'success');
                btnLink.innerHTML = '<span style="color:#10b981">✅ Copiado!</span>';
             } catch(err) {
                toast(err.message, 'error');
                btnLink.innerHTML = '<span style="color:#ef4444">❌ Erro</span>';
             }
             setTimeout(() => btnLink.innerHTML = origText, 3000);
          };

          actionsDiv.appendChild(btnOpen);
          actionsDiv.appendChild(btnLink);
          
          headerDiv.onclick = btnOpen.onclick;

          divContainer.appendChild(headerDiv);
          divContainer.appendChild(actionsDiv);
          
          dossiesContainer.appendChild(divContainer);
        });
      } catch (err) {
        console.error("Erro ao buscar docs", err);
        dossiesContainer.innerHTML = '<div style="font-size:0.8rem;color:#ef4444">Falha ao buscar dossiês.</div>';
      }
    });
  }

  // Action: Carregar Histórico de Compras (mesclando por email)
  const comprasContainer = overlay.querySelector('#oc-compras-container');
  if (comprasContainer) {
    import('./store.js').then(async ({ store, auth }) => {
      try {
        const allClients = await store.getClients().catch(() => []);
        const targetEmail = (client.email || '').trim().toLowerCase();

        // Acha todos os IDs de cliente que compartilham o mesmo email (ou ID)
        const matchedIds = allClients
          .filter(c => c.id === client.id || (targetEmail && (c.email || '').trim().toLowerCase() === targetEmail))
          .map(c => c.id);

        const uid = auth.current?.id || 'anon';
        const k = `se_purchases_${uid}`;
        const dbPurchases = JSON.parse(localStorage.getItem(k) || '[]');

        const myPurchases = dbPurchases
          .filter(p => matchedIds.includes(p.clientId))
          .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

        if (myPurchases.length === 0) {
          comprasContainer.innerHTML = `
             <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center;gap:12px;opacity:0.6">
                <span style="font-size:2rem">🛒</span>
                <div style="font-size:0.9rem;color:var(--text-dark);font-weight:600">Nenhuma compra importada</div>
             </div>`;
          return;
        }

        const totalSpent = myPurchases.reduce((acc, p) => acc + (Number(p.value) || 0), 0);

        comprasContainer.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;background:#f0fdf4;padding:12px;border-radius:8px;border:1px solid #bbf7d0;margin-bottom:12px">
            <span style="font-size:0.8rem;color:#166534;font-weight:600">TOTAL INVESTIDO (LTV)</span>
            <span style="font-size:1.1rem;color:#15803d;font-weight:700">${formatCurrency(totalSpent)}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${myPurchases.map(p => `
              <div style="background:#fff;border:1px solid var(--border);padding:10px;border-radius:8px">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                  <span style="font-weight:600;font-size:0.85rem;color:var(--text-dark)">${p.product || 'Produto sem nome'}</span>
                  <span style="font-weight:700;font-size:0.85rem;color:var(--green-600)">${formatCurrency(p.value)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-size:0.75rem;color:var(--text-muted)">${formatDate(p.date || p.createdAt)}</span>
                  ${p.note ? `<span style="font-size:0.75rem;color:#8b5cf6;background:#f5f3ff;padding:2px 8px;border-radius:12px">${p.note}</span>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;

      } catch (err) {
        console.error("Erro ao buscar compras", err);
        comprasContainer.innerHTML = '<div style="font-size:0.8rem;color:#ef4444">Falha ao buscar compras.</div>';
      }
    });
  }

  // Action: Open Anamnese
  const bannerOc = overlay.querySelector('#anamnese-banner-oc');
  if (bannerOc) {
    bannerOc.addEventListener('click', async () => {
      // 1. Checar rapidamente se tem anamnese antes de forçar o fechamento e disparo
      try {
        const { store } = await import('./store.js');
        const anamneses = await store.getClientAnamneses(client.id).catch(() => []);
        
        if (!anamneses || anamneses.length === 0) {
          toast(`⚠️ ${client.nome || 'Este contato'} ainda não finalizou de preencher o formulário.`, 'warning');
          return; // Aborta e mantém a ficha aberta
        }
      } catch (e) {
         // ignorar e tentar abrir
      }
      
      closeOC();
      document.dispatchEvent(new CustomEvent('open-anamnese', { detail: { client } }));
    });
  }
}

// ── Global Keyboard Shortcuts ────────────────────────────────
export function setupGlobalShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Only capture if not typing in an input/textarea
    const isEditing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable;

    // Search: Cmd+K or Ctrl+K
    if ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === 'k') {
      e.preventDefault();
      const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="Buscar"]');
      if (searchInputs.length > 0) {
        // Focus the first search input visible
        const inp = Array.from(searchInputs).find(el => el.offsetParent !== null);
        if (inp) {
          inp.focus();
          // Select current text if any
          if (inp.value) inp.select();
        } else {
          // No visible search input on screen, navigate to clients then focus
          window.location.hash = '#/clients';
          setTimeout(() => {
            const newInputs = document.querySelectorAll('input[type="search"], input[placeholder*="Buscar"]');
            const newInp = Array.from(newInputs).find(el => el.offsetParent !== null);
            if (newInp) newInp.focus();
          }, 150);
        }
      } else {
        window.location.hash = '#/clients';
      }
      return;
    }

    // New Client: 'N' key (only if not typing anything else)
    if (!isEditing && !e.metaKey && !e.ctrlKey && !e.altKey && String(e.key).toLowerCase() === 'n') {
      e.preventDefault();
      if (typeof window.dashboardAddClient === 'function') {
        window.dashboardAddClient();
      } else {
        window.location.hash = '#/clients';
        setTimeout(() => {
          const btn = document.getElementById('btn-add-client');
          if (btn) btn.click();
        }, 150);
      }
    }
  });
}

export const ARCHETYPE_THEMES = {
  'curadora': {
    id: 'curadora',
    name: 'Curadora Natural',
    desc: 'Confiança, Saúde e Bem-Estar',
    primary: '#16a34a',
    bg: 'linear-gradient(135deg, #06120b 0%, #0a1711 50%, #12291d 100%)',
    cardBorder: 'rgba(22, 163, 74, 0.4)',
    icon: '🌿'
  },
  'visionaria': {
    id: 'visionaria',
    name: 'Visionária Elevada',
    desc: 'Intuição, Calma e Foco',
    primary: '#a855f7',
    bg: 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #3b0764 100%)',
    cardBorder: 'rgba(168, 85, 247, 0.4)',
    icon: '🔮'
  },
  'maternal': {
    id: 'maternal',
    name: 'Maternal Acolhedora',
    desc: 'Cuidado, Afeto e Conexão',
    primary: '#ec4899',
    bg: 'linear-gradient(135deg, #4c0519 0%, #831843 50%, #9d174d 100%)',
    cardBorder: 'rgba(236, 72, 153, 0.4)',
    icon: '💗'
  },
  'sabia': {
    id: 'sabia',
    name: 'Sábia & Serena',
    desc: 'Clareza, Paz e Frescor',
    primary: '#0ea5e9',
    bg: 'linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #075985 100%)',
    cardBorder: 'rgba(14, 165, 233, 0.4)',
    icon: '🌊'
  },
  'magnetica': {
    id: 'magnetica',
    name: 'Essência Magnética',
    desc: 'Energia, Ação e Alegria',
    primary: '#ea580c',
    bg: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #92400e 100%)',
    cardBorder: 'rgba(234, 88, 12, 0.4)',
    icon: '✨'
  }
};
