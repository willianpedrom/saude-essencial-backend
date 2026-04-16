const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /convite/:slug
router.get('/:slug', async (req, res) => {
    const { slug } = req.params;

    try {
        let isAnamnese = false;
        let queryResult = await pool.query(
            "SELECT nome, foto_url FROM consultoras WHERE slug = $1 LIMIT 1",
            [slug]
        );

        if (queryResult.rows.length === 0) {
            // Tenta buscar no gerador de links genéricos (Público de Anamneses) apenas se for um UUID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
            if (isUUID) {
                queryResult = await pool.query(
                    "SELECT c.nome, c.foto_url FROM anamneses a JOIN consultoras c ON a.consultora_id = c.id WHERE a.token_publico = $1 LIMIT 1",
                    [slug]
                );
                if (queryResult.rows.length > 0) {
                    isAnamnese = true;
                }
            }
        }

        let nome = "Gota App";
        let foto = "https://gotaessencial.com.br/logo.jpg";
        let defaultImage = true;

        if (queryResult.rows.length > 0) {
            const row = queryResult.rows[0];
            nome = row.nome;
            if (row.foto_url && row.foto_url.trim() !== '') {
                // Garantir que a URL da foto seja absoluta
                foto = row.foto_url.startsWith('http') ? row.foto_url : `https://gotaessencial.com.br${row.foto_url.startsWith('/') ? '' : '/'}${row.foto_url}`;
                defaultImage = false;
            }
        }

        const titulo = `Saúde, disposição e Foco de forma natural com ${nome}`;
        const descricao = "Descubra como eu posso te ajudar e resolver seus problemas de saúde. Gere seu protocolo personalizado gratuitamente agora!";
        const finalUrl = isAnamnese ? `/#/anamnese/${slug}` : `/#/p/${slug}`;

        const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titulo}</title>
    
    <!-- Open Graph Data -->
    <meta property="og:title" content="${titulo}">
    <meta property="og:description" content="${descricao}">
    <meta property="og:image" content="${foto}">
    <meta property="og:image:secure_url" content="${foto}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Foto de ${nome}">
    <meta property="og:url" content="https://gotaessencial.com.br/convite/${slug}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Gota App">

    <!-- Twitter Card Data -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${titulo}">
    <meta name="twitter:description" content="${descricao}">
    <meta name="twitter:image" content="${foto}">

    <meta http-equiv="refresh" content="0; url=${finalUrl}">
    <script>
        window.location.replace("${finalUrl}");
    </script>
</head>
<body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
    <p>Redirecionando para as informações de <strong>${nome}</strong>...</p>
    <p>Se você não for redirecionado em 3 segundos, <a href="${finalUrl}">clique aqui</a>.</p>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);

    } catch (err) {
        console.error("Erro no OpenGraph compartilhado: ", err);
        res.redirect(`/#/p/${slug}`);
    }
});

module.exports = router;
