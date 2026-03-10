const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

module.exports = async function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    // ── Token version check — invalidates tokens after password change or logout ──
    try {
        const { rows } = await pool.query(
            'SELECT token_version FROM consultoras WHERE id = $1',
            [decoded.id]
        );
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Conta não encontrada.' });
        }
        const currentVersion = rows[0].token_version ?? 1;
        const tokenVersion = decoded.tv ?? 1;   // 'tv' = token version claim
        if (tokenVersion < currentVersion) {
            return res.status(401).json({
                error: 'Sessão encerrada. Faça login novamente.',
                code: 'TOKEN_REVOKED',
            });
        }
    } catch (dbErr) {
        // If DB is unavailable, deny access (fail secure)
        console.error('[auth] DB check failed:', dbErr.message);
        return res.status(503).json({ error: 'Serviço temporariamente indisponível.' });
    }

    req.consultora = decoded;
    next();
};

