const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('C:/Users/Usuario/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const projectRoot = path.resolve(__dirname, '..');
const edgePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const scenarios = JSON.parse(fs.readFileSync(path.join(projectRoot, 'recursos', 'order-scenarios.json'), 'utf8')).scenarios;
const mcdonalds = scenarios.find((scenario) => scenario.id === 'mcdonalds');

function startServer() {
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const requested = path.resolve(projectRoot, '.' + pathname);
    if (!requested.startsWith(projectRoot + path.sep)) return response.writeHead(403).end('Forbidden');
    fs.readFile(requested, (error, contents) => {
      if (error) return response.writeHead(404).end('Not found');
      const type = { '.css':'text/css', '.html':'text/html', '.js':'text/javascript', '.json':'application/json' }[path.extname(requested)];
      response.writeHead(200, { 'content-type': `${type || 'application/octet-stream'}; charset=utf-8` });
      response.end(contents);
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function answerPhrase(page, item, size, role) {
  await page.locator('.phrase-overlay').waitFor();
  const correct = await page.evaluate(({ item, size, categories, role }) => (
    window.GrammarGrillModel.phraseOptionsFor(item, size, categories, role, () => 0.5).correct
  ), { item, size, categories: mcdonalds.categories, role });
  await page.locator(`[data-phrase="${encodeURIComponent(correct)}"]`).click();
}

async function chooseMcDonalds(page) {
  await page.getByRole('button', { name: /McDonald's/i }).click();
}

async function addTicketItems(page) {
  const lines = await page.locator('.ticket-lines li').allTextContents();
  const catalog = [...mcdonalds.catalog].sort((left, right) => right.name.length - left.name.length);
  for (const line of lines) {
    const quantity = Number(line.match(/^\d+/)[0]);
    const item = catalog.find((candidate) => line.endsWith(candidate.name) || line.endsWith(candidate.name + 's'));
    assert.ok(item, `Unknown ticket item: ${line}`);
    const titleSize = mcdonalds.sizes.map((size) => size[0].toUpperCase() + size.slice(1)).find((size) => line.includes(size + ' '));
    await page.getByRole('button', { name: mcdonalds.categoryLabels[item.category].toUpperCase(), exact: true }).click();
    const orderName = `Order ${titleSize ? titleSize + ' ' : ''}${item.name}`;
    for (let count = 0; count < quantity; count += 1) {
      await page.getByRole('button', { name: orderName, exact: true }).click();
      await answerPhrase(page, item, titleSize ? titleSize.toLowerCase() : null, 'employee');
    }
  }
}

(async () => {
  const server = await startServer();
  const origin = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ executablePath: edgePath, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(origin + 'recursos/grammar-grill.html');
    await chooseMcDonalds(page);
    await page.getByRole('button', { name: /I'm ordering food/i }).click();
    const bigMac = mcdonalds.catalog.find((item) => item.id === 'big-mac');
    await page.getByRole('button', { name: 'Order Big Mac', exact: true }).click();
    await answerPhrase(page, bigMac, null, 'customer');
    await page.getByRole('button', { name: 'CREATE ORDER', exact: true }).click();
    await page.getByRole('heading', { name: 'ORDER CREATED!' }).waitFor();

    await page.locator('#reset-app').click();
    await chooseMcDonalds(page);
    await page.getByRole('button', { name: /I'm taking the order/i }).click();
    await addTicketItems(page);
    await page.getByRole('button', { name: 'CHECK ORDER', exact: true }).click();
    await page.getByRole('heading', { name: 'ORDER READY!' }).waitFor();
    assert.deepEqual(errors, []);
    await page.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(origin + 'recursos/grammar-grill.html');
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
    await mobile.close();

    console.log('grammar-grill browser flows: PASS');
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
