import { api } from '../store.js';
import { injectTrackingScripts } from '../utils.js';

const DOTERRA_BADGE_COLORS = {
  'Wellness Advocate': { bg: '#e0f2fe', color: '#0369a1' },
  'Consultor': { bg: '#f0fdf4', color: '#166534' },
  'Silver': { bg: '#f1f5f9', color: '#475569' },
  'Gold': { bg: '#fefce8', color: '#854d0e' },
  'Platinum': { bg: '#f5f3ff', color: '#6d28d9' },
  'Diamond': { bg: '#eff6ff', color: '#1d4ed8' },
  'Blue Diamond': { bg: '#e0f7fa', color: '#006064' },
  'Presidential Diamond': { bg: 'linear-gradient(135deg,#1a1a2e,#16213e)', color: '#e2c97e' },
};

function badge(nivel) {
  if (!nivel) return '';
  const c = DOTERRA_BADGE_COLORS[nivel] || { bg: '#f0fdf4', color: '#166534' };
  const isGrad = nivel === 'Presidential Diamond';
  return `<span style="
        display:inline-flex;align-items:center;gap:6px;
        background:${isGrad ? '#1a1a2e' : c.bg};
        color:${c.color};padding:5px 14px;border-radius:20px;
        font-size:0.78rem;font-weight:600;letter-spacing:.4px;
        ${isGrad ? 'border:1px solid #e2c97e' : ''}">
        ${nivel === 'Presidential Diamond' ? '👑' : nivel === 'Diamond' || nivel === 'Blue Diamond' ? '💠' : nivel === 'Gold' ? '🥇' : nivel === 'Platinum' ? '💎' : nivel === 'Silver' ? '🥈' : '🌿'} ${nivel}
    </span>`;
}

function stars(nota) {
  const n = Math.round((nota / 10) * 5);
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function socialIcon(name, url) {
  if (!url) return '';
  const normalized = url.startsWith('http') ? url :
    name === 'instagram' ? `https://instagram.com/${url.replace('@', '')}` :
      name === 'youtube' ? `https://youtube.com/${url.replace('@', '@')}` :
        name === 'linkedin' ? `https://linkedin.com/in/${url.replace('@', '')}` :
          name === 'facebook' ? `https://facebook.com/${url.replace('@', '')}` : url;

  const icons = {
    instagram: `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
    youtube: `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    linkedin: `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
    facebook: `<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  };
  return `<a href="${normalized}" target="_blank" rel="noopener noreferrer"
        style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.15);color:white;transition:background .2s;text-decoration:none"
        onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'"
        title="${name}">
        ${icons[name] || name}
    </a>`;
}

export async function renderPublicProfile(router, slug) {
  const app = document.getElementById('app');

  // Loading
  app.innerHTML = `
    <div style="min-height:100vh;background:linear-gradient(135deg,#0a2818 0%,#1a4527 50%,#0f3520 100%);display:flex;align-items:center;justify-content:center">
      <div style="text-align:center;color:white">
        <div style="font-size:3rem;margin-bottom:12px;animation:pulse 1.5s infinite">💧</div>
        <div style="font-size:1rem;opacity:.7">Carregando perfil...</div>
      </div>
    </div>`;

  let data;
  try {
    data = await api('GET', `/api/publico/perfil/${slug}`);
  } catch {
    app.innerHTML = `
        <div style="min-height:100vh;background:#0a2818;display:flex;align-items:center;justify-content:center;color:white">
          <div style="text-align:center;padding:40px">
            <div style="font-size:4rem;margin-bottom:16px">😕</div>
            <h2>Perfil não encontrado</h2>
            <p style="opacity:.6;margin-top:8px">Este link não é válido ou o perfil foi removido.</p>
          </div>
        </div>`;
    return;
  }

  const { consultor, depoimentos, anamnese_token } = data;
  const { nome, foto_url, bio, telefone, instagram, youtube, facebook, linkedin, doterra_nivel, genero } = consultor;
  const title = genero === 'masculino' ? 'Consultor' : 'Consultora';
  const pageUrl = window.location.href;
  const whatsLink = telefone ? `https://wa.me/55${telefone.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(nome)}!%20Conheci%20seu%20perfil%20e%20gostaria%20de%20saber%20mais.` : null;
  const anamneseLink = anamnese_token ? `${window.location.origin}/#/anamnese/${anamnese_token}` : null;

  // Inject tracking
  injectTrackingScripts(consultor.rastreamento);

  // Calculate average NPS
  const avgNps = depoimentos.length > 0
    ? Math.round(depoimentos.reduce((s, d) => s + (d.nota || 10), 0) / depoimentos.length)
    : null;

  app.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', sans-serif; position: relative; padding-bottom: 60px; }
      .pp-section { padding: 60px 24px; }
      .pp-container { max-width: 900px; margin: 0 auto; }
      .pp-depo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; margin-top: 32px; }
      .pp-depo-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 2px 20px rgba(0,0,0,0.06); }
      .pp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; padding: 16px 32px; border-radius: 50px; font-weight: 700; font-size: 1rem; cursor: pointer; border: none; text-decoration: none; transition: transform .15s, box-shadow .15s; text-align: center; }
      .pp-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
      .pp-btn-primary { background: linear-gradient(135deg,#16a34a,#15803d); color: white; border: 2px solid transparent; box-shadow: 0 4px 15px rgba(22, 163, 74, 0.4); font-size: 1.05rem; }
      .pp-btn-secondary-outline { background: transparent; color: white; border: 2px solid rgba(255,255,255,0.4); transition: background .2s, border-color .2s; }
      .pp-btn-secondary-outline:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.7); box-shadow: none; }
      .pp-link-card { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; background: white; border-radius: 14px; text-decoration: none; color: #1a4527; font-weight: 600; font-size: 1.05rem; box-shadow: 0 4px 15px rgba(0,0,0,0.04); margin-bottom: 14px; border: 1px solid #e5e7eb; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
      .pp-link-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.08); border-color: #86efac; }
      .pp-link-icon-wrap { width: 40px; height: 40px; border-radius: 10px; background: #f0fdf4; color: #16a34a; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
      
      .pp-fab-whatsapp { position: fixed; bottom: 24px; right: 24px; background: #25d366; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4); text-decoration: none; z-index: 1000; transition: transform 0.2s; }
      .pp-fab-whatsapp:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(37, 211, 102, 0.5); }
      .pp-fab-whatsapp svg { width: 34px; height: 34px; }

      @keyframes fadeUp { from { opacity:0;transform:translateY(24px) } to { opacity:1;transform:none } }
      .pp-fade { animation: fadeUp .5s ease both; }
    </style>

    <!-- ═══════════════ HERO ═══════════════ -->
    <section style="background:linear-gradient(160deg,#0a2818 0%,#1a4527 50%,#134020 100%);padding:80px 24px 60px;text-align:center;position:relative;overflow:hidden">
      <div style="position:absolute;top:-60px;left:-60px;width:300px;height:300px;background:rgba(255,255,255,0.03);border-radius:50%"></div>
      <div style="position:absolute;bottom:-80px;right:-40px;width:400px;height:400px;background:rgba(255,255,255,0.02);border-radius:50%"></div>

      <div class="pp-container pp-fade">
        <!-- Photo -->
        ${foto_url
      ? `<img src="${foto_url}" alt="${nome}" style="width:130px;height:130px;border-radius:50%;object-fit:cover;border:4px solid rgba(255,255,255,0.3);margin-bottom:20px;box-shadow:0 8px 32px rgba(0,0,0,0.3)">`
      : `<div style="width:130px;height:130px;border-radius:50%;background:rgba(255,255,255,0.15);display:inline-flex;align-items:center;justify-content:center;font-size:3rem;margin-bottom:20px;border:4px solid rgba(255,255,255,0.3)">🌿</div>`}

        <!-- Badge -->
        ${doterra_nivel ? `<div style="margin-bottom:12px">${badge(doterra_nivel)}</div>` : ''}

        <!-- Name & Promise -->
        <h1 style="font-family:'Playfair Display',serif;color:white;font-size:clamp(1.8rem,5vw,2.8rem);font-weight:700;margin-bottom:8px">${nome}</h1>
        <p style="color:rgba(255,255,255,0.9);font-size:1.1rem;margin-bottom:6px;font-weight:500">Transformando sua saúde de forma 100% natural</p>
        <p style="color:rgba(255,255,255,0.5);font-size:0.9rem;margin-bottom:24px">${title} Oficial do Bem-Estar</p>

        <!-- Social Links -->
        <div style="display:flex;justify-content:center;gap:10px;margin-bottom:32px">
          ${socialIcon('instagram', instagram)}
          ${socialIcon('youtube', youtube)}
          ${socialIcon('linkedin', linkedin)}
          ${facebook ? socialIcon('facebook', facebook) : ''}
        </div>

        <!-- CTA Buttons Hierarchy -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:14px;max-width:320px;margin:0 auto">
          ${anamneseLink
      ? `<a href="${anamneseLink}" class="pp-btn pp-btn-primary" style="width:100%;display:flex">
                📋 Obter Avaliação Gratuita
               </a>`
      : ''}
          ${whatsLink
      ? `<a href="${whatsLink}" target="_blank" class="pp-btn pp-btn-secondary-outline" style="width:100%;display:flex">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.5 2C6.305 2 2 6.305 2 11.5c0 1.736.478 3.362 1.31 4.762L2 22l5.865-1.294A9.46 9.46 0 0011.5 21c5.195 0 9.5-4.305 9.5-9.5S16.695 2 11.5 2zm0 17.5c-1.587 0-3.065-.458-4.317-1.248l-.309-.183-3.485.769.801-3.395-.202-.319A7.482 7.482 0 014 11.5C4 7.41 7.41 4 11.5 4S19 7.41 19 11.5 15.59 19.5 11.5 19.5z"/></svg>
                Falar no WhatsApp
               </a>`
      : ''}
        </div>

        ${avgNps !== null ? `
        <div style="margin-top:28px;display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.1);padding:8px 20px;border-radius:30px">
          <span style="color:#fbbf24;font-size:1.1rem">★</span>
          <span style="color:white;font-weight:600">${avgNps >= 9 ? '100% Satisfação Verificada' : avgNps + '/10 Média de Satisfação'}</span>
          <span style="color:rgba(255,255,255,0.6);font-size:0.85rem">(${data.depoimentos.length} avaliações)</span>
        </div>` : ''}
      </div>
    </section>

    <!-- ═══════════════ LINKS (LINKTREE) ═══════════════ -->
    ${data.links && data.links.length > 0 ? `
    <section class="pp-section" style="background:#f9fafb;padding-top:40px;padding-bottom:40px">
      <div class="pp-container pp-fade" style="max-width:500px">
        <h3 style="font-family:'Playfair Display',serif;text-align:center;color:#0a2818;margin-bottom:24px;font-size:1.4rem">Links e Recursos</h3>
        <div>
          ${data.links.map(link => `
            <a href="${link.url}" target="_blank" rel="noopener" class="pp-link-card">
              <span style="display:flex;align-items:center;gap:14px">
                <div class="pp-link-icon-wrap">${link.icone || '🔗'}</div>
                <span>${link.titulo}</span>
              </span>
              <span style="color:#9ca3af">➔</span>
            </a>
          `).join('')}
        </div>
      </div>
    </section>
    ` : ''}

    <!-- ═══════════════ SOBRE ═══════════════ -->
    ${bio ? `
    <section class="pp-section" style="background:${data.links && data.links.length > 0 ? 'white' : '#f9fafb'}">
      <div class="pp-container pp-fade">
        <div style="text-align:center;margin-bottom:32px">
          <div style="display:inline-block;background:#dcfce7;color:#166534;font-size:0.8rem;font-weight:600;padding:4px 14px;border-radius:20px;margin-bottom:12px">SOBRE MIM</div>
          <h2 style="font-family:'Playfair Display',serif;font-size:clamp(1.6rem,4vw,2.2rem);color:#0a2818">A minha história</h2>
        </div>
        <div style="max-width:680px;margin:0 auto;background:white;border-radius:20px;padding:36px;box-shadow:0 2px 20px rgba(0,0,0,0.06);font-size:1rem;line-height:1.8;color:#374151;white-space:pre-wrap">${bio}</div>
      </div>
    </section>` : ''}

    <!-- ═══════════════ DEPOIMENTOS ═══════════════ -->
    ${depoimentos.length > 0 ? `
    <section class="pp-section" style="background:${(data.links && data.links.length > 0 && !bio) || (!data.links?.length && bio) ? '#f9fafb' : 'white'}">
      <div class="pp-container">
        <div style="text-align:center;margin-bottom:8px">
          <h2 style="font-family:'Playfair Display',serif;font-size:clamp(1.6rem,4vw,2.2rem);color:#0a2818">O que dizem os clientes</h2>
          <p style="color:#6b7280;margin-top:8px">${depoimentos.length} depoimento${depoimentos.length > 1 ? 's' : ''} verificado${depoimentos.length > 1 ? 's' : ''}</p>
        </div>
        <div class="pp-depo-grid">
          ${depoimentos.map(d => `
          <div class="pp-depo-card pp-fade">
            <div style="color:#fbbf24;font-size:1.1rem;margin-bottom:12px">${stars(d.nota)}</div>
            <p style="color:#374151;line-height:1.65;font-size:0.92rem;margin-bottom:16px">"${d.texto}"</p>
            <div style="font-weight:600;color:#1a4527;font-size:0.85rem">— ${d.cliente_nome}</div>
          </div>`).join('')}
        </div>
      </div>
    </section>` : ''}

    <!-- ═══════════════ CTA FINAL ═══════════════ -->
    <section style="background:linear-gradient(135deg,#0a2818,#1a4527);padding:80px 24px;text-align:center">
      <div class="pp-container pp-fade">
        <div style="font-size:3rem;margin-bottom:16px">🌿</div>
        <h2 style="font-family:'Playfair Display',serif;color:white;font-size:clamp(1.8rem,4vw,2.4rem);margin-bottom:12px">Pronto para o próximo passo?</h2>
        
        <div style="max-width:480px;margin:0 auto 36px;text-align:left;background:rgba(255,255,255,0.05);padding:20px;border-radius:16px;border:1px solid rgba(255,255,255,0.1)">
          <div style="color:white;font-weight:600;margin-bottom:12px;text-align:center">Como funciona:</div>
          <div style="display:flex;flex-direction:column;gap:10px;color:rgba(255,255,255,0.8);font-size:0.95rem">
            <div><strong style="color:#86efac">1.</strong> Responda uma rápida avaliação gratuita</div>
            <div><strong style="color:#86efac">2.</strong> Analisarei seu caso detalhadamente</div>
            <div><strong style="color:#86efac">3.</strong> Receba um protocolo 100% personalizado</div>
          </div>
        </div>

        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:14px;margin-bottom:48px">
          ${anamneseLink
      ? `<a href="${anamneseLink}" class="pp-btn pp-btn-primary" style="font-size:1.05rem;padding:18px 36px">
                📋 Obter Minha Avaliação Gratuita
               </a>`
      : ''}
        </div>

        <!-- Share section -->
        <div>
          <p style="color:rgba(255,255,255,0.5);font-size:0.85rem;margin-bottom:14px">Compartilhe este perfil</p>
          <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap">
            <button onclick="navigator.clipboard.writeText('${pageUrl}').then(()=>this.textContent='✅ Copiado!').catch(()=>{})" 
              style="background:rgba(255,255,255,0.12);color:white;border:1px solid rgba(255,255,255,0.2);padding:10px 20px;border-radius:30px;cursor:pointer;font-size:0.85rem;transition:background .2s"
              onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.12)'">
              🔗 Copiar link
            </button>
            <a href="https://wa.me/?text=${encodeURIComponent('Conheça o perfil: ' + pageUrl)}" target="_blank"
              style="background:rgba(255,255,255,0.12);color:white;border:1px solid rgba(255,255,255,0.2);padding:10px 20px;border-radius:30px;cursor:pointer;font-size:0.85rem;text-decoration:none;display:inline-flex;align-items:center;gap:6px"
              onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.12)'">
              Compartilhar via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer style="background:#071a0f;padding:20px 24px;text-align:center">
      <p style="color:rgba(255,255,255,0.3);font-size:0.78rem">Powered by <strong style="color:rgba(255,255,255,0.5)">Gota Essencial</strong> · Sistema de Consultoras</p>
    </footer>

    <!-- Botão Flutuante do WhatsApp -->
    ${whatsLink ? `
    <a href="${whatsLink}" target="_blank" class="pp-fab-whatsapp" title="Falar no WhatsApp">
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.5 2C6.305 2 2 6.305 2 11.5c0 1.736.478 3.362 1.31 4.762L2 22l5.865-1.294A9.46 9.46 0 0011.5 21c5.195 0 9.5-4.305 9.5-9.5S16.695 2 11.5 2zm0 17.5c-1.587 0-3.065-.458-4.317-1.248l-.309-.183-3.485.769.801-3.395-.202-.319A7.482 7.482 0 014 11.5C4 7.41 7.41 4 11.5 4S19 7.41 19 11.5 15.59 19.5 11.5 19.5z"/></svg>
    </a>` : ''}
    `;
}
