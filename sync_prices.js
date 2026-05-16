const fs = require('fs');

const invContent = fs.readFileSync(__dirname + '/public/js/pages/Inventory.js', 'utf-8');

const pricesMatch = invContent.match(/const DOTERRA_PRICES = (\{[\s\S]*?\});/);
const aliasesMatch = invContent.match(/const DOTERRA_ALIASES = (\{[\s\S]*?\});/);

let DOTERRA_PRICES = {};
let ALIASES = {};

eval('DOTERRA_PRICES = ' + pricesMatch[1]);
eval('ALIASES = ' + aliasesMatch[1]);

function getPriceFromInventory(name, size) {
    let lowerName = name.toLowerCase().trim();
    // try to resolve alias
    if (ALIASES[lowerName]) lowerName = ALIASES[lowerName].toLowerCase();
    
    // search in DOTERRA_PRICES (keys are not strictly lowercased but some might be)
    let bestKey = null;
    for (let k of Object.keys(DOTERRA_PRICES)) {
        if (k.toLowerCase() === lowerName || k.toLowerCase().includes(lowerName)) {
            bestKey = k;
            break;
        }
    }
    
    // If not found, try without " Touch"
    if (!bestKey && lowerName.includes('touch')) {
        let base = lowerName.replace('touch', '').trim();
        for (let k of Object.keys(DOTERRA_PRICES)) {
            if (k.toLowerCase() === base || k.toLowerCase().includes(base)) {
                bestKey = k;
                break;
            }
        }
    }
    
    if (bestKey) {
        let sizesDict = DOTERRA_PRICES[bestKey];
        // try to match size
        // size might be "15 ml", "10 ml Touch", "15ml"
        let sClean = size.toLowerCase().replace(' ml', 'ml');
        if (sClean === '10ml touch') sClean = '10ml';
        
        // Let's just find the first key in sizesDict that includes the number
        let numMatch = sClean.match(/\d+/);
        if (numMatch) {
            let num = numMatch[0];
            for (let sk of Object.keys(sizesDict)) {
                if (sk.includes(num)) {
                    return sizesDict[sk];
                }
            }
        }
        
        // If not found by number, just return the first size
        return Object.values(sizesDict)[0];
    }
    
    return null;
}

const oilsContent = fs.readFileSync(__dirname + '/public/js/oils.js', 'utf-8');

// Replace prices in OILS_DATABASE sizes arrays
let updatedOils = oilsContent;

let currentOil = '';
updatedOils = updatedOils.replace(/'([^']+)': \{([^}]+)sizes:\s*\[(.*?)\]([^}]*)\}/g, (match, oilName, before, arrayInner, after) => {
    let sizesArr;
    try {
        sizesArr = eval('[' + arrayInner + ']');
    } catch(e) {
        return match;
    }
    
    let changed = false;
    for (let sObj of sizesArr) {
        let p = getPriceFromInventory(oilName, sObj.size);
        if (p) {
            if (sObj.regular !== p.r || sObj.member !== p.m) {
                sObj.regular = p.r;
                sObj.member = p.m;
                changed = true;
            }
        } else {
            console.log("Could not map price for:", oilName, sObj.size);
        }
    }
    
    if (changed) {
        let newSizes = JSON.stringify(sizesArr).replace(/"([^"]+)":/g, '"$1": ').replace(/,/g, ', ');
        return `'${oilName}': {${before}sizes: ${newSizes}${after}}`;
    }
    return match;
});

fs.writeFileSync(__dirname + '/public/js/oils.js', updatedOils);
console.log('Done mapping prices');
