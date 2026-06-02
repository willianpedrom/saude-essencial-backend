const fs = require('fs');
const content = fs.readFileSync('public/js/pages/Inventory.js', 'utf8');
const start = content.indexOf('const DOTERRA_PRODUCTS = [');
const end = content.indexOf('];', start) + 2;
const arrayCode = content.slice(start, end).replace('const DOTERRA_PRODUCTS =', 'DOTERRA_PRODUCTS =');

let DOTERRA_PRODUCTS;
eval(arrayCode);

const counts = {};
DOTERRA_PRODUCTS.forEach(p => {
    counts[p.nome] = counts[p.nome] || [];
    counts[p.nome].push(p.cat);
});

console.log('Duplicates in DOTERRA_PRODUCTS:');
for (const name in counts) {
    if (counts[name].length > 1) {
        console.log(name, counts[name]);
    }
}
