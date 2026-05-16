import re
import json

# Read Inventory.js
with open('/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/public/js/pages/Inventory.js', 'r', encoding='utf-8') as f:
    inv_content = f.read()

# Extract DOTERRA_PRICES
prices_match = re.search(r'const DOTERRA_PRICES = ({.*?});', inv_content, re.DOTALL)
aliases_match = re.search(r'const ALIASES = ({.*?});', inv_content, re.DOTALL)

# Let's use a dirty eval in python using a JS-like syntax parser or just simple regex since it's simple JS object.
# Actually, it's easier to run a Node script to require/eval it and output JSON.

node_script = """
const fs = require('fs');

const invContent = fs.readFileSync('/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/public/js/pages/Inventory.js', 'utf-8');

const pricesMatch = invContent.match(/const DOTERRA_PRICES = (\\{[\\s\\S]*?\\});/);
const aliasesMatch = invContent.match(/const ALIASES = (\\{[\\s\\S]*?\\});/);

let DOTERRA_PRICES = {};
let ALIASES = {};

if (pricesMatch) {
    eval('DOTERRA_PRICES = ' + pricesMatch[1]);
}
if (aliasesMatch) {
    eval('ALIASES = ' + aliasesMatch[1]);
}

const oilsContent = fs.readFileSync('/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/public/js/oils.js', 'utf-8');

// We need to parse OILS_DATABASE.
// Let's do a simple replace on the string.
const oilsRegex = /(sizes:\\s*\\[)([^\\]]+)(\\])/g;

let updatedOils = oilsContent.replace(/sizes:\\s*\\[([^\\]]+)\\]/g, (match, arrayInner) => {
    // try to parse the array
    try {
        let sizesArr = eval('[' + arrayInner + ']');
        return 'sizes: ' + JSON.stringify(sizesArr); // placeholder
    } catch(e) {
        return match;
    }
});
"""
