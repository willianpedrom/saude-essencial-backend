import { api } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { toast } from '../utils.js';

export async function renderProspecting(router) {
    const container = renderLayout(router, 'Radar de Leads Inteligente 🛰️', `
        <div class="prospecting-container">
            <div class="card" style="margin-bottom:24px">
                <div class="card-header">
                    <h3>🔍 Onde você quer prospectar hoje?</h3>
                    <p style="font-size:0.82rem;color:var(--text-muted)">Busque parceiros por nicho e localidade usando a base do Google Maps.</p>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:12px;padding:10px 0">
                    <div>
                        <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:var(--text-muted)">NICHO / CATEGORIA</label>
                        <select id="prospect-niche" class="input">
                            <option value="Academia">🏋️ Academias</option>
                            <option value="Terapeuta">🧘 Terapeutas / Holísticos</option>
                            <option value="Consultório de Nutrição">🍎 Nutricionistas</option>
                            <option value="Clínica de Estética">✨ Estética / SPA</option>
                            <option value="Estúdio de Yoga">🧘 Yoga / Pilates</option>
                            <option value="Crossfit">🔥 Crossfit</option>
                            <option value="Psicólogo">🧠 Psicólogos</option>
                            <option value="Loja de Produtos Naturais">🌱 Produtos Naturais</option>
                            <option value="Farmácia de Manipulação">💊 Farmácias</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:var(--text-muted)">LOCALIZAÇÃO (Bairro, Cidade ou CEP)</label>
                        <input type="text" id="prospect-location" class="input" placeholder="Ex: Copacabana, Rio de Janeiro" />
                    </div>
                    <div style="display:flex;align-items:flex-end">
                        <button id="btn-search-prospects" class="btn btn-primary" style="height:44px;padding:0 24px">Buscar Leads</button>
                    </div>
                </div>
            </div>

            <div id="prospecting-results-header" style="display:none;align-items:center;justify-content:space-between;margin-bottom:16px">
                <h4 id="results-count" style="margin:0;color:var(--text-dark)">Resultados Encontrados</h4>
                <button class="btn btn-sm" id="btn-view-my-prospects" style="background:var(--green-100);color:var(--green-700)">📂 Ver meu Flow de Parcerias</button>
            </div>

            <div id="prospecting-results" class="prospecting-grid">
                <!-- Skeleton / Empty State -->
                <div style="text-align:center;padding:60px;color:var(--text-muted);grid-column:1/-1">
                    <div style="font-size:4rem;margin-bottom:20px">🛰️</div>
                    <h3>Radar em Standby</h3>
                    <p>Digite o nicho e a cidade acima para escanear o mercado.</p>
                </div>
            </div>
        </div>

        <style>
            .prospecting-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                gap: 20px;
            }
            .prospect-card {
                background: white;
                border: 1px solid var(--border);
                border-radius: 16px;
                padding: 18px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                transition: all 0.2s;
                position: relative;
            }
            .prospect-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 30px rgba(0,0,0,0.08);
                border-color: var(--green-200);
            }
            .prospect-type {
                font-size: 0.65rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--green-600);
                background: var(--green-50);
                padding: 3px 8px;
                border-radius: 4px;
                display: inline-block;
            }
            .prospect-name {
                font-size: 1.05rem;
                font-weight: 700;
                color: var(--text-dark);
                margin: 4px 0;
            }
            .prospect-addr {
                font-size: 0.8rem;
                color: var(--text-muted);
                line-height: 1.4;
            }
            .prospect-rating {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 0.8rem;
                font-weight: 600;
                color: #f59e0b;
            }
            .prospect-actions {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-top: auto;
                padding-top: 12px;
                border-top: 1px solid var(--border-light);
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
        searchBtn.textContent = '🛰️ Escaneando...';
        resultsEl.innerHTML = `
            <div style="text-align:center;padding:60px;grid-column:1/-1">
                <div class="spinner" style="margin-bottom:12px"></div>
                <p>O Google está buscando os melhores parceiros para você...</p>
            </div>`;

        try {
            const data = await api('GET', `/api/prospects/search?q=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}`);
            renderResults(data.results, q);
        } catch (err) {
            toast(err.message || 'Erro na busca', 'error');
            searchBtn.disabled = false;
            searchBtn.textContent = 'Buscar Leads';
        }
    });

    function renderResults(results, niche) {
        searchBtn.disabled = false;
        searchBtn.textContent = 'Buscar Leads';
        document.getElementById('prospecting-results-header').style.display = 'flex';
        document.getElementById('results-count').textContent = `${results.length} Parceiros em Potencial encontrados`;

        if (results.length === 0) {
            resultsEl.innerHTML = `
                <div style="text-align:center;padding:60px;color:var(--text-muted);grid-column:1/-1">
                    <h3>Nenhum resultado</h3>
                    <p>Tente mudar o nicho ou ser menos específico na localização.</p>
                </div>`;
            return;
        }

        resultsEl.innerHTML = results.map(p => `
            <div class="prospect-card">
                <div>
                    <span class="prospect-type">${niche}</span>
                    <div class="prospect-name">${p.nome}</div>
                    <div class="prospect-addr">📍 ${p.endereco}</div>
                    ${p.rating ? `<div class="prospect-rating">⭐ ${p.rating} (${p.user_ratings_total} avaliações)</div>` : ''}
                </div>
                <div class="prospect-actions">
                    <button class="btn btn-sm btn-outline btn-save-prospect" 
                            data-name="${p.nome}" 
                            data-addr="${p.endereco}" 
                            data-placeid="${p.place_id}"
                            data-niche="${niche}">
                        🚀 Iniciar Flow
                    </button>
                    <a href="https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${p.place_id}" 
                       target="_blank" class="btn btn-sm btn-outline" style="text-align:center">
                       🌍 Ver no Maps
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
                    toast('Lead enviado para o seu Flow de Parcerias! 🚀', 'success');
                    btn.textContent = '✅ Salvo no Flow';
                } catch (err) {
                    toast('Erro ao salvar lead', 'error');
                    btn.disabled = false;
                    btn.textContent = '🚀 Iniciar Flow';
                }
            });
        });
    }

    document.getElementById('btn-view-my-prospects').addEventListener('click', () => {
        renderMyProspects();
    });

    // ── Pipeline / Flow View ─────────────────────────────────────────
    async function renderMyProspects() {
        resultsEl.innerHTML = `<div style="text-align:center;padding:60px;grid-column:1/-1"><div class="spinner"></div></div>`;
        document.getElementById('prospecting-results-header').style.display = 'none';

        try {
            const prospects = await api('GET', '/api/prospects');
            
            container.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
                    <h2 style="margin:0">📈 Meu Flow de Parcerias</h2>
                    <button class="btn btn-outline" onclick="window.location.reload()">🔄 Voltar para Busca</button>
                </div>
                
                <div class="prospecting-pipeline-scroll" style="display:flex;gap:20px;overflow-x:auto;padding-bottom:20px;min-height:70vh">
                    ${renderColumn('prospectado', '🛰️ Prospecção', prospects)}
                    ${renderColumn('contatado', '📱 Primeiro Contato', prospects)}
                    ${renderColumn('negociacao', '🤝 Negociação', prospects)}
                    ${renderColumn('fechado', '✅ Parceria Fechada', prospects)}
                </div>
            `;

            setupPipelineListeners();
        } catch (err) {
            toast('Erro ao carregar seu flow', 'error');
        }
    }

    function renderColumn(status, label, all) {
        const filtered = all.filter(p => p.status === status);
        return `
            <div class="pipeline-col" style="min-width:300px;background:#f8fafc;border-radius:12px;padding:16px;border:1px solid #e2e8f0">
                <div style="display:flex;justify-content:space-between;margin-bottom:16px">
                    <strong style="font-size:0.9rem;color:var(--text-dark)">${label}</strong>
                    <span style="background:#fff;border:1px solid #cbd5e1;padding:2px 8px;border-radius:12px;font-size:0.75rem">${filtered.length}</span>
                </div>
                <div class="pipeline-items" style="display:flex;flex-direction:column;gap:12px">
                    ${filtered.map(p => `
                        <div class="prospect-card" style="padding:14px;gap:8px;box-shadow:0 2px 4px rgba(0,0,0,0.05)" data-id="${p.id}">
                            <div class="prospect-type" style="font-size:0.6rem">${p.nicho}</div>
                            <div class="prospect-name" style="font-size:0.9rem">${p.nome}</div>
                            <div class="prospect-addr" style="font-size:0.75rem">${p.endereco.substring(0, 60)}...</div>
                            
                            <div style="display:flex;gap:4px;margin-top:4px">
                                ${status !== 'fechado' ? `<button class="btn-status-move" data-id="${p.id}" data-next="${getNextStatus(status)}" style="flex:1;font-size:0.7rem;padding:4px;background:var(--green-50);color:var(--green-700);border:1px solid var(--green-200);border-radius:4px;cursor:pointer">Avançar ➡️</button>` : ''}
                                <button class="btn-delete-prospect" data-id="${p.id}" style="font-size:0.7rem;padding:4px;background:#fee2e2;color:#991b1b;border:1px solid #fecaca;border-radius:4px;cursor:pointer">🗑️</button>
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
                try {
                    await api('PATCH', `/api/prospects/${id}`, { status: next });
                    toast('Lead avançou no funil!', 'success');
                    renderMyProspects(); // Refresh view
                } catch (err) { toast('Erro ao mover lead', 'error'); }
            });
        });
        document.querySelectorAll('.btn-delete-prospect').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Deseja remover este lead da sua lista?')) return;
                try {
                    await api('DELETE', `/api/prospects/${btn.dataset.id}`);
                    toast('Lead removido.', 'info');
                    renderMyProspects();
                } catch (err) { toast('Erro ao remover', 'error'); }
            });
        });
    }
}
