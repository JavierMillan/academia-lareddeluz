const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const model = require('../recursos/grammar-grill-model.js');

const scenarios = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'recursos', 'order-scenarios.json'),
  'utf8'
)).scenarios;

assert.ok(scenarios.length >= 2, 'Grammar Grill needs at least two scenarios');

for (const scenario of scenarios) {
  assert.ok(scenario.id && scenario.name && scenario.theme);
  assert.ok(Array.isArray(scenario.categories) && scenario.categories.length > 0);
  assert.ok(Array.isArray(scenario.catalog) && scenario.catalog.length > 0);
  const ids = scenario.catalog.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, `Duplicate product IDs in ${scenario.id}`);
  for (const item of scenario.catalog) {
    assert.ok(scenario.categories.includes(item.category), `${item.id} has an unknown category`);
    const priceKeys = item.requiresSize ? scenario.sizes : ['default'];
    for (const size of priceKeys) assert.equal(typeof item.prices[size], 'number', `${item.id} is missing ${size} price`);
  }
}

const mcdonalds = scenarios.find((scenario) => scenario.id === 'mcdonalds');
const catalog = mcdonalds.catalog;
const categories = mcdonalds.categories;
const bigMac = model.itemById('big-mac', catalog);
const fries = model.itemById('fries', catalog);
const combo = model.itemById('big-mac-combo', catalog);

assert.equal(model.calculateTotal({ items: [
  { productId: 'big-mac', size: null, quantity: 2 },
  { productId: 'soda', size: 'large', quantity: 1 }
] }, catalog), 185);

assert.equal(model.compareOrders(
  { items: [{ productId: 'fries', size: 'large', quantity: 1 }] },
  { items: [{ productId: 'fries', size: 'small', quantity: 1 }] },
  catalog
).feedback[0], 'Change Fries to Large');

const customer = model.phraseOptionsFor(bigMac, null, categories, 'customer', () => 0.5);
const employee = model.phraseOptionsFor(bigMac, null, categories, 'employee', () => 0.5);
assert.equal(customer.correct, "I'd like a big mac, please.");
assert.equal(employee.correct, 'One big mac, coming right up.');
assert.notEqual(employee.correct, customer.correct);
assert.equal(model.phraseOptionsFor(fries, 'medium', categories, 'employee', () => 0.5).correct, 'What size fries would you like?');
assert.equal(model.phraseOptionsFor(combo, 'small', categories, 'employee', () => 0.5).correct, 'Would you like to make that a combo?');

for (let index = 0; index < 50; index += 1) {
  const order = model.createRandomOrder(catalog, categories, () => ((index * 37 + 11) % 101) / 101);
  assert.ok(order.items.length >= 1 && order.items.length <= 4);
  for (const line of order.items) assert.ok(model.itemById(line.productId, catalog));
}

console.log('grammar-grill model: PASS');
