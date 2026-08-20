import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to dashboard...");
  await page.goto('https://velorate-01.vercel.app/', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '../docs/dashboard.png' });

  console.log("Navigating to cycle builder...");
  await page.goto('https://velorate-01.vercel.app/cycle-builder', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '../docs/cycle_builder.png' });

  console.log("Navigating to configurations...");
  await page.goto('https://velorate-01.vercel.app/configurations', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '../docs/configurations.png' });

  console.log("Navigating to parts...");
  await page.goto('https://velorate-01.vercel.app/parts', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '../docs/parts.png' });
  
  console.log("Navigating to price history...");
  await page.goto('https://velorate-01.vercel.app/price-history', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '../docs/price_history.png' });

  console.log("Navigating to price impact...");
  await page.goto('https://velorate-01.vercel.app/price-impact', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: '../docs/price_impact.png' });

  await browser.close();
})();
