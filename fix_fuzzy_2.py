import os
import re

inventory_path = '/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/public/js/pages/Inventory.js'

with open(inventory_path, 'r') as f:
    content = f.read()

getDotPrices_old = """    // 3. Fuzzy parcial: chave começa com o nome ou vice-versa, ou um contém o outro
    if (!entry) {
        // Remove parenteses e sufixos tipo "(Mix Algo)" antes de tentar parcial
        const stripped = lower.replace(/\\s*\\(.*?\\)\\s*/g, '').trim();
        let bestKey = null;
        let minLen = Infinity;
        for (const key of Object.keys(DOTERRA_PRICES)) {
            const kl = key.toLowerCase().replace(/\\s*\\(.*?\\)\\s*/g, '').trim();
            if (kl === stripped || kl.startsWith(lower) || lower.startsWith(kl) ||
                kl.includes(lower) || lower.includes(kl) ||
                (stripped.length > 3 && (kl.startsWith(stripped) || stripped.startsWith(kl)))) {
                
                if (kl.length < minLen) {
                    minLen = kl.length;
                    bestKey = key;
                }
            }
        }
        if (bestKey) entry = DOTERRA_PRICES[bestKey];
    }"""

getDotPrices_new = """    // 2.5 Tokens Exact Matching (trata inversões tipo "Nome (Name)" vs "Name (Nome)")
    if (!entry) {
        const getTokens = s => {
            const out = s.replace(/\\(.*?\\)/g, '').trim().toLowerCase();
            const match = s.match(/\\((.*?)\\)/);
            const ins = match ? match[1].trim().toLowerCase() : '';
            return [out, ins].filter(Boolean);
        };
        const lowerTokens = getTokens(orig);
        for (const key of Object.keys(DOTERRA_PRICES)) {
            const keyTokens = getTokens(key);
            // Se algum token for exatamente igual, é o produto certo
            if (lowerTokens.some(t => keyTokens.includes(t))) {
                entry = DOTERRA_PRICES[key];
                break;
            }
        }
    }

    // 3. Fuzzy parcial: chave começa com o nome ou vice-versa, ou um contém o outro
    if (!entry) {
        const stripped = lower.replace(/\\s*\\(.*?\\)\\s*/g, '').trim();
        let bestKey = null;
        let minLen = Infinity;
        for (const key of Object.keys(DOTERRA_PRICES)) {
            const kl = key.toLowerCase().replace(/\\s*\\(.*?\\)\\s*/g, '').trim();
            
            // Só cai em includes/startsWith se nenhuma das palavras exatas bateram antes
            if (kl === stripped || kl.startsWith(lower) || lower.startsWith(kl) ||
                kl.includes(lower) || lower.includes(kl) ||
                (stripped.length > 3 && (kl.startsWith(stripped) || stripped.startsWith(kl)))) {
                
                // Penaliza muito substrings que não começam no início da palavra para evitar que "Lemon" ganhe de "Lemongrass" só por includes
                const startsMatch = kl.startsWith(stripped) || stripped.startsWith(kl);
                const score = kl.length + (startsMatch ? 0 : 100);

                if (score < minLen) {
                    minLen = score;
                    bestKey = key;
                }
            }
        }
        if (bestKey) entry = DOTERRA_PRICES[bestKey];
    }"""

content = content.replace(getDotPrices_old, getDotPrices_new)

with open(inventory_path, 'w') as f:
    f.write(content)

print("Inventory.js token logic injected.")
