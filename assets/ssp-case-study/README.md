# SSP case study

`ssp.html` replaces the previous SSP page with a self-initiated concept case study. Its CSS and JavaScript are isolated in this directory; other portfolio pages and the generated global theme are unchanged.

## Editing

- Copy and page structure: `ssp.html`.
- Responsive styling, diagrams, and print rules: `style.css`.
- Local search, filters, request preview, replies, closure, and chapter navigation: `script.js`.
- The process archive reuses two existing files under `assets/images/`.

This page is maintained as HTML. Re-exporting `ssp.html` from the original Mobirise project can overwrite these changes, because `project.mobirise` has not been updated.

## Content provenance

The project owner identified this as a fictional portfolio project. The page therefore explicitly identifies it as a concept. Its research scenarios, six-person study plan, and numerical acceptance targets are illustrative. No completed interviews, usability results, launch, adoption lift, or customer endorsement are claimed. The inline interface illustrations are new concept reconstructions, and the archive identifies existing images as starting artifacts.

## Prototype

The portal preview supports filtering, searching, viewing request details, adding a reply, and closing a request with a message. It uses fictional sample records. State and drafts exist only in memory and reset on reload. It makes no network requests and sends no messages.

## Validation

- JavaScript syntax checked with `node --check`.
- HTML checked for unique IDs, valid local chapter targets, a single H1, and existing asset paths.
- Behavior checked against the actual HTML in a minimal DOM harness: search, filters, empty state, dialog data, safe text rendering, per-request drafts, reply state changes, cancellation, closure, counts, and session history.
- Real browser layout, keyboard behavior, and assistive technology checks remain required. Chromium was unavailable in the execution environment and its download was blocked; these checks have not been claimed as passed.

Before merging, open `ssp.html` through a local HTTP server and review desktop and mobile widths, keyboard navigation, dialog focus and Escape behavior, the archive images, and print output. Review the concept framing and proposed evaluation targets with the project owner.
