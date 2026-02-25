import { auth, store } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { formatDate, formatCurrency, toast, modal } from '../utils.js';

// ================ DEPOIMENTOS ================
export function renderTestimonials(router) {
    const cid = auth.current.id;
    const clients = store.getClients(cid);

    function renderList() {
        const testimonials = store.getTestimonials(cid);
        const container = document.getElementById('testimonials-list');
        if (!container) return;
        container.innerHTML = testimonials.length === 0
            ? `<div class="empty-state"><div class="empty-state-icon">⭐</div><h4>Nenhum depoimento ainda</h4>
         <p>Registre depoimentos de clientes satisfeitas para usar no seu marketing</p></div>`
            : testimonials.map(t => {
                const c = clients.find(cl => cl.id === t.clientId);
                return `
            <div class="testimonial-card" style="margin-bottom:14px">
              ${!t.approved ? `<div style="position:absolute;top:12px;right:12px"><span class="badge-gold">Pendente</span></div>` : ''}
              <div class="testimonial-text">${t.text}</div>
              <div class="testimonial-author">
                <div class="testimonial-author-avatar">${c?.name?.[0] || 'C'}</div>
                <div>
                  <div class="testimonial-stars">${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}</div>
                  <div class="testimonial-author-name">${c?.name || 'Cliente'}</div>
                  <div class="testimonial-author-sub">${formatDate(t.createdAt)}</div>
                </div>
                <div style="margin-left:auto;display:flex;gap:6px">
                  ${!t.approved ? `<button class="btn btn-primary btn-sm" data-approve="${t.id}">✅ Aprovar</button>` : '<span class="badge-green">Aprovado</span>'}
                </div>
              </div>
            </div>`;
            }).join('');

        container.querySelectorAll('[data-approve]').forEach(btn => {
            btn.addEventListener('click', () => {
                store.approveTestimonial(cid, btn.dataset.approve);
                renderList();
                toast('Depoimento aprovado! ⭐');
            });
        });
    }

    function showAddModal() {
        modal('Registrar Depoimento', `
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Cliente *</label>
          <select class="field-select" id="t-client">
            <option value="">— Selecione —</option>
            ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Depoimento *</label>
          <textarea class="field-textarea" id="t-text" placeholder="Digite o que a cliente disse..."></textarea>
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Avaliação (estrelas)</label>
          <div style="display:flex;gap:6px" id="star-selector">
            ${[1, 2, 3, 4, 5].map(n => `<span class="star-btn" data-star="${n}" style="font-size:1.5rem;cursor:pointer;color:#ddd">★</span>`).join('')}
          </div>
          <input type="hidden" id="t-rating" value="5" />
        </div>
      </div>`, {
            confirmLabel: 'Salvar',
            onConfirm: () => {
                const clientId = document.getElementById('t-client').value;
                const text = document.getElementById('t-text').value.trim();
                if (!clientId || !text) { toast('Preencha todos os campos', 'error'); return; }
                store.addTestimonial(cid, { clientId, text, rating: parseInt(document.getElementById('t-rating').value) || 5 });
                renderList(); toast('Depoimento registrado!');
            }
        });
        let rating = 5;
        function updateStars() {
            document.querySelectorAll('.star-btn').forEach(s => {
                s.style.color = parseInt(s.dataset.star) <= rating ? '#c99a22' : '#ddd';
            });
        }
        updateStars();
        document.querySelectorAll('.star-btn').forEach(s => {
            s.addEventListener('click', () => { rating = parseInt(s.dataset.star); document.getElementById('t-rating').value = rating; updateStars(); });
        });
    }

    const html = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
      <button class="btn btn-primary" id="btn-add-t">+ Registrar Depoimento</button>
    </div>
    <div id="testimonials-list" style="position:relative"></div>`;
    renderLayout(router, 'Depoimentos & Testemunhos', html, 'testimonials');
    renderList();
    document.getElementById('btn-add-t').addEventListener('click', showAddModal);
}

// ================ COMPRAS ================
export function renderPurchases(router) {
    const cid = auth.current.id;
    const clients = store.getClients(cid);

    function renderList() {
        const purchases = store.getPurchases(cid).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const total = purchases.reduce((s, p) => s + (Number(p.value) || 0), 0);
        const container = document.getElementById('purchases-list');
        if (!container) return;

        document.getElementById('total-revenue').textContent = formatCurrency(total);

        container.innerHTML = purchases.length === 0
            ? `<div class="empty-state"><div class="empty-state-icon">🛒</div><h4>Nenhuma compra registrada</h4></div>`
            : `<table class="clients-table">
          <thead><tr><th>Cliente</th><th>Produto / Kit</th><th>Data</th><th>Valor</th><th>Observação</th></tr></thead>
          <tbody>
            ${purchases.map(p => {
                const c = clients.find(cl => cl.id === p.clientId);
                return `<tr>
                <td>${c?.name || '—'}</td>
                <td>${p.product || '—'}</td>
                <td>${formatDate(p.date || p.createdAt)}</td>
                <td style="font-weight:700;color:var(--green-700)">${formatCurrency(p.value)}</td>
                <td style="color:var(--text-muted);font-size:0.82rem">${p.note || '—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>`;
    }

    function showAddModal() {
        modal('Registrar Compra', `
      <div class="form-grid">
        <div class="form-group form-field-full">
          <label class="field-label">Cliente *</label>
          <select class="field-select" id="pu-client">
            <option value="">— Selecione —</option>
            ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Produto / Kit *</label>
          <input class="field-input" id="pu-product" placeholder="Ex: Lavanda 15ml, Kit Imunidade..." />
        </div>
        <div class="form-group">
          <label class="field-label">Valor (R$)</label>
          <input class="field-input" id="pu-value" type="number" step="0.01" placeholder="0,00" />
        </div>
        <div class="form-group">
          <label class="field-label">Data</label>
          <input class="field-input" id="pu-date" type="date" value="${new Date().toISOString().slice(0, 10)}" />
        </div>
        <div class="form-group form-field-full">
          <label class="field-label">Observação</label>
          <input class="field-input" id="pu-note" placeholder="Ex: pagamento PIX, frete grátis..." />
        </div>
      </div>`, {
            confirmLabel: 'Registrar',
            onConfirm: () => {
                const clientId = document.getElementById('pu-client').value;
                const product = document.getElementById('pu-product').value.trim();
                if (!clientId || !product) { toast('Cliente e produto são obrigatórios', 'error'); return; }
                store.addPurchase(cid, {
                    clientId, product,
                    value: parseFloat(document.getElementById('pu-value').value) || 0,
                    date: document.getElementById('pu-date').value,
                    note: document.getElementById('pu-note').value,
                });
                store.updateClient(cid, clientId, { status: 'active' });
                renderList(); toast('Compra registrada! 🛒');
            }
        });
    }

    const html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div class="stat-card green" style="padding:14px 20px;margin:0">
        <div class="stat-label">Receita Total</div>
        <div class="stat-value" id="total-revenue">R$ 0,00</div>
      </div>
      <button class="btn btn-primary" id="btn-add-pu">+ Registrar Compra</button>
    </div>
    <div class="card"><div style="overflow-x:auto" id="purchases-list"></div></div>`;
    renderLayout(router, 'Histórico de Compras', html, 'purchases');
    renderList();
    document.getElementById('btn-add-pu').addEventListener('click', showAddModal);
}
