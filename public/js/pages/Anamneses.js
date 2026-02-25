import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { formatDate, toast } from '../utils.js';

export function renderAnamnesisList(router) {
    const cid = auth.current.id;
    const clients = store.getClients(cid);
    const anamneses = store.getAnamneses(cid).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const html = `
    <div class="card">
      <div style="overflow-x:auto">
        <table class="clients-table">
          <thead><tr>
            <th>Cliente</th><th>Data</th><th>Queixas Principais</th><th>Origem</th><th>Ação</th>
          </tr></thead>
          <tbody>
            ${anamneses.length === 0
            ? `<tr><td colspan="5"><div class="empty-state">
                  <div class="empty-state-icon">📋</div>
                  <h4>Nenhuma anamnese realizada</h4>
                  <p>As anamneses realizadas pelo link público aparecerão aqui</p>
                  <button class="btn btn-primary" onclick="location.hash='#/links'">Criar Link de Anamnese</button>
                </div></td></tr>`
            : anamneses.map(a => {
                const c = clients.find(cl => cl.id === a.clientId);
                const answers = a.answers || {};
                const symptoms = [
                    ...(answers.general_symptoms || []),
                    ...(answers.emotional_symptoms || []),
                    ...(answers.digestive_symptoms || []),
                ].slice(0, 3);
                return `<tr>
                    <td><div class="client-name-cell">
                      <div class="client-avatar-sm">${c?.name?.[0] || '?'}</div>
                      <div><div style="font-weight:600">${c?.name || 'Cliente'}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted)">${c?.email || ''}</div></div>
                    </div></td>
                    <td>${formatDate(a.createdAt)}</td>
                    <td>
                      <div style="display:flex;flex-wrap:wrap;gap:4px">
                        ${symptoms.map(s => `<span class="report-tag" style="font-size:0.72rem">${s}</span>`).join('') || '<span style="color:var(--text-muted);font-size:0.8rem">—</span>'}
                      </div>
                    </td>
                    <td><span class="badge-green">${a.linkSlug ? 'Link Externo' : 'Manual'}</span></td>
                    <td>
                      <button class="btn btn-primary btn-sm" data-view="${a.id}">Ver Protocolo</button>
                    </td>
                  </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

    renderLayout(router, 'Anamneses Realizadas', html, 'anamnesis');

    document.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
            const anamnesis = anamneses.find(a => a.id === btn.dataset.view);
            if (!anamnesis) return;
            const c = clients.find(cl => cl.id === anamnesis.clientId);
            const consultant = auth.current;
            const encoded = encodeURIComponent(JSON.stringify({
                answers: anamnesis.answers,
                consultant: { id: consultant.id, name: consultant.name, phone: consultant.phone, photo: consultant.photo },
                clientName: c?.name || 'Cliente'
            }));
            router.navigate('/protocolo', { data: encoded });
        });
    });
}
