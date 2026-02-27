const pool = require('../db/pool');

/**
 * Middleware: verifies active subscription and injects plan limits into req.consultora.
 * Sets req.consultora.limites = { clientes_max, anamneses_mes_max, tem_integracoes, tem_pipeline, tem_multiusuario }
 */
module.exports = async function checkSubscription(req, res, next) {
    try {
        // ── Admins always have full access ──────────────────────────────
        if (req.consultora.role === 'admin') {
            req.consultora.plano = 'admin';
            req.consultora.limites = {
                clientes_max: null,
                anamneses_mes_max: null,
                tem_integracoes: true,
                tem_pipeline: true,
                tem_multiusuario: true,
            };
            return next();
        }

        // Double-check role from DB (JWT might be stale)
        const { rows: roleRows } = await pool.query(
            'SELECT role FROM consultoras WHERE id = $1', [req.consultora.id]
        );
        if (roleRows[0]?.role === 'admin') {
            req.consultora.plano = 'admin';
            req.consultora.limites = {
                clientes_max: null, anamneses_mes_max: null,
                tem_integracoes: true, tem_pipeline: true, tem_multiusuario: true,
            };
            return next();
        }

        // Fetch subscription joined with plan limits
        const { rows } = await pool.query(
            `SELECT a.status, a.periodo_fim, a.trial_fim, a.plano,
                    p.clientes_max, p.anamneses_mes_max,
                    p.tem_integracoes, p.tem_pipeline, p.tem_multiusuario
             FROM assinaturas a
             LEFT JOIN planos p ON p.slug = a.plano AND p.ativo = TRUE
             WHERE a.consultora_id = $1
             ORDER BY a.criado_em DESC LIMIT 1`,
            [req.consultora.id]
        );

        if (rows.length === 0) {
            return res.status(403).json({ error: 'Nenhuma assinatura encontrada.', code: 'SUBSCRIPTION_REQUIRED' });
        }

        const sub = rows[0];
        const now = new Date();

        // Default limits (fallback when plan not found in DB)
        const limites = {
            clientes_max: sub.clientes_max ?? null,
            anamneses_mes_max: sub.anamneses_mes_max ?? null,
            tem_integracoes: sub.tem_integracoes ?? false,
            tem_pipeline: sub.tem_pipeline ?? true,
            tem_multiusuario: sub.tem_multiusuario ?? false,
        };

        // Trial: allow if within trial window
        if (sub.status === 'trial' && (!sub.trial_fim || new Date(sub.trial_fim) > now)) {
            req.consultora.plano = 'trial';
            req.consultora.limites = limites;
            return next();
        }

        // Active subscription within period
        if (sub.status === 'active' && (!sub.periodo_fim || new Date(sub.periodo_fim) > now)) {
            req.consultora.plano = sub.plano;
            req.consultora.limites = limites;
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
