/*!
 * Gota Essencial - Landing Page Oficial de Conversão SaaS
 */
import { store } from '../store.js';

export async function renderLandingPage(router) {
    const app = document.getElementById('app');

    // Configurações de UI: Removendo o Layout Padrão do Admin
    app.className = 'landing-page-theme';
    document.body.style.background = '#f9fafb';

    // Planos disponíveis fixos (como definido em documentação)
    let planos = [
        { id: 'basico', nome: 'Básico', preco_mensal: 47.90, descricoes: ['Até 50 Clientes', 'Ficha Anamnese', 'Painel de Acompanhamento'] },
        { id: 'pro', nome: 'Pro', preco_mensal: 97.90, descricoes: ['Até 500 Clientes', 'Ficha Anamnese', 'Pipeline de Vendas', 'Pipeline de Recrutamento', 'Suporte Prioritário'] }
    ];

    const isLightMode = true; // Forçar design Light clean para conversão
    const navBar = `
        <nav style="display:flex;justify-content:space-between;align-items:center;padding:20px 5%;background:white;border-bottom:1px solid #e5e7eb;position:sticky;top:0;z-index:100;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:40px;height:40px;background:var(--green-600);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem">💧</div>
                <span style="font-weight:700;font-size:1.2rem;color:var(--text-dark)">Gota Essencial CRM</span>
            </div>
            <div style="display:flex;gap:16px;align-items:center">
                <a href="/#" style="color:var(--text-muted);text-decoration:none;font-weight:500;font-size:0.95rem">Entrar no Sistema</a>
                <a href="#planos" style="background:var(--green-600);color:white;padding:10px 20px;border-radius:24px;text-decoration:none;font-weight:600;font-size:0.95rem;transition:background 0.2s">Começar Agora</a>
            </div>
        </nav>
    `;

    const heroSection = `
        <header style="padding:100px 5%;text-align:center;background:linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)">
            <h1 style="font-size:3.5rem;font-weight:800;color:var(--text-dark);line-height:1.2;margin-bottom:24px;max-width:800px;margin-inline:auto">
                Transforme Contatos em <span style="background:linear-gradient(90deg, #16a34a, #047857);-webkit-background-clip:text;color:transparent">Clientes Fiéis e Líderes</span>.
            </h1>
            <p style="font-size:1.2rem;color:var(--text-body);max-width:600px;margin-inline:auto;margin-bottom:40px;line-height:1.6">
                O único CRM focado no seu negócio de Bem-Estar e Óleos Essenciais. Organize prospectos, clientes preferenciais e downlines em um único lugar maravilhoso.
            </p>
            <div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap">
                <a href="#planos" style="background:var(--green-600);color:white;padding:16px 32px;border-radius:30px;text-decoration:none;font-weight:700;font-size:1.1rem;box-shadow:0 4px 14px rgba(22,163,74,0.4)">Escolher um Plano</a>
                <a href="#recursos" style="background:white;color:var(--text-dark);border:1px solid #d1d5db;padding:16px 32px;border-radius:30px;text-decoration:none;font-weight:600;font-size:1.1rem">Ver Funcionalidades</a>
            </div>
        </header>
    `;

    const featuresSection = `
        <section id="recursos" style="padding:80px 5%;background:white">
            <div style="text-align:center;margin-bottom:60px">
                <h2 style="font-size:2.5rem;font-weight:800;color:var(--text-dark);margin-bottom:16px">Tudo que você precisa para crescer</h2>
                <p style="font-size:1.1rem;color:var(--text-muted)">Feito sob medida para Consultoras que desejam profissionalizar suas carreiras.</p>
            </div>
            
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:30px;max-width:1100px;margin:0 auto">
                
                <div style="padding:40px;border-radius:16px;background:#f9fafb;border:1px solid #f3f4f6;text-align:center;transition:transform 0.3s">
                    <div style="font-size:3rem;margin-bottom:20px">🗂️</div>
                    <h3 style="font-size:1.3rem;font-weight:700;margin-bottom:12px;color:var(--text-dark)">Múltiplos Funis (Kanban)</h3>
                    <p style="color:var(--text-body);font-size:0.95rem;line-height:1.5">Separe seu funil de Vendas de Produtos do seu funil de Recrutamento de Líderes. Tudo visual e de arrastar-e-soltar.</p>
                </div>
                
                <div style="padding:40px;border-radius:16px;background:#f0fdf4;border:1px solid #dcfce7;text-align:center;transition:transform 0.3s">
                    <div style="font-size:3rem;margin-bottom:20px">📝</div>
                    <h3 style="font-size:1.3rem;font-weight:700;margin-bottom:12px;color:#166534">Anamnese Automática</h3>
                    <p style="color:#15803d;font-size:0.95rem;line-height:1.5">Envie um link para o cliente. Quando ele responder, sua ficha nasce sozinha no painel, pronta para ser recomendada um protocolo.</p>
                </div>

                <div style="padding:40px;border-radius:16px;background:#f9fafb;border:1px solid #f3f4f6;text-align:center;transition:transform 0.3s">
                    <div style="font-size:3rem;margin-bottom:20px">🛍️</div>
                    <h3 style="font-size:1.3rem;font-weight:700;margin-bottom:12px;color:var(--text-dark)">Classificação Rápida</h3>
                    <p style="color:var(--text-body);font-size:0.95rem;line-height:1.5">Diferencie facilmente Clientes Preferenciais de Consultoras com crachás visuais que te ajudam a ter mais foco nos fechamentos.</p>
                </div>
                
            </div>
        </section>
    `;

    const pricingSection = `
        <section id="planos" style="padding:100px 5%;background:var(--text-dark)">
            <div style="text-align:center;margin-bottom:60px">
                <h2 style="font-size:2.5rem;font-weight:800;color:white;margin-bottom:16px">Simples e com preço acessível</h2>
                <p style="font-size:1.1rem;color:rgba(255,255,255,0.7)">Escolha o modelo que combina com o tamanho da sua rede.</p>
            </div>
            
            <div style="display:flex;justify-content:center;gap:30px;max-width:900px;margin:0 auto;flex-wrap:wrap">
                ${planos.map((p, idx) => `
                    <div style="background:white;border-radius:24px;padding:40px;flex:1;min-width:300px;box-shadow:0 10px 25px rgba(0,0,0,0.2);position:relative;${idx === 1 ? 'transform:scale(1.05);border:2px solid var(--green-500);' : ''}">
                        ${idx === 1 ? `<div style="position:absolute;top:-15px;left:50%;transform:translateX(-50%);background:var(--green-500);color:white;padding:6px 16px;border-radius:20px;font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:1px">Mais Popular</div>` : ''}
                        <h3 style="font-size:1.5rem;font-weight:700;color:var(--text-dark);margin-bottom:12px">${p.nome}</h3>
                        <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:8px">
                            <span style="font-size:1.5rem;font-weight:600;color:var(--text-dark)">R$</span>
                            <span style="font-size:3.5rem;font-weight:800;color:var(--text-dark)">${p.preco_mensal.toFixed(2).replace('.', ',')}</span>
                            <span style="color:var(--text-muted)">/mês</span>
                        </div>
                        <ul style="list-style:none;padding:0;margin:30px 0;display:flex;flex-direction:column;gap:16px">
                            ${(p.descricoes || p.features || []).map(desc => `
                                <li style="display:flex;align-items:center;gap:12px;font-size:0.95rem;color:var(--text-body)">
                                    <span style="color:${idx === 1 ? 'var(--green-500)' : 'var(--text-muted)'};font-weight:800">✓</span> ${desc}
                                </li>
                            `).join('')}
                        </ul>
                        <button onclick="window.location.href='/#register?plano=${p.id}'" style="width:100%;background:${idx === 1 ? 'var(--green-600)' : '#f3f4f6'};color:${idx === 1 ? 'white' : 'var(--text-dark)'};border:none;padding:16px;border-radius:12px;font-weight:700;font-size:1.1rem;cursor:pointer;transition:background 0.2s">
                            Selecionar Plano
                        </button>
                    </div>
                `).join('')}
            </div>
            <div style="text-align:center;margin-top:40px;color:rgba(255,255,255,0.4);font-size:0.9rem">
                Assinatura Cancelável a qualquer momento. Você quem manda.
            </div>
        </section>
    `;

    const footer = `
        <footer style="padding:40px 5%;background:#111827;color:rgba(255,255,255,0.6);text-align:center;font-size:0.9rem">
            © ${new Date().getFullYear()} Gota Essencial. Todos os direitos reservados.
        </footer>
    `;

    // Renderização Final
    app.innerHTML = `
        <div style="font-family:'Inter', sans-serif;">
            ${navBar}
            ${heroSection}
            ${featuresSection}
            ${pricingSection}
            ${footer}
        </div>
    `;

    // Removendo listener residual do SPA default pra focar no css isolated
    return () => {
        app.className = '';
    };
}
