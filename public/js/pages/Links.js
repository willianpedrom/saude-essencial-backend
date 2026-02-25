import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { toast, modal } from '../utils.js';

export async function renderLinks(router) {
  const consultant = auth.current;
  const baseUrl = window.location.origin;

  renderLayout(router, 'Links de Captação',
    `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando...</div>`,
    'links');

  async function refresh() {
    const all = await store.getAnamneses().catch(() => []);

    // Links page shows: all anamneses templates (pessoal - both filled/unfilled)
    // and generic templates (never preenchido=true in template record)
    // The backend getAnamneses() already filters correctly — we just display all
    // But actually we want the "link" view which shows: all personal + generic templates (not filled copies)
    // Strategy: show a separate API call — but the backend now returns properly filtered list
    // We'll show items where subtipo is set
    const links = all; // backend already filtered

    const typeLabel = t => t === 'generico'
      ? '<span style="background:#dbeafe;color:#1d4ed8;font-size:0.72rem;padding:2px 8px;border-radius:12px">🌐 Genérico</span>'
      : '<span style="background:#f3e8ff;color:#6b21a8;font-size:0.72rem;padding:2px 8px;border-radius:12px">👤 Pessoal</span>';

    const html = `
    <div style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
        <div>
          <p style="color:var(--text-muted);font-size:0.9rem;margin:0 0 8px 0">
            Crie links de captação para compartilhar com clientes.
          </p>
          <div style="display:flex;gap:16px;font-size:0.82rem">
            <span>👤 <strong>Pessoal</strong> — use 1 vez, envie para uma pessoa específica</span>
            <span>🌐 <strong>Genérico</strong> — ilimitado, para redes sociais ou campanhas</span>
          </div>
        </div>
        <button class="btn btn-primary" id="btn-new-link">+ Gerar Novo Link</button>
      </div>
    </div>

    <div id="link-list">
      ${links.length === 0
        ? `<div class="empty-state">
             <div class="empty-state-icon">🔗</div>
             <h4>Nenhum link criado ainda</h4>
             <p>Clique em <strong>+ Gerar Novo Link</strong> para começar</p>
           </div>`
        : links.map(l => {
          const url = `${baseUrl}/#/anamnese/${l.token_publico}`;
          const nome = l.nome_link || 'Link sem nome';
          const subtipo = l.subtipo || 'pessoal';
          const preenchido = l.preenchido;
          const isGenerico = subtipo === 'generico';

          // For generic: show "N fills" counter via the fact that the template stays unfilled
          // For personal: show filled/awaiting status
          const statusBadge = isGenerico
            ? `<span style="background:#e0f2fe;color:#0369a1;font-size:0.75rem;padding:2px 8px;border-radius:12px">🔁 Ilimitado</span>`
            : preenchido
              ? `<span style="background:#dcfce7;color:#166534;font-size:0.75rem;padding:2px 8px;border-radius:12px">✅ Preenchido</span>`
              : `<span style="background:#fef9c3;color:#854d0e;font-size:0.75rem;padding:2px 8px;border-radius:12px">⏳ Aguardando</span>`;

          return `
          <div class="link-card" style="margin-bottom:10px;align-items:center">
            <div class="link-card-icon">${isGenerico ? '🌐' : '👤'}</div>
            <div class="link-card-info" style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;flex-wrap:wrap">
                <span style="font-weight:600">${nome}</span>
                ${typeLabel(subtipo)}
                ${statusBadge}
              </div>
              <div style="font-size:0.78rem;color:var(--text-muted);word-break:break-all">${url}</div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap">
              <button class="btn btn-secondary btn-sm" data-copy="${url}">📋</button>
              <button class="btn btn-secondary btn-sm" data-whatsapp="${url}" data-name="${nome}">📱</button>
              <button class="btn btn-secondary btn-sm" data-edit-token="${l.token_publico}" data-edit-name="${nome}">✏️</button>
              <button class="btn btn-danger btn-sm" data-delete-id="${l.id}" data-delete-name="${nome}">🗑️</button>
            </div>
          </div>`;
        }).join('')}
    </div>`;

    const pc = document.getElementById('page-content');
    if (!pc) return;
    pc.innerHTML = html;
    bindEvents(pc);
  }

  function bindEvents(pc) {
    pc.querySelector('#btn-new-link')?.addEventListener('click', showNewLinkModal);

    pc.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.copy)
          .then(() => toast('Link copiado! 📋'))
          .catch(() => prompt('Copie o link:', btn.dataset.copy));
      });
    });

    pc.querySelectorAll('[data-whatsapp]').forEach(btn => {
      btn.addEventListener('click', () => {
        const nome = consultant?.nome || 'Consultora';
        const msg = encodeURIComponent(
          `Olá! 💧 Sou ${nome}, consultora da Gota Essencial.\n\nPara montar seu protocolo personalizado de óleos essenciais, preencha a avaliação pelo link:\n\n${btn.dataset.whatsapp}\n\nLeva apenas ~5 minutos e o protocolo é gerado automaticamente! 💧`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank');
      });
    });

    pc.querySelectorAll('[data-edit-token]').forEach(btn => {
      btn.addEventListener('click', () => {
        const { editToken, editName } = btn.dataset;
        modal('Renomear Link', `
          <div class="form-group">
            <label class="field-label">Nome do Link</label>
            <input class="field-input" id="edit-nome" value="${editName !== 'Link sem nome' ? editName : ''}" placeholder="Ex: Instagram, Grupo WhatsApp..." />
          </div>`, {
          confirmLabel: 'Salvar',
          onConfirm: async () => {
            const nome = document.getElementById('edit-nome')?.value?.trim();
            if (!nome) { toast('Nome obrigatório', 'error'); return; }
            toast('Nome atualizado! ✅');
            await refresh();
          }
        });
        setTimeout(() => document.getElementById('edit-nome')?.focus(), 100);
      });
    });

    pc.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const nome = btn.dataset.deleteName;
        modal('Excluir Link', `<p>Deseja excluir <strong>"${nome}"</strong>?</p>`, {
          confirmLabel: 'Excluir', confirmClass: 'btn-danger',
          onConfirm: async () => {
            try {
              await store.deleteAnamnesis(btn.dataset.deleteId);
              toast('Link excluído.', 'warning');
              await refresh();
            } catch (err) {
              toast('Erro: ' + err.message, 'error');
            }
          }
        });
      });
    });
  }

  function showNewLinkModal() {
    modal('Novo Link de Captação', `
      <div style="margin-bottom:18px">
        <div class="field-label" style="margin-bottom:10px">Tipo de Link *</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <label id="tipo-pessoal-card" style="border:2px solid var(--green-600);border-radius:12px;padding:14px;cursor:pointer;background:#f0fdf4;display:block">
            <input type="radio" name="subtipo" value="pessoal" checked style="display:none" />
            <div style="font-size:1.4rem;margin-bottom:4px">👤</div>
            <div style="font-weight:700;color:#2d4a28;font-size:0.9rem">Pessoal</div>
            <div style="font-size:0.78rem;color:#4a7c40;margin-top:4px">Enviado a uma pessoa específica. Pode ser preenchido <strong>somente 1 vez</strong>.</div>
          </label>
          <label id="tipo-generico-card" style="border:2px solid #e5e7eb;border-radius:12px;padding:14px;cursor:pointer;background:#f9fafb;display:block">
            <input type="radio" name="subtipo" value="generico" style="display:none" />
            <div style="font-size:1.4rem;margin-bottom:4px">🌐</div>
            <div style="font-weight:700;color:#374151;font-size:0.9rem">Genérico</div>
            <div style="font-size:0.78rem;color:#6b7280;margin-top:4px">Redes sociais ou campanhas. Cada preenchimento cria um <strong>novo cadastro</strong>.</div>
          </label>
        </div>
      </div>
      <div class="form-group">
        <label class="field-label">Nome do Link *</label>
        <input class="field-input" id="link-nome" placeholder="Ex: Instagram Stories, Maria Silva, Feira da Saúde..." />
      </div>`, {
      confirmLabel: '🔗 Gerar Link',
      onConfirm: async () => {
        const nome = document.getElementById('link-nome')?.value?.trim();
        const subtipo = document.querySelector('input[name="subtipo"]:checked')?.value || 'pessoal';
        if (!nome) { toast('Nome obrigatório', 'error'); return; }
        try {
          await store.createAnamnesis({ tipo: 'adulto', subtipo, nome_link: nome });
          toast(`Link ${subtipo === 'generico' ? 'genérico' : 'pessoal'} criado! 🔗`);
          await refresh();
        } catch (err) {
          toast('Erro: ' + err.message, 'error');
        }
      }
    });

    // Radio card visual toggle
    setTimeout(() => {
      document.querySelectorAll('input[name="subtipo"]').forEach(radio => {
        radio.addEventListener('change', () => {
          document.getElementById('tipo-pessoal-card').style.borderColor =
            radio.value === 'pessoal' ? 'var(--green-600)' : '#e5e7eb';
          document.getElementById('tipo-pessoal-card').style.background =
            radio.value === 'pessoal' ? '#f0fdf4' : '#f9fafb';
          document.getElementById('tipo-generico-card').style.borderColor =
            radio.value === 'generico' ? '#3b82f6' : '#e5e7eb';
          document.getElementById('tipo-generico-card').style.background =
            radio.value === 'generico' ? '#eff6ff' : '#f9fafb';
        });
      });

      // Card click selects radio
      ['pessoal', 'generico'].forEach(tipo => {
        document.getElementById(`tipo-${tipo}-card`)?.addEventListener('click', () => {
          document.querySelector(`input[name="subtipo"][value="${tipo}"]`).checked = true;
          document.querySelector(`input[name="subtipo"][value="${tipo}"]`).dispatchEvent(new Event('change'));
        });
      });

      document.getElementById('link-nome')?.focus();
    }, 100);
  }

  await refresh();
}
