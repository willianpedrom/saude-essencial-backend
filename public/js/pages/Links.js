import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { toast, modal, generateSlug } from '../utils.js';

export function renderLinks(router) {
    const cid = auth.current.id;
    const consultant = auth.current;

    function renderList() {
        const links = store.getLinks(cid);
        const pc = document.getElementById('link-list');
        if (!pc) return;
        pc.innerHTML = links.length === 0
            ? `<div class="empty-state"><div class="empty-state-icon">🔗</div>
          <h4>Nenhum link criado ainda</h4>
          <p>Crie links exclusivos de anamnese para seus clientes se cadastrarem sozinhos</p>
          <button class="btn btn-primary" id="btn-new-link-empty">+ Criar Primeiro Link</button>
        </div>`
            : links.map(l => {
                const url = `${window.location.origin}${window.location.pathname}#/anamnese/${l.slug}`;
                return `
          <div class="link-card">
            <div class="link-card-icon">🔗</div>
            <div class="link-card-info">
              <div class="link-card-name">${l.name}</div>
              <div class="link-card-url" title="${url}">${url}</div>
            </div>
            <div class="link-card-stats">
              <div class="link-stat"><strong>${l.clicks || 0}</strong>Cliques</div>
              <div class="link-stat"><strong>${l.clients || 0}</strong>Cadastros</div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button class="btn btn-secondary btn-sm" data-copy="${url}" title="Copiar link">📋 Copiar</button>
              <button class="btn btn-secondary btn-sm" data-whatsapp="${url}" title="Enviar WhatsApp">📱 WhatsApp</button>
              <button class="btn btn-danger btn-sm" data-delete="${l.id}">🗑️</button>
            </div>
          </div>`;
            }).join('');

        pc.querySelectorAll('[data-copy]').forEach(btn => {
            btn.addEventListener('click', () => {
                navigator.clipboard.writeText(btn.dataset.copy).then(() => toast('Link copiado! 📋'));
            });
        });
        pc.querySelectorAll('[data-whatsapp]').forEach(btn => {
            btn.addEventListener('click', () => {
                const msg = encodeURIComponent(`Olá! Para recebermos seu protocolo personalizado de saúde natural, preencha a anamnese pelo link abaixo:\n\n${btn.dataset.whatsapp}\n\n💚 ${consultant.name}`);
                window.open(`https://wa.me/?text=${msg}`, '_blank');
            });
        });
        pc.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => {
                modal('Excluir Link', '<p>Deseja excluir este link?</p>', {
                    confirmLabel: 'Excluir', confirmClass: 'btn-danger',
                    onConfirm: () => { store.deleteLink(cid, btn.dataset.delete); renderList(); toast('Link excluído.', 'warning'); }
                });
            });
        });
        const emptyBtn = pc.querySelector('#btn-new-link-empty');
        if (emptyBtn) emptyBtn.addEventListener('click', showNewLinkModal);
    }

    function showNewLinkModal() {
        modal('Novo Link de Anamnese', `
      <p style="margin-bottom:16px;color:var(--text-muted);font-size:0.9rem">Crie um link exclusivo para seus potenciais clientes preencherem a anamnese e receberem o protocolo personalizado.</p>
      <div class="form-group">
        <label class="field-label">Nome do Link (identificação interna)</label>
        <input class="field-input" id="link-name" placeholder="Ex: Instagram Stories, Indicação da Maria..." />
      </div>`, {
            confirmLabel: 'Criar Link',
            onConfirm: () => {
                const name = document.getElementById('link-name').value.trim();
                if (!name) { toast('Nome obrigatório', 'error'); return; }
                const slug = generateSlug(name);
                store.addLink(cid, { name, slug });
                renderList();
                toast('Link criado! Compartilhe com seus clientes 🔗');
            }
        });
    }

    const html = `
    <div style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
        <div>
          <p style="color:var(--text-muted);font-size:0.9rem;max-width:600px">
            Crie links exclusivos de anamnese. Quando um cliente preencher o formulário pelo seu link, 
            o protocolo personalizado é gerado automaticamente com o seu contato no rodapé.
          </p>
        </div>
        <button class="btn btn-primary" id="btn-new-link">+ Novo Link</button>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px" id="link-list"></div>`;

    renderLayout(router, 'Links de Captação', html, 'links');
    renderList();
    document.getElementById('btn-new-link').addEventListener('click', showNewLinkModal);
}
