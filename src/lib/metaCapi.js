/* ============================================================
   META CAPI – Sends server-side events to Meta Conversions API
   Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
   ============================================================ */

const https = require('https');

/**
 * Send a server-side event to Meta Conversions API.
 * @param {string} pixelId   - Meta Pixel ID
 * @param {string} accessToken - Meta CAPI Access Token
 * @param {string} eventName - e.g. 'Lead', 'ViewContent', 'CompleteRegistration'
 * @param {object} eventData - optional: { email, phone, clientIp, userAgent, pageUrl }
 */
async function sendMetaEvent(pixelId, accessToken, eventName, eventData = {}) {
    if (!pixelId || !accessToken) return;

    const now = Math.floor(Date.now() / 1000);

    // Build user_data — hash personally identifiable info if present
    const userData = {
        client_ip_address: eventData.clientIp || undefined,
        client_user_agent: eventData.userAgent || undefined,
    };

    const eventPayload = {
        event_name: eventName,
        event_time: now,
        action_source: 'website',
        event_source_url: eventData.pageUrl || undefined,
        user_data: userData,
    };

    const body = JSON.stringify({
        data: [eventPayload],
        // test_event_code: 'TEST12345', // Uncomment for Meta Test Events tool
    });

    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

    return new Promise((resolve) => {
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        }, (res) => {
            let raw = '';
            res.on('data', d => { raw += d; });
            res.on('end', () => {
                if (res.statusCode >= 400) {
                    console.warn(`[CAPI] Meta event ${eventName} failed (${res.statusCode}):`, raw);
                } else {
                    console.log(`[CAPI] Meta event ${eventName} sent to pixel ${pixelId}`);
                }
                resolve();
            });
        });
        req.on('error', (err) => {
            console.warn('[CAPI] Error sending Meta event:', err.message);
            resolve(); // Never block request on CAPI failure
        });
        req.write(body);
        req.end();
    });
}

module.exports = { sendMetaEvent };
