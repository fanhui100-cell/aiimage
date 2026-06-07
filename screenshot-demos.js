const puppeteer = require("C:/Users/fanhu/Desktop/test/service-website/node_modules/.pnpm/puppeteer-core@25.0.2/node_modules/puppeteer-core");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  
  await page.goto("http://localhost:3000/zh", { waitUntil: "networkidle2", timeout: 20000 });
  await new Promise(r => setTimeout(r, 1500));
  
  // Scroll to demos section
  await page.evaluate(() => {
    const section = document.querySelector("section:nth-of-type(6)");
    if (section) section.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 500));
  
  await page.screenshot({ path: "C:/Users/fanhu/Desktop/test/service-website/apps/main/public/screenshots/main-demos-section.png", fullPage: false });
  console.log("Screenshot saved");
  await browser.close();
})();
