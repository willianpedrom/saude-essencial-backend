import { analyzeBusinessProfile } from '../data.js';

export function renderBusinessReport(router, dataParam) {
  const app = document.getElementById('app');
  let payload;

  try {
    payload = JSON.parse(decodeURIComponent(dataParam || '{}'));
  } catch {
    payload = null;
  }

  if (!payload || !payload.answers) {
    app.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;text-align:center;padding:20px">
        <div style="font-size:3rem;margin-bottom:10px">⚠️</div>
        <h2 style="color:var(--text-dark)">Dados inválidos</h2>
        <p style="color:var(--text-muted)">Não foi possível carregar seu relatório.</p>
      </div>`;
    return;
  }

  const { answers, consultant, clientName } = payload;
  const analysis = analyzeBusinessProfile(answers);
  const { archetype, pain, goal, hours } = analysis;

  app.innerHTML = `
    <div class="anamnesis-public-page">
      <div class="anamnesis-hero" style="background:linear-gradient(135deg, #1e293b, #0f172a)">
        <div class="anamnesis-hero-badge" style="background:#334155;color:#f8fafc;border:none">Seu Resultado</div>
        <h1>Relatório de Perfil <em>Empreendedor</em></h1>
        <p>Baseado em suas respostas, preparamos uma análise exclusiva do seu perfil comportamental e potencial de mercado.</p>
      </div>

      <div class="anamnesis-consultant-card" style="border-left: 4px solid #3b82f6;">
        <div class="consultant-info" style="margin-left:0">
           <h3 style="color:#1e293b;font-size:1.1rem;margin-bottom:4px">Olá, ${clientName.split(' ')[0]}!</h3>
           <p style="color:#475569;font-size:0.9rem">
             Chegou a hora de entender como seus padrões de comportamento podem ser o seu maior ativo 
             na construção de uma nova fonte de renda direcionada aos <strong>${goal}</strong> que você almeja.
           </p>
        </div>
      </div>

      <div class="anamnesis-container">
        
        <!-- Archetype Card -->
        <div class="protocol-section">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
            <div style="font-size:2rem;background:#f1f5f9;width:50px;height:50px;display:flex;align-items:center;justify-content:center;border-radius:12px">🧠</div>
            <div>
              <div style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;font-weight:600">O seu Arquétipo Predominante</div>
              <h3 style="margin:0;color:#1e293b">${archetype.name}</h3>
            </div>
          </div>
          
          <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:20px;border-radius:12px;margin-bottom:20px">
            <p style="color:#334155;line-height:1.6;margin:0;font-size:0.95rem">
              <strong>Características:</strong> ${archetype.desc}
            </p>
          </div>
          
          <div style="line-height:1.6;color:#475569;font-size:0.95rem">
            <p>
              Pessoas com o perfil <strong>${archetype.type}</strong> tendem a ter um desempenho acima da média quando recebem as ferramentas certas. 
              Sabemos que seu maior incômodo atual é a <strong>${pain.toLowerCase()}</strong>. 
            </p>
            <p>
              A boa notícia é que o seu perfil é ideal para modelos de negócio escaláveis e práticos, que podem ser iniciados dedicando 
              <strong>${hours.toLowerCase()}</strong> inicialmente, sem necessidade de abandonar sua atividade principal.
            </p>
          </div>
        </div>

        <!-- Call to Action -->
        <div class="protocol-section" style="background:#eff6ff;border:2px solid #bfdbfe">
          <h3 style="color:#1e3a8a;margin-bottom:12px;display:flex;align-items:center;gap:8px">
            <span>🚀</span> Próximo Passo: Plano de Execução
          </h3>
          <p style="color:#1e40af;margin-bottom:20px;font-size:0.95rem;line-height:1.6">
            Eu sou <strong>${consultant.name}</strong>, Consultor(a) Especialista em Transição Estratégica. 
            Quero te mostrar uma oportunidade de negócio <em>turn-key</em>, de baixo custo fixo e alta escalabilidade, desenhada exatamente para perfis como o seu faturarem os <strong>${goal}</strong> desejados.
          </p>
          
          <button class="btn btn-primary btn-lg" id="btn-schedule" style="width:100%;font-size:1.05rem;padding:16px;background:#2563eb;border:none">
            📅 Agendar Minha Reunião de Execução
          </button>
        </div>

      </div>
    </div>`;

  document.getElementById('btn-schedule')?.addEventListener('click', () => {
    const text = encodeURIComponent(
      "Olá " + consultant.name + ", acabei de finalizar a Análise de Perfil Empreendedor!\n\n" +
      "🧠 Meu Arquétipo: *" + archetype.name + "*\n" +
      "🎯 Meu Alvo: *" + goal + "*\n\n" +
      "Gostaria de agendar a reunião estratégica para entender o modelo de negócios."
    );
    window.open("https://wa.me/55" + consultant.phone.replace(/\\D/g, '') + "?text=" + text, '_blank');
  });
}
