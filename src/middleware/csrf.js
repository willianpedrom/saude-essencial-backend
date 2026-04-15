/**
 * CSRF Double-Submit Protection Middleware
 *
 * Strategy: server generates a random CSRF token on login/register.
 * The frontend stores it and sends it back via `X-CSRF-Token` header.
 * This middleware validates the header on all mutating requests.
 *
 * Since auth uses JWT in sessionStorage (not cookies), the main attack
 * vector is a malicious page tricking the browser into sending a
 * credentialed request. The custom header acts as proof that the
 * request came from our own frontend (browsers block custom headers
 * on cross-origin requests unless CORS allows them).
 */
const crypto = require('crypto');

/**
 * Generate a cryptographically random CSRF token.
 * Call this on login/register and return to the client.
 */
function generateCsrfToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Express middleware that validates X-CSRF-Token on mutating methods.
 * Must be applied AFTER the auth middleware (needs req.consultora).
 *
 * Skips:
 * - Safe methods (GET, HEAD, OPTIONS)
 * - Unauthenticated requests (public routes like webhook, public anamnesis submit)
 * - Routes explicitly excluded (webhooks)
 */
function csrfCheck(req, res, next) {
    // Safe methods — no side effects
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

    // Skip if no authenticated user (public endpoints)
    if (!req.consultora) return next();

    const csrfToken = req.headers['x-csrf-token'];
    if (!csrfToken) {
        console.warn(`[CSRF] Bloqueado: Token ausente (${req.method} ${req.originalUrl})`);
        return res.status(403).json({
            error: 'Token CSRF ausente. Faça login novamente.',
            code: 'CSRF_MISSING',
        });
    }

    // Validate: token must be a 64-char hex string (32 bytes)
    if (!/^[a-f0-9]{64}$/i.test(csrfToken)) {
        console.warn(`[CSRF] Bloqueado: Token inválido (${req.method} ${req.originalUrl})`);
        return res.status(403).json({
            error: 'Token CSRF inválido.',
            code: 'CSRF_INVALID',
        });
    }

    // The double-submit pattern relies on the fact that:
    // 1. An attacker cannot read the token from our response (same-origin)
    // 2. Browsers block custom headers in cross-origin requests without CORS
    // 3. Our CORS policy only allows our own origins
    // So if the header is present and well-formed, the request is legitimate.
    next();
}

module.exports = { generateCsrfToken, csrfCheck };
