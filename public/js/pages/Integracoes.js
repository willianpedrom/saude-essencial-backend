import { auth, api } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { toast } from '../utils.js';

// ── Store wrapper ──────────────────────────────────────────────
async function getMyTracking() {
    const data = await api('GET', '/api/auth/profile');
    return data.rastreamento || {};
}
async function saveMyTracking(payload) {
    return api('PUT', '/api/auth/tracking', payload);
}

export async function renderIntegrations(router) {
    renderLayout(router, 'Integrações & Rastreamento',
        `<div style="display:flex;align-items:center;justify-content:center;height:200px;color:var(--text-muted)">⏳ Carregando...</div>`,
        'integrations');

    let tracking = {};
    try {
        tracking = await getMyTracking();
    } catch { /* show empty form */ }

    const pc = document.getElementById('page-content');
    if (!pc) return;

    pc.innerHTML = `
    <div style="max-width:720px;margin:0 auto">

      <!-- Header banner -->
      <div class="card" style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:28px 32px;margin-bottom:20px;border:none">
        <div style="display:flex;align-items:center;gap:16px">
          <div style="font-size:2.5rem">📊</div>
          <div>
            <div style="font-size:1.2rem;font-weight:700;margin-bottom:4px">Integrações & Rastreamento</div>
            <div style="opacity:.7;font-size:0.88rem">Configure seus pixels e scripts de rastreamento. Eles serão ativados automaticamente nos seus links públicos.</div>
          </div>
        </div>
      </div>

      <!-- Meta Pixel Card -->
      <div class="card" style="margin-bottom:16px">
        <div style="padding:20px 24px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;background:#1877f2;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:1rem">f</div>
          <div>
            <div style="font-weight:700">Meta Pixel</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">Rastreamento browser + Conversions API (server-side)</div>
          </div>
          <div id="meta-badge" style="margin-left:auto"></div>
        </div>
        <div style="padding:20px 24px">
          <div class="form-grid">
            <div class="form-group">
              <label class="field-label">Pixel ID</label>
              <input class="field-input" id="t-meta-pixel-id" placeholder="Ex: 1234567890" value="${tracking.meta_pixel_id || ''}" />
              <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">Encontrado no Gerenciador de Eventos da Meta</div>
            </div>
            <div class="form-group">
              <label class="field-label">Access Token (CAPI)</label>
              <input class="field-input" id="t-meta-pixel-token" type="password" placeholder="EAAGxxx..." value="${tracking.meta_pixel_token || ''}" />
              <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">Eventos server-side enviados direto do servidor — 100% anti-bloqueio</div>
            </div>
          </div>
          <div style="margin-top:12px;padding:12px;background:#eff6ff;border-radius:8px;font-size:0.82rem;color:#1e40af">
            💡 <strong>Eventos automáticos via CAPI:</strong> <code>Lead</code> (anamnese preenchida) • <code>ViewContent</code> (relatório aberto) • <code>CompleteRegistration</code> (depoimento enviado)
          </div>
        </div>
      </div>

      <!-- Microsoft Clarity Card -->
      <div class="card" style="margin-bottom:16px">
        <div style="padding:20px 24px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;background:#0078d4;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.2rem">🔭</div>
          <div>
            <div style="font-weight:700">Microsoft Clarity</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">Mapas de calor e gravação de sessões</div>
          </div>
        </div>
        <div style="padding:20px 24px">
          <div class="form-group">
            <label class="field-label">Clarity ID</label>
            <input class="field-input" id="t-clarity-id" placeholder="Ex: abc123xyz" value="${tracking.clarity_id || ''}" />
          </div>
        </div>
      </div>

      <!-- Google Analytics Card -->
      <div class="card" style="margin-bottom:16px">
        <div style="padding:20px 24px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;background:#f9ab00;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.2rem">📈</div>
          <div>
            <div style="font-weight:700">Google Analytics 4</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">Análise de tráfego e comportamento</div>
          </div>
        </div>
        <div style="padding:20px 24px">
          <div class="form-group">
            <label class="field-label">Measurement ID (GA4)</label>
            <input class="field-input" id="t-ga-id" placeholder="Ex: G-XXXXXXXXXX" value="${tracking.ga_id || ''}" />
          </div>
        </div>
      </div>

      <!-- Google Tag Manager Card -->
      <div class="card" style="margin-bottom:16px">
        <div style="padding:20px 24px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;background:#4285f4;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1rem;color:#fff;font-weight:700">GTM</div>
          <div>
            <div style="font-weight:700">Google Tag Manager</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">Gerenciar múltiplas tags de terceiros</div>
          </div>
        </div>
        <div style="padding:20px 24px">
          <div class="form-group">
            <label class="field-label">Container ID</label>
            <input class="field-input" id="t-gtm-id" placeholder="Ex: GTM-XXXXXXX" value="${tracking.gtm_id || ''}" />
          </div>
        </div>
      </div>

      <!-- Custom Script Card -->
      <div class="card" style="margin-bottom:24px">
        <div style="padding:20px 24px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;background:#6b7280;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.2rem">🧩</div>
          <div>
            <div style="font-weight:700">Script Personalizado</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">Qualquer outro código para o &lt;head&gt; das páginas públicas</div>
          </div>
        </div>
        <div style="padding:20px 24px">
          <div class="form-group">
            <label class="field-label">Código (HTML/Script)</label>
            <textarea class="field-textarea" id="t-custom-script" rows="5" placeholder="<script>...</script>" style="font-family:monospace;font-size:0.82rem">${tracking.custom_script || ''}</textarea>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div style="display:flex;justify-content:flex-end;gap:12px;margin-bottom:40px">
        <button class="btn btn-primary" id="btn-save-tracking" style="padding:12px 28px;font-size:1rem">
          💾 Salvar Integrações
        </button>
      </div>

    </div>`;

    // Update badge status for Meta Pixel
    const badge = pc.querySelector('#meta-badge');
    if (badge) {
        const hasPixel = !!(tracking.meta_pixel_id);
        const hasCapi = !!(tracking.meta_pixel_token);
        badge.innerHTML = hasPixel
            ? `<span style="background:${hasCapi ? '#dcfce7' : '#fef9c3'};color:${hasCapi ? '#166534' : '#854d0e'};font-size:0.72rem;padding:3px 10px;border-radius:10px">${hasCapi ? '✅ Pixel + CAPI ativo' : '⚠️ Só Pixel (sem CAPI)'}</span>`
            : `<span style="background:#f1f5f9;color:#64748b;font-size:0.72rem;padding:3px 10px;border-radius:10px">Não configurado</span>`;
    }

    // Save handler
    pc.querySelector('#btn-save-tracking')?.addEventListener('click', async () => {
        const btn = pc.querySelector('#btn-save-tracking');
        btn.disabled = true; btn.textContent = '⏳ Salvando...';
        const payload = {
            meta_pixel_id: pc.querySelector('#t-meta-pixel-id')?.value?.trim() || null,
            meta_pixel_token: pc.querySelector('#t-meta-pixel-token')?.value?.trim() || null,
            clarity_id: pc.querySelector('#t-clarity-id')?.value?.trim() || null,
            ga_id: pc.querySelector('#t-ga-id')?.value?.trim() || null,
            gtm_id: pc.querySelector('#t-gtm-id')?.value?.trim() || null,
            custom_script: pc.querySelector('#t-custom-script')?.value?.trim() || null,
        };
        try {
            await saveMyTracking(payload);
            toast('Integrações salvas com sucesso! ✅');
            // Update in-memory cache for badge refresh
            if (auth.current) auth.current.rastreamento = payload;
        } catch (err) {
            toast('Erro ao salvar: ' + err.message, 'error');
        } finally {
            btn.disabled = false; btn.textContent = '💾 Salvar Integrações';
        }
    });
}
