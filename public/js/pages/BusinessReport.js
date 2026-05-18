import { analyzeBusinessProfile } from '../analysis.js?v=1006';

export function renderBusinessReport(router, dataParam, preFetchedData = null) {
  const app = document.getElementById('app');
  let payload;

  if (preFetchedData) {
    payload = preFetchedData;
  } else {
    try {
      const storedData = sessionStorage.getItem('tempAnamnesisPayload');
      if (storedData) {
        payload = JSON.parse(storedData);
        sessionStorage.removeItem('tempAnamnesisPayload');
      } else {
        payload = JSON.parse(decodeURIComponent(dataParam || '{}'));
      }
    } catch {
      payload = null;
    }
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
    console.error("Analysis failed:", e);
    return;
  }

  const { disc, archetype, leadership, jung, meta } = analysis;

  app.innerHTML = `
    <div class="report-page" style="background:#f1f5f9; min-height:100vh; padding:40px 20px;">
      <div class="report-card" style="max-width:800px; margin: 0 auto; background: white; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); overflow: hidden;">
        
        <!-- HEADER -->
        <div class="report-header" style="background:linear-gradient(135deg, #064e3b, #022c22); padding:48px 32px; text-align:center; color:white">
          <div style="background:rgba(255,255,255,0.1); padding:6px 16px; border-radius:100px; display:inline-block; font-size:0.75rem; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-bottom:16px">Análise Comportamental Exclusiva</div>
          <h1 style="font-size:2.2rem; margin:0 0 12px 0; font-family:'Playfair Display', serif">Relatório de Perfil <em>Empreendedor</em></h1>
          <p style="opacity:0.8; font-size:1rem; max-width:500px; margin:0 auto">Olá, ${clientName.split(' ')[0]}. Mapeamos seus padrões naturais para identificar sua melhor forma de construir riqueza.</p>
        </div>

        <div style="padding:40px 32px">
          
          <!-- DISC & JUNG GRID -->
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:40px">
            <div style="background:#f8fafc; padding:24px; border-radius:20px; border:1px solid #e2e8f0">
              <div style="font-size:0.75rem; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:8px">Seu Estilo DISC</div>
              <div style="font-size:1.6rem; font-weight:800; color:#064e3b; margin-bottom:4px">${disc.type}</div>
              <div style="font-size:0.9rem; color:#10b981; font-weight:600">Baseado em: ${disc.trait}</div>
            </div>
            <div style="background:#f8fafc; padding:24px; border-radius:20px; border:1px solid #e2e8f0">
              <div style="font-size:0.75rem; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:8px">Energia & Decisão</div>
              <div style="font-size:1.2rem; font-weight:700; color:#1e293b; margin-bottom:4px">${jung.energy}</div>
              <div style="font-size:1rem; color:#475569">${jung.approach}</div>
            </div>
          </div>

          <!-- ARCHETYPE SECTION -->
          <div style="margin-bottom:40px">
            <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px">
              <div style="font-size:2.5rem">✨</div>
              <div>
                <div style="font-size:0.85rem; font-weight:800; color:#64748b; text-transform:uppercase">Arquétipo de Negócio</div>
                <h2 style="margin:0; font-size:1.8rem; color:#0f172a">${archetype.name}</h2>
              </div>
            </div>
            <div style="background:linear-gradient(to right, #f0fdf4, #f8fafc); padding:24px; border-radius:16px; border-left:6px solid #10b981; line-height:1.6; color:#334155; font-size:1.1rem">
              ${archetype.desc}
            </div>
          </div>

          <!-- LEADERSHIP GAUGE -->
          <div style="background:#0f172a; color:white; border-radius:24px; padding:32px; margin-bottom:40px; text-align:center">
            <div style="font-size:0.9rem; font-weight:700; color:#10b981; text-transform:uppercase; letter-spacing:1px; margin-bottom:20px">Potencial de Liderança</div>
            <div style="position:relative; width:160px; height:160px; margin:0 auto 20px auto">
              <svg viewBox="0 0 36 36" style="width:100%; height:100%">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" stroke-width="3" stroke-dasharray="${leadership.score}, 100" />
              </svg>
              <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-size:2.2rem; font-weight:800">${leadership.score}%</div>
            </div>
            <div style="font-size:1.2rem; font-weight:700; color:#f8fafc">${leadership.label}</div>
            <p style="color:rgba(255,255,255,0.6); font-size:0.9rem; margin-top:12px">Este índice mede sua prontidão para gerir equipes e escalar resultados.</p>
          </div>

          <!-- GOALS -->
          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:16px; margin-bottom:40px">
            <div style="text-align:center; padding:16px; background:#f8fafc; border-radius:12px">
              <div style="font-size:0.75rem; color:#64748b; font-weight:700">Meta Financeira</div>
              <div style="font-weight:700; color:#0f172a; margin-top:4px">${meta.financialGoal}</div>
            </div>
            <div style="text-align:center; padding:16px; background:#f8fafc; border-radius:12px">
              <div style="font-size:0.75rem; color:#64748b; font-weight:700">Disponibilidade</div>
              <div style="font-weight:700; color:#0f172a; margin-top:4px">${meta.availability}</div>
            </div>
            <div style="text-align:center; padding:16px; background:#f8fafc; border-radius:12px">
              <div style="font-size:0.75rem; color:#64748b; font-weight:700">Urgência</div>
              <div style="font-weight:700; color:#0f172a; margin-top:4px">${meta.urgency}</div>
            </div>
          </div>

          <!-- CTA -->
          <div style="background:#eff6ff; border:2px solid #bfdbfe; border-radius:20px; padding:32px; text-align:center">
            <h3 style="margin-top:0; color:#1e40af; font-size:1.4rem">Próximo Passo: Sua Reunião Estratégica</h3>
            <p style="color:#3b82f6; margin-bottom:24px; line-height:1.6">O seu consultor <strong>${consultant.name || 'Gota App'}</strong> já recebeu seu diagnóstico. Agende agora uma conversa gratuita para traçar seu plano de ação para os próximos 90 dias.</p>
            <button id="btn-schedule" style="background:#2563eb; color:white; border:none; padding:18px 40px; border-radius:12px; font-weight:700; font-size:1.1rem; box-shadow: 0 10px 25px rgba(37,99,235,0.3); cursor:pointer">
              💬 Agendar via WhatsApp
            </button>
          </div>

        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-schedule')?.addEventListener('click', () => {
    const text = encodeURIComponent(
      `Olá ${consultant.name || 'Consultor'}, finalizei meu Perfil Empreendedor!\n\n` +
      `🧠 Arquétipo: *${archetype.name}*\n` +
      `🔥 Liderança: *${leadership.score}%*\n` +
      `🚀 Urgência: *${meta.urgency}*\n\n` +
      `Quero agendar minha reunião estratégica.`
    );
    window.open(`https://wa.me/55${consultant.phone?.replace(/\D/g, '')}?text=${text}`, '_blank');
  });
}
