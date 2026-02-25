import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { toast, modal } from '../utils.js';

// Store link names in localStorage (backend has no `nome` field in anamneses)
function getLinkNames() {
  try { return JSON.parse(localStorage.getItem('se_link_names') || '{}'); } catch { return {}; }
}
function setLinkName(token, name) {
  const names = getLinkNames();
  if (name) names[token] = name;
  else delete names[token];
  localStorage.setItem('se_link_names', JSON.stringify(names));
}
function getLinkName(token) {
  return getLinkNames()[token] || '';
}

export async function renderLinks(router) {
  const consultant = auth.current;
  const baseUrl = window.location.origin;

  renderLayout(router, 'Links de Captação',
    `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando...</div>`,
    'links');

  async function refresh() {
    const all = await store.getAnamneses().catch(() => []);
    // Links are anamneses without a client (capture links)
    const links = all.filter(a => a.token_publico);

    const html = `
    <div style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
        <p style="color:var(--text-muted);font-size:0.9rem;max-width:600px;margin:0">
          Crie links de captação com nome personalizado. Compartilhe com clientes para que preencham 
          a anamnese e recebam o protocolo automaticamente.
        </p>
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
          const nome = getLinkName(l.token_publico) || 'Link sem nome';
          const preenchido = l.preenchido;
          return `
          <div class="link-card" id="lc-${l.id}" style="margin-bottom:10px;align-items:center">
            <div class="link-card-icon">${preenchido ? '✅' : '🔗'}</div>
            <div class="link-card-info" style="flex:1;min-width:0">
              <div class="link-card-name" style="font-weight:600;margin-bottom:2px">
                ${nome}
                <span style="font-size:0.75rem;font-weight:400;margin-left:8px;padding:2px 8px;border-radius:12px;${preenchido ? 'background:#dcfce7;color:#166534' : 'background:#fef9c3;color:#854d0e'}">
                  ${preenchido ? '✅ Preenchido' : '⏳ Aguardando'}
                </span>
              </div>
              <div style="font-size:0.78rem;color:var(--text-muted);word-break:break-all">${url}</div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap">
              <button class="btn btn-secondary btn-sm" data-copy="${url}">📋 Copiar</button>
              <button class="btn btn-secondary btn-sm" data-whatsapp="${url}" data-name="${nome}">📱 WhatsApp</button>
              <button class="btn btn-secondary btn-sm" data-edit-id="${l.id}" data-edit-token="${l.token_publico}" data-edit-name="${nome}">✏️</button>
              <button class="btn btn-danger btn-sm" data-delete-id="${l.id}" data-delete-token="${l.token_publico}">🗑️</button>
            </div>
          </div>`;
        }).join('')}
    </div>`;

    const pc = document.getElementById('page-content');
    if (!pc) return;
    pc.innerHTML = html;
    bindEvents(pc, links);
  }

  function bindEvents(pc, links) {
    // Create new link
    pc.querySelector('#btn-new-link')?.addEventListener('click', showNewLinkModal);

    // Copy
    pc.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.copy)
          .then(() => toast('Link copiado! 📋'))
          .catch(() => prompt('Copie o link:', btn.dataset.copy));
      });
    });

    // WhatsApp
    pc.querySelectorAll('[data-whatsapp]').forEach(btn => {
      btn.addEventListener('click', () => {
        const nome = consultant?.nome || consultant?.name || 'Consultora';
        const linkNome = btn.dataset.name || 'anamnese';
        const msg = encodeURIComponent(
          `Olá! 💚 Sou ${nome}, consultora de saúde natural.\n\nPara montar seu protocolo personalizado de bem-estar, preencha a avaliação de saúde pelo link abaixo:\n\n${btn.dataset.whatsapp}\n\nLeva apenas ~5 minutos e o protocolo é gerado automaticamente! 🌿`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank');
      });
    });

    // Edit name
    pc.querySelectorAll('[data-edit-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        showEditModal(btn.dataset.editId, btn.dataset.editToken, btn.dataset.editName);
      });
    });

    // Delete
    pc.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.deleteId;
        const token = btn.dataset.deleteToken;
        const nome = getLinkName(token) || 'este link';
        modal('Excluir Link', `<p>Deseja excluir <strong>"${nome}"</strong>? Esta ação não pode ser desfeita.</p>`, {
          confirmLabel: 'Excluir', confirmClass: 'btn-danger',
          onConfirm: async () => {
            try {
              await store.deleteAnamnesis(id);
              setLinkName(token, null); // remove name from localStorage
              toast('Link excluído.', 'warning');
              await refresh();
            } catch (err) {
              toast('Erro ao excluir: ' + err.message, 'error');
            }
          }
        });
      });
    });
  }

  function showNewLinkModal() {
    modal('Novo Link de Captação', `
      <p style="margin-bottom:16px;color:var(--text-muted);font-size:0.9rem">
        Dê um nome para identificar de onde vêm os clientes deste link.
      </p>
      <div class="form-group">
        <label class="field-label">Nome do Link *</label>
        <input class="field-input" id="link-nome" placeholder="Ex: Instagram Stories, Grupo WhatsApp, Feira da Saúde..." autofocus />
      </div>`, {
      confirmLabel: '🔗 Gerar Link',
      onConfirm: async () => {
        const nome = document.getElementById('link-nome')?.value?.trim();
        if (!nome) { toast('Nome obrigatório', 'error'); return; }
        try {
          const res = await store.createAnamnesis({ tipo: 'adulto' });
          if (res.token_publico) setLinkName(res.token_publico, nome);
          toast('Link criado! 🔗 Compartilhe com seus clientes');
          await refresh();
        } catch (err) {
          toast('Erro: ' + err.message, 'error');
        }
      }
    });
    setTimeout(() => document.getElementById('link-nome')?.focus(), 100);
  }

  function showEditModal(id, token, currentName) {
    modal('Renomear Link', `
      <div class="form-group">
        <label class="field-label">Nome do Link</label>
        <input class="field-input" id="edit-nome" value="${currentName !== 'Link sem nome' ? currentName : ''}" placeholder="Ex: Instagram, Grupo WhatsApp..." autofocus />
      </div>`, {
      confirmLabel: 'Salvar',
      onConfirm: async () => {
        const nome = document.getElementById('edit-nome')?.value?.trim();
        if (!nome) { toast('Nome obrigatório', 'error'); return; }
        setLinkName(token, nome);
        toast('Link renomeado! ✅');
        await refresh();
      }
    });
    setTimeout(() => document.getElementById('edit-nome')?.focus(), 100);
  }

  await refresh();
}
