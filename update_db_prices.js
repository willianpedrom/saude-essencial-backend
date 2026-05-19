const pool = require('./src/db/pool');
const fs = require('fs');
require('dotenv').config();

const newPrices = JSON.parse(fs.readFileSync('new_prices.json', 'utf8'));

async function run() {
    try {
        let updated = 0;
        console.log('Fetching estoque...');
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
        
        console.log(`Updated ${updated} items in estoque table.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
