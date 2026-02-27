const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { sendWelcomeEmail, sendCancellationEmail } = require('../lib/mailer');

const router = express.Router();

// ── Helpers ────────────────────────────────────────────────────────────────

function makeSlug(nome) {
    return nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36);
}

function generateTempPassword(length = 10) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function resolveHotmartPlan(data) {
    let plano = 'pro';
    try {
        const offerId = String(data?.purchase?.offer?.code || data?.product?.id || '');
        if (offerId) {
            const { rows: planoRows } = await pool.query(
                `SELECT slug FROM planos WHERE hotmart_offer_id=$1 AND ativo=TRUE LIMIT 1`,
                [offerId]
            );
            if (planoRows.length > 0) return planoRows[0].slug;
            const { rows: cfg } = await pool.query(
                `SELECT valor FROM configuracoes WHERE chave = 'hotmart_plano_map' LIMIT 1`
            );
            if (cfg.length > 0 && cfg[0].valor) {
                const map = JSON.parse(cfg[0].valor);
                if (map[offerId]) return map[offerId];
            }
        }
    } catch { /* use default */ }
    return plano;
}

async function registerPayment(consultoraId, { event, transactionId, subscriptionId, plano, valor }) {
    try {
        await pool.query(
            `INSERT INTO pagamentos (consultora_id, gateway, evento, transaction_id, subscription_id, plano, valor, status)
             VALUES ($1, 'hotmart', $2, $3, $4, $5, $6, 'approved')`,
            [consultoraId, event, transactionId || null, subscriptionId || null, plano, valor || null]
        );
    } catch (err) {
        console.warn('[Hotmart] Aviso ao registrar pagamento:', err.message);
    }
}

// ── POST /api/hotmart/webhook ──────────────────────────────────────────────
router.post('/webhook', express.json(), async (req, res) => {
    const receivedHottok = req.headers['x-hotmart-hottok'];

    // 1. Validate hottok
    let expectedHottok = process.env.HOTMART_HOTTOK;
    try {
        const { rows } = await pool.query(
            `SELECT valor FROM configuracoes WHERE chave = 'hotmart_hottok' LIMIT 1`
        );
        if (rows.length > 0 && rows[0].valor) expectedHottok = rows[0].valor;
    } catch { /* table may not exist yet */ }

    if (!expectedHottok || receivedHottok !== expectedHottok) {
        console.warn('[Hotmart] ❌ Hottok inválido ou ausente');
        return res.status(401).json({ error: 'Hottok inválido.' });
    }

    const event = req.body.event || req.body.data?.event;
    const data = req.body.data || req.body;
    console.log(`[Hotmart] 📩 Evento: ${event}`);

    try {
        const buyer = data?.buyer || {};
        const buyerEmail = (buyer.email || '').toLowerCase().trim();
        const buyerNome = buyer.name || buyer.first_name
            ? `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim()
            : 'Novo Membro';
        const transactionId = data?.purchase?.transaction || null;
        const subscriptionId = data?.subscription?.subscriber?.code || null;
        const valor = data?.purchase?.price?.value || null;

        if (!buyerEmail) {
            console.warn('[Hotmart] ⚠️ Email do comprador não encontrado');
            return res.status(200).json({ received: true, warning: 'no buyer email' });
        }

        // 2. Find or CREATE consultora
        let { rows: consultoras } = await pool.query(
            `SELECT id, nome FROM consultoras WHERE LOWER(email) = $1 LIMIT 1`,
            [buyerEmail]
        );

        let consultoraId;
        let isNewAccount = false;
        let tempPassword = null;

        if (consultoras.length > 0) {
            consultoraId = consultoras[0].id;
        } else if (event === 'PURCHASE_COMPLETE' || event === 'PURCHASE_APPROVED') {
            // Auto-create account for new buyer
            tempPassword = generateTempPassword();
            const senhaHash = await bcrypt.hash(tempPassword, 10);
            const slug = makeSlug(buyerEmail.split('@')[0] + '-' + buyerNome.split(' ')[0]);

            const { rows: newUser } = await pool.query(
                `INSERT INTO consultoras (nome, email, senha_hash, slug, genero)
                 VALUES ($1, $2, $3, $4, 'feminino')
                 RETURNING id, nome`,
                [buyerNome, buyerEmail, senhaHash, slug]
            );
            consultoraId = newUser[0].id;
            isNewAccount = true;
            console.log(`[Hotmart] 🆕 Conta criada automaticamente: ${buyerEmail} (${buyerNome})`);
        } else {
            console.warn(`[Hotmart] ⚠️ Usuário não encontrado para evento ${event}: ${buyerEmail}`);
            return res.status(200).json({ received: true, warning: 'user not found' });
        }

        // 3. Handle event
        switch (event) {
            case 'PURCHASE_COMPLETE':
            case 'PURCHASE_APPROVED': {
                const plano = await resolveHotmartPlan(data);

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

                // Update consultoras denormalized fields (if they exist)
                await pool.query(
                    `UPDATE consultoras SET plano = $1, plano_status = 'active', atualizado_em = NOW() WHERE id = $2`,
                    [plano, consultoraId]
                ).catch(() => { });

                await registerPayment(consultoraId, { event, transactionId, subscriptionId, plano, valor });

                // Send welcome email (with or without temp password)
                await sendWelcomeEmail({
                    nome: buyerNome,
                    email: buyerEmail,
                    senhaProvisoria: isNewAccount ? tempPassword : null,
                    plano,
                    isNewAccount,
                });

                console.log(`[Hotmart] ✅ Assinatura ativada: ${buyerEmail} → ${plano}${isNewAccount ? ' (conta nova)' : ''}`);
                break;
            }

            case 'SUBSCRIPTION_CANCELLATION':
            case 'PURCHASE_CANCELED': {
                await pool.query(
                    `UPDATE assinaturas SET status = 'cancelled', atualizado_em = NOW() WHERE consultora_id = $1`,
                    [consultoraId]
                );
                await pool.query(
                    `UPDATE consultoras SET plano_status = 'cancelled', atualizado_em = NOW() WHERE id = $1`,
                    [consultoraId]
                ).catch(() => { });
                await registerPayment(consultoraId, { event, transactionId, subscriptionId, plano: null, valor: null });
                // Look up name for cancellation email
                const { rows: cr } = await pool.query('SELECT nome FROM consultoras WHERE id=$1', [consultoraId]);
                await sendCancellationEmail({ nome: cr[0]?.nome || buyerNome, email: buyerEmail });
                console.log(`[Hotmart] 🚫 Assinatura cancelada: ${buyerEmail}`);
                break;
            }

            case 'PURCHASE_REFUNDED': {
                await pool.query(
                    `UPDATE assinaturas SET status = 'refunded', atualizado_em = NOW() WHERE consultora_id = $1`,
                    [consultoraId]
                );
                await pool.query(
                    `UPDATE consultoras SET plano_status = 'cancelled', atualizado_em = NOW() WHERE id = $1`,
                    [consultoraId]
                ).catch(() => { });
                await registerPayment(consultoraId, { event, transactionId, subscriptionId, plano: null, valor: null });
                console.log(`[Hotmart] 💸 Reembolso: ${buyerEmail}`);
                break;
            }

            case 'PURCHASE_DELAYED': {
                await pool.query(
                    `UPDATE assinaturas SET status = 'overdue', atualizado_em = NOW() WHERE consultora_id = $1`,
                    [consultoraId]
                );
                await registerPayment(consultoraId, { event, transactionId, subscriptionId, plano: null, valor: null });
                console.log(`[Hotmart] ⏳ Pagamento atrasado: ${buyerEmail}`);
                break;
            }

            case 'PURCHASE_EXPIRED': {
                await pool.query(
                    `UPDATE assinaturas SET status = 'expired', atualizado_em = NOW() WHERE consultora_id = $1`,
                    [consultoraId]
                );
                await pool.query(
                    `UPDATE consultoras SET plano_status = 'expired', atualizado_em = NOW() WHERE id = $1`,
                    [consultoraId]
                ).catch(() => { });
                await registerPayment(consultoraId, { event, transactionId, subscriptionId, plano: null, valor: null });
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
