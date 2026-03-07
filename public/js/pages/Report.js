import { analyzeAnamnesis, PROTOCOLS, OILS_DATABASE } from '../data.js';
import { getConsultantTitle } from '../utils.js';

export function renderReport(router, dataParam) {
  const app = document.getElementById('app');
  let payload;
  try {
    const storedData = sessionStorage.getItem('tempAnamnesisPayload');
    if (storedData) {
      payload = JSON.parse(storedData);
      sessionStorage.removeItem('tempAnamnesisPayload');
    } else {
      payload = JSON.parse(decodeURIComponent(dataParam || '{}'));
    }
  } catch {
    app.innerHTML = `<div class="report-page"><div class="report-card" style="text-align:center;padding:60px">
      <div style="font-size:3rem">😕</div><h2>Erro de Dados ou Sessão Expirada</h2><p>Tente preencher o formulário novamente.</p><br><button onclick="window.location.reload()" style="padding:10px 20px;background:#3b82f6;color:white;border:none;border-radius:8px">Recarregar Formulário</button></div></div>`;
    return;
  }

  const { answers = {}, consultant = {}, clientName = 'você' } = payload;
  let analysis = { protocols: [], mainSymptoms: [] };
  try {
    analysis = analyzeAnamnesis(answers);
  } catch (e) {
    console.error(e);
  }

  const firstName = clientName.split(' ')[0] || 'você';
  const cTitle = getConsultantTitle(consultant.genero);
  const isMasc = cTitle === 'Consultor';

  const protocols = analysis.protocols.slice(0, 5);
  const mainSymptoms = analysis.mainSymptoms.slice(0, 6);

  // Build WhatsApp link
  const whatsappMsg = encodeURIComponent(
    `Ola, ${consultant.name?.split(' ')[0] || cTitle}!\n\nAcabei de preencher a anamnese e adorei o meu protocolo personalizado!\n\nMeu nome e ${clientName} e gostaria de saber mais sobre como comecar.\n\nEstou pront${isMasc ? 'o' : 'a'} para transformar minha saude!`
  );
  const phone = (consultant.phone || '').replace(/\D/g, '');
  const waPhone = phone.startsWith('55') ? phone : `55${phone}`;

  // Build oils table from all protocols
  const allOils = [];
  const seenOils = new Set();
  protocols.forEach(p => {
    (p.oils || []).forEach(o => {
      if (!seenOils.has(o.name)) {
        seenOils.add(o.name);
        allOils.push(o);
      }
    });
  });

  // Build combined routine
  const combinedRoutine = { morning: [], afternoon: [], night: [] };
  protocols.forEach(p => {
    if (p.routine) {
      (p.routine.morning || []).forEach(i => { if (!combinedRoutine.morning.includes(i)) combinedRoutine.morning.push(i); });
      (p.routine.afternoon || []).forEach(i => { if (!combinedRoutine.afternoon.includes(i)) combinedRoutine.afternoon.push(i); });
      (p.routine.night || []).forEach(i => { if (!combinedRoutine.night.includes(i)) combinedRoutine.night.push(i); });
    }
  });

  // Specific protocols (e.g. capilar)
  const specificProts = protocols.filter(p => p.specificProtocol).map(p => p.specificProtocol);

  // Combined therapeutic objective
  const focusAreas = [...new Set(protocols.map(p => p.focus).filter(Boolean))];
  const focusText = focusAreas.join(' · ');

  // Expected results combined
  const expectedResults = [...new Set(protocols.map(p => p.expectedResults).filter(Boolean))].join(' ');

  app.innerHTML = `
  <div class="report-page">
    <div class="report-card" style="max-width:750px">

      <!-- HEADER -->
      <div class="report-header" style="background:linear-gradient(135deg,#2d5016,#1a4527);padding:32px 28px;text-align:center">
        <div style="font-family:'Georgia', serif; font-size:1.8rem; color:#f0f7ed; margin-bottom:12px; font-style:italic; font-weight:400">
          Olá, ${firstName}! 🌱
        </div>
        <h1 style="font-size:1.2rem;letter-spacing:2px;margin-bottom:4px;font-weight:600;text-transform:uppercase">SEU PROTOCOLO AROMATERAPÊUTICO</h1>
        <p style="opacity:0.8;font-size:0.85rem">Criado exclusivamente para ${clientName}</p>
        ${focusText ? `<div style="margin-top:12px;display:inline-block;background:rgba(255,255,255,0.25);color:#ffffff;padding:4px 16px;border-radius:20px;font-size:0.85rem;font-weight:600;letter-spacing:0.5px;box-shadow:0 2px 8px rgba(0,0,0,0.2)">Foco: ${focusText}</div>` : ''}
      </div>

      <div class="report-body" style="padding:24px 28px">

        <!-- ANCORAGEM DE VALOR -->
        <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin-bottom:24px;border-radius:0 8px 8px 0">
          <p style="font-size:0.85rem;color:#92400e;margin:0;line-height:1.5">
            <strong>💎 Valor da Avaliação:</strong> Uma consulta integrativa presencial como esta custa em média R$ 350,00. Hoje, através deste convite exclusivo, seu diagnóstico foi <strong>totalmente isento</strong>.
          </p>
        </div>

        ${payload.clientMessage ? `
        <!-- RECADO DA CONSULTORA -->
        <div style="background:#fdfcf8;border: 1px solid #e5e7eb;border-top: 4px solid #2d5016;padding:20px;margin-bottom:24px;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <div style="width:32px;height:32px;border-radius:50%;background:#e8f5e9;color:#2d5016;display:flex;align-items:center;justify-content:center;font-size:1.1rem">💬</div>
            <strong style="color:#2d5016;font-size:1rem">Recado da sua Consultora</strong>
          </div>
          <div style="font-size:0.9rem;color:#4b5563;line-height:1.6;white-space:pre-wrap;font-style:italic">"${payload.clientMessage}"</div>
          <div style="text-align:right;margin-top:10px;font-size:0.8rem;color:#6b7280;font-weight:600">— ${consultant.name?.split(' ')[0] || cTitle}</div>
        </div>
        ` : ''}

        <!-- 1. OBJETIVO TERAPÊUTICO -->
        <div style="margin-bottom:24px">
          <h2 style="font-size:1rem;color:#2d5016;font-weight:700;margin-bottom:8px;border-bottom:2px solid #2d5016;padding-bottom:4px">1. OBJETIVO TERAPÊUTICO</h2>
          <p style="font-size:0.88rem;color:#333;line-height:1.6">
            ${protocols.map(p => p.therapeuticObjective).filter(Boolean).slice(0, 3).join(' ')}
          </p>
        </div>

        <!-- 2. ÓLEOS E COMPLEMENTOS UTILIZADOS -->
        ${allOils.length > 0 ? `
        <div style="margin-bottom:24px">
          <h2 style="font-size:1rem;color:#2d5016;font-weight:700;margin-bottom:8px;border-bottom:2px solid #2d5016;padding-bottom:4px">2. ÓLEOS E COMPLEMENTOS UTILIZADOS</h2>
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
            <thead>
              <tr style="background:#f0f7ed">
                <th style="text-align:left;padding:8px 12px;border:1px solid #ddd;font-weight:600;color:#2d5016">Produto</th>
                <th style="text-align:left;padding:8px 12px;border:1px solid #ddd;font-weight:600;color:#2d5016">Função Terapêutica</th>
              </tr>
            </thead>
            <tbody>
              ${allOils.map(o => `
                <tr>
                  <td style="padding:8px 12px;border:1px solid #ddd;font-weight:500">${o.name}</td>
                  <td style="padding:8px 12px;border:1px solid #ddd;color:#555">${o.fn}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>` : ''}

        <!-- 3. ROTINA DIÁRIA -->
        <div style="margin-bottom:24px">
          <h2 style="font-size:1rem;color:#2d5016;font-weight:700;margin-bottom:8px;border-bottom:2px solid #2d5016;padding-bottom:4px">3. ROTINA DIÁRIA</h2>

          ${combinedRoutine.morning.length > 0 ? `
          <div style="margin-bottom:12px">
            <strong style="color:#2d5016;font-size:0.9rem">Manhã:</strong>
            <ul style="margin:4px 0 0 16px;font-size:0.85rem;color:#333;line-height:1.8">
              ${combinedRoutine.morning.slice(0, 5).map(i => `<li>${i}</li>`).join('')}
            </ul>
          </div>` : ''}

          ${combinedRoutine.afternoon.length > 0 ? `
          <div style="margin-bottom:12px">
            <strong style="color:#2d5016;font-size:0.9rem">Tarde:</strong>
            <ul style="margin:4px 0 0 16px;font-size:0.85rem;color:#333;line-height:1.8">
              ${combinedRoutine.afternoon.slice(0, 5).map(i => `<li>${i}</li>`).join('')}
            </ul>
          </div>` : ''}

          ${combinedRoutine.night.length > 0 ? `
          <div style="margin-bottom:12px">
            <strong style="color:#2d5016;font-size:0.9rem">Noite:</strong>
            <ul style="margin:4px 0 0 16px;font-size:0.85rem;color:#333;line-height:1.8">
              ${combinedRoutine.night.slice(0, 5).map(i => `<li>${i}</li>`).join('')}
            </ul>
          </div>` : ''}
        </div>

        <!-- 4. PROTOCOLOS ESPECÍFICOS -->
        ${specificProts.length > 0 ? specificProts.map((sp, idx) => `
        <div style="margin-bottom:24px">
          <h2 style="font-size:1rem;color:#2d5016;font-weight:700;margin-bottom:8px;border-bottom:2px solid #2d5016;padding-bottom:4px">${4 + idx}. ${sp.title}</h2>
          <ul style="margin:4px 0 0 16px;font-size:0.85rem;color:#333;line-height:1.8">
            ${sp.instructions.map(i => `<li>${i}</li>`).join('')}
          </ul>
        </div>
        `).join('') : ''}

        <!-- RESULTADOS ESPERADOS (CURIOSITY GAP) -->
        <div style="margin-bottom:24px;position:relative">
          <h2 style="font-size:1rem;color:#2d5016;font-weight:700;margin-bottom:8px;border-bottom:2px solid #2d5016;padding-bottom:4px">${4 + specificProts.length}. RESULTADOS CLÍNICOS 🔒</h2>
          <div style="filter:blur(5px);opacity:0.5;pointer-events:none;user-select:none">
            <p style="font-size:0.85rem;color:#333;line-height:1.6">A restauração completa do seu eixo saúde garantirá uma imunidade alta e estável ao longo de todas as estações do ano, com picos de energia constantes e descanso reparador ininterrupto à noite.</p>
          </div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;width:100%">
            <div style="background:rgba(255,255,255,0.95);padding:10px 20px;border-radius:20px;display:inline-block;box-shadow:0 10px 25px rgba(0,0,0,0.1);border:1px solid #ddd">
              <span style="font-size:1.2rem">🔒</span> <strong style="font-size:0.85rem;color:#d97706">Área Restrita</strong>
              <div style="font-size:0.75rem;color:#666;margin-top:2px">Chame sua consultora para liberar a chave do prognóstico.</div>
            </div>
          </div>
        </div>

        <!-- Emotional CTA -->
        <div style="background:linear-gradient(135deg,#f0fff4,#fffbeb);border:1px solid #d4e8c2;border-radius:12px;padding:24px;margin:24px 0;text-align:center">
          <h3 style="color:#2d5016;font-size:1.1rem;margin-bottom:8px">
            Como iniciar meu tratamento hoje? 📦
          </h3>
          <p style="color:#666;font-size:0.88rem;max-width:480px;margin:0 auto 16px">
            Seu corpo precisa das ferramentas certas para iniciar o processo. Adquira os óleos puros diretamente da fábrica (doTERRA) com desconto de atacado (25%), garantindo o acompanhamento VIP de <strong>${consultant.name?.split(' ')[0] || cTitle}</strong>.
          </p>
          <div style="background:white;padding:12px;border-radius:8px;border:1px dashed #25d366;display:inline-block;margin-bottom:16px">
            <span style="color:#25d366;font-weight:bold;font-size:0.9rem">⏳ BÔNUS POR TEMPO LIMITADO</span><br>
            <span style="font-size:0.8rem;color:#555">Envie uma mensagem para ${consultant.name?.split(' ')[0] || cTitle} agora e verifique se você se qualifica para Frete Grátis ou um Óleo de Brinde.</span>
          </div>

          <!-- WhatsApp CTA -->
          <a class="report-cta" href="https://wa.me/${waPhone}?text=${whatsappMsg}" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:12px;padding:16px 20px;background:linear-gradient(135deg,#25d366,#128c7e);color:white;border-radius:12px;text-decoration:none;margin-bottom:16px;box-shadow:0 8px 20px rgba(37,211,102,0.3);transition:transform 0.2s">
            <div style="font-size:1.5rem">💬</div>
            <div style="text-align:left">
              <strong style="display:block;font-size:0.95rem">LIBERE SEU PROTOCOLO COMPLETO NO WHATSAPP</strong>
              <div style="font-size:0.75rem;opacity:0.9">Fale com ${consultant.name?.split(' ')[0] || cTitle} no WhatsApp</div>
            </div>
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div class="report-consultant-footer" style="padding:16px 28px;border-top:1px solid #eee;display:flex;align-items:center;justify-content:space-between;background:#fafafa;border-radius:0 0 16px 16px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:#2d5016;color:white;display:flex;align-items:center;justify-content:center;font-size:0.9rem">🌿</div>
          <div>
            <div style="font-weight:600;font-size:0.9rem">${consultant.name || cTitle}</div>
            <div style="font-size:0.78rem;color:#888">${cTitle} de Saúde Natural</div>
          </div>
        </div>
        ${phone ? `<div style="font-size:0.82rem;color:#888">📱 +${waPhone}</div>` : ''}
      </div>
    </div>
  </div>

  <style>
    @media print {
      .report-cta { display: none !important; }
      .report-page { background: white !important; padding: 0; }
      .report-card { box-shadow: none !important; }
      .report-header { background: #2d5016 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      table { page-break-inside: avoid; }
    }
  </style>`;
}
