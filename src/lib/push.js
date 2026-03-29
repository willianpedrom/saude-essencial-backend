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

        const pushPayload = JSON.stringify(payload);

        const promises = subs.map(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: sub.keys
            };

            return webpush.sendNotification(pushSubscription, pushPayload)
                .catch(async (err) => {
                    if (err.statusCode === 404 || err.statusCode === 410) {
                        // Subscrição expirada ou inválida, remover do banco
                        console.log(`[Push] Removendo subscrição inválida: ${sub.id}`);
                        await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
                    } else {
                        console.error('[Push] Erro ao enviar:', err);
                    }
                });
        });

        await Promise.all(promises);
    } catch (err) {
        console.error('[Push] Erro sistêmico:', err);
    }
}

module.exports = { sendPushNotification, vapidPublicKey };
