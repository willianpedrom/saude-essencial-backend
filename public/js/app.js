/* ============================================================
   APP.JS – Orquestrador principal do Sistema Saúde Essencial
   ============================================================ */

import { auth } from './store.js';
import { Router, setupGlobalShortcuts } from './utils.js';
// Pages are now dynamically imported in the router// Boot
auth.init();
setupGlobalShortcuts();


// Global listener for opening anamnese modal from anywhere (e.g. Pipeline, Dashboard)
document.addEventListener('open-anamnese', async (e) => {
    const client = e.detail?.client;
    if (client) {
        const { showAnamneseModal } = await import('./pages/Clients.js');
        showAnamneseModal(client, router);
    }
});

// Remove loader
window.addEventListener('load', () => {
    const loader = document.getElementById('page-loader');
    if (loader) { loader.style.opacity = '0'; setTimeout(() => loader.remove(), 500); }
});

// Guard: requires login
function guard(fn) {
    return (params) => {
        if (!auth.isLoggedIn) { router.navigate('/'); return; }
        fn(params);
    };
}

// Listen for subscription-required events sent by api()
window.addEventListener('subscription:required', () => {
    router.navigate('/assinatura');
});

// Routes
const router = new Router({
    '/': async (p) => {
        if (auth.isLoggedIn) return router.navigate('/dashboard');
        const { renderLogin } = await import('./pages/Login.js?v=34');
        renderLogin(router);
    },
    '/dashboard': guard(async (params) => {
        const { renderDashboard } = await import('./pages/Dashboard.js?v=5');
        renderDashboard(router, params);
    }),
    '/clients': guard(async (params) => {
        const { renderClients } = await import('./pages/Clients.js?v=3');
        renderClients(router, params);
    }),
    '/links': guard(async (params) => {
        const { renderLinks } = await import('./pages/Links.js');
        renderLinks(router, params);
    }),
    '/anamnesis': guard(async (params) => {
        const { renderAnamnesisList } = await import('./pages/Anamneses.js');
        renderAnamnesisList(router, params);
    }),
    '/schedule': guard(async () => {
        const { renderSchedule } = await import('./pages/Schedule.js?v=4');
        renderSchedule(router);
    }),
    '/followup': guard(async () => {
        router.navigate('/schedule');
    }),
    '/testimonials': guard(async () => {
        const { renderTestimonials } = await import('./pages/Extras.js');
        renderTestimonials(router);
    }),
    '/purchases': guard(async () => {
        const { renderPurchases } = await import('./pages/Extras.js');
        renderPurchases(router);
    }),
    '/assinatura': guard(async () => {
        const { renderAssinatura } = await import('./pages/Assinatura.js');
        renderAssinatura(router);
    }),
    '/profile': guard(async () => {
        const { renderProfile } = await import('./pages/ProfileV31.js');
        renderProfile(router);
    }),
    '/admin': guard(async () => {
        const { renderAdmin } = await import('./pages/Admin.js?v=2');
        renderAdmin(router);
    }),
    '/pipeline': guard(async () => {
        const { renderPipeline } = await import('./pages/Pipeline.js');
        renderPipeline(router);
    }),
    '/insights': guard(async () => {
        const { renderInsights } = await import('./pages/Insights.js');
        renderInsights(router);
    }),
    '/integrations': guard(async () => {
        const { renderIntegrations } = await import('./pages/Integracoes.js');
        renderIntegrations(router);
    }),
    '/prospecting': guard(async () => {
        const { renderProspecting } = await import('./pages/Prospecting.js');
        renderProspecting(router);
    }),
    '/estoque': guard(async () => {
        const { renderInventory } = await import('./pages/Inventory.js');
        renderInventory(router);
    }),

    // Public routes (no auth required)
    '/anamnese/:token': async ({ token }) => {
        const { renderPublicAnamnesis } = await import('./pages/PublicAnamnesis.js');
        renderPublicAnamnesis(router, token);
    },
    '/protocolo': async (params) => {
        const { renderReport } = await import('./pages/Report.js');
        renderReport(router, params?.data);
    },
    '/laudo/:hash': async ({ hash }) => {
        const { renderReport } = await import('./pages/Report.js');
        renderReport(router, null, hash);
    },
    '/business-report': async (params) => {
        const { renderBusinessReport } = await import('./pages/BusinessReport.js');
        renderBusinessReport(router, params?.data);
    },
    '/recomendacao-uau': async (params) => {
        const { renderRecomendacaoUau } = await import('./pages/RecomendacaoUau.js');
        renderRecomendacaoUau(router, params?.data);
    },
    '/depoimento/:slug': async ({ slug }) => {
        const { renderPublicTestimonial } = await import('./pages/PublicTestimonial.js');
        renderPublicTestimonial(router, slug);
    },
    '/p/:slug': async ({ slug }) => {
        const { renderPublicProfile } = await import('./pages/PublicProfile.js');
        renderPublicProfile(router, slug);
    },
    '/vendas': async () => {
        const { renderLandingPage } = await import('./pages/LandingPage.js');
        renderLandingPage(router);
    },
    'vendas': async () => {
        const { renderLandingPage } = await import('./pages/LandingPage.js');
        renderLandingPage(router);
    },
    '/reset-password': async () => {
        const { renderResetPassword } = await import('./pages/Login.js?v=34');
        renderResetPassword(router);
    },

    '*': async () => {
        if (auth.isLoggedIn) return router.navigate('/dashboard');
        const { renderLogin } = await import('./pages/Login.js?v=34');
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
