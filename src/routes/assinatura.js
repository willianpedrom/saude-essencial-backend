const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

// Stripe prices (set these in your .env or Stripe dashboard)
const PLANOS = {
    starter: process.env.STRIPE_PRICE_STARTER,
    pro: process.env.STRIPE_PRICE_PRO,
    premium: process.env.STRIPE_PRICE_PREMIUM,
};

// GET /api/assinatura/status
router.get('/status', auth, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT plano, status, trial_fim, periodo_inicio, periodo_fim
       FROM assinaturas WHERE consultora_id = $1
       ORDER BY criado_em DESC LIMIT 1`,
            [req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Assinatura não encontrada.' });

        const sub = rows[0];
        const now = new Date();
        let ativa = false;
        if (sub.status === 'trial' && new Date(sub.trial_fim) > now) ativa = true;
        if (sub.status === 'active' && new Date(sub.periodo_fim) > now) ativa = true;

        res.json({ ...sub, ativa });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao verificar assinatura.' });
    }
});

// POST /api/assinatura/checkout  – creates Stripe Checkout session
router.post('/checkout', auth, async (req, res) => {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { plano } = req.body;

    if (!PLANOS[plano]) return res.status(400).json({ error: 'Plano inválido.' });

    try {
        // Get or create Stripe customer
        const { rows } = await pool.query(
            'SELECT stripe_customer_id FROM assinaturas WHERE consultora_id = $1 LIMIT 1',
            [req.consultora.id]
        );

        let customerId = rows[0]?.stripe_customer_id;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: req.consultora.email,
                name: req.consultora.nome,
                metadata: { consultora_id: req.consultora.id },
            });
            customerId = customer.id;
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: PLANOS[plano], quantity: 1 }],
            success_url: `${process.env.FRONTEND_URL}/dashboard?assinatura=sucesso`,
            cancel_url: `${process.env.FRONTEND_URL}/assinatura?assinatura=cancelado`,
            metadata: { consultora_id: req.consultora.id, plano },
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar sessão de pagamento.' });
    }
});

// POST /api/assinatura/webhook  – Stripe sends events here
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const data = event.data.object;

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const { consultora_id, plano } = data.metadata;
                await pool.query(
                    `UPDATE assinaturas
           SET status='active', plano=$1, stripe_customer_id=$2, stripe_sub_id=$3,
               periodo_inicio=NOW(), periodo_fim=NOW() + INTERVAL '30 days', atualizado_em=NOW()
           WHERE consultora_id=$4`,
                    [plano, data.customer, data.subscription, consultora_id]
                );
                break;
            }
            case 'invoice.payment_succeeded': {
                // Renew subscription period
                const sub = await stripe.subscriptions.retrieve(data.subscription);
                const { consultora_id } = sub.metadata;
                if (consultora_id) {
                    const periodEnd = new Date(sub.current_period_end * 1000);
                    await pool.query(
                        `UPDATE assinaturas
             SET status='active', periodo_fim=$1, atualizado_em=NOW()
             WHERE consultora_id=$2`,
                        [periodEnd, consultora_id]
                    );
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const { consultora_id } = data.metadata;
                if (consultora_id) {
                    await pool.query(
                        `UPDATE assinaturas SET status='cancelled', atualizado_em=NOW() WHERE consultora_id=$1`,
                        [consultora_id]
                    );
                }
                break;
            }
        }
    } catch (err) {
        console.error('Webhook processing error:', err);
    }

    res.json({ received: true });
});

module.exports = router;
