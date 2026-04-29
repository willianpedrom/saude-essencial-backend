const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const NodeCache = require('node-cache');

// Cache curto (30s) para verificação de versão do token
// Seguro: invalida automaticamente após 30s; logout/change-password
// incrementa token_version no banco, que vai bater na próxima validação
const tokenCache = new NodeCache({ stdTTL: 30 });

module.exports = async function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'gota-app', audience: 'gota-app-api' });
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    // ── Token version check — com cache para evitar query a cada request ──
    try {
        const cacheKey = `tv_${decoded.id}`;
        let currentVersion = tokenCache.get(cacheKey);

        if (currentVersion === undefined) {
            const { rows } = await pool.query(
                'SELECT token_version, role FROM consultoras WHERE id = $1',
                [decoded.id]
            );
            if (rows.length === 0) {
                return res.status(401).json({ error: 'Conta não encontrada.' });
            }
            currentVersion = rows[0].token_version ?? 1;
            // Injetar role no decoded para que checkSubscription não precise ir ao banco
            decoded.role = decoded.role || rows[0].role;
            tokenCache.set(cacheKey, currentVersion);
        }

        // Só verificar versão se o token tiver o campo 'tv' (tokens legados sem 'tv' são aceitos)
        // Tokens com 'tv' são rejeitados se versão estiver desatualizada (logout/troca de senha)
        if (decoded.tv !== undefined) {
            const tokenVersion = decoded.tv;
            if (tokenVersion < currentVersion) {
                return res.status(401).json({
                    error: 'Sessão encerrada. Faça login novamente.',
                    code: 'TOKEN_REVOKED',
                });
            }
        }
    } catch (dbErr) {
        // If DB is unavailable, deny access (fail secure)
        console.error('[auth] DB check failed:', dbErr.message);
        return res.status(503).json({ error: 'Serviço temporariamente indisponível.' });
    }

    req.consultora = decoded;
    next();
};

