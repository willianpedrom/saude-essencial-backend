const webpush = require('web-push');
const pool = require('../db/pool');

// Configuração das Chaves VAPID
// Em produção, isso deve vir de process.env
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BFG7_M7F7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X7X6X';

webpush.setVapidDetails(
    'mailto:contato@gotaessencial.com.br',
    vapidPublicKey,
    vapidPrivateKey
);

/**
 * Envia uma notificação push para todas as subscrições de uma consultora.
 * @param {string} consultoraId 
 * @param {object} payload { title, body, icon, data }
 */
async function sendPushNotification(consultoraId, payload) {
    try {
        const { rows: subs } = await pool.query(
            'SELECT * FROM push_subscriptions WHERE consultora_id = $1',
            [consultoraId]
        );

        if (subs.length === 0) return;
        return _sendToSubscriptions(subs, payload);
    } catch (err) {
        console.error('[Push] Erro sistêmico:', err);
    }
}

/**
 * Envia uma notificação para TODOS os consultores ativos (Broadcast).
 * @param {object} payload { title, body, icon, data }
 * @param {string} broadcastId ID do broadcast para rastreamento de cliques
 */
async function broadcastPushNotification(payload, broadcastId = null) {
    try {
        // Busca todos os consultores que possuem ao menos uma subscrição
        const { rows: consultants } = await pool.query(`
            SELECT DISTINCT c.id, c.nome 
            FROM consultoras c
            JOIN push_subscriptions ps ON ps.consultora_id = c.id
        `);

        console.log(`[Push] Iniciando broadcast para ${consultants.length} consultores.`);
        
        let totalSent = 0;
        for (const target of consultants) {
            const { rows: subs } = await pool.query(
                'SELECT * FROM push_subscriptions WHERE consultora_id = $1',
                [target.id]
            );

            // Personalização: substitui {nome} pelo primeiro nome do consultor no título e no corpo
            const firstName = (target.nome || 'Consultor').split(' ')[0];
            const personalizedPayload = {
                ...payload,
                title: payload.title.replace(/{nome}/g, firstName),
                body: payload.body.replace(/{nome}/g, firstName),
                data: {
                    ...payload.data,
                    broadcastId: broadcastId,
                    consultoraId: target.id
                }
            };

            await _sendToSubscriptions(subs, personalizedPayload);
            totalSent++;
        }

        return totalSent;
    } catch (err) {
        console.error('[Push] Erro no broadcast:', err);
        return 0;
    }
}

/**
 * Helper interno para disparar para uma lista de subscrições
 */
async function _sendToSubscriptions(subs, payload) {
    const pushPayload = JSON.stringify(payload);
    const promises = subs.map(sub => {
        const pushSubscription = {
            endpoint: sub.endpoint,
            keys: typeof sub.keys === 'string' ? JSON.parse(sub.keys) : sub.keys
        };

        return webpush.sendNotification(pushSubscription, pushPayload)
            .catch(async (err) => {
                if (err.statusCode === 404 || err.statusCode === 410) {
                    await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
                } else {
                    console.error('[Push] Erro ao enviar subscrição:', err.message);
                }
            });
    });
    return Promise.all(promises);
}

module.exports = { sendPushNotification, broadcastPushNotification, vapidPublicKey };
