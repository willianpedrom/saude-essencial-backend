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

        <!-- Modal de Detalhes / Histórico -->
        <div id="history-modal" class="modal-overlay" style="display:none">
            <div class="modal-content animate-pop-in">
                <div class="modal-header">
                    <h3>💎 Detalhes do Lead</h3>
                    <button class="btn-close-modal" onclick="document.getElementById('history-modal').style.display='none'">✕</button>
                </div>
                <div id="lead-details-form" style="margin-bottom:20px; padding:15px; background:#f8fafc; border-radius:12px;">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px">
                        <input type="text" id="edit-insta" placeholder="Instagram (@...)" class="input-modern" style="height:40px; font-size:0.8rem">
                        <input type="text" id="edit-fb" placeholder="Facebook" class="input-modern" style="height:40px; font-size:0.8rem">
                    </div>
                    <input type="email" id="edit-email" placeholder="Email de contato" class="input-modern" style="height:40px; font-size:0.8rem; width:100%; margin-bottom:10px">
                    <button id="btn-save-details" class="btn-premium" style="width:100%; height:36px; font-size:0.8rem">Atualizar Dados</button>
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
            .search-icon-title { display: flex; align-items: center; gap: 16px; }
            /* ... outros estilos mantidos ... */
            .search-controls { display: grid; grid-template-columns: 1fr 1fr 200px; gap: 20px; align-items: flex-end; }
            .input-modern { width: 100%; height: 52px; border: 2px solid #f1f5f9; border-radius: 14px; padding: 0 16px; font-size: 0.95rem; }
            .btn-premium { height: 52px; background: #1e293b; color: white; border-radius: 14px; font-weight: 700; cursor: pointer; border: none; }
            
            .pipeline-container { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 20px; min-height: 70vh; }
            .pipeline-col { min-width: 320px; background: #f8fafc; border-radius: 20px; padding: 16px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 12px; }
            .pipeline-col.drag-over { background: #f1f5f9; border-color: #22c55e; border-style: dashed; }
            .prospect-card { background: white; border-radius: 16px; padding: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); cursor: grab; position: relative; }
            
            /* Quick Actions on Flow Card */
            .flow-card-actions { display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9; }
            .btn-flow-action { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; text-decoration: none; font-size: 1rem; transition: transform 0.2s; border: 1px solid #e2e8f0; }
            .btn-flow-action:hover { transform: translateY(-2px); }
            .btn-wa { background: #dcfce7; border-color: #86efac; color: #166534; }
            .btn-web { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
            .btn-social { background: #f0f9ff; border-color: #bae6fd; color: #0369a1; }
            
            .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
            .modal-content { background: white; width: 90%; max-width: 500px; border-radius: 24px; padding: 24px; }
            .history-timeline { display: flex; flex-direction: column; gap: 16px; max-height: 300px; overflow-y: auto; }
            
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
        searchBtn.textContent = '🛰️ Escaneando...';
        resultsEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:50px"><div class="spinner"></div></div>';

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
            resultsEl.innerHTML = '<div style="grid-column:1/-1;text-align:center">Nenhum lead encontrado.</div>';
            return;
        }

        resultsEl.innerHTML = results.map(p => `
            <div class="result-card-modern anim-slide-up">
                <div style="font-size:0.7rem;font-weight:800;color:#22c55e;margin-bottom:8px">${niche}</div>
                <h4 style="margin:0 0 4px;font-size:1rem">${p.nome}</h4>
                <p style="font-size:0.8rem;color:#64748b;margin-bottom:16px">${p.endereco.split(',')[0]}</p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                    <button class="btn-premium btn-save-lead" data-name="${p.nome}" data-addr="${p.endereco}" data-placeid="${p.place_id}" data-niche="${niche}" style="height:44px;font-size:0.85rem">Iniciar Flow</button>
                    <a href="https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${p.place_id}" target="_blank" class="btn-action-outline" style="height:44px;font-size:0.85rem;text-decoration:none;display:flex;align-items:center;justify-content:center;border:1px solid #e2e8f0;border-radius:12px">Ver Maps</a>
                </div>
            </div>
        `).join('');

        resultsEl.querySelectorAll('.btn-save-lead').forEach(btn => {
            btn.addEventListener('click', async () => {
                const pid = btn.dataset.placeid;
                btn.disabled = true; btn.textContent = '⌛ Enriquecendo...';
                
                try {
                    // Busca detalhes extras (Telefone/Site) antes de salvar
                    const details = await api('GET', `/api/prospects/details/${pid}`);
                    await api('POST', '/api/prospects', { ...btn.dataset, ...details });
                    toast('Lead salvo com contato!', 'success');
                    btn.textContent = '✅ Salvo';
                } catch (err) { 
                    // Se falhar o detalhe, salva o básico mesmo
                    await api('POST', '/api/prospects', { ...btn.dataset });
                    toast('Lead salvo (sem detalhes extras)', 'info');
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
                <div style="font-weight:800;font-size:0.9rem;border-bottom:2px solid #e2e8f0;padding-bottom:10px">${label} (${items.length})</div>
                <div class="col-drop-zone" style="flex:1;min-height:200px">
                    ${items.map(p => {
                        const tel = (p.telefone || '').replace(/\D/g, '');
                        const wa = tel ? `https://wa.me/${tel.startsWith('55') ? tel : '55'+tel}` : null;
                        return `
                        <div class="prospect-card" draggable="true" data-id="${p.id}">
                            <div style="font-size:0.6rem;text-transform:uppercase;color:#94a3b8;font-weight:800">${p.nicho}</div>
                            <div style="font-weight:700;margin:4px 0">${p.nome}</div>
                            
                            <div class="flow-card-actions">
                                ${wa ? `<a href="${wa}" target="_blank" class="btn-flow-action btn-wa" title="WhatsApp">📱</a>` : ''}
                                ${p.website ? `<a href="${p.website}" target="_blank" class="btn-flow-action btn-web" title="Site">🌐</a>` : ''}
                                ${p.instagram ? `<a href="https://instagram.com/${p.instagram.replace('@','')}" target="_blank" class="btn-flow-action btn-social" title="Instagram">📸</a>` : ''}
                                <button class="btn-flow-action btn-history" data-id="${p.id}" data-p='${JSON.stringify(p)}' title="Mais Detalhes / Histórico">📜</button>
                                <button class="btn-del-prospect btn-flow-action" data-id="${p.id}" style="border:none; background:none">🗑️</button>
                            </div>

                            <div class="mobile-only" style="margin-top:10px;text-align:right">
                                <button class="btn-next-status" data-id="${p.id}" data-curr="${status}" style="font-size:0.7rem;padding:4px 10px;border-radius:6px;border:1px solid #e2e8f0;background:#fff">Mover →</button>
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
                    toast('Lead movido com sucesso!');
                } catch (err) { toast('Erro ao mover', 'error'); }
            });
        });

        document.querySelectorAll('.btn-next-status').forEach(btn => {
            btn.addEventListener('click', async () => {
                const nextMap = { 'prospectado': 'contatado', 'contatado': 'negociacao', 'negociacao': 'fechado' };
                const next = nextMap[btn.dataset.curr];
                if (!next) return;
                await api('PATCH', `/api/prospects/${btn.dataset.id}`, { status: next });
                renderMyProspects();
            });
        });
        document.querySelectorAll('.btn-del-prospect').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Excluir este lead?')) return;
                await api('DELETE', `/api/prospects/${btn.dataset.id}`);
                renderMyProspects();
            });
        });
    }

    function initHistoryAndDetails() {
        document.querySelectorAll('.btn-history').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = JSON.parse(btn.dataset.p);
                const history = p.historico || [];
                const list = document.getElementById('history-list');
                const modal = document.getElementById('history-modal');
                
                // Preenche campos de edição
                document.getElementById('edit-insta').value = p.instagram || '';
                document.getElementById('edit-fb').value = p.facebook || '';
                document.getElementById('edit-email').value = p.email || '';
                
                const saveBtn = document.getElementById('btn-save-details');
                saveBtn.onclick = async () => {
                    saveBtn.disabled = true;
                    try {
                        await api('PATCH', `/api/prospects/${p.id}`, {
                            instagram: document.getElementById('edit-insta').value,
                            facebook: document.getElementById('edit-fb').value,
                            email: document.getElementById('edit-email').value
                        });
                        toast('Dados atualizados!');
                        modal.style.display = 'none';
                        renderMyProspects();
                    } catch (err) { toast('Erro ao atualizar', 'error'); saveBtn.disabled = false; }
                };

                if (history.length === 0) {
                    list.innerHTML = '<p style="text-align:center;color:#94a3b8">Nenhuma interação registrada ainda.</p>';
                } else {
                    list.innerHTML = `<h4>Linha do Tempo</h4>` + history.reverse().map(h => `
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
