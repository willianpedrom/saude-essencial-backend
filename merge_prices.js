const fs = require('fs');

const newPrices = JSON.parse(fs.readFileSync('new_prices.json', 'utf8'));
let inventoryJs = fs.readFileSync('public/js/pages/Inventory.js', 'utf8');

const startStr = 'const DOTERRA_PRICES = {';
const startIdx = inventoryJs.indexOf(startStr);
const endIdx = inventoryJs.indexOf('};', startIdx);
const dictStr = inventoryJs.substring(startIdx + startStr.length, endIdx);

let oldPricesObj;
eval('oldPricesObj = {' + dictStr + '}');

let updatedCount = 0;
let unmatched = [];

for (let key in oldPricesObj) {
    let cleanOldName = key.replace(/\(.*?\)/g, '').replace(/[®™]/g, '').trim().toLowerCase();
    
    // Check aliases in key e.g. "Alecrim (Rosemary)" -> also check "rosemary"
    let matchInsideParens = key.match(/\((.*?)\)/);
    let aliasOldName = matchInsideParens ? matchInsideParens[1].toLowerCase().trim() : '';

    for (let size in oldPricesObj[key]) {
        let cleanOldSize = size.toLowerCase();
        if (cleanOldSize.includes('unidade') || cleanOldSize.includes('kit')) cleanOldSize = 'unidade / kit';
        if (cleanOldSize.includes('cápsula')) cleanOldSize = 'cápsulas';
        
        let bestMatch = null;
        let bestScore = -1;
        
        for (let np of newPrices) {
            let parts = np.name.replace(/\(.*?\)/g, '').replace(/[®™]/g, '').split('-').map(p => p.trim().toLowerCase());
            let cleanNpName1 = parts[0] || '';
            let cleanNpName2 = parts[1] || '';
            
            let cleanNpSize = np.size.toLowerCase();
            if (cleanNpSize.includes('unidade') || cleanNpSize.includes('kit') || cleanNpSize.includes('g') || cleanNpSize.includes('litro')) cleanNpSize = 'unidade / kit';
            if (cleanNpSize.includes('pastilha') || cleanNpSize.includes('cápsula')) cleanNpSize = 'cápsulas';
            
            if (cleanOldSize === 'cápsulas' && cleanNpSize === 'cápsulas') {
                // good
            } else if (cleanOldSize === 'cápsulas' && key.toLowerCase().includes('pastilha')) {
                cleanNpSize = 'cápsulas';
            }

            let nameMatch = false;
            if (cleanNpName1 === cleanOldName || cleanNpName1.includes(cleanOldName) || cleanOldName.includes(cleanNpName1)) nameMatch = true;
            if (cleanNpName2 && (cleanNpName2 === cleanOldName || cleanNpName2.includes(cleanOldName) || cleanOldName.includes(cleanNpName2))) nameMatch = true;
            
            if (aliasOldName) {
                if (cleanNpName1 === aliasOldName || cleanNpName1.includes(aliasOldName) || aliasOldName.includes(cleanNpName1)) nameMatch = true;
                if (cleanNpName2 && (cleanNpName2 === aliasOldName || cleanNpName2.includes(aliasOldName) || aliasOldName.includes(cleanNpName2))) nameMatch = true;
            }
            
            if (cleanOldName === 'melaleuca' && np.name.toLowerCase().includes('tea tree')) nameMatch = true;
            if (cleanOldName === 'zen gest' && cleanNpName1.includes('zengest')) nameMatch = true;
            if (cleanOldName === 'copaiba' && cleanNpName1.includes('copaíba')) nameMatch = true;
            if (cleanOldName.includes('olíbano') && np.name.toLowerCase().includes('frankincense')) nameMatch = true;
            if (cleanOldName.includes('laranja doce') && np.name.toLowerCase().includes('wild orange')) nameMatch = true;
            
            let sizeMatch = false;
            if (cleanOldSize === cleanNpSize) sizeMatch = true;
            if (cleanOldSize === '10ml touch' && cleanNpSize.includes('touch')) sizeMatch = true;
            if (cleanOldSize === 'unidade / kit' && cleanNpSize === 'cápsulas' && (key.toLowerCase().includes('pastilha') || key.toLowerCase().includes('cápsula'))) sizeMatch = true;
            
            if (nameMatch && sizeMatch) {
                let score = 1;
                if (cleanNpName1 === cleanOldName || cleanNpName2 === cleanOldName) score += 10;
                if (cleanOldSize === cleanNpSize) score += 5;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = np;
                }
            }
        }
        
        if (bestMatch) {
            if (oldPricesObj[key][size].r !== bestMatch.reg || oldPricesObj[key][size].m !== bestMatch.mem) {
                oldPricesObj[key][size].r = bestMatch.reg;
                oldPricesObj[key][size].m = bestMatch.mem;
                updatedCount++;
            }
        } else {
            unmatched.push(`${key} [${size}]`);
        }
    }
}

console.log(`Updated ${updatedCount} prices.`);
console.log("Unmatched:", unmatched.length);

let newDictStr = '{\n';
for (let key of Object.keys(oldPricesObj)) {
    newDictStr += `    '${key}': { `;
    let sizeStrs = [];
    for (let size in oldPricesObj[key]) {
        sizeStrs.push(`'${size}': { r: ${oldPricesObj[key][size].r}, m: ${oldPricesObj[key][size].m} }`);
    }
    newDictStr += sizeStrs.join(', ') + ' },\n';
}
newDictStr += '}';

let newInventoryJs = inventoryJs.substring(0, startIdx + startStr.length - 1) + newDictStr + inventoryJs.substring(endIdx + 1);

fs.writeFileSync('public/js/pages/Inventory.js', newInventoryJs);
console.log('Inventory.js updated!');
