/*!
 * Gota App - Landing Page Oficial de Conversão SaaS (B2B focus)
 */

export async function renderLandingPage(router) {
    const app = document.getElementById('app');

    // Configurações de UI: Removendo o Layout Padrão do Admin
    app.className = 'landing-page-theme';
    document.body.style.background = '#fafafa';

    // Planos disponíveis (poderiam vir da API, mas fixos para performance de LP)
    let planos = [
        { id: 'basico', nome: 'Básico', preco_mensal: 47.90, descricoes: ['Página Pública Pessoal', 'Fichas de Anamnese ILIMITADAS', 'Painel de Acompanhamento (CRM)', 'Suporte por E-mail'] },
        { id: 'pro', nome: 'Gota PRO', preco_mensal: 97.90, descricoes: ['Tudo do plano Básico', 'Pipeline de Vendas Visuais', 'Pipeline de Formação de Equipe', 'Raio-X de Protocolos (Automático)', 'Integração Pixel/Meta Ads', 'Suporte Prioritário WhatsApp'] }
    ];

    const css = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;1,600&display=swap');
            .lp-body { font-family: 'Inter', sans-serif; background: #fafafa; color: #1e293b; line-height: 1.6; margin: 0; padding: 0; overflow-x: hidden; }
            .lp-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
            .lp-btn-primary { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 18px 36px; border-radius: 99px; text-decoration: none; font-weight: 700; font-size: 1.15rem; box-shadow: 0 10px 25px rgba(16,185,129,0.3); text-align: center; display: inline-flex; align-items:center; justify-content:center; gap: 8px; transition: all 0.3s; border:none; cursor:pointer; }
            .lp-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(16,185,129,0.4); color: white; }
            .lp-btn-outline { background: white; color: #0f172a; padding: 16px 36px; border: 1px solid #e2e8f0; border-radius: 99px; text-decoration: none; font-weight: 600; font-size: 1.1rem; text-align: center; display: inline-flex; align-items:center; justify-content:center; transition: all 0.3s; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
            .lp-btn-outline:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
            .lp-badge { display: inline-block; padding: 6px 14px; background: #ecfdf5; color: #10b981; font-size: 0.85rem; font-weight: 800; border-radius: 99px; margin-bottom: 24px; letter-spacing: 1px; text-transform: uppercase; border: 1px solid #d1fae5; }
            .lp-hero-heading { font-size: clamp(2.5rem, 5vw, 4.2rem); font-weight: 800; color: #0f172a; line-height: 1.1; margin-bottom: 24px; letter-spacing: -1px; }
            .lp-hero-sub { font-size: clamp(1.1rem, 2vw, 1.35rem); color: #475569; max-width: 700px; margin: 0 auto 40px auto; line-height: 1.6; }
            
            .highlight-text { background: linear-gradient(90deg, #10b981, #047857); -webkit-background-clip: text; color: transparent; }
            .lp-section { padding: 100px 0; }
            .lp-grid-2 { display: grid; grid-template-columns: 1fr; gap: 40px; align-items: center; }
            @media(min-width: 900px){ .lp-grid-2 { grid-template-columns: 1fr 1fr; gap: 80px; } }
            
            .feature-card { background: white; border-radius: 24px; padding: 40px; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; transition: transform 0.3s; }
            .feature-card:hover { transform: translateY(-5px); }
            .feature-icon { width: 64px; height: 64px; background: #f0fdf4; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin-bottom: 24px; color: #10b981; }
            
            .testimonial-card { background: white; padding: 40px; border-radius: 24px; box-shadow: 0 15px 35px -10px rgba(0,0,0,0.05); position: relative; }
            .testimonial-card::before { content: '"'; position: absolute; top: 20px; left: 30px; font-size: 6rem; font-family: 'Playfair Display', serif; color: #f1f5f9; line-height: 1; z-index: 0; }
            .testimonial-text { position: relative; z-index: 1; font-size: 1.15rem; color: #334155; font-style: italic; margin-bottom: 24px; line-height: 1.7; }
            
            nav { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); position: sticky; top: 0; z-index: 100; border-bottom: 1px solid #f1f5f9; }
            .lp-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
            .lp-logo-icon { width: 36px; height: 36px; background: #10b981; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; }
            .lp-logo-text { font-weight: 800; font-size: 1.2rem; color: #0f172a; letter-spacing: -0.5px; }
        </style>
    `;

    const navBar = `
        <nav>
            <div class="lp-container" style="width:100%; display:flex; justify-content:space-between; align-items:center; padding:0;">
                <a href="/" class="lp-logo">
                    <div class="lp-logo-icon">💧</div>
                    <span class="lp-logo-text">Gota Essencial</span>
                </a>
                <div style="display:flex; gap:16px; align-items:center;">
                    <a href="/login" style="color:#64748b; text-decoration:none; font-weight:600; font-size:0.95rem; display:none; @media(min-width:600px){display:block;}">Acessar Sistema</a>
                    <a href="#planos" style="background:#0f172a; color:white; padding:10px 24px; border-radius:99px; text-decoration:none; font-weight:700; font-size:0.95rem; transition:background 0.2s">Começar Agora</a>
                </div>
            </div>
        </nav>
    `;

    const heroSection = `
        <section style="padding: 120px 0 80px 0; text-align: center; background: radial-gradient(circle at top, #f0fdf4 0%, #fafafa 60%); overflow:hidden;">
            <div class="lp-container">
                <div class="lp-badge">O ÚNICO CRM PARA CONSULTORES DE BEM-ESTAR</div>
                <h1 class="lp-hero-heading">
                    Gestão de Relacionamento <br> para Consultores <span class="highlight-text">dōTERRA</span>
                </h1>
                <p class="lp-hero-sub">
                    Transforme conversas de WhatsApp em vendas reais e equipe engajada. O sistema inteligente que organiza seus leads, gera protocolos e escala seus resultados sem esforço.
                </p>
                <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; margin-bottom: 60px;">
                    <a href="#planos" class="lp-btn-primary">Ver Planos e Assinar ✨</a>
                    <a href="#solucao" class="lp-btn-outline">Como funciona?</a>
                </div>

                <div style="position:relative; max-width:1000px; margin:0 auto; border-radius:24px; box-shadow:0 30px 60px -15px rgba(0,0,0,0.15); border:1px solid #e2e8f0; background:white; overflow:hidden;">
                    <div style="height:40px; background:#f1f5f9; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; padding:0 20px; gap:8px;">
                        <div style="width:12px; height:12px; border-radius:50%; background:#ef4444;"></div>
                        <div style="width:12px; height:12px; border-radius:50%; background:#f59e0b;"></div>
                        <div style="width:12px; height:12px; border-radius:50%; background:#10b981;"></div>
                    </div>
                    <!-- Placeholder visual representativo do sistema -->
                    <div style="padding:40px; text-align:center; background:#f8fafc; height:400px; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                       <div style="font-size:4rem; margin-bottom:20px;">📊 ✨ 📱</div>
                       <h3 style="color:#64748b; font-weight:600; font-size:1.5rem;">Seu novo painel de controle</h3>
                    </div>
                </div>
            </div>
        </section>
    `;

    const problemSection = `
        <section id="solucao" class="lp-section" style="background: white;">
            <div class="lp-container lp-grid-2">
                <div>
                    <h2 style="font-size: clamp(2rem, 3vw, 2.5rem); font-weight: 800; color: #0f172a; margin-bottom: 24px; line-height:1.2;">
                        Você anota seus clientes em cadernos?
                    </h2>
                    <p style="font-size: 1.15rem; color: #475569; margin-bottom: 24px; line-height: 1.7;">
                        Você trabalha com algo incrível — óleos essenciais que transformam vidas. Mas ainda manda mensagens no WhatsApp sem saber se a pessoa já recebeu um protocolo. Não sabe quantas pessoas estão "quase prontas" para comprar.
                    </p>
                    <p style="font-size: 1.15rem; color: #475569; margin-bottom: 32px; line-height: 1.7; font-weight:600;">
                        Não é falta de esforço. <span style="color:#ef4444">É falta de estrutura.</span> E se existisse uma plataforma que organizasse tudo isso por você?
                    </p>
                    <a href="#funcionalidades" style="color: #10b981; font-weight: 700; text-decoration: none; font-size: 1.1rem; display:inline-flex; align-items:center; gap:8px;">
                        Conheça o Sistema Gota Essencial →
                    </a>
                </div>
                <div style="position:relative;">
                    <div style="background:#f0fdf4; border-radius:24px; padding:40px; position:relative; z-index:1;">
                        <div style="background:white; padding:20px; border-radius:16px; box-shadow:0 10px 25px rgba(0,0,0,0.05); margin-bottom:16px; border-left:4px solid #ef4444;">
                            <strong style="color:#0f172a;">Sem o Gota App:</strong> "Esqueci de mandar o PDF da Lavanda pra cliente de ontem..."
                        </div>
                        <div style="background:white; padding:20px; border-radius:16px; box-shadow:0 10px 25px rgba(0,0,0,0.05); border-left:4px solid #10b981;">
                            <strong style="color:#0f172a;">Com o Gota App:</strong> "Olá Maria! Vi que você finalizou sua Anamnese. Segue seu Protocolo focado em Saúde Emocional! 💧"
                        </div>
                    </div>
                    <div style="position:absolute; top:-20px; right:-20px; width:100px; height:100px; background:#d1fae5; border-radius:50%; z-index:0; filter:blur(40px);"></div>
                </div>
            </div>
        </section>
    `;

    const featuresSection = `
        <section id="funcionalidades" class="lp-section" style="background: #f8fafc; text-align:center;">
            <div class="lp-container">
                <div class="lp-badge">RECURSOS EXCLUSIVOS</div>
                <h2 style="font-size: clamp(2rem, 3vw, 2.5rem); font-weight: 800; color: #0f172a; margin-bottom: 60px;">Tudo que você precisa em um só lugar</h2>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; text-align:left;">
                    <div class="feature-card">
                        <div class="feature-icon">🌐</div>
                        <h3 style="font-size:1.3rem; font-weight:700; color:#0f172a; margin-bottom:16px;">Sua Página Pública</h3>
                        <p style="color:#64748b; font-size:1rem; line-height:1.6;">Exibe sua foto, bio, suas redes e botão para Anamnese. Um link elegante que gera confiança imediata antes mesmo da sua primeira palavra.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">📋</div>
                        <h3 style="font-size:1.3rem; font-weight:700; color:#0f172a; margin-bottom:16px;">Raio-X de Vendas</h3>
                        <p style="color:#64748b; font-size:1rem; line-height:1.6;">O sistema estuda as respostas do cliente na anamnese e monta um protocolo em PDF pronto! Você economiza horas de pesquisa e fecha mais rápido.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🎯</div>
                        <h3 style="font-size:1.3rem; font-weight:700; color:#0f172a; margin-bottom:16px;">Funis Separados</h3>
                        <p style="color:#64748b; font-size:1rem; line-height:1.6;">Pare de confundir cliente com candidata. Quem quer comprar vai para o funil de saúde, quem quer empreender vai para o funil de recrutamento.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🔥</div>
                        <h3 style="font-size:1.3rem; font-weight:700; color:#0f172a; margin-bottom:16px;">Tráfego & Pixel</h3>
                        <p style="color:#64748b; font-size:1rem; line-height:1.6;">Atraia mais leads configurando seu Pixel do Meta em minutos. O algoritmo aprende quem é seu cliente ideal e você joga o jogo profissional.</p>
                    </div>
                </div>
            </div>
        </section>
    `;

    const socialProofSection = `
        <section class="lp-section" style="background: white;">
            <div class="lp-container">
                <div style="text-align:center; margin-bottom: 60px;">
                    <h2 style="font-size: clamp(2rem, 3vw, 2.5rem); font-weight: 800; color: #0f172a;">O que as Grandes Líderes dizem</h2>
                </div>
                <div class="lp-grid-2">
                    <div class="testimonial-card">
                        <p class="testimonial-text">
                            "Aumentei meu faturamento em quase 30% no primeiro mês. Não porque trabalhei mais — mas porque parei de perder os leads que já tinham chegado até mim e eu não tinha conseguido acompanhar."
                        </p>
                        <div style="display:flex; align-items:center; gap:16px;">
                            <div style="width:50px; height:50px; border-radius:50%; background:#d1fae5; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">👩🏻</div>
                            <div>
                                <div style="font-weight:700; color:#0f172a;">Mariana Costa</div>
                                <div style="font-size:0.9rem; color:#64748b;">Consultora Elite</div>
                            </div>
                        </div>
                    </div>
                    <div class="testimonial-card">
                        <p class="testimonial-text">
                            "Eu nunca fui de tecnologia. Mas em uma semana eu já estava enviando meu link com minha foto pelo WhatsApp e recebendo anamneses. A diferença que fez na percepção das minhas clientes foi imediata."
                        </p>
                        <div style="display:flex; align-items:center; gap:16px;">
                            <div style="width:50px; height:50px; border-radius:50%; background:#fef3c7; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">👱🏼‍♀️</div>
                            <div>
                                <div style="font-weight:700; color:#0f172a;">Carla Silva</div>
                                <div style="font-size:0.9rem; color:#64748b;">Líder Silver</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;

    const pricingSection = `
        <section id="planos" class="lp-section" style="background: #0f172a; color:white;">
            <div class="lp-container">
                <div style="text-align:center; margin-bottom:60px;">
                    <div class="lp-badge" style="background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.2);">ESCOLHA SEU PLANO</div>
                    <h2 style="font-size: clamp(2.2rem, 3vw, 3rem); font-weight: 800; margin-bottom: 20px;">Invista no seu Crescimento</h2>
                    <p style="font-size:1.15rem; color:#94a3b8; max-width:600px; margin:0 auto;">Escale suas vendas e organize sua rede por menos do que você gasta em um café por semana.</p>
                </div>
                
                <div style="display:flex; justify-content:center; gap:30px; flex-wrap:wrap; max-width:900px; margin:0 auto; padding-top:20px;">
                    ${planos.map((p, idx) => `
                        <div style="background:white; border-radius:30px; padding:40px; flex:1; min-width:300px; color:#0f172a; position:relative; ${idx === 1 ? 'transform:scale(1.05); border:4px solid #10b981; box-shadow:0 30px 60px rgba(0,0,0,0.4);' : ''}">
                            ${idx === 1 ? `<div style="position:absolute; top:-18px; left:50%; transform:translateX(-50%); background:#10b981; color:white; padding:6px 20px; border-radius:99px; font-weight:800; font-size:0.85rem; letter-spacing:1px; white-space:nowrap;">MAIS ASSINADO ❤️</div>` : ''}
                            
                            <h3 style="font-size:1.6rem; font-weight:800; margin-bottom:16px;">${p.nome}</h3>
                            <div style="display:flex; align-items:flex-start; gap:4px; margin-bottom:32px;">
                                <span style="font-weight:700; font-size:1.2rem; color:#64748b; margin-top:8px;">R$</span>
                                <span style="font-size:3.5rem; font-weight:800; line-height:1;">${p.preco_mensal.toFixed(2).replace('.', ',')}</span>
                                <span style="font-weight:500; font-size:1.1rem; color:#64748b; align-self:flex-end; margin-bottom:8px;">/mês</span>
                            </div>
                            
                            <ul style="list-style:none; padding:0; margin:0 0 40px 0; display:flex; flex-direction:column; gap:16px;">
                                ${(p.descricoes || []).map(desc => `
                                    <li style="display:flex; align-items:flex-start; gap:12px; font-size:1.05rem; font-weight:500;">
                                        <div style="min-width:24px; height:24px; border-radius:50%; background:#ecfdf5; color:#10b981; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:800; margin-top:2px;">✓</div>
                                        <span>${desc}</span>
                                    </li>
                                `).join('')}
                            </ul>
                            
                            <button onclick="window.location.href='/#register?plano=${p.id}'" style="width:100%; border:none; padding:18px; border-radius:16px; font-weight:800; font-size:1.15rem; cursor:pointer; transition:all 0.3s; ${idx === 1 ? 'background:linear-gradient(135deg, #10b981, #059669); color:white; box-shadow:0 10px 20px rgba(16,185,129,0.3);' : 'background:#f1f5f9; color:#0f172a;'} " onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
                                Assinar Plano ${p.nome}
                            </button>
                            <div style="text-align:center; margin-top:16px; font-size:0.85rem; color:#64748b; font-weight:500;">Cancele quando quiser.</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
    `;

    const footer = `
        <footer style="padding: 60px 24px; background: #020617; color: rgba(255,255,255,0.4); text-align: center; font-size: 0.95rem;">
            <div class="lp-container">
                <div style="margin-bottom:24px; display:flex; justify-content:center; align-items:center; gap:8px;">
                    <div style="width:32px; height:32px; background:#10b981; border-radius:8px; display:flex; align-items:center; justify-content:center; color:white; font-size:1rem;">💧</div>
                    <span style="font-weight:700; color:white; font-size:1.2rem;">Gota Essencial</span>
                </div>
                <p style="margin-bottom:16px;">Sistema desenvolvido por e para Consultores dōTERRA independentes.</p>
                <p>© ${new Date().getFullYear()} Gota App CRM. Todos os direitos reservados.</p>
            </div>
        </footer>
    `;

    // Renderização Final
    app.innerHTML = `
        ${css}
        <div class="lp-body">
            ${navBar}
            ${heroSection}
            ${problemSection}
            ${featuresSection}
            ${socialProofSection}
            ${pricingSection}
            ${footer}
        </div>
    `;

    // Removendo listener residual do SPA default pra focar no css isolated
    return () => {
        app.className = '';
        document.body.style.background = '';
    };
}
