import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { ANAMNESIS_STEPS, ANAMNESIS_QUESTIONS } from '../data.js';
import { formatDate, toast, modal } from '../utils.js';

export async function renderAnamnesisList(router) {
  renderLayout(router, 'Anamneses Realizadas',
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

    pc.innerHTML = `
      <div class="card">
        <div style="overflow-x:auto">
          <table class="clients-table">
            <thead><tr>
              <th>Cliente</th><th>Data</th><th>Tipo</th><th>Status</th><th>Ações</th>
            </tr></thead>
            <tbody>
              ${all.length === 0
        ? `<tr><td colspan="5"><div class="empty-state">
                     <div class="empty-state-icon">📋</div>
                     <h4>Nenhuma anamnese ainda</h4>
                     <p>Compartilhe um link de captação para receber anamneses de clientes</p>
                     <button class="btn btn-primary" onclick="location.hash='#/links'">🔗 Ir para Links</button>
                   </div></td></tr>`
        : all.map(a => {
          // Client name: from DB join (cliente_nome) OR extracted from dados
          const nomeDisplay = a.cliente_nome || '(sem nome)';
          const initials = nomeDisplay.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
          const tipos = { adulto: '👤 Adulto', crianca: '🧒 Criança', pet: '🐾 Pet', mulher: '👩 Mulher' };
          return `
                <tr>
                  <td>
                    <div class="client-name-cell">
                      <div class="client-avatar-sm">${initials}</div>
                      <div>
                        <div style="font-weight:600">${nomeDisplay}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted)">${tipos[a.tipo] || a.tipo || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>${formatDate(a.criado_em)}</td>
                  <td>${tipos[a.tipo] || '—'}</td>
                  <td>
                    <span class="${a.preenchido ? 'badge-green' : 'badge-gold'}">
                      ${a.preenchido ? '✅ Preenchido' : '⏳ Aguardando'}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                      ${a.preenchido
              ? `<button class="btn btn-primary btn-sm" data-view="${a.id}">📋 Ver Ficha</button>`
              : `<button class="btn btn-secondary btn-sm" data-copylink="${window.location.origin}/#/anamnese/${a.token_publico}">🔗 Copiar Link</button>`}
                      <button class="btn btn-danger btn-sm" data-del="${a.id}" data-name="${nomeDisplay}">🗑️</button>
                    </div>
                  </td>
                </tr>`;
        }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;

    // Bind events
    pc.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => showClientProfile(btn.dataset.view));
    });
    pc.querySelectorAll('[data-copylink]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.copylink)
          .then(() => toast('Link copiado! 📋'))
          .catch(() => prompt('Copie o link:', btn.dataset.copylink));
      });
    });
    pc.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const nome = btn.dataset.name;
        modal('Excluir Anamnese', `<p>Deseja excluir a anamnese de <strong>${nome}</strong>? Esta ação não pode ser desfeita.</p>`, {
          confirmLabel: 'Excluir', confirmClass: 'btn-danger',
          onConfirm: async () => {
            try {
              await store.deleteAnamnesis(btn.dataset.del);
              toast('Anamnese excluída.', 'warning');
              await load();
            } catch (err) {
              toast('Erro: ' + err.message, 'error');
            }
          }
        });
      });
    });
  }

  async function showClientProfile(id) {
    const anamnese = all.find(a => a.id === id);
    if (!anamnese) return;

    let dados = {};
    try {
      const full = await store.getAnamnesisFull(id);
      dados = full.dados || {};
    } catch { dados = {}; }

    // Personal data — from dados fields (filled by the client in the form)
    const nome = dados.full_name || anamnese.cliente_nome || '—';
    const email = dados.email || '—';
    const phone = dados.phone || '—';
    const birthdate = dados.birthdate ? formatDate(dados.birthdate) : '—';
    const city = dados.city || '—';
    const occupation = dados.occupation || '—';

    // Build WhatsApp link
    const phoneClean = (dados.phone || '').replace(/\D/g, '');
    const waUrl = phoneClean
      ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(`Olá ${nome}! Sou ${auth.current?.nome || 'sua consultora'} da Saúde Essencial. Preparei seu protocolo personalizado! 💚🌿`)}`
      : '';

    // Build answers section HTML
    const answersHtml = ANAMNESIS_STEPS.map(step => {
      const section = ANAMNESIS_QUESTIONS[step.id];
      if (!section || step.id === 'personal') return ''; // skip personal, already shown above

      const parts = [];

      if (section.sections) {
        section.sections.forEach(sec => {
          const val = dados[sec.key];
          if (!val || (Array.isArray(val) && val.length === 0)) return;

          if (sec.type === 'checkbox' && Array.isArray(val) && val.length > 0) {
            parts.push(`
                <div style="margin-bottom:12px">
                  <div style="font-size:0.8rem;font-weight:600;color:var(--text-muted);margin-bottom:6px">${sec.label}</div>
                  <div style="display:flex;flex-wrap:wrap;gap:4px">
                    ${val.map(v => `<span class="report-tag" style="font-size:0.75rem">${v}</span>`).join('')}
                  </div>
                </div>`);
          } else if (sec.type === 'scale' && val !== null) {
            parts.push(`<div style="margin-bottom:8px;font-size:0.85rem"><strong>${sec.label}:</strong> <span style="font-weight:600;color:var(--green-600)">${val}${sec.max ? '/' + sec.max : ''}</span></div>`);
          } else if (sec.type === 'radio' && val) {
            parts.push(`<div style="margin-bottom:8px;font-size:0.85rem"><strong>${sec.label.split('?')[0]}:</strong> ${val}</div>`);
          } else if (sec.type === 'textarea' && val) {
            parts.push(`<div style="margin-bottom:10px"><div style="font-size:0.8rem;font-weight:600;color:var(--text-muted);margin-bottom:4px">${sec.label}</div><div style="font-size:0.85rem;background:#f9fafb;padding:10px 12px;border-radius:8px;border-left:3px solid var(--green-400)">${val}</div></div>`);
          }
        });
      }

      if (parts.length === 0) return '';
      return `
        <div style="margin-bottom:20px;padding:16px;background:#f9fafb;border-radius:12px">
          <h4 style="margin-bottom:12px;color:var(--text-dark);font-size:0.95rem">${step.icon} ${section.title}</h4>
          ${parts.join('')}
        </div>`;
    }).join('');

    const modalHtml = `
      <div style="max-height:70vh;overflow-y:auto;padding-right:4px">
        <!-- Header card: personal data -->
        <div style="background:linear-gradient(135deg,#2d4a28,#4a7c40);border-radius:12px;padding:20px;color:white;margin-bottom:20px">
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:700">
              ${nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
            </div>
            <div>
              <div style="font-size:1.15rem;font-weight:700">${nome}</div>
              <div style="font-size:0.85rem;opacity:0.8">${occupation !== '—' ? occupation : ''} · ${city}</div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px;font-size:0.85rem">
            <div>📧 ${email}</div>
            <div>📱 ${phone}</div>
            <div>🎂 ${birthdate}</div>
            <div>📅 Anamnese: ${formatDate(anamnese.criado_em)}</div>
          </div>
          <div style="display:flex;gap:8px;margin-top:14px">
            ${waUrl ? `<a href="${waUrl}" target="_blank" class="btn btn-sm" style="background:#25D366;color:white;text-decoration:none;border:none">📱 WhatsApp</a>` : ''}
            <button class="btn btn-sm" style="background:rgba(255,255,255,0.15);color:white;border-color:rgba(255,255,255,0.3)" data-editclient="${anamnese.cliente_id || ''}">✏️ Editar Cadastro</button>
            <button class="btn btn-sm" style="background:rgba(255,255,255,0.15);color:white;border-color:rgba(255,255,255,0.3)" data-protocolo="${id}">🌿 Ver Protocolo</button>
          </div>
        </div>

        <!-- Answers by section -->
        <div style="font-size:0.9rem;font-weight:700;color:var(--text-muted);letter-spacing:0.05em;margin-bottom:12px">RESPOSTAS DO QUESTIONÁRIO</div>
        ${answersHtml || '<p style="color:var(--text-muted)">Nenhuma resposta registrada.</p>'}
      </div>`;

    const { el } = modal(`📋 Ficha de ${nome}`, modalHtml, {});

    el.querySelector('[data-protocolo]')?.addEventListener('click', () => {
      const consultant = auth.current;
      const encoded = encodeURIComponent(JSON.stringify({
        answers: dados,
        consultant: { name: consultant?.nome || consultant?.name },
        clientName: nome
      }));
      router.navigate('/protocolo', { data: encoded });
    });

    el.querySelector('[data-editclient]')?.addEventListener('click', async () => {
      const clienteId = el.querySelector('[data-editclient]').dataset.editclient;
      if (!clienteId) { toast('Este cliente não tem cadastro vinculado.', 'info'); return; }
      showEditClientModal(clienteId, { nome, email: dados.email, phone: dados.phone, birthdate: dados.birthdate, city: dados.city, occupation: dados.occupation });
    });
  }

  function showEditClientModal(clienteId, prefill) {
    modal('✏️ Editar Cadastro do Cliente', `
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Nome completo *</label>
          <input class="field-input" id="ec-name" value="${prefill.nome || ''}" />
        </div>
        <div class="form-group">
          <label class="field-label">E-mail</label>
          <input class="field-input" id="ec-email" type="email" value="${prefill.email || ''}" />
        </div>
        <div class="form-group">
          <label class="field-label">WhatsApp</label>
          <input class="field-input" id="ec-phone" value="${prefill.phone || ''}" />
        </div>
        <div class="form-group">
          <label class="field-label">Data de Nascimento</label>
          <input class="field-input" id="ec-birthdate" type="date" value="${prefill.birthdate || ''}" />
        </div>
        <div class="form-group">
          <label class="field-label">Cidade</label>
          <input class="field-input" id="ec-city" value="${prefill.city || ''}" />
        </div>
        <div class="form-group">
          <label class="field-label">Status</label>
          <select class="field-select" id="ec-status">
            <option value="lead">Lead 🟡</option>
            <option value="active">Ativo 🟢</option>
            <option value="inactive">Inativo 🔴</option>
          </select>
        </div>
      </div>`, {
      confirmLabel: 'Salvar',
      onConfirm: async () => {
        const data = {
          name: document.getElementById('ec-name').value.trim(),
          email: document.getElementById('ec-email').value.trim(),
          phone: document.getElementById('ec-phone').value.trim(),
          birthdate: document.getElementById('ec-birthdate').value || null,
          city: document.getElementById('ec-city').value.trim(),
          status: document.getElementById('ec-status').value,
        };
        if (!data.name) { toast('Nome obrigatório', 'error'); return; }
        try {
          await store.updateClient(clienteId, data);
          toast('Cadastro atualizado! ✅');
          await load(); // refresh the list
        } catch (err) {
          toast('Erro: ' + err.message, 'error');
        }
      }
    });
  }

  await load();
}
