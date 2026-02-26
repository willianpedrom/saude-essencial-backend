import { api } from '../store.js';

export async function renderLandingPage(router) {
    const app = document.getElementById('app');

    // Try to load checkout_url from public settings
    let checkoutUrl = '#';
    try {
        const res = await api('GET', '/api/publico/settings');
        if (res.checkout_url) checkoutUrl = res.checkout_url;
    } catch { /* fallback */ }

    const registerUrl = '#/register';

    app.innerHTML = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; overflow-x: hidden; }
    
    .lp-btn {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 16px 36px; border-radius: 50px; font-weight: 700;
      font-size: 1rem; cursor: pointer; border: none;
      text-decoration: none; transition: all .2s;
    }
    .lp-btn:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.25); }
    .lp-btn-primary { background: linear-gradient(135deg,#16a34a,#15803d); color: white; }
    .lp-btn-white { background: white; color: #15803d; }
    .lp-btn-outline { background: transparent; color: white; border: 2px solid rgba(255,255,255,0.4); }
    .lp-btn-outline:hover { background: rgba(255,255,255,0.1); }
    .lp-btn-large { padding: 20px 48px; font-size: 1.1rem; }
    
    .lp-section { padding: 80px 24px; }
    .lp-container { max-width: 1100px; margin: 0 auto; }
    .lp-badge { 
      display: inline-block; background: rgba(255,255,255,0.15);
      color: rgba(255,255,255,0.9); font-size: 0.78rem; font-weight: 600;
      padding: 6px 18px; border-radius: 20px; letter-spacing: 1.5px;
      text-transform: uppercase; margin-bottom: 20px;
    }
    .lp-badge-green {
      background: #dcfce7; color: #166534; font-size: 0.75rem;
      font-weight: 600; padding: 5px 14px; border-radius: 20px;
      letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px;
      display: inline-block;
    }
    
    .lp-feature-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px; margin-top: 40px;
    }
    .lp-feature-card {
      background: white; border-radius: 20px; padding: 32px;
      box-shadow: 0 2px 24px rgba(0,0,0,0.06); transition: all .3s;
      border: 1px solid #f1f5f9;
    }
    .lp-feature-card:hover { transform: translateY(-6px); box-shadow: 0 12px 40px rgba(0,0,0,0.1); }
    .lp-feature-icon {
      width: 56px; height: 56px; border-radius: 16px; display: flex;
      align-items: center; justify-content: center; font-size: 1.5rem;
      margin-bottom: 18px;
    }
    
    .lp-pricing-card {
      background: white; border-radius: 24px; padding: 40px 32px;
      text-align: center; box-shadow: 0 4px 30px rgba(0,0,0,0.08);
      transition: all .3s; border: 2px solid transparent; position: relative;
    }
    .lp-pricing-card:hover { transform: translateY(-8px); }
    .lp-pricing-popular {
      border-color: #16a34a; box-shadow: 0 8px 40px rgba(22,163,74,0.2);
    }
    .lp-pricing-popular::before {
      content: '⭐ MAIS POPULAR';
      position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
      background: linear-gradient(135deg,#16a34a,#15803d); color: white;
      padding: 4px 20px; border-radius: 20px; font-size: 0.72rem;
      font-weight: 700; letter-spacing: 1px;
    }
    
    .lp-testimonial-card {
      background: white; border-radius: 16px; padding: 28px;
      box-shadow: 0 2px 20px rgba(0,0,0,0.06);
    }
    
    .lp-faq-item {
      background: white; border-radius: 14px; margin-bottom: 12px;
      box-shadow: 0 1px 8px rgba(0,0,0,0.04); overflow: hidden;
    }
    .lp-faq-q {
      padding: 18px 24px; font-weight: 600; cursor: pointer;
      display: flex; justify-content: space-between; align-items: center;
      transition: background .2s;
    }
    .lp-faq-q:hover { background: #f9fafb; }
    .lp-faq-a {
      padding: 0 24px 18px; color: #6b7280; line-height: 1.7;
      display: none; font-size: 0.92rem;
    }
    .lp-faq-item.open .lp-faq-a { display: block; }
    .lp-faq-item.open .faq-arrow { transform: rotate(180deg); }
    
    @keyframes float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-10px) } }
    @keyframes fadeUp { from { opacity:0;transform:translateY(30px) } to { opacity:1;transform:none } }
    .lp-float { animation: float 4s ease-in-out infinite; }
    .lp-fade { animation: fadeUp .6s ease both; }
    
    @media (max-width: 768px) {
      .lp-hero-grid { grid-template-columns: 1fr !important; text-align: center; }
      .lp-hero-visual { display: none; }
      .lp-pricing-grid { grid-template-columns: 1fr !important; }
      .lp-feature-grid { grid-template-columns: 1fr !important; }
    }
  </style>

  <!-- ═══════════════ NAVBAR ═══════════════ -->
  <nav style="position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(10,40,24,0.95);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.1)">
    <div style="max-width:1100px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="font-size:1.6rem">💧</div>
        <span style="font-family:'Playfair Display',serif;color:white;font-size:1.2rem;font-weight:700">Gota Essencial</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <a href="#/login" class="lp-btn lp-btn-outline" style="padding:10px 24px;font-size:0.85rem">Entrar</a>
        <a href="${checkoutUrl !== '#' ? checkoutUrl : registerUrl}" target="${checkoutUrl !== '#' ? '_blank' : '_self'}" class="lp-btn lp-btn-primary" style="padding:10px 24px;font-size:0.85rem">Começar Agora</a>
      </div>
    </div>
  </nav>

  <!-- ═══════════════ HERO ═══════════════ -->
  <section style="background:linear-gradient(160deg,#071a0f 0%,#0a2818 30%,#1a4527 70%,#134020 100%);padding:130px 24px 80px;position:relative;overflow:hidden">
    <div style="position:absolute;top:20%;right:-100px;width:500px;height:500px;background:radial-gradient(circle,rgba(22,163,74,0.15),transparent 70%);border-radius:50%"></div>
    <div style="position:absolute;bottom:-80px;left:-60px;width:350px;height:350px;background:radial-gradient(circle,rgba(22,163,74,0.1),transparent 70%);border-radius:50%"></div>

    <div class="lp-container lp-hero-grid" style="display:grid;grid-template-columns:1.1fr 0.9fr;align-items:center;gap:60px">
      <div class="lp-fade">
        <div class="lp-badge">🌿 O CRM feito para Consultoras de Bem-Estar</div>
        <h1 style="font-family:'Playfair Display',serif;color:white;font-size:clamp(2.2rem,5vw,3.4rem);line-height:1.15;margin-bottom:20px">
          Transforme sua consultoria em um <span style="color:#4ade80">negócio profissional</span>
        </h1>
        <p style="color:rgba(255,255,255,0.7);font-size:1.1rem;line-height:1.8;margin-bottom:36px;max-width:520px">
          Gerencie clientes, crie anamneses inteligentes, gere protocolos personalizados com óleos essenciais e aumente suas vendas — tudo em uma plataforma simples e poderosa.
        </p>
        <div style="display:flex;gap:14px;flex-wrap:wrap">
          <a href="${checkoutUrl !== '#' ? checkoutUrl : registerUrl}" target="${checkoutUrl !== '#' ? '_blank' : '_self'}" class="lp-btn lp-btn-primary lp-btn-large">
            🚀 Começar Gratuitamente
          </a>
          <a href="#features" class="lp-btn lp-btn-outline" style="padding:20px 36px;font-size:1rem">
            Ver Funcionalidades
          </a>
        </div>
        <div style="margin-top:28px;display:flex;gap:28px;flex-wrap:wrap">
          <div style="color:rgba(255,255,255,0.5);font-size:0.82rem">✅ 14 dias grátis</div>
          <div style="color:rgba(255,255,255,0.5);font-size:0.82rem">✅ Sem cartão de crédito</div>
          <div style="color:rgba(255,255,255,0.5);font-size:0.82rem">✅ Cancele quando quiser</div>
        </div>
      </div>
      <div class="lp-hero-visual lp-fade" style="animation-delay:.2s">
        <div class="lp-float" style="background:linear-gradient(145deg,#1e3a2f,#2d5a3f);border-radius:24px;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
            <div style="width:12px;height:12px;border-radius:50%;background:#ff5f57"></div>
            <div style="width:12px;height:12px;border-radius:50%;background:#febc2e"></div>
            <div style="width:12px;height:12px;border-radius:50%;background:#28c840"></div>
            <span style="color:rgba(255,255,255,0.4);font-size:0.75rem;margin-left:auto">Dashboard</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:16px">
              <div style="font-size:1.6rem;margin-bottom:4px">👥</div>
              <div style="color:#4ade80;font-size:1.4rem;font-weight:800">127</div>
              <div style="color:rgba(255,255,255,0.5);font-size:0.72rem">Clientes</div>
            </div>
            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:16px">
              <div style="font-size:1.6rem;margin-bottom:4px">📋</div>
              <div style="color:#60a5fa;font-size:1.4rem;font-weight:800">89</div>
              <div style="color:rgba(255,255,255,0.5);font-size:0.72rem">Anamneses</div>
            </div>
            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:16px">
              <div style="font-size:1.6rem;margin-bottom:4px">🌿</div>
              <div style="color:#fbbf24;font-size:1.4rem;font-weight:800">54</div>
              <div style="color:rgba(255,255,255,0.5);font-size:0.72rem">Protocolos</div>
            </div>
            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:16px">
              <div style="font-size:1.6rem;margin-bottom:4px">⭐</div>
              <div style="color:#f472b6;font-size:1.4rem;font-weight:800">9.4</div>
              <div style="color:rgba(255,255,255,0.5);font-size:0.72rem">NPS Médio</div>
            </div>
          </div>
          <div style="background:rgba(74,222,128,0.1);border-radius:12px;padding:14px;display:flex;align-items:center;gap:10px">
            <div style="font-size:1.2rem">📈</div>
            <div>
              <div style="color:#4ade80;font-size:0.82rem;font-weight:600">+23% novos clientes este mês</div>
              <div style="color:rgba(255,255,255,0.4);font-size:0.7rem">Relatório automático</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════ SOCIAL PROOF BAR ═══════════════ -->
  <section style="background:#f0fdf4;padding:20px 24px">
    <div class="lp-container" style="display:flex;justify-content:center;gap:40px;flex-wrap:wrap;align-items:center">
      <div style="text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:#0a2818">500+</div>
        <div style="color:#6b7280;font-size:0.8rem">Consultoras ativas</div>
      </div>
      <div style="width:1px;height:32px;background:#d1d5db"></div>
      <div style="text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:#0a2818">12.000+</div>
        <div style="color:#6b7280;font-size:0.8rem">Anamneses preenchidas</div>
      </div>
      <div style="width:1px;height:32px;background:#d1d5db"></div>
      <div style="text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:#0a2818">8.000+</div>
        <div style="color:#6b7280;font-size:0.8rem">Protocolos gerados</div>
      </div>
      <div style="width:1px;height:32px;background:#d1d5db"></div>
      <div style="text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:#0a2818">⭐ 4.9</div>
        <div style="color:#6b7280;font-size:0.8rem">Avaliação média</div>
      </div>
    </div>
  </section>

  <!-- ═══════════════ FEATURES ═══════════════ -->
  <section class="lp-section" id="features" style="background:white">
    <div class="lp-container">
      <div style="text-align:center">
        <div class="lp-badge-green">FUNCIONALIDADES</div>
        <h2 style="font-family:'Playfair Display',serif;font-size:clamp(1.8rem,4vw,2.6rem);color:#0a2818;margin-bottom:12px">Tudo que você precisa em <span style="color:#16a34a">um só lugar</span></h2>
        <p style="color:#6b7280;max-width:600px;margin:0 auto;line-height:1.7">Pare de usar planilhas, WhatsApp e cadernos separados. A Gota Essencial centraliza toda sua consultoria.</p>
      </div>

      <div class="lp-feature-grid">
        ${[
            { icon: '📋', bg: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', title: 'Anamnese Inteligente', desc: 'Formulário completo com 9 seções: saúde geral, emocional, hormonal, digestiva, sono e mais. Seus clientes preenchem pelo link e você recebe tudo organizado.' },
            { icon: '🌿', bg: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', title: 'Protocolos Automáticos', desc: 'Com base na anamnese, o sistema sugere protocolos personalizados com óleos essenciais, modo de uso e afirmações — prontos para enviar ao cliente.' },
            { icon: '👥', bg: 'linear-gradient(135deg,#fef9c3,#fde68a)', title: 'Gestão de Clientes', desc: 'Cadastro completo, pipeline de vendas com Kanban, etiquetas coloridas, histórico de anamneses e agendamentos — tudo por cliente.' },
            { icon: '📊', bg: 'linear-gradient(135deg,#fce7f3,#fbcfe8)', title: 'Dashboard Profissional', desc: 'Veja métricas em tempo real: clientes novos, anamneses preenchidas, agendamentos do dia, taxa de conversão e muito mais.' },
            { icon: '🌐', bg: 'linear-gradient(135deg,#e0f2fe,#bae6fd)', title: 'Página Pública', desc: 'Cada consultora ganha uma página pública personalizada com foto, bio, depoimentos e botão de WhatsApp — perfeita para captar clientes.' },
            { icon: '⭐', bg: 'linear-gradient(135deg,#fef3c7,#fde68a)', title: 'Depoimentos', desc: 'Link público para clientes enviarem depoimentos. Gerencie aprovações e exiba na sua página pública como prova social.' },
            { icon: '📅', bg: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', title: 'Agendamentos', desc: 'Controle suas consultas, retornos e follow-ups. Organização completa com status e notas por agendamento.' },
            { icon: '📈', bg: 'linear-gradient(135deg,#dcfce7,#a7f3d0)', title: 'Integrações & Rastreamento', desc: 'Meta Pixel, Google Analytics, Clarity, GTM e API de Conversões (CAPI). Acompanhe cada lead do início ao fim.' },
            { icon: '🔗', bg: 'linear-gradient(135deg,#fff7ed,#fed7aa)', title: 'Links Inteligentes', desc: 'Gere links personalizados para anamneses com nomes amigáveis. Compartilhe por WhatsApp, Instagram e redes sociais.' },
        ].map(f => `
          <div class="lp-feature-card">
            <div class="lp-feature-icon" style="background:${f.bg}">${f.icon}</div>
            <h3 style="font-size:1.1rem;margin-bottom:8px;color:#0a2818">${f.title}</h3>
            <p style="color:#6b7280;font-size:0.88rem;line-height:1.7">${f.desc}</p>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- ═══════════════ HOW IT WORKS ═══════════════ -->
  <section class="lp-section" style="background:#f9fafb">
    <div class="lp-container">
      <div style="text-align:center">
        <div class="lp-badge-green">COMO FUNCIONA</div>
        <h2 style="font-family:'Playfair Display',serif;font-size:clamp(1.8rem,4vw,2.4rem);color:#0a2818;margin-bottom:40px">Simples como <span style="color:#16a34a">1, 2, 3</span></h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:32px;max-width:900px;margin:0 auto">
        ${[
            { step: '1', icon: '📝', title: 'Cadastre-se gratuitamente', desc: 'Crie sua conta em 30 segundos e ganhe 14 dias grátis com todas as funcionalidades.' },
            { step: '2', icon: '📋', title: 'Envie a anamnese', desc: 'Compartilhe o link da anamnese com seu cliente via WhatsApp. Ele preenche pelo celular.' },
            { step: '3', icon: '🌿', title: 'Entregue o protocolo', desc: 'O sistema gera o protocolo personalizado. Envie ao cliente e encante com profissionalismo.' },
        ].map(s => `
          <div style="text-align:center;padding:20px">
            <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#16a34a,#15803d);color:white;font-size:1.5rem;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">${s.step}</div>
            <div style="font-size:2rem;margin-bottom:12px">${s.icon}</div>
            <h3 style="font-size:1.05rem;margin-bottom:8px;color:#0a2818">${s.title}</h3>
            <p style="color:#6b7280;font-size:0.88rem;line-height:1.7">${s.desc}</p>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- ═══════════════ PRICING ═══════════════ -->
  <section class="lp-section" id="pricing" style="background:white">
    <div class="lp-container">
      <div style="text-align:center">
        <div class="lp-badge-green">PLANOS</div>
        <h2 style="font-family:'Playfair Display',serif;font-size:clamp(1.8rem,4vw,2.4rem);color:#0a2818;margin-bottom:12px">Invista no <span style="color:#16a34a">crescimento</span> da sua consultoria</h2>
        <p style="color:#6b7280;margin-bottom:40px">Comece com 14 dias grátis. Escolha o plano ideal para o seu momento.</p>
      </div>

      <div class="lp-pricing-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:950px;margin:0 auto">
        <!-- Starter -->
        <div class="lp-pricing-card">
          <div style="font-size:2rem;margin-bottom:8px">🌱</div>
          <h3 style="font-size:1.2rem;margin-bottom:12px;color:#0a2818">Starter</h3>
          <div style="margin-bottom:20px">
            <span style="font-size:2.4rem;font-weight:800;color:#0a2818">R$ 49</span>
            <span style="color:#6b7280;font-size:0.9rem">/mês</span>
          </div>
          <div style="text-align:left;margin-bottom:28px">
            ${['Até 30 clientes', '5 anamneses/mês', 'Protocolos automáticos', 'Dashboard básico', 'Página pública', 'Suporte por email'].map(f =>
            `<div style="padding:8px 0;font-size:0.88rem;color:#374151;border-bottom:1px solid #f3f4f6">✅ ${f}</div>`).join('')}
          </div>
          <a href="${checkoutUrl !== '#' ? checkoutUrl : registerUrl}" target="${checkoutUrl !== '#' ? '_blank' : '_self'}" class="lp-btn lp-btn-primary" style="width:100%;justify-content:center">Começar Grátis</a>
        </div>

        <!-- Pro -->
        <div class="lp-pricing-card lp-pricing-popular">
          <div style="font-size:2rem;margin-bottom:8px">🚀</div>
          <h3 style="font-size:1.2rem;margin-bottom:12px;color:#0a2818">Pro</h3>
          <div style="margin-bottom:20px">
            <span style="font-size:2.4rem;font-weight:800;color:#16a34a">R$ 97</span>
            <span style="color:#6b7280;font-size:0.9rem">/mês</span>
          </div>
          <div style="text-align:left;margin-bottom:28px">
            ${['Clientes ilimitados', 'Anamneses ilimitadas', 'Protocolos automáticos', 'Dashboard completo', 'Página pública + depoimentos', 'Integrações (Pixel, GA4, Clarity)', 'Pipeline de vendas (Kanban)', 'Links personalizados', 'Suporte prioritário'].map(f =>
                `<div style="padding:8px 0;font-size:0.88rem;color:#374151;border-bottom:1px solid #f3f4f6">✅ ${f}</div>`).join('')}
          </div>
          <a href="${checkoutUrl !== '#' ? checkoutUrl : registerUrl}" target="${checkoutUrl !== '#' ? '_blank' : '_self'}" class="lp-btn lp-btn-primary" style="width:100%;justify-content:center">Começar Grátis</a>
        </div>

        <!-- Enterprise -->
        <div class="lp-pricing-card">
          <div style="font-size:2rem;margin-bottom:8px">👑</div>
          <h3 style="font-size:1.2rem;margin-bottom:12px;color:#0a2818">Enterprise</h3>
          <div style="margin-bottom:20px">
            <span style="font-size:2.4rem;font-weight:800;color:#0a2818">R$ 197</span>
            <span style="color:#6b7280;font-size:0.9rem">/mês</span>
          </div>
          <div style="text-align:left;margin-bottom:28px">
            ${['Tudo do Pro +', 'Multi-consultoras (equipe)', 'Relatórios avançados', 'API de Conversões (CAPI)', 'Customização avançada', 'Treinamento online incluído', 'Suporte WhatsApp dedicado'].map(f =>
                    `<div style="padding:8px 0;font-size:0.88rem;color:#374151;border-bottom:1px solid #f3f4f6">✅ ${f}</div>`).join('')}
          </div>
          <a href="${checkoutUrl !== '#' ? checkoutUrl : registerUrl}" target="${checkoutUrl !== '#' ? '_blank' : '_self'}" class="lp-btn lp-btn-primary" style="width:100%;justify-content:center">Falar com Consultor</a>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══════════════ TESTIMONIALS ═══════════════ -->
  <section class="lp-section" style="background:#f0fdf4">
    <div class="lp-container">
      <div style="text-align:center">
        <div class="lp-badge-green">DEPOIMENTOS</div>
        <h2 style="font-family:'Playfair Display',serif;font-size:clamp(1.8rem,4vw,2.4rem);color:#0a2818;margin-bottom:40px">O que dizem nossas <span style="color:#16a34a">consultoras</span></h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px">
        ${[
            { name: 'Maria Fernanda', role: 'Consultora Gold', text: 'Antes eu perdia horas fazendo anamneses à mão. Com a Gota Essencial, meus clientes preenchem online e recebo tudo organizado. Minha produtividade triplicou!' },
            { name: 'Ana Paula', role: 'Consultora Platinum', text: 'A página pública com depoimentos mudou meu negócio. Meus clientes compartilham e eu recebo leads qualificados todos os dias. Recomendo demais!' },
            { name: 'Juliana Santos', role: 'Consultora Silver', text: 'Os protocolos automatizados são incríveis! Meus clientes ficam impressionados com a personalização. É como ter uma assistente 24h por dia.' },
        ].map(t => `
          <div class="lp-testimonial-card">
            <div style="color:#fbbf24;margin-bottom:12px;font-size:1rem">★★★★★</div>
            <p style="color:#374151;font-size:0.92rem;line-height:1.7;margin-bottom:16px">"${t.text}"</p>
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#2d4a28,#4a7c40);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.85rem">${t.name.split(' ').map(w => w[0]).join('')}</div>
              <div>
                <div style="font-weight:600;font-size:0.88rem;color:#0a2818">${t.name}</div>
                <div style="font-size:0.78rem;color:#16a34a">${t.role}</div>
              </div>
            </div>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- ═══════════════ FAQ ═══════════════ -->
  <section class="lp-section" style="background:white">
    <div class="lp-container" style="max-width:750px">
      <div style="text-align:center;margin-bottom:40px">
        <div class="lp-badge-green">PERGUNTAS FREQUENTES</div>
        <h2 style="font-family:'Playfair Display',serif;font-size:clamp(1.6rem,4vw,2.2rem);color:#0a2818">Tire suas dúvidas</h2>
      </div>

      ${[
            { q: 'Preciso de cartão de crédito para testar?', a: 'Não! Você começa com 14 dias grátis e sem cartão. Ao final do período, escolhe o plano ideal.' },
            { q: 'Funciona no celular?', a: 'Sim! Todo o sistema é responsivo. Seus clientes preenchem anamneses pelo celular e você gerencia de qualquer dispositivo.' },
            { q: 'Meus dados são seguros?', a: 'Totalmente. Usamos criptografia de ponta a ponta, servidor seguro e cada consultora tem seus dados isolados e privados.' },
            { q: 'Posso cancelar a qualquer momento?', a: 'Sim, sem multa e sem burocracia. Cancele pelo próprio painel quando quiser.' },
            { q: 'Preciso entender de tecnologia?', a: 'De jeito nenhum! O sistema é intuitivo e amigável. Se usa WhatsApp, consegue usar a Gota Essencial.' },
            { q: 'Posso usar com minha equipe?', a: 'No plano Enterprise, sim! Você pode adicionar consultoras da sua equipe, cada uma com seu login e dados isolados.' },
        ].map(f => `
        <div class="lp-faq-item">
          <div class="lp-faq-q">${f.q}<span class="faq-arrow" style="transition:transform .3s;font-size:0.8rem">▼</span></div>
          <div class="lp-faq-a">${f.a}</div>
        </div>`).join('')}
    </div>
  </section>

  <!-- ═══════════════ FINAL CTA ═══════════════ -->
  <section style="background:linear-gradient(135deg,#0a2818,#1a4527);padding:100px 24px;text-align:center;position:relative;overflow:hidden">
    <div style="position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:800px;height:600px;background:radial-gradient(circle,rgba(74,222,128,0.1),transparent 70%);border-radius:50%"></div>
    <div class="lp-container" style="position:relative">
      <div style="font-size:3.5rem;margin-bottom:20px">💧</div>
      <h2 style="font-family:'Playfair Display',serif;color:white;font-size:clamp(2rem,5vw,3rem);margin-bottom:16px">Pronta para transformar sua consultoria?</h2>
      <p style="color:rgba(255,255,255,0.7);max-width:520px;margin:0 auto 40px;font-size:1.05rem;line-height:1.8">Junte-se a centenas de consultoras que já profissionalizaram seus negócios com a Gota Essencial.</p>
      <a href="${checkoutUrl !== '#' ? checkoutUrl : registerUrl}" target="${checkoutUrl !== '#' ? '_blank' : '_self'}" class="lp-btn lp-btn-primary lp-btn-large" style="font-size:1.15rem">
        🚀 Começar Meus 14 Dias Grátis
      </a>
      <div style="margin-top:20px;color:rgba(255,255,255,0.4);font-size:0.85rem">Sem cartão de crédito • Cancele quando quiser</div>
    </div>
  </section>

  <!-- ═══════════════ FOOTER ═══════════════ -->
  <footer style="background:#071a0f;padding:32px 24px;text-align:center">
    <div style="display:flex;justify-content:center;gap:24px;margin-bottom:16px;flex-wrap:wrap">
      <a href="#features" style="color:rgba(255,255,255,0.5);text-decoration:none;font-size:0.85rem">Funcionalidades</a>
      <a href="#pricing" style="color:rgba(255,255,255,0.5);text-decoration:none;font-size:0.85rem">Planos</a>
      <a href="#/login" style="color:rgba(255,255,255,0.5);text-decoration:none;font-size:0.85rem">Entrar</a>
    </div>
    <p style="color:rgba(255,255,255,0.25);font-size:0.78rem">© ${new Date().getFullYear()} Gota Essencial · Todos os direitos reservados</p>
  </footer>`;

    // FAQ toggle
    document.querySelectorAll('.lp-faq-item').forEach(item => {
        item.querySelector('.lp-faq-q').addEventListener('click', () => {
            item.classList.toggle('open');
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#features"], a[href^="#pricing"]').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const id = a.getAttribute('href').replace('#', '');
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        });
    });
}
