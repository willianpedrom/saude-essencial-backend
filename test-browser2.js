const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/#vendas', { waitUntil: 'networkidle0' });
  const content = await page.evaluate(() => document.getElementById('app').innerHTML);
  console.log("APP INNER HTML (first 500 chars):\\n", content.substring(0, 500));
  await browser.close();
  process.exit(0);
})();
