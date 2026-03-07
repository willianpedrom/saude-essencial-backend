/* ============================================================
   APP.JS – Orquestrador principal do Sistema Saúde Essencial
   ============================================================ */

import { auth } from './store.js?v=22';
import { Router } from './utils.js?v=22';
import { renderLogin, renderResetPassword } from './pages/Login.js?v=22';
import { renderDashboard } from './pages/Dashboard.js?v=22';
import { renderClients } from './pages/Clients.js?v=22';
import { renderLinks } from './pages/Links.js?v=22';
import { renderSchedule, renderFollowup } from './pages/Schedule.js?v=22';
import { renderTestimonials, renderPurchases } from './pages/Extras.js?v=22';
import { renderPublicAnamnesis } from './pages/PublicAnamnesis.js?v=22';
import { renderPublicTestimonial } from './pages/PublicTestimonial.js?v=22';
import { renderPublicProfile } from './pages/PublicProfile.js?v=22';
import { renderReport } from './pages/Report.js?v=22';
import { renderBusinessReport } from './pages/BusinessReport.js?v=22';
import { renderAnamnesisList } from './pages/Anamneses.js?v=22';
import { renderAssinatura } from './pages/Assinatura.js?v=22';
import { renderProfile } from './pages/Profile.js?v=22';
import { renderAdmin } from './pages/Admin.js?v=22';
import { renderPipeline } from './pages/Pipeline.js?v=22';
import { renderIntegrations } from './pages/Integracoes.js?v=22';
import { renderLandingPage } from './pages/LandingPage.js?v=22';

// Boot
auth.init();


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
    '/': (p) => auth.isLoggedIn ? router.navigate('/dashboard') : renderLogin(router),
    '/dashboard': guard(() => renderDashboard(router)),
    '/clients': guard(() => renderClients(router)),
    '/links': guard(() => renderLinks(router)),
    '/anamnesis': guard(() => renderAnamnesisList(router)),
    '/schedule': guard(() => renderSchedule(router)),
    '/followup': guard(() => renderFollowup(router)),
    '/testimonials': guard(() => renderTestimonials(router)),
    '/purchases': guard(() => renderPurchases(router)),
    '/assinatura': guard(() => renderAssinatura(router)),
    '/profile': guard(() => renderProfile(router)),
    '/admin': guard(() => renderAdmin(router)),
    '/pipeline': guard(() => renderPipeline(router)),
    '/integrations': guard(() => renderIntegrations(router)),

    // Public routes (no auth required)
    '/anamnese/:token': ({ token }) => renderPublicAnamnesis(router, token),
    '/protocolo': (params) => renderReport(router, params?.data),
    '/business-report': (params) => renderBusinessReport(router, params?.data),
    '/depoimento/:slug': ({ slug }) => renderPublicTestimonial(router, slug),
    '/p/:slug': ({ slug }) => renderPublicProfile(router, slug),
    '/vendas': () => renderLandingPage(router),
    'vendas': () => renderLandingPage(router),
    '/reset-password': () => renderResetPassword(router),

    '*': () => auth.isLoggedIn ? router.navigate('/dashboard') : renderLogin(router),
});

(async () => {
    if (auth.isLoggedIn && typeof auth.current.genero === 'undefined') {
        try { await auth.refresh(); } catch (e) { console.warn('Auth refresh bypassed', e); }
    }

    router.start();
})();
