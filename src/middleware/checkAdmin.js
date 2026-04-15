const pool = require('../db/pool');

module.exports = async function checkAdmin(req, res, next) {
    try {
        if (!req.consultora || !req.consultora.id) {
            return res.status(401).json({ error: 'Não autenticado.' });
        }

        const { rows } = await pool.query(
            'SELECT role FROM consultoras WHERE id = $1',
            [req.consultora.id]
        );

        if (rows.length === 0 || rows[0].role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado. Requer privilégios de administrador.' });
        }

        next();
    } catch (err) {
        console.error('[checkAdmin] Erro:', err);
        res.status(500).json({ error: 'Erro interno ao validar permissões.' });
    }
};
