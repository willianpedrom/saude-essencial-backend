import { api, auth } from '../store.js?v=1010';
import { renderLayout } from './Dashboard.js?v=1010';
import { toast, modal, formatDate } from '../utils.js?v=1010';

export async function renderEquipe(router) {
    const consultant = auth.current;
    
    // Renders layout immediately with a loading state
    renderLayout(router, 'Minha Equipe 🤝', `
        <div style="display:flex;align-items:center;justify-content:center;min-height:50vh;">
            <div class="loader-dots"><span></span><span></span><span></span></div>
        </div>
    `, 'equipe');

    try {
        // Loads team data for logged in consultant
        const data = await api('GET', '/api/equipe/me');
        
        if (!data.equipe) {
            // Case A: No team associated yet. Offer registration or creation.
            return renderTeamSetup(router, consultant);
        }

        if (data.role === 'lider') {
            // Case B: Leader dashboard
            return renderLeaderDashboard(router, data.equipe);
        } else {
            // Case C: Member dashboard
            return renderMemberDashboard(router, data.equipe);
        }
    } catch (err) {
        console.error(err);
        toast(err.message || 'Erro ao carregar módulo de equipes.', 'danger');
    }
}

// ── Screen 1: Registration or Creation Setup ──────────────────
function renderTeamSetup(router, consultant) {
    const pc = document.getElementById('page-content');
    if (!pc) return;

    // Checks if the plan has team permissions
    const canCreate = consultant.assinatura?.tem_equipe || consultant.role === 'admin';

    pc.innerHTML = `
        <style>
            .setup-container {
                max-width: 800px;
                margin: 40px auto;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 32px;
            }
            @media (max-width: 768px) {
                .setup-container { grid-template-columns: 1fr; gap: 24px; margin: 20px auto; }
            }
            .setup-card {
                background: white;
                border-radius: var(--radius-lg);
                padding: 36px 30px;
                border: 1px solid var(--border);
                box-shadow: var(--shadow-sm);
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .setup-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-md);
            }
            .setup-icon {
                font-size: 3rem;
                margin-bottom: 16px;
            }
            .setup-title {
                font-size: 1.3rem;
                font-weight: 700;
                color: var(--green-950);
                margin-bottom: 12px;
            }
            .setup-desc {
                font-size: 0.92rem;
                color: var(--text-muted);
                line-height: 1.6;
                margin-bottom: 24px;
            }
        </style>

        <div class="setup-container">
            <!-- Join Team Card -->
            <div class="setup-card">
                <div>
                    <div class="setup-icon">🤝</div>
                    <h3 class="setup-title">Ingressar em uma Equipe</h3>
                    <p class="setup-desc">Recebeu um código de convite do seu Líder doTERRA? Insira o código abaixo para se conectar à equipe dele, receber leads compartilhados, acessar a biblioteca de scripts e os vídeos de treinamento.</p>
                </div>
                <div>
                    <div class="form-group" style="margin-bottom:16px;">
                        <input type="text" id="invite-code-input" class="form-input" placeholder="Ex: LIDER-SLUG-1234" style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a; text-transform:uppercase;" />
                    </div>
                    <button id="btn-join-team" class="btn btn-primary" style="width:100%">✓ Entrar na Equipe</button>
                </div>
            </div>

            <!-- Create Team Card -->
            <div class="setup-card">
                <div>
                    <div class="setup-icon">👑</div>
                    <h3 class="setup-title">Criar minha Equipe</h3>
                    <p class="setup-desc">Seja o líder do seu time! Crie sua equipe para ter uma visão analítica do progresso dos seus consultores, compartilhar leads de forma simples, postar avisos urgentes via push e manter uma biblioteca de scripts e roteiros exclusivos.</p>
                </div>
                <div>
                    ${canCreate ? `
                        <div class="form-group" style="margin-bottom:16px;">
                            <input type="text" id="team-name-input" class="form-input" placeholder="Nome do seu Time" style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a;" />
                        </div>
                        <button id="btn-create-team" class="btn btn-primary" style="width:100%; background:var(--gold-500); color:var(--green-950)">✓ Criar Nova Equipe</button>
                    ` : `
                        <div style="background:#fff7ed; border:1px solid #ffedd5; border-radius:8px; padding:12px; margin-bottom:16px;">
                            <p style="font-size:0.78rem; color:#c2410c; font-weight:600; line-height:1.4;">🔒 Recurso de liderança premium. Faça o upgrade do seu plano para liberar a criação de equipes.</p>
                        </div>
                        <button id="btn-unlock-team" class="btn btn-secondary" style="width:100%">💎 Liberar Recurso</button>
                    `}
                </div>
            </div>
        </div>
    `;

    // Click Bindings
    document.getElementById('btn-join-team')?.addEventListener('click', async () => {
        const input = document.getElementById('invite-code-input');
        const code = input?.value?.trim();
        if (!code) return toast('Insira o código de convite.', 'warning');

        try {
            const btn = document.getElementById('btn-join-team');
            btn.disabled = true;
            btn.textContent = 'Processando...';

            await api('POST', '/api/equipe/entrar', { codigo_convite: code });
            toast('Sucesso! Você entrou na equipe.', 'success');
            
            // Reload page to draw Member Dashboard
            renderEquipe(router);
        } catch (e) {
            btn.disabled = false;
            btn.textContent = '✓ Entrar na Equipe';
            toast(e.message || 'Erro ao entrar na equipe.', 'danger');
        }
    });

    if (canCreate) {
        document.getElementById('btn-create-team')?.addEventListener('click', async () => {
            const input = document.getElementById('team-name-input');
            const name = input?.value?.trim();
            if (!name) return toast('Insira o nome do seu time.', 'warning');

            try {
                const btn = document.getElementById('btn-create-team');
                btn.disabled = true;
                btn.textContent = 'Criando...';

                await api('POST', '/api/equipe/criar', { nome_equipe: name });
                toast('Equipe criada com sucesso!', 'success');

                // Reload page to draw Leader Dashboard
                renderEquipe(router);
            } catch (e) {
                btn.disabled = false;
                btn.textContent = '✓ Criar Nova Equipe';
                toast(e.message || 'Erro ao criar equipe.', 'danger');
            }
        });
    } else {
        document.getElementById('btn-unlock-team')?.addEventListener('click', () => {
            window.location.href = 'https://www.gotaapp.com.br/upgrade';
        });
    }
}

// ── Screen 2: Leader Dashboard ────────────────────────────────
async function renderLeaderDashboard(router, equipe) {
    const pc = document.getElementById('page-content');
    if (!pc) return;

    pc.innerHTML = `
        <style>
            .team-header {
                background: linear-gradient(135deg, var(--green-950), var(--green-800));
                border-radius: var(--radius-lg);
                padding: 24px 30px;
                color: white;
                margin-bottom: 24px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 16px;
                border: 1px solid var(--border-gold);
            }
            .th-info h2 { font-family: var(--font-display); font-size: 1.6rem; color: var(--gold-300); }
            .th-info p { font-size: 0.88rem; color: rgba(255,255,255,0.7); margin-top: 4px; }
            .th-code {
                background: rgba(255,255,255,0.1);
                border: 1px dashed var(--gold-400);
                padding: 10px 16px;
                border-radius: var(--radius-sm);
                text-align: center;
            }
            .th-code span { display:block; font-size: 0.72rem; color: var(--gold-300); text-transform: uppercase; font-weight:700; letter-spacing:1px; }
            .th-code strong { font-size: 1.15rem; letter-spacing: 1px; color: white; display:flex; align-items:center; gap:8px; margin-top:2px; }
            .btn-copy-code { background:transparent; border:none; color:var(--gold-300); cursor:pointer; font-size:1.1rem; padding:0 4px; }
            
            /* Tabs */
            .tabs-nav {
                display: flex;
                gap: 8px;
                border-bottom: 1.5px solid var(--border);
                margin-bottom: 20px;
                overflow-x: auto;
                padding-bottom: 2px;
            }
            .tab-btn {
                background: transparent;
                border: none;
                padding: 10px 18px;
                cursor: pointer;
                font-family: var(--font-body);
                font-size: 0.92rem;
                font-weight: 600;
                color: var(--text-muted);
                border-bottom: 3px solid transparent;
                white-space: nowrap;
                transition: var(--transition);
            }
            .tab-btn.active {
                color: var(--green-600);
                border-bottom-color: var(--green-600);
            }
            .tab-content { display: none; }
            .tab-content.active { display: block; }
            
            /* Leaderboard / Downline Table */
            .team-table {
                width: 100%;
                border-collapse: collapse;
                background: white;
                border-radius: var(--radius-md);
                overflow: hidden;
                border: 1px solid var(--border);
            }
            .team-table th {
                background: var(--green-50);
                color: var(--green-800);
                text-align: left;
                padding: 14px 18px;
                font-size: 0.85rem;
                font-weight: 700;
                border-bottom: 1px solid var(--border);
            }
            .team-table td {
                padding: 14px 18px;
                border-bottom: 1px solid #f1f5f9;
                font-size: 0.9rem;
                color: var(--text-dark);
            }
            .membro-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: var(--green-100);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                color: var(--green-700);
                overflow: hidden;
            }
            .badge-warn {
                background: #fee2e2;
                color: #ef4444;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 0.76rem;
                font-weight: 700;
            }
            .badge-ok {
                background: #dcfce7;
                color: #15803d;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 0.76rem;
                font-weight: 700;
            }
        </style>

        <div class="team-header">
            <div class="th-info">
                <h2 style="display:inline-flex; align-items:center; gap:8px;">
                    Equipe: <span id="team-name-display">${equipe.nome_equipe}</span>
                    <button class="btn-edit-team-name" id="btn-edit-team-name" style="background:transparent; border:none; cursor:pointer; font-size:1.15rem; padding:4px 6px; line-height:1; display:inline-flex; align-items:center; color:rgba(255,255,255,0.7); transition:color 0.2s" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.7)'" title="Editar Nome da Equipe">✏️</button>
                </h2>
                <p>Gerencie seus consultores liderados, compartilhe leads e publique comunicados.</p>
            </div>
            <div class="th-code">
                <span>Código de Convite</span>
                <strong>
                    <span id="txt-convite-code">${equipe.codigo_convite}</span>
                    <button class="btn-copy-code" id="btn-copy-convite" title="Copiar Código">📋</button>
                </strong>
            </div>
        </div>

        <nav class="tabs-nav">
            <button class="tab-btn active" data-target="tab-membros">👥 Membros (${equipe.nome_equipe})</button>
            <button class="tab-btn" data-target="tab-mural">📢 Mural & Compromissos</button>
            <button class="tab-btn" data-target="tab-biblioteca">📚 Biblioteca de Time</button>
            <button class="tab-btn" data-target="tab-delegados">🤝 Leads Compartilhados</button>
        </nav>

        <!-- Tab 1: Members Evolution -->
        <div id="tab-membros" class="tab-content active">
            <div class="card" style="padding: 0; overflow:hidden;">
                <table class="team-table" id="table-membros-list">
                    <thead>
                        <tr>
                            <th style="width:50px"></th>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Rank doTERRA</th>
                            <th style="text-align:center">Anamneses Preenchidas</th>
                            <th style="text-align:center">Follow-ups Atrasados</th>
                            <th style="text-align:right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted)">
                                Carregando membros...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Tab 2: notices / murals -->
        <div id="tab-mural" class="tab-content">
            <div style="display:grid; grid-template-columns:350px 1fr; gap:20px; align-items:start;">
                <div style="display:flex; flex-direction:column; gap:20px;">
                    <!-- Form notice -->
                    <div class="card" style="padding:24px">
                        <h3 style="font-size:1.15rem; font-weight:700; color:var(--green-950); margin-bottom:16px;">📢 Novo Aviso no Mural</h3>
                        <div class="form-group" style="margin-bottom:12px">
                            <label class="form-label" style="color:var(--text-dark)">Título do Comunicado</label>
                            <input type="text" id="aviso-titulo" class="form-input" placeholder="Ex: Treinamento Especial HOJE!" style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a;" />
                        </div>
                        <div class="form-group" style="margin-bottom:12px">
                            <label class="form-label" style="color:var(--text-dark)">Mensagem detalhada</label>
                            <textarea id="aviso-mensagem" class="form-input" rows="4" placeholder="Escreva o aviso oficial para a rede..." style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a; font-family:inherit;"></textarea>
                        </div>
                        <div class="form-group" style="margin-bottom:12px">
                            <label class="form-label" style="color:var(--text-dark)">Data da Reunião (Opcional)</label>
                            <input type="datetime-local" id="aviso-data-reuniao" class="form-input" style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a;" />
                        </div>
                        <div class="form-group" style="margin-bottom:16px">
                            <label class="form-label" style="color:var(--text-dark)">Link da Reunião Zoom/Meet (Opcional)</label>
                            <input type="url" id="aviso-link-reuniao" class="form-input" placeholder="Ex: https://zoom.us/j/..." style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a;" />
                        </div>
                        <div class="form-group" style="margin-bottom:16px; display:flex; align-items:center; gap:8px;">
                            <input type="checkbox" id="aviso-disparar-push" style="width:18px; height:18px; cursor:pointer;" checked />
                            <label for="aviso-disparar-push" style="font-size:0.85rem; color:var(--text-dark); font-weight:600; cursor:pointer;">Disparar Web Push Urgente 📲</label>
                        </div>
                        <button id="btn-save-aviso" class="btn btn-primary" style="width:100%">✓ Publicar no Mural</button>
                    </div>

                    <!-- Central de Push -->
                    <div class="card" style="padding:24px">
                        <h3 style="font-size:1.15rem; font-weight:700; color:var(--green-950); margin-bottom:16px;">📲 Central de Push da Equipe</h3>
                        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:16px;">Envie mensagens instantâneas para as telas dos seus consultores.</p>
                        
                        <div class="form-group" style="margin-bottom:12px">
                            <label class="form-label" style="color:var(--text-dark)">Mensagens Pré-programadas</label>
                            <select id="push-template" class="form-input" style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a;">
                                <option value="">-- Escrever Mensagem Livre --</option>
                                <option value="1">🎓 Lembrete de Treinamento Geral</option>
                                <option value="2">🔥 Promoção BOGO Iniciada</option>
                                <option value="3">🎯 Foco nas Metas do Mês</option>
                                <option value="4">📚 Novo Roteiro na Biblioteca</option>
                            </select>
                        </div>
                        
                        <div class="form-group" style="margin-bottom:16px">
                            <label class="form-label" style="color:var(--text-dark)">Mensagem do Push</label>
                            <textarea id="push-mensagem" class="form-input" rows="3" placeholder="Digite a mensagem específica..." style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a; font-family:inherit;"></textarea>
                        </div>
                        
                        <button id="btn-send-push-direto" class="btn btn-primary" style="width:100%; background:var(--green-600); color:white;">⚡ Disparar Push da Equipe</button>
                    </div>

                    <!-- Histórico de Push -->
                    <div class="card" style="padding:24px">
                        <h3 style="font-size:1.15rem; font-weight:700; color:var(--green-950); margin-bottom:12px;">📊 Histórico de Envios</h3>
                        <div id="list-push-historico" style="display:flex; flex-direction:column; gap:12px; max-height:300px; overflow-y:auto;">
                            <div style="text-align:center; color:var(--text-muted); padding:10px; font-size:0.85rem;">Carregando histórico...</div>
                        </div>
                    </div>
                </div>

                <!-- notice List -->
                <div class="card" style="padding:24px">
                    <h3 style="font-size:1.15rem; font-weight:700; color:var(--green-950); margin-bottom:16px;">Mural de Avisos Ativos</h3>
                    <div id="list-avisos-lider" style="display:flex; flex-direction:column; gap:16px">
                        <div style="text-align:center; color:var(--text-muted); padding:20px;">Carregando mural...</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tab 3: Resource Library -->
        <div id="tab-biblioteca" class="tab-content">
            <div style="display:grid; grid-template-columns:350px 1fr; gap:20px; align-items:start;">
                <!-- Add Resource Form -->
                <div class="card" style="padding:24px">
                    <h3 style="font-size:1.15rem; font-weight:700; color:var(--green-950); margin-bottom:16px;">📚 Adicionar Material</h3>
                    <div class="form-group" style="margin-bottom:12px">
                        <label class="form-label" style="color:var(--text-dark)">Categoria</label>
                        <select id="bib-categoria" class="form-input" style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a;">
                            <option value="video_treinamento">🎥 Vídeo de Treinamento</option>
                            <option value="link_material">🔗 Material / Arquivo (Catálogos, PDFs)</option>
                            <option value="script_vendas">✍️ Roteiro / Script de Vendas</option>
                            <option value="script_cadastro">💼 Roteiro / Script de Cadastro</option>
                            <option value="script_objecoes">🛡️ Quebra de Objeções</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom:12px">
                        <label class="form-label" style="color:var(--text-dark)">Título do Material</label>
                        <input type="text" id="bib-titulo" class="form-input" placeholder="Ex: Abordagem Insônia Lavanda" style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a;" />
                    </div>
                    <div class="form-group" style="margin-bottom:12px">
                        <label class="form-label" style="color:var(--text-dark)">Descrição / Orientações</label>
                        <textarea id="bib-descricao" class="form-input" rows="3" placeholder="Instruções curtas de como usar..." style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a; font-family:inherit;"></textarea>
                    </div>
                    <div class="form-group" style="margin-bottom:12px" id="bib-group-url">
                        <label class="form-label" style="color:var(--text-dark)">URL de Vídeo ou Download</label>
                        <input type="url" id="bib-url" class="form-input" placeholder="Ex: https://youtube.com/watch?v=..." style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a;" />
                    </div>
                    <div class="form-group" style="margin-bottom:16px; display:none;" id="bib-group-texto">
                        <label class="form-label" style="color:var(--text-dark)">Texto do Script (Suporta {{nome_cliente}})</label>
                        <textarea id="bib-texto" class="form-input" rows="6" placeholder="Olá {{nome_cliente}}, sabia que o Hortelã-Pimenta pode..." style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a; font-family:inherit;"></textarea>
                    </div>
                    <button id="btn-save-bib" class="btn btn-primary" style="width:100%">✓ Adicionar à Biblioteca</button>
                </div>

                <!-- Resources List -->
                <div class="card" style="padding:24px">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px; border-bottom:1.5px solid var(--border); padding-bottom:12px;">
                        <h3 style="font-size:1.15rem; font-weight:700; color:var(--green-950); margin:0;">Biblioteca Compartilhada</h3>
                        <div class="sub-tabs-lider-container" style="display:flex; gap:6px;">
                            <button class="btn btn-sm btn-sub-tab active" data-type="video" style="padding:6px 12px; border-radius:20px; font-weight:600; font-size:0.8rem; background:var(--green-600); color:white; border:none; cursor:pointer;">🎥 Vídeos</button>
                            <button class="btn btn-sm btn-sub-tab" data-type="material" style="padding:6px 12px; border-radius:20px; font-weight:600; font-size:0.8rem; background:#f1f5f9; color:#475569; border:none; cursor:pointer;">📂 Materiais</button>
                            <button class="btn btn-sm btn-sub-tab" data-type="script" style="padding:6px 12px; border-radius:20px; font-weight:600; font-size:0.8rem; background:#f1f5f9; color:#475569; border:none; cursor:pointer;">✍️ Roteiros DISC</button>
                        </div>
                    </div>
                    <div id="list-biblioteca-lider" style="display:flex; flex-direction:column; gap:16px">
                        <div style="text-align:center; color:var(--text-muted); padding:20px;">Carregando biblioteca...</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tab 4: Leads Delegados -->
        <div id="tab-delegados" class="tab-content">
            <div class="card" style="padding:24px">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
                    <h3 style="font-size:1.15rem; font-weight:700; color:var(--green-950); margin:0;">Leads Delegados para a Rede</h3>
                    <button id="btn-open-delegar" class="btn btn-primary" style="background:var(--gold-500); color:var(--green-950)">🤝 Compartilhar Lead com Membro</button>
                </div>
                <div id="list-delegacoes-lider">
                    <div style="text-align:center; color:var(--text-muted); padding:30px;">Carregando delegações...</div>
                </div>
            </div>
        </div>
    `;

    // ── Click bindings for Tabs ─────────────────────────────
    pc.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            pc.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            pc.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.target;
            document.getElementById(target)?.classList.add('active');
        });
    });

    // ── Invite Code copy ────────────────────────────────────
    document.getElementById('btn-copy-convite')?.addEventListener('click', () => {
        navigator.clipboard.writeText(equipe.codigo_convite);
        toast('Código copiado para a área de transferência!', 'success');
    });

    // ── Edit Team Name ──────────────────────────────────────
    document.getElementById('btn-edit-team-name')?.addEventListener('click', () => {
        openEditarNomeEquipeModal(equipe.nome_equipe);
    });

    // ── Biblioteca Form Change Categoria ─────────────────────
    document.getElementById('bib-categoria')?.addEventListener('change', (e) => {
        const cat = e.target.value;
        const grpUrl = document.getElementById('bib-group-url');
        const grpTexto = document.getElementById('bib-group-texto');
        if (cat.startsWith('script')) {
            grpUrl.style.display = 'none';
            grpTexto.style.display = 'block';
        } else {
            grpUrl.style.display = 'block';
            grpTexto.style.display = 'none';
        }
    });

    // ── Load Membros, Mural, Biblioteca, Delegacoes ───────────
    loadMembrosList(equipe.id);
    loadAvisosLider();
    loadBibliotecaLider();
    loadDelegacoesLider();
    loadPushHistorico();

    // ── Actions: cadastrar aviso ─────────────────────────────
    document.getElementById('btn-save-aviso')?.addEventListener('click', async () => {
        const titulo = document.getElementById('aviso-titulo').value?.trim();
        const mensagem = document.getElementById('aviso-mensagem').value?.trim();
        const dataReuniao = document.getElementById('aviso-data-reuniao').value;
        const linkReuniao = document.getElementById('aviso-link-reuniao').value?.trim();
        const dispararPush = document.getElementById('aviso-disparar-push').checked;

        if (!titulo || !mensagem) return toast('Título e mensagem são obrigatórios.', 'warning');

        try {
            const btn = document.getElementById('btn-save-aviso');
            btn.disabled = true;
            btn.textContent = 'Salvando...';

            await api('POST', '/api/equipe/avisos', {
                titulo, mensagem,
                data_reuniao: dataReuniao || null,
                link_reuniao: linkReuniao || null,
                disparar_push: dispararPush
            });

            toast('Aviso publicado no mural!', 'success');
            
            // Clean fields
            document.getElementById('aviso-titulo').value = '';
            document.getElementById('aviso-mensagem').value = '';
            document.getElementById('aviso-data-reuniao').value = '';
            document.getElementById('aviso-link-reuniao').value = '';
            btn.disabled = false;
            btn.textContent = '✓ Publicar no Mural';
            
            // Reload list
            loadAvisosLider();
        } catch (e) {
            document.getElementById('btn-save-aviso').disabled = false;
            document.getElementById('btn-save-aviso').textContent = '✓ Publicar no Mural';
            toast(e.message || 'Erro ao salvar aviso.', 'danger');
        }
    });

    // ── Actions: cadastrar biblioteca ────────────────────────
    document.getElementById('btn-save-bib')?.addEventListener('click', async () => {
        const categoria = document.getElementById('bib-categoria').value;
        const titulo = document.getElementById('bib-titulo').value?.trim();
        const descricao = document.getElementById('bib-descricao').value?.trim();
        const url_midia = document.getElementById('bib-url').value?.trim();
        const conteudo_texto = document.getElementById('bib-texto').value?.trim();

        if (!titulo) return toast('O título do material é obrigatório.', 'warning');

        try {
            const btn = document.getElementById('btn-save-bib');
            btn.disabled = true;
            btn.textContent = 'Adicionando...';

            await api('POST', '/api/equipe/biblioteca', {
                categoria, titulo, descricao, url_midia, conteudo_texto
            });

            toast('Material adicionado à biblioteca!', 'success');

            // Clean fields
            document.getElementById('bib-titulo').value = '';
            document.getElementById('bib-descricao').value = '';
            document.getElementById('bib-url').value = '';
            document.getElementById('bib-texto').value = '';
            btn.disabled = false;
            btn.textContent = '✓ Adicionar à Biblioteca';

            // Reload list
            loadBibliotecaLider();
        } catch (e) {
            document.getElementById('btn-save-bib').disabled = false;
            document.getElementById('btn-save-bib').textContent = '✓ Adicionar à Biblioteca';
            toast(e.message || 'Erro ao salvar material.', 'danger');
        }
    });

    // ── Actions: Central de Push ──────────────────────────────
    const pushTemplates = {
        '1': 'Lembrete: Nosso treinamento de equipe inicia em 15 minutos! Venha aprender estratégias de vendas.',
        '2': 'ATENÇÃO TIME: A nova promoção BOGO doTERRA começou! Confira a biblioteca para ver as dicas de divulgação.',
        '3': 'Foco no Fechamento: Reta final do mês! Vamos revisar nossas metas e ajudar nossa rede. Qualquer dúvida, me chamem!',
        '4': 'Novidade: Acabo de disponibilizar um novo roteiro/script de vendas na biblioteca da equipe. Usem nas abordagens!'
    };

    document.getElementById('push-template')?.addEventListener('change', (e) => {
        const val = e.target.value;
        const textarea = document.getElementById('push-mensagem');
        if (textarea) {
            textarea.value = pushTemplates[val] || '';
        }
    });

    document.getElementById('btn-send-push-direto')?.addEventListener('click', async () => {
        const msg = document.getElementById('push-mensagem')?.value?.trim();
        if (!msg) return toast('Escreva a mensagem do push.', 'warning');

        try {
            const btn = document.getElementById('btn-send-push-direto');
            btn.disabled = true;
            btn.textContent = 'Enviando...';

            const res = await api('POST', '/api/equipe/push-direto', { mensagem: msg });
            toast(`Sucesso! ${res.membros_notificados} membro(s) notificados via push.`, 'success');

            document.getElementById('push-mensagem').value = '';
            document.getElementById('push-template').value = '';
            btn.disabled = false;
            btn.textContent = '⚡ Disparar Push da Equipe';
            loadPushHistorico();
        } catch (e) {
            document.getElementById('btn-send-push-direto').disabled = false;
            document.getElementById('btn-send-push-direto').textContent = '⚡ Disparar Push da Equipe';
            toast(e.message || 'Erro ao enviar push.', 'danger');
        }
    });

    // ── Actions: Abrir Modal de Delegação ────────────────────
    document.getElementById('btn-open-delegar')?.addEventListener('click', () => {
        openDelegarLeadModal(equipe.id);
    });
}

// ── Member Dashboard (Liderado) ──────────────────────────────
async function renderMemberDashboard(router, equipe) {
    const pc = document.getElementById('page-content');
    if (!pc) return;

    pc.innerHTML = `
        <style>
            .member-header {
                background: linear-gradient(135deg, var(--green-950), var(--green-800));
                border-radius: var(--radius-lg);
                padding: 24px 30px;
                color: white;
                margin-bottom: 24px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 16px;
                border: 1px solid var(--border-gold);
            }
            .mh-info h2 { font-family: var(--font-display); font-size: 1.6rem; color: var(--gold-300); }
            .mh-info p { font-size: 0.88rem; color: rgba(255,255,255,0.7); margin-top: 4px; }
            .mh-leader {
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                padding: 10px 16px;
                border-radius: var(--radius-md);
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .mh-leader-avatar {
                width: 38px;
                height: 38px;
                border-radius: 50%;
                background: var(--gold-400);
                color: var(--green-950);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                overflow: hidden;
            }
            .mh-leader-info h4 { font-size: 0.9rem; font-weight:700; color:white; }
            .mh-leader-info a { font-size:0.75rem; color:var(--gold-300); text-decoration:none; font-weight:600; }
            
            /* Tabs */
            .tabs-nav {
                display: flex;
                gap: 8px;
                border-bottom: 1.5px solid var(--border);
                margin-bottom: 20px;
                overflow-x: auto;
                padding-bottom: 2px;
            }
            .tab-btn {
                background: transparent;
                border: none;
                padding: 10px 18px;
                cursor: pointer;
                font-family: var(--font-body);
                font-size: 0.92rem;
                font-weight: 600;
                color: var(--text-muted);
                border-bottom: 3px solid transparent;
                white-space: nowrap;
                transition: var(--transition);
            }
            .tab-btn.active {
                color: var(--green-600);
                border-bottom-color: var(--green-600);
            }
            .tab-content { display: none; }
            .tab-content.active { display: block; }
        </style>

        <div class="member-header">
            <div class="mh-info">
                <h2>Equipe: ${equipe.nome_equipe}</h2>
                <p>Veja os avisos do líder, utilize a biblioteca de scripts e realize as devolutivas de leads.</p>
            </div>
            <div class="mh-leader">
                <div class="mh-leader-avatar">
                    ${equipe.lider_foto_url 
                        ? `<img src="${equipe.lider_foto_url}" style="width:100%; height:100%; object-fit:cover;" />` 
                        : (equipe.lider_nome || 'L').charAt(0)}
                </div>
                <div class="mh-leader-info">
                    <h4>Líder: ${equipe.lider_nome}</h4>
                    <a href="https://api.whatsapp.com/send?phone=55${(equipe.lider_telefone || '').replace(/\D/g, '')}" target="_blank">🟢 Falar no Zap</a>
                </div>
            </div>
        </div>

        <nav class="tabs-nav">
            <button class="tab-btn active" data-target="tab-mural-membro">📢 Mural & Reuniões</button>
            <button class="tab-btn" data-target="tab-biblioteca-membro">📚 Biblioteca do Time</button>
            <button class="tab-btn" data-target="tab-delegados-membro">🤝 Leads Recebidos</button>
            <button class="tab-btn" data-target="tab-config-membro">⚙️ Configurações</button>
        </nav>

        <!-- Tab 1: Mural notices -->
        <div id="tab-mural-membro" class="tab-content active">
            <div class="card" style="padding:24px">
                <h3 style="font-size:1.15rem; font-weight:700; color:var(--green-950); margin-bottom:16px;">Mural de Avisos da Equipe</h3>
                <div id="list-avisos-membro" style="display:flex; flex-direction:column; gap:16px">
                    <div style="text-align:center; color:var(--text-muted); padding:20px;">Carregando avisos...</div>
                </div>
            </div>
        </div>

        <!-- Tab 2: Resource Library -->
        <div id="tab-biblioteca-membro" class="tab-content">
            <div class="card" style="padding:24px">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px; border-bottom:1.5px solid var(--border); padding-bottom:12px;">
                    <h3 style="font-size:1.15rem; font-weight:700; color:var(--green-950); margin:0;">Materiais Educacionais e Roteiros</h3>
                    <div class="sub-tabs-membro-container" style="display:flex; gap:6px;">
                        <button class="btn btn-sm btn-sub-tab-membro active" data-type="video" style="padding:6px 12px; border-radius:20px; font-weight:600; font-size:0.8rem; background:var(--green-600); color:white; border:none; cursor:pointer;">🎥 Vídeos</button>
                        <button class="btn btn-sm btn-sub-tab-membro" data-type="material" style="padding:6px 12px; border-radius:20px; font-weight:600; font-size:0.8rem; background:#f1f5f9; color:#475569; border:none; cursor:pointer;">📂 Materiais</button>
                        <button class="btn btn-sm btn-sub-tab-membro" data-type="script" style="padding:6px 12px; border-radius:20px; font-weight:600; font-size:0.8rem; background:#f1f5f9; color:#475569; border:none; cursor:pointer;">✍️ Roteiros DISC</button>
                    </div>
                </div>
                <div id="list-biblioteca-membro" style="display:flex; flex-direction:column; gap:16px">
                    <div style="text-align:center; color:var(--text-muted); padding:20px;">Carregando biblioteca...</div>
                </div>
            </div>
        </div>

        <!-- Tab 3: Leads Recebidos -->
        <div id="tab-delegados-membro" class="tab-content">
            <div class="card" style="padding:24px">
                <h3 style="font-size:1.15rem; font-weight:700; color:var(--green-950); margin-bottom:16px;">Clientes Recebidos do Líder para Devolutiva</h3>
                <div id="list-delegacoes-membro">
                    <div style="text-align:center; color:var(--text-muted); padding:30px;">Carregando clientes recebidos...</div>
                </div>
            </div>
        </div>

        <!-- Tab 4: Team configuration (Leave Team) -->
        <div id="tab-config-membro" class="tab-content">
            <div class="card" style="padding:24px; max-width:500px; margin: 0 auto; text-align:center;">
                <h3 style="font-size:1.2rem; font-weight:700; color:#ef4444; margin-bottom:12px;">Sair da Equipe</h3>
                <p style="font-size:0.9rem; color:var(--text-muted); line-height:1.6; margin-bottom:24px;">Ao sair da equipe, você perderá acesso ao mural de avisos, calendário de reuniões e aos materiais educacionais da biblioteca compartilhada pelo seu líder. Delegações de leads ativas serão mantidas, mas marcadas.</p>
                <button id="btn-leave-team" class="btn btn-primary" style="background:#ef4444; color:white; border:none; width:100%">Sair da Equipe do Líder</button>
            </div>
        </div>
    `;

    // ── Click bindings for Tabs ─────────────────────────────
    pc.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            pc.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            pc.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.target;
            document.getElementById(target)?.classList.add('active');
        });
    });

    // ── Load lists ──────────────────────────────────────────
    loadAvisosMembro();
    loadBibliotecaMembro();
    loadDelegacoesMembro();

    // ── Leave team trigger ──────────────────────────────────
    document.getElementById('btn-leave-team')?.addEventListener('click', async () => {
        if (!confirm('Deseja realmente se desvincular da equipe de seu líder?')) return;

        try {
            const btn = document.getElementById('btn-leave-team');
            btn.disabled = true;
            btn.textContent = 'Saindo...';

            await api('POST', '/api/equipe/sair');
            toast('Você se desvinculou da equipe com sucesso.', 'success');
            
            // Reload page to draw setups screen
            renderEquipe(router);
        } catch (e) {
            document.getElementById('btn-leave-team').disabled = false;
            document.getElementById('btn-leave-team').textContent = 'Sair da Equipe do Líder';
            toast(e.message || 'Erro ao sair da equipe.', 'danger');
        }
    });
}

// ── Helper: Load Members List (Leader View) ───────────────────
async function loadMembrosList() {
    const table = document.getElementById('table-membros-list');
    const tbody = table?.querySelector('tbody');
    if (!tbody) return;

    try {
        const membros = await api('GET', '/api/equipe/membros');
        if (membros.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted)">
                        Sua equipe ainda não possui consultores cadastrados. Compartilhe o código de convite acima!
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = membros.map(m => {
            const hasAtrasados = m.metricas.followups_atrasados > 0;
            const zapLink = m.telefone ? `https://api.whatsapp.com/send?phone=55${m.telefone.replace(/\D/g, '')}&text=${encodeURIComponent(`Olá ${m.nome.split(' ')[0]}! Tudo bem? Passando para acompanhar seus resultados de hoje no Gota App.`)}` : null;

            return `
                <tr>
                    <td>
                        <div class="membro-avatar">
                            ${m.foto_url ? `<img src="${m.foto_url}" style="width:100%;height:100%;object-fit:cover;" />` : m.nome.charAt(0)}
                        </div>
                    </td>
                    <td>
                        <strong>${m.nome}</strong><br>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${m.email}</span>
                    </td>
                    <td>${m.telefone || 'Não informado'}</td>
                    <td>${m.rank_doterra || 'Consultor'}</td>
                    <td style="text-align:center; font-weight:700;">${m.metricas.anamneses_preenchidas}</td>
                    <td style="text-align:center;">
                        <span class="${hasAtrasados ? 'badge-warn' : 'badge-ok'}">
                            ${m.metricas.followups_atrasados} atrasados
                        </span>
                    </td>
                    <td style="text-align:right;">
                        ${zapLink ? `
                            <a href="${zapLink}" target="_blank" class="btn btn-secondary btn-sm" style="background:#25d366; color:white; border:none; display:inline-flex; align-items:center; gap:6px;">
                                💬 Cobrar Zap
                            </a>
                        ` : '<span style="font-size:0.8rem; color:var(--text-muted);">Sem telefone</span>'}
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:30px; color:#ef4444">
                    Erro ao carregar lista de membros: ${e.message}
                </td>
            </tr>
        `;
    }
}

// ── Helper: Load Avisos (Leader View) ─────────────────────────
async function loadAvisosLider() {
    const container = document.getElementById('list-avisos-lider');
    if (!container) return;

    try {
        const avisos = await api('GET', '/api/equipe/avisos');
        if (avisos.length === 0) {
            container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">Nenhum aviso publicado no mural.</div>`;
            return;
        }

        container.innerHTML = avisos.map(a => {
            const isMeeting = !!a.data_reuniao;
            const dateStr = isMeeting ? new Date(a.data_reuniao).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

            return `
                <div id="leader-aviso-${a.id}" style="padding:14px; border:1px solid var(--border); border-radius:var(--radius-md); background:#f8fafc; position:relative;">
                    <button class="btn-delete-aviso" data-aviso-id="${a.id}" style="position:absolute; top:10px; right:12px; background:transparent; border:none; color:#ef4444; cursor:pointer; font-weight:bold; font-size:1.15rem;" title="Remover Aviso">×</button>
                    <span style="font-size:0.7rem; text-transform:uppercase; font-weight:700; color:var(--green-600);">${isMeeting ? '📅 Reunião Agendada' : '📢 Comunicado'}</span>
                    <h4 style="margin:4px 0; font-size:0.95rem; font-weight:700; color:var(--green-950);">${a.titulo}</h4>
                    <p style="font-size:0.82rem; color:var(--text-muted); white-space:pre-wrap; margin-bottom:8px;">${a.mensagem}</p>
                    ${isMeeting ? `
                        <div style="font-size:0.78rem; display:flex; gap:8px; align-items:center; flex-wrap:wrap; color:var(--text-dark);">
                            <span>📅 <strong>${dateStr}</strong></span>
                            ${a.link_reuniao ? `<a href="${a.link_reuniao}" target="_blank" style="color:var(--green-600); text-decoration:underline;">Link da Sala</a>` : ''}
                            <button class="btn-view-confirmados" data-aviso-id="${a.id}" style="background:transparent; border:none; color:var(--green-700); cursor:pointer; font-weight:700; text-decoration:underline; font-size:0.78rem; padding:0;">(Ver Confirmados)</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        // Bind delete
        container.querySelectorAll('.btn-delete-aviso').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.avisoId;
                if (!confirm('Deseja excluir esse aviso?')) return;
                try {
                    await api('DELETE', `/api/equipe/avisos/${id}`);
                    toast('Aviso removido com sucesso!', 'success');
                    loadAvisosLider();
                } catch (e) {
                    toast(e.message || 'Erro ao remover aviso.', 'danger');
                }
            });
        });

        // Bind RSVP confirmados check
        container.querySelectorAll('.btn-view-confirmados').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.avisoId;
                try {
                    const confirmados = await api('GET', `/api/equipe/avisos/${id}/confirmacoes`);
                    if (confirmados.length === 0) {
                        return alert('Nenhum consultor confirmou presença nesta reunião ainda.');
                    }
                    const listStr = confirmados.map(c => `• ${c.nome} (${new Date(c.confirmado_em).toLocaleDateString('pt-BR')})`).join('\n');
                    alert(`Membros que Confirmaram Presença:\n\n${listStr}`);
                } catch (e) {
                    toast(e.message || 'Erro ao listar confirmados.', 'danger');
                }
            });
        });

    } catch (e) {
        container.innerHTML = `<div style="text-align:center; color:#ef4444; padding:20px;">Erro ao carregar mural: ${e.message}</div>`;
    }
}

// ── Helper: Load Biblioteca (Leader View) ─────────────────────
async function loadBibliotecaLider() {
    const container = document.getElementById('list-biblioteca-lider');
    if (!container) return;

    // Bind sub tab clicks
    const subTabContainer = container.previousElementSibling?.querySelector('.sub-tabs-lider-container');
    if (subTabContainer && !subTabContainer.dataset.bound) {
        subTabContainer.dataset.bound = 'true';
        subTabContainer.querySelectorAll('.btn-sub-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                subTabContainer.querySelectorAll('.btn-sub-tab').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = '#f1f5f9';
                    b.style.color = '#475569';
                });
                btn.classList.add('active');
                btn.style.background = 'var(--green-600)';
                btn.style.color = 'white';
                
                currentSubTabLider = btn.dataset.type;
                renderFilteredBibliotecaLider();
            });
        });
    }

    try {
        cachedBibliotecaLider = await api('GET', '/api/equipe/biblioteca');
        renderFilteredBibliotecaLider();
    } catch (e) {
        container.innerHTML = `<div style="text-align:center; color:#ef4444; padding:20px;">Erro ao carregar biblioteca: ${e.message}</div>`;
    }
}

function renderFilteredBibliotecaLider() {
    const container = document.getElementById('list-biblioteca-lider');
    if (!container) return;

    let filtered = [];
    if (currentSubTabLider === 'video') {
        filtered = cachedBibliotecaLider.filter(b => b.categoria === 'video_treinamento');
    } else if (currentSubTabLider === 'material') {
        filtered = cachedBibliotecaLider.filter(b => b.categoria === 'link_material');
    } else {
        filtered = cachedBibliotecaLider.filter(b => b.categoria.startsWith('script'));
    }

    let html = '';
    
    if (currentSubTabLider === 'script') {
        html += `
            <div class="disc-filters" style="background:#f1f5f9; padding:16px; border-radius:var(--radius-md); border:1px solid #cbd5e1; margin-bottom:20px;">
                <h4 style="margin:0 0 12px; font-size:0.9rem; font-weight:700; color:var(--green-950); display:flex; align-items:center; gap:6px;">💡 Roteiros Prontos DISC (Gota App)</h4>
                <div style="display:flex; flex-wrap:wrap; gap:12px;">
                    <div style="flex:1; min-width:180px;">
                        <label style="font-size:0.75rem; font-weight:700; color:#475569; display:block; margin-bottom:4px;">Objetivo / Finalidade</label>
                        <select id="disc-filter-finalidade" class="form-input" style="padding:6px 10px; font-size:0.83rem; background:white; border:1px solid #cbd5e1; color:#0f172a; height:34px;">
                            <option value="vendas" ${currentDiscFinalidadeLider === 'vendas' ? 'selected' : ''}>✍️ Roteiros de Vendas</option>
                            <option value="cadastro" ${currentDiscFinalidadeLider === 'cadastro' ? 'selected' : ''}>💼 Roteiros de Cadastro / Recrutamento</option>
                            <option value="objecoes" ${currentDiscFinalidadeLider === 'objecoes' ? 'selected' : ''}>🛡️ Quebra de Objeções</option>
                        </select>
                    </div>
                    <div style="flex:1; min-width:180px;">
                        <label style="font-size:0.75rem; font-weight:700; color:#475569; display:block; margin-bottom:4px;">Perfil Comportamental (DISC)</label>
                        <select id="disc-filter-perfil" class="form-input" style="padding:6px 10px; font-size:0.83rem; background:white; border:1px solid #cbd5e1; color:#0f172a; height:34px;">
                            <option value="dominante" ${currentDiscPerfilLider === 'dominante' ? 'selected' : ''}>⚡ Perfil Dominante (D) - Objetividade e Resultados</option>
                            <option value="influente" ${currentDiscPerfilLider === 'influente' ? 'selected' : ''}>🔥 Perfil Influente (I) - Conexão e Energia</option>
                            <option value="estavel" ${currentDiscPerfilLider === 'estavel' ? 'selected' : ''}>🌱 Perfil Estável (S) - Segurança e Cuidado</option>
                            <option value="analitico" ${currentDiscPerfilLider === 'analitico' ? 'selected' : ''}>🔬 Perfil Analítico (C) - Ciência e Fatos</option>
                        </select>
                    </div>
                </div>
                
                <div id="disc-template-container" style="margin-top:16px;">
                    ${renderSelectedDiscTemplate('lider')}
                </div>
            </div>
            <h4 style="margin:24px 0 12px; font-size:1rem; font-weight:700; color:var(--green-950); border-bottom:1px solid var(--border); padding-bottom:6px;">✍️ Scripts Customizados da Equipe</h4>
        `;
    }

    if (filtered.length === 0) {
        html += `<div style="text-align:center; color:var(--text-muted); padding:20px;">Nenhum material nesta categoria.</div>`;
    } else {
        html += filtered.map(b => {
            const isScript = b.categoria.startsWith('script');
            const catLabel = b.categoria === 'video_treinamento' ? '🎥 Treinamento em Vídeo' :
                             b.categoria === 'link_material' ? '🔗 Material / Link Externo' :
                             b.categoria === 'script_vendas' ? '✍️ Script de Vendas' : 
                             b.categoria === 'script_cadastro' ? '💼 Script de Recrutamento' : '🛡️ Quebra de Objeções';

            return `
                <div style="padding:14px; border:1px solid var(--border); border-radius:var(--radius-md); background:#f8fafc; position:relative;">
                    <button class="btn-delete-bib" data-bib-id="${b.id}" style="position:absolute; top:10px; right:12px; background:transparent; border:none; color:#ef4444; cursor:pointer; font-weight:bold; font-size:1.15rem;" title="Remover Material">×</button>
                    <span style="font-size:0.7rem; text-transform:uppercase; font-weight:700; color:var(--gold-700);">${catLabel}</span>
                    <h4 style="margin:4px 0; font-size:0.95rem; font-weight:700; color:var(--green-950);">${b.titulo}</h4>
                    ${b.descricao ? `<p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px;">${b.descricao}</p>` : ''}
                    
                    ${isScript ? `
                        <div style="background:white; border:1px solid var(--border-light); border-radius:8px; padding:10px; font-size:0.83rem; font-family:monospace; color:#334155; white-space:pre-wrap; max-height:120px; overflow-y:auto; margin-bottom:8px;">${b.conteudo_texto}</div>
                        <div style="display:flex; gap:8px; margin-top:8px;">
                            <button class="btn-copy-script btn btn-secondary btn-sm" data-script-text="${encodeURIComponent(b.conteudo_texto)}" style="display:inline-flex; align-items:center; gap:6px; font-weight:600; padding:4px 10px; font-size:0.75rem;">
                                📋 Copiar Personalizado
                            </button>
                            <button class="btn-use-model btn btn-secondary btn-sm" data-bib-id="${b.id}" style="display:inline-flex; align-items:center; gap:6px; font-weight:600; padding:4px 10px; font-size:0.75rem;">
                                ✏️ Usar como Modelo (Editar)
                            </button>
                        </div>
                    ` : `
                        ${b.categoria === 'video_treinamento' && b.url_midia ? getVideoPlayerMarkup(b.url_midia) : ''}
                        ${b.url_midia ? `<a href="${b.url_midia}" target="_blank" style="font-size:0.82rem; color:var(--green-600); text-decoration:underline; font-weight:600; display:inline-block; margin-top:4px;">🔗 Acessar Link Externo</a>` : ''}
                    `}
                </div>
            `;
        }).join('');
    }

    container.innerHTML = html;
    bindBibliotecaLiderEvents(container);
}

function bindBibliotecaLiderEvents(container) {
    const selFinalidade = container.querySelector('#disc-filter-finalidade');
    const selPerfil = container.querySelector('#disc-filter-perfil');
    if (selFinalidade && selPerfil) {
        selFinalidade.addEventListener('change', (e) => {
            currentDiscFinalidadeLider = e.target.value;
            const tplContainer = container.querySelector('#disc-template-container');
            if (tplContainer) tplContainer.innerHTML = renderSelectedDiscTemplate('lider');
            bindBibliotecaLiderEvents(container);
        });
        
        selPerfil.addEventListener('change', (e) => {
            currentDiscPerfilLider = e.target.value;
            const tplContainer = container.querySelector('#disc-template-container');
            if (tplContainer) tplContainer.innerHTML = renderSelectedDiscTemplate('lider');
            bindBibliotecaLiderEvents(container);
        });
    }

    container.querySelectorAll('.btn-copy-disc').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = decodeURIComponent(btn.dataset.scriptText);
            openSmartCopyModal(text);
        });
    });

    container.querySelectorAll('.btn-use-disc-model').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = decodeURIComponent(btn.dataset.scriptText);
            const titulo = decodeURIComponent(btn.dataset.titulo);
            const desc = decodeURIComponent(btn.dataset.desc);
            
            document.getElementById('bib-categoria').value = 'script_vendas';
            document.getElementById('bib-titulo').value = titulo;
            document.getElementById('bib-descricao').value = desc;
            
            document.getElementById('bib-group-url').style.display = 'none';
            const grpTexto = document.getElementById('bib-group-texto');
            grpTexto.style.display = 'block';
            document.getElementById('bib-texto').value = text;
            
            toast('Modelo copiado para o formulário. Você pode personalizar e salvar!', 'info');
            document.getElementById('bib-categoria')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    });

    container.querySelectorAll('.btn-delete-bib').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.bibId;
            if (!confirm('Deseja excluir esse material?')) return;
            try {
                await api('DELETE', `/api/equipe/biblioteca/${id}`);
                toast('Material removido!', 'success');
                loadBibliotecaLider();
            } catch (e) {
                toast(e.message || 'Erro ao remover material.', 'danger');
            }
        });
    });

    container.querySelectorAll('.btn-use-model').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.bibId;
            const b = cachedBibliotecaLider.find(item => item.id === id);
            if (b) {
                document.getElementById('bib-categoria').value = b.categoria;
                document.getElementById('bib-titulo').value = b.titulo;
                document.getElementById('bib-descricao').value = b.descricao || '';
                
                const grpUrl = document.getElementById('bib-group-url');
                const grpTexto = document.getElementById('bib-group-texto');
                
                if (b.categoria.startsWith('script')) {
                    grpUrl.style.display = 'none';
                    grpTexto.style.display = 'block';
                    document.getElementById('bib-texto').value = b.conteudo_texto || '';
                } else {
                    grpUrl.style.display = 'block';
                    grpTexto.style.display = 'none';
                    document.getElementById('bib-url').value = b.url_midia || '';
                }
                
                toast('Dados copiados para o formulário de cadastro. Você pode editar e salvar.', 'info');
                document.getElementById('bib-categoria')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    });

    container.querySelectorAll('.btn-copy-script').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = decodeURIComponent(btn.dataset.scriptText);
            openSmartCopyModal(text);
        });
    });
}

// ── Helper: Load Delegacoes (Leader View) ─────────────────────
async function loadDelegacoesLider() {
    const container = document.getElementById('list-delegacoes-lider');
    if (!container) return;

    try {
        const delegacoes = await api('GET', '/api/equipe/delegacoes');
        if (delegacoes.length === 0) {
            container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:30px;">Nenhum lead compartilhado com a equipe ainda.</div>`;
            return;
        }

        container.innerHTML = `
            <table class="team-table">
                <thead>
                    <tr>
                        <th>Cliente / Lead</th>
                        <th>WhatsApp</th>
                        <th>Consultor Responsável</th>
                        <th>Status da Devolutiva</th>
                        <th style="text-align:center">Data Envio</th>
                    </tr>
                </thead>
                <tbody>
                    ${delegacoes.map(d => {
                        const statusLabel = d.status_devolutiva === 'concluido' ? '<span class="badge-ok">Concluída 🎉</span>' :
                                            d.status_devolutiva === 'em_andamento' ? '<span style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:12px; font-size:0.76rem; font-weight:700;">Atendendo...</span>' :
                                            '<span class="badge-warn">Pendente ⏳</span>';
                        
                        return `
                            <tr>
                                <td>
                                    <strong>${d.cliente_nome}</strong><br>
                                    <span style="font-size:0.75rem; color:var(--text-muted);">${d.cliente_email || 'Sem email'}</span>
                                </td>
                                <td>${d.cliente_telefone || 'Sem celular'}</td>
                                <td><strong>${d.liderado_nome}</strong></td>
                                <td>${statusLabel}</td>
                                <td style="text-align:center; font-size:0.8rem; color:var(--text-muted);">${formatDate(d.criado_em)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        container.innerHTML = `<div style="text-align:center; color:#ef4444; padding:20px;">Erro ao carregar leads delegados: ${e.message}</div>`;
    }
}

// ── Helper: Load Mural (Member View) ──────────────────────────
async function loadAvisosMembro() {
    const container = document.getElementById('list-avisos-membro');
    if (!container) return;

    try {
        const avisos = await api('GET', '/api/equipe/avisos');
        if (avisos.length === 0) {
            container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">Nenhum aviso no mural de avisos da equipe.</div>`;
            return;
        }

        container.innerHTML = avisos.map(a => {
            const isMeeting = !!a.data_reuniao;
            const dateStr = isMeeting ? new Date(a.data_reuniao).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

            return `
                <div style="padding:16px 20px; border:1px solid var(--border); border-radius:var(--radius-md); background:#f8fafc; display:flex; gap:16px; align-items:flex-start;">
                    <span style="font-size:1.6rem">${isMeeting ? '📅' : '📢'}</span>
                    <div style="flex:1">
                        <span style="font-size:0.7rem; text-transform:uppercase; font-weight:700; color:var(--green-600);">${isMeeting ? 'Reunião Agendada da Equipe' : 'Comunicado Oficial'}</span>
                        <h4 style="margin:4px 0; font-size:1.02rem; font-weight:700; color:var(--green-950);">${a.titulo}</h4>
                        <p style="font-size:0.88rem; color:var(--text-muted); white-space:pre-wrap; margin-bottom:8px;">${a.mensagem}</p>
                        ${isMeeting ? `
                            <div style="margin-top: 10px; display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
                                <span style="font-size:0.8rem; background:#e2e8f0; padding:4px 8px; border-radius:6px; font-weight:600;">📅 ${dateStr}</span>
                                ${a.link_reuniao ? `<a href="${a.link_reuniao}" target="_blank" class="btn btn-sm btn-secondary" style="font-weight:600; padding:5px 12px; border-radius:6px; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">🔗 Entrar</a>` : ''}
                                ${!a.confirmado ? `
                                    <button class="btn-confirmar-presenca btn btn-sm btn-primary" data-aviso-id="${a.id}" style="font-weight:600; padding:5px 12px; border-radius:6px; border:none; background:var(--gold-500); color:var(--green-950)">
                                        ✓ Vou Participar
                                    </button>
                                ` : `
                                    <span style="font-size:0.82rem; color:#16a34a; font-weight:600;">✓ Presença Confirmada!</span>
                                `}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Bind confirmar
        container.querySelectorAll('.btn-confirmar-presenca').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.avisoId;
                try {
                    await api('POST', `/api/equipe/avisos/${id}/confirmar`);
                    toast('Presença confirmada! 🎉', 'success');
                    loadAvisosMembro();
                } catch (e) {
                    toast(e.message || 'Erro ao confirmar presença.', 'danger');
                }
            });
        });
    } catch (e) {
        container.innerHTML = `<div style="text-align:center; color:#ef4444; padding:20px;">Erro ao carregar avisos: ${e.message}</div>`;
    }
}

// ── Helper: Load Biblioteca (Member View) ─────────────────────
async function loadBibliotecaMembro() {
    const container = document.getElementById('list-biblioteca-membro');
    if (!container) return;

    // Bind sub tab clicks
    const subTabContainer = container.previousElementSibling?.querySelector('.sub-tabs-membro-container');
    if (subTabContainer && !subTabContainer.dataset.bound) {
        subTabContainer.dataset.bound = 'true';
        subTabContainer.querySelectorAll('.btn-sub-tab-membro').forEach(btn => {
            btn.addEventListener('click', () => {
                subTabContainer.querySelectorAll('.btn-sub-tab-membro').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = '#f1f5f9';
                    b.style.color = '#475569';
                });
                btn.classList.add('active');
                btn.style.background = 'var(--green-600)';
                btn.style.color = 'white';
                
                currentSubTabMembro = btn.dataset.type;
                renderFilteredBibliotecaMembro();
            });
        });
    }

    try {
        cachedBibliotecaMembro = await api('GET', '/api/equipe/biblioteca');
        renderFilteredBibliotecaMembro();
    } catch (e) {
        container.innerHTML = `<div style="text-align:center; color:#ef4444; padding:20px;">Erro ao carregar biblioteca: ${e.message}</div>`;
    }
}

function renderFilteredBibliotecaMembro() {
    const container = document.getElementById('list-biblioteca-membro');
    if (!container) return;

    let filtered = [];
    if (currentSubTabMembro === 'video') {
        filtered = cachedBibliotecaMembro.filter(b => b.categoria === 'video_treinamento');
    } else if (currentSubTabMembro === 'material') {
        filtered = cachedBibliotecaMembro.filter(b => b.categoria === 'link_material');
    } else {
        filtered = cachedBibliotecaMembro.filter(b => b.categoria.startsWith('script'));
    }

    let html = '';

    if (currentSubTabMembro === 'script') {
        html += `
            <div class="disc-filters" style="background:#f1f5f9; padding:16px; border-radius:var(--radius-md); border:1px solid #cbd5e1; margin-bottom:20px;">
                <h4 style="margin:0 0 12px; font-size:0.9rem; font-weight:700; color:var(--green-950); display:flex; align-items:center; gap:6px;">💡 Roteiros Prontos DISC (Gota App)</h4>
                <div style="display:flex; flex-wrap:wrap; gap:12px;">
                    <div style="flex:1; min-width:180px;">
                        <label style="font-size:0.75rem; font-weight:700; color:#475569; display:block; margin-bottom:4px;">Objetivo / Finalidade</label>
                        <select id="disc-filter-finalidade" class="form-input" style="padding:6px 10px; font-size:0.83rem; background:white; border:1px solid #cbd5e1; color:#0f172a; height:34px;">
                            <option value="vendas" ${currentDiscFinalidadeMembro === 'vendas' ? 'selected' : ''}>✍️ Roteiros de Vendas</option>
                            <option value="cadastro" ${currentDiscFinalidadeMembro === 'cadastro' ? 'selected' : ''}>💼 Roteiros de Cadastro / Recrutamento</option>
                            <option value="objecoes" ${currentDiscFinalidadeMembro === 'objecoes' ? 'selected' : ''}>🛡️ Quebra de Objeções</option>
                        </select>
                    </div>
                    <div style="flex:1; min-width:180px;">
                        <label style="font-size:0.75rem; font-weight:700; color:#475569; display:block; margin-bottom:4px;">Perfil Comportamental (DISC)</label>
                        <select id="disc-filter-perfil" class="form-input" style="padding:6px 10px; font-size:0.83rem; background:white; border:1px solid #cbd5e1; color:#0f172a; height:34px;">
                            <option value="dominante" ${currentDiscPerfilMembro === 'dominante' ? 'selected' : ''}>⚡ Perfil Dominante (D) - Objetividade e Resultados</option>
                            <option value="influente" ${currentDiscPerfilMembro === 'influente' ? 'selected' : ''}>🔥 Perfil Influente (I) - Conexão e Energia</option>
                            <option value="estavel" ${currentDiscPerfilMembro === 'estavel' ? 'selected' : ''}>🌱 Perfil Estável (S) - Segurança e Cuidado</option>
                            <option value="analitico" ${currentDiscPerfilMembro === 'analitico' ? 'selected' : ''}>🔬 Perfil Analítico (C) - Ciência e Fatos</option>
                        </select>
                    </div>
                </div>
                
                <div id="disc-template-container" style="margin-top:16px;">
                    ${renderSelectedDiscTemplate('membro')}
                </div>
            </div>
            <h4 style="margin:24px 0 12px; font-size:1rem; font-weight:700; color:var(--green-950); border-bottom:1px solid var(--border); padding-bottom:6px;">✍️ Scripts Compartilhados pelo Líder</h4>
        `;
    }

    if (filtered.length === 0) {
        html += `<div style="text-align:center; color:var(--text-muted); padding:20px;">Nenhum material nesta categoria.</div>`;
    } else {
        html += filtered.map(b => {
            const isScript = b.categoria.startsWith('script');
            const catLabel = b.categoria === 'video_treinamento' ? '🎥 Treinamento em Vídeo' :
                             b.categoria === 'link_material' ? '🔗 Material / Link de Apoio' :
                             b.categoria === 'script_vendas' ? '✍️ Roteiro de Vendas' : 
                             b.categoria === 'script_cadastro' ? '💼 Roteiro de Recrutamento' : '🛡️ Quebra de Objeções';

            return `
                <div style="padding:16px 20px; border:1px solid var(--border); border-radius:var(--radius-md); background:#f8fafc;">
                    <span style="font-size:0.7rem; text-transform:uppercase; font-weight:700; color:var(--gold-700);">${catLabel}</span>
                    <h4 style="margin:4px 0; font-size:1.02rem; font-weight:700; color:var(--green-950);">${b.titulo}</h4>
                    ${b.descricao ? `<p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:10px;">${b.descricao}</p>` : ''}
                    
                    ${isScript ? `
                        <div style="background:white; border:1px solid var(--border-light); border-radius:8px; padding:12px; font-size:0.86rem; font-family:monospace; color:#334155; white-space:pre-wrap; max-height:160px; overflow-y:auto; margin-bottom:12px;">${b.conteudo_texto}</div>
                        <button class="btn-copy-script btn btn-secondary btn-sm" data-script-text="${encodeURIComponent(b.conteudo_texto)}" style="display:inline-flex; align-items:center; gap:6px; font-weight:600;">
                            📋 Copiar Roteiro Personalizado
                        </button>
                    ` : `
                        ${b.categoria === 'video_treinamento' && b.url_midia ? getVideoPlayerMarkup(b.url_midia) : ''}
                        ${b.url_midia ? `<a href="${b.url_midia}" target="_blank" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:6px; font-weight:600; text-decoration:none; margin-top:4px;">🔗 Acessar Material</a>` : ''}
                    `}
                </div>
            `;
        }).join('');
    }

    container.innerHTML = html;
    bindBibliotecaMembroEvents(container);
}

function bindBibliotecaMembroEvents(container) {
    const selFinalidade = container.querySelector('#disc-filter-finalidade');
    const selPerfil = container.querySelector('#disc-filter-perfil');
    if (selFinalidade && selPerfil) {
        selFinalidade.addEventListener('change', (e) => {
            currentDiscFinalidadeMembro = e.target.value;
            const tplContainer = container.querySelector('#disc-template-container');
            if (tplContainer) tplContainer.innerHTML = renderSelectedDiscTemplate('membro');
            bindBibliotecaMembroEvents(container);
        });
        
        selPerfil.addEventListener('change', (e) => {
            currentDiscPerfilMembro = e.target.value;
            const tplContainer = container.querySelector('#disc-template-container');
            if (tplContainer) tplContainer.innerHTML = renderSelectedDiscTemplate('membro');
            bindBibliotecaMembroEvents(container);
        });
    }

    container.querySelectorAll('.btn-copy-disc').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = decodeURIComponent(btn.dataset.scriptText);
            openSmartCopyModal(text);
        });
    });

    container.querySelectorAll('.btn-copy-script').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = decodeURIComponent(btn.dataset.scriptText);
            openSmartCopyModal(text);
        });
    });
}

// ── Helper: Load Delegacoes (Member View) ─────────────────────
async function loadDelegacoesMembro() {
    const container = document.getElementById('list-delegacoes-membro');
    if (!container) return;

    try {
        const delegacoes = await api('GET', '/api/equipe/delegacoes');
        if (delegacoes.length === 0) {
            container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:30px;">Nenhum cliente compartilhado pelo líder com você.</div>`;
            return;
        }

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:16px;">
                ${delegacoes.map(d => {
                    const isDone = d.status_devolutiva === 'concluido';
                    const isProgress = d.status_devolutiva === 'em_andamento';

                    return `
                        <div class="card" style="padding:20px; border:1px solid ${isDone ? '#86efac' : isProgress ? '#93c5fd' : '#cbd5e1'}; background:white;">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:12px;">
                                <div>
                                    <h4 style="font-size:1.05rem; font-weight:700; color:var(--green-950); margin:0;">👤 ${d.cliente_nome}</h4>
                                    <p style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">Email: ${d.cliente_email || 'Não informado'} | Celular: ${d.cliente_telefone || 'Não informado'}</p>
                                </div>
                                <div>
                                    ${isDone ? `
                                        <span class="badge-ok">Concluída 🎉</span>
                                    ` : isProgress ? `
                                        <span style="background:#e0f2fe; color:#0369a1; padding:4px 10px; border-radius:12px; font-size:0.75rem; font-weight:700;">Atendendo...</span>
                                    ` : `
                                        <span class="badge-warn">Pendente ⏳</span>
                                    `}
                                </div>
                            </div>
                            
                            ${d.notas_lider ? `
                                <div style="background:#f8fafc; border-left:3px solid var(--gold-400); padding:10px 14px; border-radius:4px; font-size:0.83rem; color:var(--text-dark); margin-bottom:16px; font-style:italic;">
                                    <strong>Notas do Líder:</strong> "${d.notas_lider}"
                                </div>
                            ` : ''}

                            <div style="display:flex; gap:10px; flex-wrap:wrap;">
                                <a href="https://api.whatsapp.com/send?phone=55${(d.cliente_telefone || '').replace(/\D/g, '')}" target="_blank" class="btn btn-secondary btn-sm" style="background:#25d366; color:white; border:none; display:inline-flex; align-items:center; gap:6px;">
                                    💬 Chamar Cliente no Zap
                                </a>
                                <button class="btn-ver-anamneses-del btn btn-secondary btn-sm" data-cliente-id="${d.cliente_id}" style="font-weight:600;">
                                    📋 Fichas de Anamnese
                                </button>
                                
                                ${!isDone ? `
                                    <button class="btn-update-status-del btn btn-primary btn-sm" data-del-id="${d.id}" data-status="concluido" style="background:var(--green-600); border:none; color:white; font-weight:600;">
                                        ✓ Marcar Devolutiva Concluída
                                    </button>
                                    ${!isProgress ? `
                                        <button class="btn-update-status-del btn btn-secondary btn-sm" data-del-id="${d.id}" data-status="em_andamento" style="font-weight:600;">
                                            Atendendo...
                                        </button>
                                    ` : ''}
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Bind update status
        container.querySelectorAll('.btn-update-status-del').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.delId;
                const status = btn.dataset.status;
                try {
                    await api('PUT', `/api/equipe/delegacoes/${id}`, { status_devolutiva: status });
                    toast('Status atualizado com sucesso!', 'success');
                    loadDelegacoesMembro();
                } catch (e) {
                    toast(e.message || 'Erro ao atualizar delegação.', 'danger');
                }
            });
        });

        // Bind view anamneses
        container.querySelectorAll('.btn-ver-anamneses-del').forEach(btn => {
            btn.addEventListener('click', async () => {
                const clienteId = btn.dataset.clienteId;
                window.location.hash = `#/clients?searchId=${clienteId}`;
            });
        });

    } catch (e) {
        container.innerHTML = `<div style="text-align:center; color:#ef4444; padding:20px;">Erro ao carregar leads recebidos: ${e.message}</div>`;
    }
}

// ── Helper: Open Modal to Delegate a Lead ────────────────────
async function openDelegarLeadModal(equipeId) {
    try {
        // Loads both clients list and team members list in parallel
        const [clients, membros] = await Promise.all([
            api('GET', '/api/clientes'),
            api('GET', '/api/equipe/membros')
        ]);

        if (membros.length === 0) {
            return alert('Sua equipe ainda não possui consultores cadastrados para delegar leads.');
        }

        // Filters out clients already shared or without necessary fields if needed, 
        // but let's list all active clients.
        const activeClients = clients.filter(c => c.ativo !== false && !c.compartilhado_de_lider_id);

        if (activeClients.length === 0) {
            return alert('Você não possui clientes ativos livres na sua carteira para compartilhar.');
        }

        const m = modal('🤝 Compartilhar Lead com Membro', `
            <div style="padding:10px 0">
                <div class="form-group" style="margin-bottom:12px">
                    <label class="form-label" style="color:var(--text-dark)">Selecione o Cliente / Lead</label>
                    <select id="del-select-cliente" class="form-input" style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a;">
                        ${activeClients.map(c => `<option value="${c.id}">${c.nome} (${c.telefone || 'Sem Celular'})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group" style="margin-bottom:12px">
                    <label class="form-label" style="color:var(--text-dark)">Selecione o Consultor Responsável</label>
                    <select id="del-select-liderado" class="form-input" style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a;">
                        ${membros.map(mb => `<option value="${mb.id}">${mb.nome} (${mb.rank_doterra || 'Consultor'})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group" style="margin-bottom:16px">
                    <label class="form-label" style="color:var(--text-dark)">Instruções ou Notas do Líder (Opcional)</label>
                    <textarea id="del-notas-lider" class="form-input" rows="3" placeholder="Ex: Este cliente tem interesse em óleos para insônia..." style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a; font-family:inherit;"></textarea>
                </div>
                <button class="btn btn-primary" id="btn-submit-delegacao" style="width:100%; background:var(--gold-500); color:var(--green-950)">🤝 Compartilhar Cliente</button>
            </div>
        `);

        m.el.querySelector('#btn-submit-delegacao').addEventListener('click', async () => {
            const cliente_id = m.el.querySelector('#del-select-cliente').value;
            const liderado_id = m.el.querySelector('#del-select-liderado').value;
            const notas_lider = m.el.querySelector('#del-notas-lider').value?.trim();

            try {
                const btn = m.el.querySelector('#btn-submit-delegacao');
                btn.disabled = true;
                btn.textContent = 'Enviando...';

                await api('POST', '/api/equipe/delegar', {
                    cliente_id, liderado_id, notas_lider
                });

                toast('Lead delegado com sucesso!', 'success');
                m.close();
                
                // Reload delegation list
                loadDelegacoesLider();
            } catch (err) {
                m.el.querySelector('#btn-submit-delegacao').disabled = false;
                m.el.querySelector('#btn-submit-delegacao').textContent = '🤝 Compartilhar Cliente';
                toast(err.message || 'Erro ao delegar lead.', 'danger');
            }
        });

    } catch (e) {
        toast('Erro ao abrir painel de delegação.', 'danger');
    }
}

// ── Helper: Load Push History (Leader View) ──────────────────
async function loadPushHistorico() {
    const container = document.getElementById('list-push-historico');
    if (!container) return;

    try {
        const historico = await api('GET', '/api/equipe/push-historico');
        if (!historico || historico.length === 0) {
            container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:15px; font-size:0.85rem;">Nenhum push enviado recentemente.</div>`;
            return;
        }

        container.innerHTML = historico.map(item => {
            const dateStr = new Date(item.criado_em).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            const totalEnviados = item.total_enviados || 0;
            const cliquesQtd = item.cliques_qtd || 0;
            const percentage = totalEnviados > 0 ? Math.round((cliquesQtd / totalEnviados) * 100) : 0;

            return `
                <div style="padding:14px; border:1px solid var(--border); border-radius:var(--radius-md); background:#f8fafc; display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px;">
                        <span style="font-size:0.75rem; font-weight:700; color:var(--green-600);">${dateStr}</span>
                        <span style="font-size:0.75rem; font-weight:700; color:var(--text-dark);">${cliquesQtd} / ${totalEnviados} lido(s) (${percentage}%)</span>
                    </div>
                    <p style="font-size:0.82rem; color:var(--text-dark); white-space:pre-wrap; margin:0; line-height:1.4;">${item.mensagem}</p>
                    <div style="width:100%; background:#e2e8f0; height:6px; border-radius:3px; overflow:hidden;">
                        <div style="width:${percentage}%; background:linear-gradient(90deg, var(--green-600), var(--green-800)); height:100%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        container.innerHTML = `<div style="text-align:center; color:#ef4444; padding:15px; font-size:0.85rem;">Erro ao carregar histórico: ${e.message}</div>`;
    }
}

// ── Helpers: Video Player Parsing & Embedding ────────────────
function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function getVimeoId(url) {
    if (!url) return null;
    const regExp = /vimeo\.com\/(?:video\/|channels\/staffpicks\/|channels\/[\w\-]+\/|groups\/[\w\-]+\/forum\/topic\/|)?(\d+)?/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

function isDirectVideo(url) {
    if (!url) return false;
    const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg');
}

function getVideoPlayerMarkup(url) {
    if (!url) return '';
    
    const ytId = getYouTubeId(url);
    if (ytId) {
        return `
            <div class="video-container" style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:var(--radius-md); border:1px solid var(--border); background:#000; margin-bottom:10px;">
                <iframe src="https://www.youtube.com/embed/${ytId}" style="position:absolute; top:0; left:0; width:100%; height:100%;" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            </div>
        `;
    }
    
    const vimeoId = getVimeoId(url);
    if (vimeoId) {
        return `
            <div class="video-container" style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:var(--radius-md); border:1px solid var(--border); background:#000; margin-bottom:10px;">
                <iframe src="https://player.vimeo.com/video/${vimeoId}" style="position:absolute; top:0; left:0; width:100%; height:100%;" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
            </div>
        `;
    }
    
    if (isDirectVideo(url)) {
        return `
            <div style="margin-bottom:10px;">
                <video src="${url}" controls style="width:100%; max-height:360px; background:#000; border-radius:var(--radius-md); border:1px solid var(--border); display:block;"></video>
            </div>
        `;
    }
    
    // Fallback if URL is set but doesn't match standard video formats
    return `
        <div style="margin-bottom:10px; padding:10px; border:1px dashed var(--border); border-radius:var(--radius-sm); background:#f8fafc; font-size:0.8rem; text-align:center;">
            📺 Link de vídeo não pôde ser incorporado diretamente.
        </div>
    `;
}

// ── Globals & Helper functions for Library Sub-tabs and DISC scripts ──────────
let cachedBibliotecaLider = [];
let currentSubTabLider = 'video';
let currentDiscFinalidadeLider = 'vendas';
let currentDiscPerfilLider = 'dominante';

let cachedBibliotecaMembro = [];
let currentSubTabMembro = 'video';
let currentDiscFinalidadeMembro = 'vendas';
let currentDiscPerfilMembro = 'dominante';

const DISC_TEMPLATES = [
    {
        finalidade: 'vendas',
        perfil: 'dominante',
        perfilLabel: 'Dominante (D)',
        titulo: 'Vendas Peppermint/Lavanda - Perfil Dominante ⚡',
        descricao: 'Foco em resultados imediatos, rapidez e objetividade. Não use jargões longos.',
        conteudo_texto: 'Olá {{nome_cliente}}, tudo bem? Aqui é a {{nome_consultor}} do Gota App.\n\nVi na sua anamnese que você busca resolver [Inserir Queixa, ex: insônia/ansiedade]. O óleo essencial de Lavanda pura doTERRA é o calmante natural mais rápido e potente do mercado. Você sente o relaxamento e o alívio físico em menos de 2 minutos, sem efeitos colaterais.\n\nVamos agendar uma ligação rápida de 3 minutos amanhã às 14h para eu te explicar o uso e como você pode adquirir direto da fábrica com 25% de desconto?'
    },
    {
        finalidade: 'vendas',
        perfil: 'influente',
        perfilLabel: 'Influente (I)',
        titulo: 'Vendas Soluções de Bem-estar - Perfil Influente 🔥',
        descricao: 'Foco em entusiasmo, conexão pessoal, novidade e depoimentos.',
        conteudo_texto: 'Oi {{nome_cliente}}! Que alegria falar com você! Aqui é a {{nome_consultor}}.\n\nFiquei super empolgada ao ver suas respostas na anamnese e já visualizei uma rotina de bem-estar incrível para você se sentir com muito mais energia! O estilo de vida doTERRA é maravilhoso e transformou completamente a minha energia diária e a de milhares de pessoas.\n\nToparia fazermos uma videochamada rápida de 5 minutos amanhã para eu te mostrar como usar e te passar umas dicas sensacionais de autocuidado? Você vai amar!'
    },
    {
        finalidade: 'vendas',
        perfil: 'estavel',
        perfilLabel: 'Estável (S)',
        titulo: 'Vendas Cuidado Familiar - Perfil Estável 🌱',
        descricao: 'Foco em segurança, saúde da família, cuidado e bem-estar do lar.',
        conteudo_texto: 'Olá {{nome_cliente}}, tudo bem? Aqui é a {{nome_consultor}}.\n\nAnalisei sua anamnese com muito carinho e notei que você busca mais qualidade de vida e cuidado natural para a sua família. Os óleos essenciais doTERRA são 100% puros e certificados, seguros para uso em crianças e idosos com total tranquilidade, trazendo saúde para dentro do seu lar.\n\nQueria agendar um bate-papo calmo de 10 minutos para te orientar sobre o uso preventivo e seguro dessas soluções naturais na sua rotina familiar. O que acha de quinta-feira?'
    },
    {
        finalidade: 'vendas',
        perfil: 'analitico',
        perfilLabel: 'Analítico (C)',
        titulo: 'Vendas Base Científica - Perfil Analítico 🔬',
        descricao: 'Foco em ciência, pureza certificada CPTG, dados e custo-benefício.',
        conteudo_texto: 'Olá {{nome_cliente}}, como vai? Aqui é a {{nome_consultor}}.\n\nCom base nas informações da sua anamnese, selecionei os óleos essenciais com os compostos químicos ativos mais adequados para a sua queixa. Os óleos doTERRA possuem o selo CPTG (Certificado de Pureza Testada e Garantida), passando por 54 testes rígidos de laboratório que garantem 100% de eficácia terapêutica.\n\nComo cada gota é extremamente concentrada (1 gota de Peppermint equivale a 28 xícaras de chá), o custo por dose terapêutica é de cerca de R$ 0,40. Gostaria de agendar uma conversa de 10 minutos para te apresentar os estudos de eficácia e a análise de custo-benefício? Qual o melhor horário?'
    },
    {
        finalidade: 'cadastro',
        perfil: 'dominante',
        perfilLabel: 'Dominante (D)',
        titulo: 'Recrutamento Oportunidade - Perfil Dominante 📈',
        descricao: 'Foco em crescimento financeiro, independência e liderança de mercado.',
        conteudo_texto: 'Olá {{nome_cliente}}, tudo bem? Aqui é a {{nome_consultor}}.\n\nAtuo na expansão de mercado da doTERRA no Brasil. Identifiquei seu perfil de liderança e vejo potencial para você encabeçar uma equipe na sua região. O mercado de bem-estar cresce dois dígitos ao ano e nosso plano de carreira paga bônus de liderança agressivos e comissões recorrentes por volume.\n\nQueria te apresentar os números da empresa e o plano de compensação em uma chamada objetiva de 10 minutos no Zoom. Quinta às 19h funciona para você?'
    },
    {
        finalidade: 'cadastro',
        perfil: 'influente',
        perfilLabel: 'Influente (I)',
        titulo: 'Recrutamento Comunidade - Perfil Influente ✈️',
        descricao: 'Foco em viagens, estilo de vida livre, reconhecimento e time.',
        conteudo_texto: 'Oi {{nome_cliente}}, tudo bem? Aqui é a {{nome_consultor}}!\n\nEstou trabalhando com um projeto lindo na doTERRA que tem tudo a ver com você! É uma oportunidade de trabalhar com total liberdade geográfica e de tempo, viajar para eventos incríveis e crescer profissionalmente fazendo novos amigos.\n\nNosso time é super animado e nos apoiamos muito em convenções e treinamentos. Vamos bater um papo rápido no Zoom de 15 minutos para eu te apresentar esse estilo de vida incrível? Você vai amar a nossa comunidade!'
    },
    {
        finalidade: 'cadastro',
        perfil: 'estavel',
        perfilLabel: 'Estável (S)',
        titulo: 'Recrutamento Suporte e Parceria - Perfil Estável 🤝',
        descricao: 'Foco em suporte passo a passo, segurança de renda e espírito de equipe.',
        conteudo_texto: 'Olá {{nome_cliente}}, como vai? Aqui é a {{nome_consultor}}.\n\nEstou desenvolvendo um projeto muito especial com a doTERRA focado em levar bem-estar e saúde para as famílias. É um trabalho com um propósito lindo, onde ajudamos pessoas a transformarem suas vidas financeiras de forma ética, segura e com suporte mútuo constante.\n\nVocê nunca estará sozinha, pois temos um sistema de treinamento passo a passo e nos ajudamos como família. Toparia conversarmos 15 minutos para conhecer a empresa e ver como pode construir uma renda segura para o seu lar no seu ritmo?'
    },
    {
        finalidade: 'cadastro',
        perfil: 'analitico',
        perfilLabel: 'Analítico (C)',
        titulo: 'Recrutamento Solidez e Retenção - Perfil Analítico 📊',
        descricao: 'Foco em solidez da empresa, taxa de retenção de 65% e plano detalhado.',
        conteudo_texto: 'Olá {{nome_cliente}}, como vai? Aqui é a {{nome_consultor}}.\n\nGostaria de apresentar os dados financeiros do modelo de negócios da doTERRA. Trata-se da maior empresa de óleos essenciais do mundo, com uma taxa de retenção de clientes de 65% (a média do mercado é de apenas 15%). Isso garante uma receita recorrente sólida baseada no consumo real.\n\nPosso enviar um PDF com a apresentação institucional e o plano de compensação detalhado para agendarmos uma conversa de 15 minutos para tirar dúvidas técnicas sobre as projeções de crescimento? Qual o melhor dia?'
    },
    {
        finalidade: 'objecoes',
        perfil: 'dominante',
        perfilLabel: 'Dominante (D)',
        titulo: 'Objeção "Achei Caro" - Perfil Dominante 💰',
        descricao: 'Contorna a objeção de preço focando em custo por dose e retorno imediato.',
        conteudo_texto: 'Entendo perfeitamente seu ponto de vista, {{nome_cliente}}.\n\nMas deixa eu te mostrar os números reais: um frasco de 15ml doTERRA vem com cerca de 250 gotas. Como a dosagem padrão é de apenas 1 a 2 gotas por uso devido à pureza CPTG, cada dose terapêutica custa menos de R$ 0,40. É muito mais barato do que comprar remédios tradicionais ou pagar consultas.\n\nVale a pena o investimento imediato pelo alívio imediato. Vamos fechar seu kit básico hoje com 25% de desconto?'
    },
    {
        finalidade: 'objecoes',
        perfil: 'influente',
        perfilLabel: 'Influente (I)',
        titulo: 'Objeção "Achei Caro" - Perfil Influente ✨',
        descricao: 'Contorna a objeção focando em valor pessoal, prioridade e benefícios de bem-estar.',
        conteudo_texto: 'Eu também achava isso no início, {{nome_cliente}}!\n\nMas depois que comecei a usar, vi que o valor é insignificante perto do bem-estar que ele traz. Nós gastamos tanto com coisas supérfluas no dia a dia, não é? Investir na nossa saúde, autoestima e no bem-estar de quem amamos é a melhor escolha.\n\nAlém disso, com o cadastro de membro você economiza 25% em tudo e ganha produtos grátis no programa de fidelidade! Você merece esse cuidado!'
    },
    {
        finalidade: 'objecoes',
        perfil: 'estavel',
        perfilLabel: 'Estável (S)',
        titulo: 'Objeção "Achei Caro" - Perfil Estável 🏡',
        descricao: 'Contorna a objeção focando em prevenção de saúde e proteção familiar.',
        conteudo_texto: 'Compreendo a sua preocupação com o orçamento familiar, {{nome_cliente}}.\n\nMas veja os óleos essenciais como uma farmácia natural preventiva em casa. Tratar a insônia ou imunidade de forma natural evita gastos futuros com medicamentos fortes na farmácia e protege a saúde da sua família a longo prazo, sem efeitos colaterais.\n\nO kit se paga rapidamente pela saúde e economia no lar. Vamos começar devagar com as opções mais essenciais para sua família?'
    },
    {
        finalidade: 'objecoes',
        perfil: 'analitico',
        perfilLabel: 'Analítico (C)',
        titulo: 'Objeção "Achei Caro" - Perfil Analítico 🔬',
        descricao: 'Contorna a objeção mostrando estatísticas, concentração e tabela comparativa.',
        conteudo_texto: 'Compreendo, {{nome_cliente}}.\n\nVamos fazer uma análise analítica do custo por dose. O óleo de Peppermint de 15ml custa R$ X para membros e contém 250 gotas. Uma aplicação de 1 gota equivale a R$ X. Para obtermos a mesma quantidade do componente ativo L-mentol de uma única gota doTERRA com chás ou outras marcas não certificadas, o custo financeiro e o tempo seriam consideravelmente maiores.\n\nA pureza CPTG garante a máxima concentração de ativos, tornando a dose terapêutica doTERRA a mais barata e eficiente do mercado. Gostaria que eu te enviasse essa planilha comparativa de custos?'
    }
];

function renderSelectedDiscTemplate(view) {
    const finalidade = view === 'lider' ? currentDiscFinalidadeLider : currentDiscFinalidadeMembro;
    const perfil = view === 'lider' ? currentDiscPerfilLider : currentDiscPerfilMembro;
    
    const template = DISC_TEMPLATES.find(t => t.finalidade === finalidade && t.perfil === perfil);
    if (!template) return '<div style="color:var(--text-muted)">Nenhum modelo selecionado</div>';
    
    const badgeColor = perfil === 'dominante' ? '#ef4444' : perfil === 'influente' ? '#f59e0b' : perfil === 'estavel' ? '#10b981' : '#3b82f6';
    
    return `
        <div style="background:white; border:1px solid #e2e8f0; padding:16px; border-radius:var(--radius-md); box-shadow:0 1px 3px rgba(0,0,0,0.05); position:relative;">
            <span style="font-size:0.7rem; font-weight:700; color:white; background:${badgeColor}; padding:3px 8px; border-radius:12px; text-transform:uppercase; display:inline-block; margin-bottom:8px;">
                ${template.perfilLabel}
            </span>
            <h5 style="margin:0 0 6px; font-size:0.95rem; font-weight:700; color:var(--green-950);">${template.titulo}</h5>
            <p style="font-size:0.8rem; color:var(--text-muted); margin:0 0 12px; font-style:italic;"><strong>Dica de Abordagem:</strong> ${template.descricao}</p>
            <div style="background:#f8fafc; border:1px solid var(--border-light); border-radius:8px; padding:12px; font-size:0.84rem; font-family:monospace; color:#334155; white-space:pre-wrap; max-height:160px; overflow-y:auto; margin-bottom:12px;">${template.conteudo_texto}</div>
            
            <div style="display:flex; gap:8px;">
                <button class="btn-copy-disc btn btn-secondary btn-sm" data-script-text="${encodeURIComponent(template.conteudo_texto)}" style="display:inline-flex; align-items:center; gap:6px; font-weight:600; font-size:0.75rem;">
                    📋 Copiar Roteiro Personalizado
                </button>
                ${view === 'lider' ? `
                    <button class="btn-use-disc-model btn btn-secondary btn-sm" data-script-text="${encodeURIComponent(template.conteudo_texto)}" data-titulo="${encodeURIComponent(template.titulo)}" data-desc="${encodeURIComponent(template.descricao)}" style="display:inline-flex; align-items:center; gap:6px; font-weight:600; font-size:0.75rem;">
                        ✏️ Usar como Modelo (Editar)
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function openSmartCopyModal(text) {
    import('../utils.js?v=1010').then(({ modal }) => {
        const m = modal('✍️ Copiar Script Inteligente', `
            <div style="padding:10px 0">
                <p style="font-size:0.86rem; color:var(--text-muted); margin-bottom:14px;">Preencha os campos abaixo para autocompletar as variáveis do roteiro antes de copiá-lo para a conversa.</p>
                <div class="form-group" style="margin-bottom:12px">
                    <label class="form-label" style="color:var(--text-dark)">Nome do Cliente</label>
                    <input type="text" id="script-var-cliente-modal" class="form-input" placeholder="Ex: Maria" style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a;" />
                </div>
                <button class="btn btn-primary" id="btn-do-copy-modal" style="width:100%">📋 Copiar Mensagem Personalizada</button>
            </div>
        `);

        m.el.querySelector('#btn-do-copy-modal').addEventListener('click', () => {
            const nomeCl = m.el.querySelector('#script-var-cliente-modal').value?.trim() || 'Amiga(o)';
            let parsedText = text.replace(/{{nome_cliente}}/g, nomeCl);
            parsedText = parsedText.replace(/{{nome_consultor}}/g, auth.current?.nome?.split(' ')[0] || 'Consultor');
            
            navigator.clipboard.writeText(parsedText);
            toast('Script personalizado copiado!', 'success');
            m.close();
        });
    });
}

function openEditarNomeEquipeModal(currentName) {
    const m = modal('✏️ Editar Nome da Equipe', `
        <div style="padding:10px 0">
            <p style="font-size:0.86rem; color:var(--text-muted); margin-bottom:14px;">Digite o novo nome para a sua equipe no campo abaixo.</p>
            <div class="form-group" style="margin-bottom:16px">
                <label class="form-label" style="color:var(--text-dark)">Nome da Equipe</label>
                <input type="text" id="edit-team-name-input" class="form-input" value="${currentName}" placeholder="Ex: Elite doTERRA" style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a;" />
            </div>
            <button class="btn btn-primary" id="btn-submit-edit-team-name" style="width:100%">Salvar Nome</button>
        </div>
    `);

    m.el.querySelector('#btn-submit-edit-team-name').addEventListener('click', async () => {
        const name = m.el.querySelector('#edit-team-name-input').value?.trim();
        if (!name) {
            return toast('O nome da equipe não pode ser vazio.', 'danger');
        }

        try {
            const btn = m.el.querySelector('#btn-submit-edit-team-name');
            btn.disabled = true;
            btn.textContent = 'Salvando...';

            await api('PUT', '/api/equipe/nome', { nome_equipe: name });
            toast('Nome da equipe atualizado com sucesso!', 'success');
            m.close();
            
            // Reload page view
            const data = await api('GET', '/api/equipe/me');
            if (data.equipe) {
                renderLiderView(data.equipe);
            }
        } catch (err) {
            m.el.querySelector('#btn-submit-edit-team-name').disabled = false;
            m.el.querySelector('#btn-submit-edit-team-name').textContent = 'Salvar Nome';
            toast(err.message || 'Erro ao atualizar nome da equipe.', 'danger');
        }
    });
}

