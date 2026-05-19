/**
 * migrationRunner.js
 *
 * Sistema de migrations incremental com rastreamento por tabela `_migrations`.
 *
 * Fluxo:
 *  1. Cria a tabela `_migrations` se não existir (1 query DDL).
 *  2. Carrega os nomes das migrations já aplicadas (1 query SELECT).
 *  3. Executa apenas as migrations ainda não aplicadas, em ordem numérica.
 *  4. Registra cada migration aplicada com timestamp.
 *
 * Na maioria dos reinícios (sem migrations novas) → apenas 2 queries no total.
 * Antes desta mudança → ~35 queries DDL em toda inicialização.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

/**
 * Lista de migrations em ordem de aplicação.
 * Cada item é { name, up } onde `up(pool)` executa a migration.
 * Nomes devem ser únicos e imutáveis (são a chave de rastreamento).
 */
const MIGRATIONS = [
    // ── 001: Schema principal (tabelas base) ──────────────────────────────────
    {
        name: '001_schema_base',
        async up(pool) {
            const sql = fs.readFileSync(
                path.join(__dirname, 'schema.sql'),
                'utf-8'
            );
            await pool.query(sql);
        },
    },

    // ── 002: Colunas adicionais na tabela planos ──────────────────────────────
    {
        name: '002_planos_colunas',
        async up(pool) {
            const cols = [
                'preco_semestral DECIMAL(10,2) DEFAULT NULL',
                'preco_anual     DECIMAL(10,2) DEFAULT NULL',
                'dias_trial      INTEGER       DEFAULT 0',
                'tem_pagina_pessoal  BOOLEAN   DEFAULT TRUE',
                'tem_raiox           BOOLEAN   DEFAULT TRUE',
                'tem_minhas_vendas   BOOLEAN   DEFAULT TRUE',
                'tem_radar           BOOLEAN   DEFAULT TRUE',
                'tem_agenda          BOOLEAN   DEFAULT TRUE',
                'tem_links           BOOLEAN   DEFAULT TRUE',
                'tem_anamneses       BOOLEAN   DEFAULT TRUE',
                'tem_clientes        BOOLEAN   DEFAULT TRUE',
                'tem_multiusuario    BOOLEAN   DEFAULT FALSE',
                'tem_relatorios      BOOLEAN   DEFAULT TRUE',
                'tem_estoque         BOOLEAN   DEFAULT TRUE',
                'tem_depoimentos     BOOLEAN   DEFAULT TRUE',
            ];
            for (const col of cols) {
                await pool.query(`ALTER TABLE planos ADD COLUMN IF NOT EXISTS ${col}`);
            }
        },
    },

    // ── 003: Colunas adicionais na tabela consultoras ─────────────────────────
    {
        name: '003_consultoras_colunas',
        async up(pool) {
            const cols = [
                'rastreamento       JSONB         DEFAULT NULL',
                'doterra_nivel      VARCHAR(60)   DEFAULT NULL',
                'subheadline_1      VARCHAR(255)  DEFAULT NULL',
                'subheadline_2      VARCHAR(255)  DEFAULT NULL',
                'termos_aceitos     BOOLEAN       DEFAULT FALSE',
                'termos_aceitos_em  TIMESTAMPTZ',
            ];
            for (const col of cols) {
                await pool.query(`ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS ${col}`);
            }
        },
    },

    // ── 004: Colunas adicionais na tabela assinaturas ─────────────────────────
    {
        name: '004_assinaturas_colunas',
        async up(pool) {
            await pool.query(`ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS hotmart_transaction_id  TEXT`);
            await pool.query(`ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS hotmart_subscription_id TEXT`);
            await pool.query(`ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS gateway VARCHAR(20) DEFAULT 'hotmart'`);
        },
    },

    // ── 005: Colunas adicionais na tabela clientes ────────────────────────────
    {
        name: '005_clientes_colunas',
        async up(pool) {
            const cols = [
                'recrutamento_stage       VARCHAR(40)',
                'recrutamento_notas       TEXT',
                'motivo_perda_recrutamento TEXT',
                'tipo_cadastro            VARCHAR(30)',
                'protocolo_mensagem       TEXT',
                "indicado_por_id          UUID REFERENCES clientes(id) ON DELETE SET NULL",
            ];
            for (const col of cols) {
                await pool.query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ${col}`);
            }
        },
    },

    // ── 006: Colunas adicionais na tabela anamneses ───────────────────────────
    {
        name: '006_anamneses_colunas',
        async up(pool) {
            await pool.query(`ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS protocolo_customizado JSONB`);
            await pool.query(`ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS hash_laudo VARCHAR(20) UNIQUE`);
        },
    },

    // ── 007: Tabela configuracoes (settings chave-valor) ──────────────────────
    {
        name: '007_configuracoes_table',
        async up(pool) {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS configuracoes (
                    chave       VARCHAR(100) PRIMARY KEY,
                    valor       TEXT,
                    atualizado_em TIMESTAMPTZ DEFAULT NOW()
                )
            `);
        },
    },

    // ── 008: Tabela e índices de prospecção ───────────────────────────────────
    {
        name: '008_prospects_table',
        async up(pool) {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS prospects (
                    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    consultora_id UUID REFERENCES consultoras(id) ON DELETE CASCADE,
                    nome          VARCHAR(255) NOT NULL,
                    place_id      VARCHAR(255),
                    endereco      TEXT,
                    telefone      VARCHAR(50),
                    website       TEXT,
                    nicho         VARCHAR(100),
                    instagram     TEXT,
                    facebook      TEXT,
                    email         TEXT,
                    status        VARCHAR(50) DEFAULT 'prospectado',
                    notas         TEXT,
                    criado_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_prospects_consultora ON prospects(consultora_id)`);
        },
    },

    // ── 009: Colunas extras na tabela prospects ───────────────────────────────
    {
        name: '009_prospects_colunas_extras',
        async up(pool) {
            const cols = [
                'historico          JSONB       DEFAULT \'[]\'',
                'instagram          TEXT',
                'facebook           TEXT',
                'email              TEXT',
                'nicho              VARCHAR(100)',
                'telefone           VARCHAR(50)',
                'website            TEXT',
                'rating             DECIMAL(2,1)',
                'user_ratings_total INTEGER',
                'lat                DECIMAL(10,8)',
                'lng                DECIMAL(11,8)',
            ];
            for (const col of cols) {
                await pool.query(`ALTER TABLE prospects ADD COLUMN IF NOT EXISTS ${col}`);
            }
        },
    },

    // ── 010: Tabela de push subscriptions ────────────────────────────────────
    {
        name: '010_push_subscriptions_table',
        async up(pool) {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS push_subscriptions (
                    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    consultora_id   UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
                    endpoint        TEXT UNIQUE NOT NULL,
                    expiration_time TIMESTAMPTZ,
                    keys            JSONB NOT NULL,
                    browser_name    VARCHAR(100),
                    device_type     VARCHAR(50),
                    criado_em       TIMESTAMPTZ DEFAULT NOW(),
                    atualizado_em   TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_push_consultora ON push_subscriptions(consultora_id)`);
        },
    },

    // ── 011: Promoção do admin principal ──────────────────────────────────────
    {
        name: '011_admin_promotion',
        async up(pool) {
            // Promove por e-mail (se ADMIN_EMAIL configurado)
            if (process.env.ADMIN_EMAIL) {
                await pool.query(
                    "UPDATE consultoras SET role = 'admin' WHERE email = $1",
                    [process.env.ADMIN_EMAIL]
                );
            }
            // Promove o primeiro usuário criado como fallback
            await pool.query(`
                UPDATE consultoras SET role = 'admin'
                WHERE id = (SELECT id FROM consultoras ORDER BY criado_em ASC LIMIT 1)
            `);
        },
    },

    // ── 012: Tabelas de notificações admin ───────────────────────────────────
    {
        name: '012_admin_notifications_tables',
        async up(pool) {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS admin_incentive_pool (
                    id        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
                    titulo    VARCHAR(255) DEFAULT 'Incentivo',
                    mensagem  TEXT NOT NULL,
                    ativo     BOOLEAN DEFAULT TRUE,
                    criado_em     TIMESTAMPTZ DEFAULT NOW(),
                    atualizado_em TIMESTAMPTZ DEFAULT NOW()
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS notification_broadcasts (
                    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    admin_id          UUID REFERENCES consultoras(id) ON DELETE SET NULL,
                    titulo            VARCHAR(255) NOT NULL,
                    mensagem          TEXT NOT NULL,
                    tipo              VARCHAR(50) DEFAULT 'manual',
                    destinatarios_qtd INT DEFAULT 0,
                    cliques_qtd       INT DEFAULT 0,
                    criado_em         TIMESTAMPTZ DEFAULT NOW()
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS notification_clicks (
                    broadcast_id  UUID NOT NULL REFERENCES notification_broadcasts(id) ON DELETE CASCADE,
                    consultora_id UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
                    clicado_em    TIMESTAMPTZ DEFAULT NOW(),
                    PRIMARY KEY (broadcast_id, consultora_id)
                )
            `);

            await pool.query(`CREATE INDEX IF NOT EXISTS idx_notif_broadcast_admin ON notification_broadcasts(admin_id)`);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_notif_clicks_broadcast ON notification_clicks(broadcast_id)`);
        },
    },

    // ── 013: Seed do pool de incentivos ──────────────────────────────────────
    {
        name: '013_seed_incentive_pool',
        async up(pool) {
            const { rows } = await pool.query('SELECT COUNT(*) FROM admin_incentive_pool');
            if (parseInt(rows[0].count) === 0) {
                await pool.query(`
                    INSERT INTO admin_incentive_pool (titulo, mensagem) VALUES
                    ('Bom dia {nome}! ☀️', 'Que tal começar o dia revisando suas anamneses pendentes? Um bom acompanhamento é a chave do sucesso.'),
                    ('Dica do Dia 💧', 'Olá {nome}, você já conferiu os novos protocolos de óleos essenciais? Conhecimento ajuda a vender mais!'),
                    ('Sua Página Pessoal 🚀', 'Oi {nome}, já configurou seu link de divulgação hoje? Sua vitrine digital é seu melhor cartão de visitas.'),
                    ('Acompanhamento 📝', 'Olá {nome}, lembrou de fazer o follow-up com seus clientes de ontem? A atenção aos detalhes fideliza!'),
                    ('Meta de Hoje ✅', 'Vamos pra cima, {nome}! Qual é a sua meta de atendimentos para hoje? O sistema está pronto para te ajudar.')
                `);
            }
        },
    },
    // ── 014: Atualização Tabela Preços 2026 ──────────────────────────────────
    {
        name: '014_update_doterra_prices_2026',
        async up(pool) {
            try {
                // Executamos o script update_db_prices.js que criei
                const fs = require('fs');
                const path = require('path');
                const pricesPath = path.join(__dirname, '../../../new_prices.json');
                if (fs.existsSync(pricesPath)) {
                    const newPrices = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
                    let updated = 0;
                    const res = await pool.query(`SELECT id, nome_produto, ml_tamanho FROM estoque`);
                    
                    for (let row of res.rows) {
                        let oldName = row.nome_produto.toLowerCase();
                        let oldSize = (row.ml_tamanho || '').toLowerCase();
                        if (oldSize.includes('unidade') || oldSize.includes('kit')) oldSize = 'unidade / kit';
                        if (oldSize.includes('cápsula')) oldSize = 'cápsulas';

                        let bestMatch = null;
                        let bestScore = -1;

                        for (let np of newPrices) {
                            let parts = np.name.replace(/\(.*?\)/g, '').replace(/[®™]/g, '').split('-').map(p => p.trim().toLowerCase());
                            let npName1 = parts[0] || '';
                            let npName2 = parts[1] || '';
                            
                            let npSize = np.size.toLowerCase();
                            if (npSize.includes('unidade') || npSize.includes('kit') || npSize.includes('g') || npSize.includes('litro')) npSize = 'unidade / kit';
                            if (npSize.includes('pastilha') || npSize.includes('cápsula')) npSize = 'cápsulas';
                            
                            let nameMatch = false;
                            if (npName1 === oldName || npName1.includes(oldName) || oldName.includes(npName1)) nameMatch = true;
                            if (npName2 && (npName2 === oldName || npName2.includes(oldName) || oldName.includes(npName2))) nameMatch = true;
                            
                            if (oldName === 'melaleuca' && np.name.toLowerCase().includes('tea tree')) nameMatch = true;
                            if (oldName === 'zen gest' && npName1.includes('zengest')) nameMatch = true;
                            if (oldName === 'copaiba' && npName1.includes('copaíba')) nameMatch = true;
                            
                            let sizeMatch = false;
                            if (oldSize === npSize) sizeMatch = true;
                            if (oldSize === '10ml touch' && npSize.includes('touch')) sizeMatch = true;
                            if (oldSize === 'unidade / kit' && npSize === 'cápsulas' && oldName.includes('pastilha')) sizeMatch = true;

                            if (nameMatch && sizeMatch) {
                                let score = 1;
                                if (npName1 === oldName || npName2 === oldName) score += 10;
                                if (oldSize === npSize) score += 5;
                                
                                if (score > bestScore) {
                                    bestScore = score;
                                    bestMatch = np;
                                }
                            }
                        }

                        if (bestMatch) {
                            await pool.query(
                                `UPDATE estoque SET preco_custo = $1, preco_venda = $2 WHERE id = $3`,
                                [bestMatch.mem, bestMatch.reg, row.id]
                            );
                            updated++;
                        }
                    }
                    console.log(`Updated ${updated} items in estoque table via migration.`);
                }
            } catch (e) {
                console.error("Failed to run prices migration:", e);
            }
        },
    },
    // ── 015: Patch Preços 2026 (Pastilhas e Beadlets) ────────────────────────
    {
        name: '015_patch_missed_prices_2026',
        async up(pool) {
            const patches = [
                { name: 'On Guard Pastilhas', r: 248, m: 186.25 },
                { name: 'On Guard Beadlets', r: 155, m: 116.25 },
                { name: 'Peppermint Beadlets', r: 140, m: 105 },
                { name: 'Copaíba Softgels', r: 252, m: 189 },
                { name: 'ZenGest Pastilhas', r: 215, m: 161.25 },
                { name: 'Zendocrine Pastilhas', r: 224, m: 168 },
                { name: 'Turmeric Pastilhas', r: 248, m: 186.25 },
                { name: 'Adaptiv Pastilhas', r: 308, m: 231.25 }
            ];
            
            for (let patch of patches) {
                await pool.query(
                    `UPDATE estoque SET preco_venda = $1, preco_custo = $2 WHERE nome_produto ILIKE $3`,
                    [patch.r, patch.m, \`%\${patch.name}%\`]
                );
            }
        }
    }
];

/**
 * runMigrations — ponto de entrada principal.
 * @param {import('pg').Pool} pool
 */
async function runMigrations(pool) {
    // 1. Garante que a tabela de controle existe (sempre idempotente)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS _migrations (
            name       TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ DEFAULT NOW()
        )
    `);

    // 2. Carrega migrations já aplicadas em um Set para lookup O(1)
    const { rows } = await pool.query('SELECT name FROM _migrations');
    const applied = new Set(rows.map(r => r.name));

    // 3. Filtra apenas as pendentes
    const pending = MIGRATIONS.filter(m => !applied.has(m.name));

    if (pending.length === 0) {
        console.log(`✅ Schema OK — ${applied.size} migrations já aplicadas, nenhuma nova.`);
        return;
    }

    console.log(`🔄 Aplicando ${pending.length} migration(s) pendente(s)...`);

    // 4. Executa cada migration pendente em sequência
    for (const migration of pending) {
        try {
            await migration.up(pool);
            await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [migration.name]);
            console.log(`  ✅ ${migration.name}`);
        } catch (err) {
            // Falha numa migration não deve impedir o servidor de iniciar,
            // mas deve ser registrada claramente nos logs.
            console.error(`  ❌ Falha em "${migration.name}": ${err.message}`);
            // Re-throw para que o caller decida se para ou continua
            throw err;
        }
    }

    console.log(`✅ Schema OK — ${pending.length} migration(s) aplicada(s) com sucesso.`);
}

module.exports = { runMigrations };
