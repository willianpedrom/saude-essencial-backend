/* ============================================================
   APP.JS – Orquestrador principal do Sistema Saúde Essencial
   ============================================================ */

import { auth } from './store.js?v=1010';
import { Router, setupGlobalShortcuts } from './utils.js?v=1010';
// Pages are now dynamically imported in the router// Boot
auth.init();
setupGlobalShortcuts();


// Global listener for opening anamnese modal from anywhere (e.g. Pipeline, Dashboard)
document.addEventListener('open-anamnese', async (e) => {
    const client = e.detail?.client;
    const anamneseOverride = e.detail?.anamneseOverride || null;
    if (client) {
        const { showAnamneseModal } = await import('./pages/Clients.js?v=1010');
        showAnamneseModal(client, router, anamneseOverride);
    }
});

// Loader Removal Utility
window.hideAppLoader = () => {
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }
};
window.addEventListener('load', window.hideAppLoader);

// Guard: requires login
function guard(fn) {
    return (params) => {
        if (!auth.isLoggedIn) { router.navigate('/'); return; }
        fn(params);
    };
}

// Listen for subscription-required events sent by api()
window.addEventListener('subscription:required', () => {
    if (document.getElementById('expired-modal')) return;
    
    const user = auth.current || {};
    const nome = user.nome || user.name || 'Assinante';
    const email = user.email || 'Não informado';
    const waMsg = encodeURIComponent(`Olá Suporte Gota App! Meu plano expirou e desejo reativar ou preciso de ajuda.\n\n👤 Nome: ${nome}\n📧 E-mail: ${email}`);
    const waLink = `https://wa.me/5521988964012?text=${waMsg}`;
    
    const m = document.createElement('div');
    m.id = 'expired-modal';
    m.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.85);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem;';
    m.innerHTML = `
      <div style="background:var(--bg-card,#fff);border-radius:16px;padding:2.5rem;max-width:450px;width:100%;text-align:center;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1)">
        <div style="font-size:3.5rem;margin-bottom:1rem">⚠️</div>
        <h1 style="font-size:1.6rem;font-weight:700;color:var(--text-primary,#1e293b);margin-bottom:1rem">
          Plano Expirado
        </h1>
        <p style="color:var(--text-secondary,#64748b);font-size:1.05rem;line-height:1.6;margin-bottom:2rem">
          Seu plano expirou ou está inativo. Para continuar usando o Gota App e ter acesso a todas as ferramentas, por favor reative sua assinatura.
        </p>
        <div style="display:flex;flex-direction:column;gap:12px">
            <a href="https://www.gotaapp.com.br/reativar" class="btn btn-primary" style="width:100%;justify-content:center;font-size:1.1rem;padding:12px;text-decoration:none;background:#16a34a;color:#fff;border-radius:8px;font-weight:600;display:flex;align-items:center;gap:8px;border:none">
                🔄 Reativar meu Plano
            </a>
            <a href="${waLink}" target="_blank" class="btn btn-secondary" style="width:100%;justify-content:center;text-decoration:none;background:#f1f5f9;color:#334155;border-radius:8px;font-weight:600;padding:12px;display:flex;align-items:center;gap:8px;border:1px solid #e2e8f0">
                💬 Falar com o Suporte
            </a>
        </div>
      </div>
    `;
    document.body.appendChild(m);
});

// Routes
const router = new Router({
    '/': async (p) => {
        if (auth.isLoggedIn) return router.navigate('/dashboard');
        const { renderLogin } = await import('./pages/Login.js?v=1010');
        renderLogin(router);
    },
    '/dashboard': guard(async (params) => {
        const { renderDashboard } = await import('./pages/Dashboard.js?v=1012');
        renderDashboard(router, params);
    }),
    '/clients': guard(async (params) => {
        const { renderClients } = await import('./pages/Clients.js?v=1010');
        renderClients(router, params);
    }),
    '/links': guard(async (params) => {
        const { renderLinks } = await import('./pages/Links.js?v=1010');
        renderLinks(router, params);
    }),
    '/anamnesis': guard(async (params) => {
        const { renderAnamnesisList } = await import('./pages/Anamneses.js?v=1010');
        renderAnamnesisList(router, params);
    }),
    '/schedule': guard(async () => {
        const { renderSchedule } = await import('./pages/Schedule.js?v=1010');
        renderSchedule(router);
    }),
    '/followup': guard(async () => {
        router.navigate('/schedule');
    }),
    '/testimonials': guard(async () => {
        const { renderTestimonials } = await import('./pages/Extras.js?v=1010');
        renderTestimonials(router);
    }),
    '/purchases': guard(async () => {
        const { renderPurchases } = await import('./pages/Extras.js?v=1010');
        renderPurchases(router);
    }),
    '/assinatura': guard(async () => {
        const { renderAssinatura } = await import('./pages/Assinatura.js?v=1010');
        renderAssinatura(router);
    }),
    '/profile': guard(async () => {
        const { renderProfile } = await import('./pages/ProfileV31.js?v=1010');
        renderProfile(router);
    }),
    '/admin': guard(async () => {
        const { renderAdmin } = await import('./pages/Admin.js?v=1010');
        renderAdmin(router);
    }),
    '/pipeline': guard(async () => {
        const { renderPipeline } = await import('./pages/Pipeline.js?v=1010');
        renderPipeline(router);
    }),
    '/insights': guard(async () => {
        const { renderInsights } = await import('./pages/Insights.js?v=1010');
        renderInsights(router);
    }),
    '/integrations': guard(async () => {
        const { renderIntegrations } = await import('./pages/Integracoes.js?v=1010');
        renderIntegrations(router);
    }),
    '/prospecting': guard(async () => {
        const { renderProspecting } = await import('./pages/Prospecting.js?v=1010');
        renderProspecting(router);
    }),
    '/estoque': guard(async () => {
        const { renderInventory } = await import('./pages/Inventory.js?v=1010');
        renderInventory(router);
    }),
    '/equipe': guard(async () => {
        const { renderEquipe } = await import('./pages/Equipe.js?v=1018');
        renderEquipe(router);
    }),

    // Public routes (no auth required)
    '/anamnese/:token': async ({ token }) => {
        const { renderPublicAnamnesis } = await import('./pages/PublicAnamnesis.js?v=1010');
        renderPublicAnamnesis(router, token);
    },
    '/vendas/capture/:token': async ({ token }) => {
        const { renderSalesAnamnesis } = await import('./pages/SalesAnamnesis.js?v=1010');
        renderSalesAnamnesis(router, token);
    },
    '/protocolo': async (params) => {
        const { renderReport } = await import('./pages/Report.js?v=1010');
        renderReport(router, params?.data);
    },
    '/laudo/:hash': async ({ hash }) => {
        const { renderReport } = await import('./pages/Report.js?v=1010');
        renderReport(router, null, hash);
    },
    '/business-report': async (params) => {
        const { renderBusinessReport } = await import('./pages/BusinessReport.js?v=1010');
        renderBusinessReport(router, params?.data);
    },
    '/recomendacao-uau': async (params) => {
        const { renderRecomendacaoUau } = await import('./pages/RecomendacaoUau.js?v=1010');
        renderRecomendacaoUau(router, params?.data);
    },
    '/depoimento/:slug': async ({ slug }) => {
        const { renderPublicTestimonial } = await import('./pages/PublicTestimonial.js?v=1010');
        renderPublicTestimonial(router, slug);
    },
    '/p/:slug': async ({ slug }) => {
        const { renderPublicProfile } = await import('./pages/PublicProfile.js?v=1010');
        renderPublicProfile(router, slug);
    },
    '/vendas': async () => {
        const { renderLandingPage } = await import('./pages/LandingPage.js?v=1010');
        renderLandingPage(router);
    },
    'vendas': async () => {
        const { renderLandingPage } = await import('./pages/LandingPage.js?v=1010');
        renderLandingPage(router);
    },
    '/reset-password': async () => {
        const { renderResetPassword } = await import('./pages/Login.js?v=1010');
        renderResetPassword(router);
    },

    '*': async () => {
        if (auth.isLoggedIn) return router.navigate('/dashboard');
        const { renderLogin } = await import('./pages/Login.js?v=1010');
        renderLogin(router);
    },
});

(async () => {
    if (auth.isLoggedIn) {
        // Sempre atualiza a sessao para garantir que as flags do plano (tem_radar, tem_agenda, etc)
        // estejam sempre atualizadas, mesmo que o admin tenha mudado o plano sem novo login.
        try { await auth.refresh(); } catch (e) { console.warn('Auth refresh bypassed', e); }
    }

    router.start();
})();
