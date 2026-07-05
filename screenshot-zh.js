const puppeteer = require("C:/Users/fanhu/Desktop/test/service-website/node_modules/.pnpm/puppeteer-core@25.0.2/node_modules/puppeteer-core");
const path = require("path");

const SHOTS = [
  { url: "http://localhost:3007", file: "demo-zh-hub.png" },
  { url: "http://localhost:3007/tea", file: "demo-zh-tea.png" },
  { url: "http://localhost:3007/garment", file: "demo-zh-garment.png" },
  { url: "http://localhost:3007/auto", file: "demo-zh-auto.png" },
  { url: "http://localhost:3007/food", file: "demo-zh-food.png" },
  { url: "http://localhost:3007/hotel", file: "demo-zh-hotel.png" },
  { url: "http://localhost:3007/tech", file: "demo-zh-tech.png" },
];

const OUT_DIR = "C:/Users/fanhu/Desktop/test/service-website/apps/main/public/screenshots";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  for (const shot of SHOTS) {
    console.log("Capturing:", shot.url);
    await page.goto(shot.url, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise(r => setTimeout(r, 1000));
    const outPath = path.join(OUT_DIR, shot.file);
    await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1280, height: 800 } });
    console.log("Saved:", outPath);
  }

  await browser.close();
  console.log("Done");
})();
