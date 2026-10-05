# Dynostack identity

Dynostack is the parent platform. Grid is its first shipped product, not the limit of the brand.

The mark is a layered D with an internal forward signal. Grid keeps the same outer silhouette and replaces the signal with four data tiles. Future products should share the outer mark and typography; a distinct inner symbol identifies each product.

Source geometry: `identity.json`. Generate deployable assets with `node scripts/brand-assets.mjs`. Assets live in `showcase/public/brand` and have transparent backgrounds. `light` filenames mean dark ink for light backgrounds; `dark` filenames mean pale ink for dark backgrounds. SVG wordmarks use editable text with Arial/Helvetica fallbacks; the website uses Geist for its live wordmark.

Keep at least one quarter of the mark's width clear on each side. Display marks at 20px or larger. Do not stretch, rotate, outline, add shadows, or use the Grid mark for the parent brand. Use the favicon's framed variant at small browser-tab sizes.

`showcase/src/products.ts` is the product registry. Add a product when it has a working route and documentation. The homepage leaves an explicit space for future tools without listing unavailable features as usable products.
