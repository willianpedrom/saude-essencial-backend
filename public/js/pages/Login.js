import { auth } from '../store.js';
import { toast } from '../utils.js';

export function renderLogin(router) {
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
      <div class="auth-tabs">
        <button class="auth-tab active" data-tab="login">Entrar</button>
        <button class="auth-tab" data-tab="register">Cadastrar-se</button>
      </div>

      <!-- LOGIN -->
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
        <p class="auth-link-area">
          <span class="auth-link" data-tab-link="register">Não tem conta? Cadastre-se grátis (14 dias grátis)</span>
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
  </div>`;

  // Toggle show/hide password
  app.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      btn.textContent = isHidden ? '🙈' : '👁️';
      btn.title = isHidden ? 'Ocultar senha' : 'Mostrar senha';
      btn.style.opacity = isHidden ? '0.8' : '0.5';
    });
  });

  // Tab switching
  app.querySelectorAll('.auth-tab, [data-tab-link]').forEach(el => {
    el.addEventListener('click', () => {
      const tab = el.dataset.tab || el.dataset.tabLink;
      app.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
      document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
      document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
    });
  });

  // Login
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.textContent = 'Entrando...';
    try {
      await auth.login(email, senha);
      toast('Bem-vinda de volta! 💧', 'success');
      router.navigate('/dashboard');
    } catch (err) {
      errEl.textContent = err.message || 'E-mail ou senha incorretos.';
      errEl.classList.add('show');
      btn.disabled = false;
      btn.textContent = 'Acessar minha área ✦';
    }
  });

  // Register
  document.getElementById('register-form').addEventListener('submit', async e => {
    e.preventDefault();
    const nome = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const telefone = document.getElementById('reg-phone').value.trim();
    const genero = document.getElementById('reg-genero').value;
    const senha = document.getElementById('reg-password').value;
    const errEl = document.getElementById('reg-error');
    const btn = document.getElementById('reg-btn');
    btn.disabled = true;
    btn.textContent = 'Criando conta...';
    try {
      await auth.register(nome, email, senha, telefone, genero);
      toast('Conta criada! 14 dias grátis ativados 💧', 'success');
      router.navigate('/dashboard');
    } catch (err) {
      errEl.textContent = err.message || 'Erro ao criar conta.';
      errEl.classList.add('show');
      btn.disabled = false;
      btn.textContent = 'Criar minha conta ✦';
    }
  });
}
