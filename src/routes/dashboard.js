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

module.exports = router;
