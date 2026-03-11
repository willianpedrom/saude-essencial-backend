import { store } from '../store.js';
import { ANAMNESIS_QUESTIONS, ANAMNESIS_STEPS, BUSINESS_STEPS, BUSINESS_QUESTIONS } from '../data.js';
import { toast, injectTrackingScripts } from '../utils.js';

export async function renderPublicAnamnesis(router, token) {
  const app = document.getElementById('app');

  // Show loading
  app.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-size:1.2rem;color:#4a4a4a">
      <div style="text-align:center">
        <div style="font-size:3rem;margin-bottom:16px">💧</div>
        <div>Carregando sua avaliação de saúde...</div>
      </div>
    </div>`;

  // Fetch public anamnesis info
  let anamneseData;
  try {
    anamneseData = await store.getPublicAnamnesis(token);
  } catch (err) {
    app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh">
          <div style="text-align:center;padding:60px 40px">
            <div style="font-size:4rem;margin-bottom:16px">😕</div>
            <h2 style="color:#2d4a28">Link não encontrado</h2>
            <p style="color:#888;margin-top:8px">Este link de anamnese é inválido ou expirou.</p>
          </div>
        </div>`;
    return;
  }

  if (anamneseData.preenchido) {
    app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh">
          <div style="text-align:center;padding:60px 40px">
            <div style="font-size:4rem;margin-bottom:16px">✅</div>
            <h2 style="color:#2d4a28">Anamnese já preenchida</h2>
            <p style="color:#888;margin-top:8px">Você já preencheu este formulário. Aguarde o protocolo da sua consultora.</p>
          </div>
        </div>`;
    return;
  }

  const consultoraNome = anamneseData.consultora_nome || 'Consultora Gota App';

  // Inject consultant's tracking scripts (Meta Pixel, Clarity, GA4, etc.)
  injectTrackingScripts(anamneseData.consultora_rastreamento);

  // Try to use the API data to guess the correct title, fallback to generic
  // We can pass consultant's gender from the backend, but since PublicAnamnesis might just get the name
  // for now we use "Consultor(a)" or look for specific gender info if the backend provides it
  const cTitle = 'Consultor de Saúde Natural'; // Unificado conforme pedido pelo usuário
  const avatarHtml = anamneseData.consultora_foto
    ? `<img src="${anamneseData.consultora_foto}" alt="Foto ${consultoraNome}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`
    : `💧`;

  let currentStep = 0;
  const answers = {};

  // ── Draft persistence (keyed by token) ──────────────────────────────────
  const DRAFT_KEY = `anamnese_draft_${token}`;

  function saveDraft() {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, currentStep }));
    } catch { /* quota exceeded — ignore */ }
  }

  function restoreDraft() {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return false;
      const draft = JSON.parse(raw);
      if (draft.answers && typeof draft.answers === 'object') {
        Object.assign(answers, draft.answers);
      }
      if (typeof draft.currentStep === 'number' && draft.currentStep >= 0) {
        currentStep = Math.min(draft.currentStep, STEPS.length - 1);
      }
      return Object.keys(answers).length > 0;
    } catch { return false; }
  }

  function clearDraft() {
    sessionStorage.removeItem(DRAFT_KEY);
  }

  const isBusiness = anamneseData.tipo === 'recrutamento';
  const isVendaDireta = anamneseData.tipo === 'venda_direta';
  const STEPS = isBusiness ? BUSINESS_STEPS : ANAMNESIS_STEPS;
  const QUESTIONS = isBusiness ? BUSINESS_QUESTIONS : ANAMNESIS_QUESTIONS;

  const pageTitle = isBusiness ? 'Seu Perfil <em>Empreendedor</em> e Matriz de Carreira' : 'Seu Protocolo <em>Personalizado</em> de Bem-estar';
  const pageSubtitle = isBusiness ? 'Responda com sinceridade. Seu perfil gerará um diagnóstico comportamental exclusivo.' : 'Responda com sinceridade. Quanto mais detalhes, mais preciso será seu protocolo exclusivo.';
  const pageBadge = isBusiness ? 'Análise de Perfil Empreendedor' : 'Avaliação de Saúde Natural';
  const btnFinalLabel = isBusiness ? '🚀 Gerar Diagnóstico' : '💧 Gerar Meu Protocolo';

  function showTransitionEffect(callback) {
    app.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;text-align:center;padding:20px;">
        <div style="font-size:3rem;animation:pulse 1s infinite">✨</div>
        <h3 style="color:#2d5016;margin-top:16px">Analisando suas respostas...</h3>
        <p style="color:#888;font-size:0.9rem">Preparando a próxima etapa.</p>
      </div>
      <style>@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }</style>
    `;
    setTimeout(callback, 1200);
  }

  function showProcessingEffect(callback) {
    app.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;text-align:center;padding:20px;">
        <div style="font-size:3.5rem;animation:pulse 1s infinite">🤖</div>
        <h3 style="color:#2d5016;margin-top:16px" id="proc-text">Compilando sintomas...</h3>
        <p style="color:#888;font-size:0.9em" id="proc-sub">Aguarde, nosso sistema está montando seu protocolo.</p>
        <div style="width:200px;background:#eee;border-radius:99px;height:8px;margin-top:20px;overflow:hidden">
          <div id="proc-bar" style="width:0%;height:100%;background:linear-gradient(to right, #25d366, #128c7e);transition:width 0.5s ease"></div>
        </div>
      </div>
      <style>@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }</style>
    `;
    setTimeout(() => {
      const t = document.getElementById('proc-text'); if (t) t.innerText = 'Cruzando informações e banco de óleos...';
      const b = document.getElementById('proc-bar'); if (b) b.style.width = '40%';
    }, 1200);
    setTimeout(() => {
      const t = document.getElementById('proc-text'); if (t) t.innerText = 'Gerando seu protocolo personalizado...';
      const b = document.getElementById('proc-bar'); if (b) b.style.width = '80%';
    }, 2800);
    setTimeout(() => {
      const b = document.getElementById('proc-bar'); if (b) b.style.width = '100%';
    }, 4000);
    setTimeout(callback, 4500);
  }

  function renderStep() {
    const stepDef = STEPS[currentStep];
    const section = QUESTIONS[stepDef.id];
    const isLast = currentStep === STEPS.length - 1;

    app.innerHTML = `
    <div class="anamnesis-public-page">
      <div class="anamnesis-hero">
        <div class="anamnesis-hero-badge">${pageBadge}</div>
        <h1>${pageTitle}</h1>
        <p>${pageSubtitle}</p>
        ${currentStep === 0 && !isBusiness ? `
          <div style="margin-top:20px;background:rgba(217,119,6,0.1);border:1px solid rgba(217,119,6,0.3);padding:14px;border-radius:12px;text-align:left;font-size:0.85rem;color:#b45309;line-height:1.5;box-shadow:0 4px 12px rgba(217,119,6,0.05)">
            <strong style="display:block;margin-bottom:4px">⚠️ Vagas Limitadas</strong>
            A(o) <strong>${consultoraNome.split(' ')[0]}</strong> libera apenas <strong>5 protocolos gratuitos</strong> por semana devido à alta demanda de acompanhamento. Preencha até o fim agora para garantir a análise individual do seu caso.
          </div>
        ` : ''}
      </div>

      <div class="anamnesis-consultant-card">
        <div class="consultant-avatar" style="${anamneseData.consultora_foto ? 'padding:0;overflow:hidden;background:transparent' : ''}">${avatarHtml}</div>
        <div class="consultant-info">
          <h3>${consultoraNome}</h3>
          <p>${cTitle}</p>
        </div>
      </div>

      <div class="anamnesis-container">
        <!-- Progress -->
        <div style="margin-bottom:24px">
          <div style="display:flex;justify-content:space-between;color:rgba(255,255,255,0.5);font-size:0.8rem;margin-bottom:6px">
            <span>${stepDef.icon} ${section.title}</span>
            <span>${currentStep + 1} de ${STEPS.length}</span>
          </div>
          <div style="background:rgba(255,255,255,0.12);border-radius:99px;height:6px">
            <div style="background:linear-gradient(to right,var(--green-400),var(--gold-300));height:6px;border-radius:99px;width:${((currentStep + 1) / STEPS.length * 100).toFixed(0)}%;transition:width 0.4s ease"></div>
          </div>
        </div>

        <div class="anamnesis-block">
          <h3>${stepDef.icon} ${section.title}</h3>
          <div id="step-fields">${renderFields(section, answers[stepDef.id] || {})}</div>
        </div>

        <div style="display:flex;justify-content:space-between;margin-top:4px">
          ${currentStep > 0
        ? `<button class="btn btn-secondary" id="btn-prev" style="background:rgba(255,255,255,0.1);color:white;border-color:rgba(255,255,255,0.2)">← Anterior</button>`
        : '<div></div>'}
          <button class="btn btn-gold btn-lg" id="btn-next">
            ${isLast ? btnFinalLabel : 'Próximo →'}
          </button>
        </div>
      </div>
    </div>`;

    const prevBtn = document.getElementById('btn-prev');
    if (prevBtn) prevBtn.addEventListener('click', () => { collectAnswers(stepDef.id); currentStep--; renderStep(); });

    document.getElementById('btn-next').addEventListener('click', () => {
      if (stepDef.id === 'personal') {
        const name = document.getElementById('field-full_name')?.value?.trim();
        const email = document.getElementById('field-email')?.value?.trim();
        const phone = document.getElementById('field-phone')?.value?.trim();
        // gender not required for recruiting
        const gender = document.getElementById('field-gender')?.value;
        if (!name || !email || !phone || (!isBusiness && !gender)) { toast('Preencha os dados pessoais obrigatórios', 'error'); return; }
      }
      collectAnswers(stepDef.id);
      if (isLast) {
        showProcessingEffect(submitAnamnesis);
      } else {
        showTransitionEffect(() => {
          currentStep++;
          renderStep();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    });

    // Scale buttons
    document.querySelectorAll('.scale-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.closest('[data-scale-key]');
        group.querySelectorAll('.scale-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
  }

  function renderFields(section, saved) {
    let html = '';

    if (section.fields) {
      html += section.fields.map(f => {
        const key = f.name || f.key;
        const val = saved[key] || '';

        if (['text', 'email', 'tel', 'date'].includes(f.type)) {
          return `<div class="form-group" style="margin-bottom:14px">
              <label class="field-label">${f.label}${f.required ? ' *' : ''}</label>
              <input class="field-input" id="field-${key}" type="${f.type}" value="${val}" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''} />
            </div>`;
        }
        if (f.type === 'select') {
          return `<div class="form-group" style="margin-bottom:14px">
              <label class="field-label">${f.label}${f.required ? ' *' : ''}</label>
              <select class="field-input" id="field-${key}" ${f.required ? 'required' : ''} style="padding:12px 14px;border-radius:10px">
                <option value="">— Selecionar —</option>
                ${(f.options || []).map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')}
              </select>
            </div>`;
        }
        if (f.type === 'radio') {
          return `<div style="margin-bottom:22px">
            <div style="font-weight:600;margin-bottom:10px;font-size:0.9rem;color:var(--text-body)">${f.label}</div>
            <div class="radio-group">
              ${f.options.map(opt => `
                <label class="radio-pill">
                  <input type="radio" name="${key}" value="${opt}" ${val === opt ? 'checked' : ''} /> ${opt}
                </label>`).join('')}
            </div>
          </div>`;
        }
        if (f.type === 'scale') {
          const selVal = typeof val === 'number' ? val : (f.max === 10 ? 5 : 3);
          return `<div style="margin-bottom:22px">
            <div style="font-weight:600;margin-bottom:10px;font-size:0.9rem;color:var(--text-body)">${f.label}</div>
            <div class="scale-group" data-scale-key="${key}">
              ${Array.from({ length: f.max }, (_, i) => i + 1).map(n => `
                <button type="button" class="scale-btn ${n === selVal ? 'selected' : ''}" data-val="${n}">${n}</button>`).join('')}
              ${f.scaleLabel ? `<span class="scale-label">${f.scaleLabel[0]} → ${f.scaleLabel[f.scaleLabel.length - 1]}</span>` : ''}
            </div>
          </div>`;
        }
        return '';
      }).join('');
    }

    if (section.sections) {
      html += section.sections.map(sec => {
        const sv = saved[sec.key];
        if (sec.type === 'checkbox') {
          return `<div style="margin-bottom:22px">
            <div style="font-weight:600;margin-bottom:10px;font-size:0.9rem;color:var(--text-body)">${sec.label}</div>
            <div class="checkbox-grid">
              ${sec.options.map(opt => `
                <label class="checkbox-item">
                  <input type="checkbox" name="${sec.key}" value="${opt}" ${Array.isArray(sv) && sv.includes(opt) ? 'checked' : ''} />
                  <div class="checkbox-mark"></div> ${opt}
                </label>`).join('')}
            </div>
          </div>`;
        }
        if (sec.type === 'scale') {
          const selVal = typeof sv === 'number' ? sv : (sec.max === 10 ? 5 : 3);
          return `<div style="margin-bottom:22px">
            <div style="font-weight:600;margin-bottom:10px;font-size:0.9rem;color:var(--text-body)">${sec.label}</div>
            <div class="scale-group" data-scale-key="${sec.key}">
              ${Array.from({ length: sec.max }, (_, i) => i + 1).map(n => `
                <button type="button" class="scale-btn ${n === selVal ? 'selected' : ''}" data-val="${n}">${n}</button>`).join('')}
              ${sec.scaleLabel ? `<span class="scale-label">${sec.scaleLabel[0]} → ${sec.scaleLabel[sec.scaleLabel.length - 1]}</span>` : ''}
            </div>
          </div>`;
        }
        if (sec.type === 'radio') {
          return `<div style="margin-bottom:22px">
            <div style="font-weight:600;margin-bottom:10px;font-size:0.9rem;color:var(--text-body)">${sec.label}</div>
            <div class="radio-group">
              ${sec.options.map(opt => `
                <label class="radio-pill">
                  <input type="radio" name="${sec.key}" value="${opt}" ${sv === opt ? 'checked' : ''} /> ${opt}
                </label>`).join('')}
            </div>
          </div>`;
        }
        if (sec.type === 'textarea') {
          return `<div style="margin-bottom:22px">
            <div style="font-weight:600;margin-bottom:8px;font-size:0.9rem;color:var(--text-body)">${sec.label}</div>
            <textarea class="field-textarea" name="${sec.key}" placeholder="${sec.placeholder || ''}">${sv || ''}</textarea>
          </div>`;
        }
        return '';
      }).join('');
    }

    return html;
  }

  function collectAnswers(stepId) {
    const data = {};
    const fields = QUESTIONS[stepId].fields;
    if (fields) {
      fields.forEach(f => {
        const key = f.name || f.key;
        if (['text', 'email', 'tel', 'date', 'select'].includes(f.type)) {
          const el = document.getElementById('field-' + key);
          if (el) data[key] = el.value;
        } else if (f.type === 'radio') {
          const sel = document.querySelector(`input[name="${key}"]:checked`);
          data[key] = sel ? sel.value : null;
        } else if (f.type === 'scale') {
          const sel = document.querySelector(`[data-scale-key="${key}"] .scale-btn.selected`);
          data[key] = sel ? parseInt(sel.dataset.val) : null;
        }
      });
    }

    (QUESTIONS[stepId].sections || []).forEach(sec => {
      if (sec.type === 'checkbox') {
        data[sec.key] = [...document.querySelectorAll(`input[name="${sec.key}"]:checked`)].map(i => i.value);
      } else if (sec.type === 'scale') {
        const sel = document.querySelector(`[data-scale-key="${sec.key}"] .scale-btn.selected`);
        data[sec.key] = sel ? parseInt(sel.dataset.val) : null;
      } else if (sec.type === 'radio') {
        const sel = document.querySelector(`input[name="${sec.key}"]:checked`);
        data[sec.key] = sel ? sel.value : null;
      } else if (sec.type === 'textarea') {
        const ta = document.querySelector(`textarea[name="${sec.key}"]`);
        data[sec.key] = ta ? ta.value : '';
      }
    });

    answers[stepId] = data;
    saveDraft();
  }

  async function submitAnamnesis() {
    const btn = document.getElementById('btn-next');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Processando...'; }

    const allAnswers = Object.values(answers).reduce((acc, v) => ({ ...acc, ...v }), {});

    try {
      console.log("[Anamnesis] Starting submit process...");
      console.log("[Anamnesis] Payload to be saved:", allAnswers);

      // Save to backend - Com timeout pra não travar pra sempre se o DB engasgar
      const savePromise = store.submitAnamnesis(token, allAnswers);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout salvando no banco')), 6000));

      try {
        await Promise.race([savePromise, timeoutPromise]);
        console.log("[Anamnesis] Salvo no DB com sucesso!");
      } catch (dbErr) {
        console.warn("[Anamnesis] Falha leve ao salvar DB (Prosseguindo para o laudo):", dbErr);
        toast('O form foi salvo localmente, mas a nuvem pode ter falhado.', 'warning');
      }

      // Prepare UI transition
      const rawPayload = JSON.stringify({
        answers: allAnswers,
        consultant: { 
            name: consultoraNome, 
            genero: anamneseData.consultora_genero, 
            phone: anamneseData.consultora_telefone, 
            link: window.location.origin + '/#anamnese/' + token,
            link_afiliada: anamneseData.consultora_link_afiliada 
        },
        clientName: allAnswers.full_name || 'Empreendedor'
      });

      console.log("[Anamnesis] Saving to sessionStorage...");
      sessionStorage.setItem('tempAnamnesisPayload', rawPayload);
      clearDraft(); // Draft no longer needed after successful submit

      console.log("[Anamnesis] Routing to next page...");
      let nextRoute = '/protocolo';
      if (isBusiness) nextRoute = '/business-report';
      else if (isVendaDireta) nextRoute = '/recomendacao-uau';

      // Delay minúsculo pra garantir gravação no DOM e sessionStorage antes da quebra da Hash
      setTimeout(() => {
        try {
          router.navigate(nextRoute);
        } catch (routeErr) {
          console.error("[Anamnesis] Router falhou. Forçando window.location.hash");
          window.location.hash = '#' + nextRoute;
        }
      }, 100);

    } catch (err) {
      console.error("[Anamnesis] Fatal Error:", err);
      toast('Sessão expirada. Recarregando.', 'error');
      setTimeout(() => window.location.reload(), 2000);
    }
  }

  // Restore draft if available
  const hadDraft = restoreDraft();
  renderStep();
  if (hadDraft) {
    toast('Rascunho recuperado ✏️ Continue de onde parou!', 'info', 4000);
  }
}
