import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { formatDate, formatCurrency, toast, modal } from '../utils.js';

// LocalStorage helper for features without backend endpoints
function ls(key) {
  const uid = auth.current?.id || 'anon';
  const k = `se_${key}_${uid}`;
  return {
    get() { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } },
    set(list) { localStorage.setItem(k, JSON.stringify(list)); },
    add(item) { const l = this.get(); l.push({ id: Date.now().toString(), createdAt: new Date().toISOString(), ...item }); this.set(l); return l; },
    update(id, patch) { const l = this.get().map(x => x.id === id ? { ...x, ...patch } : x); this.set(l); return l; },
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

      pc.innerHTML = `
        <!-- Top Board: Public Link & Tags -->
        <div class="card" style="margin-bottom:20px;display:flex;flex-wrap:wrap;gap:20px;align-items:center;background:linear-gradient(135deg,#0a1f0f,#13301b);color:white;border:none">
          <div style="flex:1;min-width:300px">
            <h3 style="font-family:'Playfair Display',serif;font-size:1.3rem;margin-bottom:8px">Seu Link Público 🔗</h3>
            <p style="font-size:0.85rem;color:rgba(255,255,255,0.7);margin-bottom:12px">
              Envie este link para as clientes avaliarem os resultados (NPS) e deixarem o depoimento registrado no sistema.
            </p>
            <div style="display:flex;gap:8px">
              <input type="text" readonly value="${publicUrl}" style="flex:1;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:6px;padding:8px 12px;color:white;font-size:0.85rem" />
              <button class="btn btn-primary" onclick="navigator.clipboard.writeText('${publicUrl}');window.toast('Link copiado!')">Copiar Link</button>
            </div>
          </div>
          <div style="flex:1;min-width:300px;border-left:1px solid rgba(255,255,255,0.1);padding-left:20px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <h3 style="font-size:1.1rem;margin:0">Gerenciar Etiquetas 🏷️</h3>
              <button class="btn btn-secondary btn-sm" id="btn-add-tag" style="background:rgba(255,255,255,0.1);color:white;border:none">+ Nova</button>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${localTags.map(tag => `
                <span class="badge" style="background:${tag.cor}25;border:1px solid ${tag.cor};color:${tag.cor};padding:4px 10px;display:flex;align-items:center;gap:6px">
                  ${tag.nome}
                  <button data-deltag="${tag.id}" style="background:none;border:none;color:${tag.cor};cursor:pointer;padding:0;font-size:1.1rem;line-height:1;margin-top:-2px">×</button>
                </span>
              `).join('')}
              ${localTags.length === 0 ? '<span style="color:rgba(255,255,255,0.5);font-size:0.8rem">Nenhuma etiqueta criada.</span>' : ''}
            </div>
          </div>
        </div>

        <!-- Filter and Add Button -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
          <div style="display:flex;gap:8px;align-items:center;overflow-x:auto;padding-bottom:4px">
            <span style="font-size:0.85rem;color:var(--text-muted);font-weight:600">FILTRAR PROVA SOCIAL:</span>
            <button class="btn btn-sm ${activeTagFilter === null ? 'btn-primary' : 'btn-secondary'}" data-filtertag="null">Todos</button>
            ${localTags.map(tag => `
              <button class="btn btn-sm ${activeTagFilter === tag.id ? 'btn-primary' : 'btn-secondary'}" data-filtertag="${tag.id}" style="${activeTagFilter === tag.id ? `background:${tag.cor};border-color:${tag.cor}` : `color:${tag.cor};border-color:${tag.cor}40`}">
                ${tag.nome}
              </button>
            `).join('')}
          </div>
          <button class="btn btn-secondary" id="btn-add-t">+ Depoimento Manual</button>
        </div>

        <!-- List -->
        <div id="testimonials-list" style="position:relative">
          ${filtered.length === 0
          ? `<div class="empty-state"><div class="empty-state-icon">⭐</div><h4>Nenhum depoimento encontrado</h4>
                   <p>Mande seu link para as clientes ou filtre por outra etiqueta.</p></div>`
          : filtered.map(t => {
            const isPromoter = t.nota >= 9;
            const isDetractor = t.nota <= 6;
            const badgeColor = isPromoter ? 'var(--green-600)' : isDetractor ? 'var(--danger)' : '#f59e0b';
            const badgeBg = isPromoter ? 'var(--green-100)' : isDetractor ? '#fee2e2' : '#fef3c7';

            return `
              <div class="testimonial-card" style="margin-bottom:14px;position:relative;border-left:4px solid ${t.aprovado ? 'var(--green-500)' : 'var(--gold)'}">
                ${!t.aprovado ? `<div style="position:absolute;top:12px;right:12px"><span class="badge" style="background:var(--gold);color:#fff">⏳ Pendente</span></div>` : ''}
                
                <div style="display:flex;justify-content:space-between;margin-bottom:12px;align-items:flex-start">
                  <div class="testimonial-author">
                    <div class="testimonial-author-avatar" style="background:#f1f5f9;color:#334155">${(t.cliente_nome[0] || 'C').toUpperCase()}</div>
                    <div>
                      <div class="testimonial-author-name">${t.cliente_nome} <span style="font-weight:400;color:var(--text-muted);font-size:0.82rem;margin-left:6px">${t.origem === 'link' ? '(Link Público)' : '(Manual)'}</span></div>
                      ${t.cliente_email ? `<div class="testimonial-author-sub">${t.cliente_email}</div>` : ''}
                      <div class="testimonial-author-sub">${formatDate(t.criado_em)}</div>
                    </div>
                  </div>
                  <div style="text-align:right">
                    <div style="display:inline-block;padding:4px 10px;border-radius:20px;background:${badgeBg};color:${badgeColor};font-weight:700;font-size:0.85rem">
                      NPS: ${t.nota}/10 ${isPromoter ? '🔥' : isDetractor ? '⚠️' : '👌'}
                    </div>
                  </div>
                </div>

                <div class="testimonial-text" style="font-size:1.05rem;line-height:1.6;color:var(--text-body);background:#f8fafc;padding:16px;border-radius:12px;margin-bottom:12px;font-style:italic">
                  "${t.texto}"
                </div>
                
                <div style="display:flex;justify-content:space-between;align-items:center;background:#fff;padding-top:12px;border-top:1px solid var(--border)">
                  <div style="display:flex;gap:6px;align-items:center">
                    <span style="font-size:0.8rem;color:var(--text-muted)">Tags:</span>
                    ${(t.etiquetas || []).map(e => `<span class="badge" style="background:${e.cor}20;color:${e.cor};font-size:0.75rem">${e.nome}</span>`).join('')}
                    <button class="btn btn-secondary btn-sm" data-assign="${t.id}" style="padding:2px 6px;height:auto;font-size:0.75rem" title="Adicionar Etiquetas">✏️</button>
                  </div>
                  <div style="display:flex;gap:8px">
                    <button class="btn btn-danger btn-sm" data-delete="${t.id}">🗑️</button>
                    ${!t.aprovado
                ? `<button class="btn btn-primary btn-sm" data-approve="${t.id}" style="background:var(--green-600)">✅ Aprovar Prova Social</button>`
                : `<span style="font-size:0.8rem;color:var(--green-700);font-weight:600;display:flex;align-items:center;gap:4px">✅ Aprovado para uso</span>`
              }
                  </div>
                </div>
                ${!t.consentimento ? `<div style="font-size:0.75rem;color:var(--danger);margin-top:8px;text-align:right">⚠️ Cliente não autorizou o uso desta prova social publicamente.</div>` : ''}
              </div>`;
          }).join('')}
        </div>`;

      bindEvents();
    }

    function bindEvents() {
      // Tags Toggle
      document.querySelectorAll('[data-filtertag]').forEach(btn => {
        btn.addEventListener('click', () => {
          const val = btn.dataset.filtertag;
          activeTagFilter = val === "null" ? null : val;
          renderView();
        });
      });

      // Approvation
      document.querySelectorAll('[data-approve]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.approve;
          btn.disabled = true; btn.textContent = '...';
          try {
            await store.approveTestimonial(id, true);
            localTestimonials = localTestimonials.map(t => t.id === id ? { ...t, aprovado: true } : t);
            renderView(); window.toast('Aprovado com sucesso! ✅');
          } catch (e) { window.toast(e.message, 'error'); renderView(); }
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
                renderView(); window.toast('Etiquetas salvas!');
              } catch (e) { window.toast(e.message, 'error'); }
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
                renderView(); window.toast('Depoimento apagado.');
              } catch (e) { window.toast(e.message, 'error'); }
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
            if (!nome) { window.toast('O nome é obrigatório.', 'error'); return; }
            try {
              const res = await store.addTag({ nome, cor });
              localTags.push(res);
              renderView(); window.toast('Etiqueta criada! 🏷️');
            } catch (e) { window.toast(e.message, 'error'); }
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
                renderView(); window.toast('Etiqueta removida.');
              } catch (e) { window.toast(e.message, 'error'); }
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
            if (!cliente_nome || !texto) { window.toast('Preencha os campos obrigatórios', 'error'); return; }

            try {
              const res = await store.addTestimonial({ cliente_nome, texto, nota, consentimento: true }); // manual implies you got consent
              localTestimonials.unshift(res);
              renderView(); window.toast('Registrado! ⭐');
            } catch (e) { window.toast(e.message, 'error'); }
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
  renderLayout(router, 'Histórico de Compras',
    `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando...</div>`,
    'purchases');

  const clients = await store.getClients().catch(() => []);
  const db = ls('purchases');

  function renderList() {
    const purchases = db.get().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = purchases.reduce((s, p) => s + (Number(p.value) || 0), 0);
    const container = document.getElementById('purchases-list');
    if (!container) return;
    const totalEl = document.getElementById('total-revenue');
    if (totalEl) totalEl.textContent = formatCurrency(total);

    container.innerHTML = purchases.length === 0
      ? `<div class="empty-state"><div class="empty-state-icon">🛒</div><h4>Nenhuma compra registrada</h4></div>`
      : `<table class="clients-table">
          <thead><tr><th>Cliente</th><th>Produto / Kit</th><th>Data</th><th>Valor</th><th>Observação</th></tr></thead>
          <tbody>
            ${purchases.map(p => {
        const c = clients.find(cl => cl.id === p.clientId);
        return `<tr>
                <td>${c?.name || c?.nome || '—'}</td>
                <td>${p.product || '—'}</td>
                <td>${formatDate(p.date || p.createdAt)}</td>
                <td style="font-weight:700;color:var(--green-700)">${formatCurrency(p.value)}</td>
                <td style="color:var(--text-muted);font-size:0.82rem">${p.note || '—'}</td>
              </tr>`;
      }).join('')}
          </tbody>
        </table>`;
  }

  function showAddModal() {
    modal('Registrar Compra', `
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Cliente *</label>
          <div style="position:relative">
            <input
              class="field-input"
              id="pu-client-search"
              placeholder="🔍 Buscar cliente pelo nome..."
              autocomplete="off"
              style="padding-right:36px"
            />
            <input type="hidden" id="pu-client" />
            <div
              id="pu-client-dropdown"
              style="display:none;position:absolute;top:100%;left:0;right:0;z-index:999;
                     background:#fff;border:1px solid var(--border);border-radius:10px;
                     box-shadow:0 8px 24px rgba(0,0,0,0.12);max-height:220px;overflow-y:auto;margin-top:4px"
            ></div>
          </div>
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Produto / Kit *</label>
          <input class="field-input" id="pu-product" placeholder="Ex: Lavanda 15ml, Kit Imunidade..." />
        </div>
        <div class="form-group">
          <label class="field-label">Valor (R$)</label>
          <input class="field-input" id="pu-value" type="number" step="0.01" placeholder="0,00" />
        </div>
        <div class="form-group">
          <label class="field-label">Data</label>
          <input class="field-input" id="pu-date" type="date" value="${new Date().toISOString().slice(0, 10)}" />
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Observação</label>
          <input class="field-input" id="pu-note" placeholder="Ex: pagamento PIX..." />
        </div>
      </div>`, {
      confirmLabel: 'Registrar',
      onOpen: () => {
        const searchInput = document.getElementById('pu-client-search');
        const hiddenInput = document.getElementById('pu-client');
        const dropdown = document.getElementById('pu-client-dropdown');

        function renderDropdown(query) {
          const q = query.toLowerCase().trim();
          const matches = q
            ? clients.filter(c => (c.name || c.nome || '').toLowerCase().includes(q))
            : clients;

          if (!matches.length) {
            dropdown.innerHTML = `<div style="padding:12px 16px;color:var(--text-muted);font-size:0.9rem">Nenhuma cliente encontrada</div>`;
          } else {
            dropdown.innerHTML = matches.map(c => {
              const name = c.name || c.nome || '';
              const highlighted = name.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                '<strong style="color:var(--green-700)">$1</strong>');
              return `<div
                data-id="${c.id}"
                data-name="${name}"
                style="padding:10px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;
                       border-bottom:1px solid var(--border);transition:background 0.15s"
                onmouseover="this.style.background='var(--green-50)'"
                onmouseout="this.style.background=''"
              >
                <div style="width:32px;height:32px;border-radius:50%;background:var(--green-100);
                            color:var(--green-700);font-weight:700;display:flex;align-items:center;
                            justify-content:center;flex-shrink:0;font-size:0.85rem">
                  ${name[0]?.toUpperCase() || '?'}
                </div>
                <span style="font-size:0.92rem">${highlighted}</span>
              </div>`;
            }).join('');
          }
          dropdown.style.display = 'block';
        }

        searchInput.addEventListener('input', () => {
          hiddenInput.value = '';
          renderDropdown(searchInput.value);
        });

        searchInput.addEventListener('focus', () => {
          renderDropdown(searchInput.value);
        });

        dropdown.addEventListener('mousedown', (e) => {
          const item = e.target.closest('[data-id]');
          if (!item) return;
          hiddenInput.value = item.dataset.id;
          searchInput.value = item.dataset.name;
          dropdown.style.display = 'none';
        });

        document.addEventListener('click', (e) => {
          if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
          }
        }, { once: false, capture: true });
      },
      onConfirm: () => {
        const clientId = document.getElementById('pu-client').value;
        const product = document.getElementById('pu-product').value.trim();
        if (!clientId) { toast('Selecione uma cliente na lista de sugestões', 'error'); return; }
        if (!product) { toast('Preencha o produto / kit', 'error'); return; }
        db.add({
          clientId, product,
          value: parseFloat(document.getElementById('pu-value').value) || 0,
          date: document.getElementById('pu-date').value,
          note: document.getElementById('pu-note').value,
        });
        renderList(); toast('Compra registrada! 🛒');
      }
    });
  }

  const pc = document.getElementById('page-content');
  if (pc) pc.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div class="stat-card green" style="padding:14px 20px;margin:0">
        <div class="stat-label">Receita Total</div>
        <div class="stat-value" id="total-revenue">R$ 0,00</div>
      </div>
      <button class="btn btn-primary" id="btn-add-pu">+ Registrar Compra</button>
    </div>
    <div class="card"><div style="overflow-x:auto" id="purchases-list"></div></div>`;
  document.getElementById('btn-add-pu')?.addEventListener('click', showAddModal);
  renderList();
}
