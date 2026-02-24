const pool = require('../db/pool');

module.exports = async function checkSubscription(req, res, next) {
    try {
        const { rows } = await pool.query(
            `SELECT status, periodo_fim, trial_fim, plano
       FROM assinaturas
       WHERE consultora_id = $1
       ORDER BY criado_em DESC LIMIT 1`,
            [req.consultora.id]
        );

        if (rows.length === 0) {
            return res.status(403).json({ error: 'Nenhuma assinatura encontrada.' });
        }

        const sub = rows[0];
        const now = new Date();

        // Trial period
        if (sub.status === 'trial' && new Date(sub.trial_fim) > now) {
            req.consultora.plano = 'trial';
            return next();
        }

        // Active subscription within period
        if (sub.status === 'active' && new Date(sub.periodo_fim) > now) {
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
