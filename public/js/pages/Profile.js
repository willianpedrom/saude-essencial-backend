import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { toast } from '../utils.js';

export async function renderProfile(router) {
  renderLayout(router, 'Meu Perfil',
    `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando perfil...</div>`,
    'profile');

  let profile = {};
  try {
    profile = await store.getProfile();
  } catch {
    profile = auth.current || {};
  }

  function getInitials(nome) {
    return (nome || '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  }

  function render() {
    const pc = document.getElementById('page-content');
    if (!pc) return;

    const fotoSrc = profile.foto_url || '';
    const initials = getInitials(profile.nome);

    pc.innerHTML = `
      <div style="max-width:700px;margin:0 auto">

        <!-- Photo + Name header card -->
        <div class="card" style="margin-bottom:20px;padding:28px">
          <div style="display:flex;align-items:flex-start;gap:24px;flex-wrap:wrap">

            <!-- Avatar -->
            <div style="position:relative;flex-shrink:0">
              <div id="avatar-display" style="width:100px;height:100px;border-radius:50%;overflow:hidden;
                border:3px solid var(--green-400);display:flex;align-items:center;justify-content:center;
                background:linear-gradient(135deg,#2d4a28,#4a7c40);cursor:pointer;position:relative"
                title="Clique para alterar foto">
                ${fotoSrc
        ? `<img id="avatar-img" src="${fotoSrc}" style="width:100%;height:100%;object-fit:cover" />`
        : `<span id="avatar-initials" style="font-size:2rem;font-weight:700;color:white">${initials}</span>`}
                <div style="position:absolute;bottom:0;right:0;background:var(--green-600);border-radius:50%;
                  width:28px;height:28px;display:flex;align-items:center;justify-content:center;
                  border:2px solid white;font-size:0.75rem">✏️</div>
              </div>
              <input type="file" id="foto-input" accept="image/*" style="display:none" />
              <div id="foto-url-toggle" style="font-size:0.72rem;color:var(--green-600);text-align:center;margin-top:6px;cursor:pointer">
                ou usar URL
              </div>
              <div id="foto-url-wrap" style="display:none;margin-top:8px">
                <input class="field-input" id="foto-url-input" value="${profile.foto_url || ''}" placeholder="https://..." style="font-size:0.78rem;padding:6px 10px" />
                <button class="btn btn-secondary btn-sm" id="foto-url-btn" style="margin-top:4px;width:100%">Aplicar</button>
              </div>
            </div>

            <!-- Name + email (read-only display) -->
            <div style="flex:1;min-width:200px">
              <h2 style="margin:0 0 4px 0;font-size:1.4rem">${profile.nome || '—'}</h2>
              <div style="color:var(--text-muted);font-size:0.9rem;margin-bottom:8px">📧 ${profile.email || '—'}</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:0.8rem">
                ${profile.instagram ? `<a href="https://instagram.com/${profile.instagram.replace('@', '')}" target="_blank" style="color:#E1306C;text-decoration:none">📸 Instagram</a>` : ''}
                ${profile.youtube ? `<a href="${profile.youtube}" target="_blank" style="color:#FF0000;text-decoration:none">▶️ YouTube</a>` : ''}
                ${profile.facebook ? `<a href="${profile.facebook}" target="_blank" style="color:#1877F2;text-decoration:none">👤 Facebook</a>` : ''}
                ${profile.linkedin ? `<a href="${profile.linkedin}" target="_blank" style="color:#0A66C2;text-decoration:none">💼 LinkedIn</a>` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- Form sections -->
        <form id="profile-form">

          <!-- Dados Pessoais -->
          <div class="card" style="margin-bottom:16px">
            <div style="padding:16px 20px;border-bottom:1px solid var(--border-light)">
              <h3 style="margin:0;font-size:1rem">👤 Dados Pessoais</h3>
            </div>
            <div style="padding:20px">
              <div class="form-grid">
                <div class="form-group form-field-full">
                  <label class="field-label">Nome completo *</label>
                  <input class="field-input" id="p-nome" value="${profile.nome || ''}" required />
                </div>
                <div class="form-group">
                  <label class="field-label">WhatsApp / Telefone</label>
                  <input class="field-input" id="p-telefone" value="${profile.telefone || ''}" placeholder="55119..." />
                </div>
                <div class="form-group form-field-full">
                  <label class="field-label">Endereço</label>
                  <input class="field-input" id="p-endereco" value="${profile.endereco || ''}" placeholder="Rua, número, bairro, cidade — SP" />
                </div>
                <div class="form-group form-field-full">
                  <label class="field-label">Bio / Apresentação</label>
                  <textarea class="field-textarea" id="p-bio" rows="3" placeholder="Conte um pouco sobre você e sua missão...">${profile.bio || ''}</textarea>
                </div>
                <div class="form-group">
                  <label class="field-label">Gênero</label>
                  <select class="field-select" id="p-genero">
                    <option value="feminino" ${(!profile.genero || profile.genero === 'feminino') ? 'selected' : ''}>♀ Feminino</option>
                    <option value="masculino" ${profile.genero === 'masculino' ? 'selected' : ''}>♂ Masculino</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="field-label">🏅 Graduação doTerra</label>
                  <select class="field-select" id="p-doterra-nivel">
                    <option value="">— Selecionar —</option>
                    ${['Wellness Advocate', 'Consultor', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Blue Diamond', 'Presidential Diamond']
        .map(n => `<option value="${n}" ${profile.doterra_nivel === n ? 'selected' : ''}>${n}</option>`).join('')}
                  </select>
                  <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">Exibido como badge na sua página pública</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Redes Sociais -->
          <div class="card" style="margin-bottom:16px">
            <div style="padding:16px 20px;border-bottom:1px solid var(--border-light)">
              <h3 style="margin:0;font-size:1rem">🌐 Redes Sociais</h3>
            </div>
            <div style="padding:20px">
              <div class="form-grid">
                <div class="form-group">
                  <label class="field-label" style="color:#E1306C">📸 Instagram</label>
                  <div style="display:flex;align-items:center;gap:8px">
                    <span style="color:var(--text-muted);font-size:0.85rem;white-space:nowrap">@</span>
                    <input class="field-input" id="p-instagram" value="${(profile.instagram || '').replace('@', '')}" placeholder="seu.usuario" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="field-label" style="color:#FF0000">▶️ YouTube</label>
                  <input class="field-input" id="p-youtube" value="${profile.youtube || ''}" placeholder="https://youtube.com/@..." />
                </div>
                <div class="form-group">
                  <label class="field-label" style="color:#1877F2">👤 Facebook</label>
                  <input class="field-input" id="p-facebook" value="${profile.facebook || ''}" placeholder="https://facebook.com/..." />
                </div>
                <div class="form-group">
                  <label class="field-label" style="color:#0A66C2">💼 LinkedIn</label>
                  <input class="field-input" id="p-linkedin" value="${profile.linkedin || ''}" placeholder="https://linkedin.com/in/..." />
                </div>
              </div>
            </div>
          </div>

          <!-- Public profile link -->
          ${profile.slug ? `
          <div class="card" style="margin-bottom:16px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0">
            <div style="padding:20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
              <div style="font-size:2rem">🌿</div>
              <div style="flex:1">
                <div style="font-weight:700;margin-bottom:4px">Sua Página Pública</div>
                <div style="font-size:0.82rem;color:#166534;word-break:break-all">${window.location.origin}/#/p/${profile.slug}</div>
              </div>
              <div style="display:flex;gap:8px">
                <a href="${window.location.origin}/#/p/${profile.slug}" target="_blank" class="btn btn-secondary btn-sm">👁️ Ver</a>
                <button type="button" class="btn btn-primary btn-sm" id="btn-copy-profile-link">🔗 Copiar</button>
              </div>
            </div>
          </div>` : ''}

          <!-- Save button -->
          <div style="display:flex;justify-content:flex-end;gap:10px">
            <button type="button" class="btn btn-secondary" id="btn-cancel">Cancelar</button>
            <button type="submit" class="btn btn-primary" id="btn-save">💾 Salvar Perfil</button>
          </div>
        </form>
      </div>`;

    bindEvents(pc);
  }

  function bindEvents(pc) {
    // Photo file upload
    const avatarDisplay = pc.querySelector('#avatar-display');
    const fotoInput = pc.querySelector('#foto-input');

    avatarDisplay?.addEventListener('click', () => fotoInput?.click());

    fotoInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 500 * 1024) {
        toast('Imagem muito grande. Use uma imagem menor que 500KB.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        profile.foto_url = evt.target.result;
        // Update preview immediately
        avatarDisplay.innerHTML = `<img src="${profile.foto_url}" style="width:100%;height:100%;object-fit:cover" />
                  <div style="position:absolute;bottom:0;right:0;background:var(--green-600);border-radius:50%;
                    width:28px;height:28px;display:flex;align-items:center;justify-content:center;
                    border:2px solid white;font-size:0.75rem">✏️</div>`;
      };
      reader.readAsDataURL(file);
    });

    // URL toggle
    pc.querySelector('#foto-url-toggle')?.addEventListener('click', () => {
      const wrap = pc.querySelector('#foto-url-wrap');
      wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
    });

    pc.querySelector('#foto-url-btn')?.addEventListener('click', () => {
      const url = pc.querySelector('#foto-url-input')?.value?.trim();
      if (!url) return;
      profile.foto_url = url;
      avatarDisplay.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover"
              onerror="this.parentElement.innerHTML='<span style=\\'font-size:2rem;font-weight:700;color:white\\'>${getInitials(profile.nome)}</span>'" />
              <div style="position:absolute;bottom:0;right:0;background:var(--green-600);border-radius:50%;
                width:28px;height:28px;display:flex;align-items:center;justify-content:center;
                border:2px solid white;font-size:0.75rem">✏️</div>`;
      toast('Foto atualizada! Salve o perfil para confirmar.');
    });

    // Cancel
    pc.querySelector('#btn-cancel')?.addEventListener('click', () => router.navigate('/dashboard'));

    // Copy public profile link
    pc.querySelector('#btn-copy-profile-link')?.addEventListener('click', () => {
      const url = `${window.location.origin}/#/p/${profile.slug}`;
      navigator.clipboard.writeText(url).then(() => toast('Link copiado! ✅')).catch(() => toast('Erro ao copiar', 'error'));
    });

    // Form submit
    pc.querySelector('#profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = pc.querySelector('#btn-save');
      btn.disabled = true;
      btn.textContent = '⏳ Salvando...';

      const data = {
        nome: pc.querySelector('#p-nome')?.value?.trim(),
        telefone: pc.querySelector('#p-telefone')?.value?.trim(),
        endereco: pc.querySelector('#p-endereco')?.value?.trim(),
        bio: pc.querySelector('#p-bio')?.value?.trim(),
        genero: pc.querySelector('#p-genero')?.value || 'feminino',
        doterra_nivel: pc.querySelector('#p-doterra-nivel')?.value || null,
        foto_url: profile.foto_url || null,
        instagram: pc.querySelector('#p-instagram')?.value?.trim(),
        youtube: pc.querySelector('#p-youtube')?.value?.trim(),
        facebook: pc.querySelector('#p-facebook')?.value?.trim(),
        linkedin: pc.querySelector('#p-linkedin')?.value?.trim(),
      };

      if (!data.nome) {
        toast('Nome obrigatório', 'error');
        btn.disabled = false;
        btn.textContent = '💾 Salvar Perfil';
        return;
      }

      try {
        await store.updateProfile(data);
        // Update auth cache
        if (auth.current) {
          auth.current.nome = data.nome;
          auth.current.genero = data.genero;
        }
        toast('Perfil salvo com sucesso! ✅');
        profile = { ...profile, ...data };
        render(); // re-render with updated data
      } catch (err) {
        toast('Erro ao salvar: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = '💾 Salvar Perfil';
      }
    });
  }

  render();
}
