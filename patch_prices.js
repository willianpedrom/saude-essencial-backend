const fs = require('fs');

let inventoryJs = fs.readFileSync('public/js/pages/Inventory.js', 'utf8');

const patches = {
    'On Guard Pastilhas': { r: 248, m: 186.25 },
    'On Guard Beadlets': { r: 155, m: 116.25 },
    'Peppermint Beadlets': { r: 140, m: 105 },
    'Copaíba Softgels': { r: 252, m: 189 },
    'ZenGest Pastilhas': { r: 215, m: 161.25 },
    'Zendocrine Pastilhas': { r: 224, m: 168 },
    'Turmeric Pastilhas': { r: 248, m: 186.25 },
    'Adaptiv Pastilhas': { r: 308, m: 231.25 }
};

for (const [name, prices] of Object.entries(patches)) {
    // example: 'On Guard Pastilhas': { 'Unidade / Kit': { r: 199, m: 149 } },
    const regex = new RegExp(`'${name}':\\s*\\{\\s*'([^']+)':\\s*\\{\\s*r:\\s*[\\d.]+,\\s*m:\\s*[\\d.]+\\s*\\}\\s*\\}`, 'g');
    inventoryJs = inventoryJs.replace(regex, `'${name}': { '$1': { r: ${prices.r}, m: ${prices.m} } }`);
}

fs.writeFileSync('public/js/pages/Inventory.js', inventoryJs);
console.log('Inventory.js patched!');
