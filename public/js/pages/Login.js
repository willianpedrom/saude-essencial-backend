import { auth } from '../store.js';
import { toast } from '../utils.js';

export function renderLogin(router) {
  // Check for reset-password token in URL
  const hash = window.location.hash;
  const resetMatch = hash.match(/reset-password\?token=([a-f0-9]+)/);
  const resetToken = resetMatch ? resetMatch[1] : null;

  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="auth-page">
    <div class="auth-orbs">
      <div class="auth-orb" style="width:400px;height:400px;top:-100px;left:-100px;opacity:0.4"></div>
      <div class="auth-orb" style="width:300px;height:300px;bottom:-80px;right:-80px;opacity:0.3;animation-delay:3s"></div>
    </div>
    <div class="auth-card">
      <div class="auth-logo" style="margin-bottom:32px; display:flex; flex-direction:row; align-items:center; justify-content:center; gap:16px;">
        <img src="/icon-512.png" alt="Gota App Logo" style="width:75px; height:auto; object-fit:contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15));" />
        <div style="display:flex; flex-direction:column; align-items:flex-start; justify-content:center; margin-top:-4px;">
          <h1 style="font-family: var(--font-family, 'Inter', sans-serif); font-size: 2.8rem; font-weight: 700; color: #ffffff; letter-spacing: 1px; margin: 0; line-height: 1.1;">GOTA APP</h1>
          <p style="font-family: var(--font-family, 'Inter', sans-serif); font-size: 0.95rem; font-weight: 500; color: #ffffff; margin: 0; letter-spacing: 0.2px;">Gestão Essencial de Relacionamento</p>
        </div>
      </div>

      <!-- LOGIN -->
      <div id="panel-login" ${resetToken ? 'style="display:none"' : ''}>
        <div style="text-align:center;margin-bottom:16px;">
          <h2 style="margin:0;font-size:1.4rem;font-weight:700;">Bem-vinda (o)</h2>
          <p style="color:var(--text-muted);font-size:0.9rem;margin-top:4px;">Faça login para continuar</p>
        </div>
        <form class="auth-form" id="login-form">
          <div class="form-group">
            <label class="form-label">E-mail</label>
            <input class="form-input" type="email" id="login-email" placeholder="seu@email.com" required />
          </div>
          <div class="form-group">
            <label class="form-label">Senha</label>
            <div style="position:relative">
              <input class="form-input" type="password" id="login-password" placeholder="••••••••" required style="padding-right:44px" />
              <button type="button" class="toggle-pw" data-target="login-password" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.1rem;opacity:0.5;padding:4px 6px" title="Mostrar senha">👁️</button>
            </div>
          </div>
          <div class="auth-error" id="login-error"></div>
          <button class="btn-auth" type="submit" id="login-btn">Acessar minha área ✦</button>
          <p class="auth-link-area" style="display:flex;flex-direction:column;align-items:center;gap:12px;font-size:0.85rem;margin-top:20px;">
            <a href="https://www.gotaapp.com.br/doterra" target="_blank" style="color:var(--primary-color);text-decoration:none;font-weight:600;transition:opacity 0.2s" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">Ainda não tem o Gota App? Assine agora ✨</a>
            <span class="auth-link" id="link-forgot" style="color:var(--text-muted);cursor:pointer;">Esqueci minha senha</span>
          </p>
        </form>


      </div>

      <!-- TERMS ACCEPTANCE -->
      <div id="panel-terms" style="display:none">
        <div style="text-align:center;margin-bottom:20px;padding:20px">
          <div style="font-size:2.5rem">📄</div>
          <h2 style="margin:8px 0 4px;font-size:1.1rem">Atualizamos nossos Termos</h2>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:16px">
            Para continuar acessando o Gota App, leia e aceite nossos novos Termos de Uso.
          </p>
          <a href="/termos.html" target="_blank" style="display:inline-block;padding:8px 16px;background:#f1f5f9;border-radius:6px;color:var(--primary-color);font-weight:600;text-decoration:none;margin-bottom:24px;border:1px solid #cbd5e1">
            Ler Termos de Uso Completos
          </a>
          <div class="auth-error" id="terms-error"></div>
          <button class="btn-auth" id="btn-accept-terms">Li e Aceito (Entrar no Painel)</button>
        </div>
      </div>

      <!-- FORGOT PASSWORD -->
      <div id="panel-forgot" style="display:none">
        <div style="text-align:center;margin-bottom:20px">
          <div style="font-size:2.5rem">🔐</div>
          <h2 style="margin:8px 0 4px;font-size:1.1rem">Recuperar Senha</h2>
          <p style="font-size:0.85rem;color:var(--text-muted);margin:0">Digite seu e-mail e enviaremos o link de recuperação.</p>
        </div>
        <form class="auth-form" id="forgot-form" style="display:block">
          <div class="form-group">
            <label class="form-label">E-mail cadastrado</label>
            <input class="form-input" type="email" id="forgot-email" placeholder="seu@email.com" required />
          </div>
          <div class="auth-error" id="forgot-error"></div>
          <div id="forgot-success" style="display:none;background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px;font-size:0.88rem;color:#166534;text-align:center;margin-bottom:12px">
            ✅ Email enviado! Verifique sua caixa de entrada (e span).
          </div>
          <button class="btn-auth" type="submit" id="forgot-btn">📧 Enviar link de recuperação</button>
          <p class="auth-link-area">
            <span class="auth-link" id="link-back-login">← Voltar para o login</span>
          </p>
        </form>
      </div>

      <!-- RESET PASSWORD (via token no link do email) -->
      <div id="panel-reset" style="display:${resetToken ? 'block' : 'none'}">
        <div style="text-align:center;margin-bottom:20px">
          <div style="font-size:2.5rem">🔑</div>
          <h2 style="margin:8px 0 4px;font-size:1.1rem">Nova Senha</h2>
          <p style="font-size:0.85rem;color:var(--text-muted);margin:0">Escolha uma senha forte para sua conta.</p>
        </div>
        <form class="auth-form" id="reset-form" style="display:block">
          <div class="form-group">
            <label class="form-label">Nova Senha</label>
            <div style="position:relative">
              <input class="form-input" type="password" id="reset-password" placeholder="Mínimo 8 caracteres" required style="padding-right:44px" />
              <button type="button" class="toggle-pw" data-target="reset-password" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.1rem;opacity:0.5;padding:4px 6px">👁️</button>
            </div>
            <div id="reset-strength" style="margin-top:6px;font-size:0.78rem"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Confirmar Nova Senha</label>
            <input class="form-input" type="password" id="reset-confirm" placeholder="Repita a nova senha" required />
          </div>
          <div class="auth-error" id="reset-error"></div>
          <button class="btn-auth" type="submit" id="reset-btn">🔐 Redefinir Senha</button>
        </form>
        <div id="reset-success" style="display:none;text-align:center;padding:20px">
          <div style="font-size:3rem">✅</div>
          <h3 style="color:#16a34a;margin:12px 0 8px">Senha redefinida!</h3>
          <p style="color:var(--text-muted);font-size:0.9rem">Agora faça login com sua nova senha.</p>
          <button class="btn-auth" id="btn-go-login" style="margin-top:16px">Ir para o Login</button>
        </div>
      </div>

    </div>
  </div>`;

  // ── Toggle show/hide password ───────────────────────────────────────────
  app.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.textContent = isHidden ? '🙈' : '👁️';
      btn.style.opacity = isHidden ? '0.8' : '0.5';
    });
  });



  // ── Forgot password link ────────────────────────────────────────────────
  document.getElementById('link-forgot')?.addEventListener('click', () => {
    document.getElementById('panel-login').style.display = 'none';
    document.getElementById('panel-forgot').style.display = 'block';
  });

  document.getElementById('link-back-login')?.addEventListener('click', () => {
    document.getElementById('panel-forgot').style.display = 'none';
    document.getElementById('panel-login').style.display = 'block';
  });

  // ── Forgot password form ────────────────────────────────────────────────
  document.getElementById('forgot-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();
    const errEl = document.getElementById('forgot-error');
    const successEl = document.getElementById('forgot-success');
    const btn = document.getElementById('forgot-btn');
    btn.disabled = true; btn.textContent = '⏳ Enviando...';
    errEl.textContent = ''; errEl.classList.remove('show');
    successEl.style.display = 'none';
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Always show success (even if email not found — security)
      successEl.style.display = 'block';
      btn.textContent = '✅ Email enviado';
    } catch (err) {
      errEl.textContent = 'Erro ao enviar. Tente novamente.';
      errEl.classList.add('show');
      btn.disabled = false; btn.textContent = '📧 Enviar link de recuperação';
    }
  });

  // ── Reset password strength indicator ──────────────────────────────────
  document.getElementById('reset-password')?.addEventListener('input', e => {
    const val = e.target.value;
    const el = document.getElementById('reset-strength');
    if (!val) { el.textContent = ''; return; }
    const s = val.length >= 12 && /[A-Z]/.test(val) && /[0-9]/.test(val)
      ? { label: 'Forte 💪', color: '#16a34a' }
      : val.length >= 8 ? { label: 'Razoável 😐', color: '#d97706' }
        : { label: 'Fraca ⚠️', color: '#dc2626' };
    el.innerHTML = `<span style="color:${s.color};font-weight:600">${s.label}</span>`;
  });



  // ── Reset password form ─────────────────────────────────────────────────
  document.getElementById('reset-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const novaSenha = document.getElementById('reset-password').value;
    const confirmarSenha = document.getElementById('reset-confirm').value;
    const errEl = document.getElementById('reset-error');
    const btn = document.getElementById('reset-btn');
    btn.disabled = true; btn.textContent = '⏳ Redefinindo...';
    errEl.textContent = ''; errEl.classList.remove('show');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, novaSenha, confirmarSenha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao redefinir senha.');
      document.getElementById('reset-form').style.display = 'none';
      document.getElementById('reset-success').style.display = 'block';
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.add('show');
      btn.disabled = false; btn.textContent = '🔐 Redefinir Senha';
    }
  });

  document.getElementById('btn-go-login')?.addEventListener('click', () => {
    window.location.hash = '#/login';
    router.navigate('/login');
  });

  // ── Login form ──────────────────────────────────────────────────────────
  document.getElementById('login-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');
    btn.disabled = true; btn.textContent = 'Entrando...';
    try {
      const data = await auth.login(email, senha);
      if (data && data.needs_terms_acceptance) {
         window.__pendingTermsEmail = email;
         document.getElementById('panel-login').style.display = 'none';
         document.getElementById('panel-terms').style.display = 'block';
         return;
      }
      toast('Bem-vinda de volta! 💧', 'success');
      router.navigate('/dashboard');
    } catch (err) {
      errEl.textContent = err.message || 'E-mail ou senha incorretos.';
      errEl.classList.add('show');
      btn.disabled = false; btn.textContent = 'Acessar minha área ✦';
    }
  });



  // ── Accept Terms form ───────────────────────────────────────────────────
  document.getElementById('btn-accept-terms')?.addEventListener('click', async () => {
    const errEl = document.getElementById('terms-error');
    const btn = document.getElementById('btn-accept-terms');
    btn.disabled = true; btn.textContent = 'Aguarde...';
    try {
      await auth.acceptTerms(window.__pendingTermsEmail);
      toast('Termos aceitos! Bem-vinda 💧', 'success');
      router.navigate('/dashboard');
    } catch (err) {
      errEl.textContent = err.message || 'Erro ao aceitar termos.';
      errEl.classList.add('show');
      btn.disabled = false; btn.textContent = 'Li e Aceito (Entrar no Painel)';
    }
  });
}

// ── Tela dedicada de redefinição de senha (rota: /#/reset-password?token=...) ──
export function renderResetPassword(router) {
  // Token está na query string do hash: #/reset-password?token=abc123
  const queryString = window.location.hash.split('?')[1] || '';
  const params = new URLSearchParams(queryString);
  const resetToken = params.get('token');

  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="auth-page">
    <div class="auth-orbs">
      <div class="auth-orb" style="width:400px;height:400px;top:-100px;left:-100px;opacity:0.4"></div>
      <div class="auth-orb" style="width:300px;height:300px;bottom:-80px;right:-80px;opacity:0.3;animation-delay:3s"></div>
    </div>
    <div class="auth-card">
      <div class="auth-logo" style="margin-bottom:12px">
        <img src="/logo.png?v=17" alt="Gota App" style="height:120px;width:auto;object-fit:contain" />
      </div>

      ${!resetToken ? `
        <div style="text-align:center;padding:24px">
          <div style="font-size:2.5rem">❌</div>
          <h3 style="color:#dc2626">Link inválido</h3>
          <p style="color:var(--text-muted);font-size:0.9rem">Este link de recuperação é inválido ou expirou.</p>
          <button class="btn-auth" id="btn-go-login" style="margin-top:16px">← Voltar para o login</button>
        </div>
      ` : `
        <div id="reset-main">
          <div style="text-align:center;margin-bottom:20px">
            <div style="font-size:2.5rem">🔑</div>
            <h2 style="margin:8px 0 4px;font-size:1.1rem">Nova Senha</h2>
            <p style="font-size:0.85rem;color:var(--text-muted);margin:0">Escolha uma senha forte para sua conta.</p>
          </div>
          <form id="reset-form">
            <div class="form-group">
              <label class="form-label">Nova Senha</label>
              <div style="position:relative">
                <input class="form-input" type="password" id="reset-password" placeholder="Mínimo 8 caracteres" required style="padding-right:44px" />
                <button type="button" class="toggle-pw" data-target="reset-password" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.1rem;opacity:0.5;padding:4px 6px">👁️</button>
              </div>
              <div id="reset-strength" style="margin-top:6px;font-size:0.78rem"></div>
            </div>
            <div class="form-group">
              <label class="form-label">Confirmar Nova Senha</label>
              <input class="form-input" type="password" id="reset-confirm" placeholder="Repita a nova senha" required />
            </div>
            <div class="auth-error" id="reset-error"></div>
            <button class="btn-auth" type="submit" id="reset-btn">🔐 Redefinir Senha</button>
          </form>
        </div>
        <div id="reset-success" style="display:none;text-align:center;padding:20px">
          <div style="font-size:3rem">✅</div>
          <h3 style="color:#16a34a;margin:12px 0 8px">Senha redefinida!</h3>
          <p style="color:var(--text-muted);font-size:0.9rem">Faça login com sua nova senha.</p>
          <button class="btn-auth" id="btn-go-login-ok" style="margin-top:16px">Ir para o Login</button>
        </div>
      `}
    </div>
  </div>`;

  // Back to login
  app.querySelector('#btn-go-login')?.addEventListener('click', () => router.navigate('/'));
  app.querySelector('#btn-go-login-ok')?.addEventListener('click', () => router.navigate('/'));

  // Toggle pw visibility
  app.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.textContent = isHidden ? '🙈' : '👁️';
    });
  });

  // Strength indicator
  app.querySelector('#reset-password')?.addEventListener('input', e => {
    const val = e.target.value;
    const el = app.querySelector('#reset-strength');
    if (!el) return;
    if (!val) { el.textContent = ''; return; }
    const s = val.length >= 12 && /[A-Z]/.test(val) && /[0-9]/.test(val)
      ? { label: 'Forte 💪', color: '#16a34a' }
      : val.length >= 8 ? { label: 'Razoável 😐', color: '#d97706' }
        : { label: 'Fraca ⚠️', color: '#dc2626' };
    el.innerHTML = `<span style="color:${s.color};font-weight:600">${s.label}</span>`;
  });

  // Reset form submit
  app.querySelector('#reset-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const novaSenha = app.querySelector('#reset-password').value;
    const confirmarSenha = app.querySelector('#reset-confirm').value;
    const errEl = app.querySelector('#reset-error');
    const btn = app.querySelector('#reset-btn');
    btn.disabled = true; btn.textContent = '⏳ Redefinindo...';
    errEl.textContent = ''; errEl.classList.remove('show');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, novaSenha, confirmarSenha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao redefinir senha.');
      app.querySelector('#reset-main').style.display = 'none';
      app.querySelector('#reset-success').style.display = 'block';
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.add('show');
      btn.disabled = false; btn.textContent = '🔐 Redefinir Senha';
    }
  });
}
