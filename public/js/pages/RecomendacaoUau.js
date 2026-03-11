import { getConsultantTitle } from '../utils.js';

export function renderRecomendacaoUau(router) {
    const app = document.getElementById('app');

    // 1. Carregar payload salvo
    const rawPayload = sessionStorage.getItem('tempAnamnesisPayload');
    if (!rawPayload) {
        app.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;text-align:center;padding:20px;">
        <div style="font-size:3rem;margin-bottom:16px;">😕</div>
        <h2 style="color:#2d5016;margin-bottom:8px">Sessão Expirada</h2>
        <p style="color:#666">Os dados da sua avaliação não foram encontrados.</p>
      </div>`;
        return;
    }

    const payload = JSON.parse(rawPayload);
    const answers = payload.answers || {};
    const consultant = payload.consultant || {};
    const clientName = payload.clientName || 'Especial';
    const linkAfiliada = consultant.link_afiliada || '';

    // Engine de Texto Empático 
    let reportedIssues = [];
    ['general_symptoms', 'emotional_symptoms', 'sleep_symptoms', 'digestive_symptoms', 'goals'].forEach(k => {
        if(answers[k] && Array.isArray(answers[k])) reportedIssues.push(...answers[k]);
        else if (answers[k]) reportedIssues.push(answers[k]);
    });
    // Pega as 3 principais queixas e formata bonito
    const topIssues = reportedIssues.filter(i => i.length > 3).slice(0,3).map(i => i.toLowerCase());
    
    let painAcknowledgeText = topIssues.length > 0 
      ? `Você nos relatou nas etapas anteriores que tem buscado ajuda para lidar com: <b>${topIssues.join(', ').replace(/, ([^,]*)$/, ' e $1')}</b>.`
      : `Analisamos detalhadamente as respostas que você forneceu nas etapas anteriores sobre sua saúde e bem-estar.`;

    // 2. Simplificação do Matching
    const allSymptomsText = reportedIssues.join(' ').toLowerCase();

    const recommendationScores = {
        'Lavanda': { score: 0, reason: 'O calmante biológico perfeito. Age no sistema límbico em segundos para desligar a ansiedade crônica e induzir sono reparador profundo.', image: 'https://images.unsplash.com/photo-1595855767554-469bfd2b0e6e?w=400&q=80', color: '#8b5cf6' },
        'Peppermint': { score: 0, reason: 'Seu botão de "Ligar" imediato. Oxigena o cérebro, derrete dores de cabeça tensionais e destrói a fadiga mental.', image: 'https://images.unsplash.com/photo-1628173426856-78b174411130?w=400&q=80', color: '#10b981' },
        'Lemon Siciliano': { score: 0, reason: 'Detergente orgânico para o corpo. Faz varredura de toxinas, desincha e eleva instantaneamente o humor.', image: 'https://images.unsplash.com/photo-1582293041079-7814c27a2bb5?w=400&q=80', color: '#eab308' },
        'ZenGest': { score: 0, reason: 'A salvação do estômago pesado. Erradica azia, inchaço e normaliza o trânsito intestinal doloroso.', image: 'https://images.unsplash.com/photo-1625944229641-fcb7a4242682?w=400&q=80', color: '#059669' },
        'On Guard': { score: 0, reason: 'Um escudo impenetrável. Força máxima contra ameaças imunológicas e suporte implacável para gripes repetitivas.', image: 'https://images.unsplash.com/photo-1615486511484-92e172a514d3?w=400&q=80', color: '#d97706' },
        'Deep Blue': { score: 0, reason: 'Apaga a inflamação nas articulações e solta cadeias musculares travadas pelo estresse e tensões físicas.', image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&q=80', color: '#3b82f6' },
        'Balance': { score: 0, reason: 'Aterramento psicológico em gotas. Traz a mente do futuro angustiante direto para o momento presente com total estabilidade.', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80', color: '#0d9488' },
        'Breathe': { score: 0, reason: 'Expansor pulmonar revolucionário. Quebra a congestão nasal e permite respirações completas, profundas e silenciosas.', image: 'https://images.unsplash.com/photo-1515377651080-692556b68ba2?w=400&q=80', color: '#0ea5e9' },
        'Copaíba': { score: 0, reason: 'O anti-inflamatório mestre da floresta. Comunica-se com seu sistema endocanabinóide para zerar dores internas crônicas.', image: 'https://images.unsplash.com/photo-1596484552467-3e1b12b5087e?w=400&q=80', color: '#8dc63f' },
    };

    const keywords = {
        'Lavanda': ['ansiedade', 'estresse', 'insônia', 'sono', 'dormir', 'burnout', 'pânico', 'irritabilidade', 'tensão', 'angústia'],
        'Peppermint': ['dor de cabeça', 'enxaqueca', 'energia', 'cansaço', 'fadiga', 'foco', 'concentração', 'desânimo', 'confusão mental'],
        'Lemon Siciliano': ['detox', 'fígado', 'peso', 'emagrecer', 'digestão', 'azia'],
        'ZenGest': ['digestão', 'refluxo', 'azia', 'inchaço', 'gases', 'constipação', 'intestino', 'náusea'],
        'On Guard': ['imunidade', 'gripe', 'infecção', 'rinicoriza', 'prevenir', 'saúde para a família'],
        'Deep Blue': ['dor', 'dores musculares', 'articulação', 'costas', 'tensões', 'fibromialgia', 'artrite'],
        'Balance': ['pânico', 'ansiedade', 'tpm', 'irritabilidade', 'equilíbrio', 'emocional', 'tristeza', 'depressão'],
        'Breathe': ['falta de ar', 'sinusite', 'rinite', 'asma', 'respirar', 'ronco', 'alergia', 'pulmão'],
        'Copaíba': ['dor crônica', 'inflamação', 'ansiedade', 'endometriose', 'autoimune', 'fibromialgia'],
    };

    Object.keys(keywords).forEach(oil => {
        keywords[oil].forEach(kw => {
            if (allSymptomsText.includes(kw)) {
                recommendationScores[oil].score += 1.5;
            }
        });
    });

    if (Object.values(recommendationScores).every(o => o.score === 0)) {
        recommendationScores['Lavanda'].score = 3;
        recommendationScores['Lemon Siciliano'].score = 2;
        recommendationScores['Peppermint'].score = 1;
    }

    const topOils = Object.entries(recommendationScores)
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 3)
        .map(([name, data]) => ({ name, ...data }));


    // 3. UI Generator (Venda Agressiva + Premium)
    let renderedOils = topOils.map((oil, i) => `
      <div style="background: white; border-radius: 16px; margin-bottom: 16px; display:flex; gap: 16px; align-items: stretch; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #f8fafc; position:relative;">
        <div style="position:absolute; top:8px; left:8px; background: rgba(0,0,0,0.6); color:white; font-size:0.7rem; font-weight:700; padding:2px 6px; border-radius:4px; z-index:10; text-transform:uppercase;">Etapa 0${i+1}</div>
        <div style="width: 100px; background: url('${oil.image}') center/cover; position:relative;">
           <div style="position:absolute; inset:0; background: linear-gradient(to right, transparent, rgba(255,255,255,1));"></div>
        </div>
        <div style="padding: 16px 16px 16px 0; flex:1;">
          <h4 style="margin: 0 0 6px 0; color: #1e293b; font-size: 1.2rem; display:flex; align-items:center; gap:6px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${oil.color};"></span>
            ${oil.name}
          </h4>
          <p style="margin: 0; font-size: 0.9rem; color: #475569; line-height: 1.5;">${oil.reason}</p>
        </div>
      </div>
    `).join('');

    const topOilsNames = topOils.map(o => o.name).join(', ');
    const phone = (consultant.phone || '').replace(/\\D/g, '') || '5511999999999';
    const waText = encodeURIComponent(`Olá ${consultant.name}! 💧\nFoi me recomendado pelo seu sistema o Kit UAU contendo: *${topOilsNames}*.\n\nGostaria de garantir esses óleos com desconto antes que a oferta expire. Como efetuamos o pedido?`);
    
    // Configura botões dinâmicos dependendo se existe Link de afiliada
    const primaryButtonHtml = linkAfiliada 
        ? `<a href="${linkAfiliada}" target="_blank" onclick="alert('Lembre-se: Adicione os seguintes óleos no carrinho: ${topOilsNames} e finalize sua compra com desconto!');" class="btn-buy-primary" style="margin-bottom: 12px;">🛒 Fazer Meu Pedido (25% OFF)</a>
           <a href="https://wa.me/${phone}?text=${waText}" target="_blank" class="btn-buy-secondary">💬 Tenho dúvidas, chamar no WhatsApp</a>`
        : `<a href="https://wa.me/${phone}?text=${waText}" target="_blank" class="btn-buy-primary">📲 Quero Minha Rotina Pelo WhatsApp</a>`;

    const next24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const expireTimeStr = next24Hours.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

    app.innerHTML = `
      <style>
         body { background: #fafafa; font-family: 'Inter', sans-serif; }
         .fade-in { animation: fadeIn 0.8s ease forwards; opacity: 0; }
         @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
         
         .scarcity-bar { background: #ef4444; color: white; text-align: center; padding: 10px; font-weight: 700; font-size: 0.85rem; letter-spacing: 0.5px; position: sticky; top:0; z-index: 999; box-shadow: 0 2px 10px rgba(239, 68, 68, 0.4);}
         .highlight-text { background: linear-gradient(90deg, #15803d, #16a34a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; }
         
         .btn-buy-primary { background: linear-gradient(135deg, #0f172a, #334155); color: white; border: none; padding: 18px 24px; border-radius: 50px; font-weight: 800; font-size: 1.15rem; width: 100%; box-shadow: 0 8px 25px rgba(15, 23, 42, 0.25); cursor: pointer; transition: all 0.3s ease; text-decoration: none; display: flex; justify-content: center; align-items: center; gap: 8px;}
         .btn-buy-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(15, 23, 42, 0.35); color: #fff; }
         
         .btn-buy-secondary { background: white; color: #166534; border: 2px solid #bbf7d0; padding: 14px 24px; border-radius: 50px; font-weight: 700; font-size: 1rem; width: 100%; cursor: pointer; transition: all 0.2s ease; text-decoration: none; display: flex; justify-content: center; align-items: center; gap: 8px;}
         .btn-buy-secondary:hover { background: #f0fdf4; border-color: #86efac; color: #166534; }

         .review-card { background: white; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; display: flex; gap: 12px; }
         .review-avatar { width: 40px; height: 40px; border-radius: 50%; background: #e2e8f0; object-fit: cover; flex-shrink: 0; }
         .stars { color: #eab308; font-size: 0.9rem; letter-spacing: 2px; margin-bottom: 4px; }
      </style>
    
      <div class="scarcity-bar">
         ⚠️ ALERTA: Seu Laudo Gratuito e o Desconto de 25% Expiram amanhã às ${expireTimeStr}
      </div>

      <div style="max-width: 600px; margin: 0 auto; min-height: 100vh; padding: 32px 20px 80px 20px;" class="fade-in">
        
        <!-- HEADER AGRESSIVO & EMPÁTICO (O PROBLEMA) -->
        <div style="text-align: center; margin-bottom: 32px; background: white; padding: 30px 20px; border-radius: 20px; box-shadow: 0 5px 25px rgba(0,0,0,0.05); border-top: 5px solid #16a34a;">
            <div style="font-size: 0.8rem; text-transform:uppercase; letter-spacing: 2px; color:#16a34a; font-weight:800; margin-bottom:12px;">Diagnóstico Concluído</div>
            <h2 style="font-family: 'Playfair Display', serif; font-size: 2.1rem; color: #1e293b; margin: 0 0 16px 0; line-height:1.2;">Essa é a solução definitiva, <span class="highlight-text">${clientName.split(' ')[0]}</span>.</h2>
            
            <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 4px; text-align: left; margin: 24px 0;">
               <p style="font-size: 1rem; color: #1e293b; line-height: 1.6; margin:0;">${painAcknowledgeText}</p>
            </div>

            <p style="font-size: 1rem; color: #475569; line-height: 1.6; padding: 0 5px; margin:0; text-align:left;">Nós entendemos como isso rouba sua qualidade de vida dia após dia. O uso prolongado de soluções sintéticas geralmente mascara o problema e sobrecarrega seu fígado. A nossa inteligência mapeou o sistema exato que está precisando de intervenção Imediata na Raiz.</p>
        </div>

        <!-- OILS SHOWCASE (A SOLUÇÃO) -->
        <div style="margin-bottom: 32px;">
            <p style="text-align:center; font-size: 1.1rem; color: #1e293b; font-weight:700; margin-bottom: 24px;">Extraídos diretamente da natureza, este trio irá revolucionar a sua rotina:</p>
            
            ${renderedOils}
        </div>

        <!-- PROVA SOCIAL (DEPOIMENTOS) -->
        <div style="margin-bottom: 40px;">
           <h3 style="font-size: 1.2rem; color: #0f172a; font-weight: 800; text-align: center; margin-bottom: 20px;">Pessoas como você já transformaram suas vidas</h3>
           
           <div class="review-card">
              <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&q=80" class="review-avatar" alt="Juliana Pereira">
              <div>
                 <div class="stars">★★★★★</div>
                 <h5 style="margin: 0 0 4px 0; color: #1e293b; font-size: 0.95rem;">Mudou minha vida e meu sono</h5>
                 <p style="margin: 0; font-size: 0.85rem; color: #475569; line-height: 1.5;">"Fazia anos que eu não sabia o que era dormir uma noite inteira por causa da ansiedade. Depois que comecei esse protocolo, volto a ter energia no dia seguinte. Muito obrigada ${consultant.name.split(' ')[0]}!"</p>
                 <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 6px;">Juliana P., 38 anos</div>
              </div>
           </div>

           <div class="review-card">
              <img src="https://images.unsplash.com/photo-1588691515201-c852b5759efc?w=100&h=100&fit=crop&q=80" class="review-avatar" alt="Roberto Alves">
              <div>
                 <div class="stars">★★★★★</div>
                 <h5 style="margin: 0 0 4px 0; color: #1e293b; font-size: 0.95rem;">Chega de dores todos os dias</h5>
                 <p style="margin: 0; font-size: 0.85rem; color: #475569; line-height: 1.5;">"Eu sobrevivia à base de relaxantes musculares. A troca para algo 100% natural foi a melhor decisão. O alívio é quase imediato na tensão. Indico de olhos fechados."</p>
                 <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 6px;">Roberto A., 45 anos</div>
              </div>
           </div>
        </div>

        <!-- CONSULTANT BOX (GARANTIA E OFERTA) -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
           <div style="font-size: 1.2rem; color: #0f172a; font-weight: 800; margin-bottom: 12px;">Desbloqueie seu acesso com desconto</div>
           <p style="font-size: 0.95rem; color: #475569; line-height: 1.5; margin: 0 0 16px 0;">Não compre a preço de varejo ou em lugares duvidosos. Ativando o seu pacote agora direto da fábrica com a minha indicação de consultora, você recebe imediatamente **25% de Desconto**.</p>
           
           <div style="font-size:0.85rem; font-weight:700; color:#166534; background:#f0fdf4; display:inline-block; padding: 8px 16px; border-radius:20px; border: 1px solid #bbf7d0;">
             ✓ Acompanhamento pós-venda garantido
           </div>
        </div>

        <!-- CTA FINAL -->
        <div style="position: sticky; bottom: 20px; z-index: 100;">
           ${primaryButtonHtml}
        </div>

        <!-- FOOTER -->
        <div style="text-align: center; margin-top: 40px; color: #cbd5e1; font-size: 0.8rem; display:flex; flex-direction:column; gap:8px;">
           <div style="font-weight:700; color:#94a3b8;">Tecnologia com Criptografia de Ponta-a-Ponta</div>
           <div>Desenvolvido pelo Instituto Gota App CRM.</div>
        </div>
      </div>
    `;

    setTimeout(() => {
        sessionStorage.removeItem('tempAnamnesisPayload');
    }, 15000);
}
