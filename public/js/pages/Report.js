import { analyzeAnamnesis, PROTOCOLS } from '../data.js';

export function renderReport(router, dataParam) {
  const app = document.getElementById('app');
  let payload;
  try {
    payload = JSON.parse(decodeURIComponent(dataParam || '{}'));
  } catch {
    app.innerHTML = `<div class="report-page"><div class="report-card" style="text-align:center;padding:60px">
      <div style="font-size:3rem">😕</div><h2>Erro ao gerar protocolo</h2></div></div>`;
    return;
  }

  const { answers = {}, consultant = {}, clientName = 'você' } = payload;
  const analysis = analyzeAnamnesis(answers);
  const firstName = clientName.split(' ')[0] || 'você';

  const emotionalMessages = [
    `${firstName}, você deu um passo incrível ao cuidar de si mesma hoje. 💚`,
    `Cada sintoma que você compartilhou aqui é uma mensagem que seu corpo está enviando — e agora temos as ferramentas certas para respondê-la.`,
    `A natureza tem respostas poderosas para tudo o que você está sentindo. Este protocolo foi criado especialmente para você, com base nas suas respostas.`,
    `Você não precisa mais carregar isso sozinha.`,
  ];

  const mainSymptoms = analysis.mainSymptoms.slice(0, 5);
  const protocols = analysis.protocols.slice(0, 4);

  const whatsappMsg = encodeURIComponent(
    `Olá, ${consultant.name || 'consultora'}! 🌿\n\nAcabei de preencher a anamnese e adorei o meu protocolo personalizado!\n\nMeu nome é ${clientName} e gostaria de saber mais sobre como começar.\n\n💚 Estou pronta para transformar minha saúde!`
  );
  const phone = consultant.phone || '';

  app.innerHTML = `
  <div class="report-page">
    <div class="report-card">
      <div class="report-header">
        <div style="font-size:2rem;margin-bottom:8px">💧</div>
        <h1>Seu Protocolo Personalizado</h1>
        <p>Baseado na sua avaliação de saúde natural exclusiva</p>
        <div class="report-name-badge">Para: ${clientName}</div>
      </div>

      <div class="report-body">
        <!-- Emotional Message -->
        <div class="report-emotional">
          ${emotionalMessages.map(m => `<p style="margin-bottom:8px">${m}</p>`).join('')}
        </div>

        <!-- Main Symptoms -->
        ${mainSymptoms.length > 0 ? `
        <div class="report-section">
          <h3>🔎 O que seu corpo está dizendo</h3>
          <div class="report-tags">
            ${mainSymptoms.map(s => `<span class="report-tag">${s}</span>`).join('')}
          </div>
        </div>` : ''}

        <!-- Energy & Stress -->
        <div class="report-section">
          <h3>⚡ Seu Nível de Energia</h3>
          <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:6px">${analysis.energyLevel}/10</div>
          <div class="score-bar-outer">
            <div class="score-bar-inner" style="width:${analysis.energyLevel * 10}%"></div>
          </div>
          <h3 style="margin-top:16px">🌊 Nível de Estresse</h3>
          <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:6px">${analysis.stressLevel}/10 ${analysis.stressLevel >= 7 ? '⚠️ Atenção!' : ''}</div>
          <div class="score-bar-outer">
            <div class="score-bar-inner" style="width:${analysis.stressLevel * 10}%;background:${analysis.stressLevel >= 7 ? 'linear-gradient(to right,#f59e0b,#ef4444)' : 'linear-gradient(to right,var(--green-500),var(--gold-400))'}"></div>
          </div>
        </div>

        <!-- Protocols -->
        ${protocols.length > 0 ? `
        <div class="report-section">
          <h3>🌿 Protocolos Recomendados</h3>
          ${protocols.map(p => `
            <div style="margin-bottom:16px;padding:16px;background:linear-gradient(135deg,var(--green-50),white);border:1px solid var(--border);border-radius:var(--radius-md);border-left:4px solid var(--green-400)">
              <div style="font-weight:700;font-size:1rem;margin-bottom:6px">${p.icon} ${p.symptom}</div>
              <div style="font-size:0.85rem;color:var(--text-body);margin-bottom:8px">${p.description}</div>
              <div class="report-oils">
                ${p.oils.map(o => `<div class="oil-chip"><span class="oil-chip-icon">💧</span>${o}</div>`).join('')}
              </div>
              <div style="margin-top:10px;font-size:0.82rem;color:var(--text-muted);background:white;padding:8px 12px;border-radius:8px">
                📌 <strong>Modo de uso:</strong> ${p.application}
              </div>
              ${p.affirmation ? `<div style="margin-top:8px;font-size:0.82rem;font-style:italic;color:var(--green-700)">✨ ${p.affirmation}</div>` : ''}
            </div>
          `).join('')}
        </div>` : `
        <div class="report-section">
          <h3>🌿 Protocolos de Bem-Estar Geral</h3>
          <div style="padding:16px;background:var(--green-50);border-radius:var(--radius-md);font-size:0.9rem;color:var(--text-body)">
            Com base nas suas respostas, sua consultora irá preparar um protocolo exclusivo e personalizado para você. Entre em contato para descobrir as melhores opções naturais!
          </div>
        </div>`}

        <!-- Goals -->
        ${analysis.goals.length > 0 ? `
        <div class="report-section">
          <h3>🎯 Seus Objetivos</h3>
          <div class="report-tags">
            ${analysis.goals.map(g => `<span class="report-tag">${g}</span>`).join('')}
          </div>
        </div>` : ''}

        <!-- Emotional CTA -->
        <div style="background:linear-gradient(135deg,#f0fff4,#fffbeb);border:1px solid var(--border-gold);border-radius:var(--radius-lg);padding:24px;margin:24px 0;text-align:center">
          <div style="font-size:1.5rem;margin-bottom:8px">💚</div>
          <h3 style="color:var(--green-900);font-family:var(--font-display);font-size:1.2rem;margin-bottom:8px">
            Você merece viver com mais saúde, energia e leveza.
          </h3>
          <p style="color:var(--text-muted);font-size:0.9rem;max-width:480px;margin:0 auto">
            ${consultant.name || 'Sua consultora'} está pronta para guiar você nesta transformação. 
            Ela é especialista em terapias naturais e vai te ajudar a implementar este protocolo com segurança e cuidado.
          </p>
          <p style="color:var(--text-muted);font-size:0.88rem;margin-top:10px;font-style:italic">
            "Este é o primeiro dia do resto da sua vida mais saudável. Dê o próximo passo agora." 🌿
          </p>
        </div>

        <!-- WhatsApp CTA -->
        <a class="report-cta" href="https://wa.me/${phone}?text=${whatsappMsg}" target="_blank">
          <div class="report-cta-icon">💬</div>
          <div class="report-cta-text">
            <strong>Falar com ${consultant.name?.split(' ')[0] || 'minha consultora'} no WhatsApp</strong>
            <span>Quero começar meu protocolo personalizado agora!</span>
          </div>
        </a>

        <div style="text-align:center;margin-top:16px;color:var(--text-muted);font-size:0.8rem">
          Precisa salvar ou imprimir este protocolo? <a href="javascript:window.print()" style="color:var(--green-600)">Clique aqui para imprimir</a>
        </div>
      </div>

      <!-- Footer -->
      <div class="report-consultant-footer">
        <div class="rcf-info">
          <div class="rcf-avatar">${consultant.photo || '🌿'}</div>
          <div>
            <div class="rcf-name">${consultant.name || 'Consultora'}</div>
            <div class="rcf-role">Consultora de Saúde Natural · Gota Essencial</div>
          </div>
        </div>
        ${phone ? `<div class="rcf-contact">📱 +${phone}</div>` : ''}
      </div>
    </div>
  </div>

  <style>
    @media print {
      .report-cta, .report-page { background: white !important; }
      .report-page { padding: 0; }
      .report-header { background: #1a4527 !important; -webkit-print-color-adjust: exact; }
    }
  </style>`;

  // Animate bars after render
  setTimeout(() => {
    document.querySelectorAll('.score-bar-inner').forEach(bar => {
      const w = bar.style.width;
      bar.style.width = '0';
      setTimeout(() => { bar.style.width = w; }, 100);
    });
  }, 200);
}
