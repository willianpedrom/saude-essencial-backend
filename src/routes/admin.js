const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

// ── Admin guard middleware ──────────────────────────────────────
router.use(auth, async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            'SELECT role FROM consultoras WHERE id = $1', [req.consultora.id]
        );
        if (!rows[0] || rows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Acesso restrito a administradores.' });
        }
        next();
    } catch (err) {
        res.status(500).json({ error: 'Erro de autenticação.' });
    }
});

// GET /api/admin/users — list all consultoras with subscription info
router.get('/users', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT c.id, c.nome, c.email, c.telefone, c.role, c.foto_url,
              c.criado_em, c.atualizado_em,
              a.plano, a.status AS plano_status, a.trial_fim, a.periodo_fim,
              (SELECT COUNT(*) FROM clientes cl WHERE cl.consultora_id = c.id)  AS total_clientes,
              (SELECT COUNT(*) FROM anamneses an WHERE an.consultora_id = c.id) AS total_anamneses
              FROM consultoras c
              LEFT JOIN assinaturas a ON a.consultora_id = c.id
                AND a.criado_em = (SELECT MAX(criado_em) FROM assinaturas WHERE consultora_id = c.id)
              ORDER BY c.criado_em ASC`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
});

// PUT /api/admin/users/:id — edit consultora data + role
router.put('/users/:id', async (req, res) => {
    const { nome, email, telefone, role } = req.body;
    // Prevent removing own admin role
    if (req.params.id === req.consultora.id && role !== 'admin') {
        return res.status(400).json({ error: 'Você não pode remover seu próprio acesso de administrador.' });
    }
    try {
        const { rows } = await pool.query(
            `UPDATE consultoras SET nome=$1, email=$2, telefone=$3, role=$4, atualizado_em=NOW()
             WHERE id=$5
             RETURNING id, nome, email, telefone, role`,
            [nome, email, telefone || null, role || 'user', req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
        res.json({ success: true, consultora: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
});

// PUT /api/admin/users/:id/password — admin changes user password
router.put('/users/:id/password', async (req, res) => {
    const { password } = req.body;
    if (!password || password.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }
    try {
        const bcrypt = require('bcryptjs');
        const senhaHash = await bcrypt.hash(password, 10);

        const { rows } = await pool.query(
            `UPDATE consultoras SET senha_hash=$1, atualizado_em=NOW() WHERE id=$2 RETURNING id`,
            [senhaHash, req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar senha do usuário.' });
    }
});

// PUT /api/admin/users/:id/plan — update subscription plan
router.put('/users/:id/plan', async (req, res) => {
    const { plano, status } = req.body;
    try {
        // Upsert: update most recent subscription or insert new one
        const existing = await pool.query(
            'SELECT id FROM assinaturas WHERE consultora_id=$1 ORDER BY criado_em DESC LIMIT 1',
            [req.params.id]
        );
        if (existing.rows.length > 0) {
            await pool.query(
                'UPDATE assinaturas SET plano=$1, status=$2 WHERE id=$3',
                [plano, status, existing.rows[0].id]
            );
        } else {
            await pool.query(
                'INSERT INTO assinaturas (consultora_id, plano, status) VALUES ($1, $2, $3)',
                [req.params.id, plano, status]
            );
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar plano.' });
    }
});

// DELETE /api/admin/users/:id — delete consultora + all their data
router.delete('/users/:id', async (req, res) => {
    if (req.params.id === req.consultora.id) {
        return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
    }
    try {
        await pool.query('DELETE FROM consultoras WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir usuário.' });
    }
});

// GET /api/admin/users/:id/tracking — get a user's tracking config
router.get('/users/:id/tracking', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT rastreamento FROM consultoras WHERE id = $1', [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
        res.json({ rastreamento: rows[0].rastreamento || {} });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar configurações de rastreamento.' });
    }
});

// PUT /api/admin/users/:id/tracking — update a user's tracking config
router.put('/users/:id/tracking', async (req, res) => {
    const { meta_pixel_id, meta_pixel_token, clarity_id, ga_id, gtm_id, custom_script } = req.body;
    const rastreamento = {
        meta_pixel_id: meta_pixel_id || null,
        meta_pixel_token: meta_pixel_token || null,
        clarity_id: clarity_id || null,
        ga_id: ga_id || null,
        gtm_id: gtm_id || null,
        custom_script: custom_script || null,
    };
    try {
        const { rows } = await pool.query(
            `UPDATE consultoras SET rastreamento=$1, atualizado_em=NOW() WHERE id=$2 RETURNING id`,
            [JSON.stringify(rastreamento), req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao salvar configurações de rastreamento.' });
    }
});

// ══════════════════════════════════════════════════════════════
//  SYSTEM SETTINGS (payment gateway, etc.)
// ══════════════════════════════════════════════════════════════

// GET /api/admin/settings — get all system settings
router.get('/settings', async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT chave, valor FROM configuracoes`);
        const settings = {};
        rows.forEach(r => { settings[r.chave] = r.valor; });
        // Mask sensitive tokens for display
        if (settings.hotmart_hottok) {
            const tok = settings.hotmart_hottok;
            settings.hotmart_hottok_masked = tok.length > 8
                ? tok.slice(0, 4) + '••••' + tok.slice(-4)
                : '••••••••';
        }
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar configurações.' });
    }
});

// PUT /api/admin/settings — update system settings (upsert)
router.put('/settings', async (req, res) => {
    const allowed = [
        'hotmart_hottok', 'hotmart_product_id', 'hotmart_plano_map',
        'gateway_ativo', 'checkout_url'
    ];
    try {
        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                await pool.query(
                    `INSERT INTO configuracoes (chave, valor) VALUES ($1, $2)
                     ON CONFLICT (chave) DO UPDATE SET valor = $2, atualizado_em = NOW()`,
                    [key, req.body[key] || null]
                );
            }
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao salvar configurações.' });
    }
});

module.exports = router;
