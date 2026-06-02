const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('nova_tabela.pdf');
pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('nova_tabela.txt', data.text);
    console.log('Done!');
});
