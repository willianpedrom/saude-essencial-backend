import { store, api } from '../store.js';
import { toast } from '../utils.js';

export async function renderSalesAnamnesis(router, token) {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-size:1.2rem;color:#4a4a4a">
      <div style="text-align:center">
        <div style="font-size:3rem;margin-bottom:16px">💧</div>
        <div>Carregando formulário...</div>
      </div>
    </div>`;

  let template;
  try {
    // Reusing the general api helper from store.js
    template = await api('GET', `/api/sales/public/capture/${token}`);
  } catch (err) {
    app.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh">
          <div style="text-align:center;padding:60px 40px">
            <h2 style="color:#2d4a28;font-family:'Playfair Display', serif">Ops! Link inválido</h2>
            <p style="color:#888;margin-top:8px">Este link de captação não existe ou foi desativado.</p>
            <button class="btn btn-primary" onclick="window.location.href='/'" style="margin-top:20px">Ir para o Início</button>
          </div>
        </div>`;
    return;
  }

  const questions = template.dados.perguntas || [];

  function render() {
    app.innerHTML = `
      <style>
        .sales-page {
          min-height: 100vh;
          background: radial-gradient(circle at 0% 0%, #065f46 0%, #064e3b 50%, #022c22 100%);
          font-family: 'Inter', sans-serif;
          color: white;
          padding: 60px 20px;
          position: relative;
          overflow: hidden;
        }
        .light-blob {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          z-index: 0;
          pointer-events: none;
        }
        .blob-1 { top: -100px; left: -100px; animation: move 20s infinite alternate; }
        .blob-2 { bottom: -200px; right: -100px; animation: move 25s infinite alternate-reverse; }
        
        @keyframes move {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(100px, 50px) scale(1.2); }
        }

        .capture-card {
          max-width: 550px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 32px;
          padding: 48px;
          color: #1e293b;
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.6);
          border: 1px solid rgba(234, 179, 8, 0.2);
          position: relative;
          z-index: 1;
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .form-label { display: block; font-size: 0.9rem; font-weight: 600; color: #334155; margin-bottom: 8px; letter-spacing: -0.2px; }
        .form-input { 
          width: 100%; padding: 16px; border: 1px solid #cbd5e1; border-radius: 16px; 
          margin-bottom: 24px; font-size: 1rem; transition: all 0.3s;
          background: #ffffff;
          color: #1e293b;
          box-sizing: border-box;
        }
        .form-input:focus { 
          border-color: #10b981; outline: none; background: white;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
          transform: scale(1.01);
        }
        .btn-submit {
          width: 100%; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 22px;
          border-radius: 20px; font-weight: 900; font-size: 1.2rem; cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 15px 30px -5px rgba(16, 185, 129, 0.4);
          margin-top: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .btn-submit:hover { 
          transform: translateY(-4px) scale(1.02); 
          box-shadow: 0 25px 40px -10px rgba(16, 185, 129, 0.5);
          background: linear-gradient(135deg, #10b981, #047857);
        }
        .btn-submit:active { transform: translateY(-1px); }
        
        .badge-present {
          display: inline-flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, #fef9c3, #fde047);
          color: #854d0e; padding: 8px 16px; border-radius: 100px;
          font-weight: 800; font-size: 0.8rem; margin-bottom: 24px;
          box-shadow: 0 4px 10px rgba(234, 179, 8, 0.3);
        }
      </style>

      <div class="sales-page">
        <div class="light-blob blob-1"></div>
        <div class="light-blob blob-2"></div>

        <div style="text-align:center; margin-bottom: 50px; position:relative; z-index:1">
          <img src="/img/logo_premium.png" width="120" style="margin-bottom:24px; filter: drop-shadow(0 0 20px rgba(255,255,255,0.2))" alt="Gota App">
          <h1 style="font-size:2.8rem; margin:0; font-family:'Playfair Display', serif; line-height:1.1; letter-spacing:-1px">
            Seu Presente VIP: 7 Dias de Acesso ao <span style="color:#eab308; background: linear-gradient(to right, #fde047, #eab308); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Gota App</span> 🎁
          </h1>
          <p style="color:rgba(255,255,255,0.8); margin-top:16px; font-size:1.2rem; max-width:550px; margin-left:auto; margin-right:auto; line-height:1.6">
            Complete seu perfil e desbloqueie as ferramentas que vão acelerar seu crescimento na dōTERRA.
          </p>
        </div>

        <div class="capture-card">
          <div style="text-align:center">
            <div class="badge-present">
              <span>💎</span> ACESSO PREMIUM LIBERADO
            </div>
          </div>

          <h3 style="margin-top:0; margin-bottom:32px; font-size:1.4rem; color:#064e3b; display:flex; align-items:center; gap:10px">
            <span style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; background:#f0fdf4; border-radius:10px; font-size:1.2rem">👤</span> 
            Seus Dados de Contato
          </h3>
          
          <label class="form-label">Nome Completo *</label>
          <input type="text" id="lead-nome" class="form-input" placeholder="Como podemos te chamar?">

          <label class="form-label">E-mail Profissional *</label>
          <input type="email" id="lead-email" class="form-input" placeholder="exemplo@email.com">

          <label class="form-label">WhatsApp (com DDD) *</label>
          <input type="tel" id="lead-telefone" class="form-input" placeholder="(00) 00000-0000">

          <label class="form-label">Cidade / Estado</label>
          <input type="text" id="lead-cidade" class="form-input" placeholder="Onde você mora?">

          <div style="height:1px; background:#f1f5f9; margin:20px 0 40px"></div>

          <h3 style="margin-top:0; margin-bottom:32px; font-size:1.4rem; color:#064e3b; display:flex; align-items:center; gap:10px">
            <span style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; background:#f0fdf4; border-radius:100px; font-size:1.2rem">🚀</span> 
            Sobre sua Jornada
          </h3>

          ${questions.map(q => `
            <label class="form-label">${q.texto}</label>
            ${q.tipo === 'textarea' 
              ? `<textarea id="q-${q.id}" class="form-input" style="height:120px" placeholder="Fale um pouco sobre isso..."></textarea>`
              : q.tipo === 'select'
                ? `<select id="q-${q.id}" class="form-input">
                    <option value="">— Selecione uma opção —</option>
                    ${q.opcoes.map(o => `<option value="${o}">${o}</option>`).join('')}
                   </select>`
                : `<input type="text" id="q-${q.id}" class="form-input" placeholder="Digite sua resposta...">`
            }
          `).join('')}

          <button class="btn-submit" id="btn-submit-lead">RESGATAR MEU PRESENTE AGORA! 🎁</button>
          
          <div style="display:flex; justify-content:center; gap:20px; margin-top:32px; opacity:0.6; filter:grayscale(1)">
             <div style="display:flex; align-items:center; gap:6px; font-size:0.75rem; color:#64748b">
               <span>🔒</span> Conexão Segura
             </div>
             <div style="display:flex; align-items:center; gap:6px; font-size:0.75rem; color:#64748b">
               <span>⭐</span> +1000 Consultoras
             </div>
          </div>
        </div>

        <div style="text-align:center; margin-top:60px; color:rgba(255,255,255,0.4); font-size:0.8rem">
          © 2026 Gota App — Sua Parceira na Aromaterapia Profissional
        </div>
      </div>
    `;

    document.getElementById('btn-submit-lead').addEventListener('click', async () => {
      const nome = document.getElementById('lead-nome').value.trim();
      const email = document.getElementById('lead-email').value.trim();
      const telefone = document.getElementById('lead-telefone').value.trim();
      const cidade = document.getElementById('lead-cidade').value.trim();

      if (!nome || !email || !telefone) return toast('Os campos com * são obrigatórios!', 'warning');

      const respostas = {};
      questions.forEach(q => {
        respostas[q.id] = document.getElementById(`q-${q.id}`).value;
      });

      const btn = document.getElementById('btn-submit-lead');
      btn.disabled = true;
      btn.innerText = '⏳ Enviando...';

      try {
        const response = await api('POST', `/api/sales/public/capture/${token}/submit`, { nome, email, telefone, cidade, respostas });
        
        const data = response;
        const isNewAccount = !!data.account_created;
        const loginUrl = `${window.location.origin}${window.location.pathname}#/login`;
        const regUrl = `${window.location.origin}${window.location.pathname}#/login?register=true&nome=${encodeURIComponent(nome)}&email=${encodeURIComponent(email)}&tel=${encodeURIComponent(telefone)}`;

        app.innerHTML = `
          <div class="sales-page" style="display:flex;align-items:center;justify-content:center;padding:20px;min-height:100vh; position:relative; overflow:hidden">
            <div class="light-blob blob-1"></div>
            <div class="light-blob blob-2"></div>

            <div class="capture-card" style="text-align:center; padding:60px 48px; border:none; box-shadow: 0 40px 100px rgba(0,0,0,0.5); max-width:500px; position:relative; z-index:1">
              <div style="font-size:5rem;margin-bottom:24px;filter:drop-shadow(0 15px 25px rgba(234, 179, 8, 0.4))">🎁</div>
              
              <h2 style="color:#064e3b; font-size:2.4rem; font-family:'Playfair Display', serif; margin-bottom:12px; line-height:1.1">Seu Presente Está Pronto, ${nome.split(' ')[0]}!</h2>
              <div class="badge-present" style="margin-bottom:32px">✨ PERFIL VIP APROVADO</div>
              
              ${isNewAccount ? `
                <p style="color:#475569; margin-bottom:24px; line-height:1.6; font-size:1.1rem">
                  Sua conta VIP de 7 dias foi <strong>ativada com sucesso!</strong>
                </p>
                <div style="background:#f0fdf4; border:1px solid #dcfce7; border-radius:20px; padding:24px; margin-bottom:32px; text-align:left">
                  <p style="color:#166534; font-weight:800; font-size:1rem; margin-bottom:8px">📧 Verifique seu e-mail agora</p>
                  <p style="color:#166534; font-size:0.9rem; line-height:1.5; opacity:0.8">
                    Enviamos seus dados de acesso exclusivos para <strong>${email}</strong>.<br><br>
                    <span style="color:#dc2626; font-weight:700">⚠ Não esqueça de checar a aba de Promoções ou SPAM.</span>
                  </p>
                </div>
                <a href="/" style="display:block; width:100%; text-decoration:none; background: linear-gradient(135deg, #10b981, #059669); color:white; padding:22px; border-radius:20px; font-weight:900; font-size:1.2rem; box-shadow: 0 15px 30px rgba(16, 185, 129, 0.4); transition: all 0.3s; box-sizing:border-box">
                  ACESSAR MEU PAINEL 🚀
                </a>
              ` : `
                <p style="color:#475569; margin-bottom:32px; line-height:1.6; font-size:1.1rem">
                  Identificamos que você já faz parte da nossa comunidade! Seu acesso trial está pronto para ser renovado.
                </p>
                <a href="${regUrl}" style="display:block; width:100%; text-decoration:none; background: linear-gradient(135deg, #10b981, #059669); color:white; padding:22px; border-radius:20px; font-weight:900; font-size:1.2rem; box-shadow: 0 15px 30px rgba(16, 185, 129, 0.4); transition: all 0.3s; box-sizing:border-box; animation: pulse-btn 2s infinite">
                  ATIVAR MEU ACESSO AGORA! 🚀
                </a>
              `}
              
              <p style="margin-top:32px; font-size:0.9rem">
                <a href="https://www.gotaapp.com.br/doterra" style="color:#94a3b8; text-decoration:none; transition:color 0.2s; font-weight:600">Voltar ao site oficial</a>
              </p>
            </div>
          </div>
          <style>
             .sales-page { background: radial-gradient(circle at 0% 0%, #065f46 0%, #064e3b 50%, #022c22 100%); font-family: 'Inter', sans-serif; }
             .light-blob { position: absolute; width: 500px; height: 500px; background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
             .blob-1 { top: -100px; left: -100px; animation: move 20s infinite alternate; }
             .blob-2 { bottom: -200px; right: -100px; animation: move 25s infinite alternate-reverse; }
             @keyframes move { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(100px, 50px) scale(1.2); } }
             @keyframes pulse-btn { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
             .capture-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 32px; }
             .badge-present { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #fef9c3, #fde047); color: #854d0e; padding: 8px 16px; border-radius: 100px; font-weight: 800; font-size: 0.8rem; }
          </style>
        `;

      } catch (err) {
        btn.disabled = false;
        btn.innerText = 'Quero Garantir Meu Acesso! 🚀';
        toast('Erro ao enviar dados: ' + err.message, 'error');
      }
    });
  }

  render();
}
