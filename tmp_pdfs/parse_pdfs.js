const fs = require('fs');
const pdf = require('pdf-parse');

console.log(typeof pdf);

async function extractText(filename) {
  try {
    const dataBuffer = fs.readFileSync(filename);
    const data = await pdf(dataBuffer);
    console.log(`\n\n=== TEXT FROM ${filename} ===\n\n`);
    console.log(data.text);
  } catch (err) {
    console.error(`Error processing ${filename}:`, err);
  }
}

async function run() {
  await extractText('/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/tmp_pdfs/pdf1.pdf');
  await extractText('/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/tmp_pdfs/pdf2.pdf');
  await extractText('/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/tmp_pdfs/pdf3.pdf');
}

run();
