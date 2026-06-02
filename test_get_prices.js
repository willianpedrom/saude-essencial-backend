const fs = require('fs');
const content = fs.readFileSync('public/js/pages/Inventory.js', 'utf8');

// We will extract everything between const DOTERRA_PRICES and the end of getDotPrices
const startIndex = content.indexOf('const DOTERRA_PRICES');
const endIndex = content.indexOf('export async function renderInventory');
const codeToEval = content.slice(startIndex, endIndex);

// Eval it
const sandbox = {};
eval(codeToEval);

console.log('Result for Pasta de Dente On Guard:', getDotPrices('Pasta de Dente On Guard', 'Unidade / Kit'));
console.log('Result for Pasta de Dente:', getDotPrices('Pasta de Dente', 'Unidade / Kit'));
console.log('Result for On Guard:', getDotPrices('On Guard', 'Unidade / Kit'));
console.log('Result for On Guard (Mix Protetor):', getDotPrices('On Guard (Mix Protetor)', 'Unidade / Kit'));
