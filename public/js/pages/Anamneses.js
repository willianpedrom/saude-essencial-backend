import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { ANAMNESIS_STEPS, ANAMNESIS_QUESTIONS } from '../data.js';
import { formatDate, toast, modal, getConsultantTitle } from '../utils.js';

export async function renderAnamnesisList(router) {
  renderLayout(router, 'Links de Anamnese',
    `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando...</div>`,
    'anamnesis');

  let all = [];

  async function load() {
    all = await store.getAnamneses().catch(() => []);
    render();
  }

  function render() {
    const pc = document.getElementById('page-content');
    if (!pc) return;

    const pessoais = all.filter(a => (a.subtipo || 'pessoal') === 'pessoal');
    const genericos = all.filter(a => a.subtipo === 'generico');

    const baseUrl = window.location.origin;

    function typeChip(subtipo) {
      return subtipo === 'generico'
        ? `<span style="background:#dbeafe;color:#1d4ed8;font-size:0.7rem;padding:1px 6px;border-radius:10px;white-space:nowrap">🌐 Genérico</span>`
        : `<span style="background:#f3e8ff;color:#6b21a8;font-size:0.7rem;padding:1px 6px;border-radius:10px;white-space:nowrap">👤 Pessoal</span>`;
    }

    // ── Section 1: Personal pending links ──────────────────────────────
    const pessoaisHtml = pessoais.length === 0
      ? `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:0.9rem">Nenhum link pessoal aguardando preenchimento</div>`
      : pessoais.map(a => {
        const url = `${baseUrl}/#/anamnese/${a.token_publico}`;
        const nome = a.nome_link || a.cliente_nome || '(sem nome)';
        const initials = nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
        return `
          <tr>
            <td>${typeChip('pessoal')}</td>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div class="client-avatar-sm" style="width:32px;height:32px;font-size:0.75rem">${initials}</div>
                <div>
                  <div style="font-weight:600;font-size:0.9rem">${nome}</div>
                  <div style="font-size:0.72rem;color:var(--text-muted);word-break:break-all;max-width:280px">${url}</div>
                </div>
              </div>
            </td>
            <td style="white-space:nowrap">${formatDate(a.criado_em)}</td>
            <td><span class="badge-gold">⏳ Aguardando</span></td>
            <td>
              <div style="display:flex;gap:6px">
                <button class="btn btn-secondary btn-sm" data-copy="${url}" title="Copiar link">📋</button>
                <button class="btn btn-secondary btn-sm" data-wa="${url}" data-name="${nome}" title="WhatsApp">📱</button>
                <button class="btn btn-danger btn-sm" data-del="${a.id}" data-dname="${nome}">🗑️</button>
              </div>
            </td>
          </tr>`;
      }).join('');

    // ── Section 2: Generic links (always visible, with stats) ──────────
    const genericosHtml = genericos.length === 0
      ? `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:0.9rem">Nenhum link genérico criado. <a href="#/links" style="color:var(--green-600)">Criar em Links de Captação</a></div>`
      : genericos.map(a => {
        const url = `${baseUrl}/#/anamnese/${a.token_publico}`;
        const nome = a.nome_link || 'Campanha';
        const visitas = parseInt(a.visitas || a.acessos || 0);
        const preenchi = parseInt(a.preenchimentos || 0);
        const taxa = visitas > 0 ? Math.round((preenchi / visitas) * 100) : 0;
        const taxaColor = taxa >= 50 ? 'var(--green-700)' : taxa >= 20 ? '#d97706' : '#dc2626';
        return `
          <tr>
            <td>${typeChip('generico')}</td>
            <td>
              <div>
                <div style="font-weight:600;font-size:0.9rem">${nome}</div>
                <div style="font-size:0.72rem;color:var(--text-muted);word-break:break-all;max-width:280px">${url}</div>
              </div>
            </td>
            <td style="white-space:nowrap">${formatDate(a.criado_em)}</td>
            <td>
              <div style="font-size:0.82rem;line-height:1.8;min-width:140px">
                <div>👁️ <strong>${visitas}</strong> acessos</div>
                <div>✅ <strong>${preenchi}</strong> preenchimentos</div>
                ${visitas > 0 ? `
                <div style="margin-top:4px">
                  <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--text-muted);margin-bottom:2px">
                    <span>Conversão</span>
                    <strong style="color:${taxaColor}">${taxa}%</strong>
                  </div>
                  <div style="background:#e5e7eb;border-radius:4px;height:5px;overflow:hidden">
                    <div style="background:${taxaColor};width:${Math.min(taxa, 100)}%;height:100%;border-radius:4px;transition:width 0.5s"></div>
                  </div>
                </div>` : ''}
              </div>
            </td>
            <td>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                <button class="btn btn-secondary btn-sm" data-copy="${url}" title="Copiar link">📋</button>
                <button class="btn btn-secondary btn-sm" data-wa="${url}" data-name="${nome}" title="WhatsApp">📱</button>
                ${preenchi > 0 ? `<button class="btn btn-primary btn-sm" data-fills="${a.id}" data-fillname="${nome}">📋 ${preenchi} fichas</button>` : ''}
                <button class="btn btn-danger btn-sm" data-del="${a.id}" data-dname="${nome}">🗑️</button>
              </div>
            </td>
          </tr>`;
      }).join('');


    pc.innerHTML = `
      ${pessoais.length > 0 ? `
      <div class="card" style="margin-bottom:16px">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;gap:8px">
          <span style="font-size:1rem">👤</span>
          <h3 style="margin:0;font-size:1rem">Links Pessoais <span style="font-size:0.8rem;font-weight:400;color:var(--text-muted);margin-left:4px">— aguardando preenchimento</span></h3>
        </div>
        <div style="overflow-x:auto">
          <table class="clients-table">
            <thead><tr>
              <th>Tipo</th><th>Cliente</th><th>Data de Envio</th><th>Status</th><th>Ações</th>
            </tr></thead>
            <tbody>${pessoaisHtml}</tbody>
          </table>
        </div>
      </div>` : ''}

      <div class="card">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:1rem">🌐</span>
            <h3 style="margin:0;font-size:1rem">Links Genéricos <span style="font-size:0.8rem;font-weight:400;color:var(--text-muted);margin-left:4px">— redes sociais e campanhas</span></h3>
          </div>
          <a href="#/links" class="btn btn-primary btn-sm">+ Novo Link</a>
        </div>
        <div style="overflow-x:auto">
          <table class="clients-table">
            <thead><tr>
              <th>Tipo</th><th>Campanha</th><th>Criado em</th><th>Estatísticas</th><th>Ações</th>
            </tr></thead>
            <tbody>${genericosHtml}</tbody>
          </table>
        </div>
      </div>

      ${pessoais.length === 0 && genericos.length === 0 ? `
      <div class="empty-state" style="margin-top:20px">
        <div class="empty-state-icon">📋</div>
        <h4>Nenhuma anamnese</h4>
        <p>Crie links de captação para receber anamneses de clientes</p>
        <a href="#/links" class="btn btn-primary">🔗 Criar Links de Captação</a>
      </div>` : ''}`;

    bindEvents(pc);
  }

  function bindEvents(pc) {
    // Copy link
    pc.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.copy)
          .then(() => toast('Link copiado! 📋'))
          .catch(() => prompt('Copie o link:', btn.dataset.copy));
      });
    });

    // WhatsApp
    pc.querySelectorAll('[data-wa]').forEach(btn => {
      btn.addEventListener('click', () => {
        const consultant = auth.current;
        const title = getConsultantTitle(consultant?.genero).toLowerCase();
        const nome = consultant?.nome || 'Consultora';
        const msg = encodeURIComponent(
          `Olá ${btn.dataset.name}! 💧 Sou ${nome}, ${title} da Gota Essencial.\n\nPreencha sua avaliação de saúde pelo link abaixo e receba seu protocolo personalizado:\n\n${btn.dataset.wa}\n\nDemora apenas ~5 minutos! 💧`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank');
      });
    });

    // Delete
    pc.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const nome = btn.dataset.dname;
        modal('Excluir Link', `<p>Deseja excluir <strong>"${nome}"</strong>? Esta ação não pode ser desfeita.</p>`, {
          confirmLabel: 'Excluir', confirmClass: 'btn-danger',
          onConfirm: async () => {
            try {
              await store.deleteAnamnesis(btn.dataset.del);
              toast('Excluído.', 'warning');
              await load();
            } catch (err) {
              toast('Erro: ' + err.message, 'error');
            }
          }
        });
      });
    });

    // View fills for generic link
    pc.querySelectorAll('[data-fills]').forEach(btn => {
      btn.addEventListener('click', () => showGenericFills(btn.dataset.fills, btn.dataset.fillname, router));
    });
  }

  async function showGenericFills(linkOrigemId, nome, router) {
    // Fetch all anamneses that were generated from this generic link
    // We use the full anamneses list from the Clients page via store
    toast('Carregando fichas...', 'info');
    try {
      const all = await store.getAnamneses();
      // The filled copies of a generic link have link_origem_id = linkOrigemId
      // But our GET /api/anamneses only returns templates... we need a different approach
      // For now, navigate to clients filtered — or show a toast message
      toast(`As fichas preenchidas do link "${nome}" estão na seção Clientes`, 'info');
      router.navigate('/clients');
    } catch (e) {
      toast('Erro ao carregar fichas.', 'error');
    }
  }

  await load();
}
