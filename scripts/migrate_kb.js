const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Carrega .env do root
const pool = require('../src/db/pool');

// Importamos os dados atuais do data.js (simulado via require se possível, ou parse de string)
// Como o arquivo exporta constantes, vamos tentar ler o conteúdo dele de forma bruta
// ou usar um pequeno truque de execução.
const dataPath = path.join(__dirname, '../public/js/data.js');

async function migrate() {
    console.log('--- Iniciando Migração da Base de Conhecimento ---');
    
    // 1. Aplicar Schema
    const schema = fs.readFileSync(path.join(__dirname, '../src/db/migrations/kb_schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ Schema aplicado com sucesso.');

    // 2. Carregar dados do data.js (Extração via Regex simples para evitar problemas de ESM)
    const dataContent = fs.readFileSync(dataPath, 'utf8');
    
    // Extrair OILS_DATABASE
    const oilsMatch = dataContent.match(/export const OILS_DATABASE = ({[\s\S]+?});/);
    const protocolsMatch = dataContent.match(/export const PROTOCOLS = ({[\s\S]+?});/);
    const kitMatch = dataContent.match(/export const LIVING_KIT = new Set\(\[([\s\S]+?)\]\);/);

    if (!oilsMatch || !protocolsMatch) {
        console.error('❌ Não foi possível extrair dados do data.js');
        process.exit(1);
    }

    // Avaliar objetos (CUIDADO: Isso usa eval mas num ambiente controlado de build/migration é aceitável se os dados forem confiáveis)
    // Ajuste: Vamos limpar os comentários e exports para o eval funcionar
    const oilsRaw = oilsMatch[1];
    const protocolsRaw = protocolsMatch[1];
    
    const OILS_DATABASE = eval(`(${oilsRaw})`);
    const PROTOCOLS = eval(`(${protocolsRaw})`);
    
    let livingKitList = [];
    if (kitMatch) {
        livingKitList = kitMatch[1].replace(/'/g, '').split(',').map(s => s.trim()).filter(Boolean);
    }

    console.log(`📊 Encontrados: ${Object.keys(OILS_DATABASE).length} óleos e ${Object.keys(PROTOCOLS).length} protocolos base.`);

    // 3. Inserir Óleos
    for (const [name, info] of Object.entries(OILS_DATABASE)) {
        await pool.query(`
            INSERT INTO kb_oils (name, name_en, category, function, uses, apply_topical, apply_aromatic, apply_internal, prices, is_kit_living)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (name) DO UPDATE SET
                name_en = EXCLUDED.name_en,
                category = EXCLUDED.category,
                function = EXCLUDED.function,
                uses = EXCLUDED.uses,
                prices = EXCLUDED.prices,
                is_kit_living = EXCLUDED.is_kit_living
        `, [
            name,
            info.nameEn || null,
            info.cat || 'single',
            info.fn || null,
            info.uses || null,
            info.topical || null,
            info.aromatic || null,
            info.apply_internal || null,
            JSON.stringify(info.sizes || []),
            livingKitList.includes(name)
        ]);
    }
    console.log('✅ Banco de óleos importado.');

    // 4. Inserir Protocolos
    for (const [symptom, p] of Object.entries(PROTOCOLS)) {
        const { rows } = await pool.query(`
            INSERT INTO kb_protocols (symptom, focus, icon, therapeutic_objective, routine, expected_results, affirmation, safety_alert)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (symptom) DO UPDATE SET
                focus = EXCLUDED.focus,
                icon = EXCLUDED.icon,
                therapeutic_objective = EXCLUDED.therapeutic_objective,
                routine = EXCLUDED.routine,
                expected_results = EXCLUDED.expected_results,
                affirmation = EXCLUDED.affirmation,
                safety_alert = EXCLUDED.safety_alert
            RETURNING id
        `, [
            symptom,
            p.focus || null,
            p.icon || null,
            p.therapeuticObjective || null,
            JSON.stringify(p.routine || {}),
            p.expectedResults || null,
            p.affirmation || null,
            p.safetyAlert || p.safety || null
        ]);

        const protocolId = rows[0].id;

        // Inserir recomendações de óleos
        if (p.oils && Array.isArray(p.oils)) {
            for (const oil of p.oils) {
                const oilName = typeof oil === 'string' ? oil : oil.name;
                await pool.query(`
                    INSERT INTO kb_protocol_oils (protocol_id, oil_name)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                `, [protocolId, oilName]);
            }
        }
    }
    console.log('✅ Protocolos base importados.');
    
    console.log('--- Migração Concluída com Sucesso ---');
    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ Erro na migração:', err);
    process.exit(1);
});
