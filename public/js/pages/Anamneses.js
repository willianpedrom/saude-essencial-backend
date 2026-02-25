import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { formatDate, toast } from '../utils.js';

export async function renderAnamnesisList(router) {
  renderLayout(router, 'Anamneses Realizadas',
    `<div style="display:flex;align-items:center;justify-content:center;height:200px;font-size:1.1rem;color:var(--text-muted)">⏳ Carregando...</div>`,
    'anamnesis');

  try {
    const [clients, anamneses] = await Promise.all([
      store.getClients().catch(() => []),
      store.getAnamneses().catch(() => []),
    ]);

    const sorted = [...anamneses].sort((a, b) =>
      new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0)
    );

    const html = `
    <div class="card">
      <div style="overflow-x:auto">
        <table class="clients-table">
          <thead><tr>
            <th>Cliente</th><th>Data</th><th>Queixas</th><th>Origem</th><th>Ação</th>
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
          const clienteId = a.cliente_id || a.clienteId || a.clientId;
          const c = clients.find(cl => cl.id === clienteId);
          const dados = a.dados || a.answers || {};
          const symptoms = [
            ...(dados.queixas_principais || dados.general_symptoms || []),
            ...(dados.emotional_symptoms || []),
          ].slice(0, 3);
          const createdAt = a.created_at || a.createdAt;
          return `<tr>
                      <td><div class="client-name-cell">
                        <div class="client-avatar-sm">${(c?.name || c?.nome || 'C')[0]}</div>
                        <div>
                          <div style="font-weight:600">${c?.name || c?.nome || 'Cliente externo'}</div>
                          <div style="font-size:0.75rem;color:var(--text-muted)">${c?.email || dados.email || ''}</div>
                        </div>
                      </div></td>
                      <td>${formatDate(createdAt)}</td>
                      <td><div style="display:flex;flex-wrap:wrap;gap:4px">
                        ${symptoms.map(s => `<span class="report-tag" style="font-size:0.72rem">${s}</span>`).join('')
            || '<span style="color:var(--text-muted);font-size:0.8rem">—</span>'}
                      </div></td>
                      <td><span class="badge-green">${a.link_token ? 'Link' : 'Manual'}</span></td>
                      <td>
                        <button class="btn btn-primary btn-sm" data-view="${a.id}">Ver Protocolo</button>
                      </td>
                    </tr>`;
        }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

    const pc = document.getElementById('page-content');
    if (pc) pc.innerHTML = html;

    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const anamnesis = sorted.find(a => a.id === btn.dataset.view);
        if (!anamnesis) return;
        const clienteId = anamnesis.cliente_id || anamnesis.clienteId;
        const c = clients.find(cl => cl.id === clienteId);
        const consultant = auth.current;
        const encoded = encodeURIComponent(JSON.stringify({
          answers: anamnesis.dados || anamnesis.answers || {},
          consultant: {
            id: consultant.id,
            name: consultant.nome || consultant.name,
            phone: consultant.telefone || consultant.phone,
          },
          clientName: c?.name || c?.nome || 'Cliente'
        }));
        router.navigate('/protocolo', { data: encoded });
      });
    });

  } catch (err) {
    const pc = document.getElementById('page-content');
    if (pc) pc.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>Erro: ${err.message}</p></div>`;
  }
}
