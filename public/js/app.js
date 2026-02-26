/* ============================================================
   APP.JS – Orquestrador principal do Sistema Saúde Essencial
   ============================================================ */

import { auth } from './store.js';
import { Router } from './utils.js';
import { renderLogin } from './pages/Login.js';
import { renderDashboard } from './pages/Dashboard.js';
import { renderClients } from './pages/Clients.js';
import { renderLinks } from './pages/Links.js';
import { renderSchedule, renderFollowup } from './pages/Schedule.js';
import { renderTestimonials, renderPurchases } from './pages/Extras.js';
import { renderPublicAnamnesis } from './pages/PublicAnamnesis.js';
import { renderPublicTestimonial } from './pages/PublicTestimonial.js';
import { renderPublicProfile } from './pages/PublicProfile.js';
import { renderReport } from './pages/Report.js';
import { renderAnamnesisList } from './pages/Anamneses.js';
import { renderAssinatura } from './pages/Assinatura.js';
import { renderProfile } from './pages/Profile.js';
import { renderAdmin } from './pages/Admin.js';
import { renderPipeline } from './pages/Pipeline.js';
import { renderIntegrations } from './pages/Integracoes.js';

// Boot
auth.init();
if (auth.isLoggedIn && typeof auth.current.genero === 'undefined') {
    await auth.refresh();
}

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
    '/protocolo': ({ data }) => renderReport(router, data),
    '/depoimento/:slug': ({ slug }) => renderPublicTestimonial(router, slug),
    '/p/:slug': ({ slug }) => renderPublicProfile(router, slug),

    '*': () => auth.isLoggedIn ? router.navigate('/dashboard') : renderLogin(router),
});

router.start();
