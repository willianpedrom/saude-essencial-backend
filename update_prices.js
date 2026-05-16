const fs = require('fs');

// 1. Parse OCR text
const txt = fs.readFileSync('pdf_ocr.txt', 'utf8');
const lines = txt.split('\n');

const newPrices = [];

lines.forEach(line => {
    let m = line.match(/(.+?)\s+(?:R\$\s*([\d,.]+))\s+(?:R\$\s*([\d,.]+))\s+(\d+)$/);
    if (!m) return;
    
    let prefix = m[1].trim();
    let codeMatch = prefix.match(/^(\d+)\s+(.+)$/);
    if (!codeMatch) return;
    
    let nameAndSize = codeMatch[2].trim();
    
    // Extract size
    let sizeMatch = nameAndSize.match(/(.*)\s+(\d+\s*(?:ml|g|litro|litros|pastilhas|cápsulas)|10 ml Touch|5ml|15ml|Caixa|Kit|Unidade|5 bisna gas)$/i);
    
    let name = nameAndSize;
    let size = 'Unidade / Kit';
    
    if (sizeMatch) {
        name = sizeMatch[1].trim();
        size = sizeMatch[2].trim();
        if (size.match(/^\d+\s*ml$/i)) size = size.replace(/\s+/g, '').toLowerCase();
        if (size.toLowerCase() === 'caixa') size = 'Caixa';
        if (size.toLowerCase() === 'kit') size = 'Kit';
        if (size.toLowerCase() === 'unidade') size = 'Unidade';
        if (size.includes('pastilhas') || size.includes('cápsulas')) size = 'Cápsulas';
    }
    
    name = name.replace(/[®™]/g, '').trim();
    
    let r = parseFloat(m[2].replace(/\./g, '').replace(',', '.'));
    let member = parseFloat(m[3].replace(/\./g, '').replace(',', '.'));
    
    newPrices.push({ name, size, r, m: member });
});

// 2. Read Inventory.js
let inventoryJs = fs.readFileSync('public/js/pages/Inventory.js', 'utf8');

// Use regex or eval to get DOTERRA_PRICES block
const startStr = 'const DOTERRA_PRICES = {';
const startIdx = inventoryJs.indexOf(startStr);
let endIdx = inventoryJs.indexOf('};', startIdx);
let dictStr = inventoryJs.substring(startIdx + startStr.length, endIdx);

// It's a JS object string, let's use a simpler approach.
// We can use eval to parse it.
let oldPricesObj;
eval('oldPricesObj = {' + dictStr + '}');

let updatedCount = 0;

for (let key in oldPricesObj) {
    for (let size in oldPricesObj[key]) {
        // Find best match in newPrices
        let strippedKey = key.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').replace(/[®™]/g, '').trim();
        let bestMatch = null;
        let highestScore = -1;

        for (let np of newPrices) {
            let npStripped = np.name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').replace(/\s*-\s*.+$/g, '').trim();
            // Try exact match or includes
            if (npStripped === strippedKey || np.name.toLowerCase().includes(strippedKey) || key.toLowerCase().includes(npStripped)) {
                // Size must match roughly
                let sizeMatch = false;
                if (size === np.size) sizeMatch = true;
                if (size === '10ml Touch' && np.size.includes('Touch')) sizeMatch = true;
                if (size === 'Cápsulas' && np.size.includes('Cápsulas')) sizeMatch = true;
                if (size === 'Unidade / Kit' && (np.size === 'Unidade / Kit' || np.size === 'Unidade' || np.size === 'Caixa' || np.size === 'Kit' || np.size.includes('g') || np.size.includes('litro'))) sizeMatch = true;
                
                // Fallback for missing size in OCR
                if (np.size === 'Unidade / Kit' && size !== 'Unidade / Kit') sizeMatch = true; 

                if (sizeMatch) {
                    // Let's give score
                    let score = 1;
                    if (npStripped === strippedKey) score += 10;
                    if (size === np.size) score += 5;
                    
                    if (score > highestScore) {
                        highestScore = score;
                        bestMatch = np;
                    }
                }
            }
        }

        if (bestMatch) {
            if (oldPricesObj[key][size].r !== bestMatch.r || oldPricesObj[key][size].m !== bestMatch.m) {
                // console.log(`Updating ${key} [${size}]: R$${oldPricesObj[key][size].r} -> R$${bestMatch.r}`);
                oldPricesObj[key][size].r = bestMatch.r;
                oldPricesObj[key][size].m = bestMatch.m;
                updatedCount++;
            }
        } else {
            console.log(`No match found for: ${key} [${size}]`);
        }
    }
}

console.log(`Updated ${updatedCount} prices.`);

// Serialize back
let newDictStr = '{\n';
for (let key in oldPricesObj) {
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
