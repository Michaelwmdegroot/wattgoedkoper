# WattGoedkoper

Dutch consumer energy planning tool and lead generation for NIVO Groep Holland and Thuisbatterij Team.

## Product rules
- Show the full useful calculation without requiring contact details. Advice requests are optional and consent is explicit.
- Declare the commercial relationship. Never claim independence, guaranteed return, live supplier prices, certified audit or live meter data without evidence.
- Use documented deterministic calculations with editable assumptions, uncertainty ranges and primary source URLs. Distinguish household use, grid import, PV production and export.
- Scenarios must not double count savings. 2026 saldering and 2027 onward are separate models.
- Personal information is submitted only by explicit advice request. No trackers or third party marketing scripts. Use aggregate events only after optional analytics consent.
- No secrets or real customer data in Git, build output, logs or frontend. Backend fails closed before secure setup.

## Architecture
- Plain HTML/CSS/ES modules at the repository root for direct PHP/static Hostinger Git deployment.
- PHP 8.2+ / PDO SQLite backend, persistent private storage outside web root.
- Node built-in tests for calculation engine. PHP integration tests for lead storage and access control. Browser smoke test for desktop/mobile, keyboard and interactive house flow.
- Main is the intended deployment branch. No force pushes. Avoid editing another contributor's files.

## Interactive product rules
- The home is immediately usable; do not restore a sequential questionnaire as the main experience.
- Existing equipment is distinct from proposed upgrades. Day/night is illustrative only.
- Free scenario selections may exceed budget or lose money; show those outcomes, never silently optimize away a manual choice.
- Keep click/touch/keyboard alternatives to drag and drop and preserve undo.

## Work split
- Root: assets/model.mjs, tests/model.test.mjs, source registry, project/deploy docs and integration.
- Frontend contributor: index.html, assets/app.mjs, assets/styles.css, assets visual files.
- Backend contributor: api/, lib/, admin/, scripts/ backend setup, tests/backend* and dev router.
