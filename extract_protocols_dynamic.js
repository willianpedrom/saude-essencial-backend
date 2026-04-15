const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const TMP_DIR = path.join(__dirname, 'tmp_pdfs');
const OUTPUT_FILE = path.join(__dirname, 'extracted_text.txt');

async function extractTextFromPDFs() {
  const files = fs.readdirSync(TMP_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  let fullText = '';

  for (const file of files) {
    console.log(`Processing ${file}...`);
    try {
      const dataBuffer = fs.readFileSync(path.join(TMP_DIR, file));
      
      let data;
      if (typeof pdf === 'function') {
        data = await pdf(dataBuffer);
      } else if (typeof pdf.PDFParse === 'function') {
        // Se for uma classe (como o erro sugeriu)
        if (pdf.PDFParse.toString().includes('class')) {
            const parser = new pdf.PDFParse();
            data = await parser.parse(dataBuffer); // Chute de método, or parser.load?
        } else {
            data = await pdf.PDFParse(dataBuffer);
        }
      } else {
         throw new Error('No valid parse function found');
      }

      fullText += `\n\n=== FILE: ${file} ===\n\n`;
      fullText += data.text || 'No text found';
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, fullText);
  console.log(`Extraction complete. Saved to ${OUTPUT_FILE}`);
}

extractTextFromPDFs();
