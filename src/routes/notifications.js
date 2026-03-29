const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const { vapidPublicKey } = require('../lib/push');

const router = express.Router();

// GET /api/notifications/vapid-key
router.get('/vapid-key', auth, (req, res) => {
    res.json({ publicKey: vapidPublicKey });
});

// POST /api/notifications/subscribe
router.post('/subscribe', auth, async (req, res) => {
    const { subscription, browser_name, device_type } = req.body;
    
    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Endpoint inváild' });
    }

    try {
        await pool.query(
            `INSERT INTO push_subscriptions 
                (consultora_id, endpoint, keys, browser_name, device_type)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (endpoint) DO UPDATE 
             SET keys = EXCLUDED.keys, atualizado_em = NOW()`,
            [
                req.consultora.id, 
                subscription.endpoint, 
                JSON.stringify(subscription.keys),
                browser_name || 'N/A',
                device_type || 'N/A'
            ]
        );
        res.status(201).json({ success: true });
    } catch (err) {
        console.error('[Notifications] Subscribe error:', err);
        res.status(500).json({ error: 'Erro ao assinar notificações.' });
    }
});

// POST /api/notifications/unsubscribe
router.post('/unsubscribe', auth, async (req, res) => {
    const { endpoint } = req.body;
    try {
        await pool.query(
            'DELETE FROM push_subscriptions WHERE consultora_id = $1 AND endpoint = $2',
            [req.consultora.id, endpoint]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('[Notifications] Unsubscribe error:', err);
        res.status(500).json({ error: 'Erro ao cancelar assinatura.' });
    }
});

module.exports = router;
