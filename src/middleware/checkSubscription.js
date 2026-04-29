const pool = require('../db/pool');
const NodeCache = require('node-cache');

// Cache de assinatura por usuário: 60 segundos
// Reduz drasticamente as queries ao banco em cada requisição autenticada
const subCache = new NodeCache({ stdTTL: 60 });

/**
 * Middleware: verifies active subscription and injects plan limits into req.consultora.
 * Sets req.consultora.limites = { clientes_max, anamneses_mes_max, tem_integracoes, tem_pipeline, tem_multiusuario }
 */
module.exports = async function checkSubscription(req, res, next) {
    try {
        // ── Admins always have full access (role já está no JWT) ─────────
        if (req.consultora.role === 'admin') {
            req.consultora.plano = 'admin';
            req.consultora.limites = {
                clientes_max: null,
                anamneses_mes_max: null,
                tem_integracoes: true,
                tem_pipeline: true,
                tem_multiusuario: true,
                tem_pagina_pessoal: true, tem_raiox: true, tem_minhas_vendas: true,
                tem_radar: true, tem_agenda: true, tem_links: true, tem_anamneses: true, tem_clientes: true
            };
            return next();
        }

        // ── Verificar cache antes de ir ao banco ─────────────────────────
        const cacheKey = `sub_${req.consultora.id}`;
        let rows = subCache.get(cacheKey);

        if (!rows) {
            // 1 única query: assinatura + limites do plano
            const result = await pool.query(
                `SELECT a.status, a.periodo_fim, a.trial_fim, a.plano,
                        p.clientes_max, p.anamneses_mes_max,
                        p.tem_integracoes, p.tem_pipeline, p.tem_multiusuario,
                        p.tem_pagina_pessoal, p.tem_raiox, p.tem_minhas_vendas,
                        p.tem_radar, p.tem_agenda, p.tem_links, p.tem_anamneses, p.tem_clientes
                 FROM assinaturas a
                 LEFT JOIN planos p ON p.slug = a.plano AND p.ativo = TRUE
                 WHERE a.consultora_id = $1
                 ORDER BY a.criado_em DESC LIMIT 1`,
                [req.consultora.id]
            );
            rows = result.rows;
            if (rows.length > 0) subCache.set(cacheKey, rows);
        }

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
            tem_pagina_pessoal: sub.tem_pagina_pessoal ?? true,
            tem_raiox: sub.tem_raiox ?? true,
            tem_minhas_vendas: sub.tem_minhas_vendas ?? true,
            tem_radar: sub.tem_radar ?? true,
            tem_agenda: sub.tem_agenda ?? true,
            tem_links: sub.tem_links ?? true,
            tem_anamneses: sub.tem_anamneses ?? true,
            tem_clientes: sub.tem_clientes ?? true
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
