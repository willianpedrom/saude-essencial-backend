const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const checkSub = require('../middleware/checkSubscription');
const checkFeature = require('../middleware/checkFeature');

const router = express.Router();

// All routes require auth + active subscription
router.use(auth, checkSub);

// GET /api/clientes
router.get('/', async (req, res) => {
    try {
        // Filtra ativo=TRUE por padrão. Use ?ativo=false para ver inativos, ?ativo=all para todos.
        let queryStr = `
            SELECT id, nome, email, telefone, cpf, data_nascimento, genero, cidade, notas, ativo, status,
                   pipeline_stage, pipeline_notas, motivo_perda, pipeline_stage_updated_at,
                   recrutamento_stage, recrutamento_notas, motivo_perda_recrutamento, recrutamento_stage_updated_at,
                   tipo_cadastro, criado_em, atualizado_em
            FROM clientes
            WHERE consultora_id = $1
        `;
        const queryParams = [req.consultora.id];

        if (req.query.ativo === 'all') {
            // não filtra — retorna todos
        } else if (req.query.ativo === 'false') {
            queryStr += ` AND ativo = FALSE`;
        } else {
            // padrão: só ativos
            queryStr += ` AND ativo = TRUE`;
        }

        queryStr += ` ORDER BY nome ASC`;

        const { rows } = await pool.query(queryStr, queryParams);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar clientes.' });
    }
});

// GET /api/clientes/:id
router.get('/:id', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM clientes WHERE id = $1 AND consultora_id = $2',
            [req.params.id, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Cliente não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar cliente.' });
    }
});

// POST /api/clientes
router.post('/', async (req, res) => {
    const { nome, email, telefone, cpf, data_nascimento, genero, cidade, notas, status, tipo_cadastro } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });

    try {
        // ── Limit enforcement ───────────────────────────────────────────
        const limites = req.consultora.limites || {};
        if (limites.clientes_max !== null && limites.clientes_max !== undefined) {
            const { rows: [{ count }] } = await pool.query(
                'SELECT COUNT(*) FROM clientes WHERE consultora_id=$1 AND ativo=TRUE',
                [req.consultora.id]
            );
            const total = parseInt(count);
            if (total >= limites.clientes_max) {
                return res.status(403).json({
                    error: `Você atingiu o limite de ${limites.clientes_max} clientes do seu plano. Faça upgrade para continuar.`,
                    code: 'LIMIT_REACHED',
                    limit: limites.clientes_max,
                    current: total,
                    resource: 'clientes',
                });
            }
            // Warn at 80%
            const pct = total / limites.clientes_max;
            if (pct >= 0.8) {
                res.setHeader('X-Limit-Warning', `clientes:${total}/${limites.clientes_max}`);
            }
        }

        const { rows } = await pool.query(
            `INSERT INTO clientes (consultora_id, nome, email, telefone, cpf, data_nascimento, genero, cidade, notas, status, tipo_cadastro)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
            [req.consultora.id, nome, email, telefone, cpf, data_nascimento || null, genero, cidade, notas, status || 'active', tipo_cadastro || null]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar cliente.' });
    }
});


// PUT /api/clientes/:id
router.put('/:id', async (req, res) => {
    const { nome, email, telefone, cpf, data_nascimento, genero, cidade, notas, status, tipo_cadastro } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE clientes
       SET nome=$1, email=$2, telefone=$3, cpf=$4, data_nascimento=$5,
           genero=$6, cidade=$7, notas=$8, status=$9, tipo_cadastro=$10, atualizado_em=NOW()
       WHERE id=$11 AND consultora_id=$12
       RETURNING *`,
            [nome, email, telefone, cpf, data_nascimento || null, genero, cidade, notas,
                status || 'active', tipo_cadastro || null, req.params.id, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Cliente não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar cliente.' });
    }
});

// PATCH /api/clientes/:id/stage
router.patch('/:id/stage', checkFeature('tem_pipeline'), async (req, res) => {
    const { stage, notas, motivo_perda } = req.body;
    const VALID_STAGES = ['lead_captado', 'primeiro_contato', 'interesse_confirmado',
        'protocolo_apresentado', 'proposta_enviada', 'negociando', 'primeira_compra', 'perdido'];
    if (!stage || !VALID_STAGES.includes(stage)) {
        return res.status(400).json({ error: 'Estágio inválido.' });
    }
    try {
        const { rows } = await pool.query(
            `UPDATE clientes
             SET pipeline_stage=$1, 
                 pipeline_notas=COALESCE($2, pipeline_notas), 
                 motivo_perda=$3,
                 atualizado_em=NOW(),
                 pipeline_stage_updated_at=NOW()
             WHERE id=$4 AND consultora_id=$5
             RETURNING id, nome, pipeline_stage, pipeline_notas, motivo_perda`,
            [stage, notas || null, motivo_perda || null, req.params.id, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Cliente não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar estágio.' });
    }
});

// PATCH /api/clientes/:id/recrutamento-stage
router.patch('/:id/recrutamento-stage', checkFeature('tem_pipeline'), async (req, res) => {
    const { stage, notas, motivo_perda } = req.body;
    // se stage for null, o cliente sai do pipeline de recrutamento (não é mais validado como estágio)
    const VALID_STAGES = [null, 'prospecto_negocio', 'convite_apresentacao', 'apresentacao_assistida',
        'acompanhamento_cadastro', 'cadastrada', 'nao_tem_interesse_agora'];
    if (stage !== undefined && stage !== null && !VALID_STAGES.includes(stage)) {
        return res.status(400).json({ error: 'Estágio de recrutamento inválido.' });
    }
    try {
        const { rows } = await pool.query(
            `UPDATE clientes
             SET recrutamento_stage=$1, 
                 recrutamento_notas=COALESCE($2, recrutamento_notas), 
                 motivo_perda_recrutamento=$3,
                 atualizado_em=NOW(),
                 recrutamento_stage_updated_at=NOW()
             WHERE id=$4 AND consultora_id=$5
             RETURNING id, nome, recrutamento_stage, recrutamento_notas, motivo_perda_recrutamento`,
            [stage, notas || null, motivo_perda || null, req.params.id, req.consultora.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Cliente não encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar estágio de recrutamento.' });
    }
});

// DELETE /api/clientes/:id (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        await pool.query(
            'UPDATE clientes SET ativo=FALSE, atualizado_em=NOW() WHERE id=$1 AND consultora_id=$2',
            [req.params.id, req.consultora.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover cliente.' });
    }
});

// POST /api/clientes/import — importação em massa via CSV (enviado como JSON array)
router.post('/import', async (req, res) => {
    const { clientes } = req.body;
    if (!Array.isArray(clientes) || clientes.length === 0) {
        return res.status(400).json({ error: 'Nenhum cliente enviado.' });
    }
    if (clientes.length > 500) {
        return res.status(400).json({ error: 'Máximo de 500 clientes por importação.' });
    }

    // Check plan limit
    const limites = req.consultora.limites || {};
    let totalAtual = 0;
    if (limites.clientes_max !== null && limites.clientes_max !== undefined) {
        const { rows: [{ count }] } = await pool.query(
            'SELECT COUNT(*) FROM clientes WHERE consultora_id=$1 AND ativo=TRUE',
            [req.consultora.id]
        );
        totalAtual = parseInt(count);
        const disponiveis = limites.clientes_max - totalAtual;
        if (disponiveis <= 0) {
            return res.status(403).json({
                error: `Você atingiu o limite de ${limites.clientes_max} clientes do plano. Faça upgrade para importar mais.`,
                code: 'LIMIT_REACHED',
            });
        }
    }

    const criados = [];
    const pulados = [];
    const erros = [];

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (let i = 0; i < clientes.length; i++) {
            const row = clientes[i];
            const nome = (row.nome || row.name || '').trim();
            if (!nome) { erros.push({ linha: i + 2, erro: 'Nome obrigatório', dados: row }); continue; }

            // Parse optional date
            let dataNasc = null;
            const rawDate = row.data_nascimento || row.birthdate || row.nascimento || '';
            if (rawDate) {
                const d = new Date(rawDate);
                if (!isNaN(d.getTime())) dataNasc = d.toISOString().split('T')[0];
            }

            const email = (row.email || '').trim().toLowerCase() || null;
            const telefone = (row.telefone || row.phone || row.whatsapp || '').trim() || null;
            const cidade = (row.cidade || row.city || '').trim() || null;
            const genero = (row.genero || row.gender || 'feminino').toLowerCase().includes('masc') ? 'masculino' : 'feminino';
            const notas = (row.notas || row.notes || row.observacoes || '').trim() || null;
            const status = (row.status || 'active').toLowerCase() === 'inativo' ? 'inactive' : 'active';

            try {
                // Verificar duplicidade de e-mail
                let isDuplicate = false;
                if (email) {
                    const checkEmail = await client.query(
                        'SELECT id FROM clientes WHERE consultora_id=$1 AND email=$2',
                        [req.consultora.id, email]
                    );
                    if (checkEmail.rows.length > 0) isDuplicate = true;
                }

                if (isDuplicate) {
                    pulados.push({ linha: i + 2, motivo: 'E-mail já cadastrado', nome });
                    continue;
                }

                // Enforce plan limits strictly on a per-row basis
                if (limites.clientes_max !== null && limites.clientes_max !== undefined) {
                    if (totalAtual + criados.length >= limites.clientes_max) {
                        erros.push({ linha: i + 2, erro: `Limite do plano atingido (Máx ${limites.clientes_max} clientes)`, nome });
                        continue;
                    }
                }

                const { rows } = await client.query(
                    `INSERT INTO clientes (consultora_id, nome, email, telefone, data_nascimento, genero, cidade, notas, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                     RETURNING id, nome`,
                    [req.consultora.id, nome, email, telefone, dataNasc, genero, cidade, notas, status]
                );

                if (rows.length > 0) criados.push(rows[0].nome);
            } catch (e) {
                erros.push({ linha: i + 2, erro: e.message, nome });
            }
        }
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: 'Erro na importação: ' + e.message });
    } finally {
        client.release();
    }

    console.log(`[Import] consultora=${req.consultora.id} criados=${criados.length} pulados=${pulados.length} erros=${erros.length}`);
    return res.json({ success: true, criados: criados.length, pulados: pulados.length, erros, total: clientes.length });
});

module.exports = router;
