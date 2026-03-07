const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    const content = await page.content();
    console.log("APP HTML LENGTH:", content.length);
  } catch (err) {
    console.log("NAV ERROR:", err);
  }
  
  await browser.close();
  process.exit(0);
})();
