import { store } from '../store.js';
import { ANAMNESIS_QUESTIONS, ANAMNESIS_STEPS, analyzeAnamnesis } from '../data.js';
import { toast } from '../utils.js';

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

  const consultoraNome = anamneseData.consultora_nome || 'Consultora Gota Essencial';
  let currentStep = 0;
  const answers = {};

  function renderStep() {
    const stepDef = ANAMNESIS_STEPS[currentStep];
    const section = ANAMNESIS_QUESTIONS[stepDef.id];
    const isLast = currentStep === ANAMNESIS_STEPS.length - 1;

    app.innerHTML = `
    <div class="anamnesis-public-page">
      <div class="anamnesis-hero">
        <div class="anamnesis-hero-badge">Avaliação de Saúde Natural</div>
        <h1>Seu Protocolo <em>Personalizado</em> de Bem-estar</h1>
        <p>Responda com sinceridade. Quanto mais detalhes, mais preciso será seu protocolo exclusivo.</p>
      </div>

      <div class="anamnesis-consultant-card">
        <div class="consultant-avatar">💧</div>
        <div class="consultant-info">
          <h3>${consultoraNome}</h3>
          <p>Consultora de Saúde Natural · Gota Essencial</p>
        </div>
      </div>

      <div class="anamnesis-container">
        <!-- Progress -->
        <div style="margin-bottom:24px">
          <div style="display:flex;justify-content:space-between;color:rgba(255,255,255,0.5);font-size:0.8rem;margin-bottom:6px">
            <span>${stepDef.icon} ${section.title}</span>
            <span>${currentStep + 1} de ${ANAMNESIS_STEPS.length}</span>
          </div>
          <div style="background:rgba(255,255,255,0.12);border-radius:99px;height:6px">
            <div style="background:linear-gradient(to right,var(--green-400),var(--gold-300));height:6px;border-radius:99px;width:${((currentStep + 1) / ANAMNESIS_STEPS.length * 100).toFixed(0)}%;transition:width 0.4s ease"></div>
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
            ${isLast ? '💧 Gerar Meu Protocolo' : 'Próximo →'}
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
        if (!name || !email || !phone) { toast('Preencha os dados pessoais obrigatórios', 'error'); return; }
      }
      collectAnswers(stepDef.id);
      if (isLast) {
        submitAnamnesis();
      } else {
        currentStep++;
        renderStep();
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (section.fields) {
      return section.fields.map(f => {
        const val = saved[f.name] || '';
        if (['text', 'email', 'tel', 'date'].includes(f.type)) {
          return `<div class="form-group" style="margin-bottom:14px">
              <label class="field-label">${f.label}${f.required ? ' *' : ''}</label>
              <input class="field-input" id="field-${f.name}" type="${f.type}" value="${val}" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''} />
            </div>`;
        }
        return '';
      }).join('');
    }

    return (section.sections || []).map(sec => {
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

  function collectAnswers(stepId) {
    const data = {};
    const fields = ANAMNESIS_QUESTIONS[stepId].fields;
    if (fields) {
      fields.forEach(f => {
        const el = document.getElementById('field-' + f.name);
        if (el) data[f.name] = el.value;
      });
    }
    (ANAMNESIS_QUESTIONS[stepId].sections || []).forEach(sec => {
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
  }

  async function submitAnamnesis() {
    const btn = document.getElementById('btn-next');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Enviando...'; }

    const allAnswers = Object.values(answers).reduce((acc, v) => ({ ...acc, ...v }), {});

    try {
      // Save to backend
      await store.submitAnamnesis(token, allAnswers);

      // Navigate to protocol
      const encoded = encodeURIComponent(JSON.stringify({
        answers: allAnswers,
        consultant: { name: consultoraNome },
        clientName: allAnswers.full_name || 'Cliente'
      }));
      router.navigate('/protocolo', { data: encoded });

    } catch (err) {
      toast('Erro ao enviar: ' + err.message, 'error');
      if (btn) { btn.disabled = false; btn.textContent = '💧 Gerar Meu Protocolo'; }
    }
  }

  renderStep();
}
