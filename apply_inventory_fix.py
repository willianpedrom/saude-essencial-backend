import re

inventory_path = '/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/public/js/pages/Inventory.js'
prices_path = '/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/build_prices_out.js'

with open(prices_path, 'r') as f:
    new_prices = f.read().strip()

with open(inventory_path, 'r') as f:
    content = f.read()

# Replace DOTERRA_PRICES
pattern_prices = re.compile(r'const DOTERRA_PRICES = \{.*?\};\n', re.DOTALL)
content = pattern_prices.sub(new_prices + '\n', content, count=1)

# Fix aliases if needed. In build_prices_out, I used 'Lemon (Limão Siciliano)'. 
# Let's adjust the ALIASES block to match the new names generated:
# "Basil" -> "Basil (Manjericão)"
# "Limão Siciliano (Lemon)" -> "Lemon (Limão Siciliano)" 
# "Olíbano (Frankincense)" -> "Frankincense (Olíbano)" (wait, in build_prices_out I have "Frankincense (Olíbano)")

content_aliases_fix = content.replace("'Limão Siciliano (Lemon)'", "'Lemon (Limão Siciliano)'")
content_aliases_fix = content_aliases_fix.replace("'Olíbano (Frankincense)'", "'Frankincense (Olíbano)'")
content_aliases_fix = content_aliases_fix.replace("'Laranja Doce (Wild Orange)'", "'Wild Orange (Laranja Doce)'")
content_aliases_fix = content_aliases_fix.replace("'Hortelã-Pimenta (Peppermint)'", "'Peppermint (Hortelã-Pimenta)'")
content_aliases_fix = content_aliases_fix.replace("'Melaleuca (Tea Tree)'", "'Melaleuca (Tea Tree)'")  # was same
content_aliases_fix = content_aliases_fix.replace("'Bergamota'", "'Bergamot (Bergamota)'")
content_aliases_fix = content_aliases_fix.replace("'Cúrcuma (Turmeric)'", "'Turmeric (Cúrcuma)'")
content_aliases_fix = content_aliases_fix.replace("'Cássia'", "'Cassia (Canela-cássia)'")
content_aliases_fix = content_aliases_fix.replace("'Limão Tahiti (Lime)'", "'Lime (Limão Tahiti)'")
content_aliases_fix = content_aliases_fix.replace("'Alecrim (Rosemary)'", "'Rosemary (Alecrim)'")
content_aliases_fix = content_aliases_fix.replace("'Gengibre (Ginger)'", "'Ginger (Gengibre)'")
content_aliases_fix = content_aliases_fix.replace("'Eucalipto'", "'Eucalyptus (Eucalipto)'")
content_aliases_fix = content_aliases_fix.replace("'Eucalipto Radiata (Eucalyptus)'", "'Eucalyptus (Eucalipto)'")
content_aliases_fix = content_aliases_fix.replace("'Mirra (Myrrh)'", "'Myrrh (Mirra)'")
content_aliases_fix = content_aliases_fix.replace("'Helicriso (Helichrysum)'", "'Helichrysum (Helicriso)'")
content = content_aliases_fix

old_getDotPrices = """    // 3. Fuzzy parcial: chave começa com o nome ou vice-versa, ou um contém o outro
    if (!entry) {
        // Remove parenteses e sufixos tipo "(Mix Algo)" antes de tentar parcial
        const stripped = lower.replace(/\s*\\(.*?\\)\s*/g, '').trim();
        for (const key of Object.keys(DOTERRA_PRICES)) {
            const kl = key.toLowerCase().replace(/\s*\\(.*?\\)\s*/g, '').trim();
            if (kl === stripped || kl.startsWith(lower) || lower.startsWith(kl) ||
                kl.includes(lower) || lower.includes(kl) ||
                (stripped.length > 3 && (kl.startsWith(stripped) || stripped.startsWith(kl)))) {
                entry = DOTERRA_PRICES[key];
                break;
            }
        }
    }"""

new_getDotPrices = """    // 3. Fuzzy parcial: chave começa com o nome ou vice-versa, ou um contém o outro
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

content = content.replace(old_getDotPrices, new_getDotPrices, 2) # Do it for both getDotPrices and getDotSizes, they share this block exactly

# Add 30ml size
old_sizes = """                                <option>10ml Touch</option>
                                <option>Unidade / Kit</option>"""

new_sizes = """                                <option>10ml Touch</option>
                                <option>30ml</option>
                                <option>Unidade / Kit</option>"""

content = content.replace(old_sizes, new_sizes)

with open(inventory_path, 'w') as f:
    f.write(content)

print("Inventory.js successfully updated!")
