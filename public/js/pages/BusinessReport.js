import { analyzeBusinessProfile } from '../data.js';

export function renderBusinessReport(router, dataParam) {
  const app = document.getElementById('app');
  let payload;

  try {
    // Busca do storage primeiro para evitar URLs imensas que quebram no celular
    const storedData = sessionStorage.getItem('tempAnamnesisPayload');
    if (storedData) {
      payload = JSON.parse(storedData);
      sessionStorage.removeItem('tempAnamnesisPayload');
    } else {
      // Fallback p/ URLs originais antigas
      payload = JSON.parse(decodeURIComponent(dataParam || '{}'));
    }
  } catch {
    payload = null;
  }

  if (!payload || !payload.answers) {
    app.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;text-align:center;padding:20px">
        <div style="font-size:3rem;margin-bottom:10px">⚠️</div>
        <h2 style="color:var(--text-dark)">Dados inválidos ou expirados</h2>
        <p style="color:var(--text-muted)">Não foi possível carregar seu relatório. Tente reenviar o formulário.</p>
        <button onclick="window.location.reload()" style="margin-top:20px;padding:10px 20px;background:#3b82f6;color:white;border:none;border-radius:8px">Recarregar Página</button>
      </div>`;
    return;
  }

  const { answers = {}, consultant = {}, clientName = 'Empreendedor' } = payload;
  let analysis = {};
  try {
    analysis = analyzeBusinessProfile(answers);
  } catch (e) {
    console.error("Analysis generation failed:", e);
    analysis = { archetype: { name: 'Perfil não mapeado', desc: '', type: '' }, pain: 'Não definida', goal: 'renda extra', hours: 'algumas horas' };
  }
  const { archetype = {}, pain = '', goal = '', hours = '', urgency = '', motor = '' } = analysis;

  app.innerHTML = `
    <div class="report-page">
      <div class="report-card" style="max-width:750px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden;">
        
        <!-- HEADER -->
        <div class="report-header" style="background:linear-gradient(135deg, #1e293b, #0f172a);padding:32px 28px;text-align:center">
          <div style="background:rgba(255,255,255,0.1);color:#f8fafc;border:none;display:inline-block;padding:6px 14px;border-radius:20px;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Seu Resultado</div>
          <h1 style="color:white;font-size:1.6rem;margin-bottom:8px">Relatório de Perfil <em>Empreendedor</em></h1>
          <p style="color:rgba(255,255,255,0.8);font-size:0.9rem;margin:0">Baseado em suas respostas, preparamos uma análise exclusiva do seu perfil comportamental e potencial.</p>
        </div>
        
        <div class="report-body" style="padding:32px 28px">
          <!-- Intro -->
          <div style="border-left: 4px solid #3b82f6; padding:16px 20px; margin-bottom: 28px; background:#f8fafc; border-radius: 0 8px 8px 0;">
             <h3 style="color:#1e293b;font-size:1.2rem;margin-top:0;margin-bottom:8px">Olá, ${clientName.split(' ')[0]}!</h3>
             <p style="color:#475569;font-size:0.95rem;line-height:1.6;margin:0">
               Chegou a hora de entender como seus padrões de comportamento podem ser o seu maior ativo 
               na construção de uma nova fonte de renda direcionada aos <strong>${goal}</strong> que você almeja.
             </p>
          </div>

          <!-- Archetype Card -->
          <div style="margin-bottom:28px">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
              <div style="font-size:2rem;background:#f1f5f9;width:56px;height:56px;display:flex;align-items:center;justify-content:center;border-radius:12px">🧠</div>
              <div>
                <div style="font-size:0.8rem;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:2px">O seu Arquétipo Predominante</div>
                <h3 style="margin:0;color:#1e293b;font-size:1.3rem">${archetype.name}</h3>
              </div>
            </div>
            
            <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:20px;border-radius:12px;margin-bottom:20px">
              <p style="color:#334155;line-height:1.6;margin:0;font-size:0.95rem">
                <strong>Características:</strong> ${archetype.desc}
              </p>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
              <div style="background:#fefce8;border:1px solid #fef08a;padding:16px;border-radius:12px">
                <div style="font-size:0.75rem;color:#854d0e;text-transform:uppercase;font-weight:700">Propulsor Principal</div>
                <div style="color:#713f12;font-weight:600;margin-top:4px">${motor || 'Mudança de Vida'}</div>
              </div>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:12px">
                <div style="font-size:0.75rem;color:#166534;text-transform:uppercase;font-weight:700">Nível de Prontidão</div>
                <div style="color:#14532d;font-weight:600;margin-top:4px">${urgency || 'Moderada'}</div>
              </div>
            </div>
            
            <div style="line-height:1.7;color:#475569;font-size:0.95rem">
              <p style="margin-top:0;margin-bottom:12px">
                Pessoas com o perfil <strong>${archetype.type}</strong> tendem a ter um desempenho acima da média quando recebem as ferramentas certas. 
                Sabemos que seu maior incômodo atual é a <strong>${pain.toLowerCase()}</strong>. 
              </p>
              <p style="margin:0">
                A boa notícia é que o seu perfil é ideal para modelos de negócio escaláveis e práticos, que podem ser iniciados dedicando 
                <strong>${hours.toLowerCase()}</strong> inicialmente, sem necessidade de abandonar sua atividade principal.
              </p>
            </div>
          </div>

          <!-- Call to Action AGENDAR (Whatsapp) -->
          <div class="report-cta-box" style="background:#eff6ff;border:2px solid #bfdbfe;padding:28px 24px;border-radius:12px;margin-bottom:32px">
            <h3 style="color:#1e3a8a;margin-top:0;margin-bottom:12px;display:flex;align-items:center;gap:8px;font-size:1.15rem">
              <span>🚀</span> Próximo Passo: Plano de Execução
            </h3>
            <p style="color:#1e40af;margin-bottom:24px;font-size:0.95rem;line-height:1.6;margin-top:0">
              Eu sou <strong>${consultant.name || 'Consultor'}</strong>, Especialista em Transição Estratégica. 
              Quero te mostrar uma oportunidade de negócio <em>turn-key</em>, de baixo custo e alta escalabilidade, desenhada exatamente para perfis como o seu faturarem os <strong>${goal}</strong> desejados.
            </p>
            
            <button id="btn-schedule" style="width:100%;font-size:1.05rem;padding:16px;background:linear-gradient(135deg, #2563eb, #1d4ed8);border:none;border-radius:8px;color:white;cursor:pointer;font-weight:600;box-shadow: 0 4px 14px rgba(37,99,235,0.25);transition: transform 0.2s">
              📅 Agendar Minha Reunião Estratégica
            </button>
            <div style="text-align:center;margin-top:12px;font-size:0.85rem;color:#3b82f6;">Reunião gratuita e sem compromisso via WhatsApp.</div>
          </div>

          <!-- Compartilhar e Imprimir -->
          <div class="report-share-actions" style="border-top: 1px solid #e2e8f0; padding-top: 32px;">
            <h4 style="color:#1e293b;margin-top:0;margin-bottom:20px;font-size:1.05rem;text-align:center">Que tal indicar esse teste para amigos?</h4>
            <div style="display:flex;flex-direction:column;gap:12px;max-width: 400px;margin: 0 auto;">
              
              <button id="btn-share-whatsapp" style="width:100%;font-size:1rem;padding:14px;background:#25d366;border:none;border-radius:8px;color:white;cursor:pointer;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;transition: opacity 0.2s">
                <span style="font-size:1.2rem">💬</span> Compartilhar via WhatsApp
              </button>
              
              <button id="btn-share-link" style="width:100%;font-size:1rem;padding:14px;background:white;border:1px solid #cbd5e1;border-radius:8px;color:#475569;cursor:pointer;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;transition: background 0.2s">
                🔗 Copiar o Link do Teste
              </button>

            </div>
          </div>

          <!-- Imprimir -->
          <div style="text-align:center;color:#999;font-size:0.85rem;margin-top:40px">
            <a href="#" class="btn-print" onclick="window.print();return false" style="color:#64748b;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition: color 0.2s">
              <span style="font-size: 1.1rem">🖨️</span> <span style="text-decoration: underline">Imprimir este relatório</span>
            </a>
          </div>

        </div> <!-- /report-body -->

        <!-- Footer -->
        <div class="report-consultant-footer" style="padding:16px 28px;border-top:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;background:#f8fafc;border-radius:0 0 16px 16px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;border-radius:50%;background:#1e293b;color:white;display:flex;align-items:center;justify-content:center;font-size:0.9rem">💼</div>
            <div>
              <div style="font-weight:600;font-size:0.9rem;color:#1e293b">${consultant.name || 'Consultor Estratégico'}</div>
              <div style="font-size:0.78rem;color:#64748b">Especialista em Negócios</div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <style>
      @media print {
        .report-cta-box, .report-share-actions, .btn-print, .report-consultant-footer { display: none !important; }
        .report-page { background: white !important; padding: 0 !important; margin:0 !important; }
        .report-card { box-shadow: none !important; margin:0 !important; border:none !important; border-radius:0 !important; }
        .report-header { background: #1e293b !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; border-radius: 0 !important;}
        body { background: white !important; }
      }
      .btn-print:hover { color: #1e293b !important; }
      #btn-schedule:hover { transform: translateY(-2px); }
      #btn-share-whatsapp:hover { opacity: 0.9; }
      #btn-share-link:hover { background: #f1f5f9 !important; }
    </style>`;

  // Ação de Agendar com o Consultor
  document.getElementById('btn-schedule')?.addEventListener('click', () => {
    const text = encodeURIComponent(
      "Olá " + (consultant.name ? consultant.name.split(' ')[0] : 'Consultor') + ", acabei de finalizar a Análise de Perfil!\n\n" +
      "🧠 Meu Arquétipo: *" + archetype.name + "*\n" +
      "🎯 Meu Alvo de Renda: *" + goal + "*\n\n" +
      "Gostaria de agendar a reunião estratégica gratuita."
    );
    window.open("https://wa.me/55" + consultant.phone?.replace(/\\D/g, '') + "?text=" + text, '_blank');
  });

  // Ação de Compartilhar para Amigos (WhatsApp)
  document.getElementById('btn-share-whatsapp')?.addEventListener('click', () => {
    const linkUrl = consultant.link || window.location.href;
    const shareText = encodeURIComponent(
      "Você sabia que existe um tipo de perfil ideal para começar um negócio próprio sem abandonar sua profissão? 🤔\n\n" +
      "Eu acabei de descobrir o meu Arquétipo Empreendedor e achei sensacional! Faça a sua análise gratuita e rápida aqui embaixo:\n\n" +
      linkUrl
    );
    window.open("https://wa.me/?text=" + shareText, '_blank');
  });

  // Ação de Copiar Link
  document.getElementById('btn-share-link')?.addEventListener('click', async () => {
    const linkUrl = consultant.link || window.location.href;
    try {
      await navigator.clipboard.writeText(linkUrl);
      const btn = document.getElementById('btn-share-link');
      const originalHtml = btn.innerHTML;
      btn.innerHTML = '✅ Link Copiado com Sucesso!';
      btn.style.color = '#15803d';
      btn.style.borderColor = '#bbf7d0';
      btn.style.background = '#f0fdf4';

      // Import the toast utility from utils if available, or just use the button visual fallback
      if (window.toast) {
        window.toast('Link copiado para a área de transferência!', 'success');
      }

      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.style.color = '';
        btn.style.borderColor = '';
        btn.style.background = '';
      }, 3000);
    } catch (err) {
      alert('Seu navegador bloqueou a cópia automática. O link é: ' + linkUrl);
    }
  });
}
