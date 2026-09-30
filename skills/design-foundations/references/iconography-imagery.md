# Iconography and imagery

Rules for using icons and images consistently. For choosing an icon library, see `design-resources`.

## Part A: Icons

### Use one family, one style
**Rule.** A product uses one icon family with one stroke width and one corner style. The only second set is for brand logos (for example Simple Icons).
**Apply when.** Choosing icons, or adding an icon that isn't in the current set.
**Do / Avoid.** Do draw a missing glyph in the family's grid and stroke. Avoid mixing Lucide and Phosphor on one screen, or using emoji or Unicode symbols as icons.
**Why.** Mismatched stroke, corner, and terminal shapes read as assembled rather than designed (similarity, Gestalt).

### Size icons on the spacing grid
**Rule.** Use 16px for inline text and dense tables, 20px in buttons and inputs, 24px in nav, tab bars, and toolbars, and 32–48px in empty states and feature tiles. Keep the icon box square.
**Apply when.** Placing any icon.
**Do / Avoid.** Do keep the stroke visually constant when scaling down: use an absolute-stroke option or a size-optimized variant (a micro set, or Material Symbols' `opsz` axis). Avoid scaling a 24px icon to 14px, where its stroke turns hairline-thin.
**Why.** Icons are drawn for a grid, and off-grid sizes blur and lose weight.

### Match icons to the adjacent text
**Rule.** An icon's optical height is about the cap height of the text next to it. Its stroke weight tracks the text weight: a heavier stroke beside semibold text, lighter beside regular.
**Apply when.** Pairing icons with labels in buttons, menus, and lists.
**Do / Avoid.** Do use a 2px stroke with 600-weight labels, and 1.5px with 400. Avoid a thin icon beside bold text in a lockup.
**Why.** Visual weight must balance, or the eye stops on the heavier element.

### Align optically, not geometrically
**Rule.** After rendering, nudge icons ±1px so they look centered. Play triangles shift right; icons align to the x-height or cap height rather than the line box. In a button, the icon-side padding is usually slightly smaller than the text-side padding.
**Apply when.** Any icon + text lockup or icon-only button.
**Do / Avoid.** Do check alignment at 200–400% zoom. Avoid trusting `align-items: center` blindly.
**Why.** Glyph bounding boxes include empty space, so geometric centering looks off.

### Encode state with fill, not a different icon
**Rule.** Use outline icons for rest and filled icons for selected or active states (tab bars, toggles, favorites). All peers in the same state share one style.
**Apply when.** Navigation, toggles, and bookmarks.
**Do / Avoid.** Do use Remix Line/Fill pairs, Phosphor regular/fill, or Material Symbols FILL 0→1. Avoid one filled icon among outlined peers in the rest state.
**Why.** Fill is a pre-attentive signal. Using it inconsistently creates false emphasis.

### Separate the target from the glyph
**Rule.** The glyph can be 16–20px, but the interactive target is ≥ 24×24 CSS px (WCAG 2.5.8), and 44pt on iOS or 48dp on Android.
**Apply when.** Icon buttons, close buttons, and inline actions.
**Do / Avoid.** Do add padding or a pseudo-element hit area. Avoid a 16px clickable "×" with no padding.
**Why.** Fitts's law: small targets are slow and error-prone, especially on touch.

### Name icons for assistive tech, or hide them
**Rule.** Icon-only buttons have an accessible name (`aria-label` or visually hidden text). Decorative icons next to text get `aria-hidden="true"`. Status is never shown by an icon or color alone; add a text label.
**Apply when.** Every icon.
**Do / Avoid.** Do write `<button aria-label="Delete draft">` around a trash icon. Avoid a `title` attribute as the only name.
**Why.** Screen readers announce unlabeled buttons as "button", which is useless.

### Name and reserve icons by meaning
**Rule.** Name icons by purpose ("delete", "play"), not by shape ("trash", "triangle"). Reserve system icons (add, delete, close, back) for those actions only. Avoid cliché metaphors (a rocket for "launch", a shield for "security", a lightbulb for "ideas") unless they are the clearest option.
**Apply when.** Building the icon set or a design system.
**Do / Avoid.** Do use one icon per concept everywhere. Avoid reusing the "+" icon for "expand".
**Why.** Consistent mapping lets users learn the vocabulary (Jakob's law, consistency heuristic).

### Animate icons rarely
**Rule.** Animated or morphing icons suit rare or feedback moments: copy → check, play ↔ pause, menu ↔ close. Icons the user triggers many times a day don't animate. Always honor `prefers-reduced-motion`.
**Apply when.** Adding animated icon libraries.
**Do / Avoid.** Do morph copy → check once on success. Avoid bouncing nav icons on every hover.
**Why.** Motion is noticed. Frequent motion becomes noise and slows repeat use.

### Use platform symbols on native
**Rule.** Use SF Symbols on Apple platforms, matched to the text style's weight and scale. Use Material Symbols on Android, with `wght` matched to the font and `opsz` matched to the pixel size. Never ship SF Symbols in web or Android builds (license).
**Apply when.** Building iOS, macOS, or Android UI.
**Do / Avoid.** Do use hierarchical or palette rendering for depth. Avoid web icon fonts inside native apps.
**Why.** System symbols align with system type and Dynamic Type, and users recognize them.

## Part B: Imagery

### Show the subject's real world
**Rule.** Hero and feature images show the product or the subject itself: real screenshots, real photos, real output. Search for the subject's physical objects, not the category.
**Apply when.** Choosing any image or illustration.
**Do / Avoid.** Do show the actual dashboard with realistic, labeled demo data. Avoid stock people pointing at laptops, corporate Memphis figures, glossy isometric tech scenes, gradient blobs, and div-drawn fake UIs.
**Why.** Specific imagery builds trust and recall. Generic imagery signals a template.

### One decisive image beats five mediocre ones
**Rule.** Use fewer, better images with a consistent treatment: the same aspect ratios per slot, the same color grading, the same crop logic.
**Apply when.** Galleries, feature sections, and blog headers.
**Do / Avoid.** Do define slot ratios (16:9 hero, 4:3 card, 1:1 avatar) and keep to them. Avoid mixing illustration styles or photo styles on one page.
**Why.** Consistency reads as intent. Variety without a rule reads as collage.

### Protect text over images
**Rule.** Text on an image needs a scrim, gradient overlay, or solid panel that keeps 4.5:1 contrast over the **worst** part of the image, at every crop and breakpoint.
**Apply when.** Hero overlays and cards with background images.
**Do / Avoid.** Do add a bottom-up gradient scrim behind captions. Avoid white text on an unmodified photo.
**Why.** Images change with crops and replacements, so contrast must be guaranteed by the overlay, not by luck.

### Size and load images correctly
**Rule.** Every image has `width`/`height` or `aspect-ratio`. Use AVIF or WebP with fallbacks, and `srcset` + `sizes` capped at 2× DPR. The LCP image is never lazy-loaded; use `fetchpriority="high"` instead. Below-the-fold images are lazy.
**Apply when.** Every `<img>` and background image.
**Do / Avoid.** Do use `<picture>` for art-directed crops on mobile. Avoid a 4000px JPEG scaled by CSS.
**Why.** Unsized images cause layout shift (CLS), and oversized ones slow LCP (see `web-platform`).

### Write alt text for meaning
**Rule.** Informative images get alt text that conveys what the image shows in context. Decorative images get `alt=""`. Images of text are avoided; if they are unavoidable, the alt repeats the text.
**Apply when.** Every image.
**Do / Avoid.** Do write `alt="Invoice list filtered to overdue, showing 3 results"`. Avoid `alt="image"` or `alt="screenshot"`.
**Why.** Screen-reader users get only the alt (WCAG 1.1.1).

### Keep illustration to one system
**Rule.** If the product uses illustration, define one style (line weight, palette from tokens, level of detail, perspective) and use it for all empty states, onboarding, and marketing.
**Apply when.** Adding spot illustrations or empty-state art.
**Do / Avoid.** Do derive illustration colors from the palette. Avoid mixing 3D icons, flat line art, and emoji-style art.
**Why.** Illustration is part of the brand voice. Mixed styles break it.

### Label generated imagery honestly
**Rule.** AI-generated images are fine for mood and illustration, but must not pose as real people, customers, product photos, or events. Keep the generation prompt or source with the asset, and verify stock URLs resolve before shipping.
**Apply when.** Using image generation or stock.
**Do / Avoid.** Do record the source in the asset's metadata or a manifest. Avoid "customer photos" that were generated.
**Why.** Fabricated imagery is a trust and legal risk, and a known slop tell.

### Keep texture cheap and still
**Rule.** Grain or noise sits on a fixed, `pointer-events: none` overlay at about 3–8% opacity, never animated and never on scrolling containers.
**Apply when.** Adding texture to fight flatness or gradient banding.
**Do / Avoid.** Do use a small tiled noise image or an SVG `feTurbulence` overlay. Avoid a full-screen animated noise canvas.
**Why.** Texture adds material quality cheaply, but animated overlays cost frames and battery.

## Sources

- Vercel Web Interface Guidelines (balance contrast in lockups, optical alignment, icons have labels, image dimensions): https://github.com/vercel-labs/web-interface-guidelines
- Design System Checklist (iconography: naming by purpose, reserved icons, a11y names): https://www.designsystemchecklist.com/
- Impeccable (imagery from the subject's world, one decisive photo, provenance, no shape-assembled illustrations): https://github.com/pbakaus/impeccable
- ui-skills playbook (stroke matched to text weight, outline vs filled): https://github.com/ibelick/ui-skills
- Lucide (absoluteStrokeWidth): https://lucide.dev ; Material Symbols axes: https://fonts.google.com/icons ; SF Symbols: https://developer.apple.com/sf-symbols/
- WCAG 2.2 (1.1.1, 1.4.3, 2.5.8): https://www.w3.org/TR/WCAG22/
