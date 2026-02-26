import { analyzeAnamnesis, PROTOCOLS, OILS_DATABASE } from '../data.js';
import { getConsultantTitle } from '../utils.js';

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
        <h1 style="font-size:1.4rem;letter-spacing:2px;margin-bottom:4px;font-weight:600">PROTOCOLO AROMATERAPÊUTICO INTEGRATIVO</h1>
        <p style="opacity:0.8;font-size:0.85rem">Personalizado para ${clientName}</p>
        ${focusText ? `<div style="margin-top:12px;display:inline-block;background:rgba(255,255,255,0.15);padding:4px 16px;border-radius:20px;font-size:0.8rem">Foco: ${focusText}</div>` : ''}
      </div>

      <div class="report-body" style="padding:24px 28px">

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

        <!-- RESULTADOS ESPERADOS -->
        <div style="margin-bottom:24px">
          <h2 style="font-size:1rem;color:#2d5016;font-weight:700;margin-bottom:8px;border-bottom:2px solid #2d5016;padding-bottom:4px">${4 + specificProts.length}. RESULTADOS ESPERADOS</h2>
          <p style="font-size:0.85rem;color:#333;line-height:1.6">${expectedResults || 'Melhora geral na qualidade de vida, mais energia, equilíbrio emocional e bem-estar.'}</p>
        </div>

        <!-- Emotional CTA -->
        <div style="background:linear-gradient(135deg,#f0fff4,#fffbeb);border:1px solid #d4e8c2;border-radius:12px;padding:24px;margin:24px 0;text-align:center">
          <h3 style="color:#2d5016;font-size:1.1rem;margin-bottom:8px">
            Você merece viver com mais saúde, energia e leveza.
          </h3>
          <p style="color:#666;font-size:0.88rem;max-width:480px;margin:0 auto">
            ${consultant.name || `Seu ${cTitle.toLowerCase()}`} está pront${isMasc ? 'o' : 'a'} para guiar você nesta transformação.
            El${isMasc ? 'e' : 'a'} é especialista em terapias naturais e vai te ajudar a implementar este protocolo.
          </p>
        </div>

        <!-- WhatsApp CTA -->
        <a class="report-cta" href="https://wa.me/${waPhone}?text=${whatsappMsg}" target="_blank" style="display:flex;align-items:center;gap:12px;padding:16px 20px;background:linear-gradient(135deg,#25d366,#128c7e);color:white;border-radius:12px;text-decoration:none;margin-bottom:16px">
          <div style="font-size:1.5rem">💬</div>
          <div>
            <strong>Falar com ${consultant.name?.split(' ')[0] || `${isMasc ? 'meu' : 'minha'} ${cTitle.toLowerCase()}`} no WhatsApp</strong>
            <div style="font-size:0.82rem;opacity:0.9">Quero começar meu protocolo personalizado agora!</div>
          </div>
        </a>

        <div style="text-align:center;color:#999;font-size:0.8rem">
          <a href="#" onclick="window.print();return false" style="color:#2d5016">Imprimir este protocolo</a>
        </div>
      </div>

      <!-- Footer -->
      <div class="report-consultant-footer" style="padding:16px 28px;border-top:1px solid #eee;display:flex;align-items:center;justify-content:space-between;background:#fafafa;border-radius:0 0 16px 16px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:#2d5016;color:white;display:flex;align-items:center;justify-content:center;font-size:0.9rem">🌿</div>
          <div>
            <div style="font-weight:600;font-size:0.9rem">${consultant.name || cTitle}</div>
            <div style="font-size:0.78rem;color:#888">${cTitle} de Saúde Natural · Gota Essencial</div>
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
