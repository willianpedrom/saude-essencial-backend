/**
 * migrate_relink_anamneses.js
 * 
 * Recupera anamneses preenchidas que ficaram desvinculadas dos seus clientes.
 * 
 * Funcionamento:
 * 1. Encontra anamneses onde cliente_id IS NULL ou cliente_id aponta para um registro que não existe
 * 2. Busca o email/telefone dentro do JSONB dados.personal
 * 3. Tenta encontrar o cliente correto pelo email ou telefone
 * 4. Se encontrar, atualiza o cliente_id da anamnese
 * 
 * TAMBÉM:
 * 5. Para anamneses genéricas (subtipo='generico'), onde o cliente_id aponta para
 *    um cliente DUPLICADO (criado no momento do formulário mas diferente do original),
 *    re-vincula ao cliente mais antigo com o mesmo email.
 * 
 * Uso: node migrate_relink_anamneses.js
 */

require('dotenv').config();
const pool = require('./src/db/pool');

async function main() {
    console.log('🔄 Iniciando re-vinculação de anamneses...\n');
    
    let fixed = 0;
    let skipped = 0;
    
    // 1. Busca todas as anamneses preenchidas sem cliente_id ou com cliente_id inválido
    const { rows: orphans } = await pool.query(`
        SELECT a.id, a.consultora_id, a.dados, a.subtipo, a.cliente_id
        FROM anamneses a
        WHERE a.preenchido = TRUE
          AND (
            a.cliente_id IS NULL
            OR NOT EXISTS (SELECT 1 FROM clientes c WHERE c.id = a.cliente_id AND c.consultora_id = a.consultora_id)
          )
        ORDER BY a.criado_em ASC
    `);
    
    console.log(`📊 Encontradas ${orphans.length} anamneses órfãs (sem cliente vinculado válido)\n`);
    
    for (const anamnese of orphans) {
        const dados = anamnese.dados || {};
        const pData = dados.personal || dados || {};
        
        const email = pData.email || null;
        const telefone = pData.phone || pData.telefone || null;
        const nome = pData.full_name || pData.nome || null;
        
        if (!email && !telefone) {
            console.log(`  ⚠️  Anamnese ${anamnese.id}: sem email ou telefone nos dados — pulando`);
            skipped++;
            continue;
        }
        
        // Tenta encontrar o cliente correto pelo email ou telefone
        let params = [anamnese.consultora_id];
        let conditions = [];
        if (email) {
            params.push(email);
            conditions.push(`email = $${params.length}`);
        }
        if (telefone) {
            params.push(telefone);
            conditions.push(`telefone = $${params.length}`);
        }
        
        const { rows: matches } = await pool.query(`
            SELECT id, nome, email, telefone, criado_em
            FROM clientes
            WHERE consultora_id = $1
              AND (${conditions.join(' OR ')})
            ORDER BY criado_em ASC
            LIMIT 1
        `, params);
        
        if (matches.length === 0) {
            console.log(`  ⚠️  Anamnese ${anamnese.id} (${nome || 'sem nome'}): cliente não encontrado — pulando`);
            skipped++;
            continue;
        }
        
        const cliente = matches[0];
        
        if (anamnese.cliente_id === cliente.id) {
            console.log(`  ✅  Anamnese ${anamnese.id}: já vinculada corretamente ao cliente ${cliente.nome}`);
            skipped++;
            continue;
        }
        
        // Atualiza o cliente_id
        await pool.query(
            'UPDATE anamneses SET cliente_id = $1 WHERE id = $2',
            [cliente.id, anamnese.id]
        );
        
        console.log(`  🔗  Anamnese ${anamnese.id} (${nome || 'sem nome'}) → vinculada ao cliente ${cliente.nome} (ID: ${cliente.id})`);
        fixed++;
    }
    
    // 2. Caso especial: anamneses genéricas onde existe duplicata de cliente
    //    (formulário genérico criou cliente novo mesmo tendo o cliente já cadastrado)
    console.log('\n📊 Verificando duplicatas de clientes criadas por links genéricos...\n');
    
    const { rows: genericAnamneses } = await pool.query(`
        SELECT a.id, a.consultora_id, a.dados, a.cliente_id,
               c.email as cliente_email, c.telefone as cliente_tel, c.nome as cliente_nome, c.criado_em
        FROM anamneses a
        JOIN clientes c ON c.id = a.cliente_id  
        WHERE a.preenchido = TRUE
          AND a.subtipo = 'generico'
          AND c.email IS NOT NULL
        ORDER BY a.criado_em ASC
    `);
    
    for (const anamnese of genericAnamneses) {
        // Encontra o cliente mais antigo com o mesmo email (o "original")
        const { rows: older } = await pool.query(`
            SELECT id, nome FROM clientes
            WHERE consultora_id = $1
              AND email = $2
              AND id != $3
            ORDER BY criado_em ASC
            LIMIT 1
        `, [anamnese.consultora_id, anamnese.cliente_email, anamnese.cliente_id]);
        
        if (older.length > 0) {
            await pool.query(
                'UPDATE anamneses SET cliente_id = $1 WHERE id = $2',
                [older[0].id, anamnese.id]
            );
            console.log(`  🔗  Anamnese genérica ${anamnese.id} (${anamnese.cliente_nome}) → re-vinculada ao cliente original ${older[0].nome} (ID: ${older[0].id})`);
            fixed++;
        }
    }
    
    console.log(`\n✅ Migração concluída!`);
    console.log(`   Corrigidas: ${fixed}`);
    console.log(`   Puladas:    ${skipped}`);
    
    await pool.end();
}

main().catch(err => {
    console.error('ERRO FATAL:', err);
    process.exit(1);
});
