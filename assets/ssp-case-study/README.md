# SSP case study

`ssp.html` replaces the previous SSP page with a self-initiated redesign case study. Its CSS and JavaScript are isolated in this directory; other portfolio pages and the generated global theme are unchanged.

## Visual alignment with the homepage

The page mirrors the existing homepage's Libre Franklin headings, Source Sans 3 body text, charcoal (`#232323`) sections, light-blue (`#9fdbf8`) headings, blue (`#47b5ed`) buttons, white content areas, four-pixel corners, existing logo, and navigation labels. The font import matches the homepage's generated stylesheet. The page does not import the full generated theme, so unrelated Mobirise component rules cannot affect the prototype. Navigation collapses into a toggle menu on small screens.

## Editing

- Copy and page structure: `ssp.html`.
- Responsive styling, diagrams, and print rules: `style.css`.
- Local search, filters, request preview, replies, closure, and chapter navigation: `script.js`.
- The Discovery gallery reuses the original research planning, synthesis, and competitor analysis images under `assets/images/`.
- The always-visible starting-artifacts section reuses two existing images and includes the uploaded Crazy 8 screenshot at `assets/ssp-case-study/crazy8-closing.png`. All screenshot references are local website assets; there are no full-size image interactions.

The artifact section is organized into three stages: framing the friction, exploring closing-flow alternatives, and refining the interface hierarchy. Each stage includes a short explanation and a design takeaway. The overview and incident detail are displayed in separate CSS viewports of the same original reference image; no screenshot pixels have been changed. On mobile, the reference views stack vertically.

The current source was prepared from the user's final edited HTML download. Its text, footer, images, static gallery behavior, and homepage-matching back-to-top control are preserved. Styles and scripts were extracted into the page's existing asset files for website deployment. The downloadable single-file version retains embedded images; the repository version uses identical local image bytes.

### Visual editing mode

The downloadable preview includes an **Edit page** button. After publication, the repository page exposes the same local tools when opened with `?edit=1`. Normal website visitors see no editor controls.

- Click a heading, paragraph, caption, table cell, or metadata value to edit it. Inline emphasis is retained; pasted content is plain text.
- Use **Sections** to show or hide narrative sections and the interactive prototype. The hero remains visible. Links to hidden chapters are also hidden.
- **Undo**, **Redo**, and an undoable **Reset** cover text changes and section visibility. Reset requires a second click to confirm.
- Drafts are saved to this browser's local storage when available. They do not sync to other browsers or to GitHub. If browser storage is blocked, download an editable copy before closing.
- **Download page** exports a clean `ssp.html` with styles, prototype behavior, images, and edits included. Editor controls, editor code, and live prototype activity are excluded.
- **Save editable copy** downloads the same content with editing tools for later work. Downloaded files do not update the live website; upload the clean HTML or have it committed to the repository.

The source page loads page-local `editor.css` and `editor.js`. The authoring script is inactive without the explicit editor flag. Downloads embed local dependencies; the existing Google Fonts import still needs internet access for the exact font faces, with standard fallback fonts available offline. Visual editing covers documentation text and section visibility, not prototype data, image replacement, or layout redesign.

This page is maintained as HTML. Re-exporting `ssp.html` from the original Mobirise project can overwrite these changes, because `project.mobirise` has not been updated.

## Content provenance

The project owner identified this as a fictional portfolio project. The page identifies it as a self-initiated redesign. Research assumptions, the proposed six-person study, prototype sample data, and proposed acceptance targets remain labeled accurately. No completed interviews, usability results, launch, adoption lift, or customer endorsement are claimed. The inline interface illustrations are new design illustrations, and the archive identifies existing images as starting artifacts.

## Prototype

The portal preview supports filtering, searching, viewing request details, adding a reply, and closing a request with a message. It uses fictional sample records. State and drafts exist only in memory and reset on reload. It makes no network requests and sends no messages.

## Validation

- JavaScript syntax checked with `node --check`.
- HTML checked for unique IDs, valid local chapter targets, a single H1, and existing asset paths.
- Behavior checked against the actual HTML in a minimal DOM harness: mobile navigation toggle, Escape handling, close on navigation, search, filters, empty state, dialog data, safe text rendering, per-request drafts, reply state changes, cancellation, closure, counts, and session history.
- Editor state-model checks cover text and section changes, undo/redo, branching history, undoable reset, snapshot isolation, history bounds, and validation of recovered drafts. Browser editing, caret behavior, local storage, and download flows still need real browser verification.
- Real browser layout, keyboard behavior, and assistive technology checks remain required. Chromium was unavailable in the execution environment and its download was blocked; these checks have not been claimed as passed.

Before merging, open `ssp.html` through a local HTTP server and review desktop and mobile widths, keyboard navigation, dialog focus and Escape behavior, the archive images, and print output. Review the self-initiated project framing and proposed evaluation targets with the project owner.

## Applying the replacement

Merge the reviewed branch into the branch used by the website's existing publishing workflow. The case study keeps the same `ssp.html` URL, so the homepage project link continues to work. The pull request itself does not publish changes. Do not re-export this page from the unchanged Mobirise project, which can overwrite the HTML implementation.
