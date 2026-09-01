(function () {
  'use strict';

  const model = window.GrammarGrillModel;
  const app = document.getElementById('app');
  const status = document.getElementById('sr-status');
  const state = {
    scenarios: [],
    scenario: null,   // escenario activo (menú, tema, categorías)
    role: null,       // 'customer' | 'delivery'
    category: null,
    cart: { items: [] },
    target: null,
    ticketNumber: null,
    feedback: [],
    success: false,
    phraseCheck: null,   // { productId, size, item, correct, options, wrongPick, misses }
    phraseScore: { correct: 0, attempts: 0 },
    streak: 0   // frases acertadas AL PRIMER INTENTO, seguidas — se rompe al fallar una
  };

  function money(value) {
    return '$' + value.toLocaleString('en-US');
  }

  function titleCase(value) {
    return value[0].toUpperCase() + value.slice(1);
  }

  function announce(message) {
    status.textContent = '';
    window.setTimeout(() => { status.textContent = message; }, 20);
  }

  function newTicketNumber() {
    return String(100 + Math.floor(Math.random() * 900));
  }

  // el tema de cada escenario solo cambia 3 variables CSS — el resto
  // del sistema visual (tipografía, layout, espaciado) se queda igual,
  // así que un escenario nuevo en el JSON no necesita CSS propio
  function applyTheme(theme) {
    const root = document.documentElement.style;
    if (!theme) {
      root.removeProperty('--scenario-primary');
      root.removeProperty('--scenario-accent');
      root.removeProperty('--scenario-surface');
      return;
    }
    root.setProperty('--scenario-primary', theme.primary);
    root.setProperty('--scenario-accent', theme.accent);
    root.setProperty('--scenario-surface', theme.surface);
  }

  function resetState() {
    Object.assign(state, {
      scenario: null,
      role: null,
      category: null,
      cart: { items: [] },
      target: null,
      ticketNumber: null,
      feedback: [],
      success: false,
      phraseCheck: null,
      phraseScore: { correct: 0, attempts: 0 },
      streak: 0
    });
    applyTheme(null);
    render(true);
  }

  function chooseScenario(scenarioId) {
    const scenario = state.scenarios.find((entry) => entry.id === scenarioId);
    state.scenario = scenario;
    state.category = scenario.categories[0];
    applyTheme(scenario.theme);
    render(true);
  }

  function startRole(role) {
    state.role = role;
    state.category = state.scenario.categories[0];
    state.cart = { items: [] };
    state.feedback = [];
    state.success = false;
    state.phraseCheck = null;
    state.phraseScore = { correct: 0, attempts: 0 };
    state.streak = 0;
    state.target = role === 'delivery'
      ? model.createRandomOrder(state.scenario.catalog, state.scenario.categories, Math.random)
      : null;
    state.ticketNumber = role === 'delivery' ? newTicketNumber() : null;
    render(true);
  }

  // banners horizontales tipo "app de delivery" (UberEats/DoorDash):
  // cada lugar es una franja ancha con su color de marca de fondo,
  // el emoji grande como "foto" placeholder, y el conteo de items
  // del menú como dato rápido — más fácil de escanear que una grid
  // de tarjetas chicas cuando solo hay unos pocos lugares.
  function renderScenarioSelect() {
    const banners = state.scenarios.map((scenario) => {
      const itemCount = scenario.catalog.length;
      return '<button class="scenario-banner" type="button" data-scenario="' + scenario.id + '" ' +
        'style="--card-primary:' + scenario.theme.primary + ';--card-accent:' + scenario.theme.accent + '">' +
          '<span class="banner-emoji" aria-hidden="true">' + scenario.emoji + '</span>' +
          '<span class="banner-body">' +
            '<strong>' + scenario.name + '</strong>' +
            '<small>' + scenario.tagline + ' · ' + itemCount + ' items on the menu</small>' +
          '</span>' +
          '<span class="banner-go" aria-hidden="true">Start ›</span>' +
        '</button>';
    }).join('');

    app.innerHTML =
      '<section class="role-screen" aria-labelledby="scenario-title">' +
        '<div class="role-intro">' +
          '<p class="eyebrow">PRACTICE ORDERING FOOD</p>' +
          '<h1 class="display" id="scenario-title">Pick a place</h1>' +
          '<p class="lead">Choose where you want to practice — every place has its own menu.</p>' +
        '</div>' +
        '<div class="scenario-list">' + banners + '</div>' +
      '</section>';

    app.querySelectorAll('[data-scenario]').forEach((button) => {
      button.addEventListener('click', () => chooseScenario(button.dataset.scenario));
    });
  }

  function renderRoleSelect() {
    const scenario = state.scenario;
    app.innerHTML =
      '<section class="role-screen" aria-labelledby="role-title">' +
        '<div class="role-intro">' +
          '<p class="eyebrow">' + scenario.name.toUpperCase() + '</p>' +
          '<h1 class="display" id="role-title">Choose your role</h1>' +
          '<p class="lead">Practice ordering food or prove you can prepare exactly what the ticket says.</p>' +
        '</div>' +
        '<div class="role-grid">' +
          '<button class="role-card" type="button" data-role="customer">' +
            '<span class="role-label">CUSTOMER</span><span class="role-icon" aria-hidden="true">01</span>' +
            '<strong>I\'m ordering food</strong><small>Explore the menu and create any order you like.</small>' +
          '</button>' +
          '<button class="role-card" type="button" data-role="delivery">' +
            '<span class="role-label">STAFF</span><span class="role-icon" aria-hidden="true">02</span>' +
            '<strong>I\'m taking the order</strong><small>Read the ticket and prepare it exactly. No guessing.</small>' +
          '</button>' +
        '</div>' +
        '<button type="button" class="phrase-cancel scenario-back" id="scenario-back">‹ Choose another place</button>' +
      '</section>';

    app.querySelectorAll('[data-role]').forEach((button) => {
      button.addEventListener('click', () => startRole(button.dataset.role));
    });
    document.getElementById('scenario-back').addEventListener('click', () => {
      state.scenario = null;
      applyTheme(null);
      render(true);
    });
  }

  function foodArt(item) {
    return '<span class="food-emoji" aria-hidden="true">' + (item.emoji || '🍽️') + '</span>';
  }

  function priceFor(item, size) {
    return item.prices[item.requiresSize ? size : 'default'];
  }

  function renderProduct(item) {
    // los botones ya no agregan directo — abren primero el reto de
    // la frase (data-order en vez de data-add). "ADD" sin decir nada
    // en inglés no enseña nada; esto convierte cada click en una
    // producción de lenguaje real, tomada del vocabulario del deck.
    const actions = item.requiresSize
      ? state.scenario.sizes.map((size) =>
          '<button class="size-button" type="button" data-order="' + item.id + '" data-size="' + size + '" ' +
          'aria-label="Order ' + titleCase(size) + ' ' + item.name + '">' +
          size[0].toUpperCase() + ' · ' + money(item.prices[size]) + '</button>'
        ).join('')
      : '<button class="primary" type="button" data-order="' + item.id + '" data-size="" ' +
        'aria-label="Order ' + item.name + '">ORDER IT · ' + money(item.prices.default) + '</button>';

    return '<article class="product-card">' +
      (item.featured ? '<span class="featured">★ MOST ORDERED</span>' : '') +
      '<div class="food-art">' + foodArt(item) + '</div>' +
      '<h3>' + item.name + '</h3><p>' + item.description + '</p>' +
      '<div class="product-actions">' + actions + '</div>' +
      '</article>';
  }

  // paso 1: antes de agregar, el jugador debe elegir la frase correcta
  // para ESTE rol — el cliente pide ("I'd like a...") y el que atiende
  // pregunta/confirma ("What size would you like?"). Antes ambos roles
  // usaban las frases de cliente, así que "Staff" terminaba pidiéndose
  // la comida a sí mismo en vez de atender.
  function openPhraseCheck(productId, size) {
    const item = model.itemById(productId, state.scenario.catalog);
    const cleanSize = item.requiresSize ? size : null;
    const phraseRole = state.role === 'delivery' ? 'employee' : 'customer';
    const { correct, options } = model.phraseOptionsFor(
      item, cleanSize, state.scenario.categories, phraseRole, Math.random
    );
    state.phraseCheck = { productId, size: cleanSize, item, correct, options, wrongPick: null, misses: 0 };
    render(false);
  }

  function closePhraseCheck() {
    // salir sin resolver el reto rompe la racha — es una decisión real
    // (saltarse la frase), no debería "no contar" en el marcador
    if (state.phraseCheck) state.streak = 0;
    state.phraseCheck = null;
    render(false);
  }

  // mensajes cálidos y variados en vez de un "Not quite" seco siempre
  // igual — Duolingo insiste en que el tono de error importa tanto
  // como la corrección misma para que la gente se anime a seguir
  const RETRY_MESSAGES = [
    "Close! Check the word order.",
    "Almost — try again.",
    "Not quite yet — you'll get it."
  ];

  function resolvePhrase(picked) {
    const check = state.phraseCheck;
    if (!check) return;
    state.phraseScore.attempts += 1;
    if (picked === check.correct) {
      state.phraseScore.correct += 1;
      // la racha solo sube si acertó SIN fallar antes en esta frase —
      // adivinar tras ver el error no debería premiarse igual que
      // producir la frase correcta desde el primer intento
      if (check.misses === 0) state.streak += 1;
      else state.streak = 0;
      addLine(check.productId, check.size);
      state.phraseCheck = null;
      announce('Correct! Added ' + (check.size ? titleCase(check.size) + ' ' : '') + check.item.name);
      render(false);
    } else {
      check.wrongPick = picked;
      check.misses += 1;
      state.streak = 0;
      announce(RETRY_MESSAGES[Math.min(check.misses - 1, RETRY_MESSAGES.length - 1)]);
      render(false);
    }
  }

  function addLine(productId, size) {
    const item = model.itemById(productId, state.scenario.catalog);
    const cleanSize = item.requiresSize ? size : null;
    const existing = state.cart.items.find(
      (line) => line.productId === productId && line.size === cleanSize
    );
    if (existing) existing.quantity += 1;
    else state.cart.items.push({ productId, size: cleanSize, quantity: 1 });
    state.feedback = [];
  }

  function changeQuantity(productId, size, delta) {
    const line = state.cart.items.find(
      (entry) => entry.productId === productId && entry.size === size
    );
    if (!line) return;
    line.quantity += delta;
    if (line.quantity <= 0) {
      state.cart.items = state.cart.items.filter((entry) => entry !== line);
    }
    state.feedback = [];
    render(false);
  }

  function renderCartLines(interactive) {
    if (!state.cart.items.length) return '<p class="empty">Your order is empty.</p>';

    return '<ul class="cart-lines">' + state.cart.items.map((line) => {
      const item = model.itemById(line.productId, state.scenario.catalog);
      const lineName = (line.size ? titleCase(line.size) + ' ' : '') + item.name;
      const controls = interactive
        ? '<span class="stepper">' +
            '<button type="button" data-change="-1" data-id="' + line.productId + '" data-size="' + (line.size || '') + '" aria-label="Remove one ' + lineName + '">−</button>' +
            '<b>' + line.quantity + '</b>' +
            '<button type="button" data-change="1" data-id="' + line.productId + '" data-size="' + (line.size || '') + '" aria-label="Add one ' + lineName + '">+</button>' +
          '</span>'
        : '<b>× ' + line.quantity + '</b>';

      return '<li class="cart-line"><span>' + lineName +
        '<small>' + money(priceFor(item, line.size) * line.quantity) + '</small></span>' +
        controls + '</li>';
    }).join('') + '</ul>';
  }

  function renderTicket() {
    if (!state.target) return '';

    return '<section class="ticket" aria-labelledby="ticket-title">' +
      '<div class="ticket-meta"><span>' + state.scenario.name.toUpperCase() + '</span><span>ORDER #' + state.ticketNumber + '</span></div>' +
      '<h2 id="ticket-title">Prepare this order</h2>' +
      '<p class="ticket-note">Select every item, size and quantity shown below.</p>' +
      '<ul class="ticket-lines">' +
      state.target.items.map((line) => '<li>' + model.labelLine(line, state.scenario.catalog) + '</li>').join('') +
      '</ul></section>';
  }

  function submitOrder() {
    if (!state.cart.items.length) {
      state.feedback = ['Your order is empty. Add at least one item.'];
      announce(state.feedback[0]);
      render(false);
      return;
    }

    if (state.role === 'delivery') {
      const result = model.compareOrders(state.target, state.cart, state.scenario.catalog);
      state.feedback = result.feedback;
      state.success = result.matches;
      announce(result.matches ? 'Order ready!' : result.feedback.join('. '));
    } else {
      state.feedback = [];
      state.success = true;
      announce('Order created!');
    }

    render(state.success);
    if (state.success) launchConfetti();
  }

  // el reto de frase, como overlay: se ve la tarjeta del producto
  // detrás para que quede claro qué se está pidiendo, y las opciones
  // dan feedback inmediato (verde/rojo) sin perder el progreso
  function renderPhraseModal() {
    const check = state.phraseCheck;
    if (!check) return '';

    const optionsHtml = check.options.map((text) => {
      let cls = 'phrase-option';
      if (check.wrongPick) {
        if (text === check.correct) cls += ' right';
        else if (text === check.wrongPick) cls += ' wrong';
      }
      return '<button type="button" class="' + cls + '" data-phrase="' + encodeURIComponent(text) + '">' +
        text + '</button>';
    }).join('');

    const prompt = state.role === 'delivery'
      ? 'How do you ask about ' + (check.size ? 'the size for ' : '') + check.item.name + '?'
      : 'How do you ask for ' + (check.size ? 'a ' + titleCase(check.size) + ' ' : 'a ') + check.item.name + '?';

    // pista progresiva: falla dos veces la misma frase y se revela el
    // arranque como andamiaje (fill-in-the-blank), en vez de dejar que
    // siga adivinando a ciegas — mismo patrón que usa Duolingo cuando
    // detecta que alguien se atoró en el mismo punto
    const starterWords = check.correct.split(' ').slice(0, 2).join(' ');
    const hint = check.misses >= 2
      ? '<p class="phrase-hint phrase-hint-strong">Hint: it starts with "' + starterWords + '…"</p>'
      : (check.wrongPick ? '<p class="phrase-hint">' + RETRY_MESSAGES[Math.min(check.misses - 1, RETRY_MESSAGES.length - 1)] + '</p>' : '');

    const streakBadge = state.streak >= 2
      ? '<p class="streak-badge">🔥 ' + state.streak + ' in a row!</p>'
      : '';

    return '<div class="phrase-overlay" role="dialog" aria-modal="true" aria-labelledby="phrase-title">' +
      '<div class="phrase-card">' +
        '<p class="eyebrow">' + (state.role === 'delivery' ? 'SAY IT TO THE CUSTOMER' : 'SAY IT TO ORDER') + '</p>' +
        streakBadge +
        '<h2 id="phrase-title">' + prompt + '</h2>' +
        '<div class="phrase-options">' + optionsHtml + '</div>' +
        hint +
        '<button type="button" class="phrase-cancel" id="phrase-cancel">‹ Back to menu</button>' +
      '</div>' +
    '</div>';
  }

  function wirePhraseModal() {
    const overlay = document.querySelector('.phrase-overlay');
    if (!overlay) return;
    overlay.querySelectorAll('[data-phrase]').forEach((button) => {
      button.addEventListener('click', () => resolvePhrase(decodeURIComponent(button.dataset.phrase)));
    });
    const cancel = document.getElementById('phrase-cancel');
    if (cancel) cancel.addEventListener('click', closePhraseCheck);
  }

  function renderKiosk() {
    const scenario = state.scenario;
    const tabs = scenario.categories.map((category) =>
      '<button class="tab' + (state.category === category ? ' active' : '') + '" type="button" ' +
      'data-category="' + category + '" aria-pressed="' + (state.category === category) + '">' +
      (scenario.categoryLabels[category] || category).toUpperCase() + '</button>'
    ).join('');

    const products = scenario.catalog
      .filter((item) => item.category === state.category)
      .map(renderProduct)
      .join('');

    const feedback = state.feedback.length
      ? '<ul class="feedback" aria-label="Check your order">' +
        state.feedback.map((message) => '<li>' + message + '</li>').join('') + '</ul>'
      : '';

    const scorePill = '<span class="score-pill" title="Phrases you got right on the first try">' +
      '<i></i>' + state.phraseScore.correct + '/' + state.phraseScore.attempts + ' PHRASES' +
      '</span>';

    app.innerHTML =
      '<section class="kiosk" aria-labelledby="kiosk-title">' +
        '<div class="kiosk-head"><div><p class="eyebrow">' +
          scenario.name.toUpperCase() + ' · ' + (state.role === 'customer' ? 'CUSTOMER MODE' : 'STAFF MODE') +
          '</p><h1 id="kiosk-title">' +
          (state.role === 'customer' ? 'Create your order' : 'Prepare the ticket') +
          '</h1></div><span class="mode-pill"><i></i>OPEN</span>' + scorePill + '</div>' +
        '<div class="kiosk-grid">' +
          '<div class="catalog"><nav class="tabs" aria-label="Menu categories">' + tabs + '</nav>' +
            '<div class="products">' + products + '</div></div>' +
          '<aside class="kiosk-side">' + renderTicket() +
            '<section class="cart" aria-labelledby="cart-title"><h2 id="cart-title">My order</h2>' +
              renderCartLines(true) + feedback +
              '<p class="cart-total"><span>Total</span><b>' +
                money(model.calculateTotal(state.cart, state.scenario.catalog)) +
              '</b></p>' +
              '<button class="primary submit-order" id="submit-order" type="button">' +
                (state.role === 'customer' ? 'CREATE ORDER' : 'CHECK ORDER') +
              '</button>' +
            '</section>' +
          '</aside>' +
        '</div>' +
      '</section>' +
      renderPhraseModal();

    app.querySelectorAll('[data-category]').forEach((button) => {
      button.addEventListener('click', () => {
        state.category = button.dataset.category;
        render(false);
      });
    });
    app.querySelectorAll('[data-order]').forEach((button) => {
      button.addEventListener('click', () => {
        openPhraseCheck(button.dataset.order, button.dataset.size || null);
      });
    });
    wirePhraseModal();
    app.querySelectorAll('[data-change]').forEach((button) => {
      button.addEventListener('click', () => {
        changeQuantity(
          button.dataset.id,
          button.dataset.size || null,
          Number(button.dataset.change)
        );
      });
    });
    document.getElementById('submit-order').addEventListener('click', submitOrder);
  }

  function renderSuccess() {
    const customer = state.role === 'customer';
    app.innerHTML =
      '<section class="success" aria-labelledby="success-title">' +
        '<div class="success-mark" aria-hidden="true">✓</div>' +
        '<p class="eyebrow">' + state.scenario.name.toUpperCase() + '</p>' +
        '<h1 class="display" id="success-title">' +
          (customer ? 'ORDER CREATED!' : 'ORDER READY!') +
        '</h1>' +
        '<p class="lead">' +
          (customer ? 'Your order has been created.' : 'You prepared the ticket correctly.') +
        '</p>' +
        '<div class="success-summary">' + renderCartLines(false) +
          '<p class="success-total"><span>Total</span><b>' +
            money(model.calculateTotal(state.cart, state.scenario.catalog)) +
          '</b></p></div>' +
        '<div class="actions">' +
          '<button class="primary" id="another-order" type="button">' +
            (customer ? 'CREATE ANOTHER ORDER' : 'PREPARE ANOTHER ORDER') +
          '</button>' +
          '<button class="secondary" id="change-role" type="button">CHANGE ROLE</button>' +
          '<button class="secondary" id="change-scenario" type="button">CHOOSE ANOTHER PLACE</button>' +
        '</div>' +
      '</section>';

    document.getElementById('another-order').addEventListener('click', () => {
      state.cart = { items: [] };
      state.category = state.scenario.categories[0];
      state.feedback = [];
      state.success = false;
      if (!customer) {
        state.target = model.createRandomOrder(state.scenario.catalog, state.scenario.categories, Math.random);
        state.ticketNumber = newTicketNumber();
      }
      render(true);
    });
    document.getElementById('change-role').addEventListener('click', () => {
      state.role = null;
      state.success = false;
      render(true);
    });
    document.getElementById('change-scenario').addEventListener('click', resetState);
  }

  function launchConfetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const layer = document.getElementById('confetti');
    const theme = state.scenario.theme;
    const colors = [theme.primary, theme.accent, '#39a96b', '#f2f0ec'];
    layer.innerHTML = Array.from({ length: 72 }, (_, index) =>
      '<i style="left:' + (Math.random() * 100) + '%;background:' +
      colors[index % colors.length] + ';--drift:' + ((Math.random() - .5) * 240) +
      'px;animation-delay:' + (Math.random() * .35) + 's"></i>'
    ).join('');
    window.setTimeout(() => { layer.innerHTML = ''; }, 2100);
  }

  function render(focusHeading) {
    if (!state.scenario) renderScenarioSelect();
    else if (state.success) renderSuccess();
    else if (!state.role) renderRoleSelect();
    else renderKiosk();

    if (focusHeading) {
      const heading = app.querySelector('h1, h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }
  }

  document.getElementById('reset-app').addEventListener('click', resetState);

  fetch('order-scenarios.json')
    .then((response) => { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); })
    .then((data) => {
      state.scenarios = data.scenarios || [];
      render(true);
    })
    .catch((error) => {
      app.innerHTML = '<p class="load-error">The kiosk could not load its menus. Reload the page to try again.</p>';
      console.error('[grammar-grill]', error);
    });
}());
