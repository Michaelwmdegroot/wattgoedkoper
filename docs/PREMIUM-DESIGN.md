# Premium visual edition — 14 November 2026

## Intent

Continue the working interactive energy house from `4c25b4e`, using the owner's
photographic reference as the art direction. The house remains immediately
usable. The calculator, consent policy and advice backend keep their existing
contracts.

## Design

- Warm ivory background, navy text, sunlight yellow and restrained sage accents.
- Locally served DM Serif Display for editorial headings and variable Manrope
  for controls, body copy and figures. Both font licenses are in `assets/fonts/`.
- Five photographic house types: a genuine middle terraced home, an end home,
  a semi-detached pair, a detached home and a small apartment building.
- Each type has a base photograph without equipment and a closely registered
  generated edit. Separate feathered CSS masks reveal solar, heatpump and
  battery equipment independently. Base and equipment images are WebP.
- Five coordinated editorial/product images for the measure cards, matching
  article headers and related reading. No generated UI text is used.
- Header navigation points to working sections and pages. No fictitious account
  feature, supplier feed, independent advice claim or review rating is added.

`assets/premium.css` contains the visual overrides. `assets/house-scene.mjs`
and `assets/house-scene.css` compose photographs, accessible controls and
illustrative energy paths. The calculation engine is not changed.

## Interaction details

- House type switches the actual photograph. Residents and installed equipment
  are also reflected in the scene. Hardware is hidden in the current-home view
  unless marked as already installed.
- The selected-upgrade toggle state remains accurate in both comparison views;
  changing the view does not remove choices from the plan.
- Solar-only flows end at the house. Storage adds a battery route. The day/night
  control changes the atmosphere without changing the annual calculation.
- Photographic panel count and placement are illustrative. Input values and the
  energy plan own the exact numerical assumptions.
- Basic house controls are immediately visible. Secondary insulation/equipment
  controls expand in place. The expansion remains open during input updates.
- Rent/VvE notes and the explicit restore link remain outside the collapsed area.
- Mobile uses the house first, then controls, horizontal measure cards and the
  full result, with a persistent concise plan button. Native HTML buttons remain
  available alongside drag-and-drop. Reduced-motion preferences are supported.
- The public information pages, privacy/model explanations, optional plan dialog
  and admin styling follow the same palette and typography.

## Image provenance

All fifteen shipped raster assets were generated with the built-in `image_gen`
tool specifically for this project, then encoded as WebP. Prompts instructed
natural architectural/product photography, consistent warm daylight, cream
facades, terracotta roofs where applicable, restrained greenery, no logos,
no lettering and no watermarks. The images are conceptual illustrations, not
photographs of installed projects, certified installations or named products.

See `docs/image-prompts.json` for the actual prompt records. Hardware edits
explicitly preserved the original camera, architecture and background.

## Delivery and validation

The standalone preview is built from the same source files by
`python3 scripts/build-preview.py`. Fonts, image files and the six public content
pages are embedded. The offline guard disables tracking and advice requests.

The existing 47 calculation/scenario tests and JavaScript syntax checks pass.
Browser regression checks and visual evidence are provided by the visual-review
workflow. Refer to the workflow artifacts and release notes for the verified run.

Production hosting and live advice activation are separate from this visual
edition; the existing deployment requirements in `docs/DEPLOYMENT.md` still apply.
