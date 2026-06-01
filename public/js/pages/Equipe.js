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
                <h2>Equipe: ${equipe.nome_equipe}</h2>
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
                    <h3 style="font-size:1.15rem; font-weight:700; color:var(--green-950); margin-bottom:16px;">Biblioteca Compartilhada</h3>
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
                <h3 style="font-size:1.15rem; font-weight:700; color:var(--green-950); margin-bottom:16px;">Materiais Educacionais e Roteiros</h3>
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

    try {
        const biblioteca = await api('GET', '/api/equipe/biblioteca');
        if (biblioteca.length === 0) {
            container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">Nenhum material cadastrado na biblioteca.</div>`;
            return;
        }

        container.innerHTML = biblioteca.map(b => {
            const isScript = b.categoria.startsWith('script');
            const catLabel = b.categoria === 'video_treinamento' ? '🎥 Treinamento em Vídeo' :
                             b.categoria === 'link_material' ? '🔗 Material / Link Externo' :
                             b.categoria === 'script_vendas' ? '✍️ Script de Vendas' : '💼 Script de Recrutamento';

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
                        ${b.url_midia ? `<a href="${b.url_midia}" target="_blank" style="font-size:0.82rem; color:var(--green-600); text-decoration:underline; font-weight:600;">🔗 Acessar Link Externo</a>` : ''}
                    `}
                </div>
            `;
        }).join('');

        // Bind delete resource
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

        // Bind use model
        container.querySelectorAll('.btn-use-model').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.bibId;
                const b = biblioteca.find(item => item.id === id);
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

        // Bind script copies for leader
        container.querySelectorAll('.btn-copy-script').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = decodeURIComponent(btn.dataset.scriptText);
                
                import('../utils.js?v=1010').then(({ modal }) => {
                    const m = modal('✍️ Copiar Script Inteligente', `
                        <div style="padding:10px 0">
                            <p style="font-size:0.86rem; color:var(--text-muted); margin-bottom:14px;">Preencha os campos abaixo para autocompletar as variáveis do roteiro antes de copiá-lo para a conversa.</p>
                            <div class="form-group" style="margin-bottom:12px">
                                <label class="form-label" style="color:var(--text-dark)">Nome do Cliente</label>
                                <input type="text" id="script-var-cliente-lider" class="form-input" placeholder="Ex: Maria" style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a;" />
                            </div>
                            <button class="btn btn-primary" id="btn-do-copy-lider" style="width:100%">📋 Copiar Mensagem Personalizada</button>
                        </div>
                    `);

                    m.el.querySelector('#btn-do-copy-lider').addEventListener('click', () => {
                        const nomeCl = m.el.querySelector('#script-var-cliente-lider').value?.trim() || 'Amiga(o)';
                        let parsedText = text.replace(/{{nome_cliente}}/g, nomeCl);
                        parsedText = parsedText.replace(/{{nome_consultor}}/g, auth.current?.nome?.split(' ')[0] || 'Consultor');
                        
                        navigator.clipboard.writeText(parsedText);
                        toast('Script personalizado copiado!', 'success');
                        m.close();
                    });
                });
            });
        });
    } catch (e) {
        container.innerHTML = `<div style="text-align:center; color:#ef4444; padding:20px;">Erro ao carregar biblioteca: ${e.message}</div>`;
    }
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

    try {
        const biblioteca = await api('GET', '/api/equipe/biblioteca');
        if (biblioteca.length === 0) {
            container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">Nenhum material compartilhado pelo líder ainda.</div>`;
            return;
        }

        container.innerHTML = biblioteca.map(b => {
            const isScript = b.categoria.startsWith('script');
            const catLabel = b.categoria === 'video_treinamento' ? '🎥 Treinamento em Vídeo' :
                             b.categoria === 'link_material' ? '🔗 Material / Link de Apoio' :
                             b.categoria === 'script_vendas' ? '✍️ Roteiro de Vendas' : '💼 Roteiro de Recrutamento';

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
                        ${b.url_midia ? `<a href="${b.url_midia}" target="_blank" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:6px; font-weight:600; text-decoration:none; margin-top:4px;">🔗 Acessar Material</a>` : ''}
                    `}
                </div>
            `;
        }).join('');

        // Bind script copies
        container.querySelectorAll('.btn-copy-script').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = decodeURIComponent(btn.dataset.scriptText);
                
                // Prompt/Modal to replace dynamics
                import('../utils.js?v=1010').then(({ modal }) => {
                    const m = modal('✍️ Copiar Script Inteligente', `
                        <div style="padding:10px 0">
                            <p style="font-size:0.86rem; color:var(--text-muted); margin-bottom:14px;">Preencha os campos abaixo para autocompletar as variáveis do roteiro antes de copiá-lo para a conversa.</p>
                            <div class="form-group" style="margin-bottom:12px">
                                <label class="form-label" style="color:var(--text-dark)">Nome do Cliente</label>
                                <input type="text" id="script-var-cliente" class="form-input" placeholder="Ex: Maria" style="background:#f8fafc; border:1px solid #cbd5e1; color:#0f172a;" />
                            </div>
                            <button class="btn btn-primary" id="btn-do-copy" style="width:100%">📋 Copiar Mensagem Personalizada</button>
                        </div>
                    `);

                    m.el.querySelector('#btn-do-copy').addEventListener('click', () => {
                        const nomeCl = m.el.querySelector('#script-var-cliente').value?.trim() || 'Amiga(o)';
                        let parsedText = text.replace(/{{nome_cliente}}/g, nomeCl);
                        parsedText = parsedText.replace(/{{nome_consultor}}/g, auth.current?.nome?.split(' ')[0] || 'Consultor');
                        
                        navigator.clipboard.writeText(parsedText);
                        toast('Script personalizado copiado!', 'success');
                        m.close();
                    });
                });
            });
        });
    } catch (e) {
        container.innerHTML = `<div style="text-align:center; color:#ef4444; padding:20px;">Erro ao carregar biblioteca: ${e.message}</div>`;
    }
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
