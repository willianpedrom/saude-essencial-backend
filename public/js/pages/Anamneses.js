import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { formatDate, toast } from '../utils.js';

export async function renderAnamnesisList(router) {
  renderLayout(router, 'Anamneses Realizadas',
    `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando...</div>`,
    'anamnesis');

  try {
    const anamneses = await store.getAnamneses().catch(() => []);
    // API returns: { id, tipo, preenchido, token_publico, criado_em, cliente_nome }
    const sorted = [...anamneses].sort((a, b) =>
      new Date(b.criado_em || 0) - new Date(a.criado_em || 0)
    );

    const baseUrl = window.location.origin;

    const html = `
    <div class="card">
      <div style="overflow-x:auto">
        <table class="clients-table">
          <thead><tr>
            <th>Cliente</th><th>Data</th><th>Tipo</th><th>Status</th><th>Ação</th>
          </tr></thead>
          <tbody>
            ${sorted.length === 0
        ? `<tr><td colspan="5"><div class="empty-state">
                     <div class="empty-state-icon">📋</div>
                     <h4>Nenhuma anamnese ainda</h4>
                     <p>As anamneses aparecerão aqui quando clientes preencherem o formulário</p>
                     <button class="btn btn-primary" onclick="location.hash='#/links'">🔗 Criar Link de Anamnese</button>
                   </div></td></tr>`
        : sorted.map(a => {
          const clienteNome = a.cliente_nome || 'Cliente externo';
          const preenchido = a.preenchido;
          const tipos = { adulto: '👤 Adulto', crianca: '🧒 Criança', pet: '🐾 Pet', mulher: '👩 Mulher' };
          return `<tr>
                      <td><div class="client-name-cell">
                        <div class="client-avatar-sm">${clienteNome[0].toUpperCase()}</div>
                        <div><div style="font-weight:600">${clienteNome}</div></div>
                      </div></td>
                      <td>${formatDate(a.criado_em)}</td>
                      <td>${tipos[a.tipo] || a.tipo || '—'}</td>
                      <td><span class="${preenchido ? 'badge-green' : 'badge-gold'}">${preenchido ? '✅ Preenchido' : '⏳ Aguardando'}</span></td>
                      <td>
                        ${preenchido
              ? `<button class="btn btn-primary btn-sm" data-view="${a.id}">Ver Protocolo</button>`
              : `<button class="btn btn-secondary btn-sm" data-copy-link="${baseUrl}/#/anamnese/${a.token_publico}">🔗 Copiar Link</button>`}
                      </td>
                    </tr>`;
        }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

    const pc = document.getElementById('page-content');
    if (pc) pc.innerHTML = html;

    // Copy link buttons
    document.querySelectorAll('[data-copy-link]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.copyLink)
          .then(() => toast('Link copiado! 📋'))
          .catch(() => prompt('Copie:', btn.dataset.copyLink));
      });
    });

    // View protocol buttons
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const anamnesis = sorted.find(a => a.id === btn.dataset.view);
        if (!anamnesis || !anamnesis.preenchido) return;
        try {
          const full = await store.getAnamnesisFull(anamnesis.id);
          const consultant = auth.current;
          const encoded = encodeURIComponent(JSON.stringify({
            answers: full.dados || {},
            consultant: {
              id: consultant.id,
              name: consultant.nome || consultant.name,
              phone: consultant.telefone || consultant.phone,
            },
            clientName: anamnesis.cliente_nome || 'Cliente'
          }));
          router.navigate('/protocolo', { data: encoded });
        } catch (err) {
          toast('Erro ao carregar protocolo: ' + err.message, 'error');
        }
      });
    });

  } catch (err) {
    const pc = document.getElementById('page-content');
    if (pc) pc.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>Erro: ${err.message}</p></div>`;
  }
}
