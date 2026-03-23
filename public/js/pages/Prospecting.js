import { api } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { toast } from '../utils.js';

export async function renderProspecting(router) {
    const container = renderLayout(router, 'Radar de Leads Inteligente 🛰️', `
        <div class="prospecting-container animate-fade-in">
            <!-- Barra de Busca Premium -->
            <div class="search-glass-card">
                <div class="search-header">
                    <div class="search-icon-title">
                        <span class="icon-pulse">🛰️</span>
                        <div>
                            <h3>Expandir meu Negócio</h3>
                            <p>Encontre parceiros estratégicos usando Inteligência Geográfica.</p>
                        </div>
                    </div>
                    <button class="btn-secondary-modern" id="btn-quick-flow">
                        📈 Ver Meu Flow
                    </button>
                </div>
                
                <div class="search-controls">
                    <div class="input-group">
                        <label>🎯 Nicho de Atuação</label>
                        <select id="prospect-niche" class="input-modern">
                            <option value="Academia">🏋️ Academias & Fitness</option>
                            <option value="Terapeuta">🧘 Terapeutas & Bem-estar</option>
                            <option value="Consultório de Nutrição">🍎 Nutricionistas</option>
                            <option value="Clínica de Estética">✨ Estética & SPA</option>
                            <option value="Estúdio de Yoga">🧘 Yoga & Pilates</option>
                            <option value="Crossfit">🔥 Crossfit</option>
                            <option value="Psicólogo">🧠 Psicólogos</option>
                            <option value="Loja de Produtos Naturais">🌱 Produtos Naturais</option>
                            <option value="Farmácia de Manipulação">💊 Farmácias</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>📍 Localização</label>
                        <input type="text" id="prospect-location" class="input-modern" placeholder="Bairro, Cidade ou CEP..." />
                    </div>
                    <div class="search-action">
                        <button id="btn-search-prospects" class="btn-premium">🚀 Escanear Leads</button>
                    </div>
                </div>
            </div>

            <div id="prospecting-results-header" class="results-header" style="display:none">
                <div class="results-info">
                    <h4 id="results-count">Encontramos novos parceiros!</h4>
                    <span class="badge-live">LIVE</span>
                </div>
            </div>

            <div id="prospecting-results" class="prospecting-grid">
                <!-- Resultados via JS -->
            </div>
        </div>

        <!-- Modal de Detalhes / Edição -->
        <div id="history-modal" class="modal-overlay" style="display:none">
            <div class="modal-content animate-pop-in">
                <div class="modal-header">
                    <h3>💎 Gestão do Lead</h3>
                    <button class="btn-close-modal" onclick="document.getElementById('history-modal').style.display='none'">✕</button>
                </div>
                <div id="lead-details-form" class="editor-glass">
                    <div class="form-row">
                        <div class="input-group-sm">
                            <label>Telefone / WhatsApp</label>
                            <input type="text" id="edit-tel" placeholder="Ex: (21) 99999-9999" class="input-modern-sm">
                        </div>
                        <div class="input-group-sm">
                            <label>Site Oficial</label>
                            <input type="text" id="edit-web" placeholder="https://..." class="input-modern-sm">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="input-group-sm">
                            <label>Instagram (@...)</label>
                            <input type="text" id="edit-insta" placeholder="@perfil" class="input-modern-sm">
                        </div>
                        <div class="input-group-sm">
                            <label>E-mail</label>
                            <input type="email" id="edit-email" placeholder="contato@..." class="input-modern-sm">
                        </div>
                    </div>
                    <button id="btn-save-details" class="btn-premium-sm">Salvar Alterações</button>
                </div>
                <div id="history-list" class="history-timeline"></div>
            </div>
        </div>

        <style>
            .animate-fade-in { animation: fadeIn 0.4s ease-out; }
            .animate-pop-in { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }

            .search-glass-card { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 32px; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); margin-bottom: 32px; }
            .search-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
            
            .pipeline-container { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 20px; min-height: 70vh; }
            .pipeline-col { min-width: 320px; background: #f8fafc; border-radius: 24px; padding: 18px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 14px; }
            .pipeline-col.drag-over { border-color: #22c55e; border-style: dashed; background: #f0fdf4; }
            .prospect-card { background: white; border-radius: 18px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; cursor: grab; }
            
            /* Quick Actions - Always Visible */
            .flow-card-actions { display: flex; gap: 10px; margin-top: 15px; padding-top: 15px; border-top: 1px dashed #e2e8f0; }
            .btn-flow-action { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 1.1rem; transition: all 0.2s; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; }
            .btn-flow-action:hover { transform: scale(1.1); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            .btn-wa { border-color: #22c55e; color: #22c55e; }
            .btn-wa.empty { border-color: #cbd5e1; color: #cbd5e1; opacity: 0.6; }
            .btn-web { border-color: #3b82f6; color: #3b82f6; }
            .btn-web.empty { border-color: #cbd5e1; color: #cbd5e1; opacity: 0.6; }
            .btn-details { border-color: #64748b; color: #64748b; }
            
            .editor-glass { background: #f8fafc; padding: 20px; border-radius: 16px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
            .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
            .input-modern-sm { width: 100%; height: 42px; border: 1px solid #cbd5e1; border-radius: 10px; padding: 0 12px; font-size: 0.85rem; }
            .btn-premium-sm { width: 100%; height: 42px; background: #1e293b; color: #fff; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }

            .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(8px); }
            .modal-content { background: #fff; width: 95%; max-width: 500px; border-radius: 28px; padding: 28px; box-shadow: 0 30px 60px -15px rgba(0,0,0,0.3); }

            @media (max-width: 768px) {
                .search-controls { grid-template-columns: 1fr; }
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
        searchBtn.innerHTML = '🛰️ Escaneando...';
        resultsEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:50px"><div class="spinner"></div><p style="margin-top:10px;color:var(--text-muted)">Minerando locais qualificados...</p></div>';

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
        searchBtn.textContent = '🚀 Escanear Leads';
    }

    function renderSearchResults(results, niche) {
        resetBtn();
        document.getElementById('prospecting-results-header').style.display = 'flex';
        if (results.length === 0) {
            resultsEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px">Nenhum lead encontrado nesta região. Tente mudar o bairro.</div>';
            return;
        }

        resultsEl.innerHTML = results.map(p => `
            <div class="result-card-modern animate-pop-in">
                <div style="font-size:0.7rem;font-weight:800;color:#22c55e;margin-bottom:8px">${niche}</div>
                <h4 style="margin:0 0 4px;font-size:1.1rem;color:#1e293b">${p.nome}</h4>
                <p style="font-size:0.85rem;color:#64748b;margin-bottom:20px">${p.endereco.split(',')[0]}</p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <button class="btn-premium btn-save-lead" data-name="${p.nome}" data-addr="${p.endereco}" data-placeid="${p.place_id}" data-niche="${niche}" style="height:48px;font-size:0.9rem">Mover para Flow</button>
                    <a href="https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${p.place_id}" target="_blank" class="btn-action-outline" style="height:48px;font-size:0.9rem;text-decoration:none;display:flex;align-items:center;justify-content:center;border:2px solid #e2e8f0;border-radius:14px;color:#1e293b;font-weight:600">Maps</a>
                </div>
            </div>
        `).join('');

        resultsEl.querySelectorAll('.btn-save-lead').forEach(btn => {
            btn.addEventListener('click', async () => {
                const pid = btn.dataset.placeid;
                btn.disabled = true; 
                btn.innerHTML = '<span class="spinner-sm"></span> Salva...';
                
                try {
                    // Tenta enriquecer, mas salva de qualquer jeito após 3s para não travar
                    const detailsPromise = api('GET', `/api/prospects/details/${pid}`);
                    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({}), 3500));
                    
                    const details = await Promise.race([detailsPromise, timeoutPromise]);
                    await api('POST', '/api/prospects', { ...btn.dataset, ...details });
                    
                    toast('Lead salvo com sucesso!', 'success');
                    btn.textContent = '✅ Salvo';
                } catch (err) { 
                    await api('POST', '/api/prospects', { ...btn.dataset });
                    toast('Salvo (sem detalhes extras)', 'info');
                    btn.textContent = '✅ Salvo';
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
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
                    <h2 style="margin:0">📈 Flow de Parcerias</h2>
                    <button class="btn-secondary-modern" onclick="window.location.reload()">🛰️ Voltar ao Radar</button>
                </div>
                <div class="pipeline-container">
                    ${['prospectado', 'contatado', 'negociacao', 'fechado'].map(st => {
                        const labels = { prospectado:'🔍 Prospecção', contatado:'📱 Contatado', negociacao:'🤝 Negociação', fechado:'🏆 Fechado' };
                        return renderCol(st, labels[st], prospects);
                    }).join('')}
                </div>
            `;
            initDnD();
            initHistoryAndDetails();
        } catch (err) { toast('Erro ao carregar flow', 'error'); }
    }

    function renderCol(status, label, all) {
        const items = all.filter(p => p.status === status);
        return `
            <div class="pipeline-col" data-status="${status}">
                <div style="font-weight:800;font-size:0.95rem;color:#1e293b;border-bottom:2px solid #f1f5f9;padding-bottom:12px;display:flex;justify-content:space-between">
                    <span>${label}</span>
                    <span style="background:#e2e8f0;padding:2px 8px;border-radius:20px;font-size:0.75rem">${items.length}</span>
                </div>
                <div class="col-drop-zone" style="flex:1;min-height:200px">
                    ${items.map(p => {
                        const tel = (p.telefone || '').replace(/\D/g, '');
                        const wa = tel ? `https://wa.me/${tel.startsWith('55') ? tel : '55'+tel}` : null;
                        return `
                        <div class="prospect-card animate-pop-in" draggable="true" data-id="${p.id}">
                            <div style="font-size:0.65rem;text-transform:uppercase;color:#22c55e;font-weight:800;letter-spacing:1px">${p.nicho}</div>
                            <div style="font-weight:700;margin:6px 0;font-size:1.05rem;color:#1e293b">${p.nome}</div>
                            
                            <div class="flow-card-actions">
                                <!-- WhatsApp: Se não tiver, vira botão de adicionar -->
                                ${wa 
                                    ? `<a href="${wa}" target="_blank" class="btn-flow-action btn-wa" title="WhatsApp">📱</a>` 
                                    : `<button class="btn-flow-action btn-wa empty icon-edit-trigger" data-id="${p.id}" data-p='${JSON.stringify(p)}' title="Adicionar WhatsApp">➕📱</button>`}
                                
                                <!-- Website -->
                                ${p.website 
                                    ? `<a href="${p.website}" target="_blank" class="btn-flow-action btn-web" title="Site">🌐</a>` 
                                    : `<button class="btn-flow-action btn-web empty icon-edit-trigger" data-id="${p.id}" data-p='${JSON.stringify(p)}' title="Adicionar Site">➕🌐</button>`}
                                
                                <button class="btn-flow-action btn-details icon-edit-trigger" data-id="${p.id}" data-p='${JSON.stringify(p)}' title="Mais Opções">⚡</button>
                                <button class="btn-del-prospect btn-flow-action" data-id="${p.id}" style="border-color:#fca5a5; color:#ef4444">🗑️</button>
                            </div>

                            <div class="mobile-only" style="margin-top:15px;text-align:right">
                                <button class="btn-next-status" data-id="${p.id}" data-curr="${status}" style="font-size:0.75rem;padding:6px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;font-weight:600">Mover ⮕</button>
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
            card.addEventListener('dragstart', () => { draggedId = card.dataset.id; card.classList.add('dragging'); });
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
        });

        document.querySelectorAll('.pipeline-col').forEach(col => {
            col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
            col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
            col.addEventListener('drop', async e => {
                e.preventDefault();
                col.classList.remove('drag-over');
                const newStatus = col.dataset.status;
                if (!draggedId) return;
                try {
                    await api('PATCH', `/api/prospects/${draggedId}`, { status: newStatus });
                    renderMyProspects();
                    toast('Lead movido!');
                } catch (err) { toast('Erro ao mover', 'error'); }
            });
        });

        document.querySelectorAll('.btn-next-status').forEach(btn => {
            btn.addEventListener('click', async () => {
                const nextMap = { 'prospectado': 'contatado', 'contatado': 'negociacao', 'negociacao': 'fechado' };
                const next = nextMap[btn.dataset.curr];
                if (!next) return;
                try {
                    await api('PATCH', `/api/prospects/${btn.dataset.id}`, { status: next });
                    renderMyProspects();
                } catch (err) { toast('Erro ao mover', 'error'); }
            });
        });
        document.querySelectorAll('.btn-del-prospect').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Deseja excluir este lead permanentemente?')) return;
                try {
                    await api('DELETE', `/api/prospects/${btn.dataset.id}`);
                    renderMyProspects();
                    toast('Lead removido.');
                } catch (err) { toast('Erro ao excluir', 'error'); }
            });
        });
    }

    function initHistoryAndDetails() {
        document.querySelectorAll('.icon-edit-trigger').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = JSON.parse(btn.dataset.p);
                const history = p.historico || [];
                const list = document.getElementById('history-list');
                const modal = document.getElementById('history-modal');
                
                // Preenche campos de edição
                document.getElementById('edit-tel').value = p.telefone || '';
                document.getElementById('edit-web').value = p.website || '';
                document.getElementById('edit-insta').value = p.instagram || '';
                document.getElementById('edit-email').value = p.email || '';
                
                const saveBtn = document.getElementById('btn-save-details');
                saveBtn.onclick = async () => {
                    saveBtn.disabled = true;
                    saveBtn.textContent = '⌛ Salvando...';
                    try {
                        await api('PATCH', `/api/prospects/${p.id}`, {
                            telefone: document.getElementById('edit-tel').value,
                            website: document.getElementById('edit-web').value,
                            instagram: document.getElementById('edit-insta').value,
                            email: document.getElementById('edit-email').value
                        });
                        toast('Lead atualizado com sucesso!');
                        modal.style.display = 'none';
                        renderMyProspects();
                    } catch (err) { toast('Erro ao atualizar', 'error'); saveBtn.disabled = false; saveBtn.textContent = 'Salvar Alterações'; }
                };

                if (history.length === 0) {
                    list.innerHTML = '<p style="text-align:center;color:#94a3b8;margin-top:20px;font-size:0.85rem">Nenhuma interação registrada ainda.</p>';
                } else {
                    list.innerHTML = `<h4 style="margin:20px 0 10px;font-size:0.9rem">📜 Histórico de Atividade</h4>` + history.reverse().map(h => `
                        <div class="history-item">
                            <div class="hi-date">${new Date(h.data).toLocaleString()}</div>
                            <div class="hi-text">
                                ${h.tipo === 'status_change' ? `Mudou de <b>${h.de}</b> para <b>${h.para}</b>` : h.texto}
                            </div>
                        </div>
                    `).join('');
                }
                modal.style.display = 'flex';
            });
        });
    }
}
