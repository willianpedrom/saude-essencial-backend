import { OILS_DATABASE } from '../data.js';
import { getConsultantTitle } from '../utils.js';

export function renderRecomendacaoUau(router) {
    const app = document.getElementById('app');

    // 1. Carregar payload salvo pós-anamnese
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
    const clientName = payload.clientName || 'Cliente';
    const cTitle = getConsultantTitle(consultant.genero);

    // 2. Extrair todas as respostas (sintomas e queixas)
    const getAnswers = (keys) => {
        let list = [];
        keys.forEach(k => {
            if (Array.isArray(answers[k])) list.push(...answers[k]);
            else if (answers[k]) list.push(answers[k]);
        });
        return list.map(v => (v || '').toLowerCase());
    };

    const allSymptomsText = getAnswers([
        'general_symptoms', 'digestive_symptoms', 'hormonal_female', 'chronic_conditions',
        'emotional_symptoms', 'sleep_symptoms', 'low_energy_symptoms',
        'skin_symptoms', 'hair_symptoms', 'goals'
    ]).join(' ');

    // 3. Algoritmo de Matching (simples, mas extremamente efetivo para vendas)
    const recommendationScores = {
        'Lavanda': { score: 0, reason: 'Para acalmar a mente, melhorar o sono e reduzir a ansiedade.', image: 'https://media.doterra.com/us/en/images/product/lavender-15ml.png' },
        'Peppermint': { score: 0, reason: 'Para energia instantânea, foco e alívio de tensões/dores de cabeça.', image: 'https://media.doterra.com/us/en/images/product/peppermint-15ml.png' },
        'Lemon': { score: 0, reason: 'Para purificação, detox natural matinal e melhora do humor.', image: 'https://media.doterra.com/us/en/images/product/lemon-15ml-min.png' },
        'ZenGest': { score: 0, reason: 'Para suporte completo à digestão, inchaço e desconforto abdominal.', image: 'https://media.doterra.com/us/en/images/product/digestzen-15ml.jpg' },
        'On Guard': { score: 0, reason: 'Para blindar a sua imunidade e proteger o corpo contra ameaças sazonais.', image: 'https://media.doterra.com/us/en/images/product/on-guard-15ml.jpg' },
        'Deep Blue': { score: 0, reason: 'Para soltar a musculatura, aliviar tensões crônicas e dores articulares.', image: 'https://media.doterra.com/us/en/images/product/deep-blue-5ml-min.png' },
        'Balance': { score: 0, reason: 'Para aterramento emocional imediato e controle do sistema nervoso.', image: 'https://media.doterra.com/us/en/images/product/balance-15ml.jpg' },
        'Breathe': { score: 0, reason: 'Para abrir as vias aéreas, respirar profundo e oxigenar o cérebro.', image: 'https://media.doterra.com/us/en/images/product/breathe-15ml.png' },
        'Copaiba': { score: 0, reason: 'Modulador natural poderoso para tratar inflamação em todo o corpo.', image: 'https://media.doterra.com/us/en/images/product/copaiba-15ml.jpg' },
    };

    // Palavras-chave associadas a cada óleo
    const keywords = {
        'Lavanda': ['ansiedade', 'estresse', 'insônia', 'sono', 'dormir', 'burnout', 'pânico', 'irritabilidade', 'pele', 'tensão', 'angústia'],
        'Peppermint': ['dor de cabeça', 'enxaqueca', 'energia', 'cansaço', 'fadiga', 'foco', 'concentração', 'desânimo', 'confusão mental', 'calor'],
        'Lemon': ['detox', 'fígado', 'peso', 'emagrecer', 'digestão', 'azia', 'alergia', 'imunidade'],
        'ZenGest': ['digestão', 'refluxo', 'azia', 'inchaço', 'gases', 'constipação', 'intestino', 'náusea'],
        'On Guard': ['imunidade', 'gripe', 'infecção', 'rinicoriza', 'saúde para a família', 'prevenir'],
        'Deep Blue': ['dor', 'dores musculares', 'articulação', 'costas', 'tensões', 'fibromialgia', 'artrite'],
        'Balance': ['pânico', 'ansiedade', 'TPM', 'irritabilidade', 'equilíbrio', 'emocional', 'tristeza', 'depressão'],
        'Breathe': ['falta de ar', 'sinusite', 'rinite', 'asma', 'respirar', 'ronco', 'alergia', 'pulmão'],
        'Copaiba': ['dor crônica', 'inflamação', 'ansiedade', 'endometriose', 'autoimune', 'fibromialgia'],
    };

    // Pontuar com base nas respostas
    Object.keys(keywords).forEach(oil => {
        keywords[oil].forEach(kw => {
            if (allSymptomsText.includes(kw)) {
                recommendationScores[oil].score += 1.5;
            }
        });
    });

    // Se a pessoa não selecionou nada específico, recomendamos os TOP 3 Globais para iniciar:
    if (Object.values(recommendationScores).every(o => o.score === 0)) {
        recommendationScores['Lavanda'].score = 3;
        recommendationScores['Lemon'].score = 2;
        recommendationScores['Peppermint'].score = 1;
    }

    // Ordenar e pegar os Top 3
    const topOils = Object.entries(recommendationScores)
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 3)
        .map(([name, data]) => ({ name, ...data }));


    // 4. Montar a UI Focada em Conversão (Estilo Luxuoso / "UAU")
    let renderedOils = topOils.map(oil => `
      <div style="background: white; border-radius: 16px; padding: 16px; margin-bottom: 12px; display:flex; gap: 16px; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.04); border: 1px solid #f1f5f9;">
        <div style="width: 70px; height: 70px; border-radius: 12px; background: #f8fafc; display:flex; align-items:center; justify-content:center; flex-shrink: 0; padding:4px;">
           <img src="${oil.image}" alt="${oil.name}" style="max-height: 100%; max-width: 100%; object-fit: contain;" onerror="this.src=''; this.parentElement.innerHTML='<span style=\\'font-size:2rem\\'>🌿</span>';" />
        </div>
        <div>
          <h4 style="margin: 0 0 4px 0; color: #1e293b; font-size: 1.1rem;">${oil.name}</h4>
          <p style="margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.4;">${oil.reason}</p>
        </div>
      </div>
    `).join('');

    // Pre-formatar mensagem de WhatsApp para venda pronta
    const topOilsNames = topOils.map(o => o.name).join(', ');
    const waText = encodeURIComponent(`Olá ${consultant.name}! 💧\nAcabei de ver o meu protocolo inteligente no Gota App e o sistema me recomendou a rotina com: *${topOilsNames}*.\n\nGostaria de saber como faço para adquirir e começar a cuidar da minha saúde!`);
    
    // Fallback de telefone caso a consultora não tenha (apenas segurança, raramente acontecerá)
    const phone = (consultant.phone || '').replace(/\\D/g, '') || '5511999999999';

    app.innerHTML = `
      <style>
         body { background: #fdfdfd; font-family: 'Inter', sans-serif; }
         .fade-in { animation: fadeIn 0.8s ease forwards; opacity: 0; }
         @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
         .btn-buy { background: linear-gradient(135deg, #16a34a, #15803d); color: white; border: none; padding: 16px 24px; border-radius: 50px; font-weight: 700; font-size: 1.1rem; width: 100%; box-shadow: 0 8px 20px rgba(22,163,74,0.3); cursor: pointer; transition: all 0.3s ease; text-decoration: none; display: inline-flex; justify-content: center; align-items: center; gap: 8px;}
         .btn-buy:hover { transform: translateY(-3px); box-shadow: 0 12px 25px rgba(22,163,74,0.4); }
      </style>
    
      <div style="max-width: 600px; margin: 0 auto; min-height: 100vh; padding: 40px 20px 80px 20px;" class="fade-in">
        
        <!-- HEADER -->
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="font-size: 3rem; margin-bottom: 12px;">✨</div>
            <h2 style="font-family: 'Playfair Display', serif; font-size: 2.2rem; color: #2d4a28; margin: 0 0 12px 0;">O Protocolo Perfeito Para Você, ${clientName.split(' ')[0]}.</h2>
            <p style="font-size: 1rem; color: #666; line-height: 1.6; padding: 0 10px;">A inteligência do sistema analisou cada uma das suas queixas. O cruzamento dos seus sintomas resultou na sua rotina ideal e 100% natural.</p>
        </div>

        <!-- OILS SHOWCASE -->
        <div style="margin-bottom: 32px;">
            <h3 style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700; margin-bottom: 16px;">Sua Rotina Recomendada</h3>
            ${renderedOils}
        </div>

        <!-- CONSULTANT BOX -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 32px;">
           <div style="font-size: 0.9rem; color: #166534; font-weight: 600; margin-bottom: 8px;">Pronto para transformar sua saúde?</div>
           <p style="font-size: 0.85rem; color: #15803d; line-height: 1.5; margin: 0 0 16px 0;">Ao adquirir hoje através de ${consultant.name}, você ganha **25% de desconto** vitalício em todas as suas compras na doTERRA, além de consultoria acompanhada.</p>
        </div>

        <!-- CTA FINAL -->
        <div style="position: sticky; bottom: 20px; z-index: 100;">
           <a href="https://wa.me/${phone}?text=${waText}" target="_blank" class="btn-buy">
             📲 Quero Minha Rotina Natural
           </a>
        </div>

        <!-- FOOTER -->
        <div style="text-align: center; margin-top: 40px; color: #cbd5e1; font-size: 0.75rem;">
           Segurança e Inteligência Artificial por Gota App CRM
        </div>
      </div>
    `;

    // Limpar o storage depois de 10 segundos, para não ocupar muito espaço e garantir privacidade,
    // Mas com tempo suficiente para caso a pessoa desse um F5 rápido.
    setTimeout(() => {
        sessionStorage.removeItem('tempAnamnesisPayload');
    }, 15000);
}
