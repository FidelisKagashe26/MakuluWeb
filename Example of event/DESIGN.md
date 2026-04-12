# Design System Document: The Electric Curator

## 1. Overview & Creative North Star
**Creative North Star: "The Kinetic Gallery"**
This design system moves away from the static, "listing-page" feel of traditional event platforms. Instead, it treats event discovery as a high-end editorial experience. We achieve this through **The Kinetic Gallery**—a philosophy where content feels curated, not just displayed. We break the rigid, "boxed-in" web standards by using intentional asymmetry, overlapping elements, and a sophisticated play between high-energy "Electric Indigo" and deep, layered violets.

The goal is to evoke the feeling of a prestigious gallery opening: professional, authoritative, but humming with the underlying energy of the "Primary" indigo.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
Our palette is rooted in a spectrum of purples and indigos. We avoid the clinical coldness of pure greys, opting instead for "On-Surface" tones that carry a hint of violet.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. Layout boundaries must be established exclusively through background shifts. For example, a `surface-container-low` section should sit directly against a `surface` background. This creates a "soft-edge" layout that feels high-end and organic.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers, like stacked sheets of fine, semi-translucent paper.
- **Nesting Logic:** Place a `surface-container-lowest` card on top of a `surface-container-high` section to create natural contrast.
- **The Glass & Gradient Rule:** For hero sections and primary CTAs, use a linear gradient transitioning from `primary` (#4a40e0) to `primary-container` (#9795ff). This adds "soul" and dimensionality that flat hex codes lack.
- **Glassmorphism:** For floating navigation or over-image labels, use `surface-container-lowest` at 70% opacity with a `24px` backdrop blur.

---

## 3. Typography: The Editorial Scale
We use a dual-typeface system to balance high-energy discovery with functional clarity.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision and modern flair. Use `display-lg` and `headline-lg` with tight letter-spacing (-0.02em) to create an authoritative, editorial "poster" look.
*   **Body & Labels (Inter):** The workhorse. Inter provides maximum legibility for event details, dates, and ticket prices. 

**Hierarchy as Identity:** 
- Use `display-md` for event titles to make them feel like "Headliners."
- Use `label-md` in all-caps with +0.05em tracking for metadata (e.g., "SOLD OUT" or "CATEGORY") to provide a technical, curated contrast to the fluid headlines.

---

## 4. Elevation & Depth: Tonal Layering
In this system, depth is a feeling, not a structure.

*   **The Layering Principle:** Avoid shadows for standard components. Instead, "stack" surface tiers. A `surface-container-highest` element on a `surface` background provides enough "lift" for the eye without the clutter of a drop shadow.
*   **Ambient Shadows:** Reserve shadows only for "floating" interactive elements (Modals, FABs). Use a `12%` opacity shadow tinted with `on-surface` (#32294f) and a large blur radius (32px+) to mimic natural gallery lighting.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline-variant` (#b2a6d5) at **15% opacity**. Never use a 100% opaque border.
*   **Intentional Overlap:** Encourage elements (like an event image) to "break out" of their container by -24px to -48px margins. This breaks the "template" look and creates a sense of motion.

---

## 5. Components

### Buttons
*   **Primary:** A gradient from `primary` to `primary_dim`. `borderRadius: lg (1rem)`. No border. High-contrast `on_primary` text.
*   **Secondary:** `surface_container_high` background with `primary` text. This feels integrated, not "pasted on."
*   **Tertiary:** Ghost style. No background. `primary` text with a subtle underline that appears on hover.

### Event Cards
*   **Structure:** No dividers. Use `surface_container_low` for the card base. 
*   **Typography:** The date should be in `title-lg` (Inter), while the event name uses `headline-sm` (Manrope).
*   **Interaction:** On hover, the card should transition from `surface_container_low` to `surface_container_highest` with a slight upward scale (1.02x).

### Chips (Filters/Categories)
*   **Selection Chips:** Use `secondary_container` for unselected and `primary` for selected. Use `full` roundedness (9999px) to contrast with the `lg` roundedness of cards.

### Input Fields
*   **Style:** Minimalist. Use `surface_container_lowest` with a "Ghost Border" bottom-only stroke. Labels should be `label-md` sitting 8px above the input.
*   **Error State:** Use `error` (#b41340) for text, but the input container should shift to `error_container` at 10% opacity.

### Navigation (The Floating Bar)
*   Instead of a pinned top-nav, use a floating dock style using the **Glassmorphism** rule: `surface` at 80% opacity, `20px` backdrop-blur, and a `xl` corner radius.

---

## 6. Do's and Don'ts

### Do
*   **Do** use white space as a structural element. If in doubt, add 16px more padding.
*   **Do** use asymmetrical grids (e.g., a 2-column layout where the left column is 65% and the right is 35%).
*   **Do** apply the `primary` color sparingly for "vibrancy spikes"—CTAs, active states, and price tags.

### Don't
*   **Don't** use 1px solid dividers. Use a 24px-48px vertical gap or a subtle background color shift.
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#32294f) to maintain the violet tonal harmony.
*   **Don't** use "standard" 4px or 8px corners. Use the `lg` (16px) or `xl` (24px) tokens to ensure the "Modern/Clean" aesthetic feels intentional and premium.