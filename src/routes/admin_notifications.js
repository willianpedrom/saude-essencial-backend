const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const checkAdmin = require('../middleware/checkAdmin');
const { broadcastPushNotification } = require('../lib/push');

// ─── PUBLIC/PROTECTED ROUTE: TRACK CLICK ───
// Called by Service Worker when a user clicks a notification
router.post('/track-click', async (req, res) => {
    const { broadcastId, consultoraId } = req.body;
    if (!broadcastId || !consultoraId) return res.status(400).json({ error: 'Missing data' });

    try {
        await pool.query(`
            INSERT INTO notification_clicks (broadcast_id, consultora_id)
            VALUES ($1, $2)
            ON CONFLICT (broadcast_id, consultora_id) DO NOTHING
        `, [broadcastId, consultoraId]);

        // Update total clicks in broadcast record
        await pool.query(`
            UPDATE notification_broadcasts 
            SET cliques_qtd = (SELECT COUNT(*) FROM notification_clicks WHERE broadcast_id = $1)
            WHERE id = $1
        `, [broadcastId]);

        res.json({ ok: true });
    } catch (err) {
        console.error('[TrackClick] Error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── AUTOMATION TRIGGER (Internal/Cron) ───
// This can be called by an external scheduler (like Railway Cron or GitHub Actions)
router.post('/trigger-automation', async (req, res) => {
    // Check for Secret Token (Cron) OR Admin Session
    const cronToken = req.headers['x-cron-token'];
    const isValidCron = cronToken && cronToken === process.env.CRON_SECRET;
    
    // If not valid cron token, we attempt manual auth/admin check later
    // For now, if it is a valid cron, it continues. 
    // If NOT a valid cron, we manually check auth for this specific route.
    if (!isValidCron) {
        // Run auth and checkAdmin manually for this route
        return auth(req, res, () => {
            checkAdmin(req, res, () => handleAutomation(req, res));
        });
    }

    return handleAutomation(req, res);
});

async function handleAutomation(req, res) {
    try {
        const { rows: poolRows } = await pool.query('SELECT * FROM admin_incentive_pool WHERE ativo = TRUE');
        if (poolRows.length === 0) return res.status(404).json({ error: 'Pool vazio.' });

        const randomMsg = poolRows[Math.floor(Math.random() * poolRows.length)];

        // Get an Admin ID for the log (take the first admin found if cron)
        let adminId = req.consultora?.id;
        if (!adminId) {
            const { rows: adminRows } = await pool.query("SELECT id FROM consultoras WHERE role = 'admin' LIMIT 1");
            adminId = adminRows[0]?.id;
        }

        if (!adminId) return res.status(500).json({ error: 'Nenhum administrador encontrado para registrar o log.' });

        // Create broadcast record
        const { rows: bRows } = await pool.query(`
            INSERT INTO notification_broadcasts (admin_id, titulo, mensagem, tipo)
            VALUES ($1, $2, $3, 'automatico') RETURNING id
        `, [adminId, randomMsg.titulo, randomMsg.mensagem]);

        const broadcastId = bRows[0].id;
        const payload = {
            title: randomMsg.titulo,
            body: randomMsg.mensagem,
            icon: '/icon-512.png',
            data: { url: '/#/' }
        };

        const sentCount = await broadcastPushNotification(payload, broadcastId);
        await pool.query('UPDATE notification_broadcasts SET destinatarios_qtd = $1 WHERE id = $2', [sentCount, broadcastId]);

        res.json({ success: true, count: sentCount, message: randomMsg.mensagem });
    } catch (err) {
        console.error('[Automation] Error:', err);
        res.status(500).json({ error: 'Erro na automação.' });
    }
}

// ─── ADMIN ROUTES (Protected) ───
router.use(auth, checkAdmin);

// GET /api/admin/notifications/history
router.get('/history', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT b.*, c.nome as admin_nome 
            FROM notification_broadcasts b
            JOIN consultoras c ON c.id = b.admin_id
            ORDER BY b.criado_em DESC
            LIMIT 50
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar histórico.' });
    }
});

// POST /api/admin/notifications/broadcast
router.post('/broadcast', async (req, res) => {
    const { titulo, mensagem, tipo = 'manual' } = req.body;
    if (!titulo || !mensagem) return res.status(400).json({ error: 'Título e mensagem são obrigatórios.' });

    try {
        // 1. Create broadcast record first to get ID
        const { rows: bRows } = await pool.query(`
            INSERT INTO notification_broadcasts (admin_id, titulo, mensagem, tipo)
            VALUES ($1, $2, $3, $4) RETURNING id
        `, [req.consultora.id, titulo, mensagem, tipo]);
        
        const broadcastId = bRows[0].id;

        // 2. Trigger mass push
        const payload = {
            title: titulo,
            body: mensagem,
            icon: '/icon-512.png',
            data: { url: '/#/' } // Default entry
        };

        const sentCount = await broadcastPushNotification(payload, broadcastId);

        // 3. Update recipients count
        await pool.query('UPDATE notification_broadcasts SET destinatarios_qtd = $1 WHERE id = $2', [sentCount, broadcastId]);

        res.json({ success: true, sentCount, broadcastId });
    } catch (err) {
        console.error('[AdminBroadcast] Error:', err);
        res.status(500).json({ error: 'Erro ao processar broadcast.' });
    }
});

// ─── INCENTIVE POOL MANAGEMENT ───

// GET /api/admin/notifications/pool
router.get('/pool', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM admin_incentive_pool ORDER BY criado_em DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar pool.' });
    }
});

// POST /api/admin/notifications/pool
router.post('/pool', async (req, res) => {
    const { titulo, mensagem } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO admin_incentive_pool (titulo, mensagem) VALUES ($1, $2) RETURNING *',
            [titulo || 'Incentivo', mensagem]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao adicionar frase.' });
    }
});

// DELETE /api/admin/notifications/pool/:id
router.delete('/pool/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM admin_incentive_pool WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao remover frase.' });
    }
});


module.exports = router;
