import { store } from '../store.js';
import { toast } from '../utils.js';

const PLANOS = [
    {
        id: 'starter',
        nome: 'Starter',
        preco: 'R$ 47',
        periodo: '/mês',
        icon: '🌱',
        cor: '#4CAF50',
        recursos: [
            'Até 30 clientes',
            'Anamnese completa',
            'Dashboard com métricas',
            'Links de cadastro',
            'Suporte por e-mail',
        ],
    },
    {
        id: 'pro',
        nome: 'Pro',
        preco: 'R$ 97',
        periodo: '/mês',
        icon: '🌿',
        cor: '#2196F3',
        destaque: true,
        recursos: [
            'Até 100 clientes',
            'Tudo do Starter',
            'Agendamentos e follow-up',
            'Relatórios detalhados',
            'Suporte prioritário',
        ],
    },
    {
        id: 'premium',
        nome: 'Premium',
        preco: 'R$ 197',
        periodo: '/mês',
        icon: '✨',
        cor: '#9C27B0',
        recursos: [
            'Clientes ilimitados',
            'Tudo do Pro',
            'Múltiplos usuários',
            'API de integração',
            'Suporte VIP 24h',
        ],
    },
];

export function renderAssinatura(router) {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div style="min-height:100vh;background:var(--bg-dark);padding:2rem 1rem">
      <div style="max-width:900px;margin:0 auto">
        <div style="text-align:center;margin-bottom:3rem">
          <h1 style="font-size:2.2rem;font-weight:700;color:var(--text-primary);margin-bottom:.5rem">
            Escolha seu Plano
          </h1>
          <p style="color:var(--text-muted);font-size:1.05rem">
            14 dias grátis em qualquer plano. Cancele quando quiser.
          </p>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem;margin-bottom:2rem">
          ${PLANOS.map(p => `
            <div style="
              background:var(--bg-card);
              border:2px solid ${p.destaque ? p.cor : 'var(--border)'};
              border-radius:16px;
              padding:2rem;
              position:relative;
              ${p.destaque ? 'transform:scale(1.03);box-shadow:0 8px 32px rgba(33,150,243,.2)' : ''}
            ">
              ${p.destaque ? `<div style="
                position:absolute;top:-14px;left:50%;transform:translateX(-50%);
                background:${p.cor};color:#fff;font-size:.8rem;font-weight:700;
                padding:.35rem 1.2rem;border-radius:20px;letter-spacing:.05em
              ">MAIS POPULAR</div>` : ''}
              <div style="font-size:2.5rem;margin-bottom:.5rem">${p.icon}</div>
              <h2 style="font-size:1.4rem;color:var(--text-primary);margin-bottom:.25rem">${p.nome}</h2>
              <div style="font-size:2.2rem;font-weight:700;color:${p.cor};margin-bottom:1.5rem">
                ${p.preco}<span style="font-size:1rem;color:var(--text-muted)">${p.periodo}</span>
              </div>
              <ul style="list-style:none;padding:0;margin-bottom:2rem">
                ${p.recursos.map(r => `
                  <li style="color:var(--text-secondary);padding:.4rem 0;display:flex;gap:.6rem;align-items:center">
                    <span style="color:${p.cor};font-weight:700">✓</span> ${r}
                  </li>
                `).join('')}
              </ul>
              <button
                class="btn-assinar"
                data-plano="${p.id}"
                style="
                  width:100%;padding:.9rem;border:none;border-radius:10px;
                  background:${p.cor};color:#fff;font-weight:700;font-size:1rem;
                  cursor:pointer;transition:opacity .2s
                "
              >
                Assinar ${p.nome}
              </button>
            </div>
          `).join('')}
        </div>

        <p style="text-align:center;color:var(--text-muted);font-size:.9rem">
          🔒 Pagamento seguro via Stripe · Cancele a qualquer momento
        </p>
        <p style="text-align:center;margin-top:1rem">
          <a href="#" id="voltar-link" style="color:var(--accent);text-decoration:none">← Voltar ao dashboard</a>
        </p>
      </div>
    </div>
  `;

    document.getElementById('voltar-link').addEventListener('click', e => {
        e.preventDefault();
        router.navigate('/dashboard');
    });

    app.querySelectorAll('.btn-assinar').forEach(btn => {
        btn.addEventListener('click', async () => {
            const plano = btn.dataset.plano;
            btn.disabled = true;
            btn.textContent = 'Redirecionando...';
            try {
                const { url } = await store.checkout(plano);
                window.location.href = url;
            } catch (err) {
                toast('Erro ao iniciar pagamento: ' + err.message, 'error');
                btn.disabled = false;
                btn.textContent = `Assinar ${plano.charAt(0).toUpperCase() + plano.slice(1)}`;
            }
        });
    });
}
