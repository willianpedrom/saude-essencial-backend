import { api } from '../store.js';
import { renderLayout } from './Dashboard.js';
import { formatCurrency } from '../utils.js';

export async function renderInsights(router) {
    const pageContent = `
        <div class="page-header" style="margin-bottom:24px">
            <h1 class="page-title">⚡ Raio-X de Vendas</h1>
            <p class="page-subtitle" style="font-size:0.95rem;color:var(--text-muted)">O Gota App leu os sintomas de todos os seus clientes e filtrou quem precisa comprar o quê.</p>
        </div>
        <div id="insights-container" style="display:flex;flex-direction:column;gap:16px;">
            <div style="text-align:center;padding:40px;color:var(--text-muted)">
               <span style="font-size:2rem;display:inline-block;animation:pulse 1.5s infinite">🧠</span>
               <div style="margin-top:12px">Cruzando sintomas com o dicionário de Óleos Essenciais...</div>
            </div>
        </div>
    `;

    renderLayout(router, 'Raio-X de Vendas', pageContent, 'insights');
    
    // Load Insights
    try {
        const data = await api('GET', '/api/anamneses/insights');
        const container = document.getElementById('insights-container');

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:60px 20px;background:white;border-radius:12px;border:1px dashed var(--border)">
                    <span style="font-size:3rem;margin-bottom:12px;display:block">🔍</span>
                    <h3 style="color:var(--text-dark)">Base insuficiente</h3>
                    <p style="color:var(--text-muted);font-size:0.9rem">Você ainda não tem clientes com queixas registradas nas anamneses. Continue enviando seus links!</p>
                </div>`;
            return;
        }

        const totalValue = data.reduce((acc, b) => acc + b.valor_estimado, 0);

        let html = `
            <div style="background:linear-gradient(135deg, #0f172a, #1e293b);padding:24px;border-radius:16px;color:white;margin-bottom:8px;box-shadow:0 10px 25px rgba(0,0,0,0.1)">
                <div style="font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;margin-bottom:4px">OPORTUNIDADES OCULTAS</div>
                <div style="font-size:2.5rem;font-weight:700;color:#38bdf8;text-shadow:0 2px 10px rgba(56,189,248,0.2)">${formatCurrency(totalValue)}</div>
                <div style="font-size:0.9rem;margin-top:8px;color:#cbd5e1">Valor de faturamento estimado se todos os leads afetados comprarem a solução recomendada pelo sistema.</div>
            </div>
            
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;margin-top:16px">
        `;

        data.forEach((bucket, idx) => {
            html += `
                <div class="insight-card" style="background:white;border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.03);display:flex;flex-direction:column">
                    <div style="background:rgba(${bucket.rgb}, 0.1);padding:20px;border-bottom:1px solid rgba(${bucket.rgb}, 0.15)">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
                            <h3 style="margin:0;color:rgb(${bucket.rgb});font-size:1.2rem;font-weight:700">${bucket.nome}</h3>
                            <div style="background:white;color:rgb(${bucket.rgb});font-weight:700;font-size:0.85rem;padding:4px 10px;border-radius:20px;box-shadow:0 2px 4px rgba(0,0,0,0.05)">${bucket.clientes.length} Leads</div>
                        </div>
                        <div style="font-size:0.85rem;color:var(--text-dark);font-weight:500">Potencial: <span style="font-weight:700">${formatCurrency(bucket.valor_estimado)}</span></div>
                    </div>
                    <div style="padding:0;background:#fafafa">
                        <button class="toggle-insight-btn" data-target="bucket-${idx}" style="width:100%;background:transparent;border:none;padding:14px 20px;text-align:left;font-size:0.85rem;font-weight:700;color:var(--text-dark);cursor:pointer;display:flex;justify-content:space-between;align-items:center">
                            Acessar Clientes Relacionados <span style="color:var(--green-600)">Mostrar ▼</span>
                        </button>
                        <div id="bucket-${idx}" style="display:none;padding:0 20px 20px;max-height:350px;overflow-y:auto;background:white">
                            ${bucket.clientes.map(c => {
                                const phoneClean = (c.telefone||'').replace(/\D/g, '');
                                const prefix = phoneClean.startsWith('55') ? '' : '55';
                                const parsedPhone = phoneClean ? `${prefix}${phoneClean}` : null;
                                const firstName = c.nome.split(' ')[0];
                                
                                const msg = `Oi ${firstName}, vi na sua ficha de bem-estar que você marcou *${c.match_sintoma}*. O óleo essencial de ${bucket.nome.split('/')[0].trim()} acabou de chegar e é o mais recomendado pra isso! Posso te mostrar como ele age na raiz disso de forma natural?`;
                                const waLink = parsedPhone ? `https://wa.me/${parsedPhone}?text=${encodeURIComponent(msg)}` : '#';

                                return `
                                <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid var(--border)">
                                    <div style="max-width:65%">
                                        <div style="font-weight:600;font-size:0.9rem;color:var(--text-dark);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.nome}</div>
                                        <div style="font-size:0.75rem;color:#f59e0b;font-weight:600;margin-top:2px;display:flex;align-items:center;gap:4px">🎯 Relatou: ${c.match_sintoma}</div>
                                    </div>
                                    ${parsedPhone 
                                        ? `<a href="${waLink}" target="_blank" class="btn btn-sm" style="background:#20c997;color:white;border:none;padding:8px 12px;font-size:0.75rem;border-radius:8px;font-weight:700">WhatsApp</a>` 
                                        : `<span style="font-size:0.7rem;color:var(--text-muted)">Sem contato</span>`}
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;

        // Add Toggle logic
        document.querySelectorAll('.toggle-insight-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = document.getElementById(e.currentTarget.dataset.target);
                const span = e.currentTarget.querySelector('span');
                if (target.style.display === 'none') {
                    // close all others optionally? no, let them open multiple
                    target.style.display = 'block';
                    span.innerText = 'Ocultar ▲';
                } else {
                    target.style.display = 'none';
                    span.innerText = 'Mostrar ▼';
                }
            });
        });

    } catch (err) {
        console.error(err);
        document.getElementById('insights-container').innerHTML = `
            <div style="text-align:center;color:#ef4444;padding:40px">
                Erro ao puxar o raio-X Inteligente.
            </div>`;
    }
}
