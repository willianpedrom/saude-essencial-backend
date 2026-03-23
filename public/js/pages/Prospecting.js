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
                </div>
                
                <div class="search-controls">
                    <div class="input-group">
                        <label>🎯 Nicho de Atuação</label>
                        <div class="select-wrapper">
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
                    </div>
                    
                    <div class="input-group">
                        <label>📍 Localização de Prospecção</label>
                        <div class="search-input-wrapper">
                            <input type="text" id="prospect-location" class="input-modern" placeholder="Bairro, Cidade ou CEP..." />
                        </div>
                    </div>
                    
                    <div class="search-action">
                        <button id="btn-search-prospects" class="btn-premium">
                            <span class="btn-text">Escanear Leads</span>
                            <span class="btn-icon">🚀</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Header de Resultados (Oculto inicialmente) -->
            <div id="prospecting-results-header" class="results-header" style="display:none">
                <div class="results-info">
                    <h4 id="results-count">Encontramos novos parceiros para você!</h4>
                    <span class="badge-live">LIVE DATA</span>
                </div>
                <button class="btn-secondary-modern" id="btn-view-my-prospects">
                    📂 Gerenciar meu Flow
                </button>
            </div>

            <!-- Container de Resultados / Empty State -->
            <div id="prospecting-results" class="prospecting-grid">
                <div class="empty-state-card">
                    <div class="empty-illustration">
                        <div class="radar-circle"></div>
                        <div class="radar-circle delay-1"></div>
                        <div class="radar-circle delay-2"></div>
                        <span style="font-size:3rem">🛰️</span>
                    </div>
                    <h3>Radar em Standby</h3>
                    <p>Defina o nicho e a localidade para começar a minerar leads qualificados.</p>
                </div>
            </div>
        </div>

        <style>
            .animate-fade-in { animation: fadeIn 0.4s ease-out; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

            .search-glass-card {
                background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                border: 1px solid rgba(226, 232, 240, 0.8);
                border-radius: 24px;
                padding: 32px;
                box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
                margin-bottom: 32px;
                position: relative;
                overflow: hidden;
            }

            .search-header { margin-bottom: 24px; }
            .search-icon-title { display: flex; align-items: center; gap: 16px; }
            .icon-pulse {
                font-size: 2rem;
                background: white;
                width: 56px;
                height: 56px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 16px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                animation: softPulse 2s infinite;
            }
            @keyframes softPulse { 
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
                70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
                100% { transform: scale(1); }
            }

            .search-header h3 { margin: 0; color: #1e293b; font-size: 1.25rem; font-weight: 800; }
            .search-header p { margin: 4px 0 0; color: #64748b; font-size: 0.88rem; }

            .search-controls {
                display: grid;
                grid-template-columns: 1fr 1fr 200px;
                gap: 20px;
                align-items: flex-end;
            }

            .input-group label {
                display: block;
                font-size: 0.75rem;
                font-weight: 700;
                color: #475569;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .input-modern {
                width: 100%;
                height: 52px;
                background: white;
                border: 2px solid #f1f5f9;
                border-radius: 14px;
                padding: 0 16px;
                font-size: 0.95rem;
                color: #1e293b;
                transition: all 0.2s;
                outline: none;
            }
            .input-modern:focus { border-color: var(--green-400); box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1); }

            .btn-premium {
                height: 52px;
                width: 100%;
                background: #1e293b;
                color: white;
                border: none;
                border-radius: 14px;
                font-weight: 700;
                font-size: 0.95rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                transition: all 0.2s;
            }
            .btn-premium:hover { background: #0f172a; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
            .btn-premium:active { transform: translateY(0); }

            /* Grid e Cards de Resultados */
            .prospecting-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                gap: 24px;
            }

            .result-card-modern {
                background: white;
                border: 1px solid #eef2f6;
                border-radius: 20px;
                padding: 24px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                animation: slideUp 0.3s ease-out both;
            }
            @keyframes slideUp { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }

            .result-card-modern:hover {
                transform: translateY(-8px);
                box-shadow: 0 20px 40px -15px rgba(0,0,0,0.1);
                border-color: var(--green-200);
            }

            .card-top { display: flex; justify-content: space-between; align-items: flex-start; }
            .niche-tag {
                background: #f0fdf4;
                color: #166534;
                font-size: 0.65rem;
                font-weight: 800;
                padding: 4px 10px;
                border-radius: 30px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .rating-badge {
                display: flex;
                align-items: center;
                gap: 4px;
                background: #fffbeb;
                color: #92400e;
                font-size: 0.75rem;
                font-weight: 700;
                padding: 3px 8px;
                border-radius: 8px;
            }

            .card-info h4 { margin: 8px 0 6px; font-size: 1.1rem; font-weight: 800; color: #1e293b; line-height: 1.3; }
            .card-info p { margin: 0; font-size: 0.82rem; color: #64748b; line-height: 1.5; }

            .card-footer-actions {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-top: auto;
                padding-top: 20px;
            }

            .btn-action-glow {
                height: 44px;
                background: #ecfdf5;
                color: #059669;
                border: 1px solid #d1fae5;
                border-radius: 12px;
                font-weight: 700;
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .btn-action-glow:hover { background: #059669; color: white; border-color: #059669; }

            .btn-action-outline {
                height: 44px;
                background: white;
                color: #64748b;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                font-weight: 600;
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.2s;
                text-decoration: none;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .btn-action-outline:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }

            /* Empty State e Radar Animation */
            .empty-state-card {
                grid-column: 1/-1;
                text-align: center;
                padding: 80px 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
            }
            .empty-illustration { position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; }
            .radar-circle {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 2px solid #22c55e;
                border-radius: 50%;
                opacity: 0;
                animation: radarRipple 3s infinite linear;
            }
            .delay-1 { animation-delay: 1s; }
            .delay-2 { animation-delay: 2s; }
            @keyframes radarRipple { 
                0% { transform: scale(0.5); opacity: 0.8; }
                100% { transform: scale(2.5); opacity: 0; }
            }

            .results-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding: 0 8px; }
            .results-info { display: flex; align-items: center; gap: 12px; }
            .results-info h4 { margin: 0; color: #1e293b; font-weight: 800; }
            .badge-live { background: #fee2e2; color: #ef4444; font-size: 0.6rem; font-weight: 900; padding: 2px 6px; border-radius: 4px; animation: blink 1.5s infinite; }
            @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

            .btn-secondary-modern {
                background: #f1f5f9;
                color: #475569;
                border: none;
                padding: 10px 18px;
                border-radius: 12px;
                font-weight: 700;
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.2s;
            }
            .btn-secondary-modern:hover { background: #e2e8f0; color: #1e293b; }

            /* Mobile Responsiveness */
            @media (max-width: 768px) {
                .search-glass-card { padding: 20px; border-radius: 18px; }
                .search-controls { grid-template-columns: 1fr; gap: 16px; }
                .btn-premium { width: 100%; }
                .icon-pulse { width: 44px; height: 44px; font-size: 1.5rem; }
                .search-header h3 { font-size: 1.1rem; }
                .prospecting-grid { grid-template-columns: 1fr; }
                .results-header { flex-direction: column; align-items: flex-start; gap: 12px; }
                .btn-secondary-modern { width: 100%; text-align: center; }
            }
        </style>
    `, 'prospecting');

    const resultsEl = document.getElementById('prospecting-results');
    const searchBtn = document.getElementById('btn-search-prospects');
    const nicheInput = document.getElementById('prospect-niche');
    const locInput = document.getElementById('prospect-location');

    searchBtn.addEventListener('click', async () => {
        const q = nicheInput.value;
        const loc = locInput.value.trim();

        if (!loc) return toast('Digite a localização (Bairro ou Cidade)', 'warning');

        searchBtn.disabled = true;
        searchBtn.innerHTML = '<span class="spinner-small"></span> Escaneando...';
        resultsEl.innerHTML = `
            <div style="text-align:center;padding:100px 0;grid-column:1/-1">
                <div class="radar-scan"></div>
                <p style="margin-top:40px; color:#64748b; font-weight:500">O Gota Satélite está analisando a região de ${loc}...</p>
                <style>
                    .radar-scan {
                        width: 80px; height: 80px;
                        border: 4px solid #22c55e;
                        border-radius: 50%;
                        border-top-color: transparent;
                        margin: 0 auto;
                        animation: spin 1s infinite linear;
                    }
                    @keyframes spin { to { transform: rotate(360deg); } }
                </style>
            </div>`;

        try {
            const data = await api('GET', `/api/prospects/search?q=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}`);
            renderResults(data.results, q);
        } catch (err) {
            toast(err.message || 'Erro na busca', 'error');
            resetSearchBtn();
        }
    });

    function resetSearchBtn() {
        searchBtn.disabled = false;
        searchBtn.innerHTML = '<span class="btn-text">Escanear Leads</span><span class="btn-icon">🚀</span>';
    }

    function renderResults(results, niche) {
        resetSearchBtn();
        document.getElementById('prospecting-results-header').style.display = 'flex';
        document.getElementById('results-count').textContent = `${results.length} Parceiros encontrados`;

        if (results.length === 0) {
            resultsEl.innerHTML = `
                <div class="empty-state-card">
                    <span style="font-size:3rem">📵</span>
                    <h3>Sem sinal na região</h3>
                    <p>Não encontramos parceiros com esse critério. Tente um termo mais amplo.</p>
                </div>`;
            return;
        }

        resultsEl.innerHTML = results.map((p, i) => `
            <div class="result-card-modern" style="animation-delay: ${i * 0.05}s">
                <div class="card-top">
                    <span class="niche-tag">${niche}</span>
                    ${p.rating ? `<div class="rating-badge">⭐ ${p.rating}</div>` : ''}
                </div>
                <div class="card-info">
                    <h4>${p.nome}</h4>
                    <p>📍 ${p.endereco}</p>
                    ${p.user_ratings_total ? `<p style="font-size:0.75rem;margin-top:4px">💬 ${p.user_ratings_total} recomendações no Google</p>` : ''}
                </div>
                <div class="card-footer-actions">
                    <button class="btn-action-glow btn-save-prospect" 
                            data-name="${p.nome}" 
                            data-addr="${p.endereco}" 
                            data-placeid="${p.place_id}"
                            data-niche="${niche}">
                        🚀 Iniciar Flow
                    </button>
                    <a href="https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${p.place_id}" 
                       target="_blank" class="btn-action-outline">
                       🌍 Ver Perfil
                    </a>
                </div>
            </div>
        `).join('');

        // Bind Save Buttons
        resultsEl.querySelectorAll('.btn-save-prospect').forEach(btn => {
            btn.addEventListener('click', async () => {
                const payload = {
                    nome: btn.dataset.name,
                    endereco: btn.dataset.addr,
                    place_id: btn.dataset.placeid,
                    nicho: btn.dataset.niche
                };
                btn.disabled = true;
                btn.textContent = '⏳ Salvando...';
                try {
                    await api('POST', '/api/prospects', payload);
                    toast('Parceria enviada para o seu Flow! 🚀', 'success');
                    btn.textContent = '✅ Salvo';
                    btn.style.background = '#dcfce7';
                    btn.style.color = '#15803d';
                } catch (err) {
                    toast('Erro ao salvar', 'error');
                    btn.disabled = false;
                    btn.textContent = '🚀 Iniciar Flow';
                }
            });
        });
    }

    document.getElementById('btn-view-my-prospects').addEventListener('click', () => {
        renderMyProspects();
    });

    // ── Pipeline / Flow View (Design Refined) ─────────────────────────
    async function renderMyProspects() {
        resultsEl.innerHTML = `<div style="text-align:center;padding:100px 0;grid-column:1/-1"><div class="spinner"></div></div>`;
        document.getElementById('prospecting-results-header').style.display = 'none';

        try {
            const prospects = await api('GET', '/api/prospects');
            
            container.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32px; flex-wrap:wrap; gap:16px" class="animate-fade-in">
                    <div>
                        <h2 style="margin:0; font-weight:800; color:#1e293b">📈 Flow de Parcerias</h2>
                        <p style="margin:4px 0 0; color:#64748b; font-size:0.9rem">Gerencie sua rede de prospecção e novos negócios.</p>
                    </div>
                    <button class="btn-secondary-modern" onclick="window.location.reload()">
                        🛰️ Voltar ao Radar
                    </button>
                </div>
                
                <div class="prospecting-pipeline-scroll" style="display:flex;gap:24px;overflow-x:auto;padding-bottom:32px;min-height:75vh">
                    ${renderColumn('prospectado', '🔍 Prospecção', '#64748b', prospects)}
                    ${renderColumn('contatado', '📱 Contatado', '#3b82f6', prospects)}
                    ${renderColumn('negociacao', '🤝 Negociação', '#a78bfa', prospects)}
                    ${renderColumn('fechado', '🏆 Fechado', '#10b981', prospects)}
                </div>
                
                <style>
                    .pipeline-col { min-width:320px; background:#f8fafc; border-radius:24px; padding:20px; border:1px solid #e2e8f0; display:flex; flex-direction:column; gap:16px; }
                    .col-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
                    .col-title { font-weight:800; font-size:0.9rem; color:#1e293b; display:flex; align-items:center; gap:8px; }
                    .col-count { background:white; border:1px solid #e2e8f0; padding:2px 10px; border-radius:30px; font-size:0.75rem; font-weight:700; color:#64748b; }
                    
                    .pipeline-items { display:flex; flex-direction:column; gap:14px; }
                    .prospect-mini-card {
                        background:white; border:1px solid rgba(0,0,0,0.05); border-radius:18px; padding:16px;
                        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition:all 0.2s;
                    }
                    .prospect-mini-card:hover { transform:scale(1.02); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
                    
                    .mini-tag { font-size:0.55rem; font-weight:900; text-transform:uppercase; color:#94a3b8; margin-bottom:4px; }
                    .mini-name { font-weight:700; font-size:0.88rem; color:#1e293b; margin-bottom:4px; }
                    .mini-addr { font-size:0.72rem; color:#64748b; margin-bottom:12px; }
                    
                    .mini-actions { display:grid; grid-template-columns: 1fr 40px; gap:8px; }
                    .btn-move { background:#1e293b; color:white; border:none; padding:8px; border-radius:10px; font-size:0.75rem; font-weight:700; cursor:pointer; }
                    .btn-trash { background:#fee2e2; color:#ef4444; border:none; border-radius:10px; cursor:pointer; font-size:0.8rem; }
                </style>
            `;

            setupPipelineListeners();
        } catch (err) {
            toast('Erro ao carregar seu flow', 'error');
        }
    }

    function renderColumn(status, label, color, all) {
        const filtered = all.filter(p => p.status === status);
        return `
            <div class="pipeline-col">
                <div class="col-header">
                    <div class="col-title" style="color:${color}">${label}</div>
                    <span class="col-count">${filtered.length}</span>
                </div>
                <div class="pipeline-items">
                    ${filtered.length === 0 ? '<div style="text-align:center;padding:20px;font-size:0.75rem;color:#94a3b8;border:2px dashed #e2e8f0;border-radius:18px">Vazio</div>' : ''}
                    ${filtered.map(p => `
                        <div class="prospect-mini-card">
                            <div class="mini-tag">${p.nicho}</div>
                            <div class="mini-name">${p.nome}</div>
                            <div class="mini-addr">📍 ${p.endereco.split(',')[0]}</div>
                            
                            <div class="mini-actions">
                                ${status !== 'fechado' ? `<button class="btn-move btn-status-move" data-id="${p.id}" data-next="${getNextStatus(status)}">Avançar →</button>` : `<div style="text-align:center;font-size:0.7rem;color:#10b981;font-weight:700;padding:8px">CONCLUÍDO ✨</div>`}
                                <button class="btn-trash btn-delete-prospect" data-id="${p.id}" title="Remover">🗑️</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function getNextStatus(curr) {
        if (curr === 'prospectado') return 'contatado';
        if (curr === 'contatado') return 'negociacao';
        if (curr === 'negociacao') return 'fechado';
        return curr;
    }

    function setupPipelineListeners() {
        document.querySelectorAll('.btn-status-move').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const next = btn.dataset.next;
                btn.disabled = true;
                btn.innerHTML = '...';
                try {
                    await api('PATCH', `/api/prospects/${id}`, { status: next });
                    toast('Lead avançou no funil! 📈', 'success');
                    renderMyProspects();
                } catch (err) { toast('Erro ao mover lead', 'error'); }
            });
        });
        document.querySelectorAll('.btn-delete-prospect').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Deseja remover este lead da sua lista?')) return;
                try {
                    await api('DELETE', `/api/prospects/${btn.dataset.id}`);
                    toast('Parceria removida.', 'info');
                    renderMyProspects();
                } catch (err) { toast('Erro ao remover', 'error'); }
            });
        });
    }
}
