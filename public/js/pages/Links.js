import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { toast } from '../utils.js';

export async function renderLinks(router) {
  const consultant = auth.current;
  const slug = consultant?.slug || 'meu-link';
  const baseUrl = window.location.origin;

  renderLayout(router, 'Links de Captação',
    `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando...</div>`,
    'links');

  async function refresh() {
    const anamneses = await store.getAnamneses().catch(() => []);
    // Show anamneses that have a link_token (publicly created)
    const links = anamneses.filter(a => a.link_token);

    const html = `
    <div style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
        <div>
          <p style="color:var(--text-muted);font-size:0.9rem;max-width:600px">
            Crie links exclusivos. Quando um cliente preencher a anamnese pelo link, 
            o protocolo personalizado é gerado com o seu contato.
          </p>
        </div>
        <button class="btn btn-primary" id="btn-new-link">+ Gerar Novo Link</button>
      </div>
    </div>

    <!-- Seu link base -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><h3>🌐 Seu Link Exclusivo</h3></div>
      <div class="card-body">
        <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:12px">
          Compartilhe este link para novos clientes preencherem a anamnese e receberem o protocolo:
        </p>
        ${links.map(l => {
      const url = `${baseUrl}/#/anamnese/${l.link_token}`;
      return `
          <div class="link-card" style="margin-bottom:10px">
            <div class="link-card-icon">🔗</div>
            <div class="link-card-info">
              <div class="link-card-name">Link ${l.link_token.slice(0, 8)}...</div>
              <div class="link-card-url" style="font-size:0.78rem;word-break:break-all">${url}</div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button class="btn btn-secondary btn-sm" data-copy="${url}">📋 Copiar</button>
              <button class="btn btn-secondary btn-sm" data-whatsapp="${url}">📱 WhatsApp</button>
            </div>
          </div>`;
    }).join('') || `
          <div class="empty-state">
            <div class="empty-state-icon">🔗</div>
            <h4>Nenhum link criado ainda</h4>
            <p>Clique em "+ Gerar Novo Link" para criar seu primeiro link de captação</p>
          </div>`}
      </div>
    </div>`;

    const pc = document.getElementById('page-content');
    if (pc) pc.innerHTML = html;

    pc?.querySelector('#btn-new-link')?.addEventListener('click', async () => {
      try {
        const result = await store.createAnamnesis({});
        toast('Link gerado! Compartilhe com seus clientes 🔗');
        await refresh();
      } catch (err) {
        toast('Erro ao criar link: ' + err.message, 'error');
      }
    });

    pc?.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.copy).then(() => toast('Link copiado! 📋'));
      });
    });

    pc?.querySelectorAll('[data-whatsapp]').forEach(btn => {
      btn.addEventListener('click', () => {
        const nome = consultant?.nome || consultant?.name || 'Consultora';
        const msg = encodeURIComponent(`Olá! Para receber seu protocolo personalizado de saúde natural, preencha a anamnese pelo link abaixo:\n\n${btn.dataset.whatsapp}\n\n💚 ${nome}`);
        window.open(`https://wa.me/?text=${msg}`, '_blank');
      });
    });
  }

  await refresh();
}
