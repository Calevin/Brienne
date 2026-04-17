```markdown
# Design System Document: The Neoplastic Archive
 
## 1. Overview & Creative North Star
 
### Creative North Star: "The Balanced Asymmetric"
This design system moves beyond the predictable constraints of modern web grids. It is an exploration of **Neoplasticism**—the search for "universal harmony" through a reduction to essentials: vertical and horizontal lines, primary colors, and non-colors (white and black). 
 
Unlike traditional "template" designs that rely on cards and soft shadows, this system treats the browser viewport as a canvas. We break the visual monotony through **Intentional Asymmetry**. By using a rigid, thick-stroke framework to contain varying rectangular proportions, we create a sense of "Artistic Functionality." Every element is both a piece of data and a component of a larger, museum-grade editorial composition.
 
---
 
## 2. Colors
 
The color palette is a strict adherence to the primary triad, grounded by high-contrast neutrals. There are no gradients, no "soft" grays, and no rounded corners.
 
### Palette Strategy
- **Primary (`#bc0002`):** Reserved for high-urgency actions and hero focal points. Use it to draw the eye to the most critical "cell" in the layout.
- **Secondary (`#2c4bdb`):** Used for navigation anchors and interactive utility containers.
- **Tertiary (`#715d00` / Yellow):** Acts as the "highlight" color for selection states, status indicators, or secondary information blocks.
- **Background & Surfaces:** The system uses `surface` (`#f9f9f9`) as the base, but treats white as an active structural element rather than just "empty space."
 
### The "No-Softness" Rule
- **Prohibition of 1px borders:** In this system, boundaries are defined by **structural weight**. Standard 1px dividers are forbidden. Containers must be separated by thick, `#000000` strokes (suggested 4px to 8px) or by direct color-blocking where two fields meet.
- **Surface Nesting:** Use the `surface_container` tiers to create hierarchy. A `surface_container_highest` (`#e2e2e2`) block might sit adjacent to a pure `white` block to indicate a shift in content type without breaking the grid’s rectilinear flow.
- **Signature Polish:** To elevate the "Flat" aesthetic, use `primary_container` (`#e22619`) as a hover state for `primary` to provide a subtle, tactile "shift" that feels high-end and intentional.
 
---
 
## 3. Typography
 
The typography scale is built on **Inter** for structural clarity and **Space Grotesk** for technical labeling. The hierarchy is designed to feel like a high-end art gallery catalog.
 
- **Display (Lg/Md/Sm):** Set in **Inter**, Bold. Used sparingly for large, asymmetric headers. Letter spacing should be tight (-0.02em) to emphasize the blocky, architectural nature of the text.
- **Headline & Title:** Inter, Medium. These act as the "Captions" for your grid cells. 
- **Label (Md/Sm):** Set in **Space Grotesk**. This mono-leaning sans-serif provides a "metadeta" feel to lists and small callouts, contrasting against the editorial nature of the headlines.
- **Body:** Inter, Regular. High line-height (1.6) is required to provide "breath" inside the rigid, black-bordered cells.
 
---
 
## 4. Elevation & Depth
 
In a Neoplastic system, depth is not achieved through Z-index shadows, but through **Tonal Layering and Line Weight**.
 
- **The Layering Principle:** Depth is "Stacked Paper." To show a modal or a floating element, do not use a shadow. Instead, overlay a rectangular block with a thick `#000000` border. 
- **Ambient Shadows (The 4% Exception):** If a "floating" utility (like a FAB or Tooltip) requires separation from a busy background, use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(27, 27, 27, 0.06)`. It should look like a soft glow of light, not a shadow.
- **Glassmorphism:** For overlays, use a `surface` color with 80% opacity and a `backdrop-filter: blur(12px)`. This allows the primary colors of the grid to "bleed" through the interface, maintaining the artistic harmony of the underlying composition.
- **Ghost Borders:** If a container needs internal subdivision, use the `outline_variant` (`#e7bdb6`) at 20% opacity. It should be barely felt, acting as a guide rather than a barrier.
 
---
 
## 5. Components
 
### Buttons
- **Primary:** Rectangular, no border-radius. Background: `primary`. Text: `on_primary`. 8px black bottom-right "hard shadow" (a solid offset rectangle) to indicate clickability.
- **Secondary:** White background, 4px black border, Inter Bold text.
- **Tertiary:** Pure text in `secondary` color with a `label-md` style, underscored by a 2px block line.
 
### Cards & Lists
- **The No-Divider Rule:** Forbid horizontal lines between list items. Use alternating `surface_container_low` and `surface` background blocks to create a "Piano Key" list effect.
- **The Frame:** Every card is a cell in the Mondrian grid. It must be bounded by a black stroke on at least two sides (Top and Left) to maintain the "infinite grid" look.
 
### Input Fields
- **States:** Inputs are strictly rectangular. 
- **Focus:** On focus, the border shifts from `on_surface` to `primary` with no "glow."
- **Error:** Background shifts to `error_container`, with a bold `label-sm` in `on_error_container` appearing in a new grid cell below.
 
---
 
## 6. Do's and Don'ts
 
### Do
- **Embrace the Void:** Leave at least one large rectangular cell "Empty" (White background) to provide visual balance to high-color areas.
- **Vary the Weight:** Use different stroke weights (2px vs 4px vs 8px) to define the importance of grid intersections.
- **Align to the Edge:** Text should be padded significantly (24px - 32px) from the thick black borders to ensure legibility.
 
### Don't
- **No Radii:** Never use `border-radius`. Every corner must be a sharp 90-degree angle.
- **No Gradients:** Avoid any color transitions. Use solid `primary` or `primary_container` blocks to show depth.
- **No Centering:** Avoid centering items within large cells. Push content to the top-left or bottom-right of a cell to lean into the asymmetric aesthetic.
- **No Standard Icons:** Use geometric, thick-stroke icons that match the `on_surface` weight. Avoid thin, wispy icon sets.
 
---
 
## 7. Signature Layout Patterns
 
**The "Broken Header":** 
Rather than a full-width top bar, create a header composed of three different-sized blocks: 
1. A small `yellow` block for the Logo.
2. A long `white` block for Navigation.
3. A `red` block for the Call to Action. 
Each separated by a 4px black line. This immediately signals to the user that they are in a custom, curated environment.```
