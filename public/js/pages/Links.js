import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { toast } from '../utils.js';

export async function renderLinks(router) {
  const consultant = auth.current;
  const baseUrl = window.location.origin;

  renderLayout(router, 'Links de Captação',
    `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando...</div>`,
    'links');

  async function refresh() {
    const anamneses = await store.getAnamneses().catch(() => []);
    // API returns token_publico (not link_token)
    const links = anamneses.filter(a => a.token_publico);

    const html = `
    <div style="margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
        <p style="color:var(--text-muted);font-size:0.9rem;max-width:600px">
          Crie links exclusivos. Quando um cliente preencher a anamnese pelo link, 
          o protocolo personalizado é gerado automaticamente.
        </p>
        <button class="btn btn-primary" id="btn-new-link">+ Gerar Novo Link</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>🌐 Seus Links de Captação</h3></div>
      <div class="card-body">
        ${links.length === 0
        ? `<div class="empty-state">
                 <div class="empty-state-icon">🔗</div>
                 <h4>Nenhum link criado ainda</h4>
                 <p>Clique em <strong>+ Gerar Novo Link</strong> para criar seu primeiro link de captação</p>
               </div>`
        : links.map(l => {
          // Build correct URL using browser origin, not localhost:8080
          const url = `${baseUrl}/#/anamnese/${l.token_publico}`;
          const shortToken = l.token_publico.slice(0, 8);
          const preenchido = l.preenchido ? '✅ Preenchido' : '⏳ Aguardando';
          return `
          <div class="link-card" style="margin-bottom:10px">
            <div class="link-card-icon">🔗</div>
            <div class="link-card-info" style="flex:1;min-width:0">
              <div class="link-card-name">
                Link ${shortToken}... 
                ${l.cliente_nome ? `· 👤 ${l.cliente_nome}` : ''}
                <span style="font-size:0.78rem;color:var(--text-muted);margin-left:8px">${preenchido}</span>
              </div>
              <div class="link-card-url" style="font-size:0.78rem;word-break:break-all;color:var(--text-muted)">${url}</div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button class="btn btn-secondary btn-sm" data-copy="${url}">📋 Copiar</button>
              <button class="btn btn-secondary btn-sm" data-whatsapp="${url}">📱 WhatsApp</button>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;

    const pc = document.getElementById('page-content');
    if (!pc) return;
    pc.innerHTML = html;

    pc.querySelector('#btn-new-link')?.addEventListener('click', async () => {
      const btn = pc.querySelector('#btn-new-link');
      if (btn) { btn.disabled = true; btn.textContent = 'Gerando...'; }
      try {
        await store.createAnamnesis({ tipo: 'adulto' });
        toast('Link gerado! Compartilhe com seus clientes 🔗');
        await refresh();
      } catch (err) {
        toast('Erro ao criar link: ' + err.message, 'error');
        if (btn) { btn.disabled = false; btn.textContent = '+ Gerar Novo Link'; }
      }
    });

    pc.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.copy)
          .then(() => toast('Link copiado! 📋'))
          .catch(() => {
            // Fallback for browsers without clipboard API
            prompt('Copie o link:', btn.dataset.copy);
          });
      });
    });

    pc.querySelectorAll('[data-whatsapp]').forEach(btn => {
      btn.addEventListener('click', () => {
        const nome = consultant?.nome || consultant?.name || 'Consultora';
        const msg = encodeURIComponent(
          `Olá! Para receber seu protocolo personalizado de saúde natural, preencha a anamnese pelo link abaixo:\n\n${btn.dataset.whatsapp}\n\n💚 ${nome}`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank');
      });
    });
  }

  await refresh();
}
