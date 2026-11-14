# WattGoedkoper

Dutch consumer energy planning tool and lead generation for NIVO Groep Holland and Thuisbatterij Team.

## Product rules
- Show the full useful calculation without requiring contact details. Advice requests are optional and consent is explicit.
- Declare the commercial relationship. Never claim independence, guaranteed return, live supplier prices, certified audit or live meter data without evidence.
- Use documented deterministic calculations with editable assumptions, uncertainty ranges and primary source URLs. Distinguish household use, grid import, PV production and export.
- Scenarios must not double count savings. 2026 saldering and 2027 onward are separate models.
- Personal information is submitted only by explicit advice request. No trackers or third party marketing scripts. Use aggregate events only after optional analytics consent.
- No secrets or real customer data in Git, build output, logs or frontend. Backend fails closed before secure setup.
- Admin mail is optional, server-only, read-only IMAP and explicit human SMTP send. Never embed passwords in client code or Git. Keep wattgoedkoper.nl and zonlio.nl separated; do not use the Hostinger MySQL DB linked to zonlio.nl without verification.

## Architecture
- Plain HTML/CSS/ES modules at the repository root for direct PHP/static Hostinger Git deployment.
- PHP 8.2+ backend, PDO MySQL on new Hostinger production database or legacy PDO SQLite; private config and keys always outside web root.
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

## Handoff / next workstream — 14 November 2026

- Read [docs/HANDOFF-2026-11-14-GPT6PRO.md](docs/HANDOFF-2026-11-14-GPT6PRO.md) and [docs/UX-LEAD-FUNNEL-V05.md](docs/UX-LEAD-FUNNEL-V05.md) before coding. The project is LIVE with a confirmed MySQL lead test; do not reinitialize database, rotate encryption keys, or copy real data.
- Owner decision for new advice requests: **NIVO Groep Holland only**. Remove partner selector in UI AND enforce server-side routing; keep historical partner records intact.
- A **transactional report email** requested by a visitor does NOT grant consent for NIVO contact, CRM processing or marketing. Keep advice consent and analytics opt-in separate; report sending is not built yet. Public mail must remain disabled until the correct Hostinger mailbox has been configured and verified.
- Premium primary plan dialog and admin lead detail must fit essential content and CTA/actions in one desktop viewport (test 1366x768 and 1440x900); responsive mobile needs accessible action without obscured elements. Preserve numerical model and accessibility.
- Deliver implementation on a feature branch with PR, privacy/docs, real browser screenshots and CI evidence. Main auto-deploys to Hostinger; treat production mail and live customer data as high-risk.
