import { api } from '../store.js';
import { injectTrackingScripts, ARCHETYPE_THEMES } from '../utils.js';

export async function renderPublicTestimonial(router, slug) {
  const app = document.getElementById('app');

  // Loading Skeleton
  app.innerHTML = `
    <style>
      @keyframes shimmer { 0% { background-position: -800px 0; } 100% { background-position: 800px 0; } }
      .skel { background: rgba(255,255,255,0.05); background-image: linear-gradient(to right, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.05) 100%); background-repeat: no-repeat; background-size: 800px 100%; animation: shimmer 1.5s infinite linear; border-radius: 8px; }
    </style>
    <div style="min-height:100vh;background:#111827;display:flex;align-items:center;justify-content:center;padding:24px">
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:24px;padding:40px 36px;width:100%;max-width:480px">
        <div class="skel" style="width:72px;height:72px;border-radius:50%;margin:0 auto 12px"></div>
        <div class="skel" style="width:180px;height:24px;margin:0 auto 8px"></div>
        <div class="skel" style="width:260px;height:12px;margin:0 auto 32px"></div>
        <div class="skel" style="width:100px;height:14px;margin-bottom:8px"></div>
        <div class="skel" style="width:100%;height:44px;border-radius:10px;margin-bottom:20px"></div>
        <div class="skel" style="width:140px;height:14px;margin-bottom:8px"></div>
        <div class="skel" style="width:100%;height:120px;border-radius:10px;margin-bottom:20px"></div>
        <div class="skel" style="width:100%;height:50px;border-radius:12px;margin-top:20px"></div>
      </div>
    </div>`;

  // Fetch consultant info
  let consultora;
  try {
    consultora = await api('GET', `/api/depoimentos/public/${slug}`);
  } catch {
    app.innerHTML = `
      <div style="min-height:100vh;background:linear-gradient(135deg,#0a1f0f,#1a4527);display:flex;align-items:center;justify-content:center;padding:20px">
        <div style="text-align:center;color:white">
          <div style="font-size:4rem;margin-bottom:16px">😕</div>
          <h2>Link não encontrado</h2>
          <p style="color:rgba(255,255,255,0.6);margin-top:8px">Este link de depoimento é inválido ou expirou.</p>
        </div>
      </div>`;
    return;
  }

  let rating = 10;
  let submitted = false;

  // Inject consultant's tracking scripts
  injectTrackingScripts(consultora.rastreamento);
  const themeData = ARCHETYPE_THEMES[consultora.tema_cor] || ARCHETYPE_THEMES['curadora'];

  function renderForm() {
    app.innerHTML = `
    <style>
      :root {
        --theme-bg: ${themeData.bg};
        --theme-color: ${themeData.primary};
      }
      .dep-page { min-height:100vh; background:var(--theme-bg); display:flex; align-items:center; justify-content:center; padding:24px; }
      .dep-card { background:rgba(255,255,255,0.07); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.12); border-radius:24px; padding:40px 36px; width:100%; max-width:480px; box-shadow:0 20px 60px rgba(0,0,0,0.4); }
      .dep-header { text-align:center; margin-bottom:32px; }
      .dep-avatar { width:72px; height:72px; border-radius:50%; background:var(--theme-color); display:flex; align-items:center; justify-content:center; font-size:1.8rem; font-weight:700; color:white; margin:0 auto 12px; overflow:hidden; }
      .dep-avatar img { width:100%; height:100%; object-fit:cover; }
      .dep-name { color:white; font-size:1.3rem; font-weight:700; font-family:'Playfair Display',serif; }
      .dep-sub { color:rgba(255,255,255,0.5); font-size:0.82rem; letter-spacing:1px; text-transform:uppercase; margin-top:4px; }
      .dep-group { margin-bottom:18px; }
      .dep-label { color:rgba(255,255,255,0.7); font-size:0.82rem; font-weight:500; margin-bottom:6px; display:block; letter-spacing:0.5px; }
      .dep-input, .dep-textarea { width:100%; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:10px; padding:12px 16px; color:white; font-size:0.95rem; font-family:'Inter',sans-serif; outline:none; transition:border-color 0.2s; box-sizing:border-box; }
      .dep-input::placeholder, .dep-textarea::placeholder { color:rgba(255,255,255,0.3); }
      .dep-input:focus, .dep-textarea:focus { border-color:var(--theme-color); box-shadow:0 0 0 3px rgba(255,255,255,0.15); }
      .dep-textarea { min-height:120px; resize:vertical; }
      .dep-stars { display:flex; gap:10px; }
      .dep-star { font-size:2rem; cursor:pointer; transition:transform 0.15s; }
      .dep-star:hover { transform:scale(1.2); }
      .nps-grid { display:grid; grid-template-columns: repeat(11, 1fr); gap:6px; margin-top:8px; }
      @media (max-width: 540px) { .nps-grid { grid-template-columns: repeat(6, 1fr); gap:5px; } }
      .nps-btn { display:flex; align-items:center; justify-content:center; height:44px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:white; font-size:1.05rem; font-weight:600; cursor:pointer; transition:all 0.2s; }
      .nps-btn:hover { background:rgba(255,255,255,0.15); transform:translateY(-2px); }
      .nps-btn.active { background:var(--theme-color); color:white; border-color:var(--theme-color); transform:scale(1.05); box-shadow:0 4px 12px rgba(0,0,0,0.3); }
      .nps-labels { display:flex; justify-content:space-between; margin-top:8px; font-size:0.75rem; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.5px; }
      .checkbox-container { display:flex; align-items:flex-start; gap:12px; margin-top:20px; margin-bottom:12px; cursor:pointer; }
      .checkbox-container input { margin-top:3px; cursor:pointer; width:18px; height:18px; accent-color:var(--theme-color); }
      .checkbox-text { color:rgba(255,255,255,0.7); font-size:0.85rem; line-height:1.4; }
      .dep-btn { width:100%; padding:15px; border:none; border-radius:12px; background:var(--theme-color); color:white; font-weight:700; font-size:1rem; font-family:'Inter',sans-serif; cursor:pointer; transition:all 0.25s; margin-top:8px; letter-spacing:0.5px; }
      .dep-btn:hover { transform:translateY(-2px); filter:brightness(1.1); box-shadow:0 8px 25px rgba(0,0,0,0.4); }
      .dep-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
      .dep-error { color:#ff6b6b; font-size:0.82rem; text-align:center; margin-top:8px; display:none; }
    </style>
    <div class="dep-page">
      <div class="dep-card">
        <div class="dep-header">
          <div class="dep-avatar">
            ${consultora.foto_url ? `<img src="${consultora.foto_url}" alt="${consultora.nome}" />` : (consultora.nome || 'C')[0]}
          </div>
          <div class="dep-name">${consultora.nome}</div>
          <div class="dep-sub" style="text-transform:none;letter-spacing:normal;font-size:0.9rem;line-height:1.4">Escreva abaixo seu depoimento de transformação para inspirar outras pessoas com a sua história</div>
        </div>

        <div class="dep-group">
          <label class="dep-label">Seu nome *</label>
          <input class="dep-input" id="dep-nome" placeholder="Como prefere ser chamado(a)?" />
        </div>
        <div class="dep-group">
          <label class="dep-label">Telefone / WhatsApp *</label>
          <input class="dep-input" id="dep-telefone" placeholder="(11) 99999-9999" />
        </div>
        <div class="dep-group">
          <label class="dep-label">E-mail *</label>
          <input class="dep-input" id="dep-email" type="email" placeholder="seuemail@exemplo.com" />
        </div>
        <div class="dep-group">
          <label class="dep-label">De 0 a 10, o quanto você recomendaria o meu acompanhamento a um amigo?</label>
          <div class="nps-grid" id="dep-nps">
            ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<div class="nps-btn ${n === 10 ? 'active' : ''}" data-score="${n}">${n}</div>`).join('')}
          </div>
          <div class="nps-labels">
            <span>Nada Provável</span>
            <span>Muito Provável</span>
          </div>
        </div>
        <div class="dep-group">
          <label class="dep-label">Seu depoimento *</label>
          <textarea class="dep-textarea" id="dep-texto" placeholder="Conte como os óleos essenciais transformaram sua vida, quais resultados você teve, como se sentiu..."></textarea>
        </div>

        <label class="checkbox-container">
          <input type="checkbox" id="dep-consentimento" />
          <span class="checkbox-text">Autorizo o uso deste depoimento, acompanhado do meu nome, para fins de divulgação e prova social.</span>
        </label>

        <div class="dep-error" id="dep-error"></div>
        <button class="dep-btn" id="dep-submit">Enviar Depoimento 💧</button>
      </div>

      <!-- Mural de depoimentos aprovados (carregado dinamicamente) -->
      <div id="dep-mural" style="width:100%;max-width:480px;margin-top:0"></div>

    </div>`;

    // NPS rating logic
    function updateNps() {
      document.querySelectorAll('.nps-btn').forEach(btn => {
        if (parseInt(btn.dataset.score) === rating) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
    document.querySelectorAll('.nps-btn').forEach(btn => {
      btn.addEventListener('click', () => { rating = parseInt(btn.dataset.score); updateNps(); });
    });

    // Submit
    document.getElementById('dep-submit')?.addEventListener('click', async () => {
      const nome = document.getElementById('dep-nome')?.value?.trim();
      const telefone = document.getElementById('dep-telefone')?.value?.trim();
      const email = document.getElementById('dep-email')?.value?.trim();
      const texto = document.getElementById('dep-texto')?.value?.trim();
      const consentimento = document.getElementById('dep-consentimento')?.checked;
      const errEl = document.getElementById('dep-error');
      const btn = document.getElementById('dep-submit');

      if (!nome || !texto || !email || !telefone) {
        errEl.textContent = 'Por favor, preencha todos os campos obrigatórios (Nome, Telefone, E-mail e Depoimento).';
        errEl.style.display = 'block';
        return;
      }
      if (!consentimento) {
        errEl.textContent = 'Para prosseguir, você precisa autorizar o uso do seu depoimento marcando a caixa acima.';
        errEl.style.display = 'block';
        return;
      }
      errEl.style.display = 'none';
      btn.disabled = true;
      btn.textContent = '⏳ Enviando...';

      try {
        await api('POST', `/api/depoimentos/public/${slug}`, {
          cliente_nome: nome,
          cliente_email: email,
          cliente_telefone: telefone,
          texto,
          nota: rating,
          consentimento: true
        });
        renderSuccess();
      } catch (err) {
        errEl.textContent = err.message || 'Erro ao enviar. Tente novamente.';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Enviar Depoimento 💧';
      }
    });
  }

  function renderSuccess() {
    app.innerHTML = `
    <style>:root { --theme-bg: ${themeData.bg}; }</style>
    <div style="min-height:100vh;background:var(--theme-bg, linear-gradient(135deg,#0a1f0f 0%,#1a4527 60%,#0f2d17 100%));display:flex;align-items:center;justify-content:center;padding:20px">
      <div style="text-align:center;color:white;max-width:400px">
        <div style="font-size:5rem;margin-bottom:20px;animation:pop 0.5s ease">🎉</div>
        <h2 style="font-family:'Playfair Display',serif;font-size:1.8rem;margin-bottom:12px">Obrigado pelo seu depoimento!</h2>
        <p style="color:rgba(255,255,255,0.65);font-size:1rem;line-height:1.7;margin-bottom:20px">
          Seu depoimento foi recebido e será revisado por ${consultora.nome}.<br>
          Faz toda a diferença para outras pessoas que querem transformar sua saúde! 💚
        </p>
        <div style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:20px;margin-top:16px">
          <div style="font-size:1.5rem;margin-bottom:8px">💧</div>
          <div style="color:rgba(255,255,255,0.8);font-size:0.9rem">Gota App</div>
          <div style="color:rgba(255,255,255,0.45);font-size:0.78rem;margin-top:4px">Plataforma Gota App</div>
        </div>
      </div>
    </div>
    <style>
      @keyframes pop { 0%{transform:scale(0)} 80%{transform:scale(1.15)} 100%{transform:scale(1)} }
    </style>`;
  }

  // ── Carrega e exibe o Mural de Depoimentos aprovados ─────────────
  async function loadMural() {
    let aprovados = [];
    try {
      aprovados = await api('GET', `/api/depoimentos/public/${slug}/lista`);
    } catch { return; } // falha silenciosa — mural é opcional

    if (!aprovados || aprovados.length === 0) return;

    const muralEl = document.getElementById('dep-mural');
    if (!muralEl) return;

    const stars = (nota) => {
      const n = Math.round((nota / 10) * 5);
      return Array.from({ length: 5 }, (_, i) =>
        `<span style="color:${i < n ? '#f59e0b' : 'rgba(255,255,255,0.2)'};font-size:1rem">★</span>`
      ).join('');
    };

    muralEl.innerHTML = `
      <div style="margin-top:48px;padding-top:32px;border-top:1px solid rgba(255,255,255,0.1)">
        <h3 style="color:white;text-align:center;font-family:'Playfair Display',serif;font-size:1.3rem;margin-bottom:24px">
          💬 O que dizem sobre ${consultora.nome}
        </h3>
        <div style="display:flex;flex-direction:column;gap:14px">
          ${aprovados.map(d => {
            const initials = (d.cliente_nome || 'A').substring(0, 2).toUpperCase();
            return `
              <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:18px;transition:background 0.2s"
                   onmouseover="this.style.background='rgba(255,255,255,0.1)'"
                   onmouseout="this.style.background='rgba(255,255,255,0.06)'">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                  <div style="width:40px;height:40px;border-radius:50%;background:${themeData.primary};color:white;
                              font-weight:800;font-size:0.85rem;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    ${initials}
                  </div>
                  <div>
                    <div style="color:white;font-weight:700;font-size:0.9rem">${d.cliente_nome}</div>
                    <div style="margin-top:2px">${stars(d.nota)}</div>
                  </div>
                </div>
                <p style="color:rgba(255,255,255,0.7);font-size:0.88rem;line-height:1.6;margin:0;font-style:italic">
                  "${d.texto}"
                </p>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  renderForm();
  // Carrega mural após renderizar
  loadMural();
}
