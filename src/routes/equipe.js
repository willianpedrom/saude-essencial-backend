const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const checkSub = require('../middleware/checkSubscription');
const { sendPushNotification } = require('../lib/push');

const router = express.Router();

// Public route for Service Worker click tracking
router.post('/push/track-click', async (req, res) => {
    const { teamPushId, consultoraId } = req.body;
    if (!teamPushId || !consultoraId) return res.status(400).json({ error: 'Missing data' });

    try {
        await pool.query(`
            INSERT INTO equipe_push_clicks (push_id, consultora_id)
            VALUES ($1, $2)
            ON CONFLICT (push_id, consultora_id) DO NOTHING
        `, [teamPushId, consultoraId]);

        // Update total clicks in history
        await pool.query(`
            UPDATE equipe_push_historico 
            SET cliques_qtd = (SELECT COUNT(*) FROM equipe_push_clicks WHERE push_id = $1)
            WHERE id = $1
        `, [teamPushId]);

        res.json({ ok: true });
    } catch (err) {
        console.error('[TrackTeamPushClick] Error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/equipe/invite-info/:code
router.get('/invite-info/:code', async (req, res) => {
    const { code } = req.params;
    if (!code) return res.status(400).json({ error: 'Código de convite obrigatório' });

    try {
        const { rows } = await pool.query(`
            SELECT e.nome_equipe, c.nome as lider_nome, c.foto_url as lider_foto_url
            FROM equipes e
            JOIN consultoras c ON e.lider_id = c.id
            WHERE e.codigo_convite = $1
        `, [code]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Equipe não encontrada para este código de convite.' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('[GetTeamInviteInfo] Error:', err.message);
        res.status(500).json({ error: 'Erro interno ao buscar convite.' });
    }
});

/**
 * GET /api/equipe/leaderboard
 * Retorna o pódio de pontuação de produtividade mensal dos membros da equipe (Bypasses checkSub for Paywall display)
 */
router.get('/leaderboard', auth, async (req, res) => {
    try {
        const userId = req.consultora.id;
        
        // 1. Busca a equipe da consultora logada
        const { rows: userRows } = await pool.query(
            'SELECT equipe_id FROM consultoras WHERE id = $1',
            [userId]
        );
        
        const equipeId = userRows[0]?.equipe_id;
        if (!equipeId) {
            return res.json({ leaderboard: [] });
        }
        
        // 2. Calcula pontos e estatísticas dos membros no mês corrente
        const { rows: leaderboard } = await pool.query(`
            SELECT 
                c.id, 
                c.nome, 
                c.foto_url, 
                c.rank_doterra,
                (c.id = e.lider_id) AS is_lider,
                (COALESCE(cl.qtd, 0) * 10 + COALESCE(an.qtd, 0) * 15 + COALESCE(vd.qtd, 0) * 20 + COALESCE(es.qtd, 0) * 5) AS pontos,
                COALESCE(cl.qtd, 0) AS clientes_qtd,
                COALESCE(an.qtd, 0) AS anamneses_qtd,
                COALESCE(vd.qtd, 0) AS vendas_qtd,
                COALESCE(es.qtd, 0) AS estoque_qtd
            FROM consultoras c
            JOIN equipes e ON e.id = c.equipe_id
            LEFT JOIN (
                SELECT consultora_id, COUNT(*) as qtd 
                FROM clientes 
                WHERE criado_em >= DATE_TRUNC('month', CURRENT_DATE)
                GROUP BY consultora_id
            ) cl ON cl.consultora_id = c.id
            LEFT JOIN (
                SELECT consultora_id, COUNT(*) as qtd 
                FROM anamneses 
                WHERE preenchido = TRUE AND criado_em >= DATE_TRUNC('month', CURRENT_DATE)
                GROUP BY consultora_id
            ) an ON an.consultora_id = c.id
            LEFT JOIN (
                SELECT consultora_id, COUNT(*) as qtd 
                FROM vendas 
                WHERE criado_em >= DATE_TRUNC('month', CURRENT_DATE)
                GROUP BY consultora_id
            ) vd ON vd.consultora_id = c.id
            LEFT JOIN (
                SELECT consultora_id, COUNT(*) as qtd 
                FROM estoque 
                WHERE criado_em >= DATE_TRUNC('month', CURRENT_DATE)
                GROUP BY consultora_id
            ) es ON es.consultora_id = c.id
            WHERE c.equipe_id = $1
            ORDER BY pontos DESC, c.nome ASC
        `, [equipeId]);
        
        res.json({ leaderboard });
    } catch (err) {
        console.error('[GetTeamLeaderboard] Error:', err.message);
        res.status(500).json({ error: 'Erro ao buscar o leaderboard da equipe.' });
    }
});

/**
 * GET /api/equipe/conquistas
 * Retorna as medalhas acumuladas/desbloqueadas da consultora autenticada (Bypasses checkSub for Paywall display)
 */
router.get('/conquistas', auth, async (req, res) => {
    try {
        const userId = req.consultora.id;
        
        // Coleta estatísticas gerais acumuladas do usuário
        const { rows: stats } = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM vendas WHERE consultora_id = $1) AS vendas_total,
                (SELECT COUNT(*) FROM anamneses WHERE consultora_id = $1 AND preenchido = TRUE) AS anamneses_total,
                (SELECT COUNT(*) FROM estoque WHERE consultora_id = $1) AS estoque_total,
                (SELECT COUNT(*) FROM clientes WHERE consultora_id = $1) AS clientes_total,
                (SELECT COUNT(*) FROM equipe_aviso_confirmacoes WHERE consultora_id = $1) AS rsvp_total
        `, [userId]);
        
        const row = stats[0] || { vendas_total: 0, anamneses_total: 0, estoque_total: 0, clientes_total: 0, rsvp_total: 0 };
        const v = parseInt(row.vendas_total || 0, 10);
        const a = parseInt(row.anamneses_total || 0, 10);
        const e = parseInt(row.estoque_total || 0, 10);
        const c = parseInt(row.clientes_total || 0, 10);
        const r = parseInt(row.rsvp_total || 0, 10);
        
        const conquistas = [
            {
                id: 'primeira_venda',
                titulo: '💰 Primeira Venda',
                descricao: 'Registre sua primeira venda no sistema para começar a lucrar.',
                atual: v,
                meta: 1,
                desbloqueada: v >= 1
            },
            {
                id: 'mestre_anamnese',
                titulo: '📝 Mestre da Anamnese',
                descricao: 'Realize pelo menos 10 atendimentos com fichas de anamnese completadas.',
                atual: a,
                meta: 10,
                desbloqueada: a >= 10
            },
            {
                id: 'organizador_estoque',
                titulo: '📦 Organizador de Estoque',
                descricao: 'Cadastre 10 ou mais itens em seu estoque pessoal para controle ágil.',
                atual: e,
                meta: 10,
                desbloqueada: e >= 10
            },
            {
                id: 'expandindo_rede',
                titulo: '👥 Expandindo a Rede',
                descricao: 'Adicione pelo menos 5 contatos ou clientes no seu CRM.',
                atual: c,
                meta: 5,
                desbloqueada: c >= 5
            },
            {
                id: 'consultor_focado',
                titulo: '🎯 Consultor Focado',
                descricao: 'Confirme presença RSVP em pelo menos 2 reuniões no mural da equipe.',
                atual: r,
                meta: 2,
                desbloqueada: r >= 2
            }
        ];
        
        res.json({ conquistas });
    } catch (err) {
        console.error('[GetConquistas] Error:', err.message);
        res.status(500).json({ error: 'Erro ao buscar conquistas.' });
    }
});

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

        // Auto-seed de 3 roteiros/scripts padrão na biblioteca do time
        const defaultScripts = [
            {
                categoria: 'script_vendas',
                titulo: 'Abordagem Vendas: Lavanda para Sono/Ansiedade 😴',
                descricao: 'Script modelo para abordar clientes que reclamaram de insônia ou ansiedade na anamnese.',
                conteudo_texto: 'Olá {{nome_cliente}}, tudo bem? Aqui é a {{nome_consultor}} do Gota App. Vi que você respondeu à nossa avaliação de saúde e mencionou dificuldades para dormir ou ansiedade.\n\nSabia que o óleo essencial de Lavanda pura doTERRA possui propriedades calmantes cientificamente comprovadas que ajudam a relaxar e induzir ao sono profundo, sem efeitos colaterais?\n\nVamos agendar um papo rápido de 5 minutos amanhã para eu te ensinar como usar esse óleo de forma segura para melhorar sua noite de sono?'
            },
            {
                categoria: 'script_cadastro',
                titulo: 'Abordagem Recrutamento: Oportunidade doTERRA 💼',
                descricao: 'Script modelo para convidar potenciais parceiros a assistirem uma apresentação de negócios.',
                conteudo_texto: 'Olá {{nome_cliente}}, como vai? Aqui é a {{nome_consultor}}.\n\nTrabalho com a doTERRA expandindo o mercado de bem-estar natural no Brasil com um modelo profissional de alta retenção e ganhos recorrentes.\n\nVi seu perfil e achei sua energia excelente para essa área de liderança. Toparia assistir a uma chamada rápida no Zoom de 15 minutos nesta semana para eu te mostrar como funciona o nosso modelo de trabalho?'
            },
            {
                categoria: 'script_vendas',
                titulo: 'Lembrete de Classe / Evento de Óleos Essenciais 📅',
                descricao: 'Script para lembrar convidados no dia da sua classe online de óleos.',
                conteudo_texto: 'Olá {{nome_cliente}}! Passando para te lembrar que hoje às 20h acontecerá nosso Workshop online gratuito: Introdução às Soluções Naturais.\n\nNesta classe rápida, vou ensinar os 12 óleos básicos que servem como farmácia natural para qualquer família.\n\nSepare papel e caneta! Nos vemos às 20h neste link: [Inserir Link do Zoom]'
            }
        ];

        for (const s of defaultScripts) {
            await pool.query(
                `INSERT INTO equipe_biblioteca (equipe_id, categoria, titulo, descricao, conteudo_texto)
                 VALUES ($1, $2, $3, $4, $5)`,
                [newEquipe[0].id, s.categoria, s.titulo, s.descricao, s.conteudo_texto]
            );
        }

        res.status(201).json(newEquipe[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar equipe.' });
    }
});

/**
 * PUT /api/equipe/nome
 * Atualiza o nome da equipe do líder logado
 */
router.put('/nome', async (req, res) => {
    try {
        const userId = req.consultora.id;
        const { nome_equipe } = req.body;

        if (!nome_equipe || nome_equipe.trim() === '') {
            return res.status(400).json({ error: 'O nome da equipe é obrigatório.' });
        }

        // 1. Verifica se quem logou é líder de alguma equipe
        const { rows: equipeRows } = await pool.query(
            'SELECT id FROM equipes WHERE lider_id = $1',
            [userId]
        );

        if (equipeRows.length === 0) {
            return res.status(403).json({ error: 'Apenas líderes podem editar o nome da equipe.' });
        }

        const equipeId = equipeRows[0].id;

        // 2. Atualiza o nome da equipe
        const { rows: updated } = await pool.query(
            `UPDATE equipes 
             SET nome_equipe = $1
             WHERE id = $2
             RETURNING *`,
            [nome_equipe.trim(), equipeId]
        );

        res.json({ success: true, equipe: updated[0] });
    } catch (err) {
        console.error('[UpdateTeamName] Error:', err.message);
        res.status(500).json({ error: 'Erro ao atualizar o nome da equipe.' });
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

        // 2.5. Verifica as permissões e limite de membros do plano do líder da equipe
        const { rows: liderSubRows } = await pool.query(
            `SELECT c.role, p.tem_equipe, p.limite_membros_equipe
             FROM consultoras c
             LEFT JOIN assinaturas a ON a.consultora_id = c.id
             LEFT JOIN planos p ON p.slug = a.plano AND p.ativo = TRUE
             WHERE c.id = $1
             ORDER BY a.criado_em DESC LIMIT 1`,
            [equipe.lider_id]
        );

        if (liderSubRows.length > 0) {
            const liderSub = liderSubRows[0];
            // Se o líder não for admin, validamos o plano dele
            if (liderSub.role !== 'admin') {
                if (!liderSub.tem_equipe) {
                    return res.status(403).json({ error: 'A equipe associada a este código de convite não possui o recurso de equipe ativo em seu plano atual.' });
                }

                if (liderSub.limite_membros_equipe !== null) {
                    // Conta quantos liderados ativos estão nesta equipe (excluindo o líder)
                    const { rows: countRows } = await pool.query(
                        'SELECT COUNT(*) as total FROM consultoras WHERE equipe_id = $1 AND id != $2',
                        [equipe.id, equipe.lider_id]
                    );
                    const totalMembros = parseInt(countRows[0].total || 0);
                    if (totalMembros >= liderSub.limite_membros_equipe) {
                        return res.status(400).json({ 
                            error: `O limite de membros configurado para esta equipe (${liderSub.limite_membros_equipe} pessoas) foi atingido. O líder da equipe precisa fazer um upgrade do plano.` 
                        });
                    }
                }
            }
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
            `SELECT c.id, c.nome, c.email, c.telefone, c.foto_url, c.rank_doterra, c.criado_em,
                    a.plano, a.status, a.trial_fim
             FROM consultoras c
             LEFT JOIN LATERAL (
                 SELECT plano, status, trial_fim
                 FROM assinaturas
                 WHERE consultora_id = c.id
                 ORDER BY criado_em DESC
                 LIMIT 1
             ) a ON TRUE
             WHERE c.equipe_id = $1 AND c.id != $2
             ORDER BY c.nome ASC`,
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

/**
 * POST /api/equipe/push-direto
 * Líder envia uma mensagem de Web Push imediata para toda a equipe e registra no histórico
 */
router.post('/push-direto', async (req, res) => {
    try {
        const userId = req.consultora.id;
        const { mensagem } = req.body;

        if (!mensagem || mensagem.trim() === '') {
            return res.status(400).json({ error: 'A mensagem do push é obrigatória.' });
        }

        // Verifica se o usuário é líder de alguma equipe
        const { rows: equipeRows } = await pool.query(
            'SELECT id, nome_equipe FROM equipes WHERE lider_id = $1',
            [userId]
        );

        if (equipeRows.length === 0) {
            return res.status(403).json({ error: 'Apenas líderes de equipe podem enviar notificações push.' });
        }

        const equipe = equipeRows[0];

        // Busca todos os liderados vinculados
        const { rows: membros } = await pool.query(
            'SELECT id FROM consultoras WHERE equipe_id = $1 AND id != $2',
            [equipe.id, userId]
        );

        // Cria o registro no histórico de push
        const { rows: pushRows } = await pool.query(
            `INSERT INTO equipe_push_historico (equipe_id, mensagem, total_enviados)
             VALUES ($1, $2, $3) RETURNING id`,
            [equipe.id, mensagem.trim(), membros.length]
        );
        const pushId = pushRows[0].id;

        let count = 0;
        for (const membro of membros) {
            try {
                await sendPushNotification(membro.id, {
                    title: `Mensagem da Liderança (${equipe.nome_equipe}) 🤝`,
                    body: mensagem.trim(),
                    data: { 
                        url: '/equipe',
                        teamPushId: pushId,
                        consultoraId: membro.id
                    }
                });
                count++;
            } catch (err) {
                console.error(`Erro ao enviar push para membro ${membro.id}:`, err);
            }
        }

        // Se por algum motivo o número enviado de fato foi diferente, atualiza
        if (count !== membros.length) {
            await pool.query(
                'UPDATE equipe_push_historico SET total_enviados = $1 WHERE id = $2',
                [count, pushId]
            );
        }

        res.json({ success: true, membros_notificados: count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao enviar push para a equipe.' });
    }
});

/**
 * GET /api/equipe/push-historico
 * Retorna o histórico de mensagens push enviadas pelo líder logado com contagem de leituras
 */
router.get('/push-historico', async (req, res) => {
    try {
        const userId = req.consultora.id;

        // Verifica se é líder e pega a equipe
        const { rows: equipeRows } = await pool.query(
            'SELECT id FROM equipes WHERE lider_id = $1',
            [userId]
        );

        if (equipeRows.length === 0) {
            return res.status(403).json({ error: 'Apenas líderes de equipe possuem histórico de push.' });
        }

        const equipeId = equipeRows[0].id;

        const { rows: historico } = await pool.query(
            `SELECT * FROM equipe_push_historico 
             WHERE equipe_id = $1 
             ORDER BY criado_em DESC 
             LIMIT 15`,
            [equipeId]
        );

        res.json(historico);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar histórico de push.' });
    }
});

// Leaderboard e Conquistas rotas foram movidas para o início do arquivo (antes do checkSub) para exibição no Paywall

/**
 * GET /api/equipe/desafios
 * Retorna a lista de desafios ativos com o respectivo progresso individual/coletivo
 */
router.get('/desafios', async (req, res) => {
    try {
        const userId = req.consultora.id;
        
        const { rows: userRows } = await pool.query(
            'SELECT equipe_id FROM consultoras WHERE id = $1',
            [userId]
        );
        const equipeId = userRows[0]?.equipe_id;
        if (!equipeId) {
            return res.json({ desafios: [] });
        }
        
        const { rows: desafios } = await pool.query(
            'SELECT * FROM equipe_desafios WHERE equipe_id = $1 ORDER BY data_fim ASC, criado_em DESC',
            [equipeId]
        );
        
        const { rows: memberRows } = await pool.query(
            'SELECT id FROM consultoras WHERE equipe_id = $1',
            [equipeId]
        );
        const teamMemberIds = memberRows.map(r => r.id);
        
        const desafiosWithProgress = [];
        for (const d of desafios) {
            const targetIds = d.tipo_desafio === 'coletivo' ? teamMemberIds : [userId];
            let progress = 0;
            
            if (d.objetivo_tipo === 'vendas_valor') {
                const { rows: pRes } = await pool.query(
                    'SELECT COALESCE(SUM(valor), 0) as total FROM vendas WHERE consultora_id = ANY($1) AND data BETWEEN $2 AND $3',
                    [targetIds, d.data_inicio, d.data_fim]
                );
                progress = parseFloat(pRes[0].total || 0);
            } else if (d.objetivo_tipo === 'anamneses_qtd') {
                const { rows: pRes } = await pool.query(
                    'SELECT COUNT(*) as total FROM anamneses WHERE consultora_id = ANY($1) AND preenchido = TRUE AND criado_em::date BETWEEN $2 AND $3',
                    [targetIds, d.data_inicio, d.data_fim]
                );
                progress = parseInt(pRes[0].total || 0, 10);
            } else if (d.objetivo_tipo === 'clientes_qtd') {
                const { rows: pRes } = await pool.query(
                    'SELECT COUNT(*) as total FROM clientes WHERE consultora_id = ANY($1) AND criado_em::date BETWEEN $2 AND $3',
                    [targetIds, d.data_inicio, d.data_fim]
                );
                progress = parseInt(pRes[0].total || 0, 10);
            }
            
            desafiosWithProgress.push({
                ...d,
                progresso: progress,
                concluido: progress >= parseFloat(d.meta)
            });
        }
        
        res.json({ desafios: desafiosWithProgress });
    } catch (err) {
        console.error('[GetDesafios] Error:', err.message);
        res.status(500).json({ error: 'Erro ao listar desafios.' });
    }
});

/**
 * POST /api/equipe/desafios
 * Cria um novo desafio (líder apenas)
 */
router.post('/desafios', async (req, res) => {
    try {
        const userId = req.consultora.id;
        const { titulo, descricao, tipo_desafio, objetivo_tipo, meta, data_inicio, data_fim } = req.body;
        
        // Verifica se é líder e pega a equipe
        const { rows: equipeRows } = await pool.query(
            'SELECT id FROM equipes WHERE lider_id = $1',
            [userId]
        );
        
        if (equipeRows.length === 0) {
            return res.status(403).json({ error: 'Apenas líderes podem criar desafios de equipe.' });
        }
        
        const equipeId = equipeRows[0].id;
        
        // Validações básicas
        if (!titulo || titulo.trim() === '') return res.status(400).json({ error: 'Título é obrigatório.' });
        if (!tipo_desafio || !['individual', 'coletivo'].includes(tipo_desafio)) return res.status(400).json({ error: 'Tipo de desafio inválido.' });
        if (!objetivo_tipo || !['vendas_valor', 'anamneses_qtd', 'clientes_qtd'].includes(objetivo_tipo)) return res.status(400).json({ error: 'Métrica de objetivo inválida.' });
        if (!meta || parseFloat(meta) <= 0) return res.status(400).json({ error: 'Meta deve ser maior que 0.' });
        if (!data_inicio || !data_fim) return res.status(400).json({ error: 'Período (datas) é obrigatório.' });
        
        const { rows: newChallenge } = await pool.query(`
            INSERT INTO equipe_desafios (equipe_id, titulo, descricao, tipo_desafio, objetivo_tipo, meta, data_inicio, data_fim)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [equipeId, titulo.trim(), descricao || '', tipo_desafio, objetivo_tipo, parseFloat(meta), data_inicio, data_fim]);
        
        res.status(201).json(newChallenge[0]);
    } catch (err) {
        console.error('[CreateDesafio] Error:', err.message);
        res.status(500).json({ error: 'Erro ao criar desafio.' });
    }
});

/**
 * DELETE /api/equipe/desafios/:id
 * Remove um desafio existente (líder apenas)
 */
router.delete('/desafios/:id', async (req, res) => {
    try {
        const userId = req.consultora.id;
        const challengeId = req.params.id;
        
        // Verifica se é líder e pega a equipe
        const { rows: equipeRows } = await pool.query(
            'SELECT id FROM equipes WHERE lider_id = $1',
            [userId]
        );
        
        if (equipeRows.length === 0) {
            return res.status(403).json({ error: 'Apenas líderes de equipe podem remover desafios.' });
        }
        
        const equipeId = equipeRows[0].id;
        
        const { rowCount } = await pool.query(
            'DELETE FROM equipe_desafios WHERE id = $1 AND equipe_id = $2',
            [challengeId, equipeId]
        );
        
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Desafio não encontrado ou não pertence a sua equipe.' });
        }
        
        res.json({ ok: true });
    } catch (err) {
        console.error('[DeleteDesafio] Error:', err.message);
        res.status(500).json({ error: 'Erro ao remover desafio.' });
    }
});

module.exports = router;
