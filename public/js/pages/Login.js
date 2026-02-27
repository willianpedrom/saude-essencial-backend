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
      <div class="auth-logo">
        <div class="auth-logo-icon">💧</div>
        <div class="auth-brand">Gota <span>Essencial</span></div>
        <div class="auth-tagline">Plataforma Gota Essencial</div>
      </div>

      <!-- LOGIN -->
      <div id="panel-login" ${resetToken ? 'style="display:none"' : ''}>
        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="login">Entrar</button>
          <button class="auth-tab" data-tab="register">Cadastrar-se</button>
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
          <p class="auth-link-area" style="display:flex;justify-content:space-between;font-size:0.82rem">
            <span class="auth-link" data-tab-link="register">Não tem conta? Cadastre-se grátis</span>
            <span class="auth-link" id="link-forgot" style="color:var(--text-muted)">Esqueci minha senha</span>
          </p>
        </form>

        <!-- REGISTER -->
        <form class="auth-form hidden" id="register-form">
          <div class="form-group">
            <label class="form-label">Nome completo</label>
            <input class="form-input" type="text" id="reg-name" placeholder="Seu nome" required />
          </div>
          <div class="form-group">
            <label class="form-label">E-mail</label>
            <input class="form-input" type="email" id="reg-email" placeholder="seu@email.com" required />
          </div>
          <div class="form-group">
            <label class="form-label">WhatsApp (com DDD)</label>
            <input class="form-input" type="tel" id="reg-phone" placeholder="55119..." />
          </div>
          <div class="form-group">
            <label class="form-label">Gênero</label>
            <select class="form-input" id="reg-genero" required style="padding:12px 14px">
              <option value="feminino">♀ Feminino</option>
              <option value="masculino">♂ Masculino</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Senha</label>
            <div style="position:relative">
              <input class="form-input" type="password" id="reg-password" placeholder="Mínimo 6 caracteres" required minlength="6" style="padding-right:44px" />
              <button type="button" class="toggle-pw" data-target="reg-password" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.1rem;opacity:0.5;padding:4px 6px" title="Mostrar senha">👁️</button>
            </div>
          </div>
          <div class="auth-error" id="reg-error"></div>
          <button class="btn-auth" type="submit" id="reg-btn">Criar minha conta ✦</button>
          <p class="auth-link-area">
            <span class="auth-link" data-tab-link="login">Já tenho conta</span>
          </p>
        </form>
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

  // ── Tab switching ───────────────────────────────────────────────────────
  app.querySelectorAll('.auth-tab, [data-tab-link]').forEach(el => {
    el.addEventListener('click', () => {
      const tab = el.dataset.tab || el.dataset.tabLink;
      app.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
      document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
      document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
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
      await auth.login(email, senha);
      toast('Bem-vinda de volta! 💧', 'success');
      router.navigate('/dashboard');
    } catch (err) {
      errEl.textContent = err.message || 'E-mail ou senha incorretos.';
      errEl.classList.add('show');
      btn.disabled = false; btn.textContent = 'Acessar minha área ✦';
    }
  });

  // ── Register form ───────────────────────────────────────────────────────
  document.getElementById('register-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const nome = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const telefone = document.getElementById('reg-phone').value.trim();
    const genero = document.getElementById('reg-genero').value;
    const senha = document.getElementById('reg-password').value;
    const errEl = document.getElementById('reg-error');
    const btn = document.getElementById('reg-btn');
    btn.disabled = true; btn.textContent = 'Criando conta...';
    try {
      await auth.register(nome, email, senha, telefone, genero);
      toast('Conta criada! 14 dias grátis ativados 💧', 'success');
      router.navigate('/dashboard');
    } catch (err) {
      errEl.textContent = err.message || 'Erro ao criar conta.';
      errEl.classList.add('show');
      btn.disabled = false; btn.textContent = 'Criar minha conta ✦';
    }
  });
}
