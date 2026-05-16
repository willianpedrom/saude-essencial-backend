const fs = require('fs');

const inventoryPath = __dirname + '/public/js/pages/Inventory.js';
const oilsPath = __dirname + '/public/js/oils.js';

let invContent = fs.readFileSync(inventoryPath, 'utf-8');
let oilsContent = fs.readFileSync(oilsPath, 'utf-8');

function updatePrice(name, r, m) {
    const re = new RegExp(`'${name}': \\{ '10ml Touch': \\{ r: \\d+, m: [\\d.]+ \\} \\}`);
    if (invContent.match(re)) {
        invContent = invContent.replace(re, `'${name}': { '10ml Touch': { r: ${r}, m: ${m} } }`);
    } else {
        invContent = invContent.replace(/(const DOTERRA_PRICES = {)/, `$1\n    '${name}': { '10ml Touch': { r: ${r}, m: ${m} } },`);
    }
}

updatePrice('Brave Touch', 220, 165);
updatePrice('Thinker Touch', 170, 127.50);
updatePrice('Rescuer Touch', 160, 120);
updatePrice('Tamer Touch', 150, 112.50);

if (!invContent.includes("'Kids Collection'")) {
    invContent = invContent.replace(/(const DOTERRA_PRICES = {)/, "$1\n    'Kids Collection': { 'Kit': { r: 1022, m: 766.25 } },");
}

fs.writeFileSync(inventoryPath, invContent);

function addSizeToOils(name, sizeStr, r, m, pv) {
    const lineRegex = new RegExp(`('${name}': \\{.*?)( \\},?)`);
    if (oilsContent.match(lineRegex)) {
        // If it already has sizes, we shouldn't append it again blindly, but we assume it doesn't.
        if (!oilsContent.match(new RegExp(`'${name}': \\{.*?sizes:`))) {
            oilsContent = oilsContent.replace(lineRegex, `$1 , sizes: [{"size": "${sizeStr}", "regular": ${r}, "member": ${m}, "pv": ${pv}}]$2`);
        } else {
            // Replace existing sizes
            oilsContent = oilsContent.replace(new RegExp(`('${name}': \\{.*?)sizes: \\[[^\\]]+\\](.*?\\})`), `$1sizes: [{"size": "${sizeStr}", "regular": ${r}, "member": ${m}, "pv": ${pv}}]$2`);
        }
    }
}

addSizeToOils('Brave', '10 ml Roll-on', 220, 165, 22);
addSizeToOils('Thinker', '10 ml Roll-on', 170, 127.50, 17);
addSizeToOils('Rescuer', '10 ml Roll-on', 160, 120, 16);
addSizeToOils('Tamer', '10 ml Roll-on', 150, 112.50, 15);

if (!oilsContent.includes("'Kids Kit'")) {
    oilsContent = oilsContent.replace(/(const OILS_DATABASE = {)/, "$1\n    'Kids Kit': { nameEn: 'Kids Collection', cat: 'kit', fn: 'Kit de Óleos Essenciais para Crianças', uses: 'Suporte emocional e físico diário', topical: 'Diversos', aromatic: 'Diversos', sizes: [{\"size\": \"Um Kit\", \"regular\": 1022, \"member\": 766.25, \"pv\": 89}] },");
}

fs.writeFileSync(oilsPath, oilsContent);
console.log("Updated products");
