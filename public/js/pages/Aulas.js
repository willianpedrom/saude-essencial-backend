/* ============================================================
   AULAS.JS – Tela do Aluno (Visualizador de Aulas e Estratégias)
   ============================================================ */

import { renderLayout } from './Dashboard.js?v=1010';
import { auth, api } from '../store.js?v=1010';
import { toast } from '../utils.js?v=1010';

export async function renderAulas(router) {
    // 1. Mostrar estado de carregamento
    renderLayout(router, 'Aulas e estratégias', `
        <div style="display:flex;align-items:center;justify-content:center;height:300px;font-size:1.1rem;color:var(--text-muted)">
            <div class="loader-dots"><span></span><span></span><span></span></div>
            <span style="margin-left:12px">Carregando aulas e tutoriais...</span>
        </div>
    `, 'aulas');

    let modulos = [];
    let aulaAtiva = null;

    try {
        modulos = await api('GET', '/api/aulas');
        // Achar a primeira aula disponível
        for (const m of modulos) {
            if (m.aulas && m.aulas.length > 0) {
                aulaAtiva = m.aulas[0];
                break;
            }
        }
    } catch (err) {
        console.error(err);
        toast('Erro ao carregar os tutoriais.', 'error');
    }

    render();

    function render() {
        const pc = document.getElementById('page-content');
        if (!pc) return;

        let adminBanner = '';
        if (auth.isAdmin) {
            adminBanner = `
                <div style="background:linear-gradient(135deg, var(--green-900), var(--green-700)); border-radius:var(--radius-lg); padding:16px 20px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; color:white; box-shadow:var(--shadow-sm); flex-wrap:wrap; gap:12px">
                    <div>
                        <h4 style="margin:0; font-size:1.05rem; font-weight:700">Painel de Conteúdo (Admin)</h4>
                        <p style="margin:2px 0 0; font-size:0.8rem; color:rgba(255,255,255,0.85)">Você pode gerenciar os módulos, aulas e estratégias no painel administrativo.</p>
                    </div>
                    <button class="btn btn-primary btn-sm" id="btn-ir-admin-aulas" style="background:var(--white); color:var(--green-800); border:none; font-weight:700; display:flex; align-items:center; gap:6px; cursor:pointer">
                        ⚙️ Gerenciar Aulas
                    </button>
                </div>
            `;
        }

        if (modulos.length === 0) {
            pc.innerHTML = `
                ${adminBanner}
                <div class="empty-state" style="background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);padding:4rem 2rem;text-align:center;box-shadow:var(--shadow-sm)">
                    <div style="font-size:4rem;margin-bottom:1.5rem">🎓</div>
                    <h3 style="margin-bottom:0.5rem;color:var(--text-dark)">Nenhuma aula disponível</h3>
                    <p style="color:var(--text-muted);max-width:400px;margin:0 auto 1.5rem">Nossas aulas e estratégias estão sendo preparadas pela equipe. Volte em breve!</p>
                </div>
            `;
            setupEventListeners();
            return;
        }

        // Layout estrutural
        pc.innerHTML = `
            ${adminBanner}
            <div class="aulas-container" style="display:grid;grid-template-columns:320px 1fr;gap:24px;align-items:start">
                
                <!-- Coluna Esquerda: Lista de Módulos e Aulas -->
                <div class="aulas-sidebar" style="background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;box-shadow:var(--shadow-sm);max-height:calc(100vh - 140px);overflow-y:auto;position:sticky;top:85px">
                    <h3 style="font-size:1rem;font-weight:700;color:var(--text-dark);margin-bottom:16px;padding-bottom:12px;border-b:1px solid var(--border);display:flex;align-items:center;gap:8px">
                        📖 Módulos do Curso
                    </h3>
                    <div class="modulos-list" style="display:flex;flex-direction:column;gap:12px">
                        ${modulos.map((modulo, mIdx) => {
                            const isModuloAtivo = aulaAtiva && modulo.aulas.some(a => a.id === aulaAtiva.id);
                            return `
                            <div class="modulo-item" style="border:1px solid ${isModuloAtivo ? 'rgba(51,122,77,0.3)' : 'var(--border)'};background:${isModuloAtivo ? 'var(--green-50)' : 'var(--ivory)'};border-radius:var(--radius-md);overflow:hidden;transition:var(--transition)">
                                <div class="modulo-header" style="padding:12px;font-weight:700;font-size:0.88rem;color:var(--text-dark);cursor:pointer;display:flex;justify-content:between;align-items:center" data-modulo-id="${modulo.id}">
                                    <span>${modulo.titulo}</span>
                                    <span style="font-size:0.75rem;color:var(--text-muted)">(${modulo.aulas.length})</span>
                                </div>
                                <div class="modulo-aulas" style="display:${isModuloAtivo ? 'block' : 'none'};padding:8px;border-top:1px solid rgba(45,122,69,0.1)">
                                    ${modulo.aulas.length === 0 ? `
                                        <div style="font-size:0.75rem;color:var(--text-muted);padding:8px">Nenhuma aula neste módulo.</div>
                                    ` : modulo.aulas.map((aula, aIdx) => {
                                        const isAulaAtiva = aulaAtiva && aula.id === aulaAtiva.id;
                                        const isConcluida = localStorage.getItem(`gota_aula_concluida_${aula.id}`) === 'true';
                                        return `
                                        <div class="aula-list-item ${isAulaAtiva ? 'active' : ''}" data-aula-id="${aula.id}" style="padding:10px;border-radius:var(--radius-sm);font-size:0.8rem;cursor:pointer;display:flex;align-items:center;gap:10px;margin-bottom:4px;transition:var(--transition);background:${isAulaAtiva ? 'var(--white)' : 'transparent'};border:1px solid ${isAulaAtiva ? 'var(--green-300)' : 'transparent'};font-weight:${isAulaAtiva ? '600' : '400'};color:${isAulaAtiva ? 'var(--green-600)' : 'var(--text-body)'}">
                                            <span style="font-size:1.1rem;flex-shrink:0">${isConcluida ? '✅' : '▶️'}</span>
                                            <div style="flex:1">
                                                <div>${aula.titulo}</div>
                                                ${aula.duracao ? `<span style="font-size:0.7rem;color:var(--text-muted)">⏱️ ${aula.duracao}</span>` : ''}
                                            </div>
                                        </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Coluna Direita: Player e Detalhes da Aula -->
                <div class="aula-viewer" style="display:flex;flex-direction:column;gap:20px">
                    ${aulaAtiva ? `
                        <!-- Player Container (16:9 Aspect Ratio) -->
                        <div style="background:#000;border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-md);position:relative;padding-top:56.25%;width:100%">
                            <iframe 
                                src="${getYouTubeEmbedUrl(aulaAtiva.video_url)}"
                                style="position:absolute;top:0;left:0;width:100%;height:100%;border:none"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen>
                            </iframe>
                        </div>

                        <!-- Card de Informações da Aula -->
                        <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;box-shadow:var(--shadow-sm)">
                            <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:16px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border)">
                                <div style="flex:1;min-width:280px">
                                    <h2 style="font-size:1.4rem;font-weight:800;color:var(--text-dark);margin-bottom:4px">${aulaAtiva.titulo}</h2>
                                    ${aulaAtiva.duracao ? `<span style="display:inline-block;background:var(--green-50);color:var(--green-600);font-weight:700;font-size:0.78rem;padding:4px 10px;border-radius:var(--radius-full)">⏱️ Duração: ${aulaAtiva.duracao}</span>` : ''}
                                </div>
                                <label style="display:flex;align-items:center;gap:8px;background:var(--ivory);padding:8px 16px;border-radius:var(--radius-md);border:1px solid var(--border);cursor:pointer;font-size:0.85rem;font-weight:600;color:var(--text-body);transition:var(--transition);user-select:none" class="concluida-label">
                                    <input type="checkbox" id="chk-concluida" ${localStorage.getItem(`gota_aula_concluida_${aulaAtiva.id}`) === 'true' ? 'checked' : ''} style="accent-color:var(--green-600);width:16px;height:16px;cursor:pointer" />
                                    Marcar como concluída
                                </label>
                            </div>
                            
                            <h4 style="font-size:0.9rem;font-weight:700;color:var(--text-dark);margin-bottom:8px">Sobre esta aula</h4>
                            <p style="color:var(--text-body);font-size:0.92rem;line-height:1.6;white-space:pre-wrap">${aulaAtiva.descricao || 'Nenhuma descrição fornecida para esta aula.'}</p>
                        </div>
                    ` : `
                        <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);padding:4rem 2rem;text-align:center;box-shadow:var(--shadow-sm)">
                            <div style="font-size:3rem;margin-bottom:1rem">📺</div>
                            <h3 style="color:var(--text-dark)">Selecione uma aula</h3>
                            <p style="color:var(--text-muted)">Escolha um tutorial na barra lateral para começar a assistir.</p>
                        </div>
                    `}
                </div>
            </div>

            <!-- CSS Responsivo inline -->
            <style>
                @media (max-width: 900px) {
                    .aulas-container {
                        grid-template-columns: 1fr !important;
                    }
                    .aulas-sidebar {
                        position: relative !important;
                        top: 0 !important;
                        max-height: 350px !important;
                    }
                }
                .aula-list-item:hover {
                    background: var(--green-50) !important;
                    color: var(--green-600) !important;
                }
                .modulo-header:hover {
                    background: rgba(45,122,69,0.05);
                }
                .concluida-label:hover {
                    border-color: var(--green-400) !important;
                    background: var(--green-50) !important;
                }
            </style>
        `;

        setupEventListeners();
    }

    function setupEventListeners() {
        const pc = document.getElementById('page-content');
        if (!pc) return;

        // Toggle Módulos (Collapse/Expand)
        pc.querySelectorAll('.modulo-header').forEach(header => {
            header.addEventListener('click', () => {
                const modId = header.dataset.moduloId;
                const aulasDiv = header.nextElementSibling;
                const isVisible = aulasDiv.style.display === 'block';
                aulasDiv.style.display = isVisible ? 'none' : 'block';
                
                // Opcional: fechar outros
                // (Para manter simples, apenas alternamos o atual)
            });
        });

        // Clique em uma aula para reproduzir
        pc.querySelectorAll('.aula-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const aulaId = item.dataset.aulaId;
                let found = null;
                for (const m of modulos) {
                    const a = m.aulas.find(x => x.id === aulaId);
                    if (a) { found = a; break; }
                }
                if (found) {
                    aulaAtiva = found;
                    render();
                }
            });
        });

        // Checkbox de conclusão
        const chk = document.getElementById('chk-concluida');
        if (chk && aulaAtiva) {
            chk.addEventListener('change', () => {
                const done = chk.checked;
                localStorage.setItem(`gota_aula_concluida_${aulaAtiva.id}`, done ? 'true' : 'false');
                toast(done ? 'Aula concluída! Parabéns!' : 'Aula pendente.', 'success');
                // Re-renderizar apenas a barra lateral de módulos para atualizar o ícone de concluída
                render();
            });
        }

        // Redirecionamento para gerenciar aulas no Admin
        const btnAdmin = document.getElementById('btn-ir-admin-aulas');
        if (btnAdmin) {
            btnAdmin.addEventListener('click', () => {
                sessionStorage.setItem('admin_active_tab', 'aulas');
                router.navigate('/admin');
            });
        }
    }
}

// Auxiliar para extrair a URL de incorporação do YouTube
function getYouTubeEmbedUrl(url) {
    if (!url) return '';
    let videoId = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        videoId = match[2];
    } else {
        videoId = url;
    }
    return `https://www.youtube.com/embed/${videoId}?rel=0`;
}
