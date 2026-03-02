import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { formatDate, getInitials, toast, modal } from '../utils.js';

let cachedAnamneses = null; // lazy-load once per session

export async function renderClients(router) {
  // Render layout immediately with loading
  renderLayout(router, 'Clientes', `
      <div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando clientes...</div>
    `, 'clients');

  let clients = [];
  let filter = 'all';
  let search = '';

  async function refresh() {
    clients = await store.getClients().catch(() => []);
    renderTable();
  }

  function filtered() {
    return clients.filter(c => {
      const matchStatus = filter === 'all' || c.status === filter;
      const q = search.toLowerCase();
      const matchSearch = !q
        || (c.name || '').toLowerCase().includes(q)
        || (c.email || '').toLowerCase().includes(q)
        || (c.phone || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }

  function renderTable() {
    const pc = document.getElementById('page-content');
    if (!pc) return;
    const list = filtered();
    const tbody = pc.querySelector('#clients-tbody');
    if (!tbody) { buildPage(); return; }
    tbody.innerHTML = list.length === 0
      ? `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">👥</div><h4>Nenhum cliente encontrado</h4>
               <p>Cadastre clientes ou compartilhe seu link de anamnese</p>
               <button class="btn btn-primary" id="btn-add-client-empty">+ Adicionar Cliente</button></div></td></tr>`
      : list.map(c => `
        <tr>
          <td><div class="client-name-cell">
            <div class="client-avatar-sm">${getInitials(c.name || '?')}</div>
            <div><div style="font-weight:600">${c.name || '—'}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${c.email || ''}</div></div>
          </div></td>
          <td>${c.phone || '—'}</td>
          <td>${c.genero === 'masculino' ? '♂ Masc.' : '♀ Fem.'}</td>
          <td>${formatDate(c.birthdate) || '—'}</td>
          <td>${c.city || '—'}</td>
          <td><span class="status-badge status-${c.status || 'active'}">${{ active: 'Ativo', inactive: 'Inativo' }[c.status] || 'Ativo'}</span></td>
          <td>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="btn btn-secondary btn-sm" data-action="anamnese" data-id="${c.id}" title="Ver anamnese">📋</button>
              <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${c.id}">✏️</button>
              <button class="btn btn-danger btn-sm" data-action="delete" data-id="${c.id}">🗑️</button>
            </div>
          </td>
        </tr>`).join('');

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
          modal('Remover Cliente', `<p>Deseja remover <strong>${client?.name}</strong>?</p>`, {
            confirmLabel: 'Remover', confirmClass: 'btn-danger',
            onConfirm: async () => {
              await store.deleteClient(client.id).catch(() => { });
              toast('Cliente removido.', 'warning');
              await refresh();
            }
          });
        }
        if (btn.dataset.action === 'anamnese') {
          showAnamneseModal(client, router);
        }
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
          clientName: client.name
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
            <input class="field-input" id="search-input" placeholder="🔍 Buscar cliente..." style="width:220px;padding:8px 12px" />
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
    pc.querySelector('#search-input').addEventListener('input', e => { search = e.target.value; renderTable(); });
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
          <label class="field-label">Observações</label>
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
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    return lines.slice(1).map(line => {
      // Handle quoted fields
      const cols = [];
      let cur = ''; let inQ = false;
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ; }
        else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      cols.push(cur.trim());
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (cols[i] || '').replace(/^"|"$/g, ''); });
      return obj;
    }).filter(row => Object.values(row).some(v => v));
  }

  function downloadTemplate() {
    const header = 'nome,email,telefone,data_nascimento,cidade,genero,status,notas';
    const ex = 'Maria Silva,maria@email.com,5511999999999,1990-05-15,São Paulo,feminino,ativo,Cliente VIP';
    const blob = new Blob([header + '\n' + ex], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'modelo_importacao_clientes.csv';
    a.click();
  }

  function showImportModal() {
    let parsed = [];
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:680px">
        <div class="modal-header">
          <h3>📥 Importar Clientes via CSV</h3>
          <button class="modal-close" id="import-close">✕</button>
        </div>
        <div class="modal-body">

          <!-- Step 1: Instructions + download -->
          <div id="import-step1">
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px;margin-bottom:20px">
              <p style="font-weight:700;color:#166534;margin-bottom:8px">📋 Como importar:</p>
              <ol style="color:#166534;font-size:0.85rem;padding-left:18px;line-height:1.9">
                <li>Baixe o modelo CSV abaixo</li>
                <li>Preencha com seus clientes (máximo 500 por vez)</li>
                <li>Suba o arquivo aqui e confira o preview</li>
                <li>Clique em <strong>Importar</strong></li>
              </ol>
              <button class="btn btn-secondary btn-sm" id="btn-download-template" style="margin-top:10px">⬇️ Baixar Modelo CSV</button>
            </div>

            <!-- Colunas aceitas -->
            <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:16px">
              <strong>Colunas aceitas:</strong> nome* · email · telefone · data_nascimento (AAAA-MM-DD) · cidade · genero (feminino/masculino) · status (ativo/inativo) · notas
            </div>

            <!-- Drop zone -->
            <div id="drop-zone" style="display:block;border:2px dashed var(--green-300);border-radius:12px;
              padding:40px;text-align:center;cursor:pointer;transition:all .2s;
              background:var(--green-50);color:var(--text-muted)">
              <div style="font-size:2.5rem;margin-bottom:8px">📁</div>
              <div style="font-size:0.95rem;font-weight:600">Clique ou arraste seu arquivo CSV aqui</div>
              <div style="font-size:0.78rem;margin-top:4px">Formatos: .csv (UTF-8)</div>
              <input type="file" id="csv-file-input" accept=".csv,text/csv" style="display:none" />
            </div>
          </div>

          <!-- Step 2: Preview -->
          <div id="import-step2" style="display:none">
            <div id="import-stats" style="margin-bottom:12px"></div>
            <div style="max-height:280px;overflow:auto;border:1px solid var(--border);border-radius:8px">
              <table class="clients-table" id="preview-table" style="min-width:500px">
                <thead><tr>
                  <th>#</th><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Cidade</th><th>Status</th>
                </tr></thead>
                <tbody id="preview-tbody"></tbody>
              </table>
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-change-file" style="margin-top:10px">🔄 Trocar arquivo</button>
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
        parsed = parseCSV(e.target.result);
        if (parsed.length === 0) { toast('Arquivo vazio ou inválido', 'error'); return; }
        showPreview();
      };
      reader.readAsText(file, 'UTF-8');
    }

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => handleFile(e.target.files[0]));
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = 'var(--green-500)'; dropZone.style.background = 'var(--green-100)'; });
    dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = ''; dropZone.style.background = ''; });
    dropZone.addEventListener('drop', e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); });

    function showPreview() {
      overlay.querySelector('#import-step1').style.display = 'none';
      overlay.querySelector('#import-step2').style.display = 'block';
      overlay.querySelector('#btn-do-import').disabled = false;

      const semNome = parsed.filter(r => !(r.nome || r.name || '').trim()).length;
      const stats = overlay.querySelector('#import-stats');
      stats.innerHTML = `
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <span style="background:#d1fae5;color:#065f46;padding:4px 12px;border-radius:20px;font-size:0.82rem;font-weight:600">✅ ${parsed.length} clientes encontrados</span>
          ${semNome ? `<span style="background:#fee2e2;color:#991b1b;padding:4px 12px;border-radius:20px;font-size:0.82rem;font-weight:600">⚠️ ${semNome} sem nome (serão ignorados)</span>` : ''}
        </div>`;

      const tbody = overlay.querySelector('#preview-tbody');
      tbody.innerHTML = parsed.slice(0, 8).map((r, i) => {
        const nome = r.nome || r.name || '—';
        const valido = !!nome.trim() && nome !== '—';
        return `<tr style="${!valido ? 'background:#fff1f2' : ''}">
          <td style="font-size:0.75rem;color:var(--text-muted)">${i + 2}</td>
          <td style="font-weight:${valido ? '600' : 'normal'};color:${valido ? 'inherit' : '#dc2626'}">${nome}</td>
          <td style="font-size:0.8rem">${r.email || '—'}</td>
          <td style="font-size:0.8rem">${r.telefone || r.phone || '—'}</td>
          <td style="font-size:0.8rem">${r.cidade || r.city || '—'}</td>
          <td><span class="status-badge status-${(r.status || 'ativo').toLowerCase() === 'inativo' ? 'inactive' : 'active'}" style="font-size:0.7rem">${(r.status || 'ativo').toLowerCase() === 'inativo' ? 'Inativo' : 'Ativo'}</span></td>
        </tr>`;
      }).join('');
      if (parsed.length > 8) {
        tbody.innerHTML += `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);font-size:0.8rem;padding:10px">... e mais ${parsed.length - 8} clientes</td></tr>`;
      }
    }

    overlay.querySelector('#btn-change-file').addEventListener('click', () => {
      overlay.querySelector('#import-step1').style.display = 'block';
      overlay.querySelector('#import-step2').style.display = 'none';
      overlay.querySelector('#btn-do-import').disabled = true;
      parsed = []; fileInput.value = '';
    });

    // Import
    overlay.querySelector('#btn-do-import').addEventListener('click', async () => {
      const btn = overlay.querySelector('#btn-do-import');
      btn.disabled = true; btn.textContent = '⏳ Importando...';
      try {
        const { api } = await import('../store.js').then(m => ({ api: m.api }));
        const res = await api('POST', '/api/clientes/import', { clientes: parsed });
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
        btn.disabled = false; btn.textContent = '📥 Importar';
      }
    });
  }

  await refresh();
  buildPage();
}
