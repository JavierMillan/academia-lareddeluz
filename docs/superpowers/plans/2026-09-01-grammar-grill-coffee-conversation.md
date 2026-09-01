# Grammar Grill Coffee Conversation Implementation Plan

**Goal:** Implement the already-approved coffee-shop conversation design in Academy, including drink-specific questions, progressive Spanish help, both learner roles, checkout questions, and matcha.

**Architecture:** `order-scenarios.json` owns reusable question/profile data. Pure functions in `grammar-grill-model.js` resolve and validate turns and preserve modifiers. `grammar-grill.js` renders the conversation state while retaining the existing one-phrase flow for products without profiles.

## Task 1: Define and test the conversation model

**Files:**
- Modify `cursos/ingles/scripts/test-grammar-grill.cjs`
- Modify `cursos/ingles/recursos/order-scenarios.json`
- Modify `cursos/ingles/recursos/grammar-grill-model.js`

- [ ] Add failing assertions for the exact approved profiles, matcha products, opposite customer/barista turns, invalid selections, modifier-aware normalization/comparison, and customized labels.
- [ ] Add coffee question definitions, profiles, checkout questions, matcha latte, and iced matcha latte to the café scenario.
- [ ] Add pure model functions `questionsForProduct`, `createConversationTurn`, `applyConversationChoice`, and modifier-aware line identity/labels.
- [ ] Run `node cursos/ingles/scripts/test-grammar-grill.cjs` until the old and new model contracts pass.

## Task 2: Render and test guided conversations

**Files:**
- Modify `cursos/ingles/scripts/test-grammar-grill-ui.cjs`
- Modify `cursos/ingles/recursos/grammar-grill.js`
- Modify `cursos/ingles/recursos/grammar-grill.css`

- [ ] Add failing UI-contract assertions for conversation progress, speaker, live summary, Spanish help, starter text, and incomplete-line protection.
- [ ] Route profiled café products through a multi-turn conversation state; retain the legacy phrase overlay for unprofiled products.
- [ ] Reveal Spanish meaning and an English starter after the first incorrect choice without erasing completed turns.
- [ ] Add a final confirmation turn, `Anything else?`, and the shared for-here/to-go, order-name, and payment questions once per order.
- [ ] Add responsive conversation-card styles and run the model/UI contract tests.

## Task 3: Prove both roles and publish

**Files:**
- Modify `cursos/ingles/scripts/test-grammar-grill-e2e.cjs`

- [ ] Add browser flows for iced matcha as customer, matcha as barista, the shared checkout sequence, legacy McDonald's behavior, progressive help, and 390px overflow.
- [ ] Run the full Academy pre-push suite and build the 44-route artifact.
- [ ] Commit and push Academy, wait for the exact successful deploy, then verify the live scenario JSON contains matcha and the live browser flow completes.
