const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// ──────────────────────────────────────────────────────────────
//  POST /api/hotmart/webhook — receives Hotmart Webhook 2.0 events
// ──────────────────────────────────────────────────────────────
router.post('/webhook', express.json(), async (req, res) => {
    const receivedHottok = req.headers['x-hotmart-hottok'];

    // 1. Validate hottok from DB settings (or fallback to env)
    let expectedHottok = process.env.HOTMART_HOTTOK;
    try {
        const { rows } = await pool.query(
            `SELECT valor FROM configuracoes WHERE chave = 'hotmart_hottok' LIMIT 1`
        );
        if (rows.length > 0 && rows[0].valor) expectedHottok = rows[0].valor;
    } catch { /* table may not exist yet, use env */ }

    if (!expectedHottok || receivedHottok !== expectedHottok) {
        console.warn('[Hotmart] ❌ Hottok inválido ou ausente');
        return res.status(401).json({ error: 'Hottok inválido.' });
    }

    const event = req.body.event || req.body.data?.event;
    const data = req.body.data || req.body;

    console.log(`[Hotmart] 📩 Evento: ${event}`);

    try {
        const buyerEmail = data?.buyer?.email?.toLowerCase?.();
        const transactionId = data?.purchase?.transaction || data?.purchase?.order_date || null;
        const subscriptionId = data?.subscription?.subscriber?.code || data?.subscription?.plan?.id || null;
        const status = data?.purchase?.status;

        if (!buyerEmail) {
            console.warn('[Hotmart] ⚠️ Email do comprador não encontrado no payload');
            return res.status(200).json({ received: true, warning: 'no buyer email' });
        }

        // Find consultora by buyer email
        const { rows: consultoras } = await pool.query(
            `SELECT id FROM consultoras WHERE LOWER(email) = $1 LIMIT 1`,
            [buyerEmail]
        );

        if (consultoras.length === 0) {
            console.warn(`[Hotmart] ⚠️ Consultora não encontrada para email: ${buyerEmail}`);
            return res.status(200).json({ received: true, warning: 'user not found' });
        }

        const consultoraId = consultoras[0].id;

        switch (event) {
            case 'PURCHASE_COMPLETE':
            case 'PURCHASE_APPROVED': {
                // Determine plan — first try planos table by offer_id, then plano_map config
                let plano = 'pro';
                try {
                    const offerId = String(data?.purchase?.offer?.code || data?.product?.id || '');
                    if (offerId) {
                        const { rows: planoRows } = await pool.query(
                            `SELECT slug FROM planos WHERE hotmart_offer_id=$1 AND ativo=TRUE LIMIT 1`,
                            [offerId]
                        );
                        if (planoRows.length > 0) {
                            plano = planoRows[0].slug;
                        } else {
                            const { rows: cfg } = await pool.query(
                                `SELECT valor FROM configuracoes WHERE chave = 'hotmart_plano_map' LIMIT 1`
                            );
                            if (cfg.length > 0 && cfg[0].valor) {
                                const map = JSON.parse(cfg[0].valor);
                                if (map[offerId]) plano = map[offerId];
                            }
                        }
                    }
                } catch { /* use default */ }

                // Upsert subscription
                const { rows: existing } = await pool.query(
                    `SELECT id FROM assinaturas WHERE consultora_id = $1 LIMIT 1`,
                    [consultoraId]
                );

                if (existing.length > 0) {
                    await pool.query(
                        `UPDATE assinaturas
                         SET status = 'active', plano = $1,
                             hotmart_transaction_id = $2,
                             hotmart_subscription_id = $3,
                             gateway = 'hotmart',
                             periodo_inicio = NOW(),
                             periodo_fim = NOW() + INTERVAL '30 days',
                             atualizado_em = NOW()
                         WHERE consultora_id = $4`,
                        [plano, transactionId, subscriptionId, consultoraId]
                    );
                } else {
                    await pool.query(
                        `INSERT INTO assinaturas
                            (consultora_id, plano, status, gateway,
                             hotmart_transaction_id, hotmart_subscription_id,
                             periodo_inicio, periodo_fim)
                         VALUES ($1, $2, 'active', 'hotmart', $3, $4, NOW(), NOW() + INTERVAL '30 days')`,
                        [consultoraId, plano, transactionId, subscriptionId]
                    );
                }

                // Also update consultoras.plano_status and plano fields if they exist
                await pool.query(
                    `UPDATE consultoras SET plano = $1, plano_status = 'active', atualizado_em = NOW() WHERE id = $2`,
                    [plano, consultoraId]
                ).catch(() => { /* columns may not exist */ });

                console.log(`[Hotmart] ✅ Assinatura ativada: ${buyerEmail} → ${plano}`);
                break;
            }

            case 'SUBSCRIPTION_CANCELLATION':
            case 'PURCHASE_CANCELED': {
                await pool.query(
                    `UPDATE assinaturas SET status = 'cancelled', atualizado_em = NOW()
                     WHERE consultora_id = $1`,
                    [consultoraId]
                );
                await pool.query(
                    `UPDATE consultoras SET plano_status = 'cancelled', atualizado_em = NOW() WHERE id = $1`,
                    [consultoraId]
                ).catch(() => { });
                console.log(`[Hotmart] 🚫 Assinatura cancelada: ${buyerEmail}`);
                break;
            }

            case 'PURCHASE_REFUNDED': {
                await pool.query(
                    `UPDATE assinaturas SET status = 'refunded', atualizado_em = NOW()
                     WHERE consultora_id = $1`,
                    [consultoraId]
                );
                await pool.query(
                    `UPDATE consultoras SET plano_status = 'cancelled', atualizado_em = NOW() WHERE id = $1`,
                    [consultoraId]
                ).catch(() => { });
                console.log(`[Hotmart] 💸 Reembolso: ${buyerEmail}`);
                break;
            }

            case 'PURCHASE_DELAYED': {
                await pool.query(
                    `UPDATE assinaturas SET status = 'overdue', atualizado_em = NOW()
                     WHERE consultora_id = $1`,
                    [consultoraId]
                );
                console.log(`[Hotmart] ⏳ Pagamento atrasado: ${buyerEmail}`);
                break;
            }

            case 'PURCHASE_EXPIRED': {
                await pool.query(
                    `UPDATE assinaturas SET status = 'expired', atualizado_em = NOW()
                     WHERE consultora_id = $1`,
                    [consultoraId]
                );
                await pool.query(
                    `UPDATE consultoras SET plano_status = 'expired', atualizado_em = NOW() WHERE id = $1`,
                    [consultoraId]
                ).catch(() => { });
                console.log(`[Hotmart] ⌛ Assinatura expirada: ${buyerEmail}`);
                break;
            }

            default:
                console.log(`[Hotmart] ℹ️ Evento ignorado: ${event}`);
        }
    } catch (err) {
        console.error('[Hotmart] ❌ Erro ao processar webhook:', err.message);
    }

    res.status(200).json({ received: true });
});

module.exports = router;
