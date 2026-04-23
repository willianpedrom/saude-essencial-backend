const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const mailer = require('../lib/mailer');
const router = express.Router();

function makeSlug(nome) {
    return nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36);
}

/**
 * --- PUBLIC ROUTES (FOR PROSPECTS) ---
 */

// Get sales capture form structure
router.get('/public/capture/:token', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM anamneses WHERE tipo = $1 AND token_publico::text = $2',
            ['sales_funnel', req.params.token]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Formulário não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit lead data
router.post('/public/capture/:token/submit', async (req, res) => {
    const { nome, email, telefone, cidade, respostas } = req.body;
    try {
        // 1. Insert lead record
        const { rows: leadRows } = await pool.query(
            `INSERT INTO prospectos_plataforma (nome, email, telefone, cidade, respostas, origem_slug)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [nome, email, telefone, cidade, respostas, req.params.token]
        );

        // 2. Try to auto-create account (Trial)
        let accountCreated = false;
        let temporaryPassword = null;

        const { rows: existing } = await pool.query('SELECT id FROM consultoras WHERE email = $1', [email]);
        
        if (existing.length === 0) {
            temporaryPassword = crypto.randomBytes(4).toString('hex');
            const senhaHash = await bcrypt.hash(temporaryPassword, 10);
            const slug = makeSlug(nome);

            const { rows: newUser } = await pool.query(
                `INSERT INTO consultoras (nome, email, senha_hash, telefone, slug, termos_aceitos, termos_aceitos_em)
                 VALUES ($1, $2, $3, $4, $5, TRUE, NOW()) RETURNING id`,
                [nome, email, senhaHash, telefone, slug]
            );

            await pool.query(
                `INSERT INTO assinaturas (consultora_id, plano, status, trial_fim) 
                 VALUES ($1, 'starter', 'trial', NOW() + INTERVAL '7 days')`,
                [newUser[0].id]
            );
            
            accountCreated = true;

            // Send Welcome Email
            try {
                await mailer.sendWelcomeEmail({ 
                    nome, 
                    email, 
                    senhaProvisoria: temporaryPassword 
                });
            } catch (mailErr) {
                console.error('Erro ao enviar email de boas-vindas:', mailErr);
            }
        }

        res.status(201).json({ 
            success: true, 
            lead_id: leadRows[0].id,
            account_created: accountCreated
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * --- PRIVATE ROUTES (FOR ADMIN) ---
 */

// Admin guard middleware
router.use(auth, async (req, res, next) => {
    try {
        const { rows } = await pool.query('SELECT role FROM consultoras WHERE id = $1', [req.consultora.id]);
        if (!rows[0] || rows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Acesso restrito ao administrador.' });
        }
        next();
    } catch (err) {
        res.status(500).json({ error: 'Erro de autenticação.' });
    }
});

// Get or Create the sales funnel template
router.get('/admin/template', async (req, res) => {
    try {
        let { rows } = await pool.query('SELECT * FROM anamneses WHERE tipo = $1', ['sales_funnel']);
        
        if (rows.length === 0) {
            const defaultQuestions = {
                perguntas: [
                    { id: 'status_profissional', texto: 'Qual sua ocupação principal?', tipo: 'text' },
                    { id: 'trabalha_oleos', texto: 'Já trabalha com Óleos Essenciais?', tipo: 'select', opcoes: ['Sim', 'Não'] },
                    { id: 'faturamento_desejado', texto: 'Quanto você deseja faturar por mês com aromaterapia?', tipo: 'text' },
                    { id: 'maior_desafio', texto: 'Qual seu maior desafio na gestão de clientes hoje?', tipo: 'textarea' }
                ]
            };
            const insert = await pool.query(
                `INSERT INTO anamneses (consultora_id, tipo, dados) 
                 VALUES ($1, $2, $3) RETURNING *`,
                [req.consultora.id, 'sales_funnel', defaultQuestions]
            );
            rows = insert.rows;
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update template structure
router.put('/admin/template', async (req, res) => {
    const { dados } = req.body;
    try {
        await pool.query(
            'UPDATE anamneses SET dados = $1, atualizado_em = NOW() WHERE tipo = $2',
            [dados, 'sales_funnel']
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List all captured leads
router.get('/admin/leads', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM prospectos_plataforma ORDER BY criado_em DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update lead status or notes
router.patch('/admin/leads/:id', async (req, res) => {
    const { status, notas_admin } = req.body;
    try {
        await pool.query(
            'UPDATE prospectos_plataforma SET status = $1, notas_admin = $2, atualizado_em = NOW() WHERE id = $3',
            [status, notas_admin, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a lead
router.delete('/admin/leads/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM prospectos_plataforma WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
