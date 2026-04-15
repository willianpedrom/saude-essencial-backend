const pool = require('../db/pool');

module.exports = async function checkAdmin(req, res, next) {
    try {
        if (!req.consultora || !req.consultora.id) {
            return res.status(401).json({ error: 'Não autenticado.' });
        }

        const { rows } = await pool.query(
            'SELECT email, role FROM consultoras WHERE id = $1',
            [req.consultora.id]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Usuário não encontrado.' });
        }

        const consultora = rows[0];
        const isSystemAdmin = process.env.ADMIN_EMAIL && consultora.email === process.env.ADMIN_EMAIL;

        if (consultora.role !== 'admin' && !isSystemAdmin) {
            return res.status(403).json({ error: 'Acesso negado. Requer privilégios de administrador.' });
        }

        next();
    } catch (err) {
        console.error('[checkAdmin] Erro:', err);
        res.status(500).json({ error: 'Erro interno ao validar permissões.' });
    }
};
