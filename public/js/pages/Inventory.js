import { store } from '../store.js';
import { toast, escapeHTML } from '../utils.js';
import { doterraProducts } from '../utils/doterraProducts.js';
import { renderLayout } from './Dashboard.js';

export async function renderInventory(router) {
    const pageContent = `
        <div class="header-basic" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:24px;">
            <div>
                <h1 class="page-title">📦 Meu Estoque doTerra</h1>
                <p class="text-secondary">Gerencie seus produtos de forma prática e individual</p>
            </div>
            <button id="add-item-btn" class="btn btn-primary">+ Adicionar Produto</button>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px,1fr)); gap:16px; margin-bottom:24px;">
            <div class="card" style="text-align:center; padding:20px;">
                <div style="font-size:0.8rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:.5px;">Total em Prateleira</div>
                <div id="kpi-total-items" style="font-size:2.2rem; font-weight:800; color:var(--green-600); margin-top:4px;">0</div>
            </div>
            <div class="card" style="text-align:center; padding:20px; border-left: 4px solid #f59e0b;">
                <div style="font-size:0.8rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:.5px;">Baixo / Zerado</div>
                <div id="kpi-low-stock" style="font-size:2.2rem; font-weight:800; color:#f59e0b; margin-top:4px;">0</div>
            </div>
        </div>

        <div class="card p-0">
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Categoria</th>
                            <th>Tamanho</th>
                            <th>Notas / Lote</th>
                            <th style="text-align:center;">Qtd.</th>
                            <th style="text-align:center;">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="inventory-list">
                        <tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">Carregando estoque...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Modal -->
        <div class="modal-overlay" id="inventory-modal" style="display:none;">
            <div class="modal-content" style="max-width:480px; width:100%;">
                <div class="modal-header">
                    <h2 style="margin:0; font-size:1.1rem;">Registrar Produto</h2>
                    <button id="close-inventory-modal" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text-muted);">&times;</button>
                </div>
                <form id="inventory-form" style="padding:20px; display:flex; flex-direction:column; gap:14px;">
                    <div style="position:relative;">
                        <label class="form-label">Nome do Produto *</label>
                        <input type="text" id="inv-name" class="form-control" autocomplete="off" placeholder="Ex: Lavanda, On Guard, MetaPWR..." required>
                        <div id="autocomplete-results" style="position:absolute; left:0; right:0; z-index:999; background:white; border:1px solid var(--border); border-radius:8px; box-shadow:0 4px 20px rgba(0,0,0,0.12); max-height:220px; overflow-y:auto; display:none;"></div>
                    </div>
                    <div>
                        <label class="form-label">Categoria</label>
                        <select id="inv-category" class="form-control">
                            <option value="Óleo Essencial">Óleo Essencial (Single)</option>
                            <option value="Blend">Mix / Blend</option>
                            <option value="Roll-on (Touch)">Roll-on (Touch)</option>
                            <option value="Suplemento">Suplemento</option>
                            <option value="Personal Care">Cuidados Pessoais / Cosmético</option>
                            <option value="Kit">Kit Fechado</option>
                            <option value="Difusor">Difusor</option>
                            <option value="Acessório">Acessório</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <div>
                            <label class="form-label">Tamanho</label>
                            <select id="inv-size" class="form-control">
                                <option value="15ml">15ml</option>
                                <option value="5ml">5ml</option>
                                <option value="10ml Touch">10ml (Touch)</option>
                                <option value="Unidade">Unidade / Kit</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>
                        <div>
                            <label class="form-label">Qtd. de Entrada</label>
                            <input type="number" id="inv-qty" class="form-control" min="0" value="1" required>
                        </div>
                    </div>
                    <div>
                        <label class="form-label">Notas / Origem (Opcional)</label>
                        <input type="text" id="inv-notes" class="form-control" placeholder="Ex: LRP Março, BOGO, Kit Brasil">
                    </div>
                    <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:8px;">
                        <button type="button" class="btn btn-secondary" id="cancel-inventory-modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar no Estoque</button>
                    </div>
                </form>
            </div>
        </div>

        <style>
            .autocomplete-item {
                padding: 10px 14px;
                cursor: pointer;
                border-bottom: 1px solid var(--border);
                transition: background 0.1s;
            }
            .autocomplete-item:hover { background: var(--green-50); }
            .autocomplete-item:last-child { border-bottom: none; }
        </style>
    `;

    renderLayout(router, '📦 Meu Estoque', pageContent, 'estoque');

    // Get references AFTER renderLayout injects the DOM
    const main = document.getElementById('page-content');
    if (!main) return;

    const modal = document.getElementById('inventory-modal');
    const form = document.getElementById('inventory-form');
    const listEl = document.getElementById('inventory-list');
    const inputName = document.getElementById('inv-name');
    const inputCat = document.getElementById('inv-category');
    const autocompleteEl = document.getElementById('autocomplete-results');

    let inventory = [];

    // Modal open/close
    const openModal = () => {
        form.reset();
        document.getElementById('inv-qty').value = '1';
        autocompleteEl.style.display = 'none';
        modal.style.display = 'flex';
        setTimeout(() => inputName.focus(), 50);
    };
    const closeModal = () => { modal.style.display = 'none'; };

    document.getElementById('add-item-btn').onclick = openModal;
    document.getElementById('close-inventory-modal').onclick = closeModal;
    document.getElementById('cancel-inventory-modal').onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };

    // Autocomplete
    inputName.addEventListener('input', () => {
        const val = inputName.value.toLowerCase().trim();
        if (val.length < 2) { autocompleteEl.style.display = 'none'; return; }
        const matches = doterraProducts.filter(p => p.nome.toLowerCase().includes(val)).slice(0, 8);
        if (!matches.length) { autocompleteEl.style.display = 'none'; return; }
        autocompleteEl.innerHTML = matches.map(m => `
            <div class="autocomplete-item" data-name="${escapeHTML(m.nome)}" data-cat="${escapeHTML(m.categoria)}">
                <strong style="font-size:0.9rem;">${escapeHTML(m.nome)}</strong>
                <span style="font-size:0.75rem; color:var(--text-muted); margin-left:8px;">${escapeHTML(m.categoria)}</span>
            </div>
        `).join('');
        autocompleteEl.style.display = 'block';
    });

    autocompleteEl.addEventListener('click', (e) => {
        const item = e.target.closest('.autocomplete-item');
        if (!item) return;
        inputName.value = item.dataset.name;
        const catOpt = Array.from(inputCat.options).find(o => o.value === item.dataset.cat);
        if (catOpt) inputCat.value = item.dataset.cat;
        const sizeEl = document.getElementById('inv-size');
        if (item.dataset.cat.includes('Touch')) sizeEl.value = '10ml Touch';
        else if (['Difusor','Kit','Personal Care','Acessório'].includes(item.dataset.cat)) sizeEl.value = 'Unidade';
        else sizeEl.value = '15ml';
        autocompleteEl.style.display = 'none';
    });

    document.addEventListener('click', (e) => {
        if (!inputName.contains(e.target) && !autocompleteEl.contains(e.target)) {
            autocompleteEl.style.display = 'none';
        }
    });

    // Render table
    const renderTable = () => {
        if (!inventory.length) {
            listEl.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted);">Estoque vazio. Clique em "+ Adicionar Produto" para começar!</td></tr>`;
            document.getElementById('kpi-total-items').textContent = '0';
            document.getElementById('kpi-low-stock').textContent = '0';
            return;
        }
        let totalQtd = 0, lowCount = 0;
        listEl.innerHTML = inventory.map(item => {
            totalQtd += item.quantidade;
            if (item.quantidade <= 1) lowCount++;
            let badgeStyle = 'background:#dcfce7; color:#166534;';
            if (item.quantidade === 0) badgeStyle = 'background:#fee2e2; color:#991b1b;';
            else if (item.quantidade === 1) badgeStyle = 'background:#fef3c7; color:#92400e;';
            return `
            <tr>
                <td style="font-weight:600;">${escapeHTML(item.nome_produto)}</td>
                <td style="color:var(--text-muted); font-size:0.85rem;">${escapeHTML(item.categoria || '—')}</td>
                <td style="color:var(--text-muted); font-size:0.85rem;">${escapeHTML(item.ml_tamanho || '—')}</td>
                <td style="color:var(--text-muted); font-size:0.8rem; max-width:160px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHTML(item.notas || '')}">${escapeHTML(item.notas || '—')}</td>
                <td style="text-align:center;">
                    <span style="display:inline-block; ${badgeStyle} font-weight:700; font-size:1rem; padding:4px 14px; border-radius:20px;">${item.quantidade}</span>
                </td>
                <td>
                    <div style="display:flex; gap:6px; justify-content:center; align-items:center;">
                        <button class="btn btn-outline btn-sm action-btn" data-id="${item.id}" data-action="decrease" ${item.quantidade <= 0 ? 'disabled' : ''} title="Remover 1">−</button>
                        <button class="btn btn-outline btn-sm action-btn" data-id="${item.id}" data-action="increase" title="Adicionar 1">+</button>
                        <button class="btn btn-sm action-btn" data-id="${item.id}" data-action="delete" title="Apagar" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:1.1rem; padding:4px 8px;">🗑</button>
                    </div>
                </td>
            </tr>`;
        }).join('');
        document.getElementById('kpi-total-items').textContent = String(totalQtd);
        document.getElementById('kpi-low-stock').textContent = String(lowCount);
    };

    const loadData = async () => {
        try {
            inventory = await store.getEstoque();
            renderTable();
        } catch (err) {
            toast('Falha ao carregar estoque', 'error');
            listEl.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:#ef4444;">Erro ao carregar dados do estoque.</td></tr>`;
        }
    };

    // Form submit
    form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = form.querySelector('[type="submit"]');
        btn.disabled = true; btn.textContent = 'Salvando...';
        try {
            await store.addEstoque({
                nome_produto: inputName.value.trim(),
                categoria: inputCat.value,
                quantidade: parseInt(document.getElementById('inv-qty').value, 10) || 0,
                ml_tamanho: document.getElementById('inv-size').value,
                notas: document.getElementById('inv-notes').value.trim()
            });
            toast('Produto salvo no estoque! ✅');
            closeModal();
            loadData();
        } catch (err) {
            toast(err.message || 'Erro ao salvar', 'error');
        } finally {
            btn.disabled = false; btn.textContent = 'Salvar no Estoque';
        }
    };

    // Table actions
    listEl.addEventListener('click', async (e) => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;
        const { id, action } = btn.dataset;
        const item = inventory.find(i => i.id === id);
        if (!item) return;
        btn.disabled = true;
        try {
            if (action === 'increase') {
                await store.updateEstoque(id, { quantidade: item.quantidade + 1, notas: item.notas });
                item.quantidade++;
                renderTable();
            } else if (action === 'decrease' && item.quantidade > 0) {
                await store.updateEstoque(id, { quantidade: item.quantidade - 1, notas: item.notas });
                item.quantidade--;
                renderTable();
            } else if (action === 'delete') {
                if (confirm(`Apagar "${item.nome_produto}" do estoque?`)) {
                    await store.deleteEstoque(id);
                    toast('Produto removido.');
                    loadData();
                } else { btn.disabled = false; }
            }
        } catch {
            toast('Erro na operação', 'error');
        } finally {
            if (btn) btn.disabled = false;
        }
    });

    loadData();
}
