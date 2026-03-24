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

            <div class="view-toggles" style="display:flex; gap:10px; margin-bottom:20px">
                <button class="btn-toggle active" id="view-list">📋 Lista de Busca</button>
                <button class="btn-toggle" id="view-flow">📊 Meu Flow (CRM)</button>
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

            .view-toggles { background: #f1f5f9; padding: 6px; border-radius: 14px; width: fit-content; }
            .btn-toggle { border: none; background: transparent; padding: 8px 16px; border-radius: 10px; font-size: 0.85rem; font-weight: 600; color: var(--p-gray); cursor: pointer; transition: 0.2s; }
            .btn-toggle.active { background: #fff; color: var(--p-secondary); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }

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
    const selectNiche = document.getElementById('prospect-niche');
    const inputLoc = document.getElementById('prospect-location');
    
    const viewList = document.getElementById('view-list');
    const viewFlow = document.getElementById('view-flow');

    let searchResults = [];

    quickFlowBtn.addEventListener('click', () => switchView('flow'));
    
    viewList.onclick = () => switchView('list');
    viewFlow.onclick = () => switchView('flow');

    function switchView(view) {
        [viewList, viewFlow].forEach(b => b.classList.remove('active'));
        resultsEl.style.display = 'none';
        const pipeline = document.querySelector('.pipeline-container');
        if (pipeline) pipeline.style.display = 'none';
        document.getElementById('prospecting-results-header').style.display = 'none';

        if (view === 'list') {
            viewList.classList.add('active');
            resultsEl.style.display = 'grid';
            if (searchResults.length) document.getElementById('prospecting-results-header').style.display = 'flex';
        } else if (view === 'flow') {
            viewFlow.classList.add('active');
            renderMyProspects();
        }
    }

    searchBtn.onclick = async () => {
        const query = `${selectNiche.value} em ${inputLoc.value || 'Brasil'}`;
        searchBtn.disabled = true;
        searchBtn.textContent = 'Buscando...';
        resultsEl.innerHTML = '<div class="loader-premium">📡 Escaneando região...</div>';
        switchView('list');

        try {
            const data = await api('GET', `/api/prospects/search?q=${encodeURIComponent(query)}`);
            searchResults = data.results || [];
            renderSearchResults(searchResults, selectNiche.value);
        } catch (err) {
            toast('Erro na busca');
            resultsEl.innerHTML = '<p>Falha ao buscar prospectos.</p>';
        } finally {
            searchBtn.disabled = false;
            searchBtn.textContent = 'Buscar Parceiros';
        }
    };

    window.saveProspectOnMap = async (placeId) => {
        const p = searchResults.find(r => r.place_id === placeId);
        if (!p) return;
        try {
            // Enriquecimento com timeout generoso (2.5s)
            const details = await Promise.race([
                api('GET', `/api/prospects/details/${p.place_id}`),
                new Promise(r => setTimeout(()=>r({}), 2500))
            ]).catch(e => {
                console.warn('[Enrichment Failed]', e);
                return {};
            });

            await api('POST', '/api/prospects', { 
                nome: p.nome,
                endereco: p.endereco,
                place_id: p.place_id,
                nicho: selectNiche.value, // Use the current niche from the select
                rating: p.rating || '',
                user_ratings_total: p.user_ratings_total || 0,
                lat: p.lat,
                lng: p.lng,
                ...details 
            });
            toast('Lead salvo no Flow! 🎯');
            // Optionally, update the list view if it's active
            if (viewList.classList.contains('active')) {
                renderSearchResults(searchResults, selectNiche.value);
            }
        } catch (e) { toast('Erro ao salvar'); }
    };

    window.manageLeadOnMap = async (id) => {
        const p = savedProspects.find(r => r.id === id);
        if (p) openLeadModal(p); // Assuming openLeadModal is defined elsewhere or will be added
    };

    function calculateScore(p) {
        const rating = parseFloat(p.rating) || 0;
        const reviews = parseInt(p.user_ratings_total) || 0;
        // Base: Rating do Google (0-5 pts)
        let score = rating;
        // Bônus por volume de avaliações (0-3 pts) - Consideramos 100+ como teto prático
        score += Math.min(3, (reviews / 100) * 3);
        // Bônus por ter site (2 pts) - Indica negócio mais estruturado
        if (p.website) score += 2;
        return Math.min(10, score).toFixed(1);
    }

    function renderSearchResults(results, niche) {
        resetBtn();
        document.getElementById('prospecting-results-header').style.display = 'flex';
        if (results.length === 0) {
            resultsEl.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px">Nenhum resultado nesta localização.</p>';
            return;
        }

        // Senior Move: Calcular scores e ordenar pelo melhor potencial
        const scoredResults = results.map(p => ({ ...p, _score: calculateScore(p) }))
                                    .sort((a, b) => b._score - a._score);

        resultsEl.innerHTML = scoredResults.map(p => {
            const scoreColor = p._score >= 8 ? '#10b981' : (p._score >= 6 ? '#f59e0b' : '#6b7280');
            const scoreLabel = p._score >= 8 ? '🔥 Explosivo' : (p._score >= 6 ? '✅ Bom' : '⚪ Neutro');

            return `
                <div class="result-card-modern animate-slide-up">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                        <div style="font-size:0.65rem;font-weight:900;color:var(--p-primary);text-transform:uppercase">${niche}</div>
                        <div style="background:${scoreColor}15;color:${scoreColor};padding:2px 6px;border-radius:4px;font-size:0.6rem;font-weight:800;border:1px solid ${scoreColor}30">
                            ${scoreLabel} (${p._score})
                        </div>
                    </div>
                    <h4 style="margin:0 0 5px;font-size:1rem;line-height:1.2">${p.nome}</h4>
                    <p style="font-size:0.8rem;color:var(--p-gray);margin-bottom:12px">${p.endereco.split(',')[0]}</p>
                    
                    <div style="display:flex;gap:10px;margin-bottom:15px;font-size:0.75rem;color:var(--p-gray)">
                        <span title="Rating Google">⭐ ${p.rating || 'N/A'}</span>
                        <span title="Total de Avaliações">👥 ${p.user_ratings_total || 0}</span>
                    </div>

                    <button class="btn-save-main btn-save-lead" 
                        data-name="${p.nome}" 
                        data-addr="${p.endereco}" 
                        data-placeid="${p.place_id}" 
                        data-niche="${niche}"
                        data-rating="${p.rating || ''}"
                        data-reviews="${p.user_ratings_total || 0}"
                        style="height:40px;font-size:0.85rem">Adicionar ao Flow</button>
                </div>
            `;
        }).join('');

        resultsEl.querySelectorAll('.btn-save-lead').forEach(btn => {
            btn.addEventListener('click', async () => {
                const pid = btn.dataset.placeid;
                btn.disabled = true; 
                btn.innerHTML = '⌛ Capturando...';
                
                try {
                    // Enriquecimento com timeout generoso (2.5s)
                    const details = await Promise.race([
                        api('GET', `/api/prospects/details/${pid}`),
                        new Promise(r => setTimeout(()=>r({}), 2500))
                    ]).catch(e => {
                        console.warn('[Enrichment Failed]', e);
                        return {};
                    });

                    await api('POST', '/api/prospects', { 
                        nome: btn.dataset.name,
                        endereco: btn.dataset.addr,
                        place_id: btn.dataset.placeid,
                        nicho: btn.dataset.niche,
                        rating: btn.dataset.rating,
                        user_ratings_total: btn.dataset.reviews,
                        ...details 
                    });
                    
                    toast('Lead capturado e enviado ao Flow!');
                    btn.classList.add('btn-wa-active');
                    btn.innerHTML = '✅ VER NO FLOW';
                    btn.disabled = false;
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        renderMyProspects();
                    };
                } catch (err) {
                    console.error('[Save Lead Error]', err);
                    toast(`Erro: ${err.message || 'Falha na captura'}`, 'error');
                    btn.disabled = false;
                    btn.innerHTML = 'Tentar Novamente';
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

    function getOutreachScript(p) {
        const niche = (p.nicho || '').toLowerCase();
        const nome = p.nome || 'Parceiro';
        
        const scripts = {
            'academia': `Olá! Tudo bem? Sou Especialista em Saúde Integrativa. Vi que a ${nome} é referência na região! Sabia que óleos como Peppermint podem aumentar a performance e foco dos seus alunos? Gostaria de agendar uma breve demonstração sem custo para seus professores?`,
            'clínica de estética': `Olá! Tudo bem? Sou Especialista em Saúde Integrativa. Parabéns pelo trabalho na ${nome}! Trabalhamos com várias estéticas que usam nossos óleos para elevar a experiência das clientes e potencializar resultados de drenagem. Podemos agendar um café rápido para eu lhe mostrar como agregar esse valor premium?`,
            'nutricionista': `Olá! Tudo bem? Sou Especialista em Saúde Integrativa. Vi seu perfil e adoraria conversar sobre como nossos protocolos naturais podem complementar seus planos alimentares e trazer mais bem-estar aos seus pacientes. Teria 5 minutos para uma conversa rápida?`,
            'yoga': `Olá! Tudo bem? Sou Especialista em Saúde Integrativa. Vi o trabalho incrível do seu estúdio ${nome}! Nossos óleos são perfeitos para criar um ambiente de foco e relaxamento profundo nas aulas. Gostaria de conhecer nosso kit corporativo para estúdios de Yoga?`
        };

        const defaultScript = `Olá! Tudo bem? Sou Especialista em Saúde Integrativa. Estava analisando empresas de destaque na região e a ${nome} me chamou atenção pela ótima reputação. Gostaria de conversar sobre uma possível parceria para agregar valor aos seus serviços com soluções 100% naturais. Qual o melhor horário para falarmos?`;

        for (const key in scripts) {
            if (niche.includes(key)) return encodeURIComponent(scripts[key]);
        }
        return encodeURIComponent(defaultScript);
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
                        const script = getOutreachScript(p);
                        const wa = tel ? `https://wa.me/${tel.startsWith('55') ? tel : '55'+tel}?text=${script}` : null;
                        const score = calculateScore(p);
                        const scoreColor = score >= 8 ? '#10b981' : (score >= 6 ? '#f59e0b' : '#6b7280');

                        return `
                        <div class="prospect-card animate-slide-up" draggable="true" data-id="${p.id}">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                                <div style="font-size:0.55rem;font-weight:900;color:var(--p-primary);text-transform:uppercase">${p.nicho}</div>
                                <div style="font-size:0.6rem;font-weight:800;color:${scoreColor}" title="Potencial: ${score}/10">⭐ ${score}</div>
                            </div>
                            <h4 style="margin:0 0 10px;font-size:0.95rem">${p.nome}</h4>
                            
                            <div class="card-actions-row">
                                <a href="${wa || '#'}" target="${wa ? '_blank' : '_self'}" class="action-icon-btn ${wa ? 'btn-wa-active btn-wa-outreach' : ''} ${!wa ? 'open-edit' : ''}" data-p='${JSON.stringify(p)}' title="${wa ? 'WhatsApp com Script Personalizado' : 'Adicionar WhatsApp'}">📱</a>
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

    function openLeadModal(p) {
        const modal = document.getElementById('history-modal');
        if (!modal) return;
        
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
                // Se o mapa estiver ativo, atualiza markers, senão re-renderiza o flow
                if (viewMap.classList.contains('active')) updateMarkers();
                else renderMyProspects();
            } catch (err) { 
                toast('Falha ao salvar'); 
                saveBtn.disabled = false; saveBtn.textContent = 'Atualizar Contatos'; 
            }
        };

        const history = p.historico || [];
        const histList = document.getElementById('history-list');
        histList.innerHTML = history.length ? [...history].reverse().map(h => `
            <div class="history-item-mini">
                <div class="hi-date-mini">${new Date(h.data).toLocaleDateString()}</div>
                <div>${h.tipo === 'status_change' ? `Fase: ${h.para}` : h.texto}</div>
            </div>
        `).join('') : '<p>Sem histórico recente.</p>';

        modal.style.display = 'flex';
    }

    function initLeadManagement() {
        document.querySelectorAll('.open-edit').forEach(btn => {
            btn.onclick = (e) => {
                const p = JSON.parse(btn.dataset.p);
                openLeadModal(p);
            };
        });

        // CRM Inteligente: Registro Automático de Abordagem
        document.querySelectorAll('.btn-wa-outreach').forEach(btn => {
            btn.onclick = async (e) => {
                const p = JSON.parse(btn.dataset.p);
                // Apenas registrar se estiver em 'prospectado'
                if (p.status === 'prospectado') {
                    try {
                        await api('PATCH', `/api/prospects/${p.id}`, {
                            status: 'contatado',
                            notas: `Auto-Log: Abordagem via WhatsApp (Script: ${p.nicho || 'Geral'})`
                        });
                        toast('CRM: Abordagem registrada e lead movido para Contatado!');
                        // Delay para dar tempo do WhatsApp abrir antes do refresh visual
                        setTimeout(() => renderMyProspects(), 1000);
                    } catch (err) {
                        console.error('[Auto Log Error]', err);
                    }
                }
            };
        });
    }
}
