const fs = require('fs');
const content = fs.readFileSync('public/js/pages/Inventory.js', 'utf8');
const start = content.indexOf('const DOTERRA_PRODUCTS = [');
const end = content.indexOf('];', start) + 2;
const arrayCode = content.slice(start, end).replace('const DOTERRA_PRODUCTS =', 'DOTERRA_PRODUCTS =');

let DOTERRA_PRODUCTS;
eval(arrayCode);

console.log(JSON.stringify(DOTERRA_PRODUCTS, null, 2));
