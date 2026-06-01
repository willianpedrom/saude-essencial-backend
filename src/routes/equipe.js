const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const checkSub = require('../middleware/checkSubscription');
const { sendPushNotification } = require('../lib/push');

const router = express.Router();

// Todos os endpoints necessitam de autenticação e assinatura ativa
router.use(auth, checkSub);

/**
 * GET /api/equipe/me
 * Retorna as informações da equipe atual do usuário (como Líder ou Liderado)
 */
router.get('/me', async (req, res) => {
    try {
        const userId = req.consultora.id;

        // 1. Verifica se o usuário é líder de alguma equipe
        const { rows: liderRows } = await pool.query(
            'SELECT * FROM equipes WHERE lider_id = $1',
            [userId]
        );

        if (liderRows.length > 0) {
            return res.json({ role: 'lider', equipe: liderRows[0] });
        }

        // 2. Verifica se o usuário é liderado em alguma equipe
        const { rows: lideradoRows } = await pool.query(
            `SELECT e.*, l.nome as lider_nome, l.telefone as lider_telefone, l.foto_url as lider_foto_url 
             FROM equipes e
             JOIN consultoras c ON c.equipe_id = e.id
             JOIN consultoras l ON l.id = e.lider_id
             WHERE c.id = $1`,
            [userId]
        );

        if (lideradoRows.length > 0) {
            return res.json({ role: 'liderado', equipe: lideradoRows[0] });
        }

        // 3. Sem equipe associada
        res.json({ role: null, equipe: null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar dados da equipe.' });
    }
});

/**
 * POST /api/equipe/criar
 * Cria uma nova equipe para o líder logado (restrito a planos premium)
 */
router.post('/criar', async (req, res) => {
    try {
        if (!req.consultora.limites.tem_equipe) {
            return res.status(403).json({ error: 'Seu plano atual não inclui a funcionalidade de equipes. Faça um upgrade!' });
        }

        const userId = req.consultora.id;
        const { nome_equipe } = req.body;

        if (!nome_equipe || nome_equipe.trim() === '') {
            return res.status(400).json({ error: 'O nome da equipe é obrigatório.' });
        }

        // Verifica se já possui equipe cadastrada como líder
        const { rows: existing } = await pool.query(
            'SELECT id FROM equipes WHERE lider_id = $1',
            [userId]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Você já possui uma equipe criada como líder.' });
        }

        // Gera código de convite único
        const baseSlug = req.consultora.slug || 'gota';
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const codigo_convite = `LIDER-${baseSlug.toUpperCase().slice(0, 10)}-${randomNum}`;

        // Insere a nova equipe
        const { rows: newEquipe } = await pool.query(
            `INSERT INTO equipes (lider_id, nome_equipe, codigo_convite)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [userId, nome_equipe.trim(), codigo_convite]
        );

        // Vincula o próprio líder ao ID da equipe criada
        await pool.query(
            'UPDATE consultoras SET equipe_id = $1 WHERE id = $2',
            [newEquipe[0].id, userId]
        );

        res.status(201).json(newEquipe[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar equipe.' });
    }
});

/**
 * POST /api/equipe/entrar
 * Liderado entra em uma equipe informando o código de convite
 */
router.post('/entrar', async (req, res) => {
    try {
        const userId = req.consultora.id;
        const { codigo_convite } = req.body;

        if (!codigo_convite || codigo_convite.trim() === '') {
            return res.status(400).json({ error: 'O código de convite é obrigatório.' });
        }

        // 1. Busca a equipe correspondente ao código
        const { rows: equipeRows } = await pool.query(
            'SELECT * FROM equipes WHERE UPPER(codigo_convite) = $1',
            [codigo_convite.trim().toUpperCase()]
        );

        if (equipeRows.length === 0) {
            return res.status(404).json({ error: 'Código de convite inválido ou equipe não encontrada.' });
        }

        const equipe = equipeRows[0];

        // 2. Impede o líder de entrar em outras equipes
        if (equipe.lider_id === userId) {
            return res.status(400).json({ error: 'Você é o líder desta equipe e não pode se vincular como liderado.' });
        }

        const { rows: checkLider } = await pool.query('SELECT id FROM equipes WHERE lider_id = $1', [userId]);
        if (checkLider.length > 0) {
            return res.status(400).json({ error: 'Você já possui sua própria equipe e não pode entrar em outra.' });
        }

        // 3. Atualiza o equipe_id da consultora liderada
        await pool.query(
            'UPDATE consultoras SET equipe_id = $1 WHERE id = $2',
            [equipe.id, userId]
        );

        // Notifica o líder via push que um novo membro entrou
        sendPushNotification(equipe.lider_id, {
            title: 'Novo membro na equipe! 🤝',
            body: `${req.consultora.nome} acabou de entrar na sua equipe.`,
            data: { url: '/equipe' }
        });

        res.json({ success: true, equipe });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao ingressar na equipe.' });
    }
});

/**
 * POST /api/equipe/sair
 * Liderado desvincula-se da equipe
 */
router.post('/sair', async (req, res) => {
    try {
        const userId = req.consultora.id;

        // Verifica se é líder (líder não sai, apenas pode excluir a equipe inteira se desejar)
        const { rows: checkLider } = await pool.query('SELECT id FROM equipes WHERE lider_id = $1', [userId]);
        if (checkLider.length > 0) {
            return res.status(400).json({ error: 'Você é o líder da equipe e não pode sair dela. Exclua a equipe para encerrá-la.' });
        }

        const { rows: current } = await pool.query('SELECT equipe_id FROM consultoras WHERE id = $1', [userId]);
        if (current.length === 0 || !current[0].equipe_id) {
            return res.status(400).json({ error: 'Você não está vinculado a nenhuma equipe.' });
        }

        const equipeId = current[0].equipe_id;

        // Notifica o líder da saída
        const { rows: liderRows } = await pool.query('SELECT lider_id FROM equipes WHERE id = $1', [equipeId]);
        if (liderRows.length > 0) {
            sendPushNotification(liderRows[0].lider_id, {
                title: 'Membro saiu da equipe 🚪',
                body: `${req.consultora.nome} se desvinculou da sua equipe.`,
                data: { url: '/equipe' }
            });
        }

        await pool.query('UPDATE consultoras SET equipe_id = NULL WHERE id = $1', [userId]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao sair da equipe.' });
    }
});

/**
 * GET /api/equipe/membros
 * Retorna os membros da equipe direta do líder logado, incluindo performance
 */
router.get('/membros', async (req, res) => {
    try {
        const userId = req.consultora.id;

        // 1. Busca a equipe pertencente a este líder
        const { rows: equipeRows } = await pool.query(
            'SELECT id FROM equipes WHERE lider_id = $1',
            [userId]
        );

        if (equipeRows.length === 0) {
            return res.status(403).json({ error: 'Você não possui permissões de liderança ou equipe cadastrada.' });
        }

        const equipeId = equipeRows[0].id;

        // 2. Busca todos os liderados vinculados
        const { rows: membros } = await pool.query(
            `SELECT id, nome, email, telefone, foto_url, rank_doterra, criado_em 
             FROM consultoras 
             WHERE equipe_id = $1 AND id != $2
             ORDER BY nome ASC`,
            [equipeId, userId]
        );

        // 3. Coleta dados de progresso (anamneses, followups atrasados) para cada liderado
        const membersWithMetrics = [];
        for (const membro of membros) {
            const { rows: anamnesesCount } = await pool.query(
                "SELECT COUNT(*) FROM anamneses WHERE consultora_id = $1 AND preenchido = TRUE",
                [membro.id]
            );

            const { rows: followCount } = await pool.query(
                `SELECT 
                   COUNT(*) FILTER (WHERE status = 'pending') as pendentes,
                   COUNT(*) FILTER (WHERE status = 'pending' AND due_date_time < NOW() AT TIME ZONE 'America/Sao_Paulo') as atrasados
                 FROM followups 
                 WHERE consultora_id = $1`,
                [membro.id]
            );

            membersWithMetrics.push({
                ...membro,
                metricas: {
                    anamneses_preenchidas: parseInt(anamnesesCount[0].count, 10),
                    followups_pendentes: parseInt(followCount[0].pendentes || 0, 10),
                    followups_atrasados: parseInt(followCount[0].atrasados || 0, 10)
                }
            });
        }

        res.json(membersWithMetrics);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar membros da equipe.' });
    }
});

/**
 * POST /api/equipe/delegar
 * Líder compartilha/delega um lead/cliente de sua carteira com um consultor liderado
 */
router.post('/delegar', async (req, res) => {
    try {
        const userId = req.consultora.id;
        const { cliente_id, liderado_id, notas_lider } = req.body;

        if (!cliente_id || !liderado_id) {
            return res.status(400).json({ error: 'Parâmetros cliente_id e liderado_id são obrigatórios.' });
        }

        // 1. Verifica se quem logou é líder de alguma equipe e se o liderado pertence a ela
        const { rows: equipeRows } = await pool.query('SELECT id FROM equipes WHERE lider_id = $1', [userId]);
        if (equipeRows.length === 0) {
            return res.status(403).json({ error: 'Você não tem uma equipe para delegar leads.' });
        }

        const equipeId = equipeRows[0].id;
        const { rows: memberCheck } = await pool.query(
            'SELECT id, nome FROM consultoras WHERE id = $1 AND equipe_id = $2',
            [liderado_id, equipeId]
        );
        if (memberCheck.length === 0) {
            return res.status(400).json({ error: 'O consultor escolhido não faz parte da sua equipe.' });
        }

        // 2. Busca o cliente na conta do líder
        const { rows: clientRows } = await pool.query(
            'SELECT * FROM clientes WHERE id = $1 AND consultora_id = $2',
            [cliente_id, userId]
        );
        if (clientRows.length === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado na sua conta.' });
        }

        const cliente = clientRows[0];

        // 3. Realiza a transação para delegar
        // Criamos o registro em equipe_delegacoes
        const { rows: delRows } = await pool.query(
            `INSERT INTO equipe_delegacoes (cliente_id, lider_id, liderado_id, status_devolutiva, notas_lider)
             VALUES ($1, $2, $3, 'pendente', $4)
             RETURNING id`,
            [cliente_id, userId, liderado_id, notas_lider || '']
        );

        const delegacaoId = delRows[0].id;

        // Atualizamos o cliente no banco, alterando o consultora_id e associando o líder e ID da delegação
        await pool.query(
            `UPDATE clientes 
             SET consultora_id = $1, compartilhado_de_lider_id = $2, delegacao_id = $3
             WHERE id = $4`,
            [liderado_id, userId, delegacaoId, cliente_id]
        );

        // Atualizamos também as anamneses associadas a esse cliente para o consultora_id do liderado,
        // garantindo que ele tenha permissões plenas de leitura e escrita
        await pool.query(
            'UPDATE anamneses SET consultora_id = $1 WHERE cliente_id = $2 AND consultora_id = $3',
            [liderado_id, cliente_id, userId]
        );

        // 4. Envia notificação Web Push para o liderado
        sendPushNotification(liderado_id, {
            title: 'Lead Recebido do Líder! 🤝',
            body: `Seu líder lhe delegou o cliente ${cliente.nome} para atendimento e devolutiva.`,
            data: { url: '/equipe' }
        });

        res.status(201).json({ success: true, delegacao_id: delegacaoId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao delegar lead.' });
    }
});

/**
 * GET /api/equipe/delegacoes
 * Lista as delegações de leads
 */
router.get('/delegacoes', async (req, res) => {
    try {
        const userId = req.consultora.id;

        // Verifica se é líder
        const { rows: equipeRows } = await pool.query('SELECT id FROM equipes WHERE lider_id = $1', [userId]);

        if (equipeRows.length > 0) {
            // Se for líder, retorna delegações feitas por ele
            const { rows } = await pool.query(
                `SELECT ed.*, c.nome as cliente_nome, c.telefone as cliente_telefone, c.email as cliente_email,
                        l.nome as liderado_nome
                 FROM equipe_delegacoes ed
                 JOIN clientes c ON c.id = ed.cliente_id
                 JOIN consultoras l ON l.id = ed.liderado_id
                 WHERE ed.lider_id = $1
                 ORDER BY ed.criado_em DESC`,
                [userId]
            );
            return res.json(rows);
        }

        // Se for liderado, retorna delegações que recebeu
        const { rows } = await pool.query(
            `SELECT ed.*, c.nome as cliente_nome, c.telefone as cliente_telefone, c.email as cliente_email,
                    l.nome as lider_nome
             FROM equipe_delegacoes ed
             JOIN clientes c ON c.id = ed.cliente_id
             JOIN consultoras l ON l.id = ed.lider_id
             WHERE ed.liderado_id = $1
             ORDER BY ed.criado_em DESC`,
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar lista de delegações.' });
    }
});

/**
 * PUT /api/equipe/delegacoes/:id
 * Liderado atualiza o progresso da devolutiva de um lead compartilhado
 */
router.put('/delegacoes/:id', async (req, res) => {
    try {
        const userId = req.consultora.id;
        const { id } = req.params;
        const { status_devolutiva } = req.body;

        if (!status_devolutiva || !['pendente', 'em_andamento', 'concluido'].includes(status_devolutiva)) {
            return res.status(400).json({ error: 'Status de devolutiva inválido.' });
        }

        // Verifica se a delegação pertence a esse consultor logado
        const { rows: delRows } = await pool.query(
            `SELECT ed.*, c.nome as cliente_nome 
             FROM equipe_delegacoes ed
             JOIN clientes c ON c.id = ed.cliente_id
             WHERE ed.id = $1 AND (ed.liderado_id = $2 OR ed.lider_id = $2)`,
            [id, userId]
        );

        if (delRows.length === 0) {
            return res.status(404).json({ error: 'Delegação não encontrada.' });
        }

        const delegacao = delRows[0];

        // Atualiza status
        await pool.query(
            'UPDATE equipe_delegacoes SET status_devolutiva = $1, atualizado_em = NOW() WHERE id = $2',
            [status_devolutiva, id]
        );

        // Se concluído, avisa o líder por push
        if (status_devolutiva === 'concluido' && delegacao.liderado_id === userId) {
            sendPushNotification(delegacao.lider_id, {
                title: 'Devolutiva Realizada! 🎉',
                body: `${req.consultora.nome} concluiu o atendimento do lead ${delegacao.cliente_nome}.`,
                data: { url: '/equipe' }
            });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar delegação.' });
    }
});

/**
 * POST /api/equipe/avisos
 * Líder publica um comunicado ou reunião no mural
 */
router.post('/avisos', async (req, res) => {
    try {
        const userId = req.consultora.id;
        const { titulo, mensagem, data_reuniao, link_reuniao, disparar_push } = req.body;

        if (!titulo || !mensagem) {
            return res.status(400).json({ error: 'Título e mensagem são obrigatórios.' });
        }

        // Verifica se é líder
        const { rows: equipeRows } = await pool.query('SELECT id FROM equipes WHERE lider_id = $1', [userId]);
        if (equipeRows.length === 0) {
            return res.status(403).json({ error: 'Apenas líderes podem postar avisos.' });
        }

        const equipeId = equipeRows[0].id;

        const { rows: newAviso } = await pool.query(
            `INSERT INTO equipe_avisos (equipe_id, titulo, mensagem, data_reuniao, link_reuniao)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                equipeId,
                titulo.trim(),
                mensagem.trim(),
                data_reuniao ? new Date(data_reuniao) : null,
                link_reuniao || null
            ]
        );

        // Dispara push para toda a equipe se solicitado
        if (disparar_push) {
            const { rows: membros } = await pool.query(
                'SELECT id FROM consultoras WHERE equipe_id = $1 AND id != $2',
                [equipeId, userId]
            );

            for (const membro of membros) {
                sendPushNotification(membro.id, {
                    title: 'Comunicado Importante da Equipe! 📢',
                    body: titulo.trim(),
                    data: { url: '/dashboard' }
                });
            }
        }

        res.status(201).json(newAviso[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao registrar aviso.' });
    }
});

/**
 * GET /api/equipe/avisos
 * Retorna todos os avisos da equipe ativa do usuário (líder ou liderado)
 */
router.get('/avisos', async (req, res) => {
    try {
        const userId = req.consultora.id;

        // Busca o equipe_id da consultora logada
        const { rows: userRows } = await pool.query('SELECT equipe_id FROM consultoras WHERE id = $1', [userId]);
        if (userRows.length === 0 || !userRows[0].equipe_id) {
            return res.json([]);
        }

        const equipeId = userRows[0].equipe_id;

        // Busca todos os avisos da equipe
        const { rows: avisos } = await pool.query(
            `SELECT ea.*, 
                    EXISTS(SELECT 1 FROM equipe_aviso_confirmacoes WHERE aviso_id = ea.id AND consultora_id = $2) as confirmado
             FROM equipe_avisos ea
             WHERE ea.equipe_id = $1
             ORDER BY ea.criado_em DESC`,
            [equipeId, userId]
        );

        res.json(avisos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar avisos.' });
    }
});

/**
 * DELETE /api/equipe/avisos/:id
 * Líder exclui um comunicado do mural
 */
router.delete('/avisos/:id', async (req, res) => {
    try {
        const userId = req.consultora.id;
        const { id } = req.params;

        // Verifica se é líder
        const { rows: equipeRows } = await pool.query('SELECT id FROM equipes WHERE lider_id = $1', [userId]);
        if (equipeRows.length === 0) {
            return res.status(403).json({ error: 'Apenas líderes podem excluir avisos.' });
        }

        const equipeId = equipeRows[0].id;

        const { rowCount } = await pool.query(
            'DELETE FROM equipe_avisos WHERE id = $1 AND equipe_id = $2',
            [id, equipeId]
        );

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Aviso não encontrado.' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao excluir aviso.' });
    }
});

/**
 * POST /api/equipe/avisos/:id/confirmar
 * Liderado confirma presença na reunião agendada
 */
router.post('/avisos/:id/confirmar', async (req, res) => {
    try {
        const userId = req.consultora.id;
        const { id } = req.params;

        // Verifica se o aviso existe e se pertence à equipe do usuário
        const { rows: userRows } = await pool.query('SELECT equipe_id FROM consultoras WHERE id = $1', [userId]);
        if (userRows.length === 0 || !userRows[0].equipe_id) {
            return res.status(400).json({ error: 'Você não está vinculado a nenhuma equipe.' });
        }

        const equipeId = userRows[0].equipe_id;
        const { rows: avisoRows } = await pool.query(
            'SELECT id FROM equipe_avisos WHERE id = $1 AND equipe_id = $2',
            [id, equipeId]
        );

        if (avisoRows.length === 0) {
            return res.status(404).json({ error: 'Aviso de reunião não encontrado.' });
        }

        // Registra confirmação
        await pool.query(
            `INSERT INTO equipe_aviso_confirmacoes (aviso_id, consultora_id)
             VALUES ($1, $2)
             ON CONFLICT (aviso_id, consultora_id) DO NOTHING`,
            [id, userId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao confirmar presença.' });
    }
});

/**
 * GET /api/equipe/avisos/:id/confirmacoes
 * Líder visualiza quem confirmou presença na reunião
 */
router.get('/avisos/:id/confirmacoes', async (req, res) => {
    try {
        const userId = req.consultora.id;
        const { id } = req.params;

        // Verifica se é líder
        const { rows: equipeRows } = await pool.query('SELECT id FROM equipes WHERE lider_id = $1', [userId]);
        if (equipeRows.length === 0) {
            return res.status(403).json({ error: 'Apenas líderes podem ver confirmações.' });
        }

        const equipeId = equipeRows[0].id;
        const { rows: avisoRows } = await pool.query(
            'SELECT id FROM equipe_avisos WHERE id = $1 AND equipe_id = $2',
            [id, equipeId]
        );

        if (avisoRows.length === 0) {
            return res.status(404).json({ error: 'Aviso de reunião não encontrado.' });
        }

        const { rows: confirmados } = await pool.query(
            `SELECT c.nome, c.foto_url, c.email, c.telefone, eac.confirmado_em 
             FROM equipe_aviso_confirmacoes eac
             JOIN consultoras c ON c.id = eac.consultora_id
             WHERE eac.aviso_id = $1
             ORDER BY eac.confirmado_em DESC`,
            [id]
        );

        res.json(confirmados);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar confirmações de presença.' });
    }
});

/**
 * POST /api/equipe/biblioteca
 * Líder adiciona materiais ou scripts à biblioteca compartilhada
 */
router.post('/biblioteca', async (req, res) => {
    try {
        const userId = req.consultora.id;
        const { categoria, titulo, descricao, url_midia, conteudo_texto } = req.body;

        if (!categoria || !titulo) {
            return res.status(400).json({ error: 'Categoria e Título são campos obrigatórios.' });
        }

        // Valida se categoria é uma das permitidas
        if (!['video_treinamento', 'link_material', 'script_vendas', 'script_cadastro'].includes(categoria)) {
            return res.status(400).json({ error: 'Categoria inválida.' });
        }

        // Verifica se é líder
        const { rows: equipeRows } = await pool.query('SELECT id FROM equipes WHERE lider_id = $1', [userId]);
        if (equipeRows.length === 0) {
            return res.status(403).json({ error: 'Apenas líderes podem adicionar materiais.' });
        }

        const equipeId = equipeRows[0].id;

        const { rows: newMaterial } = await pool.query(
            `INSERT INTO equipe_biblioteca (equipe_id, categoria, titulo, descricao, url_midia, conteudo_texto)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                equipeId,
                categoria,
                titulo.trim(),
                descricao ? descricao.trim() : null,
                url_midia || null,
                conteudo_texto || null
            ]
        );

        res.status(201).json(newMaterial[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao cadastrar material.' });
    }
});

/**
 * GET /api/equipe/biblioteca
 * Retorna itens da biblioteca da equipe associada
 */
router.get('/biblioteca', async (req, res) => {
    try {
        const userId = req.consultora.id;

        // Busca o equipe_id do usuário logado
        const { rows: userRows } = await pool.query('SELECT equipe_id FROM consultoras WHERE id = $1', [userId]);
        if (userRows.length === 0 || !userRows[0].equipe_id) {
            return res.json([]);
        }

        const equipeId = userRows[0].equipe_id;

        const { rows: biblioteca } = await pool.query(
            'SELECT * FROM equipe_biblioteca WHERE equipe_id = $1 ORDER BY criado_em DESC',
            [equipeId]
        );

        res.json(biblioteca);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar biblioteca.' });
    }
});

/**
 * DELETE /api/equipe/biblioteca/:id
 * Líder exclui item da biblioteca
 */
router.delete('/biblioteca/:id', async (req, res) => {
    try {
        const userId = req.consultora.id;
        const { id } = req.params;

        // Verifica se é líder
        const { rows: equipeRows } = await pool.query('SELECT id FROM equipes WHERE lider_id = $1', [userId]);
        if (equipeRows.length === 0) {
            return res.status(403).json({ error: 'Apenas líderes podem remover materiais.' });
        }

        const equipeId = equipeRows[0].id;

        const { rowCount } = await pool.query(
            'DELETE FROM equipe_biblioteca WHERE id = $1 AND equipe_id = $2',
            [id, equipeId]
        );

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Material não encontrado.' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover material.' });
    }
});

module.exports = router;
