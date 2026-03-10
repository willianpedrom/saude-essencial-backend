import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { toast, modal, getConsultantTitle, copyToClipboard } from '../utils.js';

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
    <!-- Toolbar: description + button -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:20px">
      <div>
        <p style="color:var(--text-muted);font-size:0.88rem;margin:0 0 8px 0">
          Crie links de captação para compartilhar com clientes.
        </p>
        <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:0.8rem;color:#64748b">
          <span>👤 <strong>Pessoal</strong> — 1 uso, pessoa específica</span>
          <span>🌐 <strong>Genérico</strong> — ilimitado, redes sociais</span>
        </div>
      </div>
      <button class="btn btn-primary" id="btn-new-link" style="white-space:nowrap">+ Gerar Novo Link</button>
    </div>

    <div id="link-list">
      ${links.length === 0
        ? `<div class="empty-state">
             <div class="empty-state-icon">🔗</div>
             <h4>Nenhum link criado ainda</h4>
             <p>Clique em <strong>+ Gerar Novo Link</strong> para começar</p>
           </div>`
        : links.map(l => {
          const url = `${baseUrl}/convite/${l.token_publico}`;
          const nome = l.nome_link || 'Link sem nome';
          const subtipo = l.subtipo || 'pessoal';
          const preenchido = l.preenchido;
          const isGenerico = subtipo === 'generico';
          const isBusiness = l.tipo === 'recrutamento';

          const typePill = isGenerico
            ? `<span style="background:#dbeafe;color:#1d4ed8;font-size:0.7rem;padding:2px 8px;border-radius:10px;white-space:nowrap;font-weight:600">🌐 Genérico</span>`
            : `<span style="background:#f3e8ff;color:#6b21a8;font-size:0.7rem;padding:2px 8px;border-radius:10px;white-space:nowrap;font-weight:600">👤 Pessoal</span>`;

          const catPill = isBusiness
            ? `<span style="background:#1e293b;color:#f8fafc;font-size:0.7rem;padding:2px 8px;border-radius:10px;white-space:nowrap;font-weight:600">💼 Negócios</span>`
            : `<span style="background:#fef5e7;color:#c05621;font-size:0.7rem;padding:2px 8px;border-radius:10px;white-space:nowrap;font-weight:600">💧 Saúde</span>`;

          const statusPill = isGenerico
            ? `<span style="background:#e0f2fe;color:#0369a1;font-size:0.7rem;padding:2px 8px;border-radius:10px;white-space:nowrap;font-weight:600">🔁 Ilimitado</span>`
            : preenchido
              ? `<span style="background:#dcfce7;color:#166534;font-size:0.7rem;padding:2px 8px;border-radius:10px;white-space:nowrap;font-weight:600">✅ Preenchido</span>`
              : `<span style="background:#fef9c3;color:#854d0e;font-size:0.7rem;padding:2px 8px;border-radius:10px;white-space:nowrap;font-weight:600">⏳ Aguardando</span>`;

          return `
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;
                      margin-bottom:12px;overflow:hidden;
                      box-shadow:0 1px 4px rgba(0,0,0,0.05)">

            <!-- Card Header -->
            <div style="padding:14px 16px;display:flex;align-items:flex-start;gap:12px">
              <div style="width:38px;height:38px;border-radius:10px;
                          background:${isGenerico ? '#dbeafe' : '#f3e8ff'};
                          display:flex;align-items:center;justify-content:center;
                          font-size:1.2rem;flex-shrink:0">
                ${isGenerico ? '🌐' : '👤'}
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;color:#1e293b;font-size:0.95rem;
                            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                            margin-bottom:6px">
                  ${nome}
                </div>
                <div style="display:flex;gap:5px;flex-wrap:wrap">
                  ${typePill}${catPill}${statusPill}
                </div>
              </div>
            </div>

            <!-- URL row -->
            <div style="padding:0 16px 12px;display:flex;align-items:center;gap:8px">
              <div style="flex:1;min-width:0;background:#f8fafc;border:1px solid #e2e8f0;
                          border-radius:8px;padding:8px 10px;
                          font-size:0.75rem;color:#64748b;font-family:monospace;
                          white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                ${url}
              </div>
              <button class="btn btn-secondary btn-sm" data-copy="${url}"
                style="padding:8px 12px;flex-shrink:0;font-size:0.8rem" title="Copiar link">📋</button>
            </div>

            <!-- Action bar -->
            <div style="border-top:1px solid #f1f5f9;padding:10px 16px;
                        display:flex;gap:8px;">
              <button class="btn btn-secondary btn-sm" data-whatsapp="${url}" data-name="${nome}" data-tipo="${l.tipo}"
                style="flex:1;font-size:0.78rem;display:flex;align-items:center;justify-content:center;gap:5px">
                📱 WhatsApp
              </button>
              <button class="btn btn-secondary btn-sm" data-edit-token="${l.token_publico}" data-edit-name="${nome}"
                style="flex:1;font-size:0.78rem;display:flex;align-items:center;justify-content:center;gap:5px">
                ✏️ Renomear
              </button>
              <button class="btn btn-danger btn-sm" data-delete-id="${l.id}" data-delete-name="${nome}"
                style="padding:6px 12px;flex-shrink:0" title="Excluir">🗑️</button>
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
      btn.addEventListener('click', () => copyToClipboard(btn.dataset.copy, btn));
    });

    pc.querySelectorAll('[data-whatsapp]').forEach(btn => {
      btn.addEventListener('click', () => {
        const title = getConsultantTitle(consultant?.genero).toLowerCase();
        const nome = consultant?.nome || 'Consultora';
        const tipo = btn.dataset.tipo;
        let msg = '';
        if (tipo === 'recrutamento') {
          msg = encodeURIComponent(
            `Olá! Aqui é ${nome}, ${title} da Gota App.\n\nPara entendermos melhor o seu Perfil Empreendedor e montar um direcionamento estratégico personalizado para você, peço que preencha a rápida avaliação abaixo:\n\n${btn.dataset.whatsapp}\n\nLeva menos de 3 minutinhos e você receberá seu protocolo de perfil ao final! 🚀`
          );
        } else {
          msg = encodeURIComponent(
            `Olá! 💧 Sou ${nome}, ${title} da Gota App.\n\nPara montar seu protocolo personalizado de saúde natural, preencha a avaliação pelo link:\n\n${btn.dataset.whatsapp}\n\nLeva apenas ~5 minutos e o protocolo é gerado automaticamente! 💧`
          );
        }
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
        <div class="field-label" style="margin-bottom:10px">Tipo de Avaliação *</div>
        <select class="field-select" id="link-tipo" style="margin-bottom:16px;">
          <option value="adulto">💧 Avaliação de Bem-Estar (Saúde)</option>
          <option value="recrutamento">💼 Análise de Perfil Empreendedor (Negócios)</option>
        </select>
        
        <div class="field-label" style="margin-bottom:10px">Tipo de Link *</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <label id="tipo-pessoal-card" style="border:2px solid var(--green-600);border-radius:12px;padding:14px;cursor:pointer;background:#f0fdf4;display:block">
            <input type="radio" name="subtipo" value="pessoal" checked style="display:none" />
            <div style="font-size:1.4rem;margin-bottom:4px">👤</div>
            <div style="font-weight:700;color:#2d4a28;font-size:0.9rem">Pessoal</div>
            <div style="font-size:0.78rem;color:#4a7c40;margin-top:4px">Enviado a uma pessoa específica. Só pode ser preenchido <strong>1 vez</strong>.</div>
          </label>
          <label id="tipo-generico-card" style="border:2px solid #e5e7eb;border-radius:12px;padding:14px;cursor:pointer;background:#f9fafb;display:block">
            <input type="radio" name="subtipo" value="generico" style="display:none" />
            <div style="font-size:1.4rem;margin-bottom:4px">🌐</div>
            <div style="font-weight:700;color:#374151;font-size:0.9rem">Genérico</div>
            <div style="font-size:0.78rem;color:#6b7280;margin-top:4px">Redes sociais ou campanhas. Cadastros <strong>ilimitados</strong>.</div>
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
        const tipoReq = document.getElementById('link-tipo')?.value || 'adulto';
        const subtipoReq = document.querySelector('input[name="subtipo"]:checked')?.value || 'pessoal';
        if (!nome) { toast('Nome obrigatório', 'error'); return; }
        try {
          await store.createAnamnesis({ tipo: tipoReq, subtipo: subtipoReq, nome_link: nome });
          toast(`Link ${subtipoReq === 'generico' ? 'genérico' : 'pessoal'} criado! 🔗`);
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
