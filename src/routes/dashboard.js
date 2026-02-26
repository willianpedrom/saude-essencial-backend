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
             (EXTRACT(DAY FROM data_nascimento) = EXTRACT(DAY FROM NOW()) AND EXTRACT(MONTH FROM data_nascimento) = EXTRACT(MONTH FROM NOW())) as is_today
             FROM clientes
             WHERE consultora_id = $1 
               AND ativo = TRUE
               AND data_nascimento IS NOT NULL
               AND (
                 (
                   to_char(NOW(), 'MM-DD') <= to_char(NOW() + INTERVAL '7 days', 'MM-DD') AND
                   to_char(data_nascimento, 'MM-DD') BETWEEN to_char(NOW(), 'MM-DD') AND to_char(NOW() + INTERVAL '7 days', 'MM-DD')
                 )
                 OR 
                 (
                   to_char(NOW(), 'MM-DD') > to_char(NOW() + INTERVAL '7 days', 'MM-DD') AND
                   (
                     to_char(data_nascimento, 'MM-DD') >= to_char(NOW(), 'MM-DD') OR
                     to_char(data_nascimento, 'MM-DD') <= to_char(NOW() + INTERVAL '7 days', 'MM-DD')
                   )
                 )
               )
             ORDER BY is_today DESC, to_char(data_nascimento, 'MM-DD') ASC`,
            [req.consultora.id]
        );

        // Gera os links do WhatsApp
        const aniversariantes = rows.map(cliente => {
            let whatsappLink = null;
            if (cliente.telefone) {
                // Remove todos os caracteres não numéricos
                const numeroLimpo = cliente.telefone.replace(/\D/g, '');
                if (numeroLimpo.length >= 10) { // Garante que tem um tamanho mínimo válido (ex: 5511999999999)
                    const mensagem = cliente.is_today
                        ? `Olá ${cliente.nome}! 🎉 Parabéns pelo seu dia! Que seu novo ciclo seja repleto de realizações, saúde e muita alegria. Um grande abraço! 🎂🥳`
                        : `Olá ${cliente.nome}! Passando para lembrar que seu aniversário está chegando! Já estamos preparando muitas energias positivas para você! 🎉`;
                    whatsappLink = `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;
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
