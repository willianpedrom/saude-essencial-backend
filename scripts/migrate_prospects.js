require('dotenv').config();
const pool = require('../src/db/pool');

async function migrate() {
    try {
        console.log('--- Iniciando Migração: Tabela Prospects ---');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS prospects (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                consultora_id UUID REFERENCES consultoras(id) ON DELETE CASCADE,
                nome VARCHAR(255) NOT NULL,
                place_id VARCHAR(255),
                endereco TEXT,
                telefone VARCHAR(50),
                website TEXT,
                nicho VARCHAR(100),
                status VARCHAR(50) DEFAULT 'prospectado', 
                notas TEXT,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Índice para busca rápida por consultora
            CREATE INDEX IF NOT EXISTS idx_prospects_consultora ON prospects(consultora_id);
        `);
        console.log('✅ Tabela "prospects" criada com sucesso!');
    } catch (err) {
        console.error('❌ Erro na migração:', err);
    } finally {
        await pool.end();
    }
}

migrate();
