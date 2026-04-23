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
          background: radial-gradient(circle at 50% -20%, #10b981 0%, #064e3b 40%, #022c22 100%);
          font-family: 'Inter', sans-serif;
          color: white;
          padding: 60px 20px;
        }
        .capture-card {
          max-width: 500px;
          margin: 0 auto;
          background: white;
          border-radius: 24px;
          padding: 32px;
          color: #1e293b;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          animation: fadeUp 0.6s ease forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .form-label { display: block; font-size: 0.8rem; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .form-input { 
          width: 100%; padding: 14px; border: 1px solid #e2e8f0; border-radius: 12px; 
          margin-bottom: 20px; font-size: 1rem; transition: all 0.2s;
          background: #f8fafc;
          color: #1e293b;
        }
        .form-input:focus { 
          border-color: #10b981; outline: none; background: white;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
        .btn-submit {
          width: 100%; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 18px;
          border-radius: 14px; font-weight: 700; font-size: 1.1rem; cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);
          margin-top: 10px;
        }
        .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.4); }
        .btn-submit:active { transform: translateY(0); }
      </style>

      <div class="sales-page">
        <div style="text-align:center; margin-bottom: 40px;">
          <img src="/img/logo_premium.png" width="100" style="margin-bottom:20px" alt="Gota App">
          <h1 style="font-size:2rem; margin:0; font-family:'Playfair Display', serif; line-height:1.2">Sua Carreira de Sucesso com o <span style="color:#eab308">Gota App</span></h1>
          <p style="color:rgba(255,255,255,0.7); margin-top:12px; font-size:1.1rem; max-width:400px; margin-left:auto; margin-right:auto">Queremos te conhecer melhor para oferecer a melhor experiência na plataforma.</p>
        </div>

        <div class="capture-card">
          <h3 style="margin-top:0; margin-bottom:24px; font-size:1.3rem; color:var(--green-900); display:flex; align-items:center; gap:8px">
            <span style="font-size:1.5rem">👤</span> Seus Dados de Contato
          </h3>
          
          <label class="form-label">Nome Completo *</label>
          <input type="text" id="lead-nome" class="form-input" placeholder="Como podemos te chamar?">

          <label class="form-label">E-mail Profissional *</label>
          <input type="email" id="lead-email" class="form-input" placeholder="exemplo@email.com">

          <label class="form-label">WhatsApp (com DDD) *</label>
          <input type="tel" id="lead-telefone" class="form-input" placeholder="(00) 00000-0000">

          <label class="form-label">Cidade / Estado</label>
          <input type="text" id="lead-cidade" class="form-input" placeholder="Onde você mora?">

          <h3 style="margin-top:10px; margin-bottom:24px; font-size:1.3rem; color:var(--green-900); display:flex; align-items:center; gap:8px">
            <span style="font-size:1.5rem">🎯</span> Suas Expectativas
          </h3>

          ${questions.map(q => `
            <label class="form-label">${q.texto}</label>
            ${q.tipo === 'textarea' 
              ? `<textarea id="q-${q.id}" class="form-input" style="height:100px" placeholder="Fale um pouco sobre isso..."></textarea>`
              : q.tipo === 'select'
                ? `<select id="q-${q.id}" class="form-input">
                    <option value="">— Selecione uma opção —</option>
                    ${q.opcoes.map(o => `<option value="${o}">${o}</option>`).join('')}
                   </select>`
                : `<input type="text" id="q-${q.id}" class="form-input" placeholder="Digite sua resposta...">`
            }
          `).join('')}

          <button class="btn-submit" id="btn-submit-lead">Quero Garantir Meu Acesso! 🚀</button>
          <p style="text-align:center; font-size:0.75rem; color:#94a3b8; margin-top:20px">🔒 Seus dados estão seguros e serão usados apenas para contato comercial interno.</p>
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
        await api('POST', `/api/sales/public/capture/${token}/submit`, { nome, email, telefone, cidade, respostas });
        
        // Perceived Value Animation
        app.innerHTML = `
          <div class="sales-page" style="display:flex;align-items:center;justify-content:center">
            <div class="capture-card" style="text-align:center; padding:60px 32px">
              <div class="spinner-approval" style="margin: 0 auto 24px;"></div>
              <h2 style="color:#1e293b; font-size:1.5rem; font-family:'Playfair Display', serif">Analisando seu perfil...</h2>
              <p style="color:#64748b;margin-top:10px">Verificando disponibilidade de vaga para o programa trial.</p>
            </div>
          </div>
          <style>
            .spinner-approval {
              width: 60px; height: 60px;
              border: 5px solid #f3f3f3;
              border-top: 5px solid #10b981;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        `;

        setTimeout(() => {
          const regUrl = `/#/login?register=true&nome=${encodeURIComponent(nome)}&email=${encodeURIComponent(email)}&tel=${encodeURIComponent(telefone)}`;
          
          app.innerHTML = `
            <div class="sales-page" style="display:flex;align-items:center;justify-content:center">
              <div class="capture-card" style="text-align:center; padding:60px 32px; border: 2px solid #10b981">
                <div style="font-size:5rem;margin-bottom:24px">✨</div>
                <h2 style="color:#059669; font-size:2rem; font-family:'Playfair Display', serif">Parabéns, ${nome.split(' ')[0]}!</h2>
                <p style="color:#1e293b; font-weight:700; margin-top:10px">Seu perfil foi PRÉ-APROVADO.</p>
                <p style="color:#475569;margin-top:16px;line-height:1.7;font-size:1rem">
                  Você acaba de ganhar <strong>7 dias de acesso total</strong> à plataforma para transformar sua gestão de óleos essenciais.
                </p>
                
                <button class="btn-submit" onclick="window.location.href='${regUrl}'" style="margin-top:32px; background: linear-gradient(135deg, #059669, #10b981)">
                  ATIVAR MEUS 7 DIAS GRÁTIS 🚀
                </button>
                
                <p style="margin-top:20px; font-size:0.9rem">
                  <a href="https://www.gotaapp.com.br/doterra" style="color:#64748b; text-decoration:underline">Não quero o trial, apenas conhecer o site</a>
                </p>
              </div>
            </div>
          `;
        }, 3000);

      } catch (err) {
        btn.disabled = false;
        btn.innerText = 'Quero Garantir Meu Acesso! 🚀';
        toast('Erro ao enviar dados: ' + err.message, 'error');
      }
    });
  }

  render();
}
