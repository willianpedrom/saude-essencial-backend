const fs = require('fs');
const pdf = require('pdf-parse');

async function testSingle() {
  try {
    const dataBuffer = fs.readFileSync('tmp_pdfs/pdf3.pdf');
    // Se pdf-parse for um objeto com PDFParse, tentamos usar a função padrão se existir
    const parse = typeof pdf === 'function' ? pdf : pdf.PDFParse;
    
    if (typeof parse !== 'function') {
        console.log('PDF parser is not a function. Content:', pdf);
        return;
    }

    const data = await parse(dataBuffer);
    console.log('Text extracted:', data.text.substring(0, 100));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testSingle();
