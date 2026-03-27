import { store } from '../store.js';
import { toast, formatDate, escapeHTML } from '../utils.js';
import { doterraProducts } from '../utils/doterraProducts.js';

export async function renderInventory(router) {
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="header-basic">
            <div>
                <h1 class="page-title">📦 Meu Estoque doTerra</h1>
                <p class="text-secondary">Gerencie seus óleos e produtos de forma simples e independente</p>
            </div>
            <button id="add-item-btn" class="btn btn-primary">+ Adicionar Produto</button>
        </div>

        <div class="kpi-grid" style="margin-bottom: 24px;">
            <div class="kpi-card">
                <div class="kpi-title">Total de Itens na Prateleira</div>
                <div class="kpi-value" id="kpi-total-items">0</div>
            </div>
            <div class="kpi-card" style="border-left-color: #f59e0b;">
                <div class="kpi-title">Alerta (Estoque Baixo/Zerado)</div>
                <div class="kpi-value" id="kpi-low-stock">0</div>
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
                            <th>Lotes / Notas</th>
                            <th style="text-align:center;">Qtd. Disponível</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="inventory-list">
                        <tr><td colspan="6" class="text-center py-8">Carregando estoque...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Modal: Adicionar Produto -->
        <div class="modal-overlay" id="inventory-modal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Registrar Produto</h2>
                    <button class="modal-close" id="close-inventory-modal">&times;</button>
                </div>
                <form id="inventory-form">
                    <div class="form-group" style="position: relative;">
                        <label>Nome do Produto (Digite para buscar) *</label>
                        <input type="text" id="inv-name" class="form-control" autocomplete="off" placeholder="Ex: Lavanda, Peppermint, Veráge..." required>
                        <div id="autocomplete-results" class="autocomplete-dropdown hidden"></div>
                    </div>
                    
                    <div class="form-group">
                        <label>Categoria</label>
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

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="form-group">
                            <label>Tamanho / Medida</label>
                            <select id="inv-size" class="form-control">
                                <option value="15ml">15ml</option>
                                <option value="5ml">5ml</option>
                                <option value="10ml Touch">10ml (Touch)</option>
                                <option value="Unidade">Unidade (Caixa/Kit/Difusor)</option>
                                <option value="Outro">Outro...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Qtd. de Entrada</label>
                            <input type="number" id="inv-qty" class="form-control" min="0" value="1" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Notas / Lote / Validade / Origem (Opcional)</label>
                        <input type="text" id="inv-notes" class="form-control" placeholder="Ex: Ganhei no LRP, Val 10/24">
                    </div>

                    <div class="modal-actions mt-4">
                        <button type="button" class="btn btn-secondary" id="cancel-inventory-modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar no Estoque</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Elements
    const addBtn = document.getElementById('add-item-btn');
    const modal = document.getElementById('inventory-modal');
    const closeBtn = document.getElementById('close-inventory-modal');
    const cancelBtn = document.getElementById('cancel-inventory-modal');
    const form = document.getElementById('inventory-form');
    const listEl = document.getElementById('inventory-list');

    // Autocomplete elements
    const inputName = document.getElementById('inv-name');
    const inputCat = document.getElementById('inv-category');
    const autocompleteDropdown = document.getElementById('autocomplete-results');

    // State
    let inventory = [];

    // Setup Modals
    const openModal = () => {
        form.reset();
        document.getElementById('inv-qty').value = "1";
        document.getElementById('inv-size').value = "15ml";
        inputCat.value = "Óleo Essencial";
        autocompleteDropdown.classList.add('hidden');
        modal.style.display = 'flex';
        inputName.focus();
    };
    const closeModal = () => modal.style.display = 'none';
    addBtn.onclick = openModal;
    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };

    // Set up Autocomplete Logic
    inputName.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        if (val.length < 2) {
            autocompleteDropdown.classList.add('hidden');
            return;
        }

        const matches = doterraProducts.filter(p => p.nome.toLowerCase().includes(val)).slice(0, 10);
        
        if (matches.length > 0) {
            autocompleteDropdown.innerHTML = matches.map(m => `
                <div class="autocomplete-item" data-name="${escapeHTML(m.nome)}" data-cat="${escapeHTML(m.categoria)}">
                    <strong>${escapeHTML(m.nome)}</strong> <span class="text-secondary text-sm">(${escapeHTML(m.categoria)})</span>
                </div>
            `).join('');
            autocompleteDropdown.classList.remove('hidden');
        } else {
            autocompleteDropdown.classList.add('hidden');
        }
    });

    // Close autocomplete on blur if clicked outside
    document.addEventListener('click', (e) => {
        if (!inputName.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
            autocompleteDropdown.classList.add('hidden');
        }
    });

    // Select autocomplete item
    autocompleteDropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.autocomplete-item');
        if (item) {
            inputName.value = item.dataset.name;
            const catMatch = Array.from(inputCat.options).find(opt => opt.value === item.dataset.cat);
            if(catMatch) inputCat.value = item.dataset.cat;
            
            // Auto select size based on some heuristics
            const sizeInput = document.getElementById('inv-size');
            if (item.dataset.cat.includes("Touch")) {
                sizeInput.value = "10ml Touch";
            } else if (item.dataset.cat === "Difusor" || item.dataset.cat === "Kit" || item.dataset.cat === "Personal Care" || item.dataset.cat === "Acessório") {
                sizeInput.value = "Unidade";
            } else {
                sizeInput.value = "15ml"; // default oil
            }

            autocompleteDropdown.classList.add('hidden');
        }
    });


    // Render Table
    const renderTable = () => {
        if (!inventory.length) {
            listEl.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-secondary">Seu estoque está vazio. Clique em "Adicionar Produto" para começar.</td></tr>`;
            document.getElementById('kpi-total-items').textContent = '0';
            document.getElementById('kpi-low-stock').textContent = '0';
            return;
        }

        // Stats
        let totalItems = 0;
        let lowStockCount = 0;

        const html = inventory.map(item => {
            totalItems += item.quantidade;
            if (item.quantidade <= 1) lowStockCount++;
            
            let qtyBadgeClass = 'badge-success';
            if (item.quantidade === 0) qtyBadgeClass = 'badge-danger';
            else if (item.quantidade === 1) qtyBadgeClass = 'badge-warning';

            return `
                <tr>
                    <td class="font-medium">${escapeHTML(item.nome_produto)}</td>
                    <td class="text-secondary">${escapeHTML(item.categoria)}</td>
                    <td class="text-secondary">${escapeHTML(item.ml_tamanho || '-')}</td>
                    <td class="text-secondary text-sm">${escapeHTML(item.notas || '-')}</td>
                    <td style="text-align:center;">
                        <span class="badge ${qtyBadgeClass}" style="font-size: 1.1em; padding: 4px 10px;">
                            ${item.quantidade}
                        </span>
                    </td>
                    <td>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-outline btn-sm action-btn" data-id="${item.id}" data-action="decrease" title="Remover uma unidade" ${item.quantidade <= 0 ? 'disabled' : ''}>-</button>
                            <button class="btn btn-outline btn-sm action-btn" data-id="${item.id}" data-action="increase" title="Adicionar uma unidade">+</button>
                            <button class="btn btn-ghost text-danger action-btn" data-id="${item.id}" data-action="delete" title="Excluir produto do registro">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        listEl.innerHTML = html;
        document.getElementById('kpi-total-items').textContent = totalItems.toString();
        document.getElementById('kpi-low-stock').textContent = lowStockCount.toString();
    };

    const loadData = async () => {
        try {
            inventory = await store.getEstoque();
            renderTable();
        } catch (err) {
            toast('Falha ao carregar estoque', 'error');
            listEl.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-danger">Erro ao carregar dados.</td></tr>`;
        }
    };

    // Handle Form Submit (Add New or Sum Existing)
    form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        const payload = {
            nome_produto: inputName.value.trim(),
            categoria: inputCat.value,
            quantidade: parseInt(document.getElementById('inv-qty').value, 10),
            ml_tamanho: document.getElementById('inv-size').value,
            notas: document.getElementById('inv-notes').value.trim()
        };

        try {
            await store.addEstoque(payload);
            toast('Produto registrado no estoque!');
            closeModal();
            loadData();
        } catch (err) {
            toast(err.message || 'Erro ao registrar produto', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    };

    // Handle Table Actions (+ / - / delete)
    listEl.addEventListener('click', async (e) => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;
        
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const item = inventory.find(i => i.id === id);
        if (!item) return;

        try {
            if (action === 'increase') {
                btn.disabled = true;
                await store.updateEstoque(id, { quantidade: item.quantidade + 1, notas: item.notas });
                item.quantidade++;
                renderTable();
            } else if (action === 'decrease') {
                if (item.quantidade <= 0) return;
                btn.disabled = true;
                await store.updateEstoque(id, { quantidade: item.quantidade - 1, notas: item.notas });
                item.quantidade--;
                renderTable();
            } else if (action === 'delete') {
                if(confirm(`Tem certeza que deseja apagar o registro de ${item.nome_produto} do seu estoque?`)) {
                    await store.deleteEstoque(id);
                    toast('Registro apagado.');
                    loadData();
                }
            }
        } catch (err) {
            toast('Erro na operação', 'error');
        } finally {
            if (btn && btn.tagName === 'BUTTON') btn.disabled = false;
        }
    });

    // Initial Load
    loadData();
}
