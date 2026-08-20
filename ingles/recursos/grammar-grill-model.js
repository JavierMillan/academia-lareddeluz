(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GrammarGrillModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ============================================================
     Modelo genérico de escenarios de pedido — cualquier menú
     (McDonald's, café, etc.) llega desde order-scenarios.json.
     Este archivo ya no fija UN catálogo: recibe el escenario activo
     y opera sobre su catálogo, sus tamaños y sus frases.
     ============================================================ */

  function lineKey(line) {
    return line.productId + '::' + (line.size || '');
  }

  function normalizeOrder(order) {
    const grouped = new Map();
    (order.items || []).forEach((line) => {
      const clean = {
        productId: String(line.productId),
        size: line.size || null,
        quantity: Math.max(1, Number(line.quantity) || 1)
      };
      const key = lineKey(clean);
      grouped.set(key, {
        ...clean,
        quantity: (grouped.get(key)?.quantity || 0) + clean.quantity
      });
    });
    return {
      items: [...grouped.values()].sort((a, b) => lineKey(a).localeCompare(lineKey(b)))
    };
  }

  function itemById(id, catalog) {
    return catalog.find((item) => item.id === id);
  }

  function unitPrice(line, catalog) {
    const item = itemById(line.productId, catalog);
    if (!item) throw new Error('Unknown product: ' + line.productId);
    const key = item.requiresSize ? line.size : 'default';
    if (!key || item.prices[key] == null) throw new Error('Invalid size for ' + item.name);
    return item.prices[key];
  }

  function calculateTotal(order, catalog) {
    return normalizeOrder(order).items.reduce(
      (sum, line) => sum + unitPrice(line, catalog) * line.quantity,
      0
    );
  }

  function pluralName(item, quantity) {
    return quantity === 1 ? item.name : item.name + (item.name.endsWith('s') ? '' : 's');
  }

  function titleCase(value) {
    return value[0].toUpperCase() + value.slice(1);
  }

  function labelLine(line, catalog) {
    const item = itemById(line.productId, catalog);
    const size = line.size ? titleCase(line.size) + ' ' : '';
    return line.quantity + ' ' + size + pluralName(item, line.quantity);
  }

  function compareOrders(target, attempt, catalog) {
    const wanted = normalizeOrder(target).items;
    const actual = normalizeOrder(attempt).items;
    const feedback = [];
    const unmatchedActual = new Map(actual.map((line) => [lineKey(line), line]));

    wanted.forEach((line) => {
      const exact = unmatchedActual.get(lineKey(line));
      const item = itemById(line.productId, catalog);
      if (exact) {
        unmatchedActual.delete(lineKey(line));
        if (line.quantity !== exact.quantity) {
          feedback.push('You need ' + line.quantity + ' ' + pluralName(item, line.quantity));
        }
        return;
      }

      const wrongSize = [...unmatchedActual.values()].find(
        (candidate) => candidate.productId === line.productId
      );
      if (wrongSize) {
        unmatchedActual.delete(lineKey(wrongSize));
        feedback.push('Change ' + item.name + ' to ' + titleCase(line.size));
        return;
      }

      feedback.push('Missing: ' + labelLine(line, catalog));
    });

    unmatchedActual.forEach((line) => {
      feedback.push('Remove: ' + labelLine(line, catalog));
    });

    return { matches: feedback.length === 0, feedback };
  }

  function pick(list, random) {
    return list[Math.floor(random() * list.length)];
  }

  function createRandomOrder(catalog, categories, random = Math.random) {
    // "mains" = cualquier categoría que no sea la última (se asume
    // que la última categoría del escenario es la de combos/paquetes,
    // igual que McDonald's) — si el escenario no tiene combos, cualquier
    // categoría cuenta como principal.
    const comboCategory = categories[categories.length - 1];
    const mainCandidates = catalog.filter((item) => item.category !== comboCategory);
    const mains = mainCandidates.length ? mainCandidates : catalog;
    const first = pick(mains, random);
    const desiredCount = 1 + Math.floor(random() * 4);
    const pool = catalog.filter((item) => item.id !== first.id);
    const selected = [first];

    while (selected.length < desiredCount && pool.length) {
      selected.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
    }

    return {
      items: selected.map((item) => ({
        productId: item.id,
        size: item.requiresSize ? pick(['small', 'medium', 'large'], random) : null,
        quantity: random() > .72 ? 2 : 1
      }))
    };
  }

  /* ============================================================
     Misiones de cliente (Challenge Mode)
     ------------------------------------------------------------
     Armar el carrito "libremente" no tiene meta — task-based
     language teaching dice que la TAREA, no la gramática, es lo
     que le da propósito a producir el idioma. Delivery ya tenía
     una tarea real (el ticket); Customer no tenía ninguna, así que
     se sentía como el modo "de relleno". Estas misiones le dan a
     Customer el mismo tipo de objetivo concreto y verificable.
     ============================================================ */
  const MISSION_KINDS = ['budget', 'minItems', 'category', 'combo'];

  function buildMission(kind, catalog, categories, random) {
    const comboCategory = categories[categories.length - 1];
    const hasCombos = catalog.some((item) => item.category === comboCategory && item.comboContents);

    if (kind === 'budget') {
      const cap = [80, 120, 160][Math.floor(random() * 3)];
      return {
        kind: 'budget',
        cap,
        description: 'Order lunch for yourself — total must be $' + cap + ' or less.',
        check: (cart) => {
          const total = calculateTotal(cart, catalog);
          const items = normalizeOrder(cart).items;
          if (!items.length) return { ok: false, message: 'Your order is empty. Add at least one item.' };
          if (total > cap) return { ok: false, message: 'Over budget: $' + total + ' (limit is $' + cap + ').' };
          return { ok: true, message: 'Nice — $' + total + ', under your $' + cap + ' budget.' };
        }
      };
    }

    if (kind === 'minItems') {
      const count = 2 + Math.floor(random() * 2); // 2 o 3
      return {
        kind: 'minItems',
        count,
        description: 'Order at least ' + count + ' different things.',
        check: (cart) => {
          const items = normalizeOrder(cart).items;
          if (items.length < count) {
            return { ok: false, message: 'You have ' + items.length + ' — order at least ' + count + ' different things.' };
          }
          return { ok: true, message: 'Great — ' + items.length + ' different items ordered.' };
        }
      };
    }

    if (kind === 'category' && categories.length > 1) {
      const nonComboCategories = categories.filter((category) => category !== comboCategory);
      const targetCategory = pick(nonComboCategories.length ? nonComboCategories : categories, random);
      return {
        kind: 'category',
        category: targetCategory,
        description: 'Order at least one thing from every category on the menu.',
        check: (cart) => {
          const items = normalizeOrder(cart).items;
          const covered = new Set(items.map((line) => itemById(line.productId, catalog).category));
          const missing = categories.filter((category) => !covered.has(category));
          if (missing.length) {
            return { ok: false, message: 'Still missing: ' + missing.join(', ') + '.' };
          }
          return { ok: true, message: 'You covered the whole menu!' };
        }
      };
    }

    if (kind === 'combo' && hasCombos) {
      return {
        kind: 'combo',
        description: 'Order at least one combo.',
        check: (cart) => {
          const items = normalizeOrder(cart).items;
          const hasCombo = items.some((line) => itemById(line.productId, catalog).category === comboCategory);
          if (!hasCombo) return { ok: false, message: 'Add at least one combo to your order.' };
          return { ok: true, message: 'Combo ordered — nice and easy.' };
        }
      };
    }

    // fallback si el escenario no soporta el kind elegido (p. ej. sin combos)
    return buildMission('minItems', catalog, categories, random);
  }

  function createMission(catalog, categories, random = Math.random) {
    const kind = pick(MISSION_KINDS, random);
    return buildMission(kind, catalog, categories, random);
  }

  /* ============================================================
     Frases para pedir/atender (rol customer vs. employee)
     ------------------------------------------------------------
     Antes de agregar un producto, el jugador elige la frase
     correcta — pero el lado que produce el lenguaje depende del
     rol: el CLIENTE pide, el EMPLEADO pregunta/confirma. Antes,
     ambos roles usaban las mismas frases de cliente — el empleado
     terminaba "pidiéndose a sí mismo" la comida en vez de atender.
     ============================================================ */
  const CUSTOMER_PHRASES = {
    simple: {
      correct: (name) => 'I\'d like a ' + name.toLowerCase() + ', please.',
      distractors: (name) => [
        'I like a ' + name.toLowerCase() + '.',
        'I want ' + name.toLowerCase() + ' please have.',
        'Give me the ' + name.toLowerCase() + ' now.'
      ]
    },
    sized: {
      correct: (name, size) => 'Can I get a ' + size + ' ' + name.toLowerCase() + '?',
      distractors: (name, size) => [
        'Can I get ' + size + ' ' + name.toLowerCase() + ' a?',
        'I ' + size + ' like a ' + name.toLowerCase() + '.',
        'A ' + name.toLowerCase() + ' of ' + size + ', can I?'
      ]
    },
    combo: {
      correct: () => 'Can I have that as a combo?',
      distractors: () => [
        'Can I have a combo that as?',
        'I have that combo, can?',
        'That combo please have I can?'
      ]
    }
  };

  // el empleado no "pide" — pregunta o confirma lo que va a preparar,
  // como el cajero del diálogo modelo ("What can I get for you?",
  // "Would you like to make that a combo?", "What size would you like?")
  const EMPLOYEE_PHRASES = {
    simple: {
      correct: (name) => 'One ' + name.toLowerCase() + ', coming right up.',
      distractors: (name) => [
        'One ' + name.toLowerCase() + ', coming up right.',
        'I would like a ' + name.toLowerCase() + '.',
        'You get one ' + name.toLowerCase() + ' now.'
      ]
    },
    sized: {
      correct: (name) => 'What size ' + name.toLowerCase() + ' would you like?',
      distractors: (name) => [
        'What ' + name.toLowerCase() + ' size you would like?',
        'Can I get a ' + name.toLowerCase() + ', please?',
        'You would like what size, ' + name.toLowerCase() + '?'
      ]
    },
    combo: {
      correct: () => 'Would you like to make that a combo?',
      distractors: () => [
        'Would you like a combo to make that?',
        'Can I have that as a combo?',
        'That a combo, would make you like?'
      ]
    }
  };

  function phraseKindFor(item, categories) {
    const comboCategory = categories[categories.length - 1];
    if (item.category === comboCategory && item.comboContents) return 'combo';
    if (item.requiresSize) return 'sized';
    return 'simple';
  }

  // baraja con Fisher-Yates para no delatar siempre la misma posición
  function shuffle(list, random) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // genera las opciones (1 correcta + distractores) para el reto de
  // frase — role: 'customer' pide, 'employee' pregunta/confirma
  function phraseOptionsFor(item, size, categories, role, random = Math.random) {
    const kind = phraseKindFor(item, categories);
    const bank = (role === 'employee' ? EMPLOYEE_PHRASES : CUSTOMER_PHRASES)[kind];
    const correct = bank.correct(item.name, size);
    const distractors = bank.distractors(item.name, size);
    const options = shuffle([correct, ...distractors], random);
    return { correct, options };
  }

  return {
    normalizeOrder,
    calculateTotal,
    compareOrders,
    createRandomOrder,
    createMission,
    labelLine,
    phraseOptionsFor,
    itemById
  };
}));
