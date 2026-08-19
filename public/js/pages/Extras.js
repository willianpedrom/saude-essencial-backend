import { auth, store } from '../store.js?v=1010';
import { OILS_DATABASE } from '../oils.js?v=1010';
import { renderLayout } from './Dashboard.js?v=1012';
import { formatDate, formatCurrency, toast, modal, copyToClipboard } from '../utils.js?v=1010';
import { DOTERRA_PRODUCTS, DOTERRA_PRICES } from './Inventory.js?v=1010';

// Helper to remove accents for better searching
function normalize(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// LocalStorage helper for features without backend endpoints
function ls(key) {
  const uid = auth.current?.id || 'anon';
  const k = `se_${key}_${uid}`;
  return {
    get() { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } },
    set(list) { localStorage.setItem(k, JSON.stringify(list)); },
    add(item) { const l = this.get(); l.push({ id: Date.now().toString(), createdAt: new Date().toISOString(), ...item }); this.set(l); return l; },
    update(id, patch) { const l = this.get().map(x => x.id === id ? { ...x, ...patch } : x); this.set(l); return l; },
    del(id) { const l = this.get().filter(x => x.id !== id); this.set(l); return l; }
  };
}

// ═══════════════ DEPOIMENTOS ═══════════════
export async function renderTestimonials(router) {
  renderLayout(router, 'Depoimentos & Testemunhos',
    `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando...</div>`,
    'testimonials');

  try {
    const [clients, testimonials, tags, linkData] = await Promise.all([
      store.getClients().catch(() => []),
      store.getTestimonials().catch(() => []),
      store.getTags().catch(() => []),
      store.getTestimonialLink().catch(() => ({ slug: '' }))
    ]);

    let activeTagFilter = null;
    let localTestimonials = [...testimonials];
    let localTags = [...tags];

    const publicUrl = linkData.slug ? `${window.location.origin}/#/depoimento/${linkData.slug}` : '';

    function renderView() {
      const pc = document.getElementById('page-content');
      if (!pc) return;

      const filtered = activeTagFilter
        ? localTestimonials.filter(t => t.etiquetas?.some(e => e.id === activeTagFilter))
        : localTestimonials;

      // ── Stats ──
      const promoters = localTestimonials.filter(t => t.nota >= 9).length;
      const avgNps = localTestimonials.length
        ? (localTestimonials.reduce((s, t) => s + (t.nota || 0), 0) / localTestimonials.length).toFixed(1)
        : '—';
      const approved = localTestimonials.filter(t => t.aprovado).length;

      // Avatar background palette
      const colors = ['#7c3aed', '#0891b2', '#059669', '#b45309', '#be185d', '#4f46e5', '#0284c7', '#16a34a'];
      const avatarColor = (name) => colors[(name?.charCodeAt(0) || 0) % colors.length];

      // Stars renderer
      const stars = (nota) => {
        const n = Math.round((nota / 10) * 5);
        return Array.from({ length: 5 }, (_, i) =>
          `<span style="color:${i < n ? '#f59e0b' : '#e5e7eb'};font-size:0.9rem">★</span>`
        ).join('');
      };

      pc.innerHTML = `
        <!-- Header clean: Link de Depoimentos -->
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 20px;margin-bottom:16px;
                    display:flex;align-items:center;gap:16px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
            <div style="width:34px;height:34px;border-radius:8px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:1.1rem">🔗</div>
            <div>
              <div style="font-size:0.72rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Link Público</div>
              <div style="font-size:0.78rem;color:#64748b;line-height:1.2">Compartilhe para coletar avaliações</div>
            </div>
          </div>
          <div style="flex:1;min-width:220px;display:flex;gap:8px">
            <input type="text" readonly value="${publicUrl}"
              style="flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;
                     padding:8px 12px;color:#334155;font-size:0.82rem;outline:none;cursor:text" />
            <button class="btn btn-primary" id="btn-copy-public-link"
              style="background:#16a34a;border-color:#16a34a;white-space:nowrap;font-weight:600;font-size:0.83rem;padding:8px 14px">
              📋 Copiar
            </button>
          </div>
          <div style="height:36px;width:1px;background:#e2e8f0;flex-shrink:0"></div>
          <!-- Tags inline -->
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:1;min-width:180px">
            <span style="font-size:0.72rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap">🏷️ Etiquetas:</span>
            ${localTags.map(tag => `
              <span style="background:${tag.cor}12;border:1px solid ${tag.cor}40;color:${tag.cor};
                           padding:4px 10px;border-radius:20px;font-size:0.76rem;font-weight:600;
                           display:inline-flex;align-items:center;gap:5px">
                ${tag.nome}
                <button data-deltag="${tag.id}" style="background:none;border:none;color:${tag.cor};cursor:pointer;
                        padding:0;font-size:0.9rem;line-height:1;opacity:0.6;margin-top:-1px" title="Remover">×</button>
              </span>
            `).join('')}
            ${localTags.length === 0 ? '<span style="color:#cbd5e1;font-size:0.78rem;font-style:italic">Nenhuma</span>' : ''}
            <button class="btn btn-secondary btn-sm" id="btn-add-tag"
              style="font-size:0.76rem;padding:4px 10px;height:auto;border-style:dashed">
              + Nova
            </button>
          </div>
        </div>

        <!-- Stats Bar -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px">
          ${[
          { icon: '⭐', label: 'Total', value: localTestimonials.length, color: '#7c3aed', bg: '#f5f3ff' },
          { icon: '🔥', label: 'Promotores', value: promoters, color: '#16a34a', bg: '#f0fdf4' },
          { icon: '📊', label: 'NPS Médio', value: avgNps, color: '#0891b2', bg: '#ecfeff' },
          { icon: '🌐', label: 'Exibidos na Página', value: approved, color: '#d97706', bg: '#fffbeb' },
        ].map(s => `
            <div style="background:${s.bg};border-radius:12px;padding:14px 16px;border:1px solid ${s.color}22">
              <div style="font-size:1.3rem;margin-bottom:4px">${s.icon}</div>
              <div style="font-size:1.5rem;font-weight:800;color:${s.color};line-height:1">${s.value}</div>
              <div style="font-size:0.75rem;color:#64748b;font-weight:500;margin-top:3px">${s.label}</div>
            </div>
          `).join('')}
        </div>

        <!-- Filter Bar -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px">
          <div style="display:flex;gap:7px;align-items:center;overflow-x:auto;padding-bottom:2px">
            <span style="font-size:0.75rem;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap">
              Filtrar:
            </span>
            <button class="btn btn-sm ${activeTagFilter === null ? 'btn-primary' : 'btn-secondary'}" data-filtertag="null">
              Todos (${localTestimonials.length})
            </button>
            ${localTags.map(tag => `
              <button class="btn btn-sm" data-filtertag="${tag.id}"
                style="${activeTagFilter === tag.id
            ? `background:${tag.cor};border-color:${tag.cor};color:#fff`
            : `color:${tag.cor};border-color:${tag.cor}40;background:${tag.cor}10`}">
                ${tag.nome} (${localTestimonials.filter(t => t.etiquetas?.some(e => e.id === tag.id)).length})
              </button>
            `).join('')}
          </div>
          <button class="btn btn-secondary" id="btn-add-t" style="white-space:nowrap;font-weight:600">
            ✍️ Depoimento Manual
          </button>
        </div>

        <!-- Cards Grid -->
        <div id="testimonials-list">
          ${filtered.length === 0
          ? `<div class="empty-state">
                <div class="empty-state-icon">⭐</div>
                <h4>Nenhum depoimento encontrado</h4>
                <p>Mande seu link para as clientes ou filtre por outra etiqueta.</p>
               </div>`
          : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:16px">
                ${filtered.map(t => {
            const isPromoter = t.nota >= 9;
            const isDetractor = t.nota <= 6;
            const npsColor = isPromoter ? '#16a34a' : isDetractor ? '#ef4444' : '#f59e0b';
            const npsBg = isPromoter ? '#f0fdf4' : isDetractor ? '#fef2f2' : '#fffbeb';
            const initials = (t.cliente_nome || 'C').substring(0, 2).toUpperCase();
            const bgColor = avatarColor(t.cliente_nome);

            return `
                    <div style="background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,0.07);
                                overflow:hidden;display:flex;flex-direction:column;
                                border:1px solid ${t.aprovado ? '#bbf7d0' : '#fde68a'}; transition:box-shadow 0.2s"
                         onmouseover="this.style.boxShadow='0 6px 24px rgba(0,0,0,0.12)'"
                         onmouseout="this.style.boxShadow='0 2px 12px rgba(0,0,0,0.07)'">

                      <!-- Card Header -->
                      <div style="padding:16px 18px;display:flex;justify-content:space-between;align-items:flex-start;
                                  border-bottom:1px solid #f1f5f9">
                        <div style="display:flex;align-items:center;gap:12px">
                          <div style="width:44px;height:44px;border-radius:50%;background:${bgColor};
                                      color:#fff;font-weight:800;font-size:0.95rem;display:flex;align-items:center;
                                      justify-content:center;flex-shrink:0;letter-spacing:0.5px">
                            ${initials}
                          </div>
                          <div>
                            <div style="font-weight:700;color:#1e293b;font-size:0.95rem">${t.cliente_nome}</div>
                            <div style="font-size:0.78rem;color:#94a3b8;margin-top:1px">
                              ${t.origem === 'link' ? '🔗 Link Público' : '✍️ Manual'} · ${formatDate(t.criado_em)}
                            </div>
                            ${t.cliente_email ? `<div style="font-size:0.77rem;color:#94a3b8">${t.cliente_email}</div>` : ''}
                          </div>
                        </div>
                        <div style="text-align:right;flex-shrink:0">
                          <div style="background:${npsBg};color:${npsColor};font-weight:800;font-size:0.9rem;
                                      padding:5px 12px;border-radius:20px;white-space:nowrap">
                            ${t.nota}/10 ${isPromoter ? '🔥' : isDetractor ? '⚠️' : '👌'}
                          </div>
                          <div style="margin-top:5px">${stars(t.nota)}</div>
                        </div>
                      </div>

                      <!-- Quote Body -->
                      <div style="padding:16px 18px;flex:1;position:relative">
                        <span style="position:absolute;top:10px;left:12px;font-size:2.5rem;color:#e2e8f0;
                                     line-height:1;font-family:Georgia,serif;pointer-events:none">"</span>
                        <p style="font-size:0.92rem;line-height:1.65;color:#334155;
                                  padding:8px 8px 0 24px;margin:0;font-style:italic">
                          ${t.texto}
                        </p>
                      </div>

                      <!-- Card Footer -->
                      <div style="padding:12px 18px;background:#f8fafc;border-top:1px solid #f1f5f9;
                                  display:flex;justify-content:space-between;align-items:center;gap:8px">
                        <div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;flex:1">
                          ${(t.etiquetas || []).map(e =>
              `<span style="background:${e.cor}18;color:${e.cor};border:1px solid ${e.cor}40;
                                         padding:3px 8px;border-radius:12px;font-size:0.72rem;font-weight:600">
                              ${e.nome}
                            </span>`).join('')}
                          <button class="btn btn-secondary btn-sm" data-assign="${t.id}"
                            style="padding:3px 8px;height:auto;font-size:0.72rem;line-height:1.4" title="Gerenciar etiquetas">
                            🏷️
                          </button>
                        </div>
                        <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
                          <div style="display:flex;background:#f1f5f9;border-radius:8px;padding:2px;gap:2px;border:1px solid #e2e8f0;flex-shrink:0">
                            <button class="btn-toggle-visibility" data-id="${t.id}" data-value="true" 
                              style="border:none;padding:5px 10px;font-size:0.72rem;border-radius:6px;font-weight:700;cursor:pointer;transition:all 0.2s;
                              ${t.aprovado ? 'background:#16a34a;color:#fff;box-shadow:0 2px 4px rgba(22,163,74,0.2)' : 'background:transparent;color:#64748b'}">
                              Exibir
                            </button>
                            <button class="btn-toggle-visibility" data-id="${t.id}" data-value="false" 
                              style="border:none;padding:5px 10px;font-size:0.72rem;border-radius:6px;font-weight:700;cursor:pointer;transition:all 0.2s;
                              ${!t.aprovado ? 'background:#64748b;color:#fff' : 'background:transparent;color:#64748b'}">
                              Ocultar
                            </button>
                          </div>
                          
                          <select class="btn btn-sm type-selector" data-id="${t.id}" style="background:#f8fafc;border:1px solid #cbd5e1;padding:4px 8px;font-size:0.7rem;border-radius:6px;outline:none;cursor:pointer">
                            <option value="cliente" ${!t.tipo || t.tipo === 'cliente' ? 'selected' : ''}>Público: Clientes</option>
                            <option value="lideranca" ${t.tipo === 'lideranca' ? 'selected' : ''}>Público: Equipe</option>
                          </select>

                          <button class="btn btn-danger btn-sm" data-delete="${t.id}"
                            style="padding:5px 8px;font-size:0.8rem" title="Apagar">🗑️</button>
                        </div>
                      </div>

                      ${!t.consentimento
                ? `<div style="padding:6px 18px;background:#fef2f2;border-top:1px solid #fecaca;
                                      font-size:0.73rem;color:#b91c1c;font-weight:500">
                            ⚠️ Cliente não autorizou o uso público desta prova social.
                          </div>`
                : ''}
                    </div>`;
          }).join('')}
              </div>`}
        </div>`;

      bindEvents();
    }


    function bindEvents() {
      // Copy Public Link
      document.getElementById('btn-copy-public-link')?.addEventListener('click', async (e) => {
        await copyToClipboard(publicUrl, e.currentTarget);
      });

      // Tags Toggle
      document.querySelectorAll('[data-filtertag]').forEach(btn => {
        btn.addEventListener('click', () => {
          const val = btn.dataset.filtertag;
          activeTagFilter = val === "null" ? null : val;
          renderView();
        });
      });

      // Type Selector
      document.querySelectorAll('.type-selector').forEach(sel => {
        sel.addEventListener('change', async (e) => {
          const id = e.target.dataset.id;
          const novoTipo = e.target.value;
          e.target.disabled = true;
          try {
            await store.setTestimonialType(id, novoTipo);
            localTestimonials = localTestimonials.map(t => String(t.id) === String(id) ? { ...t, tipo: novoTipo } : t);
            toast('Categoria alterada com sucesso! ✅');
          } catch (err) {
            toast(err.message, 'error');
            e.target.value = novoTipo === 'cliente' ? 'lideranca' : 'cliente'; // revert
          } finally {
            e.target.disabled = false;
          }
        });
      });

      // Visibility Toggle (Show/Hide)
      document.querySelectorAll('.btn-toggle-visibility').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const value = btn.dataset.value === 'true';
          const t = localTestimonials.find(x => String(x.id) === String(id));
          if (!t || t.aprovado === value) return;

          btn.disabled = true;
          try {
            await store.approveTestimonial(id, value);
            t.aprovado = value;
            toast(value ? 'Depoimento exibido na página pública! ✅' : 'Depoimento ocultado da página pública. 👁️‍🗨️');
            renderView();
          } catch (e) {
            toast(e.message || 'Erro ao alterar visibilidade.', 'error');
            btn.disabled = false;
          }
        });
      });

      // Assign Tags
      document.querySelectorAll('[data-assign]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.assign;
          const t = localTestimonials.find(x => x.id === id);
          const activeIds = (t.etiquetas || []).map(x => x.id);

          modal('Gerenciar Etiquetas', `
            <p style="margin-bottom:12px;font-size:0.9rem">Selecione quais temas se aplicam a este depoimento (ex: problema que foi resolvido):</p>
            <div style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto">
              ${localTags.map(tag => `
                <label style="display:flex;align-items:center;gap:10px;padding:8px;border:1px solid var(--border);border-radius:8px;cursor:pointer">
                  <input type="checkbox" class="tag-check" value="${tag.id}" ${activeIds.includes(tag.id) ? 'checked' : ''} style="width:18px;height:18px;accent-color:${tag.cor}" />
                  <span style="font-weight:600;color:${tag.cor}">${tag.nome}</span>
                </label>
              `).join('')}
              ${localTags.length === 0 ? '<p class="text-muted">Você ainda não criou nenhuma etiqueta no topo da página.</p>' : ''}
            </div>
          `, {
            confirmLabel: 'Salvar',
            onConfirm: async () => {
              const checked = Array.from(document.querySelectorAll('.tag-check:checked')).map(cb => cb.value);
              try {
                await store.setTestimonialTags(id, checked);
                t.etiquetas = localTags.filter(tg => checked.includes(tg.id));
                renderView(); toast('Etiquetas salvas!');
              } catch (e) { toast(e.message, 'error'); return false; }
            }
          });
        });
      });

      // Delete Testimonial
      document.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.delete;
          modal('Apagar Depoimento', '<p>Tem certeza que deseja apagar este depoimento do sistema? Esta ação é irreversível.</p>', {
            danger: true, confirmLabel: 'Apagar',
            onConfirm: async () => {
              try {
                await store.deleteTestimonial(id);
                localTestimonials = localTestimonials.filter(x => x.id !== id);
                renderView(); toast('Depoimento apagado.');
              } catch (e) { toast(e.message, 'error'); return false; }
            }
          });
        });
      });

      // Create Tag
      document.getElementById('btn-add-tag')?.addEventListener('click', () => {
        modal('Nova Etiqueta', `
          <div class="form-group">
            <label class="field-label">Problema / Benefício</label>
            <input class="field-input" id="new-tag-name" placeholder="Ex: Emagrecimento, Dor Crônica..." />
          </div>
          <div class="form-group">
            <label class="field-label">Cor Visual</label>
            <input type="color" id="new-tag-color" value="#059669" style="width:100%;height:40px;border:none;border-radius:8px;cursor:pointer;padding:0" />
          </div>
        `, {
          confirmLabel: 'Criar Etiqueta',
          onConfirm: async () => {
            const nome = document.getElementById('new-tag-name').value.trim();
            const cor = document.getElementById('new-tag-color').value;
            if (!nome) { toast('O nome é obrigatório.', 'error'); return false; }
            try {
              const res = await store.addTag({ nome, cor });
              localTags.push(res);
              renderView(); toast('Etiqueta criada! 🏷️');
            } catch (e) { toast(e.message, 'error'); return false; }
          }
        });
      });

      // Delete Tag
      document.querySelectorAll('[data-deltag]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.deltag;
          modal('Apagar Etiqueta', '<p>Deseja apagar esta etiqueta? Ela será removida de todos os depoimentos vinculados.</p>', {
            danger: true, confirmLabel: 'Apagar',
            onConfirm: async () => {
              try {
                await store.deleteTag(id);
                localTags = localTags.filter(x => x.id !== id);
                // Also remove it from local cached testimonials immediately
                localTestimonials.forEach(t => {
                  if (t.etiquetas) t.etiquetas = t.etiquetas.filter(e => e.id !== id);
                });
                if (activeTagFilter === id) activeTagFilter = null;
                renderView(); toast('Etiqueta removida.');
              } catch (e) { toast(e.message, 'error'); return false; }
            }
          });
        });
      });

      // Manual Add
      document.getElementById('btn-add-t')?.addEventListener('click', () => {
        modal('Registrar Depoimento Manual', `
          <div class="form-grid">
            <div class="form-group form-field-full">
              <label class="field-label">Nome da Cliente *</label>
              <input class="field-input" id="m-nome" placeholder="Nome" />
            </div>
            <div class="form-group form-field-full">
              <label class="field-label">Anotação NPS (0 a 10) *</label>
              <input class="field-input" id="m-nota" type="number" min="0" max="10" placeholder="10" />
            </div>
            <div class="form-group form-field-full">
              <label class="field-label">Depoimento *</label>
              <textarea class="field-textarea" id="m-texto" placeholder="A cliente relatou que..."></textarea>
            </div>
          </div>`, {
          confirmLabel: 'Salvar',
          onConfirm: async () => {
            const cliente_nome = document.getElementById('m-nome').value.trim();
            const texto = document.getElementById('m-texto').value.trim();
            const nota = parseInt(document.getElementById('m-nota').value) || 10;
            if (!cliente_nome || !texto) { toast('Preencha os campos obrigatórios', 'error'); return false; }

            try {
              const res = await store.addTestimonial({ cliente_nome, texto, nota, consentimento: true }); // manual implies you got consent
              localTestimonials.unshift(res);
              renderView(); toast('Registrado! ⭐');
              return true;
            } catch (e) { toast(e.message, 'error'); return false; }
          }
        });
      });
    }

    renderView();

  } catch (err) {
    const pc = document.getElementById('page-content');
    if (pc) pc.innerHTML = `<div class="empty-state">Erro ao carregar dados: ${err.message}</div>`;
  }
}

// ═══════════════ COMPRAS ═══════════════
export async function renderPurchases(router) {
  renderLayout(router, 'Histórico de Vendas',
    `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando...</div>`,
    'purchases');

  const [clients, purchases, estoque] = await Promise.all([
    store.getClients().catch(() => []),
    store.getCompras().catch(() => []),
    store.getEstoque().catch(() => [])
  ]);

  // Pre-generate product catalog for instant search
  const productCatalog = [];
  try {
    // 1. Do estoque do usuário
    if (Array.isArray(estoque)) {
      estoque.forEach(it => {
        if (!it.nome_produto) return;
        const name = it.nome_produto;
        const size = it.ml_tamanho || '';
        const fullName = `${name}${size ? ' ('+size+')' : ''}`;
        productCatalog.push({
          name: fullName,
          price: Number(it.preco_venda || it.preco_custo || 0),
          source: 'estoque',
          search: normalize(name + ' ' + size)
        });
      });
    }
    // 2. Da base global doTERRA
    if (typeof OILS_DATABASE === 'object' && OILS_DATABASE !== null) {
      Object.entries(OILS_DATABASE).forEach(([name, data]) => {
        if (!data) return;
        const nameEn = data.nameEn || '';
        const sizes = Array.isArray(data.sizes) ? data.sizes : [];
        
        if (sizes.length > 0) {
          sizes.forEach(s => {
            const fullName = `${name} (${s.size})`;
            if (!productCatalog.find(c => c.name === fullName)) {
              productCatalog.push({
                name: fullName,
                price: Number(s.member || s.regular || 0),
                source: 'doterra',
                search: normalize(name + ' ' + nameEn + ' ' + s.size)
              });
            }
          });
        } else {
          if (!productCatalog.find(c => c.name === name)) {
            productCatalog.push({
              name: name,
              price: 0,
              source: 'doterra',
              search: normalize(name + ' ' + nameEn)
            });
          }
        }
      });
    }
    // 3. Da base global de autocompletar do estoque (DOTERRA_PRODUCTS)
    if (typeof DOTERRA_PRODUCTS !== 'undefined' && Array.isArray(DOTERRA_PRODUCTS)) {
      DOTERRA_PRODUCTS.forEach(p => {
        if (!p.nome) return;
        const name = p.nome;
        const cat = p.cat || '';
        
        // Find if this product has defined prices/sizes in DOTERRA_PRICES
        let priceEntry = typeof DOTERRA_PRICES !== 'undefined' ? DOTERRA_PRICES[name] : null;
        if (!priceEntry && typeof DOTERRA_PRICES !== 'undefined') {
          // Try case-insensitive
          const lower = name.toLowerCase();
          for (const key of Object.keys(DOTERRA_PRICES)) {
            if (key.toLowerCase() === lower) {
              priceEntry = DOTERRA_PRICES[key];
              break;
            }
          }
        }
        
        // If still not found, try stripping parentheses
        if (!priceEntry && typeof DOTERRA_PRICES !== 'undefined') {
          const lower = name.toLowerCase();
          const stripped = lower.replace(/\s*\(.*?\)\s*/g, '').trim();
          for (const key of Object.keys(DOTERRA_PRICES)) {
            const kl = key.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();
            if (kl === stripped || kl.startsWith(lower) || lower.startsWith(kl) || kl.includes(lower) || lower.includes(kl)) {
              priceEntry = DOTERRA_PRICES[key];
              break;
            }
          }
        }
        
        if (priceEntry) {
          // If we found price sizes, add them
          Object.entries(priceEntry).forEach(([size, prices]) => {
            const fullName = `${name}${size ? ' ('+size+')' : ''}`;
            if (!productCatalog.find(c => c.name === fullName)) {
              productCatalog.push({
                name: fullName,
                price: Number(prices.m || prices.r || 0),
                source: 'doterra',
                search: normalize(name + ' ' + size)
              });
            }
          });
        } else {
          // Fallback if no prices found: determine default size
          const size = cat.includes('Touch') ? '10ml Touch'
              : ['Difusor','Kit','Personal Care','Acessório'].includes(cat) ? 'Unidade / Kit'
              : ['Suplemento'].includes(cat) ? 'Cápsulas'
              : '15ml';
          const fullName = `${name}${size ? ' ('+size+')' : ''}`;
          if (!productCatalog.find(c => c.name === fullName)) {
            productCatalog.push({
              name: fullName,
              price: 0,
              source: 'doterra',
              search: normalize(name + ' ' + size)
            });
          }
        }
      });
    }
  } catch (err) { 
    console.error("Erro crítico ao gerar catálogo:", err);
  }

  // Ensure we always have at least some items to avoid empty UI
  if (productCatalog.length === 0) {
    productCatalog.push({ name: 'Lavanda (15 ml)', price: 148, source: 'doterra', search: 'lavanda' });
    productCatalog.push({ name: 'Lemon (15 ml)', price: 69, source: 'doterra', search: 'lemon' });
    productCatalog.push({ name: 'Peppermint (15 ml)', price: 133, source: 'doterra', search: 'peppermint' });
  }

  let localPurchases = [...purchases];
  let activeProductFilter = '';

  function renderList() {
    // Unique products for datalist
    const uniqueProducts = [...new Set(localPurchases.map(p => p.produto))].sort();
    const datalist = document.getElementById('products-datalist');
    if (datalist) {
      datalist.innerHTML = uniqueProducts.map(p => `<option value="${p}">`).join('');
    }

    const filtered = activeProductFilter 
      ? localPurchases.filter(p => normalize(p.produto).includes(normalize(activeProductFilter)))
      : localPurchases;

    const sorted = [...filtered].sort((a, b) => new Date(b.data || b.criado_em) - new Date(a.data || a.criado_em));
    const total = sorted.reduce((s, p) => s + (Number(p.valor) || 0), 0);

    const container = document.getElementById('purchases-list');
    if (!container) return;
    const totalEl = document.getElementById('total-revenue');
    if (totalEl) totalEl.textContent = formatCurrency(total);

    // Summary of clients when filtering
    let summaryHtml = '';
    let filteredClientsList = [];
    if (activeProductFilter && sorted.length > 0) {
      const uniqueClientIds = [...new Set(sorted.map(p => p.cliente_id))];
      filteredClientsList = uniqueClientIds.map(id => {
        const c = clients.find(cl => cl.id === id);
        const count = sorted.filter(p => p.cliente_id === id).length;
        return { ...c, purchaseCount: count };
      }).filter(c => c && (c.nome || c.name));

      // Extract product base name (without size) for OILS_DATABASE lookup
      const productBaseName = activeProductFilter.replace(/\s*\(.*?\)\s*/g, '').trim();
      let productBenefit = '';
      if (typeof OILS_DATABASE === 'object' && OILS_DATABASE !== null) {
        // Try exact match, then case-insensitive partial
        const oilEntry = OILS_DATABASE[productBaseName]
          || Object.entries(OILS_DATABASE).find(([k]) => normalize(k).includes(normalize(productBaseName)))?.[1]
          || Object.entries(OILS_DATABASE).find(([k]) => normalize(productBaseName).includes(normalize(k)))?.[1];
        if (oilEntry) {
          productBenefit = oilEntry.uses || oilEntry.fn || '';
        }
      }

      summaryHtml = `
        <div class="card" style="margin-bottom:20px;border:1px solid var(--green-200);background:var(--green-50)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px">
            <div>
              <h4 style="margin:0;color:var(--green-800)">👥 Clientes que compraram este produto (${filteredClientsList.length})</h4>
              <p style="font-size:0.8rem;color:var(--green-700);margin:4px 0 0">Total de ${sorted.length} vendas filtradas — Toque no WhatsApp para enviar promoção</p>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-secondary btn-sm" id="btn-export-csv" style="background:white">📥 Baixar Lista (CSV)</button>
              <button class="btn btn-primary btn-sm" id="btn-copy-phones">📋 Copiar Números</button>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;max-height:400px;overflow-y:auto;padding:4px">
            ${filteredClientsList.map(c => {
              const cleanPhone = (c.telefone || c.phone || '').replace(/\D/g, '');
              const phoneWithPrefix = cleanPhone ? (cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone) : '';
              const firstName = (c.nome || c.name || '').split(' ')[0];
              const benefitText = productBenefit
                ? `que ajuda com *${productBenefit.split(',').slice(0, 2).join(' e ').trim()}*`
                : `que voce ja conhece e adora`;
              
              const e1 = String.fromCodePoint(0x1F60A); // 😊
              const e2 = String.fromCodePoint(0x1F389); // 🎉
              const e3 = String.fromCodePoint(0x1F600); // 😀
              const e4 = String.fromCodePoint(0x1F680); // 🚀
              const e5 = String.fromCodePoint(0x2728);  // ✨
              const e6 = String.fromCodePoint(0x1F60D); // 😍

              const templates = [
                `Oi ${firstName}! ${e1} Tudo bem? Vi aqui que voce ja usou o *${productBaseName}*, ${benefitText}. E tenho uma otima noticia: ele esta em *promocao especial* hoje! ${e2} Quer aproveitar essa condicao? Posso te contar os detalhes!`,
                
                `Ola ${firstName}, como voce esta? ${e3} Lembrei de voce porque o *${productBaseName}* (que e otimo para ${productBenefit ? '*' + productBenefit.split(',').slice(0, 2).join(' e ').trim() + '*' : 'o seu bem-estar'}) entrou em uma *promocao incrivel* hoje! ${e4} Me avisa se quiser garantir o seu com desconto.`,
                
                `Oie ${firstName}! ${e5} Passando para avisar rapidamente que o *${productBaseName}* esta com um valor *super especial* hoje! ${e6} ${productBenefit ? 'Como sei que ele e perfeito para *' + productBenefit.split(',').slice(0, 2).join(' e ').trim() + '*, achei que ia gostar de saber.' : 'Achei que ia adorar a novidade.'} Quer que eu te mande os valores?`
              ];
              
              // Remove accents from the generated message to ensure WhatsApp receives it perfectly without any encoding issues
              const waMsg = templates[Math.floor(Math.random() * templates.length)];
              const waLink = phoneWithPrefix ? `https://wa.me/${phoneWithPrefix}?text=${encodeURIComponent(waMsg)}` : '#';
              return `
                <div style="background:white;border:1px solid var(--green-200);border-radius:12px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px;transition:box-shadow 0.2s"
                     onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.06)'" onmouseout="this.style.boxShadow=''">
                  <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
                    <div style="width:36px;height:36px;border-radius:50%;background:var(--green-100);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--green-700);font-size:0.85rem;flex-shrink:0">
                      ${firstName.charAt(0).toUpperCase()}
                    </div>
                    <div style="min-width:0">
                      <div style="font-weight:600;font-size:0.92rem;color:var(--text-dark);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.nome || c.name}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted)">${cleanPhone ? cleanPhone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4') : 'Sem telefone'}${c.purchaseCount > 1 ? ` · ${c.purchaseCount} compras` : ''}</div>
                    </div>
                  </div>
                  ${phoneWithPrefix
                    ? `<a href="${waLink}" target="_blank" style="display:flex;align-items:center;gap:6px;background:#25D366;color:white;border:none;padding:8px 16px;border-radius:8px;font-size:0.82rem;font-weight:700;text-decoration:none;white-space:nowrap;flex-shrink:0;transition:background 0.2s"
                         onmouseover="this.style.background='#1DA851'" onmouseout="this.style.background='#25D366'">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WhatsApp
                      </a>`
                    : `<span style="font-size:0.75rem;color:var(--text-muted);padding:8px 12px;background:#f1f5f9;border-radius:8px">Sem contato</span>`}
                </div>
              `;
            }).join('')}
          </div>
        </div>`;
    }

    const tableHtml = sorted.length === 0
      ? `<div class="empty-state"><div class="empty-state-icon">🛒</div><h4>Nenhuma compra registrada</h4></div>`
      : `<table class="clients-table">
          <thead><tr><th>Cliente</th><th>Produto / Kit</th><th>Data</th><th>Valor</th><th>Observação</th><th style="width:80px">Ações</th></tr></thead>
          <tbody>
            ${sorted.map(p => `<tr>
                <td>
                  <div style="font-weight:600">${p.cliente_nome || '—'}</div>
                </td>
                <td><span class="badge" style="background:var(--green-50);color:var(--green-800);border:1px solid var(--green-200)">${p.produto || '—'}</span></td>
                <td>${formatDate(p.data || p.criado_em)}</td>
                <td style="font-weight:700;color:var(--green-700)">${formatCurrency(p.valor)}</td>
                <td style="color:var(--text-muted);font-size:0.82rem;max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${p.observacao || ''}">${p.observacao || '—'}</td>
                <td>
                  <div style="display:flex;gap:4px">
                    <button class="btn-edit-pu" data-id="${p.id}" title="Editar" style="background:none;border:none;cursor:pointer;font-size:1.1rem;opacity:0.7;padding:5px">✏️</button>
                    <button class="btn-del-pu" data-id="${p.id}" title="Excluir" style="background:none;border:none;cursor:pointer;font-size:1.1rem;opacity:0.7;padding:5px">🗑️</button>
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>`;

    container.innerHTML = summaryHtml + tableHtml;
    bindTableEvents();
    if (activeProductFilter) bindSummaryEvents(filteredClientsList);
  }

  function bindSummaryEvents(filteredClients) {
    document.getElementById('btn-export-csv')?.addEventListener('click', () => {
      const headers = ['Nome', 'Telefone', 'Email', 'Qtd Compras'];
      const rows = filteredClients.map(c => [
        c.nome || c.name || '',
        c.telefone || c.phone || '',
        c.email || '',
        c.purchaseCount
      ]);
      const csvContent = [headers, ...rows].map(e => e.join(';')).join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `clientes_${activeProductFilter.replace(/\s+/g, '_')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    document.getElementById('btn-copy-phones')?.addEventListener('click', (e) => {
      const phones = filteredClients.map(c => (c.telefone || c.phone || '').replace(/\D/g, '')).filter(p => p).join('\n');
      if (!phones) return toast('Nenhum telefone encontrado', 'warning');
      copyToClipboard(phones, e.currentTarget);
    });
  }

  function bindTableEvents() {
    const container = document.getElementById('purchases-list');
    // Delete
    container.querySelectorAll('.btn-del-pu').forEach(btn => {
      btn.addEventListener('click', () => {
        modal('Excluir Venda', '<p>Tem certeza que deseja apagar o registro desta venda? Esta ação é irreversível.</p>', {
          confirmLabel: 'Sim, Apagar', confirmClass: 'btn-danger',
          onConfirm: async () => {
            try {
              await store.deleteCompra(btn.dataset.id);
              localPurchases = localPurchases.filter(x => x.id !== btn.dataset.id);
              renderList(); toast('Venda excluída com sucesso!');
            } catch(e) { toast(e.message, 'error'); return false; }
          }
        });
      });
    });

    // Edit
    container.querySelectorAll('.btn-edit-pu').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = localPurchases.find(x => x.id === btn.dataset.id);
        if (!p) return;
        showEditModal(p);
      });
    });
  }

  function showEditModal(p) {
    modal('Editar Venda', `
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Cliente (Leitura)</label>
          <input class="field-input" value="${p.cliente_nome || '—'}" disabled style="background:#f1f5f9;cursor:not-allowed;" />
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Produto / Kit *</label>
          <div style="position:relative">
            <input class="field-input" id="pu-product-search-edt" placeholder="🔍 Buscar no estoque ou base doTERRA..." autocomplete="off" value="${p.produto || ''}" style="padding-right:36px" />
            <input type="hidden" id="pu-product-edt" value="${p.produto || ''}" />
            <div id="pu-product-dropdown-edt" style="display:none;position:absolute;top:100%;left:0;right:0;z-index:999;
                     background:#fff;border:1px solid var(--border);border-radius:10px;
                     box-shadow:0 8px 24px rgba(0,0,0,0.12);max-height:180px;overflow-y:auto;margin-top:4px"></div>
          </div>
        </div>
        <div class="form-group">
          <label class="field-label">Valor (R$)</label>
          <input class="field-input" id="pu-value-edt" type="number" step="0.01" value="${p.valor || 0}" />
        </div>
        <div class="form-group">
          <label class="field-label">Data</label>
          <input class="field-input" id="pu-date-edt" type="date" value="${(p.data || p.criado_em || '').slice(0, 10)}" />
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Observação</label>
          <input class="field-input" id="pu-note-edt" value="${p.observacao || ''}" />
        </div>
      </div>`, {
      confirmLabel: 'Salvar Alterações',
      onOpen: () => {
        const pSearchInput = document.getElementById('pu-product-search-edt');
        const pHiddenInput = document.getElementById('pu-product-edt');
        const pDropdown = document.getElementById('pu-product-dropdown-edt');
        const valueInput = document.getElementById('pu-value-edt');

        function renderProductDropdown(query) {
          const q = query.toLowerCase().trim();
          const matches = q ? productCatalog.filter(p => p.search.includes(q)) : productCatalog.slice(0, 15);
          if (!matches.length) {
            pDropdown.innerHTML = `<div style="padding:10px 14px;color:var(--text-muted);font-size:0.82rem">Nenhum produto encontrado.</div>`;
          } else {
            pDropdown.innerHTML = matches.map(p => `
              <div data-name="${p.name}" data-price="${p.price}"
                style="padding:8px 14px;cursor:pointer;border-bottom:1px solid var(--border);transition:background 0.15s"
                onmouseover="this.style.background='var(--green-50)'" onmouseout="this.style.background=''">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="font-size:0.88rem;font-weight:600;color:var(--text-dark)">${p.name}</span>
                  <span style="font-size:0.75rem;background:${p.source==='estoque'?'#dcfce7':'#eff6ff'};color:${p.source==='estoque'?'#166534':'#1d4ed8'};padding:2px 6px;border-radius:4px">
                    ${p.source==='estoque' ? 'Meu Estoque' : 'doTERRA'}
                  </span>
                </div>
              </div>
            `).join('');
          }
          pDropdown.style.display = 'block';
        }

        pSearchInput.addEventListener('input', () => { pHiddenInput.value = pSearchInput.value; renderProductDropdown(pSearchInput.value); });
        pSearchInput.addEventListener('focus', () => renderProductDropdown(pSearchInput.value));
        pDropdown.addEventListener('mousedown', (e) => {
          const item = e.target.closest('[data-name]');
          if (!item) return;
          pSearchInput.value = item.dataset.name;
          pHiddenInput.value = item.dataset.name;
          if (item.dataset.price && parseFloat(item.dataset.price) > 0) valueInput.value = parseFloat(item.dataset.price).toFixed(2);
          pDropdown.style.display = 'none';
        });
        document.addEventListener('mousedown', (e) => {
          if (!pSearchInput.contains(e.target) && !pDropdown.contains(e.target)) pDropdown.style.display = 'none';
        }, { once: true });
      },
      onConfirm: async () => {
        const produto = document.getElementById('pu-product-edt').value.trim();
        if (!produto) { toast('Preencha o produto / kit', 'error'); return false; }
        try {
          const updated = await store.updateCompra(p.id, {
            produto,
            valor: parseFloat(document.getElementById('pu-value-edt').value) || 0,
            data: document.getElementById('pu-date-edt').value,
            observacao: document.getElementById('pu-note-edt').value,
          });
          localPurchases = localPurchases.map(x => x.id === p.id ? { ...x, ...updated } : x);
          renderList(); toast('Compra atualizada! ✏️');
        } catch(e) { toast(e.message, 'error'); return false; }
      }
    });
  }

  function showAddModal() {
    let items = [];

    const renderItems = () => {
      const list = document.getElementById('pu-items-list');
      if (!list) return;
      if (items.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:15px;color:var(--text-muted);font-size:0.85rem;border:1px dashed var(--border);border-radius:8px">Nenhum produto adicionado ainda.</div>`;
      } else {
        list.innerHTML = items.map((it, idx) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:6px">
            <div style="flex:1;min-width:0;padding-right:10px">
              <div style="font-size:0.85rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${it.produto}</div>
            </div>
            <div style="font-weight:700;color:var(--green-700);font-size:0.85rem;margin-right:12px">${formatCurrency(it.valor)}</div>
            <button class="btn-remove-item" data-idx="${idx}" style="background:none;border:none;color:#ef4444;cursor:pointer;padding:4px;font-size:1rem;line-height:1" title="Remover item">×</button>
          </div>
        `).join('');
      }
      
      const total = items.reduce((s, it) => s + it.valor, 0);
      const totalEl = document.getElementById('pu-total-preview');
      if (totalEl) totalEl.textContent = formatCurrency(total);

      // Bind remove events
      list.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
          items.splice(parseInt(btn.dataset.idx), 1);
          renderItems();
        });
      });
    };

    modal('Registrar Venda', `
      <div class="form-grid">
        <!-- Cliente e Info Geral -->
        <div class="form-group form-field-full">
          <label class="field-label">Cliente *</label>
          <div style="position:relative">
            <input class="field-input" id="pu-client-search" placeholder="🔍 Buscar cliente pelo nome..." autocomplete="off" style="padding-right:36px" />
            <input type="hidden" id="pu-client" />
            <div id="pu-client-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;z-index:999;
                     background:#fff;border:1px solid var(--border);border-radius:10px;
                     box-shadow:0 8px 24px rgba(0,0,0,0.12);max-height:220px;overflow-y:auto;margin-top:4px"></div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="field-label">Data</label>
          <input class="field-input" id="pu-date" type="date" value="${new Date().toISOString().slice(0, 10)}" />
        </div>
        <div class="form-group">
          <label class="field-label">Observação</label>
          <input class="field-input" id="pu-note" placeholder="Ex: Pagamento PIX..." />
        </div>

        <div style="grid-column: 1 / -1; height: 1px; background: #e2e8f0; margin: 10px 0"></div>

        <!-- Adicionar Produtos -->
        <div class="form-group form-field-full">
          <label class="field-label" style="display:flex;justify-content:space-between">
            Produtos Escolhidos
            <span style="color:var(--green-700);font-weight:800" id="pu-total-preview">R$ 0,00</span>
          </label>
          
          <div id="pu-items-list" style="margin-bottom:12px"></div>

          <div style="background:#f1f5f9;padding:12px;border-radius:10px;border:1px solid #e2e8f0">
            <div style="font-size:0.75rem;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:8px">➕ Adicionar ao Carrinho</div>
            <div style="display:grid;grid-template-columns: 1fr 100px 50px;gap:8px">
              <div style="position:relative">
                <input class="field-input" id="pu-product-search" placeholder="Buscar produto..." autocomplete="off" />
                <input type="hidden" id="pu-product" />
                <div id="pu-product-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;z-index:999;
                         background:#fff;border:1px solid var(--border);border-radius:10px;
                         box-shadow:0 8px 24px rgba(0,0,0,0.12);max-height:220px;overflow-y:auto;margin-top:4px"></div>
              </div>
              <input class="field-input" id="pu-value" type="number" step="0.01" placeholder="0,00" />
              <button class="btn btn-primary" id="btn-add-item-to-list" style="padding:0;font-size:1.2rem;display:flex;align-items:center;justify-content:center">+</button>
            </div>
          </div>
        </div>
      </div>`, {
      confirmLabel: 'Registrar Tudo',
      onOpen: () => {
        const searchInput = document.getElementById('pu-client-search');
        const hiddenInput = document.getElementById('pu-client');
        const dropdown = document.getElementById('pu-client-dropdown');

        const pSearchInput = document.getElementById('pu-product-search');
        const pHiddenInput = document.getElementById('pu-product');
        const pDropdown = document.getElementById('pu-product-dropdown');
        const valueInput = document.getElementById('pu-value');
        const btnAdd = document.getElementById('btn-add-item-to-list');

        renderItems();

        // Add item logic
        btnAdd.addEventListener('click', (e) => {
          e.preventDefault();
          const prod = pSearchInput.value.trim();
          const val = parseFloat(valueInput.value) || 0;
          if (!prod) return toast('Selecione um produto', 'warning');
          
          items.push({ produto: prod, valor: val });
          pSearchInput.value = '';
          pHiddenInput.value = '';
          valueInput.value = '';
          renderItems();
          pSearchInput.focus();
        });

        // Client dropdown logic
        function renderDropdown(query) {
          const q = query.toLowerCase().trim();
          const matches = q ? clients.filter(c => (c.nome || '').toLowerCase().includes(q)) : clients;
          if (!matches.length) {
            dropdown.innerHTML = `<div style="padding:12px 16px;color:var(--text-muted);font-size:0.9rem">Nenhuma cliente encontrada</div>`;
          } else {
            dropdown.innerHTML = matches.map(c => {
              const name = c.nome || '';
              const highlighted = name.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<strong style="color:var(--green-700)">$1</strong>');
              return `<div data-id="${c.id}" data-name="${name}" style="padding:10px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border);transition:background 0.15s" onmouseover="this.style.background='var(--green-50)'" onmouseout="this.style.background=''">
                <div style="width:32px;height:32px;border-radius:50%;background:var(--green-100);color:var(--green-700);font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.85rem">${name[0]?.toUpperCase() || '?'}</div>
                <span style="font-size:0.92rem">${highlighted}</span>
              </div>`;
            }).join('');
          }
          dropdown.style.display = 'block';
        }
        searchInput.addEventListener('input', () => { hiddenInput.value = ''; renderDropdown(searchInput.value); });
        searchInput.addEventListener('focus', () => renderDropdown(searchInput.value));
        dropdown.addEventListener('mousedown', (e) => {
          const item = e.target.closest('[data-id]');
          if (!item) return;
          hiddenInput.value = item.dataset.id;
          searchInput.value = item.dataset.name;
          dropdown.style.display = 'none';
        });

        // Product dropdown logic
        function renderProductDropdown(query) {
          const q = normalize(query);
          const matches = q ? productCatalog.filter(p => p.search.includes(q)) : productCatalog.slice(0, 30);
          if (!matches.length) {
            pDropdown.innerHTML = `<div style="padding:12px 16px;color:var(--text-muted);font-size:0.85rem">Nenhum produto encontrado.</div>`;
          } else {
            pDropdown.innerHTML = matches.map(p => `
              <div data-name="${p.name}" data-price="${p.price}" style="padding:10px 16px;cursor:pointer;border-bottom:1px solid var(--border);transition:background 0.15s" onmouseover="this.style.background='var(--green-50)'" onmouseout="this.style.background=''">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="font-size:0.9rem;font-weight:600;color:var(--text-dark)">${p.name}</span>
                  <span style="font-size:0.75rem;background:${p.source==='estoque'?'#dcfce7':'#eff6ff'};color:${p.source==='estoque'?'#166534':'#1d4ed8'};padding:2px 6px;border-radius:4px">${p.source==='estoque' ? 'Meu Estoque' : 'doTERRA'}</span>
                </div>
                <div style="font-size:0.8rem;color:var(--green-700);margin-top:2px">Sugerido: R$ ${p.price.toFixed(2)}</div>
              </div>
            `).join('');
          }
          pDropdown.style.display = 'block';
        }
        pSearchInput.addEventListener('input', () => { pHiddenInput.value = pSearchInput.value; renderProductDropdown(pSearchInput.value); });
        pSearchInput.addEventListener('focus', () => renderProductDropdown(pSearchInput.value));
        pDropdown.addEventListener('mousedown', (e) => {
          const item = e.target.closest('[data-name]');
          if (!item) return;
          pSearchInput.value = item.dataset.name;
          pHiddenInput.value = item.dataset.name;
          if (item.dataset.price && parseFloat(item.dataset.price) > 0) valueInput.value = parseFloat(item.dataset.price).toFixed(2);
          pDropdown.style.display = 'none';
        });

        document.addEventListener('click', (e) => {
          if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) dropdown.style.display = 'none';
          if (!pSearchInput.contains(e.target) && !pDropdown.contains(e.target)) pDropdown.style.display = 'none';
        }, { once: false, capture: true });
      },
      onConfirm: async () => {
        const cliente_id = document.getElementById('pu-client').value;
        const data = document.getElementById('pu-date').value;
        const observacao = document.getElementById('pu-note').value;
        
        if (!cliente_id) { toast('Selecione uma cliente', 'error'); return false; }
        if (items.length === 0) { toast('Adicione pelo menos um produto ao carrinho', 'error'); return false; }

        try {
          const results = await Promise.all(items.map(it => 
            store.addCompra({
              cliente_id,
              produto: it.produto,
              valor: it.valor,
              data,
              observacao
            })
          ));

          const cliente_nome = clients.find(c => c.id === cliente_id)?.nome || 'Cliente';
          results.forEach(nova => {
            nova.cliente_nome = cliente_nome;
            localPurchases.unshift(nova);
          });

          renderList();
          toast(`${items.length} produto(s) registrado(s) com sucesso! 🛒`);
          return true;
        } catch(e) { 
          toast('Erro ao registrar alguns itens: ' + e.message, 'error'); 
          renderList();
          return false; 
        }
      }
    });
  }

  const pc = document.getElementById('page-content');
  if (pc) pc.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
        <div class="stat-card green" style="padding:14px 20px;margin:0;min-width:180px">
          <div class="stat-label">Receita Total</div>
          <div class="stat-value" id="total-revenue">R$ 0,00</div>
        </div>
        
        <div style="position:relative;width:300px">
          <input type="text" id="filter-product" class="field-input" placeholder="🔍 Filtrar por produto..." style="padding-left:36px;margin:0" list="products-datalist" />
          <datalist id="products-datalist"></datalist>
          <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);opacity:0.5">📦</span>
          ${activeProductFilter ? `<button id="clear-filter" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.2rem;opacity:0.5">×</button>` : ''}
        </div>
      </div>
      <button class="btn btn-primary" id="btn-add-pu">+ Registrar Venda</button>
    </div>
    <div class="card"><div style="overflow-x:auto" id="purchases-list"></div></div>`;

  document.getElementById('btn-add-pu')?.addEventListener('click', () => showAddModal());
  
  const filterInput = document.getElementById('filter-product');
  filterInput?.addEventListener('input', (e) => {
    activeProductFilter = e.target.value.trim();
    renderList();
  });

  document.getElementById('clear-filter')?.addEventListener('click', () => {
    filterInput.value = '';
    activeProductFilter = '';
    renderList();
  });

  renderList();
}

