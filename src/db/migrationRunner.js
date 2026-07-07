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
                    [patch.r, patch.m, `%${patch.name}%`]
                );
            }
        }
    },
    // ── 016: Sincronização Geral de Preços e Categorias 2026 ─────────────────
    {
        name: '016_sync_all_prices_2026',
        async up(pool) {
            try {
                const fs = require('fs');
                const path = require('path');
                
                const parsedPricesPath = path.join(__dirname, '..', '..', 'parsed_prices.json');
                if (!fs.existsSync(parsedPricesPath)) {
                    console.log(`⚠️ Arquivo parsed_prices.json não encontrado em \${parsedPricesPath}. Pulando migração de preços.`);
                    return;
                }
                
                const parsed = JSON.parse(fs.readFileSync(parsedPricesPath, 'utf8'));
                
                function cleanString(s) {
                    return s.toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/®|™/g, '')
                        .replace(/\s*\(.*?\)\s*/g, ' ')
                        .replace(/\s*-\s*/g, ' ')
                        .replace(/[^a-z0-9]/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                }

                const RAW_MANUAL_MAPPINGS = {
                    'pasta de dente on guard': 'On Guard® Creme Dental Clareador Natural',
                    'creme dental on guard': 'On Guard® Creme Dental Clareador Natural',
                    'on guard creme dental clareador natural': 'On Guard® Creme Dental Clareador Natural',
                    'creme dental clareador natural on guard': 'On Guard® Creme Dental Clareador Natural',
                    'on guard pastilhas': 'On Guard®+ Pastilhas',
                    'on guard beadlets': 'On Guard® Beadlets',
                    'peppermint beadlets': 'Peppermint Beadlets',
                    'copaiba softgels': 'Copaíba Softgels',
                    'copaíba softgels': 'Copaíba Softgels',
                    'zengest pastilhas': 'ZenGest® Pastilhas',
                    'zendocrine pastilhas': 'Zendocrine® Pastilhas',
                    'turmeric pastilhas': 'Turmeric Pastilhas',
                    'adaptiv pastilhas': 'Adaptiv® Pastilhas',
                    'ddr prime pastilha': 'DDR Prime® Pastilha',
                    'ddr prime pastilhas': 'DDR Prime® Pastilha',
                    'ddr prime cápsulas': 'DDR Prime® Pastilha',
                    'deep blue rub': 'dōTERRA Deep Blue® Rub',
                    'pomada deep blue rub': 'dōTERRA Deep Blue® Rub',
                    'deep blue stick + copaiba': 'dōTERRA Deep Blue® Stick + Copaíba',
                    'deep blue stick + copaíba': 'dōTERRA Deep Blue® Stick + Copaíba',
                    'oleo de coco fracionado': 'Óleo de Coco Fracionado',
                    'oleo de coco fracionado (115ml)': 'Óleo de Coco Fracionado',
                    'óleo de coco fracionado': 'Óleo de Coco Fracionado',
                    'óleo de coco fracionado (115ml)': 'Óleo de Coco Fracionado',
                    'brasil living kit': 'dōTERRA® Brasil Living Kit',
                    'kit brasil living (10 oleos 5ml)': 'dōTERRA® Brasil Living Kit',
                    'essencial para o lar': 'dōTERRA® Essencial Para o Lar (Pebble)',
                    'kit essencial para o lar': 'dōTERRA® Essencial Para o Lar (Pebble)',
                    'kit de apresentacao': 'dōTERRA® Kit de Apresentação',
                    'kit de apresentação': 'dōTERRA® Kit de Apresentação',
                    'inicio rapido': 'dōTERRA® Kit Início Rápido',
                    'inicio rápido': 'dōTERRA® Kit Início Rápido',
                    'início rápido': 'dōTERRA® Kit Início Rápido',
                    'primeiros cuidados': 'dōTERRA® Kit Primeiros Cuidados',
                    'aromatouch kit': 'Kit Técnica dōTERRA AromaTouch®',
                    'aromatouch com difusor': 'Kit Técnica dōTERRA® AromaTouch® com Difusor',
                    'verage kit skincare': 'Veráge Collection —',
                    'verage creme hidratante': 'Veráge® Creme Hidratante',
                    'verage hidratante': 'Veráge® Creme Hidratante',
                    'verage solucao de limpeza': 'Veráge® Solução de Limpeza Facial',
                    'verage soluçao de limpeza': 'Veráge® Solução de Limpeza Facial',
                    'veráge solução de limpeza': 'Veráge® Solução de Limpeza Facial',
                    'verage tonico': 'Verage Tônico Facial',
                    'verage tônico': 'Verage Tônico Facial',
                    'veráge tônico': 'Verage Tônico Facial',
                    'yarrow pom': {
                        '15ml': 'Yarrow | Pom',
                        '30ml': 'Yarrow | Pom - Ativo Botânico Duo'
                    },
                    'yarrow|pom': {
                        '15ml': 'Yarrow | Pom',
                        '30ml': 'Yarrow | Pom - Ativo Botânico Duo'
                    },
                    'yarrow pom serum firmador': "dōTERRA Collector's Kit - Box",
                    'condicionador diario': 'Conditioner Hair Care - Condicionador',
                    'condicionador sem enxague': 'Conditioner Leave-in - Condicionador Leave-in',
                    'condicionador sem enxágue': 'Conditioner Leave-in - Condicionador Leave-in',
                    'shampoo protetor': 'Shampoo Protetor',
                    'spa loção para mãos e corpo': 'dōTERRA® Spa Loção para Mãos e Corpo',
                    'loção spa mãos e corpo': 'dōTERRA® Spa Loção para Mãos e Corpo',
                    'spa sabonete hidratante': 'dōTERRA® Spa Sabonete Hidratante',
                    'sabonete líquido spa': 'dōTERRA® Spa Sabonete Hidratante',
                    'pinho siberiano': 'Siberian Fir - Pinheiro-siberiano',
                    'abeto siberiano': 'Siberian Fir - Pinheiro-siberiano',
                    'laranja doce (wild orange)': 'Wild Orange - Laranja-selvagem',
                    'laranja doce': 'Wild Orange - Laranja-selvagem',
                    'melaleuca (tea tree)': 'Tea Tree - Melaleuca',
                    'melaleuca': 'Tea Tree - Melaleuca',
                    'lavanda (lavender)': 'Lavender - Lavanda',
                    'lavanda': 'Lavender - Lavanda',
                    'hortela-pimenta (peppermint)': 'Peppermint - Hortelã-pimenta',
                    'hortela-pimenta': 'Peppermint - Hortelã-pimenta',
                    'hortelã-pimenta (peppermint)': 'Peppermint - Hortelã-pimenta',
                    'hortelã-pimenta': 'Peppermint - Hortelã-pimenta',
                    'olibano (frankincense)': 'Frankincense - Olíbano',
                    'olibano': 'Frankincense - Olíbano',
                    'olíbano (frankincense)': 'Frankincense - Olíbano',
                    'olíbano': 'Frankincense - Olíbano',
                    'limão siciliano (lemon)': 'Lemon - Limão-siciliano',
                    'limao siciliano': 'Lemon - Limão-siciliano',
                    'limão siciliano': 'Lemon - Limão-siciliano',
                    'gengibre (ginger)': 'Ginger - Gengibre',
                    'gengibre': 'Ginger - Gengibre',
                    'alecrim (rosemary)': 'Rosemary - Alecrim',
                    'alecrim': 'Rosemary - Alecrim',
                    'canela (cinnamon bark)': 'Cinnamon Bark - Canela',
                    'canela': 'Cinnamon Bark - Canela',
                    'rosa (rose)': 'Rose - Rosa',
                    'rosa': 'Rose - Rosa',
                    'mirra (myrrh)': 'Myrrh - Mirra',
                    'mirra': 'Myrrh - Mirra',
                    'cedro (cedarwood)': 'Cedarwood - Cedro',
                    'cedro': 'Cedarwood - Cedro',
                    'pimenta preta (black pepper)': 'Black Pepper - Pimenta-negra',
                    'pimenta preta': 'Black Pepper - Pimenta-negra',
                    'salvia esclareia (clary sage)': 'Clary Sage - Sálvia-esclareia',
                    'salvia esclareia': 'Clary Sage - Sálvia-esclareia',
                    'sálvia esclareia (clary sage)': 'Clary Sage - Sálvia-esclareia',
                    'sálvia esclareia': 'Clary Sage - Sálvia-esclareia',
                    'sandalo havaiano (hawaiian sandalwood)': 'Hawaiian Sandalwood - Sândalo-havaiano',
                    'sandalo havaiano': 'Hawaiian Sandalwood - Sândalo-havaiano',
                    'sândalo havaiano (hawaiian sandalwood)': 'Hawaiian Sandalwood - Sândalo-havaiano',
                    'sândalo havaiano': 'Hawaiian Sandalwood - Sândalo-havaiano',
                    'cravo (clove)': 'Clove - Cravo-da-índia',
                    'cravo': 'Clove - Cravo-da-índia',
                    'toranja (grapefruit)': 'Grapefruit - Toranja',
                    'toranja': 'Grapefruit - Toranja',
                    'capim-limao (lemongrass)': 'Lemongrass - Capim-limão',
                    'capim-limão (lemongrass)': 'Lemongrass - Capim-limão',
                    'capim limao': 'Lemongrass - Capim-limão',
                    'capim-limão': 'Lemongrass - Capim-limão',
                    'erva doce (fennel)': 'Fennel - Funcho',
                    'erva doce': 'Fennel - Funcho',
                    'tomilho (thyme)': 'Thyme - Tomilho',
                    'tomilho': 'Thyme - Tomilho',
                    'cipreste (cypress)': 'Cypress - Cipreste',
                    'cipreste': 'Cypress - Cipreste',
                    'zimbro (juniper berry)': 'Juniper Berry - Zimbro',
                    'zimbro': 'Juniper Berry - Zimbro',
                    'basil (manjericão)': 'Basil - Manjericão',
                    'basil (manjericao)': 'Basil - Manjericão',
                    'basil': 'Basil - Manjericão',
                    'manjericao': 'Basil - Manjericão',
                    'manjericão': 'Basil - Manjericão',
                    'coentro (coriander)': 'Coriander - Coentro',
                    'coentro': 'Coriander - Coentro',
                    'camomila romana (roman chamomile)': 'Roman Chamomile - Camomila-romana',
                    'camomila romana': 'Roman Chamomile - Camomila-romana',
                    'geranio (geranium)': 'Geranium - Gerânio',
                    'geranio': 'Geranium - Gerânio',
                    'gerânio (geranium)': 'Geranium - Gerânio',
                    'gerânio': 'Geranium - Gerânio',
                    'helicriso (helichrysum)': 'Helichrysum - Helicriso',
                    'helicriso': 'Helichrysum - Helicriso',
                    'on guard (mix protetor)': 'On Guard®',
                    'on guard': 'On Guard®',
                    'breathe / clarify (mix respiratorio)': 'Breathe®',
                    'breathe / clarify (mix respiratório)': 'Breathe®',
                    'breathe': 'Breathe®',
                    'deep blue (mix suavizante)': 'dōTERRA Deep Blue®',
                    'deep blue': 'dōTERRA Deep Blue®',
                    'zengest / digestzen (mix digestivo)': 'ZenGest®',
                    'zengest': 'ZenGest®',
                    'serenity (mix repousante)': 'Serenity®',
                    'serenity': 'Serenity®',
                    'balance (mix aterrador)': 'Balance®',
                    'balance': 'Balance®',
                    'citrus bliss (mix revigorante)': 'Citrus Bliss®',
                    'citrus bliss': 'Citrus Bliss®',
                    'purify (mix purificador)': 'Purify®',
                    'purify': 'Purify®',
                    'pasttense (mix tensao)': 'PastTense®',
                    'pasttense': 'PastTense®',
                    'intune (mix foco)': 'InTune®',
                    'intune': 'InTune®',
                    'clarycalm (mix mensal mulher)': 'Clarycalm®',
                    'clarycalm': 'Clarycalm®',
                    'cheer (mix animador)': 'Cheer®',
                    'cheer': 'Cheer®',
                    'motivate (mix encorajador)': 'Motivate®',
                    'motivate': 'Motivate®',
                    'peace (mix tranquilizador)': 'Peace®',
                    'peace': 'Peace®',
                    'zendocrine (mix desintoxicante)': 'Zendocrine®',
                    'zendocrine': 'Zendocrine®',
                    'metapwr blend': 'MetaPWR™ Aroma Natural de Especiarias',
                    'metapwr': 'MetaPWR™ Aroma Natural de Especiarias',
                    'metapwr aroma': 'MetaPWR™ Aroma Natural de Especiarias',
                    'terrashield (mix repelente)': 'TerraShield®',
                    'terrashield': 'TerraShield®',
                    'whisper (mix para mulheres)': 'Whisper®',
                    'whisper': 'Whisper®',
                    'passion (mix inspirador)': 'Passion®',
                    'passion': 'Passion®',
                    'forgive (mix renovador)': 'Forgive®',
                    'forgive': 'Forgive®',
                    'console (mix consolador)': 'Console®',
                    'console': 'Console®',
                    'slim & sassy (mix metabolico)': 'MetaPWR™ Aroma Natural de Especiarias',
                    'slim & sassy': 'MetaPWR™ Aroma Natural de Especiarias',
                    'smart & sassy': 'MetaPWR™ Aroma Natural de Especiarias',
                    'slim sassy': 'MetaPWR™ Aroma Natural de Especiarias',
                    'thinker (kids)': 'dōTERRA Thinker®',
                    'calmer (kids)': 'dōTERRA Calmer®',
                    'stronger (kids)': 'dōTERRA Stronger®',
                    'rescuer (kids)': 'dōTERRA Rescuer®',
                    'steady (kids)': 'dōTERRA Steady®',
                    'brave (kids)': 'dōTERRA Brave®',
                    'tamer (kids)': 'dōTERRA Tamer®',
                    'copaiba softgels': 'Copaíba Softgels',
                    'peppermint softgels': 'Copaíba Softgels',
                    'zengest softgels': 'Copaíba Softgels',
                    'on guard softgels': 'On Guard®+ Pastilhas',
                    'balas breathe': 'Breathe Balm Stick',
                    'breathe balas': 'Breathe Balm Stick',
                    'balas on guard': 'On Guard® Creme Dental Clareador Natural',
                    'on guard balas': 'On Guard® Creme Dental Clareador Natural',
                    'difusor petal 2.0': 'Petal 2.0 Kit',
                    'difusor pebble': 'Kit com Difusor Pebble™',
                    'malama': 'Mālama',
                    'mãlama': 'Mālama',
                };

                const MANUAL_MAPPINGS = {};
                for (let k in RAW_MANUAL_MAPPINGS) {
                    MANUAL_MAPPINGS[cleanString(k)] = RAW_MANUAL_MAPPINGS[k];
                }

                const matchesSize = (pSize, iSize) => {
                    if (!iSize) return false;
                    const ps = pSize.toLowerCase().trim();
                    const is = iSize.toLowerCase().trim();
                    if (is === '15ml') return ps === '15 ml';
                    if (is === '5ml') return ps === '5 ml';
                    if (is === '30ml') return ps === '30 ml';
                    if (is === '10ml touch' || is === '10ml') return ps.includes('10 ml');
                    if (is === 'cápsulas') return ps.includes('capsula') || ps.includes('cápsula') || ps.includes('pastilha') || ps.includes('unidades');
                    if (is === 'unidade / kit') {
                        return !ps.includes('ml') || ps.includes('kit') || ps.includes('unidade');
                    }
                    return false;
                };

                const { rows } = await pool.query('SELECT id, nome_produto, ml_tamanho, categoria FROM estoque');
                console.log(`[016_sync_all_prices_2026] Sincronizando \${rows.length} itens do estoque...`);

                const targetSupplements = new Set([
                    "on guard pastilhas",
                    "on guard beadlets",
                    "peppermint beadlets",
                    "supermint beadlets",
                    "balas breathe",
                    "balas ginger",
                    "balas on guard"
                ]);

                const targetPersonalCare = new Set([
                    "creme dental on guard",
                    "pasta de dente on guard",
                    "on guard creme dental clareador natural"
                ]);

                let updatedCount = 0;
                for (let row of rows) {
                    let matchedProduct = null;
                    const key = row.nome_produto;
                    const size = row.ml_tamanho || 'Unidade / Kit';
                    
                    const cleanKey = cleanString(key);
                    let mappedName = MANUAL_MAPPINGS[cleanKey];
                    if (mappedName) {
                        if (typeof mappedName === 'object') {
                            mappedName = mappedName[size.toLowerCase()];
                        }
                        if (mappedName) {
                            matchedProduct = parsed.find(p => cleanString(p.name) === cleanString(mappedName) && matchesSize(p.size, size));
                            if (!matchedProduct) {
                                matchedProduct = parsed.find(p => cleanString(p.name) === cleanString(mappedName));
                            }
                        }
                    }
                    if (!matchedProduct) {
                        matchedProduct = parsed.find(p => cleanString(p.name) === cleanKey && matchesSize(p.size, size));
                    }
                    if (!matchedProduct) {
                        const possible = parsed.filter(p => matchesSize(p.size, size));
                        for (let p of possible) {
                            const cleanPName = cleanString(p.name);
                            if (cleanPName === cleanKey || cleanPName.includes(cleanKey) || cleanKey.includes(cleanPName)) {
                                if (cleanKey.includes('pastilha') && !cleanPName.includes('pastilha')) continue;
                                if (cleanKey.includes('beadlet') && !cleanPName.includes('beadlet')) continue;
                                if (cleanKey.includes('creme dental') && !cleanPName.includes('creme dental') && !cleanPName.includes('dental')) continue;
                                
                                matchedProduct = p;
                                break;
                            }
                        }
                    }

                    if (matchedProduct) {
                        let newCategory = row.categoria;
                        if (targetSupplements.has(cleanKey)) {
                            newCategory = 'Suplemento';
                        } else if (targetPersonalCare.has(cleanKey)) {
                            newCategory = 'Personal Care';
                        }

                        await pool.query(
                            'UPDATE estoque SET preco_venda = $1, preco_custo = $2, categoria = $3 WHERE id = $4',
                            [matchedProduct.reg, matchedProduct.mem, newCategory, row.id]
                        );
                        updatedCount++;
                    }
                }
                console.log(`[016_sync_all_prices_2026] \${updatedCount} itens atualizados com sucesso.`);
            } catch (e) {
                console.error("Erro na migração de preços 2026:", e);
            }
        }
    },
    // ── 018: Garantia do role admin para o usuário específico ────────────────────
    {
        name: '018_fix_admin_role_v2',
        async up(pool) {
            // Garante que o primeiro usuário registrado sempre tem role=admin
            await pool.query(`
                UPDATE consultoras SET role = 'admin'
                WHERE id = (SELECT id FROM consultoras ORDER BY criado_em ASC LIMIT 1)
                  AND (role IS NULL OR role != 'admin')
            `);
            // Se ADMIN_EMAIL configurado, também garante por email
            if (process.env.ADMIN_EMAIL) {
                await pool.query(
                    "UPDATE consultoras SET role = 'admin' WHERE email = $1",
                    [process.env.ADMIN_EMAIL]
                );
            }
            
            // 🔥 HARDCODE FIX FOR WILLIAN: Ensure Willian is ALWAYS admin regardless of ENV
            await pool.query(`
                UPDATE consultoras SET role = 'admin' 
                WHERE email = 'willian12comunixcomdeus@gmail.com'
            `);

            // Invalida tokens antigos do admin (que podem ter role errado) incrementando token_version
            await pool.query(`
                UPDATE consultoras SET token_version = COALESCE(token_version, 1) + 1
                WHERE role = 'admin'
            `);
            console.log('[018_fix_admin_role_v2] Role de admin garantido para Willian e tokens antigos invalidados.');
        }
    },
    // ── 019: Ajuste do preço do Lavanda Touch no estoque ─────────────────────────
    {
        name: '019_fix_lavanda_touch_price_2026',
        async up(pool) {
            await pool.query(
                `UPDATE estoque 
                 SET preco_venda = 160.00, preco_custo = 120.00 
                 WHERE nome_produto ILIKE '%lavanda touch%' 
                    OR nome_produto ILIKE '%lavender touch%'`
            );
            console.log('[019_fix_lavanda_touch_price_2026] Preço de Lavanda Touch ajustado no estoque.');
        }
    },
    // ── 020: Módulo de equipes e tabelas relacionadas ─────────────────────────────
    {
        name: '020_modulo_equipe',
        async up(pool) {
            // 1. Tabela de Equipes
            await pool.query(`
                CREATE TABLE IF NOT EXISTS equipes (
                  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                  lider_id       UUID NOT NULL UNIQUE REFERENCES consultoras(id) ON DELETE CASCADE,
                  nome_equipe    VARCHAR(150) NOT NULL,
                  codigo_convite VARCHAR(30) UNIQUE NOT NULL,
                  criado_em      TIMESTAMPTZ DEFAULT NOW(),
                  atualizado_em  TIMESTAMPTZ DEFAULT NOW()
                )
            `);

            // 2. Colunas de equipe em consultoras
            await pool.query(`
                ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS equipe_id UUID REFERENCES equipes(id) ON DELETE SET NULL
            `);
            await pool.query(`
                ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS rank_doterra VARCHAR(50) DEFAULT 'Consultor'
            `);

            // 3. Controle de Delegações
            await pool.query(`
                CREATE TABLE IF NOT EXISTS equipe_delegacoes (
                  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                  cliente_id            UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
                  lider_id              UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
                  liderado_id           UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
                  status_devolutiva     VARCHAR(30) DEFAULT 'pendente',
                  notas_lider           TEXT,
                  criado_em             TIMESTAMPTZ DEFAULT NOW(),
                  atualizado_em         TIMESTAMPTZ DEFAULT NOW()
                )
            `);

            // 4. Suporte em clientes
            await pool.query(`
                ALTER TABLE clientes ADD COLUMN IF NOT EXISTS compartilhado_de_lider_id UUID REFERENCES consultoras(id) ON DELETE SET NULL
            `);
            await pool.query(`
                ALTER TABLE clientes ADD COLUMN IF NOT EXISTS delegacao_id UUID REFERENCES equipe_delegacoes(id) ON DELETE SET NULL
            `);

            // 5. Mural de Avisos
            await pool.query(`
                CREATE TABLE IF NOT EXISTS equipe_avisos (
                  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                  equipe_id      UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
                  titulo         VARCHAR(150) NOT NULL,
                  mensagem       TEXT NOT NULL,
                  data_reuniao   TIMESTAMPTZ,
                  link_reuniao   VARCHAR(255),
                  criado_em      TIMESTAMPTZ DEFAULT NOW()
                )
            `);

            // Confirmações
            await pool.query(`
                CREATE TABLE IF NOT EXISTS equipe_aviso_confirmacoes (
                  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                  aviso_id       UUID NOT NULL REFERENCES equipe_avisos(id) ON DELETE CASCADE,
                  consultora_id  UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
                  confirmado_em  TIMESTAMPTZ DEFAULT NOW(),
                  UNIQUE(aviso_id, consultora_id)
                )
            `);

            // 6. Biblioteca
            await pool.query(`
                CREATE TABLE IF NOT EXISTS equipe_biblioteca (
                  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                  equipe_id      UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
                  categoria      VARCHAR(50) NOT NULL,
                  titulo         VARCHAR(150) NOT NULL,
                  descricao      TEXT,
                  url_midia      VARCHAR(255),
                  conteudo_texto TEXT,
                  criado_em      TIMESTAMPTZ DEFAULT NOW()
                )
            `);

            // 7. Campo tem_equipe em planos
            await pool.query(`
                ALTER TABLE planos ADD COLUMN IF NOT EXISTS tem_equipe BOOLEAN DEFAULT FALSE
            `);
            await pool.query(`
                UPDATE planos SET tem_equipe = TRUE WHERE slug IN ('pro', 'enterprise')
            `);

            console.log('[020_modulo_equipe] Tabelas e campos do módulo de equipes inicializados com sucesso.');
        }
    },
    // ── 021: Histórico de Web Push e Cliques por Equipe ─────────────────────────
    {
        name: '021_equipe_push_historico',
        async up(pool) {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS equipe_push_historico (
                  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                  equipe_id      UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
                  mensagem       TEXT NOT NULL,
                  total_enviados INT DEFAULT 0,
                  cliques_qtd       INT DEFAULT 0,
                  criado_em      TIMESTAMPTZ DEFAULT NOW()
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS equipe_push_clicks (
                  push_id       UUID NOT NULL REFERENCES equipe_push_historico(id) ON DELETE CASCADE,
                  consultora_id UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
                  clicado_em    TIMESTAMPTZ DEFAULT NOW(),
                  PRIMARY KEY (push_id, consultora_id)
                )
            `);

            await pool.query(`CREATE INDEX IF NOT EXISTS idx_equipe_push_hist ON equipe_push_historico(equipe_id)`);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_equipe_push_clicks ON equipe_push_clicks(push_id)`);
            
            console.log('[021_equipe_push_historico] Tabelas de histórico e cliques de push criadas.');
        }
    },
    // ── 022: Limites e Acesso a Equipes por Plano ───────────────────────────────
    {
        name: '022_plano_limite_equipe',
        async up(pool) {
            await pool.query(`
                ALTER TABLE planos ADD COLUMN IF NOT EXISTS limite_membros_equipe INTEGER DEFAULT NULL
            `);
            await pool.query(`
                UPDATE planos SET limite_membros_equipe = 5 WHERE slug = 'pro'
            `);
            await pool.query(`
                UPDATE planos SET limite_membros_equipe = 20 WHERE slug = 'enterprise'
            `);
            console.log('[022_plano_limite_equipe] Limites e acesso de equipe atualizados com sucesso.');
        }
    },
    // ── 023: Desafios e Gamificação por Equipe ──────────────────────────────────
    {
        name: '023_equipe_gamificacao',
        async up(pool) {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS equipe_desafios (
                  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                  equipe_id     UUID NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
                  titulo        VARCHAR(200) NOT NULL,
                  descricao     TEXT,
                  tipo_desafio  VARCHAR(20) NOT NULL DEFAULT 'individual',
                  objetivo_tipo VARCHAR(50) NOT NULL,
                  meta          NUMERIC(10,2) NOT NULL,
                  data_inicio   DATE NOT NULL,
                  data_fim      DATE NOT NULL,
                  criado_em     TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            await pool.query(`CREATE INDEX IF NOT EXISTS idx_equipe_desafios_eq ON equipe_desafios(equipe_id)`);
            console.log('[023_equipe_gamificacao] Tabela de desafios da equipe criada com sucesso.');
        }
    },
    // ── 024: Deixar a faixa de escassez (ultimas vagas) opcional para as consultoras ────────────────
    {
        name: '024_exibir_escassez_consultoras',
        async up(pool) {
            await pool.query(`
                ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS exibir_escassez BOOLEAN DEFAULT TRUE
            `);
            console.log('[024_exibir_escassez_consultoras] Coluna exibir_escassez adicionada à tabela consultoras.');
        }
    },
    // ── 025: Ajuste de preço do Grapefruit/Toranja no estoque ────────────────────────
    {
        name: '025_fix_grapefruit_toranja_prices_2026',
        async up(pool) {
            // Update 5ml prices
            await pool.query(
                `UPDATE estoque 
                 SET preco_venda = 73.00, preco_custo = 55.00 
                 WHERE (nome_produto ILIKE '%toranja%' OR nome_produto ILIKE '%grapefruit%')
                   AND (ml_tamanho ILIKE '%5ml%' OR ml_tamanho ILIKE '%5 ml%')`
            );
            // Update 15ml prices
            await pool.query(
                `UPDATE estoque 
                 SET preco_venda = 187.00, preco_custo = 140.00 
                 WHERE (nome_produto ILIKE '%toranja%' OR nome_produto ILIKE '%grapefruit%')
                   AND (ml_tamanho ILIKE '%15ml%' OR ml_tamanho ILIKE '%15 ml%')`
            );
            console.log('[025_fix_grapefruit_toranja_prices_2026] Preço de Grapefruit / Toranja adjusted in estoque.');
        }
    },
    // ── 026: Criar tabelas para Aulas e Estratégias ──────────────────────────
    {
        name: '026_aulas_estrategias_schema',
        async up(pool) {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS aulas_modulos (
                  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                  titulo    VARCHAR(255) NOT NULL,
                  ordem     INT DEFAULT 0,
                  criado_em TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            await pool.query(`
                CREATE TABLE IF NOT EXISTS aulas_conteudo (
                  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                  modulo_id UUID NOT NULL REFERENCES aulas_modulos(id) ON DELETE CASCADE,
                  titulo    VARCHAR(255) NOT NULL,
                  descricao TEXT,
                  video_url TEXT NOT NULL,
                  duracao   VARCHAR(50),
                  ordem     INT DEFAULT 0,
                  criado_em TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            await pool.query(`
                CREATE INDEX IF NOT EXISTS idx_aulas_conteudo_modulo ON aulas_conteudo(modulo_id)
            `);
            console.log('[026_aulas_estrategias_schema] Tabelas de aulas e estratégias criadas.');
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
