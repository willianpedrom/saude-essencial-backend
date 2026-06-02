const fs = require('fs');

const newPrices = JSON.parse(fs.readFileSync('new_prices.json', 'utf8'));
let inventoryJs = fs.readFileSync('public/js/pages/Inventory.js', 'utf8');

const startStr = 'const DOTERRA_PRICES = {';
const startIdx = inventoryJs.indexOf(startStr);
let endIdx = inventoryJs.indexOf('};', startIdx);
let dictStr = inventoryJs.substring(startIdx + startStr.length, endIdx);

let oldPricesObj;
eval('oldPricesObj = {' + dictStr + '}');

let updatedCount = 0;

for (let key in oldPricesObj) {
    for (let size in oldPricesObj[key]) {
        let strippedKey = key.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').replace(/[®™]/g, '').trim();
        let bestMatch = null;
        let highestScore = -1;

        for (let np of newPrices) {
            let npStripped = np.name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').replace(/\s*-\s*.+$/g, '').trim();
            if (npStripped === strippedKey || np.name.toLowerCase().includes(strippedKey) || key.toLowerCase().includes(npStripped)) {
                let sizeMatch = false;
                if (size.toLowerCase() === np.size.toLowerCase()) sizeMatch = true;
                if (size === '10ml Touch' && np.size.toLowerCase().includes('touch')) sizeMatch = true;
                if (size === 'Cápsulas' && np.size.includes('Cápsulas')) sizeMatch = true;
                if (size === 'Unidade / Kit' && (np.size === 'Unidade / Kit' || np.size === 'Unidade' || np.size === 'Caixa' || np.size === 'Kit' || np.size.includes('g') || np.size.includes('litro'))) sizeMatch = true;
                if (np.size === 'Unidade / Kit' && size !== 'Unidade / Kit') sizeMatch = true; 

                if (sizeMatch) {
                    let score = 1;
                    if (npStripped === strippedKey) score += 10;
                    if (size.toLowerCase() === np.size.toLowerCase()) score += 5;
                    
                    if (score > highestScore) {
                        highestScore = score;
                        bestMatch = np;
                    }
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
            console.log(`No match found for: ${key} [${size}]`);
        }
    }
}

console.log(`Updated ${updatedCount} prices.`);

let newDictStr = '{\n';
// sort keys alphabetically to maintain consistency if needed, but let's keep original order.
// JS object iteration order is not guaranteed but usually insertion order. Let's just output it.
for (let key of Object.keys(oldPricesObj).sort()) {
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
