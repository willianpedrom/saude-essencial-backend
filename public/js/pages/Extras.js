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
            <button class="btn btn-primary" onclick="navigator.clipboard.writeText('${publicUrl}');window.toast('Link copiado! 🔗')"
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
          { icon: '✅', label: 'Aprovados', value: approved, color: '#d97706', bg: '#fffbeb' },
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
                          ${!t.aprovado
                ? `<button class="btn btn-sm" data-approve="${t.id}"
                                style="background:#16a34a;color:#fff;border-color:#16a34a;
                                       font-size:0.77rem;padding:5px 10px;font-weight:600">
                                ✅ Aprovar
                              </button>`
                : `<span style="font-size:0.77rem;color:#16a34a;font-weight:700;
                                          display:flex;align-items:center;gap:3px">
                                ✅ Aprovado
                              </span>`}
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
          let success = false;
          btn.disabled = true;
          btn.textContent = '⏳ Aprovando...';
          try {
            await store.approveTestimonial(id, true);
            // Usa String() para evitar falha silenciosa: id do banco é number, dataset é string
            localTestimonials = localTestimonials.map(t => String(t.id) === String(id) ? { ...t, aprovado: true } : t);
            success = true;
          } catch (e) {
            const msg = e?.message || '';
            if (msg.includes('401') || msg.toLowerCase().includes('expirado') || msg.toLowerCase().includes('inválido')) {
              toast('Sua sessão expirou. Recarregue a página e tente novamente.', 'error');
            } else {
              toast(msg || 'Erro ao aprovar. Tente novamente.', 'error');
            }
          } finally {
            // Garante que a UI SEMPRE seja atualizada, mesmo se toast() falhar
            try { renderView(); } catch { /* silencioso */ }
            if (success) {
              try { toast('Depoimento aprovado com sucesso! ✅'); } catch { /* silencioso */ }
            }
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
          <thead><tr><th>Cliente</th><th>Produto / Kit</th><th>Data</th><th>Valor</th><th>Observação</th><th style="width:60px">Ações</th></tr></thead>
          <tbody>
            ${purchases.map(p => {
        const c = clients.find(cl => cl.id === p.clientId);
        return `<tr>
                <td>${c?.name || c?.nome || '—'}</td>
                <td>${p.product || '—'}</td>
                <td>${formatDate(p.date || p.createdAt)}</td>
                <td style="font-weight:700;color:var(--green-700)">${formatCurrency(p.value)}</td>
                <td style="color:var(--text-muted);font-size:0.82rem">${p.note || '—'}</td>
                <td>
                  <div style="display:flex;gap:4px">
                    <button class="btn-edit-pu" data-id="${p.id}" title="Editar" style="background:none;border:none;cursor:pointer;font-size:1.1rem;opacity:0.7;padding:5px">✏️</button>
                    <button class="btn-del-pu" data-id="${p.id}" title="Excluir" style="background:none;border:none;cursor:pointer;font-size:1.1rem;opacity:0.7;padding:5px">🗑️</button>
                  </div>
                </td>
              </tr>`;
      }).join('')}
          </tbody>
        </table>`;

    // Bind delete events
    container.querySelectorAll('.btn-del-pu').forEach(btn => {
      btn.addEventListener('click', () => {
        modal('Excluir Compra', '<p>Tem certeza que deseja apagar o registro desta venda? Esta ação é irreversível.</p>', {
          confirmLabel: 'Sim, Apagar',
          confirmClass: 'btn-danger',
          onConfirm: () => {
            db.del(btn.dataset.id);
            renderList();
            toast('Venda excluída com sucesso!');
          }
        });
      });
    });

    // Bind edit events
    container.querySelectorAll('.btn-edit-pu').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const p = purchases.find(x => x.id === id);
        if (!p) return;
        const c = clients.find(cl => cl.id === p.clientId);
        showEditModal(p, c?.name || c?.nome || 'Cliente Removido');
      });
    });
  }

  function showEditModal(p, clientName) {
    modal('Editar Compra', `
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Cliente (Leitura)</label>
          <input class="field-input" value="${clientName}" disabled style="background:#f1f5f9;cursor:not-allowed;" />
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Produto / Kit *</label>
          <input class="field-input" id="pu-product-edt" value="${p.product || ''}" />
        </div>
        <div class="form-group">
          <label class="field-label">Valor (R$)</label>
          <input class="field-input" id="pu-value-edt" type="number" step="0.01" value="${p.value || 0}" />
        </div>
        <div class="form-group">
          <label class="field-label">Data</label>
          <input class="field-input" id="pu-date-edt" type="date" value="${(p.date || p.createdAt || '').slice(0, 10)}" />
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Observação</label>
          <input class="field-input" id="pu-note-edt" value="${p.note || ''}" />
        </div>
      </div>`, {
      confirmLabel: 'Salvar Alterações',
      onConfirm: () => {
        const product = document.getElementById('pu-product-edt').value.trim();
        if (!product) { toast('Preencha o produto / kit', 'error'); return; }
        db.update(p.id, {
          product,
          value: parseFloat(document.getElementById('pu-value-edt').value) || 0,
          date: document.getElementById('pu-date-edt').value,
          note: document.getElementById('pu-note-edt').value,
        });
        renderList(); toast('Compra atualizada! ✏️');
      }
    });
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
