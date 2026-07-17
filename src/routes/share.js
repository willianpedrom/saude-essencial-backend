const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const NodeCache = require('node-cache');

// Cache de 10 minutos — reduz drasticamente as consultas ao banco
const shareCache = new NodeCache({ stdTTL: 600 });

// GET /convite/:slug  — SEO/OpenGraph redirect page
router.get('/:slug', async (req, res) => {
    const { slug } = req.params;

    // ─── 1. Redirect imediato + premium loading screen ──────────────────────
    // A estratégia é devolver a página instantaneamente (sem esperar o banco),
    // mostrando a tela premium de loading enquanto o JS redireciona o usuário.
    // O banco só é consultado para popular os metadados Open Graph.

    // Determinar URL de destino sem precisar do banco
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const finalUrl = isUUID ? `/#/anamnese/${slug}` : `/#/p/${slug}`;

    // ─── 2. Tentar cache primeiro para metadados OG ──────────────────────────
    let cachedMeta = shareCache.get(slug);

    if (!cachedMeta) {
        // Fire-and-forget: busca OG metadata em paralelo, sem bloquear o response
        // O response já sai; o cache será populado para próximos bots/crawlers
        (async () => {
            try {
                let nome = "Gota App";
                let foto = "https://gotaessencial.com.br/img/og-health-banner.png";

                let qr = await pool.query(
                    "SELECT nome, foto_url FROM consultoras WHERE slug = $1 LIMIT 1",
                    [slug]
                );

                if (qr.rows.length === 0 && isUUID) {
                    qr = await pool.query(
                        `SELECT c.nome, c.foto_url 
                         FROM anamneses a 
                         JOIN consultoras c ON a.consultora_id = c.id 
                         WHERE a.token_publico = $1 LIMIT 1`,
                        [slug]
                    );
                }

                if (qr.rows.length > 0) {
                    const row = qr.rows[0];
                    nome = row.nome || nome;
                    if (row.foto_url && row.foto_url.trim() !== '') {
                        foto = row.foto_url.startsWith('http')
                            ? row.foto_url
                            : `https://gotaessencial.com.br${row.foto_url.startsWith('/') ? '' : '/'}${row.foto_url}`;
                    }
                }

                shareCache.set(slug, { nome, foto });
            } catch (e) {
                // ignore — next request will try again
            }
        })();

        // Use fallback values for this request
        cachedMeta = { nome: "Gota App", foto: "https://gotaessencial.com.br/img/og-health-banner.png" };
    }

    const { nome, foto } = cachedMeta;
    const isDefaultOg = foto.includes('og-health-banner.png');
    const imageSizeTags = isDefaultOg 
        ? `\n    <meta property="og:image:width" content="1200">\n    <meta property="og:image:height" content="630">`
        : '';
    const twitterCardType = isDefaultOg ? 'summary_large_image' : 'summary';

    const titulo = `Saúde, disposição e Foco de forma natural com ${nome}`;
    const descricao = "Descubra como eu posso te ajudar e resolver seus problemas de saúde. Gere seu protocolo personalizado gratuitamente agora!";

    // ─── 3. Enviar HTML com redirect instantâneo + loading screen premium ────
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titulo}</title>

    <!-- Open Graph -->
    <meta property="og:title" content="${titulo}">
    <meta property="og:description" content="${descricao}">
    <meta property="og:image" content="${foto}">
    <meta property="og:image:secure_url" content="${foto}">
    <meta property="og:image:type" content="image/jpeg">${imageSizeTags}
    <meta property="og:image:alt" content="Foto de ${nome}">
    <meta property="og:url" content="https://gotaessencial.com.br/convite/${slug}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Gota App">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="${twitterCardType}">
    <meta name="twitter:title" content="${titulo}">
    <meta name="twitter:description" content="${descricao}">
    <meta name="twitter:image" content="${foto}">

    <!-- Redirect: JS is fastest, http-equiv as fallback -->
    <script>window.location.replace("${finalUrl}");</script>
    <meta http-equiv="refresh" content="0; url=${finalUrl}">

    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        background: radial-gradient(circle at center, #0a1f14 0%, #06120b 100%);
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        text-align: center;
        font-family: 'Inter', sans-serif;
        color: white;
      }
      .loader-content { animation: fadeIn 0.8s ease-out; }
      @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      .liquid-drop {
        width: 80px; height: 80px; margin: 0 auto 28px;
        background: rgba(245, 208, 97, 0.08);
        border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        animation: liquidMorph 4s ease-in-out infinite;
        display: flex; align-items: center; justify-content: center;
      }
      .drop-inner {
        width: 42px; height: 42px;
        background: linear-gradient(135deg, #f5d061 0%, #b8860b 100%);
        border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        animation: pulseDrop 2s ease-in-out infinite;
        box-shadow: 0 8px 20px rgba(184, 134, 11, 0.4);
      }
      @keyframes liquidMorph {
        0%, 100% { border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; }
        33% { border-radius: 40% 60% 50% 50% / 50% 40% 60% 50%; }
        66% { border-radius: 60% 40% 40% 60% / 40% 60% 50% 40%; }
      }
      @keyframes pulseDrop { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.1); opacity: 1; } }
      h1 {
        font-family: 'Playfair Display', serif;
        font-size: 2.2rem;
        background: linear-gradient(90deg, #f5d061, #fff, #f5d061);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: shimmer 3s linear infinite;
        margin-bottom: 10px; font-weight: 700;
      }
      @keyframes shimmer { to { background-position: 200% center; } }
      p { color: rgba(255,255,255,0.4); font-size: 0.85rem; letter-spacing: 3px; text-transform: uppercase; }
    </style>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400&display=swap" rel="stylesheet">
</head>
<body>
    <div class="loader-content">
        <div class="liquid-drop"><div class="drop-inner"></div></div>
        <h1>Gota App</h1>
        <p>Abrindo seu protocolo...</p>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(html);
});

module.exports = router;
