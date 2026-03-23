import { api } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { toast } from '../utils.js';

export async function renderProspecting(router) {
    const container = renderLayout(router, 'Radar de Leads Inteligente 🛰️', `
        <div class="prospecting-container animate-fade-in">
            <!-- Header de Busca Minimalista & Elegante -->
            <div class="search-premium-card">
                <div class="search-brand">
                    <div class="brand-icon">🛰️</div>
                    <div class="brand-text">
                        <h3>Radar de Expansão</h3>
                        <p>Inteligência geográfica para novos parceiros.</p>
                    </div>
                    <button class="btn-flow-shortcut" id="btn-quick-flow">
                        📊 Meu Flow de Leads
                    </button>
                </div>
                
                <div class="search-inputs-row">
                    <div class="input-field">
                        <label>🎯 Nicho</label>
                        <select id="prospect-niche" class="select-premium">
                            <option value="Academia">🏋️ Academias & Fitness</option>
                            <option value="Terapeuta">🧘 Terapeutas & Bem-estar</option>
                            <option value="Consultório de Nutrição">🍎 Nutricionistas</option>
                            <option value="Clínica de Estética">✨ Estética & SPA</option>
                            <option value="Estúdio de Yoga">🧘 Yoga & Pilates</option>
                            <option value="Crossfit">🔥 Crossfit</option>
                            <option value="Psicólogo">🧠 Psicólogos</option>
                            <option value="Loja de Produtos Naturais">🌱 Produtos Naturais</option>
                        </select>
                    </div>
                    <div class="input-field">
                        <label>📍 Localização</label>
                        <input type="text" id="prospect-location" class="input-premium" placeholder="Bairro ou Cidade..." />
                    </div>
                    <button id="btn-search-prospects" class="btn-search-main">Buscar Parceiros</button>
                </div>
            </div>

            <div id="prospecting-results-header" class="results-header-modern" style="display:none">
                <span>Novas Oportunidades Encontradas</span>
                <div class="live-indicator">● LIVE</div>
            </div>

            <div id="prospecting-results" class="prospecting-grid-modern">
                <!-- Resultados via JS -->
            </div>
        </div>

        <!-- Modal de Gestão de Lead (Comando Central) -->
        <div id="history-modal" class="modal-overlay-modern" style="display:none">
            <div class="modal-card animate-slide-up">
                <div class="modal-header-modern">
                    <div>
                        <h3 id="modal-lead-name">Gestão do Lead</h3>
                        <p id="modal-lead-status" class="status-badge-sm"></p>
                    </div>
                    <button class="btn-close-circle" onclick="document.getElementById('history-modal').style.display='none'">✕</button>
                </div>
                
                <div class="modal-body">
                    <div class="section-title">📱 Canais de Contato</div>
                    <div class="edit-grid">
                        <div class="edit-field">
                            <label>WhatsApp</label>
                            <input type="text" id="edit-tel" placeholder="(00) 00000-0000">
                        </div>
                        <div class="edit-field">
                            <label>Website</label>
                            <input type="text" id="edit-web" placeholder="https://...">
                        </div>
                        <div class="edit-field">
                            <label>Instagram</label>
                            <input type="text" id="edit-insta" placeholder="@usuario">
                        </div>
                        <div class="edit-field">
                            <label>E-mail</label>
                            <input type="email" id="edit-email" placeholder="email@exemplo.com">
                        </div>
                    </div>
                    
                    <button id="btn-save-details" class="btn-save-main">Atualizar Contatos</button>

                    <div class="section-divider"></div>
                    
                    <div class="section-title">📜 Linha do Tempo</div>
                    <div id="history-list" class="timeline-compact"></div>
                </div>
            </div>
        </div>

        <style>
            :root {
                --p-primary: #10b981;
                --p-secondary: #3b82f6;
                --p-dark: #0f172a;
                --p-gray: #64748b;
                --p-border: #e2e8f0;
                --p-bg: #f8fafc;
            }

            .search-premium-card { background: #fff; border-radius: 20px; padding: 25px; border: 1px solid var(--p-border); margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .search-brand { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; }
            .brand-icon { font-size: 2rem; }
            .brand-text h3 { margin: 0; font-size: 1.25rem; color: var(--p-dark); }
            .brand-text p { margin: 0; font-size: 0.85rem; color: var(--p-gray); }
            .btn-flow-shortcut { margin-left: auto; background: var(--p-dark); color: #fff; border: none; padding: 8px 16px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; }
            .btn-flow-shortcut:hover { opacity: 0.9; transform: translateY(-1px); }

            .search-inputs-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 15px; align-items: flex-end; }
            .input-field label { display: block; font-size: 0.75rem; font-weight: 700; color: var(--p-dark); margin-bottom: 5px; text-transform: uppercase; }
            .select-premium, .input-premium { width: 100%; height: 45px; border-radius: 12px; border: 1px solid var(--p-border); padding: 0 15px; font-size: 0.9rem; background: var(--p-bg); outline: none; transition: 0.2s; }
            .select-premium:focus, .input-premium:focus { border-color: var(--p-secondary); background: #fff; }
            .btn-search-main { height: 45px; background: var(--p-secondary); color: #fff; border: none; padding: 0 25px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
            .btn-search-main:hover { box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3); }

            /* Grid e Resultados */
            .results-header-modern { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; font-weight: 700; color: var(--p-dark); }
            .live-indicator { font-size: 0.65rem; background: #fee2e2; color: #ef4444; padding: 2px 8px; border-radius: 20px; }
            .prospecting-grid-modern { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
            .result-card-modern { background: #fff; border-radius: 16px; padding: 20px; border: 1px solid var(--p-border); transition: 0.2s; }
            .result-card-modern:hover { transform: translateY(-3px); box-shadow: 0 12px 20px -5px rgba(0,0,0,0.1); }

            /* Flow / Pipeline */
            .pipeline-container { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 20px; min-height: 70vh; }
            .pipeline-col { min-width: 300px; max-width: 300px; background: #f1f5f9; border-radius: 20px; padding: 15px; display: flex; flex-direction: column; gap: 15px; }
            .prospect-card { background: #fff; border-radius: 14px; padding: 15px; border: 1px solid var(--p-border); position: relative; cursor: grab; transition: 0.2s; }
            .prospect-card:active { cursor: grabbing; }
            .prospect-card h4 { margin: 8px 0; font-size: 0.95rem; color: var(--p-dark); line-height: 1.3; }
            
            /* Card Actions Sênior */
            .card-actions-row { display: flex; align-items: center; gap: 8px; margin-top: 15px; padding-top: 12px; border-top: 1px solid #f1f5f9; }
            .action-icon-btn { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--p-border); background: #f8fafc; color: var(--p-gray); cursor: pointer; transition: 0.2s; text-decoration: none; }
            .action-icon-btn:hover { background: #fff; transform: scale(1.05); }
            .btn-wa-active { background: #dcfce7; color: #16a34a; border-color: #bbf7d0; }
            .btn-web-active { background: #dbeafe; color: #2563eb; border-color: #bfdbfe; }
            .btn-edit-main { margin-left: auto; background: var(--p-dark); color: #fff; border: none; font-size: 0.75rem; font-weight: 700; padding: 6px 12px; border-radius: 8px; }

            /* Modal Sênior */
            .modal-overlay-modern { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
            .modal-card { background: #fff; width: 95%; max-width: 450px; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); overflow: hidden; }
            .modal-header-modern { padding: 20px 25px; background: var(--p-bg); border-bottom: 1px solid var(--p-border); display: flex; justify-content: space-between; align-items: center; }
            .modal-header-modern h3 { margin: 0; font-size: 1.1rem; color: var(--p-dark); }
            .modal-body { padding: 25px; }
            .section-title { font-size: 0.7rem; font-weight: 800; color: var(--p-gray); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 15px; }
            .edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
            .edit-field label { display: block; font-size: 0.7rem; color: var(--p-gray); margin-bottom: 4px; }
            .edit-field input { width: 100%; height: 38px; border-radius: 8px; border: 1px solid var(--p-border); padding: 0 10px; font-size: 0.85rem; }
            .btn-save-main { width: 100%; height: 42px; background: var(--p-secondary); color: #fff; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; }
            .section-divider { height: 1px; background: var(--p-border); margin: 20px 0; }
            
            .timeline-compact { max-height: 150px; overflow-y: auto; padding-right: 5px; }
            .history-item-mini { margin-bottom: 10px; font-size: 0.8rem; color: var(--p-dark); border-left: 2px solid var(--p-border); padding-left: 10px; }
            .hi-date-mini { font-size: 0.65rem; color: var(--p-gray); }

            .btn-close-circle { width: 30px; height: 30px; border-radius: 50%; border: none; background: #e2e8f0; color: var(--p-dark); cursor: pointer; }

            .animate-slide-up { animation: slideUp 0.3s ease-out; }
            @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

            @media (max-width: 768px) {
                .search-inputs-row { grid-template-columns: 1fr; }
                .pipeline-container { flex-direction: column; }
            }
        </style>
    `, 'prospecting');

    const resultsEl = document.getElementById('prospecting-results');
    const searchBtn = document.getElementById('btn-search-prospects');
    const quickFlowBtn = document.getElementById('btn-quick-flow');

    quickFlowBtn.addEventListener('click', () => renderMyProspects());

    searchBtn.addEventListener('click', async () => {
        const q = document.getElementById('prospect-niche').value;
        const loc = document.getElementById('prospect-location').value.trim();
        if (!loc) return toast('Digite a localização', 'warning');
        
        searchBtn.disabled = true;
        searchBtn.innerHTML = '🔍 Buscando...';
        resultsEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:50px"><div class="spinner"></div><p>Sincronizando com radar local...</p></div>';

        try {
            const data = await api('GET', `/api/prospects/search?q=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}`);
            renderSearchResults(data.results, q);
        } catch (err) {
            toast('Erro na busca', 'error');
            resetBtn();
        }
    });

    function resetBtn() {
        searchBtn.disabled = false;
        searchBtn.textContent = 'Buscar Parceiros';
    }

    function renderSearchResults(results, niche) {
        resetBtn();
        document.getElementById('prospecting-results-header').style.display = 'flex';
        if (results.length === 0) {
            resultsEl.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px">Nenhum resultado nesta localização.</p>';
            return;
        }

        resultsEl.innerHTML = results.map(p => `
            <div class="result-card-modern animate-slide-up">
                <div style="font-size:0.65rem;font-weight:900;color:var(--p-primary);margin-bottom:5px;text-transform:uppercase">${niche}</div>
                <h4 style="margin:0 0 5px;font-size:1rem">${p.nome}</h4>
                <p style="font-size:0.8rem;color:var(--p-gray);margin-bottom:15px">${p.endereco.split(',')[0]}</p>
                <button class="btn-save-main btn-save-lead" data-name="${p.nome}" data-addr="${p.endereco}" data-placeid="${p.place_id}" data-niche="${niche}" style="height:40px;font-size:0.85rem">Adicionar ao Flow</button>
            </div>
        `).join('');

        resultsEl.querySelectorAll('.btn-save-lead').forEach(btn => {
            btn.addEventListener('click', async () => {
                const pid = btn.dataset.placeid;
                btn.disabled = true; btn.textContent = 'Salvando...';
                try {
                    // Timeout de 2.5s para o enriquecimento (Senior Move: UX First)
                    const details = await Promise.race([
                        api('GET', `/api/prospects/details/${pid}`),
                        new Promise(r => setTimeout(()=>r({}), 2500))
                    ]);
                    await api('POST', '/api/prospects', { ...btn.dataset, ...details });
                    toast('Lead capturado!');
                    btn.textContent = '✅ Capturado';
                } catch (err) {
                    await api('POST', '/api/prospects', { ...btn.dataset });
                    btn.textContent = '✅ Capturado';
                }
            });
        });
    }

    async function renderMyProspects() {
        const main = document.querySelector('.prospecting-container');
        main.innerHTML = '<div style="text-align:center;padding:100px"><div class="spinner"></div></div>';
        try {
            const prospects = await api('GET', '/api/prospects');
            main.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px">
                    <h2 style="margin:0;font-size:1.5rem">📊 Fluxo de Prospecção</h2>
                    <button class="btn-flow-shortcut" onclick="window.location.reload()">🛰️ Abrir Radar</button>
                </div>
                <div class="pipeline-container">
                    ${['prospectado', 'contatado', 'negociacao', 'fechado'].map(st => {
                        const labels = { prospectado:'🔍 Radar', contatado:'📱 Contato', negociacao:'🤝 Negociação', fechado:'🏆 Fechado' };
                        return renderCol(st, labels[st], prospects);
                    }).join('')}
                </div>
            `;
            initDnD();
            initLeadManagement();
        } catch (err) { toast('Erro ao carregar pipeline'); }
    }

    function renderCol(status, label, all) {
        const items = all.filter(p => p.status === status);
        return `
            <div class="pipeline-col" data-status="${status}">
                <div style="font-weight:700;font-size:0.85rem;color:var(--p-gray);text-transform:uppercase;padding-bottom:10px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between">
                    <span>${label}</span>
                    <span>${items.length}</span>
                </div>
                <div class="col-drop-zone" style="flex:1;min-height:300px">
                    ${items.map(p => {
                        const tel = (p.telefone || '').replace(/\D/g, '');
                        const wa = tel ? `https://wa.me/${tel.startsWith('55') ? tel : '55'+tel}` : null;
                        return `
                        <div class="prospect-card animate-slide-up" draggable="true" data-id="${p.id}">
                            <div style="font-size:0.6rem;font-weight:800;color:var(--p-primary);text-transform:uppercase">${p.nicho}</div>
                            <h4>${p.nome}</h4>
                            
                            <div class="card-actions-row">
                                <a href="${wa || '#'}" target="${wa ? '_blank' : '_self'}" class="action-icon-btn ${wa ? 'btn-wa-active' : ''} ${!wa ? 'open-edit' : ''}" data-p='${JSON.stringify(p)}' title="${wa ? 'WhatsApp' : 'Adicionar WhatsApp'}">📱</a>
                                <a href="${p.website || '#'}" target="${p.website ? '_blank' : '_self'}" class="action-icon-btn ${p.website ? 'btn-web-active' : ''} ${!p.website ? 'open-edit' : ''}" data-p='${JSON.stringify(p)}' title="${p.website ? 'Site' : 'Adicionar Link'}">🌐</a>
                                <button class="btn-edit-main open-edit" data-p='${JSON.stringify(p)}'>GERENCIAR</button>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>
        `;
    }

    function initDnD() {
        let draggedId = null;
        document.querySelectorAll('.prospect-card').forEach(card => {
            card.addEventListener('dragstart', () => { draggedId = card.dataset.id; card.style.opacity = '0.5'; });
            card.addEventListener('dragend', () => card.style.opacity = '1');
        });
        document.querySelectorAll('.pipeline-col').forEach(col => {
            col.addEventListener('dragover', e => e.preventDefault());
            col.addEventListener('drop', async e => {
                e.preventDefault();
                const newStatus = col.dataset.status;
                if (draggedId) {
                    try {
                        await api('PATCH', `/api/prospects/${draggedId}`, { status: newStatus });
                        renderMyProspects();
                    } catch (err) { toast('Erro ao mover lead'); }
                }
            });
        });
    }

    function initLeadManagement() {
        document.querySelectorAll('.open-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const p = JSON.parse(btn.dataset.p);
                const modal = document.getElementById('history-modal');
                
                document.getElementById('modal-lead-name').textContent = p.nome;
                document.getElementById('modal-lead-status').textContent = p.status.toUpperCase();
                
                document.getElementById('edit-tel').value = p.telefone || '';
                document.getElementById('edit-web').value = p.website || '';
                document.getElementById('edit-insta').value = p.instagram || '';
                document.getElementById('edit-email').value = p.email || '';
                
                const saveBtn = document.getElementById('btn-save-details');
                saveBtn.onclick = async () => {
                    saveBtn.disabled = true; saveBtn.textContent = 'Gravando...';
                    try {
                        const updated = await api('PATCH', `/api/prospects/${p.id}`, {
                            telefone: document.getElementById('edit-tel').value,
                            website: document.getElementById('edit-web').value,
                            instagram: document.getElementById('edit-insta').value,
                            email: document.getElementById('edit-email').value
                        });
                        toast('Dados atualizados!');
                        modal.style.display = 'none';
                        renderMyProspects();
                    } catch (err) { 
                        toast('Falha ao salvar'); 
                        saveBtn.disabled = false; saveBtn.textContent = 'Atualizar Contatos'; 
                    }
                };

                const history = p.historico || [];
                const histList = document.getElementById('history-list');
                histList.innerHTML = history.length ? history.reverse().map(h => `
                    <div class="history-item-mini">
                        <div class="hi-date-mini">${new Date(h.data).toLocaleDateString()}</div>
                        <div>${h.tipo === 'status_change' ? `Fase: ${h.para}` : h.texto}</div>
                    </div>
                `).join('') : '<p>Sem histórico recente.</p>';

                modal.style.display = 'flex';
            });
        });
    }
}
