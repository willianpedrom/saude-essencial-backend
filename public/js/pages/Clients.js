import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { formatDate, getInitials, toast, modal, openClientOffcanvas } from '../utils.js';

let cachedAnamneses = null; // lazy-load once per session

export async function renderClients(router) {
  // Render layout immediately with loading
  renderLayout(router, 'Clientes', `
      <div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando clientes...</div>
    `, 'clients');

  let clients = [];
  let filter = 'all';      // ativo filter → sent to server
  let tipoFilter = 'all';  // tipo_cadastro → local filter on current page
  let sortOrder = 'name';  // sort → local on current page
  let search = '';          // search → sent to server (debounced)
  let currentPage = 1;
  let totalClients = 0;
  let totalPages = 1;
  const PAGE_SIZE = 50;
  let _searchTimer = null;

  async function refresh(resetPage = true) {
    if (resetPage) currentPage = 1;
    try {
      const res = await store.getClientsPaginated({ page: currentPage, limit: PAGE_SIZE, q: search, ativo: 'all' });
      clients = res.data;
      totalClients = res.total;
      totalPages = res.totalPages;
    } catch {
      clients = [];
      totalClients = 0;
      totalPages = 1;
    }
    renderTable();
  }

  function filtered() {
    // status and tipo are applied locally on the current page of results
    let list = clients.filter(c => {
      const matchStatus = filter === 'all' || c.status === filter;
      const matchTipo = tipoFilter === 'all' ||
        (tipoFilter === 'lead' && (!c.tipo_cadastro || c.tipo_cadastro === 'lead')) ||
        c.tipo_cadastro === tipoFilter;
      return matchStatus && matchTipo;
    });

    if (sortOrder === 'recent') {
      list.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
    } else if (sortOrder === 'oldest') {
      list.sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em));
    } else {
      list.sort((a, b) => (a.nome || a.name || '').localeCompare(b.nome || b.name || ''));
    }
    return list;
  }

  function renderTable() {
    const pc = document.getElementById('page-content');
    if (!pc) return;
    const list = filtered(); // local tipo/sort on current page

    const tbody = pc.querySelector('#clients-tbody');
    if (!tbody) { buildPage(); return; }

    tbody.innerHTML = list.length === 0
      ? `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">👥</div><h4>Nenhum cliente encontrado</h4>
               <p>Cadastre clientes ou compartilhe seu link de anamnese</p>
               <button class="btn btn-primary" id="btn-add-client-empty">+ Adicionar Cliente</button></div></td></tr>`
      : list.map(c => {
        const name = c.nome || c.name || '—';
        const phone = c.telefone || c.phone || '—';
        const city = c.cidade || c.city || '—';
        return `
        <tr class="client-row" data-id="${c.id}" style="cursor:pointer" title="Ver ficha completa">
          <td><div class="client-name-cell">
            <div class="client-avatar-sm">${getInitials(name)}</div>
            <div><div style="font-weight:600">${name} ${c.tipo_cadastro === 'preferencial' ? '🛍️' : c.tipo_cadastro === 'consultora' ? '💼' : ''}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${c.email || ''}</div></div>
          </div></td>
          <td>${phone}</td>
          <td>${c.genero === 'masculino' ? '♂ Masc.' : '♀ Fem.'}</td>
          <td>${formatDate(c.data_nascimento || c.birthdate) || '—'}</td>
          <td>${city}</td>
          <td><span class="status-badge status-${c.status || 'active'}">${{ active: 'Ativo', inactive: 'Inativo' }[c.status] || 'Ativo'}</span></td>
          <td>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="btn btn-secondary btn-sm" data-action="anamnese" data-id="${c.id}" title="Ver anamnese">📋</button>
              <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${c.id}">✏️</button>
              <button class="btn btn-danger btn-sm" data-action="delete" data-id="${c.id}">🗑️</button>
            </div>
          </td>
        </tr>`;
      }).join('');

    // Pagination controls — use server-side totals
    const start = totalClients === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, totalClients);
    const paginationEl = pc.querySelector('#clients-pagination');
    if (paginationEl) {
      paginationEl.innerHTML = totalClients === 0 ? '' : `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;flex-wrap:wrap;gap:8px">
          <span style="font-size:0.82rem;color:var(--text-muted)">
            Mostrando <strong>${start}–${end}</strong> de <strong>${totalClients}</strong> cliente${totalClients !== 1 ? 's' : ''}
          </span>
          <div style="display:flex;align-items:center;gap:8px">
            <button class="btn btn-secondary btn-sm" id="pg-prev" ${currentPage <= 1 ? 'disabled' : ''}>‹ Anterior</button>
            <span style="font-size:0.82rem;font-weight:600;color:var(--text-dark)">Página ${currentPage} / ${totalPages}</span>
            <button class="btn btn-secondary btn-sm" id="pg-next" ${currentPage >= totalPages ? 'disabled' : ''}>Próxima ›</button>
          </div>
        </div>`;
      paginationEl.querySelector('#pg-prev')?.addEventListener('click', () => { currentPage--; refresh(false); });
      paginationEl.querySelector('#pg-next')?.addEventListener('click', () => { currentPage++; refresh(false); });
    }

    bindTableActions();
    const emptyBtn = pc.querySelector('#btn-add-client-empty');
    if (emptyBtn) emptyBtn.addEventListener('click', () => showClientModal());
  }

  function bindTableActions() {
    const pc = document.getElementById('page-content');
    if (!pc) return;
    pc.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const client = clients.find(c => c.id === btn.dataset.id);
        if (btn.dataset.action === 'edit') showClientModal(client);
        if (btn.dataset.action === 'delete') {
          const clientName = client?.nome || client?.name || 'este cliente';
          modal('Arquivar Cliente', `
            <div style="text-align:center;padding:8px 0 16px">
              <div style="font-size:2.5rem;margin-bottom:8px">🗂️</div>
              <p style="font-size:0.95rem;color:#374151;margin-bottom:12px">
                Você está prestes a arquivar o cliente:
              </p>
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;
                          padding:10px 16px;margin-bottom:16px">
                <strong style="font-size:1.05rem;color:#b91c1c">${clientName}</strong>
              </div>
              <p style="font-size:0.82rem;color:#6b7280;line-height:1.5;margin-bottom:8px">
                O cliente será marcado como <strong>arquivado</strong> e ocultado das listas ativas.<br>
                Você poderá recuperá-lo a qualquer momento editando seu cadastro e alterando o status.
              </p>
              <details style="cursor:pointer;margin-top:8px">
                <summary style="font-size:0.78rem;color:#ef4444;font-weight:600">
                  ⚠️ Quero excluir permanentemente (sem recuperação)
                </summary>
                <div style="margin-top:10px;padding:10px;background:#fef2f2;border-radius:8px;border:1px solid #fca5a5">
                  <p style="font-size:0.78rem;color:#7f1d1d;margin-bottom:10px">
                    Esta ação é <strong>irreversível</strong>. Todos os dados, anamneses e histórico serão perdidos.
                  </p>
                  <button class="btn btn-danger btn-sm" id="btn-hard-delete" style="width:100%;font-weight:700">
                    🗑️ Excluir Permanentemente
                  </button>
                </div>
              </details>
            </div>
          `, {
            confirmLabel: '🗂️ Arquivar',
            onOpen: () => {
              document.getElementById('btn-hard-delete')?.addEventListener('click', async () => {
                try {
                  await store.deleteClientHard(client.id);
                  toast(`${clientName} excluído permanentemente.`, 'warning');
                  await refresh();
                  // close modal
                  document.querySelector('[data-close]')?.click();
                } catch (e) {
                  toast('Erro ao excluir: ' + e.message, 'error');
                }
              });
            },
            onConfirm: async () => {
              try {
                await store.deleteClient(client.id);
                toast(`${clientName} arquivado. Você pode reativá-lo a qualquer momento.`, 'warning');
                await refresh();
              } catch (e) {
                toast('Erro ao arquivar: ' + e.message, 'error');
              }
            }
          });
        }

        if (btn.dataset.action === 'anamnese') {
          showAnamneseModal(client, router);
        }
      });
    });

    // Row click
    pc.querySelectorAll('.client-row').forEach(row => {
      row.addEventListener('click', e => {
        if (e.target.closest('.btn')) return; // Ignore action buttons
        const client = clients.find(c => c.id === row.dataset.id);
        if (client) openClientOffcanvas(client);
      });
    });
  }

  async function showAnamneseModal(client, router) {
    // Fetch anamneses directly by client ID (includes filled generic copies)
    const anamneses = await store.getClientAnamneses(client.id).catch(() => []);
    if (anamneses.length === 0) {
      modal('Anamneses de ' + client.name, `
        <div class="empty-state" style="padding:20px 0">
          <div class="empty-state-icon">📋</div>
          <h4>Nenhuma anamnese encontrada</h4>
          <p>Este cliente ainda não preencheu a ficha de anamnese.</p>
        </div>`);
      return;
    }
    const a = anamneses[0]; // most recent filled
    const dados = a.dados || {};
    const symptoms = [
      ...(dados.general_symptoms || []),
      ...(dados.emotional_symptoms || []),
      ...(dados.digestive_symptoms || []),
      ...(dados.sleep_symptoms || []),
    ];
    const { el } = modal('📋 Anamnese — ' + client.name, `
      <div style="max-height:400px;overflow-y:auto">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
          <div style="font-size:0.85rem"><strong>E-mail:</strong> ${client.email || '—'}</div>
          <div style="font-size:0.85rem"><strong>WhatsApp:</strong> ${client.phone || '—'}</div>
          <div style="font-size:0.85rem"><strong>Nascimento:</strong> ${formatDate(client.birthdate)}</div>
          <div style="font-size:0.85rem"><strong>Cidade:</strong> ${client.city || '—'}</div>
        </div>
        <div style="margin-bottom:12px">
          <strong style="font-size:0.85rem">Queixa principal:</strong>
          <p style="font-size:0.85rem;color:var(--text-body);margin-top:4px">${dados.main_complaint || '—'}</p>
        </div>
        <div style="margin-bottom:12px">
          <strong style="font-size:0.85rem">Sintomas relatados:</strong>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">
            ${symptoms.slice(0, 12).map(s => `<span class="report-tag" style="font-size:0.72rem">${s}</span>`).join('') || '—'}
          </div>
        </div>
        <div style="margin-bottom:12px">
          <strong style="font-size:0.85rem">Objetivos:</strong>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">
            ${(dados.goals || []).map(g => `<span class="report-tag" style="font-size:0.72rem;background:#dcfce7;color:#166534">${g}</span>`).join('') || '—'}
          </div>
        </div>
        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:8px">
          Preenchida em: ${formatDate(a.criado_em)}
        </div>
      </div>`, {
      confirmLabel: '🌿 Ver Protocolo',
      onConfirm: () => {
        const consultant = auth.current;
        const encoded = encodeURIComponent(JSON.stringify({
          answers: dados,
          consultant: { name: consultant?.nome || consultant?.name, phone: consultant?.telefone || consultant?.phone, genero: consultant?.genero },
          clientName: client.name,
          clientMessage: client.protocolo_mensagem
        }));
        router.navigate('/protocolo', { data: encoded });
      }
    });
  }


  function buildPage() {
    const pc = document.getElementById('page-content');
    if (!pc) return;
    pc.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <div class="tab-bar" style="margin:0">
              ${['all', 'active', 'inactive'].map(s => `
                <button class="tab-btn ${filter === s ? 'active' : ''}" data-filter="${s}">
                  ${s === 'all' ? 'Todos 👥' : s === 'active' ? 'Ativos 🟢' : 'Inativos 🔴'}
                </button>`).join('')}
            </div>
            
            <select class="field-input" id="filter-tipo" style="width:160px;padding:8px 12px;cursor:pointer">
              <option value="all">Tipos (Todos)</option>
              <option value="lead">Prospectos (Leads)</option>
              <option value="preferencial">🛍️ Preferenciais</option>
              <option value="consultora">💼 Consultoras</option>
            </select>

            <select class="field-input" id="filter-sort" style="width:160px;padding:8px 12px;cursor:pointer">
              <option value="name">A-Z (Nome)</option>
              <option value="recent">Mais Recentes</option>
              <option value="oldest">Mais Antigos</option>
            </select>

            <input class="field-input" id="search-input" placeholder="🔍 Buscar cliente..." style="width:200px;padding:8px 12px" />
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary" id="btn-import-csv">📥 Importar CSV</button>
            <button class="btn btn-primary" id="btn-add-client">+ Novo Cliente</button>
          </div>
        </div>
        <div class="card">
          <div style="overflow-x:auto">
            <table class="clients-table">
              <thead><tr>
                <th>Cliente</th><th>WhatsApp</th><th>Gênero</th><th>Nascimento</th><th>Cidade</th><th>Status</th><th>Ações</th>
              </tr></thead>
              <tbody id="clients-tbody"></tbody>
            </table>
          </div>
          <div id="clients-pagination"></div>
        </div>`;


    renderTable();
    pc.querySelector('#btn-add-client').addEventListener('click', () => showClientModal());
    pc.querySelector('#btn-import-csv').addEventListener('click', () => showImportModal());
    pc.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        filter = btn.dataset.filter;
        pc.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
        renderTable();
      });
    });

    // Novo listener pro Tipo de Cadastro (local filter on current page)
    const selectTipo = pc.querySelector('#filter-tipo');
    selectTipo.value = tipoFilter;
    selectTipo.addEventListener('change', e => {
      tipoFilter = e.target.value;
      renderTable();
    });

    // Novo listener pra Ordenação (local sort on current page)
    const selectSort = pc.querySelector('#filter-sort');
    selectSort.value = sortOrder;
    selectSort.addEventListener('change', e => {
      sortOrder = e.target.value;
      renderTable();
    });

    // Debounced server-side search (300ms)
    pc.querySelector('#search-input').addEventListener('input', e => {
      search = e.target.value;
      clearTimeout(_searchTimer);
      _searchTimer = setTimeout(() => refresh(), 300);
    });
  }

  function showClientModal(client = null) {
    const id = client?.id;

    // Banner shown only for existing clients — allows opening their anamnese
    const anamneseBanner = client ? `
      <div id="anamnese-banner" style="display:flex;align-items:center;justify-content:space-between;
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
      </div>` : '';

    const { el } = modal(client ? 'Editar Cliente' : 'Novo Cliente', `
      ${anamneseBanner}
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Nome completo *</label>
          <input class="field-input" id="m-name" value="${client?.name || ''}" placeholder="Nome do cliente" />
        </div>
        <div class="form-group">
          <label class="field-label">E-mail</label>
          <input class="field-input" id="m-email" type="email" value="${client?.email || ''}" placeholder="email@exemplo.com" />
        </div>
        <div class="form-group">
          <label class="field-label">WhatsApp</label>
          <input class="field-input" id="m-phone" value="${client?.phone || ''}" placeholder="55119..." />
        </div>
        <div class="form-group">
          <label class="field-label">Data de Nascimento</label>
          <input class="field-input" id="m-birthdate" type="date" value="${client?.birthdate || ''}" />
        </div>
        <div class="form-group">
          <label class="field-label">Cidade</label>
          <input class="field-input" id="m-city" value="${client?.city || ''}" />
        </div>
        <div class="form-group">
          <label class="field-label">Gênero</label>
          <select class="field-select" id="m-genero">
            <option value="feminino" ${(!client?.genero || client?.genero === 'feminino') ? 'selected' : ''}>♀ Feminino</option>
            <option value="masculino" ${client?.genero === 'masculino' ? 'selected' : ''}>♂ Masculino</option>
          </select>
        </div>
        <div class="form-group">
          <label class="field-label">Status</label>
          <select class="field-select" id="m-status">
            <option value="active" ${(client?.status === 'active' || !client?.status) ? 'selected' : ''}>Ativo 🟢</option>
            <option value="inactive" ${client?.status === 'inactive' ? 'selected' : ''}>Inativo 🔴</option>
          </select>
        </div>
        <div class="form-group form-field-full">
          <label class="field-label" style="display:flex;align-items:center;gap:6px">
             <span>Mensagem no Protocolo (Visível ao Cliente)</span> <span style="font-size:0.8rem">🌿</span>
          </label>
          <textarea class="field-textarea" id="m-protocolo-mensagem" placeholder="Digite uma mensagem ou recomendação personalizada que aparecerá em destaque no protocolo online gerado..." style="min-height:80px;border-color:#16a34a">${client?.protocolo_mensagem || ''}</textarea>
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Observações Internas</label>
          <textarea class="field-textarea" id="m-notes">${client?.notes || ''}</textarea>
        </div>
      </div>`, {
      confirmLabel: client ? 'Salvar' : 'Adicionar',
      onConfirm: async () => {
        const data = {
          name: document.getElementById('m-name').value.trim(),
          email: document.getElementById('m-email').value.trim(),
          phone: document.getElementById('m-phone').value.trim(),
          birthdate: document.getElementById('m-birthdate').value,
          city: document.getElementById('m-city').value.trim(),
          genero: document.getElementById('m-genero').value,
          status: document.getElementById('m-status').value,
          protocolo_mensagem: document.getElementById('m-protocolo-mensagem').value.trim(),
          notes: document.getElementById('m-notes').value.trim(),
        };
        if (!data.name) { toast('Nome é obrigatório', 'error'); return; }
        try {
          if (id) { await store.updateClient(id, data); toast('Cliente atualizado! ✅'); }
          else { await store.addClient(data); toast('Cliente adicionado! 🌿'); }
          await refresh();
        } catch (err) {
          toast('Erro: ' + err.message, 'error');
        }
      }
    });

    // Anamnese banner click handler
    el?.querySelector('#anamnese-banner')?.addEventListener('click', () => {
      // Close this modal, then open anamnese view
      el.querySelector('[data-close]')?.click();
      setTimeout(() => showAnamneseModal(client, router), 200);
    });
  }

  // ── CSV Import Modal ───────────────────────────────────────
  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = lines[0].split(',').map(h => h.trim().replace(/["']/g, ''));
    const rows = lines.slice(1).map(line => {
      const cols = [];
      let cur = ''; let inQ = false;
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ; }
        else if (ch === ',' && !inQ) { cols.push(cur.trim().replace(/^"|"$/g, '')); cur = ''; }
        else cur += ch;
      }
      cols.push(cur.trim().replace(/^"|"$/g, ''));
      return cols;
    }).filter(row => row.some(v => v));
    return { headers, rows };
  }

  function downloadTemplate() {
    const header = 'nome,email,telefone,data_nascimento,cidade,genero,status,notas';
    const ex = 'Maria Silva,maria@email.com,5511999999999,1990-05-15,São Paulo,feminino,ativo,Cliente VIP';
    const blob = new Blob([header + '\\n' + ex], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'modelo_importacao_clientes.csv';
    a.click();
  }

  function showImportModal() {
    let parsedCsv = { headers: [], rows: [] };
    let mapping = { name: -1, email: -1, phone: -1, birthdate: -1, city: -1, gender: -1, status: -1, notes: -1 };
    
    function autoMapHeaders() {
      const h = parsedCsv.headers.map(x => x.toLowerCase());
      mapping.name = h.findIndex(x => x.includes('nome') || x.includes('name') || x === 'cliente');
      mapping.email = h.findIndex(x => x.includes('email') || x.includes('e-mail'));
      mapping.phone = h.findIndex(x => x.includes('telefone') || x.includes('celular') || x.includes('phone') || x.includes('whatsapp'));
      mapping.birthdate = h.findIndex(x => x.includes('nasc') || x.includes('birth'));
      mapping.city = h.findIndex(x => x.includes('cidade') || x.includes('city'));
      mapping.gender = h.findIndex(x => x.includes('genero') || x.includes('sexo'));
      mapping.status = h.findIndex(x => x.includes('status') || x.includes('ativo'));
      mapping.notes = h.findIndex(x => x.includes('nota') || x.includes('obs'));
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:750px">
        <div class="modal-header">
          <h3>📥 Importar Clientes via CSV</h3>
          <button class="modal-close" id="import-close">✕</button>
        </div>
        <div class="modal-body">

          <!-- Step 1: Upload -->
          <div id="import-step1">
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px;margin-bottom:20px">
              <p style="font-weight:700;color:#166534;margin-bottom:8px">📋 Como importar:</p>
              <ol style="color:#166534;font-size:0.85rem;padding-left:18px;line-height:1.9">
                <li>Baixe o modelo CSV ou use sua própria planilha salva como .csv</li>
                <li>Na próxima tela, você vinculará suas colunas com os campos do sistema</li>
                <li>Máximo 500 clientes por vez</li>
              </ol>
              <button class="btn btn-secondary btn-sm" id="btn-download-template" style="margin-top:10px">⬇️ Baixar Modelo CSV</button>
            </div>

            <div id="drop-zone" style="display:block;border:2px dashed var(--green-300);border-radius:12px;
              padding:50px 20px;text-align:center;cursor:pointer;transition:all .2s;
              background:var(--green-50);color:var(--text-muted)">
              <div style="font-size:2.5rem;margin-bottom:8px">📁</div>
              <div style="font-size:0.95rem;font-weight:600">Clique ou arraste seu arquivo CSV aqui</div>
              <div style="font-size:0.78rem;margin-top:4px">Separado por vírgulas (.csv UTF-8)</div>
              <input type="file" id="csv-file-input" accept=".csv,text/csv" style="display:none" />
            </div>
          </div>

          <!-- Step 2: Mapping & Preview -->
          <div id="import-step2" style="display:none">
            
            <div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:16px">
              <h4 style="font-size:0.9rem;margin:0 0 12px 0">1. Vincule as colunas do seu arquivo</h4>
              <div class="form-grid" style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px;">
                <div class="form-group mb-0"><label class="field-label" style="font-size:0.75rem">Nome *</label><select id="map-name" class="field-select map-select"></select></div>
                <div class="form-group mb-0"><label class="field-label" style="font-size:0.75rem">E-mail</label><select id="map-email" class="field-select map-select"></select></div>
                <div class="form-group mb-0"><label class="field-label" style="font-size:0.75rem">Telefone</label><select id="map-phone" class="field-select map-select"></select></div>
                <div class="form-group mb-0"><label class="field-label" style="font-size:0.75rem">Nascimento</label><select id="map-birthdate" class="field-select map-select"></select></div>
                <div class="form-group mb-0"><label class="field-label" style="font-size:0.75rem">Cidade</label><select id="map-city" class="field-select map-select"></select></div>
                <div class="form-group mb-0"><label class="field-label" style="font-size:0.75rem">Gênero</label><select id="map-gender" class="field-select map-select"></select></div>
              </div>
            </div>

            <h4 style="font-size:0.9rem;margin:0 0 8px 0;display:flex;justify-content:space-between">
               2. Preview dos Dados <span id="import-stats" style="font-weight:normal;font-size:0.8rem;color:var(--text-muted)"></span>
            </h4>
            <div class="table-wrapper" style="max-height:260px;border:1px solid var(--border);border-radius:8px">
              <table class="clients-table" id="preview-table" style="min-width:650px;margin:0;border:none">
                <thead style="position:sticky;top:0;z-index:1;background:#f8fafc"><tr>
                  <th style="width:40px">#</th><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Nascimento</th><th>Cidade</th>
                </tr></thead>
                <tbody id="preview-tbody"></tbody>
              </table>
            </div>
            
            <button class="btn btn-secondary btn-sm" id="btn-change-file" style="margin-top:16px">🔄 Trocar arquivo</button>
          </div>

          <!-- Step 3: Result -->
          <div id="import-step3" style="display:none;text-align:center;padding:20px"></div>

        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="import-cancel">Cancelar</button>
          <button class="btn btn-primary" id="btn-do-import" disabled style="min-width:130px">📥 Importar</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    const closeModal = () => overlay.remove();
    overlay.querySelector('#import-close').addEventListener('click', closeModal);
    overlay.querySelector('#import-cancel').addEventListener('click', closeModal);
    overlay.querySelector('#btn-download-template').addEventListener('click', downloadTemplate);

    // File handling
    const fileInput = overlay.querySelector('#csv-file-input');
    const dropZone = overlay.querySelector('#drop-zone');

    function handleFile(file) {
      if (!file || !file.name.toLowerCase().endsWith('.csv')) { toast('Use um arquivo .csv', 'error'); return; }
      const reader = new FileReader();
      reader.onload = e => {
        parsedCsv = parseCSV(e.target.result);
        if (parsedCsv.rows.length === 0) { toast('Arquivo vazio ou inválido', 'error'); return; }
        autoMapHeaders();
        initMappingUI();
        showPreview();
      };
      reader.readAsText(file, 'UTF-8');
    }

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => handleFile(e.target.files[0]));
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = 'var(--green-500)'; dropZone.style.background = 'var(--green-100)'; });
    dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = ''; dropZone.style.background = ''; });
    dropZone.addEventListener('drop', e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); });

    function initMappingUI() {
      const optionsStr = '<option value="-1">-- Ignorar --</option>' + parsedCsv.headers.map((h, i) => `<option value="${i}">${h}</option>`).join('');
      ['name', 'email', 'phone', 'birthdate', 'city', 'gender'].forEach(key => {
        const sel = overlay.querySelector('#map-' + key);
        sel.innerHTML = optionsStr;
        sel.value = mapping[key];
        sel.addEventListener('change', e => {
          mapping[key] = parseInt(e.target.value, 10);
          updatePreviewTable();
        });
      });
    }

    function updatePreviewTable() {
      // Build final objects to check validity
      const finalData = parsedCsv.rows.map(row => ({
        nome: mapping.name >= 0 ? row[mapping.name] : '',
        email: mapping.email >= 0 ? row[mapping.email] : '',
        telefone: mapping.phone >= 0 ? row[mapping.phone] : '',
        data_nascimento: mapping.birthdate >= 0 ? row[mapping.birthdate] : '',
        cidade: mapping.city >= 0 ? row[mapping.city] : '',
        genero: mapping.gender >= 0 ? row[mapping.gender] : '',
      }));

      const semNome = finalData.filter(r => !r.nome?.trim()).length;
      overlay.querySelector('#import-stats').innerHTML = 
        `Listando ${parsedCsv.rows.length} linhas ${semNome > 0 ? `<span style="color:#dc2626;font-weight:600">(${semNome} com erro)</span>` : ''}`;

      // Enable import button only if valid
      overlay.querySelector('#btn-do-import').disabled = (mapping.name === -1);

      overlay.querySelector('#preview-tbody').innerHTML = finalData.slice(0, 8).map((r, i) => {
        const hasNome = !!r.nome?.trim();
        return `<tr style="${!hasNome ? 'background:#fff1f2' : ''}">
          <td style="font-size:0.75rem;color:var(--text-muted)">${i + 2}</td>
          <td style="font-weight:${hasNome ? '600' : 'normal'};color:${hasNome ? 'inherit' : '#dc2626'}">${r.nome || 'Nome vazio!'}</td>
          <td style="font-size:0.8rem">${r.email || '—'}</td>
          <td style="font-size:0.8rem">${r.telefone || '—'}</td>
          <td style="font-size:0.8rem">${r.data_nascimento || '—'}</td>
          <td style="font-size:0.8rem">${r.cidade || '—'}</td>
        </tr>`;
      }).join('');
      
      if (parsedCsv.rows.length > 8) {
        overlay.querySelector('#preview-tbody').innerHTML += `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);font-size:0.8rem;padding:10px">... e mais ${parsedCsv.rows.length - 8} clientes</td></tr>`;
      }
    }

    function showPreview() {
      overlay.querySelector('#import-step1').style.display = 'none';
      overlay.querySelector('#import-step2').style.display = 'block';
      updatePreviewTable();
    }

    overlay.querySelector('#btn-change-file').addEventListener('click', () => {
      overlay.querySelector('#import-step1').style.display = 'block';
      overlay.querySelector('#import-step2').style.display = 'none';
      overlay.querySelector('#btn-do-import').disabled = true;
      parsedCsv = { headers: [], rows: [] }; fileInput.value = '';
    });

    // Import
    overlay.querySelector('#btn-do-import').addEventListener('click', async () => {
      const btn = overlay.querySelector('#btn-do-import');
      btn.disabled = true; btn.textContent = '⏳ Importando...';
      try {
        const finalData = parsedCsv.rows.map(row => ({
          nome: mapping.name >= 0 ? row[mapping.name] : '',
          email: mapping.email >= 0 ? row[mapping.email] : undefined,
          telefone: mapping.phone >= 0 ? row[mapping.phone] : undefined,
          data_nascimento: mapping.birthdate >= 0 ? row[mapping.birthdate] : undefined,
          cidade: mapping.city >= 0 ? row[mapping.city] : undefined,
          genero: mapping.gender >= 0 ? row[mapping.gender] : undefined,
          status: 'ativo'
        })).filter(r => !!r.nome?.trim()); // Drop empty names

        const { api } = await import('../store.js').then(m => ({ api: m.api }));
        const res = await api('POST', '/api/clientes/import', { clientes: finalData });
        
        overlay.querySelector('#import-step2').style.display = 'none';
        overlay.querySelector('#import-step3').style.display = 'block';
        overlay.querySelector('#import-step3').innerHTML = `
          <div style="font-size:3rem;margin-bottom:12px">✅</div>
          <h3 style="color:#16a34a;margin-bottom:16px">Importação concluída!</h3>
          <div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap;margin-bottom:20px">
            <div style="text-align:center">
              <div style="font-size:2rem;font-weight:800;color:#16a34a">${res.criados}</div>
              <div style="font-size:0.8rem;color:var(--text-muted)">Criados</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:2rem;font-weight:800;color:#d97706">${res.pulados}</div>
              <div style="font-size:0.8rem;color:var(--text-muted)">Pulados (duplicados)</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:2rem;font-weight:800;color:#dc2626">${res.erros?.length || 0}</div>
              <div style="font-size:0.8rem;color:var(--text-muted)">Erros</div>
            </div>
          </div>
          ${res.erros?.length ? `<details style="text-align:left;font-size:0.8rem"><summary style="cursor:pointer;color:var(--text-muted)">Ver erros</summary><pre style="background:#f8f9fa;padding:10px;border-radius:6px;overflow:auto;margin-top:8px">${res.erros.map(e => `Linha ${e.linha}: ${e.erro}`).join('\n')}</pre></details>` : ''}`;
        
        overlay.querySelector('#import-cancel').textContent = 'Fechar';
        overlay.querySelector('#btn-do-import').style.display = 'none';
        await refresh();
      } catch (err) {
        toast('Erro na importação: ' + err.message, 'error');
        btn.disabled = false; btn.textContent = '📥 Fazendo Importação Novamente';
      }
    });
  }

  await refresh();
  buildPage();
}
