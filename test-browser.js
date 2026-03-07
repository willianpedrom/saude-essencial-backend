const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log("Navegando...");
  await page.goto('http://localhost:3000/#vendas', { waitUntil: 'networkidle0' });
  
  const content = await page.content();
  console.log("HTML App Content length:", content.length);
  
  await browser.close();
})();
