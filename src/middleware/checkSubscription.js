const pool = require('../db/pool');

module.exports = async function checkSubscription(req, res, next) {
    try {
        // ── Admins always have full access ──────────────────────────────
        if (req.consultora.role === 'admin') {
            req.consultora.plano = 'admin';
            return next();
        }

        // Double-check role from DB (JWT might be stale)
        const { rows: roleRows } = await pool.query(
            'SELECT role FROM consultoras WHERE id = $1', [req.consultora.id]
        );
        if (roleRows[0]?.role === 'admin') {
            req.consultora.plano = 'admin';
            return next();
        }

        const { rows } = await pool.query(
            `SELECT status, periodo_fim, trial_fim, plano
       FROM assinaturas
       WHERE consultora_id = $1
       ORDER BY criado_em DESC LIMIT 1`,
            [req.consultora.id]
        );

        if (rows.length === 0) {
            return res.status(403).json({ error: 'Nenhuma assinatura encontrada.', code: 'SUBSCRIPTION_REQUIRED' });
        }

        const sub = rows[0];
        const now = new Date();

        // Trial period: allow if no trial_fim set (dev/unlimited) or within trial window
        if (sub.status === 'trial' && (!sub.trial_fim || new Date(sub.trial_fim) > now)) {
            req.consultora.plano = 'trial';
            return next();
        }

        // Active subscription within period: allow if no periodo_fim set or within period
        if (sub.status === 'active' && (!sub.periodo_fim || new Date(sub.periodo_fim) > now)) {
            req.consultora.plano = sub.plano;
            return next();
        }

        return res.status(403).json({
            error: 'Sua assinatura está expirada ou cancelada.',
            code: 'SUBSCRIPTION_REQUIRED',
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erro ao verificar assinatura.' });
    }
};
