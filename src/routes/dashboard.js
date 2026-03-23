const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const checkSub = require('../middleware/checkSubscription');

const router = express.Router();

// All routes require auth + active subscription
router.use(auth, checkSub);

// GET /api/dashboard/aniversariantes
router.get('/aniversariantes', async (req, res) => {
  try {
    // Busca clientes que fazem aniversário hoje ou em exatamente 7 dias
    // Ignora o ano de nascimento para comparar apenas dia e mês
    const { rows } = await pool.query(
      `SELECT id, nome, telefone, data_nascimento, ativo,
             (EXTRACT(DAY FROM data_nascimento) = EXTRACT(DAY FROM NOW() AT TIME ZONE 'America/Sao_Paulo')
              AND EXTRACT(MONTH FROM data_nascimento) = EXTRACT(MONTH FROM NOW() AT TIME ZONE 'America/Sao_Paulo')) as is_today
             FROM clientes
             WHERE consultora_id = $1
               AND ativo = TRUE
               AND data_nascimento IS NOT NULL
               AND (
                 -- Calcula a "data de aniversário este ano" e verifica se está entre hoje e hoje+7
                 make_date(
                   EXTRACT(YEAR FROM NOW())::int,
                   EXTRACT(MONTH FROM data_nascimento)::int,
                   EXTRACT(DAY FROM data_nascimento)::int
                 ) BETWEEN (NOW() AT TIME ZONE 'America/Sao_Paulo')::date
                        AND ((NOW() AT TIME ZONE 'America/Sao_Paulo') + INTERVAL '7 days')::date
               )
             ORDER BY is_today DESC,
                      make_date(
                        EXTRACT(YEAR FROM NOW())::int,
                        EXTRACT(MONTH FROM data_nascimento)::int,
                        EXTRACT(DAY FROM data_nascimento)::int
                      ) ASC`,
      [req.consultora.id]
    );


    // Gera os links do WhatsApp
    const aniversariantes = rows.map(cliente => {
      let whatsappLink = null;
      if (cliente.telefone) {
        // Remove todos os caracteres não numéricos
        let numeroLimpo = cliente.telefone.replace(/\D/g, '');

        // Se o número tiver 10 ou 11 dígitos, provavelmente é do BR sem o 55. Adiciona o 55.
        if (numeroLimpo.length === 10 || numeroLimpo.length === 11) {
          numeroLimpo = '55' + numeroLimpo;
        }

        if (numeroLimpo.length >= 12) { // Garante que tem um tamanho mínimo com DDI (ex: 5511999999999)
          const mensagem = cliente.is_today
            ? `Olá ${cliente.nome}! 🎉 Parabéns pelo seu dia! Que seu novo ciclo seja repleto de realizações, saúde e muita alegria. Um grande abraço! 🎂🥳`
            : `Olá ${cliente.nome}! Passando para lembrar que seu aniversário está chegando! Já estamos preparando muitas energias positivas para você! 🎉`;
          // Usando api.whatsapp.com em vez de wa.me para maior compatibilidade com Mac/Desktop
          whatsappLink = `https://api.whatsapp.com/send?phone=${numeroLimpo}&text=${encodeURIComponent(mensagem)}`;
        }
      }

      return {
        ...cliente,
        whatsapp_link: whatsappLink
      };
    });

    res.json(aniversariantes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar aniversariantes.' });
  }
});

// GET /api/dashboard/summary — aggregated metrics without loading all clients
router.get('/summary', async (req, res) => {
  try {
    const consultora_id = req.consultora.id;
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { rows } = await pool.query(`
      SELECT
        COUNT(*)                                                                   AS total_clientes,
        COUNT(*) FILTER (WHERE status = 'active')                                 AS ativos,
        COUNT(*) FILTER (WHERE status = 'inactive')                               AS inativos,
        COUNT(*) FILTER (WHERE status = 'lead' OR tipo_cadastro = 'lead')          AS leads,

        COUNT(*) FILTER (WHERE criado_em >= $2)                                   AS mes_novos,

        COUNT(*) FILTER (WHERE pipeline_stage = 'lead_captado')                   AS stage_lead_captado,
        COUNT(*) FILTER (WHERE pipeline_stage = 'primeiro_contato')               AS stage_primeiro_contato,
        COUNT(*) FILTER (WHERE pipeline_stage = 'interesse_confirmado')           AS stage_interesse_confirmado,
        COUNT(*) FILTER (WHERE pipeline_stage = 'protocolo_apresentado')          AS stage_protocolo_apresentado,
        COUNT(*) FILTER (WHERE pipeline_stage = 'proposta_enviada')               AS stage_proposta_enviada,
        COUNT(*) FILTER (WHERE pipeline_stage = 'negociando')                     AS stage_negociando,
        COUNT(*) FILTER (WHERE pipeline_stage = 'primeira_compra')                AS stage_primeira_compra,

        COUNT(*) FILTER (WHERE recrutamento_stage = 'prospecto_negocio')          AS rec_prospecto,
        COUNT(*) FILTER (WHERE recrutamento_stage = 'convite_apresentacao')       AS rec_convite,
        COUNT(*) FILTER (WHERE recrutamento_stage = 'apresentacao_assistida')     AS rec_assistiu,
        COUNT(*) FILTER (WHERE recrutamento_stage = 'acompanhamento_cadastro')    AS rec_acompanhamento,
        COUNT(*) FILTER (WHERE recrutamento_stage = 'cadastrada')                 AS rec_cadastrada,

        COUNT(*) FILTER (WHERE criado_em >= $2)                                   AS leads_mes,
        COUNT(*) FILTER (WHERE pipeline_stage = 'primeira_compra' AND atualizado_em >= $2)  AS vendas_mes,
        COUNT(*) FILTER (WHERE recrutamento_stage = 'cadastrada' AND atualizado_em >= $2)   AS cadastros_mes,
        (SELECT COUNT(*) FROM prospects WHERE consultora_id = $1)                  AS total_prospects

      FROM clientes
      WHERE consultora_id = $1
        AND ativo = TRUE
    `, [consultora_id, firstOfMonth]);

    const r = rows[0];

    res.json({
      totalClients: parseInt(r.total_clientes) || 0,
      activeClients: parseInt(r.ativos) || 0,
      inactiveClients: parseInt(r.inativos) || 0,
      leadClients: parseInt(r.leads) || 0,
      monthClients: parseInt(r.mes_novos) || 0,
      hasClient: (parseInt(r.total_clientes) || 0) > 0,

      stageCounts: {
        lead_captado: parseInt(r.stage_lead_captado) || 0,
        primeiro_contato: parseInt(r.stage_primeiro_contato) || 0,
        interesse_confirmado: parseInt(r.stage_interesse_confirmado) || 0,
        protocolo_apresentado: parseInt(r.stage_protocolo_apresentado) || 0,
        proposta_enviada: parseInt(r.stage_proposta_enviada) || 0,
        negociando: parseInt(r.stage_negociando) || 0,
        primeira_compra: parseInt(r.stage_primeira_compra) || 0,
      },

      recStageCounts: {
        prospecto_negocio: parseInt(r.rec_prospecto) || 0,
        convite_apresentacao: parseInt(r.rec_convite) || 0,
        apresentacao_assistida: parseInt(r.rec_assistiu) || 0,
        acompanhamento_cadastro: parseInt(r.rec_acompanhamento) || 0,
        cadastrada: parseInt(r.rec_cadastrada) || 0,
      },

      metas: {
        leadsMes: parseInt(r.leads_mes) || 0,
        vendasMes: parseInt(r.vendas_mes) || 0,
        cadastrosMes: parseInt(r.cadastros_mes) || 0,
      },
      totalProspects: parseInt(r.total_prospects) || 0
    });
  } catch (err) {
    console.error('[dashboard/summary]', err);
    res.status(500).json({ error: 'Erro ao calcular resumo do dashboard.' });
  }
});

// GET /api/dashboard/boot — single endpoint that returns ALL dashboard data
// Replaces 7 parallel HTTP calls with 1 call + 7 parallel DB queries
router.get('/boot', async (req, res) => {
  const cid = req.consultora.id;
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  try {
    const [summaryR, anamnesesR, agendamentosR, aniversariantesR, avisosBannerR, avisosModaisR, followupsR] =
      await Promise.allSettled([
        // 1. Summary
        pool.query(`
          SELECT
            COUNT(*)                                                                   AS total_clientes,
            COUNT(*) FILTER (WHERE status = 'active')                                 AS ativos,
            COUNT(*) FILTER (WHERE status = 'inactive')                               AS inativos,
            COUNT(*) FILTER (WHERE status = 'lead' OR tipo_cadastro = 'lead')          AS leads,
            COUNT(*) FILTER (WHERE criado_em >= $2)                                   AS mes_novos,
            COUNT(*) FILTER (WHERE pipeline_stage = 'lead_captado')                   AS stage_lead_captado,
            COUNT(*) FILTER (WHERE pipeline_stage = 'primeiro_contato')               AS stage_primeiro_contato,
            COUNT(*) FILTER (WHERE pipeline_stage = 'interesse_confirmado')           AS stage_interesse_confirmado,
            COUNT(*) FILTER (WHERE pipeline_stage = 'protocolo_apresentado')          AS stage_protocolo_apresentado,
            COUNT(*) FILTER (WHERE pipeline_stage = 'proposta_enviada')               AS stage_proposta_enviada,
            COUNT(*) FILTER (WHERE pipeline_stage = 'negociando')                     AS stage_negociando,
            COUNT(*) FILTER (WHERE pipeline_stage = 'primeira_compra')                AS stage_primeira_compra,
            COUNT(*) FILTER (WHERE recrutamento_stage = 'prospecto_negocio')          AS rec_prospecto,
            COUNT(*) FILTER (WHERE recrutamento_stage = 'convite_apresentacao')       AS rec_convite,
            COUNT(*) FILTER (WHERE recrutamento_stage = 'apresentacao_assistida')     AS rec_assistiu,
            COUNT(*) FILTER (WHERE recrutamento_stage = 'acompanhamento_cadastro')    AS rec_acompanhamento,
            COUNT(*) FILTER (WHERE recrutamento_stage = 'cadastrada')                 AS rec_cadastrada,
            COUNT(*) FILTER (WHERE criado_em >= $2)                                   AS leads_mes,
            COUNT(*) FILTER (WHERE pipeline_stage = 'primeira_compra' AND atualizado_em >= $2) AS vendas_mes,
            COUNT(*) FILTER (WHERE recrutamento_stage = 'cadastrada' AND atualizado_em >= $2)  AS cadastros_mes,
            (SELECT COUNT(*) FROM prospects WHERE consultora_id = $1)                  AS total_prospects
          FROM clientes WHERE consultora_id = $1 AND ativo = TRUE
        `, [cid, firstOfMonth]),

        // 2. Anamneses (templates only)
        pool.query(`
          SELECT a.id, a.tipo, a.subtipo, a.nome_link, a.preenchido, a.token_publico, a.criado_em,
                 a.acessos AS visitas, a.cliente_id, cl.nome AS cliente_nome,
                 COALESCE(gen.preenchimentos, 0) AS preenchimentos
          FROM anamneses a
          LEFT JOIN clientes cl ON cl.id = a.cliente_id
          LEFT JOIN (SELECT link_origem_id, COUNT(*) AS preenchimentos FROM anamneses WHERE link_origem_id IS NOT NULL GROUP BY link_origem_id) gen ON gen.link_origem_id = a.id
          WHERE a.consultora_id = $1 AND a.link_origem_id IS NULL
            AND ((a.subtipo = 'pessoal' AND a.preenchido = FALSE) OR (a.subtipo = 'generico'))
          ORDER BY a.criado_em DESC
        `, [cid]),

        // 3. Agendamentos
        pool.query(`SELECT * FROM agendamentos WHERE consultora_id = $1 ORDER BY data_hora ASC`, [cid]),

        // 4. Aniversariantes (7 dias)
        pool.query(`
          SELECT id, nome, telefone, data_nascimento, ativo,
            (EXTRACT(DAY FROM data_nascimento) = EXTRACT(DAY FROM NOW() AT TIME ZONE 'America/Sao_Paulo')
             AND EXTRACT(MONTH FROM data_nascimento) = EXTRACT(MONTH FROM NOW() AT TIME ZONE 'America/Sao_Paulo')) as is_today
          FROM clientes
          WHERE consultora_id = $1 AND ativo = TRUE AND data_nascimento IS NOT NULL
            AND make_date(EXTRACT(YEAR FROM NOW())::int, EXTRACT(MONTH FROM data_nascimento)::int, EXTRACT(DAY FROM data_nascimento)::int)
                BETWEEN (NOW() AT TIME ZONE 'America/Sao_Paulo')::date AND ((NOW() AT TIME ZONE 'America/Sao_Paulo') + INTERVAL '7 days')::date
          ORDER BY is_today DESC, make_date(EXTRACT(YEAR FROM NOW())::int, EXTRACT(MONTH FROM data_nascimento)::int, EXTRACT(DAY FROM data_nascimento)::int) ASC
        `, [cid]),

        // 5. Avisos banner
        pool.query(`SELECT id, titulo, mensagem, tipo, exibicao, criado_em FROM avisos_sistema WHERE ativo = TRUE AND (exibicao = 'banner' OR exibicao = 'ambos') ORDER BY criado_em DESC`),

        // 6. Avisos modais (não lidos)
        pool.query(`
          SELECT a.id, a.titulo, a.mensagem, a.tipo, a.exibicao, a.criado_em
          FROM avisos_sistema a
          LEFT JOIN avisos_lidos l ON a.id = l.aviso_id AND l.consultora_id = $1
          WHERE a.ativo = TRUE AND (a.exibicao = 'modal' OR a.exibicao = 'ambos') AND l.id IS NULL
          ORDER BY a.criado_em DESC
        `, [cid]),

        // 7. Follow-ups
        pool.query(`
          SELECT f.id, f.nota, f.due_date_time, f.status, f.criado_em, f.atualizado_em,
                 f.cliente_id, c.nome AS cliente_nome, c.telefone AS cliente_telefone, c.email AS cliente_email
          FROM followups f LEFT JOIN clientes c ON c.id = f.cliente_id
          WHERE f.consultora_id = $1
          ORDER BY CASE f.status WHEN 'pending' THEN 0 ELSE 1 END, f.due_date_time ASC NULLS LAST
        `, [cid]),
      ]);

    // Parse summary into structured format
    const r = summaryR.status === 'fulfilled' ? summaryR.value.rows[0] : {};
    const summary = {
      totalClients: parseInt(r.total_clientes) || 0,
      activeClients: parseInt(r.ativos) || 0,
      inactiveClients: parseInt(r.inativos) || 0,
      leadClients: parseInt(r.leads) || 0,
      monthClients: parseInt(r.mes_novos) || 0,
      hasClient: (parseInt(r.total_clientes) || 0) > 0,
      stageCounts: {
        lead_captado: parseInt(r.stage_lead_captado) || 0,
        primeiro_contato: parseInt(r.stage_primeiro_contato) || 0,
        interesse_confirmado: parseInt(r.stage_interesse_confirmado) || 0,
        protocolo_apresentado: parseInt(r.stage_protocolo_apresentado) || 0,
        proposta_enviada: parseInt(r.stage_proposta_enviada) || 0,
        negociando: parseInt(r.stage_negociando) || 0,
        primeira_compra: parseInt(r.stage_primeira_compra) || 0,
      },
      recStageCounts: {
        prospecto_negocio: parseInt(r.rec_prospecto) || 0,
        convite_apresentacao: parseInt(r.rec_convite) || 0,
        apresentacao_assistida: parseInt(r.rec_assistiu) || 0,
        acompanhamento_cadastro: parseInt(r.rec_acompanhamento) || 0,
        cadastrada: parseInt(r.rec_cadastrada) || 0,
      },
      metas: {
        leadsMes: parseInt(r.leads_mes) || 0,
        vendasMes: parseInt(r.vendas_mes) || 0,
        cadastrosMes: parseInt(r.cadastros_mes) || 0,
      },
      totalProspects: parseInt(r.total_prospects) || 0
    };

    // Build aniversariantes with WhatsApp links
    const anivRows = aniversariantesR.status === 'fulfilled' ? aniversariantesR.value.rows : [];
    const aniversariantes = anivRows.map(cliente => {
      let whatsapp_link = null;
      if (cliente.telefone) {
        let num = cliente.telefone.replace(/\D/g, '');
        if (num.length === 10 || num.length === 11) num = '55' + num;
        if (num.length >= 12) {
          const msg = cliente.is_today
            ? `Olá ${cliente.nome}! 🎉 Parabéns pelo seu dia! Que seu novo ciclo seja repleto de realizações, saúde e muita alegria. Um grande abraço! 🎂🥳`
            : `Olá ${cliente.nome}! Passando para lembrar que seu aniversário está chegando! Já estamos preparando muitas energias positivas para você! 🎉`;
          whatsapp_link = `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(msg)}`;
        }
      }
      return { ...cliente, whatsapp_link };
    });

    res.json({
      summary,
      anamneses: anamnesesR.status === 'fulfilled' ? anamnesesR.value.rows : [],
      agendamentos: agendamentosR.status === 'fulfilled' ? agendamentosR.value.rows : [],
      aniversariantes,
      avisosBanner: avisosBannerR.status === 'fulfilled' ? avisosBannerR.value.rows : [],
      avisosModais: avisosModaisR.status === 'fulfilled' ? avisosModaisR.value.rows : [],
      followups: followupsR.status === 'fulfilled' ? followupsR.value.rows : [],
    });
  } catch (err) {
    console.error('[dashboard/boot]', err);
    res.status(500).json({ error: 'Erro ao carregar dashboard.' });
  }
});

module.exports = router;
