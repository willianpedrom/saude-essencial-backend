const fs = require('fs');

const invContent = fs.readFileSync(__dirname + '/public/js/pages/Inventory.js', 'utf-8');

const pricesMatch = invContent.match(/const DOTERRA_PRICES = (\{[\s\S]*?\});\s*\/\//);
const aliasesMatch = invContent.match(/const DOTERRA_ALIASES = (\{[\s\S]*?\});/);

let DOTERRA_PRICES = {};
let DOTERRA_ALIASES = {};

let pricesStr = invContent.substring(invContent.indexOf('const DOTERRA_PRICES = {'), invContent.indexOf('const DOTERRA_ALIASES'));
pricesStr = pricesStr.replace('const DOTERRA_PRICES = ', '').trim();
if (pricesStr.endsWith(';')) pricesStr = pricesStr.slice(0, -1);

let aliasesStr = invContent.substring(invContent.indexOf('const DOTERRA_ALIASES = {'), invContent.indexOf('function getDotPrices'));
aliasesStr = aliasesStr.replace('const DOTERRA_ALIASES = ', '').trim();
if (aliasesStr.endsWith(';')) aliasesStr = aliasesStr.slice(0, -1);

eval('DOTERRA_PRICES = ' + pricesStr);
eval('DOTERRA_ALIASES = ' + aliasesStr);

function getDotPrices(nomeProduto, tamanho) {
    if (!nomeProduto) return null;

    function queryPrice(name, size) {
        const orig = name.trim();
        const lower = orig.toLowerCase();

        let sizeSearch = size;
        if (sizeSearch.toLowerCase() === '10 ml touch' || sizeSearch.toLowerCase() === 'roll-on 10 ml') sizeSearch = '10ml Touch';
        if (sizeSearch.toLowerCase() === '15 ml') sizeSearch = '15ml';
        if (sizeSearch.toLowerCase() === '5 ml') sizeSearch = '5ml';
        if (sizeSearch.toLowerCase() === '10 ml roll-on') sizeSearch = '10ml Touch';

        // 0. Alias direto
        const aliasKey = DOTERRA_ALIASES[lower];
        if (aliasKey && DOTERRA_PRICES[aliasKey]) {
            const e = DOTERRA_PRICES[aliasKey];
            return e[sizeSearch] || Object.values(e)[0] || null;
        }

        // 1. Match exato
        let entry = DOTERRA_PRICES[orig];

        if (!entry) {
            for (const key of Object.keys(DOTERRA_PRICES)) {
                if (key.toLowerCase() === lower) { entry = DOTERRA_PRICES[key]; break; }
            }
        }

        if (!entry) {
            const getTokens = s => {
                const out = s.replace(/\(.*?\)/g, '').trim().toLowerCase();
                const match = s.match(/\((.*?)\)/);
                const ins = match ? match[1].trim().toLowerCase() : '';
                return [out, ins].filter(Boolean);
            };
            const lowerTokens = getTokens(orig);
            for (const key of Object.keys(DOTERRA_PRICES)) {
                const keyTokens = getTokens(key);
                if (lowerTokens.some(t => keyTokens.includes(t))) {
                    entry = DOTERRA_PRICES[key];
                    break;
                }
            }
        }

        if (!entry) {
            const stripped = lower.replace(/\s*\(.*?\)\s*/g, '').trim();
            let bestKey = null;
            let minLen = Infinity;
            for (const key of Object.keys(DOTERRA_PRICES)) {
                const kl = key.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();
                
                if (kl === stripped || kl.startsWith(lower) || lower.startsWith(kl) ||
                    kl.includes(lower) || lower.includes(kl) ||
                    (stripped.length > 3 && (kl.startsWith(stripped) || stripped.startsWith(kl)))) {
                    
                    const startsMatch = kl.startsWith(stripped) || stripped.startsWith(kl);
                    const score = kl.length + (startsMatch ? 0 : 100);

                    if (score < minLen) {
                        minLen = score;
                        bestKey = key;
                    }
                }
            }
            if (bestKey) entry = DOTERRA_PRICES[bestKey];
        }

        if (!entry) return null;

        let price = entry[sizeSearch];
        
        if (!price) {
            let nMatches = sizeSearch.match(/\d+/);
            if (nMatches) {
                for (let k of Object.keys(entry)) {
                    if (k.includes(nMatches[0])) return entry[k];
                }
            }
            price = Object.values(entry)[0];
        }
        return price || null;
    }

    const isTouchSize = tamanho.toLowerCase().includes('touch') || tamanho.toLowerCase().includes('roll');
    if (isTouchSize && !nomeProduto.toLowerCase().endsWith('touch')) {
        const touchPrice = queryPrice(nomeProduto + ' Touch', tamanho);
        if (touchPrice) return touchPrice;
    }

    return queryPrice(nomeProduto, tamanho);
}

const oilsContent = fs.readFileSync(__dirname + '/public/js/oils.js', 'utf-8');

let updatedOils = oilsContent;

updatedOils = updatedOils.replace(/'([^']+)': \{([^}]+)sizes:\s*\[(.*?)\]([^}]*)\}/g, (match, oilName, before, arrayInner, after) => {
    let sizesArr;
    try {
        sizesArr = eval('[' + arrayInner + ']');
    } catch(e) {
        return match;
    }
    
    let changed = false;
    for (let sObj of sizesArr) {
        let p = getDotPrices(oilName, sObj.size);
        
        if (p) {
            if (sObj.regular !== p.r || sObj.member !== p.m) {
                sObj.regular = p.r;
                sObj.member = p.m;
                changed = true;
            }
        } else {
            console.log("Still could not map price for:", oilName, sObj.size);
        }
    }
    
    if (changed) {
        let newSizes = JSON.stringify(sizesArr).replace(/"([^"]+)":/g, '"$1": ').replace(/,/g, ', ');
        return `'${oilName}': {${before}sizes: ${newSizes}${after}}`;
    }
    return match;
});

fs.writeFileSync(__dirname + '/public/js/oils.js', updatedOils);
console.log('Done mapping prices v2');
